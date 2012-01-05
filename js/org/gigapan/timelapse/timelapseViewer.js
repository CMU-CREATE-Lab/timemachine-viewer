var timelapseMetadata;
var timelapseMetadataJSON;
var gigapanId;
var datasetIndex;
var gigapanDatasetsJSON;
var browserSupported;
var playerLayer = 0;
var playerSize = 1;
var captureTimes = new Array();
var hasLayers = false;
var timelapseDurationInSeconds = 0.0;
var timeStepInSecs = 0.0;
var timelapseCurrentTimeInSeconds = 0.0;
var timelapse = null;
var timelapseCurrentCaptureTimeIndex = 0;
var repeatVideo = false;
org.gigapan.timelapse.VideosetStats.isEnabled = false;

function createTimelineSlider() {
  if (gigapanDatasetsJSON["capture-times"]) {
    captureTimes = gigapanDatasetsJSON["capture-times"];
  } else {
    for (i = 0; i < timelapse.getNumFrames(); i++) {
      captureTimes.push("--")
    }
  }

  timelapseDurationInSeconds = (timelapse.getNumFrames() -1 ) / timelapse.getFps();
  timeStepInSecs = 1 / timelapse.getFps();
  $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds,true));
  $("#totalTime").text(org.gigapan.Util.formatTime(timelapseDurationInSeconds,true));
  $("#currentCaptureTime").text(captureTimes[timelapseCurrentCaptureTimeIndex]);

  $("#timelineSlider")["slider"]({
    animate: true,
    value: 0,
    min: 0.0,
    max: timelapseDurationInSeconds,
    range: "min",
    step: timeStepInSecs,
    slide: function(e, ui) {
      timelapse.seek(ui.value);
    }
  });
  
  $("#timelineSlider .ui-slider-handle").attr("title", "Drag to go to a different point in time");
}

function createZoomSlider() {
  $("#zoomSlider").slider({
    orientation: "vertical",
    value: timelapse.viewScaleToZoomSlider(timelapse.getDefaultScale()),
    min: 0,
    max: 1,
    step: .01,
    slide: function(e, ui) {
      timelapse.setScaleFromSlider(ui.value);
    }
  });

  $("#zoomSlider .ui-slider-handle").attr("title", "Drag to zoom");
}

function createPlaybackSpeedSlider() {
  $("#speed").selectToUISlider({
    labels: 4
  }).hide();
}

function setupSliderHandlers() {
  $(".ui-slider-handle").bind("mouseover mouseup", function() {
    this.style.cursor = 'url("../timelapse-20120105/css/cursors/openhand.cur") 10 10, move';
  });

  $(".ui-slider").bind({
    slide: function() {
      this.style.cursor = 'url("../timelapse-20120105/css/cursors/closedhand.cur") 10 10, move';
      $(".ui-slider-handle").bind("mousemove", function() {
        this.style.cursor = 'url("../timelapse-20120105/css/cursors/closedhand.cur") 10 10, move';
      });
    },
    slidestop: function() {
      $(".ui-slider-handle").bind("mousemove", function() {
        this.style.cursor = 'url("../timelapse-20120105/css/cursors/openhand.cur") 10 10, move';
      });
    },
    mouseover: function() {
      this.style.cursor = "pointer";  
    }
  });
}

function isCurrentTimeAtOrPastDuration() {
  // fix the numbers, but subtract 0 from each to convert back to float since toFixed gives a string
  var num1Fixed = timelapseCurrentTimeInSeconds.toFixed(3) - 0;
  var num2Fixed = timelapseDurationInSeconds.toFixed(3) - 0;
  return num1Fixed >= num2Fixed;
}

function setupUIHandlers() {
  var intervalId;

  if (hasLayers) {
    load_layers();

    $(".layerSlider .jCarouselLite").jCarouselLite({
      btnNext: ".layerSlider .next",
      btnPrev: ".layerSlider .prev",
      circular: true,
      visible: 3.5
    });
  }

  $("a#size").click(function() {
    $("li#sizeoptions").fadeIn(100);
  });

  $("li#sizeoptions a").click(function() {
    $("li#sizeoptions").hide();
    $("li#sizeoptions a").removeClass("current");
    $(this).addClass("current");
  });

  $(document).click(function(event) {
    if ($(event.target).closest("a#size").get(0) == null) {
      $("li#sizeoptions").hide();
    }
  });

  $("#help").toggle(
    function () {
      if ($("#zoomSlider")["slider"]("option", "disabled")) return;
      $("li#sizeoptions").hide(); //might be already opened
      $("#instructions").fadeIn(100);
      $("#repeat").addClass("disabled");
      $(this).addClass("on");
      if ($("#mainbutton").attr("class") == "pause") {
        timelapse.pause();
        $("#mainbutton").attr("class", "pause_disabled");
      } else {
        $("#mainbutton").attr("class", "play_disabled");
      }
      $("#timelineSlider")["slider"]("option", "disabled", true);
    },
    function (){
      if ($("#zoomSlider")["slider"]("option", "disabled")) return;
      $("#instructions").fadeOut(50);
      $("#repeat").removeClass("disabled");
      $(this).removeClass("on");
      if ($("#mainbutton").attr("class") == "pause_disabled") {
        timelapse.play();
        $("#mainbutton").attr("class", "pause");
      } else {
        $("#mainbutton").attr("class", "play");
      }
      $("#timelineSlider")["slider"]("option", "disabled", false);
    }
  );

  $("#mainbutton.play, #mainbutton.pause").bind("click", function() {
    if (!$("#zoomSlider")["slider"]("option", "disabled")) {
      if ($(this).attr("class") == "play") {
        $(this).attr({"class": "pause", "title": "Pause"});
        if (isCurrentTimeAtOrPastDuration()) {
          $("#timelineSlider")["slider"]("option", "value", 0);
          timelapse.seek(0);
        }
        timelapse.play();
      } else if ($(this).attr("class") == "pause") {
        $(this).attr({"class": "play", "title": "Play"});
        timelapse.pause();
      }
    }
    return false;
  });

  $("#repeat").bind("click", function() {
    if ($(this).hasClass("disabled") || $("#zoomSlider")["slider"]("option", "disabled") == true) return;
    repeatVideo = !repeatVideo
    if (repeatVideo) $(this).attr("class", "repeat active");
    else $(this).attr("class", "inactive");
  });

  $("#home").click(function() {
    if ($("#zoomSlider")["slider"]("option", "disabled") == true) return;
    timelapse.warpTo(timelapse.homeView());
    $("#zoomSlider")['slider']("option", "value", timelapse.viewScaleToZoomSlider(timelapse.getDefaultScale()));
  });

  $("#zoom_in").mousedown(function() {
    if ($("#zoomSlider")["slider"]("option", "disabled") == true) return;
    intervalId = setInterval(zoomIn, 50);
  }).click(function() {
    if ($("#zoomSlider")["slider"]("option", "disabled") == true) return;
    zoomIn();
  }).mouseup(function() {
    clearInterval(intervalId);
  }).mouseout(function() {
    clearInterval(intervalId);
  });

  $("#zoom_out").mousedown(function() {
    if ($("#zoomSlider")["slider"]("option", "disabled") == true) return;
    intervalId = setInterval(zoomOut, 50);
  }).click(function() {
    if ($("#zoomSlider")["slider"]("option", "disabled") == true) return;
    zoomOut();
  }).mouseup(function() {
    clearInterval(intervalId);
  }).mouseout(function() {
    clearInterval(intervalId);
  });

  $("#handle_speed").bind("mouseup mouseleave", function() {
    $(this).removeClass("ui-state-focus ui-state-hover");
  });
}

function zoomIn() {
  var val = Math.min($("#zoomSlider")["slider"]("option", "value") + .01, 1);
  $("#zoomSlider")["slider"]("option", "value", val);
  timelapse.setScaleFromSlider(val);
}

function zoomOut() {
  var val = Math.max($("#zoomSlider")["slider"]("option", "value") - .01, 0);
  $("#zoomSlider")["slider"]("option", "value", val);
  timelapse.setScaleFromSlider(val);
}

function setupKeyboardHandlers() {
  $(this)["keydown"](timelapse.handleKeydownEvent);
  $(this)["keyup"](timelapse.handleKeyupEvent);

  if (!document.activeElement) {
    document.addEventListener("focus", dom_trackActiveElement, true);
    document.addEventListener("blur", dom_trackActiveElementLost, true);
  }
}
 
function dom_trackActiveElement(evt) {
  if (evt && evt.target) {
    document.activeElement = evt.target == document ? null : evt.target;
  }
}
 
function dom_trackActiveElementLost(evt) {
  document.activeElement = null;
}

function setupMouseHandlers() {
  $("#timelapse").mousewheel(timelapse.handleMousescrollEvent);
}

function handlePluginVideoTagOverride() {
  if (browserSupported && $("#1").is("EMBED")) {
    $("#player").hide();
    $("#time_warp_composer").hide();
    $("#html5_overridden_message").show();
  }
}

function switchLayer(index) {
  playerLayer = index;
  var newIndex = playerLayer * gigapanDatasetsJSON["sizes"].length + playerSize;
  validateAndSetDatasetIndex(newIndex);
  loadGigapanJSON();
}

function switchSize(index) {
  playerSize = index;
  var newIndex = playerLayer * gigapanDatasetsJSON["sizes"].length + playerSize;
  validateAndSetDatasetIndex(newIndex);
  loadGigapanJSON();  
  $("#playerSizeText").text(gigapanDatasetsJSON["datasets"][index]["name"]);
}

function setViewportSize(newWidth, newHeight) {
  var bounds = timelapse.getBoundingBoxForCurrentView();

  $("#timelapse").css({"width": newWidth+"px", "height": newHeight+"px"});
  $("#controls").width(newWidth);
  $("#timelineSlider").width(newWidth-8); //subtract 8px (width of the slider handle)
  $("#spinnerOverlay").css({"top": newHeight/2-$("#spinner").height()/2+"px", "left": newWidth/2-$("#spinner").width()/2+"px"});
  $("#snaplapse-annotation-description").css({"left": newWidth+44+"px"}); //not sure why 44px extra is needed...
  $("#instructions").css({"height": newHeight+2+$("#filler").height()+"px"}); //not sure why there is a 2px offset...
  $(".layerSlider").css({"top": newHeight+2+$("#filler").height()+$("#controls").height()+"px", "right": "28px"}); //not sure why there is a 2px offset...

  //wiki specific css
  if (newWidth == 816) { //large video
    $("#content").css({"padding": "0px 0px 0px 305px"}); 
    $("#firstHeading").css({"top": "628px"} );
  } else {
    $("#content").css({"padding": "0px 0px 0px 0px"});
    $("#firstHeading").css({"top": "450px"});
  }
  //end wiki specific css

  timelapse.updateDimensions();
  timelapse.warpToBoundingBox(bounds);
}

function loadTimelapse(gigapanUrl, gigapanJSON) {
  $("#timelapse").empty();

  // Create the timelapse
  if (timelapse == null) {
    timelapse = new org.gigapan.timelapse.Timelapse(gigapanUrl, "timelapse", gigapanJSON, "videoset_stats_container");

    timelapse.addTimeChangeListener(function(t) {
      timelapseCurrentTimeInSeconds = t;
      timelapseCurrentCaptureTimeIndex = Math.floor(t * timelapse.getFps());

      if (timelapseCurrentTimeInSeconds.toFixed(3) < 0) {
        timelapseCurrentTimeInSeconds = 0;
        timelapse.pause();
        $("#mainbutton").attr({"class": "play", "title": "Play"});
      }

      if (isCurrentTimeAtOrPastDuration()) {
        timelapseCurrentTimeInSeconds = timelapseDurationInSeconds;
        if (snaplapse != null && snaplapse.isPlaying()) return;
        if (repeatVideo) {
          timelapse.seek(0);
        } else {
          timelapse.pause();
          $("#mainbutton").attr({"class": "play", "title": "Play"});
        }
      }
      $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds,true));
      $("#currentCaptureTime").text(captureTimes[timelapseCurrentCaptureTimeIndex]);
      $("#timelineSlider")["slider"]("option", "value", timelapseCurrentTimeInSeconds);
    });

    timelapse.addTargetViewChangeListener(function(view) {
      $("#zoomSlider")["slider"]("option", "value", timelapse.viewScaleToZoomSlider(view.scale));
    });

    timelapse.getVideoset().addEventListener("videoset-pause", function() {
      // the videoset might cause playback to pause, such as when it decides
      // it's hit the end (even though the current time might not be >= duration),
      // so we need to make sure the play button is updated
      $("#mainbutton").attr({"class": "play", "title": "Play"});
    });

    setupKeyboardHandlers();
    setupMouseHandlers();
    createTimelineSlider();
    createZoomSlider();
    createPlaybackSpeedSlider();
    setupSliderHandlers();
    setupUIHandlers();
    initializeSnaplapseUI();
    handlePluginVideoTagOverride();
  } else {
    org.gigapan.Util.log("Timelapse already loaded, so update it with new JSON.  gigapanUrl = ["+gigapanUrl+"] and JSON = ["+JSON.stringify(gigapanJSON)+"]");
    timelapse.changeDataset(gigapanUrl, gigapanJSON);
  }
  setViewportSize(gigapanJSON["video_width"] - gigapanJSON["tile_width"], gigapanJSON["video_height"] - gigapanJSON["tile_height"]);
}

function validateAndSetDatasetIndex(newDatasetIndex) {
  // make sure the datasetIndex is a valid number, and within the range of datasets for this gigapan.
  if (!org.gigapan.Util.isNumber(newDatasetIndex)) {
    datasetIndex = 0;
  } else {
    datasetIndex = Math.max(0, Math.min(newDatasetIndex, gigapanDatasetsJSON["datasets"].length - 1));
  }
}

function getTileHostUrlPrefix() {
  // get the tile host URL prefixes from the JSON, or use a default if undefined
  var prefixes = ["http://g7.gigapan.org/alpha/timelapses/"];
  if (typeof gigapanDatasetsJSON["tile-host-url-prefixes"] != "undefined" && $.isArray(gigapanDatasetsJSON["tile-host-url-prefixes"]) && gigapanDatasetsJSON["tile-host-url-prefixes"].length > 0) {
    prefixes = gigapanDatasetsJSON["tile-host-url-prefixes"];
  }
  // now pick one at random
  return prefixes[Math.floor(Math.random() * prefixes.length)];
}

function load_layers() {
  var numLayers = gigapanDatasetsJSON["layers"].length
  var html = "";
  for (i = 0; i < numLayers; i++) {
    html += "<li><img src=\""+gigapanDatasetsJSON["layers"][i]["tn-path"] +"\" "+"alt='layer' onclick='switchLayer("+i+"); return false;' width='45' height='45' ><br/><span style='font-size:small; text-align:center; display:block; margin: -5px 0px 0px 0px !important;'>"+gigapanDatasetsJSON['layers'][i]['description']+"</span></li>"
  }
  $("#layerChoices").append(html);
}

function loadGigapanJSON() {
  // fetch the datasetId and then construct the URL used to get the JSON for the desired dataset
  var datasetId = gigapanDatasetsJSON["datasets"][datasetIndex]["id"];
  var tileHostUrlPrefix = getTileHostUrlPrefix() + datasetId + "/";
  var gigapanJSONHostUrlPrefix = (typeof gigapanDatasetsJSON["dataset-json-host-url-prefix"] != "undefined") ? gigapanDatasetsJSON["dataset-json-host-url-prefix"] + datasetId + "/" : tileHostUrlPrefix;
  var jsonUrl = gigapanJSONHostUrlPrefix + "r.json";

  org.gigapan.Util.log("Attempting to fetch gigapan JSON from URL [" + jsonUrl + "]...");
  $.ajax({
    dataType: "json",
    url: jsonUrl,
    success: function(gigapanJSON) {
      if (gigapanJSON && gigapanJSON["tile_height"]) {
        org.gigapan.Util.log("Loaded this JSON: [" + JSON.stringify(gigapanJSON) + "]");
        loadTimelapse(tileHostUrlPrefix, gigapanJSON);
      } else {
        org.gigapan.Util.error("Failed to load gigapan json from URL [" + jsonUrl + "]");
      }
    },
    error: function() {
      org.gigapan.Util.error("Error loading gigapan json from URL [" + jsonUrl + "]");
    }
  });
}

$(document).ready(function() {
  browserSupported = org.gigapan.Util.browserSupported();

  if (!browserSupported) {
    $("#player").hide();
    $("#time_warp_composer").hide();
    $("#browser_not_supported").show();
    $("#firstHeading").css( {"top": "450px"} );
    $("#flash_video_player").show(); //load  jwplayer
    $("#flash_video_player").css({"visibility": "hidden"}); //hide the player until a warp is clicked. jwplayer won't need to reload again by doing this
    setupSnaplapseLinks();
    initFlashViewer();
    return;
  }

  timelapseMetadata = $("#timelapse_metadata").text();
  org.gigapan.Util.log("timelapseMetadata=["+timelapseMetadata+"]");
  timelapseMetadataJSON = JSON.parse($("#timelapse_metadata").text());
  gigapanId = timelapseMetadataJSON["id"] || "brassica-15m-halfsize-g10-bf0-l15";
  var host = timelapseMetadataJSON["host"] || "000";
  hasLayers = timelapseMetadataJSON["has_layers"] || false;
  if (hasLayers) $(".layerSlider").show();
  repeatVideo = timelapseMetadataJSON["repeat"]
  if (repeatVideo) $("#repeat").attr("class", "repeat active");
  org.gigapan.Util.log("id=["+gigapanId+"]");
  gigapanDatasetsJSON = null;

  var hostPrefix = "../timemachines/" + host + "/" + gigapanId + "/";
  var jsonUrl = hostPrefix + gigapanId + ".json"; 

  org.gigapan.Util.log("Attempting to fetch gigapan datasets JSON from URL [" + jsonUrl + "]...");
  $.ajax({
    dataType: "json",
    url: jsonUrl,
    success: function(json) {
      gigapanDatasetsJSON = json;
      if (gigapanDatasetsJSON && gigapanDatasetsJSON["base-id"] == gigapanId && gigapanDatasetsJSON["datasets"] && gigapanDatasetsJSON["datasets"].length > 0 && gigapanDatasetsJSON["sizes"] && gigapanDatasetsJSON["sizes"].length > 0) {
        gigapanDatasetsJSON["dataset-json-host-url-prefix"]=hostPrefix;
        gigapanDatasetsJSON["tile-host-url-prefixes"]=["http://tm"+host+".gigapan.org/timemachines/"+gigapanId+"/"];

        org.gigapan.Util.log("Loaded this JSON: [" + JSON.stringify(gigapanDatasetsJSON) + "]");

        // set document title
        document.title = "GigaPan Time Machine: " + gigapanDatasetsJSON["name"];

        // populate the player size dropdown
        var html = "";
        var numSizes = gigapanDatasetsJSON["sizes"].length;
        for (var i = 0; i < numSizes; i++) {
          html += '<li><a id='+gigapanDatasetsJSON["sizes"][i]+' href="#" onclick="switchSize('+i+'); return false;"> '+gigapanDatasetsJSON["sizes"][i]+' </a></li>';
        }
        $("#sizechoices").append(html);
				
        // set the current view to the largest size
        var largestSize = $("#sizechoices li a").last();
        largestSize.addClass("current");
        $("#playerSizeText").text(largestSize.text());
        datasetIndex = timelapseMetadataJSON["dataset"] || gigapanDatasetsJSON["sizes"].length; //default to largest size (ie last in the list) if none is specified.
        org.gigapan.Util.log("datasetIndex=["+datasetIndex+"]");
        
        // make sure the datasetIndex is a valid number, and within the range of datasets for this gigapan.
        validateAndSetDatasetIndex(datasetIndex);

        // finally, load the gigapan
        loadGigapanJSON();
      } else {
        org.gigapan.Util.error("Failed to load gigapan datasets json from URL [" + jsonUrl + "]");
      }
    },
    error: function() {
      org.gigapan.Util.error("Error loading gigapan datasets json from URL [" + jsonUrl + "]");
    }
  });
});
