// @license
// Redistribution and use in source and binary forms ...

/*
 Class for managing custom UI

 Dependencies:
 * org.gigapan.timelapse.Timelapse
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
 */"use strict";

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
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.CustomUI";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.CustomUI = function(timelapse, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //
    var datasetType = timelapse.getDatasetType();
    var timeMachineDivId = timelapse.getTimeMachineDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var $viewer = $("#" + viewerDivId);
    var viewer_offset = $viewer.offset();
    var $video = $("#" + viewerDivId + " .tiledContentHolder");
    var playerWidth = $video.outerWidth();
    var $customControl;
    var $customPlay;
    var $customHelpLabel;
    var $customTimeline;
    var $timeText;
    var $timeTextLeft;
    var $timeTextRight;
    var $currentTimeTick;
    var $fastSpeed;
    var $mediumSpeed;
    var $slowSpeed;
    var $timeTextHover;
    var videoset = timelapse.getVideoset();
    var captureTimes = timelapse.getCaptureTimes();
    var numFrames = timelapse.getNumFrames();
    var timeTickX = [];
    var $defaultUIPlaybackButton = $("#" + viewerDivId + " .playbackButton");
    var numYears;
    var pixelRatio = getPixelRatio();
    var endFrameIdx = numFrames - 1;
    var extraHeight = 2;
    var $customSpeedhelp;

    // Modis dataset variables
    var $monthSpinnerContainer;
    var $monthSpinner;
    var $monthSpinnerTxt;
    var previousEffectiveSpinnerValue = 0;
    var previousSpinnerValue = 0;
    var locker = "none";
    var yearLockMinPlaybackFrame;
    var yearLockMaxPlaybackFrame;
    var yearDictionary = {};
    var frameDictionary = [];
    var firstYear;
    var endYear;
    var isPlaying = !timelapse.isPaused();
    var $noLock;
    var $withLock;
    var monthLockPlaybackFrames = [];
    var monthLockPlaybackInterval;
    var monthLockPlaybackIdx = 0;
    var monthLockPlaybackSpeed;
    var fps = timelapse.getFps();
    var firstYearFrameOffset;
    var spinnerRadius = 110;
    var endTimeDot_radius = 4;
    var endTimeDotGrow_radius = 8;
    var $endTimeDot;
    var spinnerCircleOffset1 = 8;
    var spinnerCircleOffset2 = 9;
    var spinnerAngleArc = 273;
    var spinnerAngleOffset = -47;
    var maxYearNumFrames;

    // In px.
    var sliderLeftMargin;
    var sliderRightMargin;

    var isShowHoverEffect = true;
    var useTouchFriendlyUI = timelapse.useTouchFriendlyUI();
    var timeTick_width = 2;
    var timeTick_height = useTouchFriendlyUI ? 21 : 15;
    var currentTimeTick_width = useTouchFriendlyUI ? 15 : 10;
    var currentTimeTick_height = useTouchFriendlyUI ? 43 : 31;
    var timeTickGrow_width = 2;
    var timeTickGrow_height = currentTimeTick_height;
    var originalIsPaused;
    var isSafari = org.gigapan.Util.isSafari();
    var editorEnabled = timelapse.isEditorEnabled();
    var timeTickSpan;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    var preProcessLandsat = function() {
      for (var i = 0; i < captureTimes.length; i++) {
        var year = parseInt(captureTimes[i]);
        frameDictionary[i] = {
          "x": undefined,
          "year": year
        };
        if (firstYear == undefined)
          firstYear = year;
        if (i == captureTimes.length - 1)
          endYear = year;
        if (yearDictionary[year] == undefined) {
          yearDictionary[year] = {
            "numFramesThisYear": 0,
            "currentStackEndIdx": -1,
            "previousStackEndIdx": -1
          };
          if (yearDictionary[year - 1]) {
            yearDictionary[year]["currentStackEndIdx"] = yearDictionary[year - 1]["currentStackEndIdx"];
            yearDictionary[year]["previousStackEndIdx"] = yearDictionary[year - 1]["currentStackEndIdx"];
          }
        }
        yearDictionary[year]["numFramesThisYear"]++;
        yearDictionary[year]["currentStackEndIdx"]++;
      }
      numYears = numFrames;
    };

    var preProcessModis = function() {
      var year, month;
      for (var i = 0; i < captureTimes.length; i++) {
        var time = captureTimes[i].split(" ");
        var timeStart = time[0].split("-").map(parseFloat);
        var originalCaptureTime = new Date(timeStart[0], timeStart[1] - 1, timeStart[2]).toUTCString();
        originalCaptureTime = originalCaptureTime.split(",");
        originalCaptureTime = originalCaptureTime[1].split(" ");
        year = timeStart[0];
        month = timeStart[1];
        if (firstYear == undefined)
          firstYear = year;
        if (i == captureTimes.length - 1)
          endYear = year;
        if (yearDictionary[year] == undefined) {
          yearDictionary[year] = {
            "numFramesThisYear": 0,
            "currentStackEndIdx": -1,
            "previousStackEndIdx": -1,
            "maxSpinnerValue": -1,
            "minSpinnerValue": 0
          };
          if (yearDictionary[year - 1]) {
            yearDictionary[year]["currentStackEndIdx"] = yearDictionary[year - 1]["currentStackEndIdx"];
            yearDictionary[year]["previousStackEndIdx"] = yearDictionary[year - 1]["currentStackEndIdx"];
          }
        }
        yearDictionary[year][month] = yearDictionary[year]["numFramesThisYear"];
        frameDictionary[i] = {
          "x": undefined,
          "year": year,
          "monthFrameIdx": yearDictionary[year][month],
          "monthText": originalCaptureTime[2]
        };
        yearDictionary[year]["numFramesThisYear"]++;
        yearDictionary[year]["maxSpinnerValue"]++;
        yearDictionary[year]["currentStackEndIdx"]++;
        yearDictionary[year][month]++;
      }
      numYears = Object.keys(yearDictionary).length;
      // The first year is a special case that contains less frames than other years.
      // We need this variable to correctly seek to a desired time.
      // If there are more special cases, you need more special offset variables.
      maxYearNumFrames = yearDictionary[firstYear + 1]["numFramesThisYear"];
      firstYearFrameOffset = maxYearNumFrames - yearDictionary[firstYear]["numFramesThisYear"];
      for (var i = yearDictionary[firstYear]["minSpinnerValue"]; i <= yearDictionary[firstYear]["maxSpinnerValue"]; i++)
        frameDictionary[i]["monthFrameIdx"] += firstYearFrameOffset;
      yearDictionary[firstYear]["minSpinnerValue"] += firstYearFrameOffset;
      yearDictionary[firstYear]["maxSpinnerValue"] += firstYearFrameOffset;
      previousEffectiveSpinnerValue = yearDictionary[firstYear]["minSpinnerValue"];
      previousSpinnerValue = previousEffectiveSpinnerValue;
    };

    var createCustomControl = function() {
      if (useTouchFriendlyUI)
        $video.addClass("tiledContentHolder-touchFriendly");

      $customControl = $('<div class="customControl"></div>');
      // Append element
      $viewer.append($customControl);
      // Create google logo
      $customControl.append('<div class="googleLogo"></div>');
      if (useTouchFriendlyUI)
        $(".googleLogo").addClass("googleLogo-touchFriendly");
      // Create the spinner for months
      if (datasetType == "modis")
        createMonthSpinner();
      // Create timeline toolbar
      createCustomButtons();
      // Create timeline slider
      createCustomTimeline();

      if (datasetType == "modis") {
        timelapse.addTimeChangeListener(function() {
          if (locker == "year") {
            var currentFrame = timelapse.getCurrentFrameNumber();
            if (currentFrame >= numFrames - 2) {
              // If current time passes the end frame
              if (isPlaying) {
                timelapse.seekToFrame(yearLockMinPlaybackFrame);
                timelapse.play();
                $customPlay.button({
                  icons: {
                    primary: "ui-icon-custom-pause"
                  },
                  text: false
                }).attr({
                  "title": "Pause"
                });
                return;
              }
            } else if (currentFrame >= yearLockMaxPlaybackFrame) {
              if (timelapse.isPaused() == false)
                timelapse.seekToFrame(yearLockMinPlaybackFrame);
            } else if (currentFrame < yearLockMinPlaybackFrame)
              timelapse.seekToFrame(yearLockMinPlaybackFrame);
          }
        });
        timelapse.addVideoPlayListener(function() {
          if (locker == "year") {
            var currentYear = getCurrentYear();
            yearLockMinPlaybackFrame = yearDictionary[currentYear]["previousStackEndIdx"] + 1;
            yearLockMaxPlaybackFrame = yearDictionary[currentYear]["currentStackEndIdx"];
          }
        });
      }
    };

    var createMonthSpinner = function() {
      $monthSpinnerContainer = $('<div class="monthSpinnerContainer"></div>');
      $monthSpinner = $('<input class="monthSpinner" data-width="' + spinnerRadius + '" data-height="' + spinnerRadius + '">');
      $monthSpinnerTxt = $('<div class="monthSpinnerTxt"></div>');
      $monthSpinnerContainer.append($monthSpinner);
      $monthSpinnerContainer.append($monthSpinnerTxt);
      $customControl.append($monthSpinnerContainer);
      $monthSpinner.knob({
        min: 0,
        max: maxYearNumFrames - 1,
        fgColor: "#707070",
        bgColor: "#ffffff",
        thickness: 0.27,
        cursor: 15,
        width: spinnerRadius,
        height: spinnerRadius,
        displayInput: false,
        angleArc: spinnerAngleArc,
        angleOffset: spinnerAngleOffset,
        stopper: false,
        change: function(value) {
          var currentYear = getCurrentYear();
          var minSpinnerValue = yearDictionary[currentYear]["minSpinnerValue"];
          var maxSpinnerValue = yearDictionary[currentYear]["maxSpinnerValue"];
          if (previousSpinnerValue > maxYearNumFrames - 1) {
            if (value == 0) {
              seekToFrame(value, "year", 1);
              return false;
            } else if (value == maxYearNumFrames - 1) {
              seekToFrame(value, "year", -1);
              return false;
            }
          }
          previousSpinnerValue = value;
          if (value > maxSpinnerValue || value < minSpinnerValue) {
            if (previousEffectiveSpinnerValue >= minSpinnerValue && previousEffectiveSpinnerValue <= (maxSpinnerValue + minSpinnerValue) / 2)
              $monthSpinner.val(minSpinnerValue).trigger("change");
            else if (previousEffectiveSpinnerValue > (maxSpinnerValue + minSpinnerValue) / 2 && previousEffectiveSpinnerValue <= maxSpinnerValue)
              $monthSpinner.val(maxSpinnerValue).trigger("change");
            return false;
          } else {
            previousEffectiveSpinnerValue = value;
            seekToFrame(value, "year");
          }
        },
        release: function(value) {
          if (!originalIsPaused)
            timelapse.handlePlayPause();
          if (locker == "month" && isPlaying)
            playMonthLockFrames();
        },
        draw: function() {
          var angleOffset = 0.14;
          // Angle
          var a = this.angle(this.cv);
          // Start angle
          var sat = this.startAngle - angleOffset;
          // End angle
          var eat = sat + a - angleOffset;
          var offset = 4;

          // Background
          this.g.save();
          this.g.lineWidth = 2;
          this.g.fillStyle = this.o.bgColor;
          this.g.strokeStyle = "#656565";
          this.g.shadowOffsetX = 1;
          this.g.shadowOffsetY = 1;
          this.g.shadowBlur = 5;
          this.g.shadowColor = "rgba(0, 0, 0, 0.5)";
          this.g.beginPath();
          // The first arc() fills the area, and the second arc() substracts out the center area to make the circle hollow.
          this.g.arc(this.xy, this.xy, this.radius + this.lineWidth / 2 - offset - spinnerCircleOffset1 * pixelRatio, 1.2 * Math.PI, 0.8 * Math.PI, false);
          this.g.arc(this.xy, this.xy, this.radius - this.lineWidth / 2 - offset + spinnerCircleOffset2 * pixelRatio, 0.8 * Math.PI, 1.2 * Math.PI, true);
          this.g.stroke();
          this.g.fill();
          this.g.restore();

          // Cursor shadow
          this.g.save();
          this.o.cursor && ( sat = eat - this.cursorExt) && ( eat = eat + this.cursorExt);
          this.g.lineWidth = this.lineWidth + 2;
          this.g.globalAlpha = 0.4;
          this.g.beginPath();
          this.g.strokeStyle = "#656565";
          this.g.arc(this.xy, this.xy, this.radius - offset + 2, sat + 0.25, eat + 0.37, false);
          this.g.stroke();
          this.g.restore();

          // Cursor border
          this.o.cursor && ( sat = eat - this.cursorExt) && ( eat = eat + this.cursorExt);
          this.g.lineWidth = this.lineWidth + 2;
          this.g.beginPath();
          this.g.strokeStyle = "#656565";
          this.g.arc(this.xy, this.xy, this.radius - offset + 1, sat + 0.13, eat + 0.18, false);
          this.g.stroke();

          // Cursor background
          this.o.cursor && ( sat = eat - this.cursorExt) && ( eat = eat + this.cursorExt);
          this.g.lineWidth = this.lineWidth;
          this.g.beginPath();
          this.g.strokeStyle = this.o.bgColor;
          this.g.arc(this.xy, this.xy, this.radius - offset + 1, sat, eat, false);
          this.g.stroke();
          /*
           // Inner border
           this.g.lineWidth = 1;
           this.g.beginPath();
           this.g.strokeStyle = "#656565";
           this.g.arc(this.xy, this.xy, this.radius - this.lineWidth / 2 - offset - 3, 0, 2 * Math.PI, false);
           this.g.stroke();*/
          /*
           // Outer border
           this.g.lineWidth = 2;
           this.g.beginPath();
           this.g.strokeStyle = this.o.bgColor;
           this.g.arc(this.xy, this.xy, this.radius + this.lineWidth / 2 - offset + 3, 0, 2 * Math.PI, false);
           this.g.stroke();
           */
          return false;
        }
      }).on("mousedown", function() {
        originalIsPaused = timelapse.isPaused();
        if (!originalIsPaused)
          timelapse.handlePlayPause();
        if (locker == "month" && isPlaying)
          stopMonthLockFrames();
      });

      // Handle mouse leave iframe
      $monthSpinnerContainer.bind("mousedown", function() {
        if (window && (window.self !== window.top)) {
          $("body").one("mouseleave", function(event) {
            $monthSpinnerContainer.trigger("mouseup");
          });
        }
      });
    };

    function getPixelRatio() {
      var ctx = document.createElement("canvas").getContext("2d");
      // This is the pixel density of the device
      var dpr = window.devicePixelRatio || 1;
      // This is the pixel density of the canvas
      var bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backignStorePixelRatio || 1;
      return dpr / bsr;
    }

    var createSpeedControl = function() {
      // Toggle speed
      $fastSpeed = $('<button class="customToggleSpeed" title="Toggle playback speed">Fast</button>');
      $mediumSpeed = $('<button class="customToggleSpeed" title="Toggle playback speed">Medium</button>');
      $slowSpeed = $('<button class="customToggleSpeed" title="Toggle playback speed">Slow</button>');

      if (datasetType == "modis") {
        $fastSpeed.toggleClass("customToggleSpeed modisCustomToggleSpeed");
        $mediumSpeed.toggleClass("customToggleSpeed modisCustomToggleSpeed");
        $slowSpeed.toggleClass("customToggleSpeed modisCustomToggleSpeed");
      }

      var speedOptions = [$slowSpeed, $fastSpeed, $mediumSpeed];
      // Speeds < 0.5x in Safari, even if emulated, result in broken playback, so do not include the "slow" (0.25x) speed option
      if (isSafari)
        speedOptions.shift();

      $customControl.prepend(speedOptions);

      if (useTouchFriendlyUI) {
        $(".customToggleSpeed").addClass("customToggleSpeed-touchFriendly");
      }

      $fastSpeed.button({
        text: true
      }).click(function() {
        timelapse.setPlaybackRate(0.5, null, true);
        $customControl.prepend($mediumSpeed);
        $mediumSpeed.stop(true, true).show();
        $fastSpeed.slideUp(300);
        if (locker == "month" && isPlaying)
          playMonthLockFrames();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-speed-to-medium');
      });

      $mediumSpeed.button({
        text: true
      }).click(function() {
        // Due to playback issues, we are not allowing the "slow" option for Safari users
        if (isSafari) {
          timelapse.setPlaybackRate(1, null, true);
          $customControl.prepend($fastSpeed);
          $fastSpeed.stop(true, true).show();
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-speed-to-fast');
        } else {
          timelapse.setPlaybackRate(0.25, null, true);
          $customControl.prepend($slowSpeed);
          $slowSpeed.stop(true, true).show();
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-speed-to-slow');
        }
        $mediumSpeed.slideUp(300);
        if (locker == "month" && isPlaying)
          playMonthLockFrames();
      });

      $slowSpeed.button({
        text: true
      }).click(function() {
        timelapse.setPlaybackRate(1, null, true);
        $customControl.prepend($fastSpeed);
        $fastSpeed.stop(true, true).show();
        $slowSpeed.slideUp(300);
        if (locker == "month" && isPlaying)
          playMonthLockFrames();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-speed-to-fast');
      });

      timelapse.addPlaybackRateChangeListener(function(rate, skipUpdateUI) {
        if (!skipUpdateUI) {
          var snaplapse = timelapse.getSnaplapse();
          var snaplapseForSharedTour = timelapse.getSnaplapseForSharedTour();
          if ((snaplapse && snaplapse.isPlaying()) || (snaplapseForSharedTour && snaplapseForSharedTour.isPlaying()))
            return;
          $("#" + viewerDivId + " .customToggleSpeed").hide();
          if (rate >= 1) {
            $fastSpeed.show();
            $mediumSpeed.hide();
            $slowSpeed.hide();
          } else if ((rate < 1 && rate >= 0.5) || (isSafari && rate < 0.5)) {
            $mediumSpeed.show();
            $fastSpeed.hide();
            $slowSpeed.hide();
          } else {
            $slowSpeed.show();
            $mediumSpeed.hide();
            $fastSpeed.hide();
          }
        }
      });

      // Since the call to set the playback rate when first creating the timelapse
      // happens before the UI is setup, we need to run it again below to properly
      // update the UI.
      var playbackRate = timelapse.getPlaybackRate();
      if (playbackRate >= 1) {
        $fastSpeed.show();
      } else if (playbackRate < 1 && playbackRate >= 0.5) {
        $mediumSpeed.show();
      } else {
        $slowSpeed.show();
      }
    };

    var setLocker = function(lockType, status) {
      if (lockType == "year") {
        if (status == "enable") {
          locker = "year";
          timelapse.setLoopPlayback(false, true);
          var currentYear = getCurrentYear();
          yearLockMinPlaybackFrame = yearDictionary[currentYear]["previousStackEndIdx"] + 1;
          yearLockMaxPlaybackFrame = yearDictionary[currentYear]["currentStackEndIdx"];
        } else if (status == "disable") {
          locker = "none";
          timelapse.restoreLoopPlayback();
        }
      } else if (lockType == "month") {
        if (status == "enable") {
          locker = "month";
          if (isPlaying) {
            timelapse.pause();
            updateMonthLockPlaybackInterval();
          }
        } else if (status == "disable") {
          locker = "none";
          if (isPlaying) {
            clearTimeout(monthLockPlaybackInterval);
            monthLockPlaybackInterval = null;
            timelapse.play();
          }
        }
      }
    };

    // Gets a safe MODIS month lock value (String) from an unsafe object containing key-value pairs from the URL hash.
    var getModisLockFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.l) {
        var newMonthLock = String(unsafeHashObj.l);
        return newMonthLock;
      }
      return null;
    };

    var createLockControl = function() {
      $noLock = $('<button class="toggleLock" id="noLock" title="Click to lock playback to month">None</button>');
      $withLock = $('<button class="toggleLock" id="withLock" title="Playback locked to month, click to unlock">None</button>');
      var lockOptions = [$noLock, $withLock];
      $customControl.prepend(lockOptions);

      $noLock.button({
        icons: {
          primary: "ui-icon-unlocked"
        },
        text: false
      }).click(function() {
        setLocker("month", "enable");
        $customControl.prepend($withLock);
        $withLock.stop(true, true).slideDown();
        $noLock.slideUp(300);
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-enable-month-lock');
      });

      $withLock.button({
        icons: {
          primary: "ui-icon-locked"
        },
        text: false
      }).click(function() {
        setLocker("month", "disable");
        $customControl.prepend($noLock);
        $noLock.stop(true, true).slideDown();
        $withLock.slideUp(300);
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-disable-month-lock');
      });

      var unsafeHashObj = UTIL.getUnsafeHashVars();
      var modisLock = getModisLockFromHash(unsafeHashObj);
      if (modisLock == "month")
        $withLock.show();
      else
        $noLock.show();
    };

    var createCustomButtons = function() {
      createSpeedControl();

      if (datasetType == "modis")
        createLockControl();

      // Instruction mask
      var content_instruction = "";
      content_instruction += '<div class="customInstructions">';
      content_instruction += '  <span class="customZoomhelp"><p>'
      content_instruction += useTouchFriendlyUI ? 'Zoom in and out to explore in greater detail.' : 'Zoom in and out to explore in greater detail. Click or use the mouse scroll wheel.';
      content_instruction += '  </p></span>';
      content_instruction += '  <span class="customMovehelp"><p>';
      content_instruction += useTouchFriendlyUI ? 'Drag or pinch to explore in greater detail.' : 'Click and drag to explore.';
      content_instruction += '  </p></span>';
      content_instruction += '  <span class="customSpeedhelp"><p>';
      content_instruction += useTouchFriendlyUI ? 'Tap to toggle the playback speed.' : 'Click to toggle the playback speed.';
      content_instruction += '  </p></span>';
      content_instruction += '</div>';
      $viewer.append(content_instruction);
      $customSpeedhelp = $("#" + viewerDivId + " .customSpeedhelp");
      if (datasetType == "modis")
        $customSpeedhelp.toggleClass("customSpeedhelp modisCustomSpeedhelp");

      // Play and stop button
      $customControl.append('<button class="customPlay" title="Play"></button>');

      if (useTouchFriendlyUI) {
        $(".customPlay").addClass("customPlay-touchFriendly");
        $(".customInstructions").addClass("customInstructions-touchFriendly");
      }

      $customPlay = $("#" + viewerDivId + " .customPlay");
      $customPlay.button({
        icons: {
          primary: "ui-icon-custom-play"
        },
        text: false
      }).click(function() {
        if ($defaultUIPlaybackButton.hasClass("from_help"))
          return;
        if (locker == "month")
          handleMonthLockFramesPlayPause();
        else
          timelapse.handlePlayPause();
        isPlaying = !isPlaying;
        if (isPlaying)
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-play');
        else
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-pause');
      });
      if (datasetType == "modis")
        $customPlay.toggleClass("customPlay modisCustomPlay");

      // Help button
      $customControl.append('<input type="checkbox" class="customHelpCheckbox"/>');
      $customControl.append('<label class="customHelpLabel" title="Show instructions"></label>');

      if (useTouchFriendlyUI) {
        $(".customHelpLabel").addClass("customHelpLabel-touchFriendly");
      }

      var $customHelpCheckbox = $("#" + viewerDivId + " .customHelpCheckbox");
      $customHelpCheckbox.attr("id", timeMachineDivId + "_customHelpCheckbox");
      $customHelpLabel = $("#" + viewerDivId + " .customHelpLabel");
      $customHelpLabel.attr("for", timeMachineDivId + "_customHelpCheckbox");
      $customHelpCheckbox.button({
        icons: {
          primary: useTouchFriendlyUI ? "ui-icon-custom-help" : "ui-icon-help"
        },
        text: false
      }).change(function() {
        if ($customHelpCheckbox.is(":checked")) {
          doCustomHelpOverlay();
          $(document).one("mouseup", function(e) {
            if ($("#" + viewerDivId + " .customHelpCheckbox").has(e.target).length == 0)
              $customHelpCheckbox.prop("checked", false).button("refresh").change();
          });
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-show-help');
        } else {
          removeCustomHelpOverlay();
        }
      });
    };

    var createCustomTimeline = function() {
      // Create slider container
      $timeText = $('<div class="timeText"></div>');
      if (datasetType == "modis")
        $timeText.toggleClass("timeText modisTimeText");
      $customTimeline = $('<div class="customTimeline"></div>');
      $customControl.append($timeText, $customTimeline);
      if (useTouchFriendlyUI) {
        $(".customTimeline").addClass("customTimeline-touchFriendly");
        $(".timeText").addClass("timeText-touchFriendly");
      }
      var extraSliderLeftMargin = (datasetType == "landsat") ? 50 : 60;
      sliderLeftMargin = $customPlay.width() + $timeText.width() + extraSliderLeftMargin;
      var extraSliderRightMargin;
      if (datasetType == "landsat") {
        if (settings["isHyperwall"] && fields.fullControls != "true")
          extraSliderRightMargin = 5;
        else
          extraSliderRightMargin = 35;
      } else
        extraSliderRightMargin = 40;
      sliderRightMargin = $customHelpLabel.width() + extraSliderRightMargin;
      $customTimeline.css({
        "left": sliderLeftMargin + "px",
        "right": sliderRightMargin + "px"
      });

      // Create left, right, and hover date text
      $timeTextLeft = $('<div class="timeTextLeft"></div>');
      $timeTextRight = $('<div class="timeTextRight"></div>');
      $timeTextHover = $('<div class="timeTextHover"></div>');
      $customTimeline.append($timeTextLeft, $timeTextRight, $timeTextHover);

      // Create current time bar
      $currentTimeTick = $('<div class="currentTimeTick"></div>');
      $customTimeline.append($currentTimeTick);
      $currentTimeTick.css({
        "top": "0px",
        "left": "0px",
        "width": currentTimeTick_width + "px",
        "height": currentTimeTick_height + "px",
        "margin-left": (currentTimeTick_width / -2) + "px"
      });

      // Create time tick
      // Calculate the space between time ticks
      var numTicks = numYears;
      if (datasetType == "modis")
        numTicks = numTicks + 1;
      timeTickSpan = 100 / numTicks;
      var previousTargetFrameIdx = undefined;
      var targetFrame, targetFrameX, previousTargetFrameX, invisibleSpan;
      for (var i = 0; i < numYears; i++) {
        targetFrame = yearDictionary[firstYear + i]["previousStackEndIdx"] + 1;
        // Save the x position of every frame
        frameDictionary[targetFrame]["x"] = timeTickSpan * (i + 0.5);
        // Save the x position of every time tick
        timeTickX[i] = timeTickSpan * (i + 0.5);
        // In Landsat, frameDictionary and timeTickX are the same.
        // In MODIS, they are different. So we need to compute frameDictionary.
        if (previousTargetFrameIdx != undefined && datasetType == "modis") {
          targetFrameX = frameDictionary[targetFrame]["x"];
          previousTargetFrameX = frameDictionary[previousTargetFrameIdx]["x"];
          invisibleSpan = (targetFrameX - previousTargetFrameX) / (targetFrame - previousTargetFrameIdx);
          for (var j = previousTargetFrameIdx + 1; j < targetFrame; j++)
            frameDictionary[j]["x"] = frameDictionary[j - 1]["x"] + invisibleSpan;
        }
        previousTargetFrameIdx = targetFrame;
        var $timeTick = $('<div class="timeTick" id="' + timeMachineDivId + "_customTimeline_timeTick_" + i + '"></div>');
        var $timeTickContainer = $('<div class="timeTickContainer" id="' + timeMachineDivId + "_customTimeline_timeTickContainer_" + i + '"></div>');
        var $timeTickClickRegion = $('<div class="timeTickClickRegion" id="' + timeMachineDivId + "_customTimeline_timeTickClickRegion_" + i + '"></div>');
        $timeTickContainer.css({
          "top": "0px",
          "left": (timeTickSpan * i) + "%",
          "width": timeTickSpan + "%",
          "height": currentTimeTick_height + 28 + "px"
        });
        $timeTickClickRegion.css({
          "top": "0px",
          "left": "0px",
          "width": "100%",
          "height": "100%"
        }).attr("tabindex", i);
        $timeTick.css({
          "margin-top": ((currentTimeTick_height - timeTick_height) / 2) + "px",
          "width": timeTick_width + "px",
          "height": timeTick_height + "px"
        });
        $timeTickContainer.on("mouseenter", handleTimeTickMouseover).on("mouseleave", handleTimeTickMouseout).on("mousedown", handleTimeTickMousedown);
        $timeTickContainer.append($timeTick, $timeTickClickRegion);
        $customTimeline.append($timeTickContainer);
      }
      // This part is used for creating the dot showing the final frame
      if (datasetType == "modis") {
        frameDictionary[endFrameIdx]["x"] = timeTickSpan * (numYears + 0.5);
        var endFrameX = frameDictionary[endFrameIdx]["x"];
        previousTargetFrameX = frameDictionary[previousTargetFrameIdx]["x"];
        invisibleSpan = (endFrameX - previousTargetFrameX) / (endFrameIdx - previousTargetFrameIdx);
        for (var j = previousTargetFrameIdx + 1; j < endFrameIdx; j++)
          frameDictionary[j]["x"] = frameDictionary[j - 1]["x"] + invisibleSpan;
        var $endTimeDotContainer = $('<div class="endTimeDotContainer"></div>');
        var $endTimeDotClickRegion = $('<div class="endTimeDotClickRegion"></div>');
        $endTimeDot = $('<div class="endTimeDot"></div>');
        $endTimeDotContainer.css({
          "top": "0px",
          "left": (timeTickSpan * numYears) + "%",
          "width": timeTickSpan + "%",
          "height": currentTimeTick_height + 28 + "px"
        });
        $endTimeDotClickRegion.css({
          "top": "0px",
          "left": "0px",
          "width": "100%",
          "height": "100%"
        }).attr("tabindex", i);
        $endTimeDot.css({
          "margin-top": ((currentTimeTick_height / 2) - (endTimeDot_radius / 2)) + "px",
          "width": endTimeDot_radius + "px",
          "height": endTimeDot_radius + "px",
          "border-radius": (endTimeDot_radius / 2) + "px"
        });
        $endTimeDotContainer.on("mouseenter", handleEndTimeDotMouseover).on("mouseleave", handleEndTimeDotMouseout).on("mousedown", handleEndTimeDotMousedown);
        $endTimeDotContainer.append($endTimeDot, $endTimeDotClickRegion);
        $customTimeline.append($endTimeDotContainer);
      }
      var firstFrameForFirstYear = frameDictionary[0];
      $timeTextLeft.text(firstFrameForFirstYear["year"]).css({
        "left": firstFrameForFirstYear["x"] + "%",
        "top": currentTimeTick_height + (useTouchFriendlyUI ? 8 : 5) + "px",
        "margin-left": ($timeTextLeft.width() / -2) + "px"
      });
      var firstFrameForEndYear = frameDictionary[yearDictionary[endYear]["previousStackEndIdx"] + 1];
      $timeTextRight.text(firstFrameForEndYear["year"]).css({
        "left": firstFrameForEndYear["x"] + "%",
        "top": currentTimeTick_height + (useTouchFriendlyUI ? 8 : 5) + "px",
        "margin-left": ($timeTextRight.width() / -2) + "px"
      });
      $timeTextHover.text(firstFrameForFirstYear["year"]).css({
        "left": "50%",
        "top": currentTimeTick_height + (useTouchFriendlyUI ? 8 : 5) + "px",
        "margin-left": ($timeTextHover.width() / -2) + "px"
      });
      videoset.addEventListener('sync', function() {
        updateTimelineSlider(timelapse.getCurrentFrameNumber());
      });
      updateTimelineSlider(0);
    };

    var handleEndTimeDotMousedown = function(event) {
      originalIsPaused = timelapse.isPaused();
      if (!originalIsPaused)
        timelapse.handlePlayPause();
      if (locker != "month")
        seekToFrame(endFrameIdx, locker);
      else {
        if (isPlaying)
          stopMonthLockFrames();
      }
      isShowHoverEffect = false;
      // Track mouse
      $viewer.on("mousemove", trackMouseAndSlide);
      $(document).one("mouseup", function(event) {
        if (!originalIsPaused)
          timelapse.handlePlayPause();
        if (locker == "month" && isPlaying)
          playMonthLockFrames();
        $viewer.off("mousemove", trackMouseAndSlide);
        isShowHoverEffect = true;
      });
    };

    var handleEndTimeDotMouseover = function(event) {
      if (isShowHoverEffect) {
        $endTimeDot.stop(true, true).animate({
          "margin-top": ((currentTimeTick_height / 2) - (endTimeDotGrow_radius / 2)) + "px",
          "width": endTimeDotGrow_radius + "px",
          "height": endTimeDotGrow_radius + "px"
        }, {
          duration: 100
        });
      }
    };

    var handleEndTimeDotMouseout = function(event) {
      $endTimeDot.stop(true, true).animate({
        "margin-top": ((currentTimeTick_height / 2) - (endTimeDot_radius / 2)) + "px",
        "width": endTimeDot_radius + "px",
        "height": endTimeDot_radius + "px"
      }, {
        duration: 50
      });
    };

    var handleTimeTickMousedown = function(event) {
      originalIsPaused = timelapse.isPaused();
      if (!originalIsPaused)
        timelapse.handlePlayPause();
      var currentYearIdx = parseInt(this.id.split("_")[3]);
      var currentYear = firstYear + currentYearIdx;
      if (locker != "year") {
        if (locker == "month") {
          if (isPlaying)
            stopMonthLockFrames();
          seekToFrame(currentYearIdx, "month");
        } else
          seekToFrame(yearDictionary[currentYear]["previousStackEndIdx"] + 1, locker);
        focusTimeTick(timelapse.getCurrentFrameNumber());
      }
      isShowHoverEffect = false;
      $(event.target).removeClass("openHand").addClass("closedHand");
      // Track mouse
      $viewer.on("mousemove", trackMouseAndSlide);
      $(document).one("mouseup", function(event) {
        $(event.target).removeClass("closedHand").addClass("openHand");
        if (!originalIsPaused)
          timelapse.handlePlayPause();
        if (locker == "month" && isPlaying)
          playMonthLockFrames();
        $viewer.off("mousemove", trackMouseAndSlide);
        isShowHoverEffect = true;
      });
      UTIL.addGoogleAnalyticEvent('slider', 'click', 'viewer-seek');
    };

    var handleTimeTickMouseover = function(event) {
      if (isShowHoverEffect) {
        var currentYearIdx = firstYear + parseInt(this.id.split("_")[3]);
        var currentFrameIdx = yearDictionary[currentYearIdx]["previousStackEndIdx"] + 1;
        if (timelapse.getCurrentFrameNumber() == currentFrameIdx)
          $(event.target).removeClass("closedHand").addClass("openHand").attr("title", "Drag to go to a different point in time");
        else
          $(event.target).attr("title", "");
        var $timeTickContainer = $(event.target).parent();
        var $timeTick = $timeTickContainer.children("#" + viewerDivId + " .timeTick");
        growTimeTick($timeTick);
        if (currentYearIdx != firstYear && currentYearIdx != endYear)
          $timeTickContainer.append($timeTextHover.text(frameDictionary[currentFrameIdx]["year"]).stop(true, true).fadeIn(200));
      } else
        $(event.target).addClass("closedHand");
    };

    var handleTimeTickMouseout = function(event) {
      $(event.target).removeClass("openHand closedHand");
      var $timeTickContainer = $(event.target).parent();
      var $timeTick = $timeTickContainer.children("#" + viewerDivId + " .timeTick");
      resetTimeTick($timeTick);
      $timeTextHover.fadeOut(50);
    };

    var growTimeTick = function($timeTick) {
      $timeTick.stop(true, true).animate({
        "margin-top": ((currentTimeTick_height - timeTickGrow_height) / 2) + "px",
        "width": timeTickGrow_width + "px",
        "height": timeTickGrow_height + "px"
      }, {
        duration: 100
      });
    };

    var resetTimeTick = function($timeTick) {
      $timeTick.stop(true, true).animate({
        "margin-top": (timeTick_height / 2) + "px",
        "width": timeTick_width + "px",
        "height": timeTick_height + "px"
      }, {
        duration: 50
      });
    };

    var trackMouseAndSlide = function(event) {
      var sliderWidth = $customTimeline.width();
      var nowXpx = event.pageX - viewer_offset.left - sliderLeftMargin;
      var nowX = (nowXpx / sliderWidth) * 100;
      var targetFrameIdx;

      if (datasetType == "modis")
        targetFrameIdx = computeSliderHandlePosition_modis(nowX);
      else
        targetFrameIdx = computeSliderHandlePosition_landsat(nowX);

      if (locker == "month") {
        var currentYearIdx = getCurrentYear() - firstYear;
        if (currentYearIdx != targetFrameIdx)
          seekToFrame(targetFrameIdx, locker);
      } else {
        var currentFrameIdx = timelapse.getCurrentFrameNumber();
        if (currentFrameIdx != targetFrameIdx)
          timelapse.seekToFrame(targetFrameIdx);
      }

      $("#" + timeMachineDivId + "_customTimeline_timeTickClickRegion_" + targetFrameIdx).focus();
    };

    var computeSliderHandlePosition_landsat = function(nowX) {
      // Binary search
      var minFrameIdx = 0;
      var maxFrameIdx = frameDictionary.length - 1;
      var targetFrameIdx;
      while (minFrameIdx != maxFrameIdx) {
        targetFrameIdx = Math.round((minFrameIdx + maxFrameIdx) / 2);
        if (nowX <= frameDictionary[targetFrameIdx]["x"])
          maxFrameIdx = targetFrameIdx;
        else
          minFrameIdx = targetFrameIdx;
        if (maxFrameIdx == minFrameIdx + 1) {
          if (frameDictionary[maxFrameIdx]["x"] - nowX <= nowX - frameDictionary[minFrameIdx]["x"])
            targetFrameIdx = maxFrameIdx;
          else
            targetFrameIdx = minFrameIdx;
          break;
        }
      }
      return targetFrameIdx;
    };

    var computeSliderHandlePosition_modis = function(nowX) {
      // Binary search
      var minFrameIdx;
      var maxFrameIdx;
      var totalFrames = timelapse.getNumFrames();

      if (locker == "year") {
        var currentYear = getCurrentYear();
        minFrameIdx = yearDictionary[currentYear]["previousStackEndIdx"] + 1;
        maxFrameIdx = yearDictionary[currentYear]["currentStackEndIdx"];
        if (maxFrameIdx > totalFrames)
          maxFrameIdx = totalFrames - 1;
      } else if (locker == "month") {
        minFrameIdx = 0;
        maxFrameIdx = numYears - 1;
      } else {
        minFrameIdx = 0;
        maxFrameIdx = totalFrames - 1;
      }

      var targetFrameIdx;
      while (minFrameIdx != maxFrameIdx) {
        targetFrameIdx = Math.round((minFrameIdx + maxFrameIdx) / 2);
        var targetFramePositionX;
        if (locker == "month")
          targetFramePositionX = timeTickX[targetFrameIdx];
        else
          targetFramePositionX = frameDictionary[targetFrameIdx]["x"];
        if (nowX <= targetFramePositionX)
          maxFrameIdx = targetFrameIdx;
        else
          minFrameIdx = targetFrameIdx;
        if (maxFrameIdx == minFrameIdx + 1) {
          var maxFramePositionX;
          var minFramePositionX;
          if (locker == "month") {
            maxFramePositionX = timeTickX[maxFrameIdx];
            minFramePositionX = timeTickX[minFrameIdx];
          } else {
            maxFramePositionX = frameDictionary[maxFrameIdx]["x"];
            minFramePositionX = frameDictionary[minFrameIdx]["x"];
          }
          if (maxFramePositionX - nowX <= nowX - minFramePositionX)
            targetFrameIdx = maxFrameIdx;
          else
            targetFrameIdx = minFrameIdx;
          break;
        }
      }
      return targetFrameIdx;
    };

    var doCustomHelpOverlay = function() {
      $("#" + viewerDivId + " .customInstructions").fadeIn(200);
      if (locker == "month" && isPlaying)
        stopMonthLockFrames();
      if ($defaultUIPlaybackButton.hasClass('pause')) {
        timelapse.handlePlayPause();
        $defaultUIPlaybackButton.removeClass("pause").addClass("play from_help");
      }
    };

    var removeCustomHelpOverlay = function() {
      $("#" + viewerDivId + " .customInstructions").fadeOut(200);
      if (locker == "month" && isPlaying)
        playMonthLockFrames();
      if ($defaultUIPlaybackButton.hasClass('from_help')) {
        $defaultUIPlaybackButton.addClass("pause").removeClass("play from_help");
        timelapse.handlePlayPause();
      }
    };

    var getCurrentYear = function() {
      return parseInt($timeText.text());
    };

    var seekToFrame = function(desiredIdx, constraint, yearOffset) {
      var desiredFrameIdx = desiredIdx;
      if (datasetType == "modis") {
        var currentYear = getCurrentYear();
        if (constraint == "month") {
          // Fix month and seek to target year
          var desiredYear = desiredIdx + firstYear;
          var currentFrame = timelapse.getCurrentFrameNumber();
          var currentMonthIdx = frameDictionary[currentFrame]["monthFrameIdx"];
          var maxDesiredMonthIdx = yearDictionary[desiredYear]["maxSpinnerValue"];
          var minDesiredMonthIdx = yearDictionary[desiredYear]["minSpinnerValue"];
          if (currentMonthIdx > maxDesiredMonthIdx || currentMonthIdx < minDesiredMonthIdx)
            return;
          if (desiredYear == firstYear)
            currentMonthIdx -= firstYearFrameOffset;
          desiredFrameIdx = yearDictionary[desiredYear]["previousStackEndIdx"] + 1 + currentMonthIdx;
        } else if (constraint == "year") {
          // Fix year and seek to target month
          var desiredMonthIdx = desiredIdx;
          if (yearOffset) {
            currentYear += yearOffset;
            if (currentYear > endYear)
              currentYear = endYear;
            else if (currentYear < firstYear)
              currentYear = firstYear;
            if (yearOffset > 0)
              desiredMonthIdx = 0;
            else if (yearOffset < 0)
              desiredMonthIdx = yearDictionary[currentYear]["maxSpinnerValue"];
          }
          if (currentYear == firstYear)
            desiredMonthIdx -= firstYearFrameOffset;
          desiredFrameIdx = yearDictionary[currentYear]["previousStackEndIdx"] + 1 + desiredMonthIdx;
        }
      }
      timelapse.seekToFrame(desiredFrameIdx);
    };

    var computeMonthLockPlaybackFrames = function() {
      monthLockPlaybackFrames = [];
      var currentFrame = timelapse.getCurrentFrameNumber();
      var currentMonthIdx = frameDictionary[currentFrame]["monthFrameIdx"];
      // Compute the frame indicies that we need to loop through for the selected month
      for (var i = firstYear; i <= endYear; i++) {
        var year = yearDictionary[i];
        if (currentMonthIdx < year["minSpinnerValue"] || currentMonthIdx > year["maxSpinnerValue"])
          continue;
        var frameIdx = year["previousStackEndIdx"] + 1 + currentMonthIdx;
        if (i == firstYear)
          frameIdx -= firstYearFrameOffset;
        monthLockPlaybackFrames.push(frameIdx);
      }
    };

    var playMonthLockFrames = function() {
      updateMonthLockPlaybackInterval();
      $customPlay.button({
        icons: {
          primary: "ui-icon-custom-pause"
        }
      });
    };

    var setMonthLockPlaybackSpeed = function() {
      var speed = timelapse.getPlaybackRate();
      var desiredSpeed = (1000 / (speed * fps)) * 2;
      if (monthLockPlaybackIdx == 0 || monthLockPlaybackIdx == monthLockPlaybackFrames.length - 1)
        monthLockPlaybackSpeed = 500 + desiredSpeed;
      else
        monthLockPlaybackSpeed = desiredSpeed;
    };

    var startMonthLockPlaybackInterval = function() {
      monthLockPlaybackInterval = setTimeout(function() {
        setMonthLockPlaybackSpeed();
        timelapse.seekToFrame(monthLockPlaybackFrames[monthLockPlaybackIdx]);
        monthLockPlaybackIdx++;
        if (monthLockPlaybackIdx >= monthLockPlaybackFrames.length)
          monthLockPlaybackIdx = 0;
        startMonthLockPlaybackInterval();
      }, monthLockPlaybackSpeed);
    };

    var updateMonthLockPlaybackInterval = function() {
      clearTimeout(monthLockPlaybackInterval);
      setMonthLockPlaybackSpeed();
      monthLockPlaybackInterval = null;
      computeMonthLockPlaybackFrames();
      startMonthLockPlaybackInterval();
    };

    var stopMonthLockFrames = function() {
      clearTimeout(monthLockPlaybackInterval);
      monthLockPlaybackInterval = null;
      $customPlay.button({
        icons: {
          primary: "ui-icon-custom-play"
        }
      });
    };

    var handleMonthLockFramesPlayPause = function() {
      if (!isPlaying)
        playMonthLockFrames();
      else
        stopMonthLockFrames();
    };

    var updateTimelineSlider = function(frameIdx) {
      if (frameIdx < 0 || frameIdx > numFrames - 1)
        return;
      var currentYear = frameDictionary[frameIdx]["year"];
      if (datasetType == "modis") {
        $monthSpinnerTxt.text(frameDictionary[frameIdx]["monthText"]);
        $monthSpinner.val(frameDictionary[frameIdx]["monthFrameIdx"]).trigger('change');
      }
      $currentTimeTick.css("left", frameDictionary[frameIdx]["x"] + "%");
      $timeText.text(currentYear);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    var focusTimeTick = function(frameIdx) {
      var elementIdx = frameIdx;
      if (datasetType == "modis")
        elementIdx = frameDictionary[frameIdx]["year"] - firstYear;
      $("#" + timeMachineDivId + "_customTimeline_timeTickClickRegion_" + elementIdx).focus();
    };
    this.focusTimeTick = focusTimeTick;

    this.getLocker = function() {
      return locker;
    };

    this.isPlaying = function() {
      return isPlaying;
    };

    this.handleHyperwallChangeUI = function() {
      var isShowControls = ( typeof (fields.showControls) != "undefined" && fields.showControls == "true");
      var isFullControls = ( typeof (fields.fullControls) != "undefined" && fields.fullControls == "true");

      if (!isShowControls || !isFullControls)
        $("#" + viewerDivId + " .sideToolBar").remove();

      if (!isShowControls) {
        $customControl.hide();
        $("#" + viewerDivId + " .scaleBarContainer").remove();
      }

      if (!isFullControls) {
        $("#" + viewerDivId + " .customToggleSpeed").remove();
        $customHelpLabel.remove();
        $customPlay.remove();
        $timeText.css({
          "text-align": "center",
          "left": "-=" + 18 + "px",
          "padding-left": "30px",
          "padding-right": "25px"
        });
      }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    if (datasetType == "modis")
      preProcessModis();
    else
      preProcessLandsat();

    createCustomControl();

    if (timelapse.getPlayOnLoad()) {
      $customPlay.click();
      $customPlay.button({
        icons: {
          primary: "ui-icon-custom-pause"
        }
      });
    }
  };
  //end of org.gigapan.timelapse.CustomUI
})();
//end of (function() {