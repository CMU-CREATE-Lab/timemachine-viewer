/**
 *
 * @license
 * Redistribution and use in source and binary forms ...
 *
 *
 * Class for managing the snaplapse visualization
 *
 * Dependencies:
 *  org.gigapan.timelapse.Timelapse
 *  org.gigapan.timelapse.Snaplapse
 *  jQuery (http://jquery.com/)
 *
 * Copyright 2013 Carnegie Mellon University. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Carnegie Mellon University.
 *
 * Authors:
 *  Yen-Chia Hsu (legenddolphin@gmail.com)
 *
 */

"use strict";

//
// VERIFY NAMESPACE
//

// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
if (!org) {
  org = {};
} else {
  if (typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if (typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse) {
  org.gigapan.timelapse = {};
} else {
  if (typeof org.gigapan.timelapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

//
// DEPENDECIES
//
if (!org.gigapan.timelapse.Timelapse) {
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.timelineMetadataVisualizer";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.TimelineMetadataVisualizer = function(timelapse) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //

    // variables for drawing the metadata
    var frames_start;
    var frames_end;
    var timeMachineDivId = timelapse.getTimeMachineDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var $chartContainer;
    var $chartContainerContent;
    var data = [];
    var chart;

    // variables for fast-forwarding
    var idxSeg;
    var $playbackButton;
    var $captureTime;
    var $timelineSlider;
    var $timelineSliderFiller;
    var $tool;
    var $fastforwardButton;
    var isFastforwarding = false;

    // variables for showing metadata images
    var $metadataImgsButton;
    var $metadataImgsDialog;
    var $metadataImgsContainer;
    var thumbnailTool = timelapse.getThumbnailTool();
    var bbox = {xmin: 2319.434174421393, ymin: 884.3791826815946, xmax: 3752.18890138649, ymax: 1893.4524892574645};
    var desiredView = {x: 2726.9852899554394, y: 1279.8581499132647, scale: 0.35118231332244504};
    var cropBox = {xmin: 297, ymin: 39, xmax: 740, ymax: 351};

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    var loadMetaData = function(metadata, doDraw, useDefaultPosition, showUI) {
      frames_start = metadata.frames_start;
      frames_end = metadata.frames_end;
      removeMetadataImages();
      createMetadataImages();
      if (doDraw) {
        drawMetadata(metadata.response);
      }
      if (useDefaultPosition) {
        if (!$metadataImgsButton.hasClass("defaultPosition")) {
          $metadataImgsButton.addClass("defaultPosition");
        }
        if (!$fastforwardButton.hasClass("defaultPosition")) {
          $fastforwardButton.addClass("defaultPosition");
        }
      }
      if (showUI) {
        showControlUI();
      }
    };
    this.loadMetaData = loadMetaData;

    var showControlUI = function() {
      $metadataImgsButton.show();
      $fastforwardButton.show();
    };
    this.showControlUI = showControlUI;

    var hideControlUI = function() {
      $metadataImgsButton.hide();
      $fastforwardButton.hide();
    };
    this.hideControlUI = hideControlUI;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    var drawMetadata = function(response) {
      data = [];
      for (var i = 0; i < response.length; i++) {
        // If a date string has dashes (i.e. 2015-04-09 08:52:35 GMT-0400), replace with slashes since IE/Edge/FireFox Date parser does not support this.
        // However, be sure not to remove the dash from the timezone field.
        var date = new Date(timelapse.getCaptureTimes()[i].replace(/-/g, "/"));
        data.push({x: date, y: response[i], frame: i});
      }
      if (!chart) {
        chart = new CanvasJS.Chart($chartContainer.prop("id"), {
          backgroundColor: "rgba(0,0,0,0)",
          zoomEnabled: false,
          creditText: "CanvasJS",
          axisX: {
            labelFontColor: "rgba(0,0,0,0)",
            lineColor: "rgba(0,0,0,0)",
            labelFontSize: 1,
            tickLength: 0,
            tickThickness: 0
          },
          axisY: {
            labelFontColor: "rgba(0,0,0,0)",
            lineColor: "rgba(0,0,0,0)",
            labelFontSize: 1,
            tickLength: 0,
            tickThickness: 0,
            //includeZero: false,
            minimum: 15,
            maximum: Math.max.apply(null, response),
            gridThickness: 0
          },
          toolTip: {
            enabled: false
          }
        });
        $chartContainerContent = $chartContainer.children(".canvasjs-chart-container");
        timelapse.addTimeChangeListener(timeChangeListenerForChart);
      }
      chart.options.data = [
        {
          type: "line",
          color: "rgb(255,255,255)",
          cursor: "pointer",
          lineThickness: 1,
          highlightEnabled: false,
          click: function(e) {
            timelapse.seekToFrame(e.dataPoint.frame);
          },
          dataPoints: data
        }
      ];
      timeChangeListenerForChart();
      $chartContainer.show();
      chart.render();
    };

    var timeChangeListenerForChart = function() {
      var currentFrame = timelapse.getCurrentFrameNumber();
      var currentTimeHighlight = new Date(timelapse.getCaptureTimes()[currentFrame]);
      if (data[currentFrame].y != 0) {
        chart.options.data[1] = {
          type: "line",
          cursor: "pointer",
          markerType: "circle",
          markerSize: 10,
          markerBorderColor: "#fff",
          markerBorderThickness: 1,
          dataPoints: [{x: currentTimeHighlight, y: data[currentFrame].y}]
        };
      } else {
        chart.options.data[1] = {
          markerSize: 0,
          markerBorderThickness: 0
        };
      }
      chart.render();
    };

    var init = function() {
      $playbackButton = $("#" + viewerDivId + " .playbackButton");
      $timelineSlider = $("#" + viewerDivId + " .timelineSlider");
      $timelineSliderFiller = $("#" + viewerDivId + " .timelineSliderFiller");
      $tool = $("#" + viewerDivId + " .tool");
      $captureTime = $("#" + viewerDivId + " .captureTime");

      // Create fast-forward button
      $fastforwardButton = $("<button class='fastforwardButton' title='Automatically step through potential smoke emissions'></button>");
      $fastforwardButton.button({
        icons: {
          secondary: "ui-icon-custom-forward"
        },
        text: false
      }).on("click", function() {
        if (!isFastforwarding) {
          isFastforwarding = true;
          idxSeg = getClosestSegIdx();
          timelapse.seekToFrame(frames_start[idxSeg]);
          setFastforwardUI("start");
          timelapse.play();
          timelapse.addTimeChangeListener(timeChangeListenerForFastforward);
        } else {
          isFastforwarding = false;
          timelapse.removeTimeChangeListener(timeChangeListenerForFastforward);
          timelapse.pause();
          setFastforwardUI("stop");
        }
      });
      $("#" + viewerDivId + " .controls").append($fastforwardButton);

      // Create the button for showing metadata images
      $metadataImgsButton = $("<button class='metadataImgsButton customButton' title='Show an image collection of potential smoke emissions'>Image</button>");
      $metadataImgsButton.button({
        icons: {
          primary: "ui-icon-image"
        },
        text: true
      }).on("click", function() {
        showMetadataImages();
      });
      $("#" + viewerDivId + " .controls").append($metadataImgsButton);

      // Create the dialog for showing metadata images
      $metadataImgsDialog = $("<div class='metadataImgsDialog' title='Show Images'></div>");
      $metadataImgsContainer = $("<div class='metadataImgsContainer always-selectable'></div>");
      $metadataImgsDialog.append($metadataImgsContainer);
      $metadataImgsDialog.dialog({
        resizable: true,
        autoOpen: false,
        dialogClass: "customDialog",
        appendTo: "#" + viewerDivId,
        width: 755,
        height: 700,
        minHeight: 50,
        buttons: {
          "OK": function() {
            $(this).dialog("close");
          }
        }
      });

      // Add listeners
      var snaplapse = timelapse.getSnaplapse();
      if (snaplapse) {
        timelapse.getSnaplapse().addEventListener('play', function() {
          $chartContainerContent.hide();
        });
        timelapse.getSnaplapse().addEventListener('stop', function() {
          $chartContainerContent.show();
        });
      }
    };

    var createMetadataImages = function() {
      for (var i = 0; i < frames_start.length; i++) {
        var urlSettings = {
          bound: bbox,
          width: (cropBox.xmax - cropBox.xmin) * 0.4,
          height: (cropBox.ymax - cropBox.ymin) * 0.4,
          startTime: timelapse.frameNumberToTime(frames_start[i]),
          endTime: timelapse.frameNumberToTime(frames_end[i]),
          fps: timelapse.getFps() * 0.5,
          embedTime: true,
          format: "gif"
        };
        var response = thumbnailTool.getURL(urlSettings);
        var $div = $("<div class='metadataImgBlock'></div>");
        var $img = $("<img class='metadataImg' src='" + response.url + "'><br>");
        var tmJSON = timelapse.getTmJSON();
        var captureTimes = timelapse.getCaptureTimes();
        var timelapseTitle = ( typeof tmJSON.name == "undefined") ? $("#locationTitle").text() : tmJSON.name;
        var linkText = timelapseTitle + " " + captureTimes[frames_start[i]] + " to " + captureTimes[frames_end[i]].split(" ")[1];
        var desiredTime = (timelapse.frameNumberToTime(response.args.startFrame) + response.args.nframes / (2 * timelapse.getFps())).toFixed(2);
        var linkHref = UTIL.getParentURL() + timelapse.getShareView(desiredTime, desiredView);
        var $link = $("<a class='metadataImgLink' target='_self' href='" + linkHref + "'>" + linkText + "</a>");
        $div.append($img).append($link);
        $metadataImgsContainer.append($div);
      }
    };

    var removeMetadataImages = function() {
      $metadataImgsContainer.children().remove();
    };

    var showMetadataImages = function() {
      if ($metadataImgsDialog.dialog("isOpen")) {
        $metadataImgsDialog.dialog("close");
      } else {
        $metadataImgsDialog.dialog("open");
      }
    };

    var getClosestSegIdx = function() {
      // needle in a haystack problem
      var needle = timelapse.getCurrentFrameNumber();
      var haystack = [];
      var haystack_idx = [];
      for (var i = 0; i < frames_start.length; i++) {
        haystack[i] = Math.abs(frames_start[i] - needle);
        haystack_idx[i] = i;
      }
      // sort the indices using a compare function
      haystack_idx = haystack_idx.sort(function(a, b) {
        return haystack[a] < haystack[b] ? -1 : (haystack[a] > haystack[b] ? 1 : 0);
      });
      // return the first sorted indices
      return haystack_idx[0];
    };

    var timeChangeListenerForFastforward = function() {
      var currentFrame = timelapse.getCurrentFrameNumber();
      if (currentFrame < frames_start[idxSeg]) {
        timelapse.seekToFrame(frames_start[idxSeg]);
      }
      if (currentFrame > frames_end[idxSeg]) {
        if (idxSeg < frames_start.length - 1) {
          idxSeg++;
        } else {
          timelapse.pause();
          timelapse.removeTimeChangeListener(timeChangeListenerForFastforward);
          setFastforwardUI("stop");
        }
      }
    };

    var setFastforwardUI = function(state) {
      if (state == "start") {
        $playbackButton.button("option", "disabled", true);
        $timelineSlider.slider("option", "disabled", true);
        $tool.button("option", "disabled", true);
        $timelineSliderFiller.css("opacity", "0.5");
        $fastforwardButton.button({
          icons: {
            secondary: "ui-icon-custom-stop-small"
          }
        });
      } else if (state == "stop") {
        $playbackButton.button("option", "disabled", false);
        $timelineSlider.slider("option", "disabled", false);
        $tool.button("option", "disabled", false);
        $timelineSliderFiller.css("opacity", "1");
        $fastforwardButton.button({
          icons: {
            secondary: "ui-icon-custom-forward"
          }
        });
      }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    // Create a chart div at the top of the timeline slider
    $chartContainer = $("<div></div>");
    $chartContainer.addClass("timeline-metadata-chart");
    $chartContainer.prop("id", timeMachineDivId + "-timeline-metadata-chart");
    $chartContainer.hide();
    $("#" + timelapse.getDataPanesContainerId()).append($chartContainer);

    // Initialize the fast-forwarding
    init();
  };
  //end of org.gigapan.timelapse.TimelineMetadataVisualizer
})();
//end of (function() {
