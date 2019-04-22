/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Class for managing material UI
 *
 * Dependencies:
 *  org.gigapan.timelapse.Timelapse
 *  jQuery (http://jquery.com/)
 *
 * Copyright 2019 Carnegie Mellon University. All rights reserved.
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
 *  Paul Dille (pdille@andrew.cmu.edu)
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
  if ( typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if ( typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse) {
  org.gigapan.timelapse = {};
} else {
  if ( typeof org.gigapan.timelapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

//
// DEPENDENCIES
//
if (!org.gigapan.timelapse.Timelapse) {
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.MaterialUI";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  org.gigapan.timelapse.MaterialUI = function(timelapse, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //

    // Objects
    var videoset = timelapse.getVideoset();
    var UTIL = org.gigapan.Util;
    var snaplapseForPresentationSlider = timelapse.getSnaplapseForPresentationSlider();


    // Parameters
    var captureTimes;
    var numFrames;

    // DOM elements
    var viewerDivId = timelapse.getViewerDivId();
    var $timeline = $("#" + viewerDivId + " .materialTimeline");
    var $speedControls = $("#" + viewerDivId + " #speedControlOptions");
    var $rightSeekControl = $("#" + viewerDivId + " .rightSeekControl");
    var $leftSeekControl = $("#" + viewerDivId + " .leftSeekControl");
    var $materialNowViewingContent = $("#" + viewerDivId + " .materialNowViewingContent");
    var $materialNowViewingText = $("#" + viewerDivId + " .materialNowViewingText");
    var $timelineTicks;
    var $mainTimelineTicks;
    var $selectedTimelineTick;
    var $shareButton = $("#" + viewerDivId + " .share");
    var $timelineDisabledContainer = $("#" + viewerDivId + " .materialTimelineDisabled");
    var $waypointDrawerContainerToggle = $("#" + viewerDivId + " .waypointDrawerContainerToggle");


    // Flags
    var addedTimelineSliderListener = false;
    var isScrolling = false;


    var setupPlayPauseEventHandlers = function() {
      timelapse.addVideoPlayListener(function() {
        if (!$selectedTimelineTick.hasClass("mainMaterialTimelineTick")) {
          timelapse.handlePlayPause();
          $mainTimelineTicks.first().click();
          timelapse.handlePlayPause();
        }
      });
    };

    var createTimelineSlider = function() {
      var timelineHTML = "";
      captureTimes = timelapse.getCaptureTimes();
      numFrames = captureTimes.length;

      for (var i = 0; i < captureTimes.length; i++) {
        timelineHTML += "<span class='materialTimelineTick' data-frame=" + i + ">" + captureTimes[i] + "</span>";
      }
      timelineHTML += "<span class='materialTimelineDivider'>&#8226;</span>";
      for (var i = 0; i < captureTimes.length; i++) {
        timelineHTML += "<span class='materialTimelineTick mainMaterialTimelineTick' data-frame=" + i + ">" + captureTimes[i] + "</span>";
      }
      $timeline.html(timelineHTML);

      $timeline.swipe( {
        // Generic swipe handler for all directions
        swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
          // Swiping left actually means going forward, aka "right"
          // Swiping right actually means going backwards, aka "left"
          if (direction == "left") {
            direction = "right";
          } else if (direction == "right") {
            direction = "left";
          }
          seekControlAction(direction);

        },
        threshold: 10
      });

      $timelineTicks = $("#" + viewerDivId + " .materialTimelineTick");
      $mainTimelineTicks = $("#" + viewerDivId + " .mainMaterialTimelineTick");

      $timelineTicks.on("click", function() {
        updateTimelineSlider(null, $(this), false);
      });

      if (!addedTimelineSliderListener) {
        addedTimelineSliderListener = true;
        videoset.addEventListener('sync', function() {
          var currentFrameNumber = timelapse.getCurrentFrameNumber();
          if (!$selectedTimelineTick.hasClass("mainMaterialTimelineTick") || parseInt($selectedTimelineTick.attr("data-frame")) == currentFrameNumber) return;
          updateTimelineSlider(currentFrameNumber, null, true);
        });
      }

      var startTimeElm = $mainTimelineTicks.first();
      updateTimelineSlider(0, startTimeElm);

      timelapse.addResizeListener(function() {
        refocusTimeline();
      });

      if (UTIL.isIE()) {
        $timeline.addClass("isIE");
      }
    };

    var updateTimelineSlider = function(frameNum, timeTick, fromSync) {
      if (!timeTick || timeTick.length == 0) {
        timeTick = $('.mainMaterialTimelineTick[data-frame="' + frameNum + '"]');
      }
      if (timeTick.length) {
        $selectedTimelineTick = timeTick;
        if (frameNum == null) {
          frameNum = parseInt($selectedTimelineTick.attr("data-frame"));
        }
        //var scrollOptions = {inline: 'center'};
        var scrollOptions = {time: 100};
        if (fromSync) {
          scrollOptions = {
           ease: null,
           time: 0
         };
        }
        $timelineTicks.removeClass("materialTimelineTickSelected");
        $selectedTimelineTick.addClass("materialTimelineTickSelected");
        window.scrollIntoView($selectedTimelineTick[0], scrollOptions, function() {
          isScrolling = false;
        });
        if (timelapse.isPaused()) {
          timelapse.seekToFrame(frameNum);
        }
      }
    };

    var createSpeedToggle = function() {
      $speedControls.selectmenu({
        position: {
          at: "left bottom",
          collision: 'flip',

        }, change: function(e, ui) {
          timelapse.setPlaybackRate(ui.item.value);
        }
      }).val(timelapse.getPlaybackRate()).selectmenu("refresh");

      timelapse.addPlaybackRateChangeListener(function(rate) {
        $speedControls.val(rate).selectmenu("refresh");
      });

      if (UTIL.isIE()) {
        $("#" + viewerDivId + " .speedControl").addClass("isIE");
      }
    };

    var handleSeekControls = function() {
      $leftSeekControl.on("click", function() {
        seekControlAction("left");
      });

      $rightSeekControl.on("click", function() {
        seekControlAction("right");
      });
    };

    var setupNowViewingUI = function() {
      if (snaplapseForPresentationSlider) {
        var snaplapseViewerForPresentationSlider = snaplapseForPresentationSlider.getSnaplapseViewer();
        console.log('setup');
        snaplapseViewerForPresentationSlider.addEventListener('slide-changed', function(waypoint) {
          console.log('slide changed', waypoint.title);
          if (waypoint.title) {
            $materialNowViewingText.text(waypoint.title);
            $materialNowViewingContent.show();
          } else {
            $materialNowViewingContent.hide();
          }
        });
        snaplapseViewerForPresentationSlider.addEventListener('left-waypoint-view-threshold', function(waypoint) {
          $materialNowViewingContent.hide();
          $("#" + viewerDivId + " .snaplapse_keyframe_list .thumbnail_highlight").removeClass("thumbnail_highlight");
        });
      }
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //

    var refocusTimeline = function() {
      $selectedTimelineTick.trigger("click");
    };
    this.refocusTimeline = refocusTimeline;

    var seekControlAction = function(direction) {
      var currentFrameNum = parseInt($selectedTimelineTick.attr("data-frame"));
      if ((currentFrameNum > 0 || $selectedTimelineTick.hasClass("mainMaterialTimelineTick")) && direction == "left") {
        updateTimelineSlider(null,  $selectedTimelineTick.prevAll("#" + viewerDivId + " .materialTimelineTick:first"), false);
      } else if ((currentFrameNum < numFrames - 1 || !$selectedTimelineTick.hasClass("mainMaterialTimelineTick")) && direction == "right") {
        updateTimelineSlider(null,  $selectedTimelineTick.nextAll("#" + viewerDivId + " .materialTimelineTick:first"), false);
      }
    };
    this.seekControlAction = seekControlAction;

    var handleContextMapUICallback = function(isMapLayerVisible) {
      if (typeof(isMapLayerVisible) === "undefined") return;

      if (isMapLayerVisible) {
        $shareButton.button("disable");
        $timelineDisabledContainer.show();
        if ($(".waypointDrawerContainerMain").hasClass("waypointDrawerClosed")) {
          $waypointDrawerContainerToggle.addClass("wasClosed");
        } else {
          $waypointDrawerContainerToggle.trigger("click");
        }
        $waypointDrawerContainerToggle.addClass("disabled");
      } else {
        $shareButton.button("enable");
        $timelineDisabledContainer.hide();
        $waypointDrawerContainerToggle.removeClass("disabled");
        if (!$waypointDrawerContainerToggle.hasClass("wasClosed")) {
          $waypointDrawerContainerToggle.trigger("click");
        } else {
          $waypointDrawerContainerToggle.removeClass("wasClosed");
        }
      }
    };
    this.handleContextMapUICallback = handleContextMapUICallback;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    setupPlayPauseEventHandlers();

    createTimelineSlider();

    createSpeedToggle();

    handleSeekControls();

    setupNowViewingUI();
  };
  //end of org.gigapan.timelapse.MaterialUI
})();
//end of (function() {
