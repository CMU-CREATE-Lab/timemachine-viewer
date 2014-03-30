// @license
// Redistribution and use in source and binary forms ...

var view = "youtube"
var timelapse;
var doHelpPrompt = true;
var tmSeekToTime = 0;
var timeWarp;
var earthTimeUrl;

function onytplayerStateChange(newState) {
  if (newState == 0 && (Math.ceil(ytplayer.getCurrentTime()) >= ytplayer.getDuration()) && org.gigapan.Util.browserSupported())
    doTimeMachine(true, false);
}

function ytPlay() {
  if (ytplayer) {
    ytplayer.playVideo();
  }
}

function ytPause() {
  if (ytplayer) {
    ytplayer.pauseVideo();
  }
}

function ytStop() {
  if (ytplayer) {
    ytplayer.stopVideo();
  }
}

function loadNewVideo(newTimeWarpName) {
  if (ytplayer) {
    //ytplayer.loadVideoById(id, startSeconds);
    ytplayer.stopVideo();
    timeWarp = cached_ajax[earthTimeUrl + newTimeWarpName];
    ytplayer.cueVideoById(timeWarp["youtube_url"], 0);
    autoPlay = false;
    doYouTube(autoPlay);
  }
}

function onYouTubePlayerReady(playerId) {
  ytplayer = document.getElementById("myytplayer");

  $('.flashToggleMap').hover(function() {
    $(this).stop().animate({
      'background-color': '#c4c4c4'
    }, 300);
  }, function() {
    $(this).stop().animate({
      'background-color': '#6b6b6b'
    }, 100);
  });

  ytplayer.addEventListener("onStateChange", "onytplayerStateChange");

  $('.overlay').show();
  $(".flashToggleMap").delay(500).animate({
    'background-color': '#ffffff'
  }, 2000);
  $(".flashToggleMap").animate({
    'background-color': '#6b6b6b'
  }, 2000);
}

function init() {
  //YouTube init
  var params = {
    allowScriptAccess: "always",
    allowFullScreen: "true",
    wmode: "opaque"
  };
  var atts = {
    id: "myytplayer"
  };
  //##### This is where you will use the data pulled from your own json blob you use for the gallery
  // earthTimeUrl and timeWarp are global so that other functions can make use of them
  earthTimeUrl = "http://mw1.google.com/et/annual30m.timemachine/"
  var timelapsetour = earthTimeUrl + "amazon.json";
  //##### End
  timeWarp = cached_ajax[timelapsetour];

  swfobject.embedSWF("http://www.youtube.com/v/" + timeWarp["youtube_url"] + "?enablejsapi=1&playerapiid=ytplayer&modestbranding=1&showinfo=0&version=3&rel=0", "ytapiplayer", "818", "495", "8", null, null, params, atts);

  //EarthTime init
  var myView = null;
  var myTime = 0;
  var hashVars = org.gigapan.Util.getHashVars();

  if (hashVars) {
    if (hashVars.v)
      var viewParam = hashVars.v.split(",");
    if (hashVars.t)
      var timeParam = hashVars.t.split(",");

    if (viewParam || timeParam) {
      if (viewParam)
        myView = formatView(viewParam);
      if (timeParam)
        myTime = timeParam[0];
    }
  }

  var viewerOptions = {
    url: earthTimeUrl, //can be absolute or relative
    initialTime: myTime, //default to 0; video time
    playerSize: "Large", //[Small, Large] defaults to Large size
    initialView: myView,
    loopPlayback: true, //defaults to false
    playOnLoad: false, //defaults to false
    playbackSpeed: 1, //[-1,-.5,-.25,.25,.5,1] available, defaults to 1
    showShareBtn: true, //defaults to true
    layer: 0 //default to first layer. All sets have at least 1 layer starting at index 0
  };

  timelapse = new org.gigapan.timelapse.Timelapse("earthTimePlayer", viewerOptions);

  window.onhashchange = org.gigapan.Util.onHashChange

  // Hide Time Machine controls not needed for EarthTime
  $("#earthTimePlayer .size").hide();
  $("#earthTimePlayer .videoTime").hide();

  $('<li><a href="javascript:void(0);" title="Return to tour" class="tourToggle"><span class="returnToTourText">Return to Tour</span></a></li>').insertAfter($('#earthTimePlayer .playbackspeed').parent());
  $('<div class="helpmsg"><p>Get quick tips on how to explore this map.</p></div>').insertAfter($('#earthTimePlayer .controls'));

  $("#youtubePlayer").append('<div id="switchView" class="overlay" style="display: none"><a href="javascript:void(0);" class="flashToggleMap" ></a></div>');

  // Change the toggle button depending upon the browser the page is being viewed with
  if (org.gigapan.Util.browserSupported()) {
    $(".flashToggleMap").html("Explore Map");
    $("#switchView").bind("click", function() {
      switchViews();
    });
    $("#switchView").attr({
      "title": "Click to explore the map"
    });
  } else {
    $(".flashToggleMap").html("Time-explorable Earth available only on Chrome and Safari");
    $("#switchView").width(280);
    $("#switchView").bind("click", function() {
      window.open('http://www.google.com/chrome/', 'external');
      return false;
    });
    $("#switchView").attr({
      "title": "Click to download Chrome"
    });
  }

  $("#earthTimePlayer .tourToggle").bind("click", function() {
    switchViews();
  });

  $("#earthTimePlayer .helpmsg").bind("click", function() {
    $('#earthTimePlayer .helpmsg').hide();
  });

}

function computeBoundsToWarpTo(currentTime) {
  var keyframe_time = 0;
  var keyframes = timeWarp.snaplapse.keyframes;
  var i;

  for ( i = 0; i < keyframes.length - 1; i++) {
    var keyframe = keyframes[i];
    if (keyframe_time + keyframe.duration >= currentTime)
      break;
    keyframe_time += keyframe.duration;
  }

  var bounds = keyframes[i].bounds;
  tmSeekToTime = keyframes[i].time;

  return bounds;
}

function doYouTube(doAutoPlay) {
  view = "youtube";
  if (org.gigapan.Util.browserSupported())
    timelapse.pause();
  $("#earthTimePlayer").hide();
  $("#youtubePlayer").width("818px");
  $("#youtubePlayer").height("495px");
  $("#youtubePlayer").css("top", "");
  $(".overlay").show();
  if (doAutoPlay) {
    ytPlay();
  }
}

function doTimeMachine(warpAndSeek, autoPlay) {
  if (timelapse == null)
    setTimeout(doTimeMachine, 100);

  view = "earthtime";
  ytPause();
  var currentTime = ytplayer.getCurrentTime();

  if (org.gigapan.Util.browserSupported()) {
    if (warpAndSeek) {
      timelapse.warpToBoundingBox(computeBoundsToWarpTo(currentTime));
      timelapse.seek(tmSeekToTime);
    } else {
      timelapse.pause();
      timelapse.setTargetView(timelapse.homeView());
      timelapse.seek(0);
    }
    if (autoPlay)
      timelapse.play();
  }
  $("#youtubePlayer").width(0);
  $("#youtubePlayer").height(0);
  $("#youtubePlayer").css("top", "-2000px");
  $("#earthTimePlayer").show();
  $(".overlay").hide();

  if (doHelpPrompt) {
    $('#earthTimePlayer .helpmsg').fadeIn(1000, function() {
      $('#earthTimePlayer .helpmsg').delay(3000).fadeOut(1000);
    });
    doHelpPrompt = false;
  }
}

function switchViews() {
  if ($("#earthTimePlayer .help").hasClass("on"))
    return;
  if (view == "youtube") {
    doTimeMachine(true, true);
  } else {
    doYouTube(true);
  }
}

function onTimeMachinePlayerReady(viewerDivId) {
}

// Share url specific functions

function formatView(viewParam) {
  var view = null;
  if (viewParam.length == 3)
    view = {
      center: {
        "lat": viewParam[0],
        "lng": viewParam[1]
      },
      "zoom": viewParam[2]
    };
  else if (viewParam.length == 4)
    view = {
      bbox: {
        "ne": {
          "lat": viewParam[0],
          "lng": viewParam[1]
        },
        "sw": {
          "lat": viewParam[2],
          "lng": viewParam[3]
        }
      }
    };
  return view;
}

// changes current view
function setView(view) {
  if (view)
    timelapse.setNewView(formatView(view.split(",")));
}

// changes current view and time
function setViewAndTime(view, time) {
  if (view)
    timelapse.setNewView(formatView(view.split(",")));
  if (time)
    timelapse.seek(time);
}

// changes the current time
function setTime(time) {
  if (time)
    timelapse.seek(time);
}

// End share url specific functions

// Load everything
$(init);