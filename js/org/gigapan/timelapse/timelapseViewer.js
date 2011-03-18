var timelapseDurationInSeconds = 0.0;
var timeStepInSecs = 0.04; // 25 frames per second
var timelapse = null;
var timelapseCurrentTimeInSeconds = 0.0;

function createTimelineSlider() {
  timelapseDurationInSeconds = timelapse.getNumFrames() / timelapse.getFps();
  $("#totalTime").text(org.gigapan.Util.formatTime(timelapseDurationInSeconds));

	$("#timelineSlider")['slider']({
	   animate: true,
		 value: 0,
		 min: 0,
		 max: timelapseDurationInSeconds,
		 range: "min",
		 step: timeStepInSecs,
		 slide: function(e, ui){
		    timelapseCurrentTimeInSeconds = ui.value;
				var timeInSecs = ui.value;
				timelapse.seek(timeInSecs);
	   }
	});
}

function createZoomSlider() {
	$("#slider-vertical").slider({
		 orientation: "vertical",
		 min: 0,
		 max: 1,
		 step: .01,
		 slide: function(e, ui){
		    timelapse.setScaleFromSlider(ui.value);
	   }
	});
}

function createPlaybackSpeedSlider() {
	$('#speed').selectToUISlider({
		 labels: 12
	}).hide();
}

function setupTimelineSliderHandlers() {
   $('.ui-slider-handle').bind("mouseover", function() {
      this.style.cursor = 'url("css/cursors/openhand.png"),move';
      $('.ui-slider-handle').bind("mouseup", function() {
         this.style.cursor = 'url("css/cursors/openhand.png"),move';
      });
   });

   $('.ui-slider').bind("slide", function() {
      $('.ui-slider-handle').bind("mousemove", function() {
         this.style.cursor = 'url("css/cursors/closedhand.png"),move';
      });
   });

   $('.ui-slider').bind("slidestop", function() {
      $('.ui-slider-handle').bind("mousemove", function() {
         this.style.cursor = 'url("css/cursors/openhand.png"),move';
      });
   });

   $('.ui-slider').bind("mouseover", function() {
      this.style.cursor = 'pointer';
   });
}

function setupZoomSliderHandlers() {
   $("#slider-vertical")['slider']("option", "value", timelapse.viewScaleToZoomSlider(timelapse.getDefaultScale()));
}

function setupUIHandlers() {
   var intervalId;

   $('#play_toggle').bind("click", function() {
      if ($(this).attr("class") == "play_mouseover") {
         $(this).attr("class", "pause_mouseout");
         $(this).attr("title", "Pause");
         if (timelapseCurrentTimeInSeconds >= timelapseDurationInSeconds) {
            $("#timelineSlider")['slider']("option", "value", 0);
            timelapse.seek(0);
         }
         timelapse.play();
      } else {
         $(this).attr("class", "play_mouseout");
         $(this).attr("title", "Play");
         timelapse.pause();
      }
   }).mousemove(function() {
      if ($(this).attr("class") == "play_mouseout") $(this).attr("class", "play_mouseover");
      else if ($(this).attr("class") == "pause_mouseout") $(this).attr("class", "pause_mouseover");
   }).mouseout(function() {
      if ($(this).attr("class") == "play_mouseover") $(this).attr("class", "play_mouseout");
      else if ($(this).attr("class") == "pause_mouseover") $(this).attr("class", "pause_mouseout");
   });

   $("#home").mousemove(function() {
      $(this).attr("title", "Home");
      this.style.cursor = 'pointer';
   }).click(function() {
      timelapse.warpTo(timelapse.homeView());
   });

   $("#left").mousedown(function() {
      intervalId = setInterval(function() { movePos("left"); },500);
   }).click(function() {
      movePos("left");
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);      
   }).mousemove(function() {
      $(this).attr("title", "Move Left");
      this.style.cursor = 'pointer';
   });

   $("#right").mousedown(function() {
      intervalId = setInterval(function() { movePos("right"); },500);
   }).click(function() {
      movePos("right");
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);      
   }).mousemove(function() {
      $(this).attr("title", "Move Right");
      this.style.cursor = 'pointer';
   });

   $("#up").mousedown(function() {
      intervalId = setInterval(function() { movePos("up"); },500);
   }).click(function() {
      movePos("up");
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);      
   }).mousemove(function() {
      $(this).attr("title", "Move Up");
      this.style.cursor = 'pointer';
   });

   $("#down").mousedown(function() {
      intervalId = setInterval(function() { movePos("down"); },500);
   }).click(function() {
      movePos("down");
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);      
   }).mousemove(function() {
      $(this).attr("title", "Move Down");
      this.style.cursor = 'pointer';
   });

   $("#zoom_in").mousedown(function() {
      intervalId = setInterval(zoomIn, 500);
   }).click(function() {
      zoomIn();
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);
   }).mousemove(function() {
      $(this).attr("title", "Zoom In");
      this.style.cursor = 'pointer';
   });

   $("#zoom_out").mousedown(function() {
      intervalId = setInterval(zoomOut, 500);
   }).click(function() {
      zoomOut();
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);
   }).mousemove(function() {
      $(this).attr("title", "Zoom Out");
      this.style.cursor = 'pointer';
   });
	
   $('#timelapse').bind("mouseover", function() {
      this.style.cursor = 'url("css/cursors/openhand.png"),move';
   });
}

function zoomIn() {
   var val = $("#slider-vertical")['slider']("option", "value") + .01;
   $("#slider-vertical")['slider']("option", "value", val);
   timelapse.setScaleFromSlider(val);
}

function zoomOut() {
   var val = $("#slider-vertical")['slider']("option", "value") - .01;
   $("#slider-vertical")['slider']("option", "value", val);
   timelapse.setScaleFromSlider(val);
}

function movePos(dir) {
   timelapse.movePos(dir);
}

function setupSnaplapseHandlers() {
   $("#snaplapse_keyframe_list")['selectable']({
      selected: handleSnaplapseFrameSelectionChange,
      unselected: handleSnaplapseFrameSelectionChange,
      cancel: ':input,option,span,textarea'
   });
}

function setupKeyboardHandlers() {
   $(this)['keydown'](timelapse.handleKeydownEvent);
   $(this)['keyup'](timelapse.handleKeyupEvent);
}

function setupMouseHandlers() {
   $("#timelapse").mousewheel(timelapse.handleMousescrollEvent);
}

function changeViewerSize(newWidth) {
   var newHeight = newWidth * 0.5625;  // 0.5625 is the aspect ratio of the default 800x450 viewer
   var bounds = timelapse.getBoundingBoxForCurrentView();
   $("#timelapse_container").width(newWidth);
   $("#timelapse_container").height(newHeight);
   $("#timelapse").width(newWidth);
   $("#timelapse").height(newHeight);
   $("#time_slider_container").width(newWidth);
   $("#misc_controls_container").width(newWidth);
   $("#misc_controls_container_table").width(newWidth);
   $("#timelineSlider").width(newWidth - 173);
   if ($('#spinnerOverlay').length != 0) {
      $('#spinnerOverlay').css("top", newHeight / 2 - $("#spinner").height() / 2 + "px");
      $('#spinnerOverlay').css("left", newWidth / 2 - $("#spinner").width() / 2 + "px");
   }
   timelapse.updateDimensions();
   timelapse.warpToBoundingBox(bounds);
}

function loadTimelapse(gigapanJSON) {
	// Build the gigapan URL.  We use the CGI for Chrome, but plain ol' MP4s for Safari.
	var isChrome = org.gigapan.Util.isChrome();
	isChrome = false;
	var dropConnectionParam = willAddConnectionDropParam ? "drop=1&" : "";
	var gigapanUrl = "http://timelapse.gigapan.org/alpha/" + (isChrome ? "cgi-bin/video_streamer.cgi?"+dropConnectionParam+"id="+gigapanId+"&t=" : "timelapses/" + gigapanId + '/');

	// Create the timelapse
	timelapse = new org.gigapan.timelapse.Timelapse(gigapanUrl, 'timelapse', gigapanJSON, 'videoset_stats_container');

   changeViewerSize(.75 * gigapanJSON['video_width']);   // viewport should be no larger than 3/4 video size

	timelapse.addTimeChangeListener(function(t) {
		 timelapseCurrentTimeInSeconds = t;
		 if (timelapseCurrentTimeInSeconds < 0) {
				timelapseCurrentTimeInSeconds = 0;
				$('#play_toggle').attr("class", "play_mouseout");
				$('#play_toggle').attr("title", "Play");
		 }
		 $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds));
		 $("#timelineSlider")['slider']("option", "value", timelapseCurrentTimeInSeconds);
		 if (timelapseCurrentTimeInSeconds >= timelapseDurationInSeconds) {
				$('#play_toggle').attr("class", "play_mouseout");
				$('#play_toggle').attr("title", "Play");
		 }
	});

	setupKeyboardHandlers();
	setupMouseHandlers();
	createTimelineSlider();
	createZoomSlider();
	createPlaybackSpeedSlider();
	setupTimelineSliderHandlers();
	setupZoomSliderHandlers();
	setupUIHandlers();
	setupSnaplapseHandlers();
}

$(document).ready(function() {
   var browserSupported = org.gigapan.Util.browserSupported();
   if (!browserSupported) {
      window.location = "browsernotsupported.html";
   }

   // Test whether this is being served from timelapse.gigapan.org.  If so, then fetch the JSON from there too.
   // If not, then assume it's being served from localhost and fetch the JSON from the local machine (since we're
   // not using JSONP on timelapse.gigapan.org (but we probably should!)).
   var urlMatchPattern = /^http:\/\/timelapse.gigapan.org\//;
   var isRemoteUrl = window.location.href.match(urlMatchPattern) != null;
   var jsonUrl = (isRemoteUrl ? "../alpha/timelapses/" : "../timelapses/") + gigapanId + '/r.json';

   org.gigapan.Util.log("Attempting to fetch JSON from URL ["+jsonUrl+"]...");
   $.ajax({
      dataType:'json',
      url: jsonUrl,
      success: function(gigapanJSON) {
         if (gigapanJSON && gigapanJSON['tile_height']) {
            org.gigapan.Util.log("Loaded this JSON: ["+JSON.stringify(gigapanJSON)+"]");
            loadTimelapse(gigapanJSON);
         } else {
            org.gigapan.Util.error("Failed to load json from URL [" + jsonUrl + "]");
         }
      },
      error: function() {
         org.gigapan.Util.error("Error loading json from URL [" + jsonUrl + "]");
      }
   });
});

