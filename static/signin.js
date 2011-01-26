var main_screen_turn_on = false;

function capstaff(evt) { 
  var evt = (evt) ? evt : ((event) ? event : null); 
  if (evt.keyCode) code = evt.keyCode;
  else if (evt.which) code = evt.which;  
  var em = document.getElementById("em").value;  
  if (code==45 || code==18) {
    showStaffButtons();
    return false;
  }
  if (code==9 && em.length > 0 && em.indexOf("@") == -1) {
    document.getElementById("em").value = em+"@hackerdojo.com";
    return false;
  }  
}

function stopRKey(evt) { 
  var evt = (evt) ? evt : ((event) ? event : null); 
  var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null); 
  var em = document.getElementById("em").value;
  
  if (evt.keyCode==45 || evt.keyCode==18) {
    showStaffButtons();
  }
    
  if (evt.keyCode)
    code = evt.keyCode;
  else 
    if (evt.which)
      code = evt.which;

  if (main_screen_turn_on) {
    if (code == 49) go('Anonymous');
    if (code == 50) go('Member');
    if (code == 51) go('StaffKey');
    if (code == 52) cancel();
    return false;
  }
  
  if ((code == 13) && (node.type=="text"))  {    
    entered = document.getElementById("em").value;
    /* RFID is numeric */
    if (entered > 0) {
      document.getElementById("em").value = "";
      $('#ajaxloading').fadeIn();
      $.ajax({
        url: 'http://signup.hackerdojo.com/api/rfid?id='+entered+'&callback=?',
        dataType: "json",
        timeout: 14 * 1000,
        error: function(data) {
          auto_reset();      
        },
        success: function(data) {
          $('#ajaxloading').fadeOut();
          if (data && data.username) {
            main_screen_turn_on = true;
            // window.audio = new Audio("/static/list.mp3");      
            // window.audio.play();                 
            $('#rfidwelcome').fadeIn();
            document.getElementById("em").value = data.username + "@hackerdojo.com";
            $('.rfidpic').attr("src",data.gravatar);
            $('.rfidname').html(data.name);
          } else {
            prepare_for_signin();
            audio = new Audio("/static/denied.mp3");      
            audio.play();
            $('#denied').fadeIn();
            setTimeout("$('#denied').fadeOut();",3 * 1000);
          }   
        }
      });
        
    }    
    return false;
  } 
} 

function cancel() {
  main_screen_turn_on = false;
  auto_reset();
}

function showStaffButtons() {
	document.getElementById("staffbuttons").style.display="block";
  setTimeout("$('#staffbuttons').show();",30*1000);
}

document.onkeypress = stopRKey; 
document.onkeydown = capstaff; 

String.prototype.capitalize = function(){
   return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
};
  
function clickmember() {
  var em = document.getElementById("em").value;  
  if (em.indexOf("@hackerdojo.com")==-1) {
    alert("That e-mail address does not match a valid @hackerdojo.com e-mail.");   
    return false;
  } else {
     main_screen_turn_on = true;
     $('#rfidwelcome').show();
     // window.audio = new Audio("/static/list.mp3");      
     // window.audio.play();                 
     name = em.substring(0,em.indexOf("@hackerdojo.com")).replace("."," ").capitalize();
     gravatar = "http://www.gravatar.com/avatar/" + hex_md5(em);
     $('.rfidpic').attr("src",gravatar);
     $('.rfidname').html(name);
   }  
}

/* Set the type and proceed with signin */
function go(x) {
  if (isEmail(document.getElementById("em").value)) {
    document.getElementById("ttt").value = x;
    $('#rfidwelcome').fadeOut();
    $('#ajaxloading').fadeIn();
    main_screen_turn_on = false;
    ok();
  } else {
    alert("Please enter a valid e-mail address");
  }
}

/* Hard reboot */
function auto_reset() {
  $('#tos').hide();
  $('#thanks').fadeOut();
  $('#denied').fadeOut();
  $('#privacy').hide();
  $('#rfidwelcome').fadeOut();
  $('#ajaxloading').fadeOut();
  main_screen_turn_on = false;
  prepare_for_signin();
}

/* Soft reboot */
function prepare_for_signin() {
  $("#staffbuttons").hide();
  $('#ttt').val("");
  $('#em').val("");
  $('#em').focus();
}
  
/* Do the actual signin */  
function ok() {
  $("#tos").fadeOut();
  main_screen_turn_on = false;
  $('#ajaxloading').show();
  $.ajax({
    url: '/signin',
    dataType: "json",
    data: {
      "email":document.getElementById("em").value,
      "type":document.getElementById("ttt").value
    },
    timeout: 14 * 1000,
    error: function(data) {
      auto_reset();      
    },
    success: function(data) {
      $('#ajaxloading').fadeOut();
      $("#thanksmessage").html("<b><nobr>Thanks "+data.name+"!</nobr></b><br/><br/><small>Visit #"+data.signins+"</small>");      
      if (data.tos) {
        $('#ajaxloading').hide();
        $('#tos').fadeIn();
      } else {        
        thanks();
      }
      prepare_for_signin();
    }
  });
}

/* After a user signs in */
function thanks() {
  $("#banner").hide().fadeIn(1500);
  $("#tos").hide();
  $("#thanks").fadeIn();
  window.audio = new Audio("/static/login.mp3");      
  window.audio.play();
  increment_counter();
  setTimeout('$("#thanks").fadeOut(1000);',2*1000);
}

function increment_counter() {
  var i = parseInt($("#todaycount").html());
  if (i>0) {
    $("#todaycount").html(i+1);
  }
}

function isEmail (s) {
  return String(s).search (/^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/) != -1;
}

/* Refresh the page every 15 minutes to clean things up, and update banner */
function refreshPage() {
  $.ajax({
    url: '/',
    success: function(data) {
      $('#body').html(data);
    }
  });
  auto_reset();
}

$(document).ready(function() {
  setInterval(refreshPage,15 * 60 * 1000);  
  auto_reset();
});