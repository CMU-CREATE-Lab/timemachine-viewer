// @license
// Redistribution and use in source and binary forms ...

/*
 Class for managing the snaplapse visualization

 Dependencies:
 * org.gigapan.timelapse.Timelapse
 * org.gigapan.timelapse.Snaplapse
 * jQuery (http://jquery.com/)

 Copyright 2013 Carnegie Mellon University. All rights reserved.

 Redistribution and use in source and binary forms, with or without modification, are
 permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this list of
 conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright notice, this list
 of conditions and the following disclaimer in the documentation and/or other materials
 provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
 WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 The views and conclusions contained in the software and documentation are those of the
 authors and should not be interpreted as representing official policies, either expressed
 or implied, of Carnegie Mellon University.

 Authors:
 Yen-Chia Hsu (legenddolphin@gmail.com)

 VERIFY NAMESPACE

 Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
 */
"use strict";

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
    var timeMachineDivId = timelapse.getTimeMachineDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var $chartContainer;
    var $chartContainerContent;
    var data = [];
    var chart;

    // variables for fast-forwarding
    var idxSeg;
    var $playbackButton;
    var $timelineSlider;
    var $timelineSliderFiller;
    var $tool;
    var $fastforwardButton;
    var $fastforwardContainer;
    var isFastforwarding = false;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
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
            maximum: 700,
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
    this.drawMetadata = drawMetadata;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
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
        }
      } else {
        chart.options.data[1] = {
          markerSize: 0,
          markerBorderThickness: 0
        }
      }
      chart.render();
    };

    var initFastforward = function() {
      $playbackButton = $("#" + viewerDivId + " .playbackButton");
      $timelineSlider = $("#" + viewerDivId + " .timelineSlider");
      $timelineSliderFiller = $("#" + viewerDivId + " .timelineSliderFiller");
      $tool = $("#" + viewerDivId + " .tool");

      // Create fast-forward button
      $fastforwardButton = $("<button class='fastforwardButton'></button>");
      $fastforwardButton.button({
        icons: {
          secondary: "ui-icon-custom-forward"
        },
        text: false
      }).on("click", function() {
        if(!isFastforwarding) {
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

      // Override the default position of the capture time
      $("#" + viewerDivId + " .captureTime").addClass("captureTimeOverride");

      // Add listeners
      timelapse.getSnaplapse().addEventListener('play', function() {
        $chartContainerContent.hide();
      });
      timelapse.getSnaplapse().addEventListener('stop', function() {
        $chartContainerContent.show();
      });
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
    initFastforward();
  };
  //end of org.gigapan.timelapse.TimelineMetadataVisualizer
})();
//end of (function() {
