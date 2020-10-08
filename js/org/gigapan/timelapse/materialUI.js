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
    var $materialNowViewingContainer = $("#" + viewerDivId + " .materialNowViewingContainer");
    var $materialNowViewingContent = $("#" + viewerDivId + " .materialNowViewingContent");
    var $materialNowViewingText = $("#" + viewerDivId + " .materialNowViewingText");
    var $materialNowViewingClose = $("#" + viewerDivId + " .materialNowViewingContent .close");
    var $timelineTicks;
    var $selectedTimelineTick;
    var $shareButton = $("#" + viewerDivId + " .share");
    var $timelineDisabledContainer = $("#" + viewerDivId + " .materialTimelineDisabled");
    var $waypointDrawerContainerToggle = $("#" + viewerDivId + " .waypointDrawerContainerToggle");
    var timelineGroupHTML = "";
    var timelineGroupSeparator = "<span class='materialTimelineDivider'>&#8226;</span>";
    var leftTimelineGroupWidth;
    var timelineTickWidth;
    var lastSelectedGroup;
    var $tourTimeText;
    var startDownX;


    // Flags
    var addedTimelineSliderListener = false;
    var lastFrameWasGroupEnd = false;


    var createTimelineSlider = function() {
      var currentTimelineHTML = "";
      captureTimes = timelapse.getCaptureTimes();
      numFrames = captureTimes.length;

      for (var i = 0; i < captureTimes.length; i++) {
        currentTimelineHTML += "<span class='materialTimelineTick' data-frame=" + i + ">" + captureTimes[i] + "</span>";
      }
      timelineGroupHTML = currentTimelineHTML;
      var $leftGroup = $("<div class='leftGroup'>" + timelineGroupHTML + timelineGroupSeparator + "</div>");
      var $rightGroup =  $("<div class='rightGroup'>" + timelineGroupHTML + timelineGroupSeparator + "</div>");
      $timeline.append($leftGroup, $rightGroup);

      $timeline.on("mousedown", function(e) {
        if (typeof(e.pageX) === "undefined") {
          startDownX = e.clientX;
        } else {
          startDownX = e.pageX;
        }
      });

      $timeline.on("mouseup", function(e) {
        e.preventDefault();
        e.stopPropagation();
        var endDownX;
        if (typeof(e.pageX) === "undefined") {
          endDownX = e.clientX;
        } else {
          endDownX = e.pageX;
        }
        var diff = (startDownX - endDownX);
        var threshold = 10;
        if ((diff + threshold) < 0) {
          // Swiping right actually means going backwards, aka "left"
          seekControlAction("left");
        } else if ((diff - threshold) > 0) {
          // Swiping left actually means going forward, aka "right"
          seekControlAction("right");
        }
      });

      $timeline.on("click", ".materialTimelineTick", function() {
        updateTimelineSlider(null, $(this), false);
      });

      $timelineTicks = $("#" + viewerDivId + " .materialTimelineTick");

      leftTimelineGroupWidth = $leftGroup.outerWidth(true);
      lastSelectedGroup = $rightGroup;

      if (!addedTimelineSliderListener) {
        addedTimelineSliderListener = true;
        videoset.addEventListener('sync', function() {
          var currentFrameNumber = timelapse.getCurrentFrameNumber();
          if (currentFrameNumber == numFrames - 1 && timelapse.isDoingLoopingDwell()) {
            lastFrameWasGroupEnd = true;
          }
          if (!lastFrameWasGroupEnd && (parseInt($selectedTimelineTick.attr("data-frame")) == currentFrameNumber)) return;
          updateTimelineSlider(currentFrameNumber, null, true);
        });
      }

      // For tours
      $tourTimeText = $('<div class="timeText"></div>');
      $("#" + viewerDivId).append($tourTimeText);

      var startTimeElm = $("#" + viewerDivId + " .rightGroup").find(".materialTimelineTick:first");
      timelineTickWidth = startTimeElm.outerWidth(true);

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
        if ((lastFrameWasGroupEnd && frameNum == 0) ||
            (lastSelectedGroup.hasClass("rightGroup") && $selectedTimelineTick.parent().hasClass("leftGroup")) ||
            (lastSelectedGroup.hasClass("leftGroup") && $selectedTimelineTick.parent().hasClass("leftGroup"))) {
          timeTick = $selectedTimelineTick.parent().next().find($('.materialTimelineTick')).first();
          lastFrameWasGroupEnd = false;
        } else {
          timeTick = $selectedTimelineTick.parent().find($('.materialTimelineTick[data-frame="' + frameNum + '"]'));
        }
      }
      if (timeTick.length) {
        $selectedTimelineTick = timeTick;
        if (frameNum == null) {
          frameNum = parseInt($selectedTimelineTick.attr("data-frame"));
        }
        var scrollOptions = {
          time: 100,
          validTarget: function(target) {
            return target === $timeline[0];
          }
        };
        if (fromSync) {
          scrollOptions.ease = null;
          scrollOptions.time = 0;
        }
        $timelineTicks.removeClass("materialTimelineTickSelected");
        $selectedTimelineTick.addClass("materialTimelineTickSelected");
        window.scrollIntoView($selectedTimelineTick[0], scrollOptions, function() {
          var scrollWidthAmount = $timeline[0].scrollWidth;
          var scrollLeftAmount = $timeline[0].scrollLeft;
          var clientWidthAmount = $timeline[0].clientWidth;
          var scrollDiff = ((scrollWidthAmount - scrollLeftAmount) - clientWidthAmount);
          var threshold = timelineTickWidth;

          if (clientWidthAmount > 0 && scrollLeftAmount <= threshold) {
            var $prevGroup = $selectedTimelineTick.parent().prev();
            if ($prevGroup.length == 0) {
              // Add new timeline segment to the left
              var $newLeftGroup = $("<div class='leftGroup newLeftGroup'>" + timelineGroupHTML + timelineGroupSeparator + "</div>");
              $timeline.prepend($newLeftGroup);
              $timelineTicks = $("#" + viewerDivId + " .materialTimelineTick");
              $timeline[0].scrollLeft = leftTimelineGroupWidth + scrollLeftAmount;
            }
          } else if (clientWidthAmount > 0 && scrollDiff <= threshold) {
            var doFixScroll = false;
            // Ensure only one tmp group ever exists
            var $existingNewRightGroup = $("#" + viewerDivId + " .newRightGroup");
            if ($existingNewRightGroup.length == 1) {
              var $previousRightGroup = $existingNewRightGroup.prev();
              $existingNewRightGroup.removeClass("newRightGroup");
              $previousRightGroup.remove();
              doFixScroll = true;
            }
            // Add to the right
            var $newRightGroup = $("<div class='rightGroup newRightGroup'>" + timelineGroupHTML + timelineGroupSeparator + "</div>");
            $timeline.append($newRightGroup);
            $timelineTicks = $("#" + viewerDivId + " .materialTimelineTick");
            if (doFixScroll) {
              $timeline[0].scrollLeft = scrollLeftAmount - leftTimelineGroupWidth;
            }
          }
        });
        if (timelapse.isPaused()) {
          timelapse.seekToFrame(frameNum);
        }
        $tourTimeText.text($selectedTimelineTick.text());
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
        var closeAnnotation = function() {
          $materialNowViewingContent.hide();
          $("#" + viewerDivId + " .snaplapse_keyframe_list .thumbnail_highlight").removeClass("thumbnail_highlight");
        };
        var snaplapseViewerForPresentationSlider = snaplapseForPresentationSlider.getSnaplapseViewer();
        snaplapseViewerForPresentationSlider.addEventListener('slide-changed', function(waypoint) {
          if (waypoint.title) {
            $materialNowViewingText.text(waypoint.title);
            $materialNowViewingContent.show();
          } else {
            $materialNowViewingContent.hide();
          }
        });
        snaplapseViewerForPresentationSlider.addEventListener('left-waypoint-view-threshold', function(waypoint) {
          closeAnnotation();
        });
        $materialNowViewingClose.on("click", function() {
          closeAnnotation();
        });
      }
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //

    var refocusTimeline = function() {
      updateTimelineSlider(null, $selectedTimelineTick, false);
    };
    this.refocusTimeline = refocusTimeline;

    var seekControlAction = function(direction) {
      lastSelectedGroup = $selectedTimelineTick.parent();
      if (direction == "left") {
        var $previousTimeTick = $selectedTimelineTick.prev("#" + viewerDivId + " .materialTimelineTick");
        if ($previousTimeTick.length == 0) {
          // We hit the end of a timeline group, let's look outside of it.
          var $currentTimelineTickParent = $selectedTimelineTick.parent();
          $previousTimeTick = $selectedTimelineTick.parent().prev().children("#" + viewerDivId + " .materialTimelineTick:last");
          if ($currentTimelineTickParent.hasClass("leftGroup")) {
            $currentTimelineTickParent.remove();
            $previousTimeTick.parent().removeClass("newLeftGroup");
          }
        }
        updateTimelineSlider(null, $previousTimeTick, false);
      } else if (direction == "right") {
        var $nextTimelineTick = $selectedTimelineTick.next("#" + viewerDivId + " .materialTimelineTick");
        if ($nextTimelineTick.length == 0) {
          // We hit the end of a timeline group, let's look outside of it
          var $currentTimelineTickParent = $selectedTimelineTick.parent();
          $nextTimelineTick = $selectedTimelineTick.parent().next().children("#" + viewerDivId + " .materialTimelineTick:first");
          if ($currentTimelineTickParent.hasClass("rightGroup")) {
            var scrollLeftAmount = $timeline[0].scrollLeft;
            $currentTimelineTickParent.remove();
            $nextTimelineTick.parent().removeClass("newRightGroup");
            $timeline[0].scrollLeft = scrollLeftAmount - leftTimelineGroupWidth;
          }
        }
        updateTimelineSlider(null, $nextTimelineTick, false);
      }
    };
    this.seekControlAction = seekControlAction;

    var handleContextMapUICallback = function(isMapLayerVisible) {
      if (typeof(isMapLayerVisible) === "undefined") return;

      if (isMapLayerVisible) {
        $shareButton.button("disable");
        $materialNowViewingContainer.hide();
        $timelineDisabledContainer.show();
        if ($(".waypointDrawerContainerMain").hasClass("waypointDrawerClosed")) {
          $waypointDrawerContainerToggle.addClass("wasClosed");
        } else {
          $waypointDrawerContainerToggle.trigger("click");
        }
        $waypointDrawerContainerToggle.addClass("disabled");
      } else {
        $shareButton.button("enable");
        $materialNowViewingContainer.show();
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

    createTimelineSlider();

    createSpeedToggle();

    handleSeekControls();

    setupNowViewingUI();
  };
  //end of org.gigapan.timelapse.MaterialUI
})();
//end of (function() {
