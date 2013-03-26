// Copyright 2011 Carnegie Mellon University. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//    of conditions and the following disclaimer in the documentation and/or other materials
//    provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of Carnegie Mellon University.
//
// Authors:
// Chris Bartley (bartley@cmu.edu)
// Paul Dille (pdille@andrew.cmu.edu)
// Randy Sargent (randy.sargent@cs.cmu.edu)

var browserSupported;
var timelapseMetadata;
var snaplapse;
function createZoomSlider(viewerDivId,obj) {
  $("#"+viewerDivId+" .zoomSlider").slider({
    orientation: "vertical",
    value: obj.viewScaleToZoomSlider(obj.getDefaultScale()),
    min: 0,
    max: 1,
    step: .01,
    slide: function(e, ui) {
      obj.setScaleFromSlider(ui.value);
    }
  }).removeClass("ui-corner-all");

  $("#"+viewerDivId+" .zoomSlider .ui-slider-handle").attr("title", "Drag to zoom");
}

function setupSliderHandlers(viewerDivId) {
  $("#"+viewerDivId+" .ui-slider-handle").bind("mouseover mouseup", function() {
    this.style.cursor = 'url("css/cursors/openhand.png") 10 10, move';
  });

  $("#"+viewerDivId+" .ui-slider").bind({
    slide: function() {
      this.style.cursor = 'url("css/cursors/closedhand.png") 10 10, move';
      $("#"+viewerDivId+" .ui-slider-handle").bind("mousemove", function() {
        this.style.cursor = 'url("css/cursors/closedhand.png") 10 10, move';
      });
    },
    slidestop: function() {
      $("#"+viewerDivId+" .ui-slider-handle").bind("mousemove", function() {
        this.style.cursor = 'url("css/cursors/openhand.png") 10 10, move';
      });
    },
    mouseover: function() {
      this.style.cursor = "pointer";
    }
  });
}

function zoomIn(viewerDivId,obj) {
  var val = Math.min($("#"+viewerDivId+" .zoomSlider").slider("value") + .01, 1);
  obj.setScaleFromSlider(val);
}

function zoomOut(viewerDivId,obj) {
  var val = Math.max($("#"+viewerDivId+" .zoomSlider").slider("value") - .01, 0);
  obj.setScaleFromSlider(val);
}

function populateSpeedPlaybackChoices(div, timelapseObj) {
  var choices = [];

  // Only show backward playback options for non-split video datasets
  // Backward playback - emulated since Chrome/Safari doesn't properly handle it
  if (typeof(timelapseObj.getDatasetJSON()['frames_per_fragment']) == "undefined") {
    choices.push({"name":"Backward, Full Speed", "value": -1.0},
      {"name":"Backward, &#188; Speed", "value": -0.25},
      {"name":"Backward, &#189; Speed", "value": -0.5});
  }

  //if(!org.gigapan.Util.isSafari())
  //  choices.push({"name":"Forward, &#188; Speed", "value": 0.25});

  // Forward playback - 1/4 speed is emulated on Safari but we still give the option
  choices.push({"name":"Forward, &#188; Speed", "value": 0.25},
    {"name":"Forward, &#189; Speed", "value": 0.5},
    {"name":"Forward, Full Speed", "value": 1.0});
  var html = "";
  var numChoices = choices.length;
  for (var i = 0; i < numChoices; i++) {
    html += '<li><a href="javascript:void(0);" data-speed=\''+choices[i]["value"]+'\'>'+choices[i]["name"]+'</a></li>';
  }
  $("#"+div+" .playbackSpeedChoices").append(html);
}

function handlePluginVideoTagOverride() {
  if (browserSupported && $("#1").is("EMBED")) {
    $("#player").hide();
    $("#time_warp_composer").hide();
    $("#html5_overridden_message").show();
  }
}

function setViewportSize(newWidth, newHeight, timelapse) {
  timelapse.updateDimensions(newWidth, newHeight);

  var timelapseViewerDivId = timelapse.getViewerDivId();
  var bounds = timelapse.getBoundingBoxForCurrentView();

  // viewport
  $("#"+timelapse.getVideoDivId()).css({"width": newWidth+"px", "height": newHeight+"px"});
  $(timelapse.getCanvas()).attr({ width: newWidth, height: newHeight });
  $(timelapse.getCanvasTmp()).attr({ width: newWidth, height: newHeight });

  // annotation stage (kineticjs)
  var annotator = timelapse.getAnnotator();
  if (annotator) {
    var annotationStage = annotator.getAnnotationStage();
    if (annotationStage) {
      var annotationLayer = annotator.getAnnotationLayer();
      annotationStage.setSize(newWidth,newHeight);
      annotationLayer.draw();
    }
  }

  // spinner
  var spinnerCenterHeight = newHeight/2-$("#"+timelapseViewerDivId+" .spinner").height()/2+"px";
  var spinnerCenterWidth = newWidth/2-$("#"+timelapseViewerDivId+" .spinner").width()/2+"px";

  // controls
  $("#"+timelapseViewerDivId+" .controls").width(newWidth);
  $("#"+timelapseViewerDivId+" .timelineSlider").width(newWidth+2); // extra 2px for the borders
  $("#"+timelapseViewerDivId+" .spinnerOverlay").css({"margin": spinnerCenterHeight + " " + spinnerCenterWidth});
  $("#"+timelapseViewerDivId+" .snaplapse-annotation-description").css({"left": newWidth+$("#"+timelapseViewerDivId).offset().left+"px","top": $("#"+timelapseViewerDivId).offset().top+"px"});
  $("#"+timelapseViewerDivId+" .instructions").css({"width": newWidth+2+"px", "height": newHeight+2+"px"}); // extra 2px for the borders
  //$("#"+timelapseViewerDivId+" .layerSlider").css({"top": newHeight+2+$(".controls").height()+"px", "right": "28px"}); // extra 2px for the borders

  //wiki specific css
  if (newWidth == 816) { //large video
    $("#content").css({"padding": "0px 0px 0px 305px"});
    $("#firstHeading").css({"top": "628px"});
  } else {
    $("#content").css({"padding": "0px 0px 0px 0px"});
    $("#firstHeading").css({"top": "450px"});
  }
  //end wiki specific css

  timelapse.warpToBoundingBox(bounds);
}

var showSpinner = function(viewerDivId) {
  org.gigapan.Util.log("showSpinner");
  $("#"+viewerDivId+" .spinnerOverlay").show();
};

var hideSpinner = function(viewerDivId) {
  org.gigapan.Util.log("hideSpinner");
  $("#"+viewerDivId+" .spinnerOverlay").hide();
};

function getTileHostUrlPrefix() {
  // get the tile host URL prefixes from the JSON, or use a default if undefined
  var prefixes = ["http://g7.gigapan.org/alpha/timelapses/"];
  if (typeof gigapanDatasetsJSON["tile-host-url-prefixes"] != "undefined" && $.isArray(gigapanDatasetsJSON["tile-host-url-prefixes"]) && gigapanDatasetsJSON["tile-host-url-prefixes"].length > 0) {
    prefixes = gigapanDatasetsJSON["tile-host-url-prefixes"];
  }
  // now pick one at random
  //return prefixes[Math.floor(Math.random() * prefixes.length)];
  return prefixes;
}
