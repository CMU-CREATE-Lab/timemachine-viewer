// @license
// Redistribution and use in source and binary forms ...

// Class for managing a timelapse.
//
// Dependencies:
// * org.gigapan.Util
// * org.gigapan.timelapse.Videoset
// * org.gigapan.timelapse.VideosetStats
// * jQuery (http://jquery.com/)
//
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
// Yen-Chia Hsu (legenddolphin@gmail.com)
// Randy Sargent (randy.sargent@cs.cmu.edu)
//
// VERIFY NAMESPACE
//
// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.

"use strict";

var org;
var availableTimelapses = [];
var browserSupported;
var timelapseMetadata;

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
// DEPENDECIES
//
if (!org.gigapan.Util) {
  var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Timelapse";
  alert(noUtilMsg);
  throw new Error(noUtilMsg);
}
if (!org.gigapan.timelapse.Videoset) {
  var noVideosetMsg = "The org.gigapan.timelapse.Videoset library is required by org.gigapan.timelapse.Timelapse";
  alert(noVideosetMsg);
  throw new Error(noVideosetMsg);
}
if (!org.gigapan.timelapse.parabolicMotion) {
  var noVideosetMsg = "The org.gigapan.timelapse.parabolicMotion library is required by org.gigapan.timelapse.Timelapse";
  alert(noVideosetMsg);
  throw new Error(noVideosetMsg);
}
if (!window['$']) {
  var nojQueryMsg = "The jQuery library is required by org.gigapan.timelapse.Timelapse";
  alert(nojQueryMsg);
  throw new Error(nojQueryMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.Timelapse = function(timeMachineDivId, settings) {
    availableTimelapses.push(this);

    // Settings
    var isHyperwall = settings["isHyperwall"] || false;
    var loopPlayback = settings["loopPlayback"] || true;
    var customLoopPlaybackRates = settings["customLoopPlaybackRates"] || null;
    var playOnLoad = settings["playOnLoad"] || false;
    var playbackSpeed = settings["playbackSpeed"] && UTIL.isNumber(settings["playbackSpeed"]) ? settings["playbackSpeed"] : 1;
    var datasetLayer = settings["layer"] && UTIL.isNumber(settings["layer"]) ? settings["layer"] : 0;
    var initialTime = settings["initialTime"] && UTIL.isNumber(settings["initialTime"]) ? settings["initialTime"] : 0;
    var initialView = settings["initialView"] || null;
    // deprecated
    var doChromeSeekableHack = ( typeof (settings["doChromeSeekableHack"]) == "undefined") ? true : settings["doChromeSeekableHack"];
    // deprecated
    var doChromeBufferedHack = ( typeof (settings["doChromeBufferedHack"]) == "undefined") ? true : settings["doChromeBufferedHack"];
    var doChromeCacheBreaker = ( typeof (settings["doChromeCacheBreaker"]) == "undefined") ? true : settings["doChromeCacheBreaker"];
    var loopDwell = ( typeof (settings["loopDwell"]) == "undefined" || typeof (settings["loopDwell"]["startDwell"]) == "undefined" || typeof (settings["loopDwell"]["endDwell"]) == "undefined") ? null : settings["loopDwell"];
    var startDwell = (!loopDwell || typeof (settings["loopDwell"]["startDwell"]) == "undefined") ? 0 : settings["loopDwell"]["startDwell"];
    var endDwell = (!loopDwell || typeof (settings["loopDwell"]["endDwell"]) == "undefined") ? 0 : settings["loopDwell"]["endDwell"];
    var blackFrameDetection = ( typeof (settings["blackFrameDetection"]) == "undefined") ? false : settings["blackFrameDetection"];
    var skippedFramesAtEnd = ( typeof (settings["skippedFramesAtEnd"]) == "undefined" || settings["skippedFramesAtEnd"] < 0) ? 0 : settings["skippedFramesAtEnd"];
    var skippedFramesAtStart = ( typeof (settings["skippedFramesAtStart"]) == "undefined" || settings["skippedFramesAtStart"] < 0) ? 0 : settings["skippedFramesAtStart"];
    var enableMetadataCacheBreaker = settings["enableMetadataCacheBreaker"] || false;
    var enableContextMapOnDefaultUI = ( typeof (settings["enableContextMapOnDefaultUI"]) == "undefined") ? false : settings["enableContextMapOnDefaultUI"];
    var datasetType = settings["datasetType"];
    var useCustomUI = (settings["datasetType"] == "landsat" || settings["datasetType"] == "modis");
    var visualizerGeometry = {
      width: 250,
      height: 142
    };
    var minViewportHeight = 370;
    var minViewportWidth = 540;
    var defaultLoopDwellTime = 0.5;

    // If the user requested a tour editor AND has a div in the DOM for the editor,
    // then do all related edtior stuff (pull thumbnails for keyframes, etc.)
    // Otherwise, we will still handle tours but no editor will be displayed.
    // (No thumbnails for keyframes pulled and loading a tour will display a load
    // button with the tour name on the center of the viewport.)
    var editorEnabled = ( typeof (settings["enableEditor"]) == "undefined") ? false : settings["enableEditor"];
    var presentationSliderEnabled = ( typeof (settings["enablePresentationSlider"]) == "undefined") ? false : settings["enablePresentationSlider"];
    var annotatorEnabled = ( typeof (settings["enableAnnotator"]) == "undefined") ? false : settings["enableAnnotator"];

    // Objects
    var videoset;
    var snaplapse;
    var snaplapseForSharedTour;
    var snaplapseForPresentationSlider;
    var scaleBar;
    var smallGoogleMap;
    var annotator;
    var customUI;
    var defaultUI;
    var visualizer;

    // DOM elements
    var dataPanesId;

    // Canvas version
    var canvas;
    var blackFrameDetectionCanvas;

    // Full screen variables
    var fullScreen = false;
    var videoStretchRatio = 1;
    var scaleRatio = 1;

    // Flags
    var isSplitVideo = false;
    var isSafari = UTIL.isSafari();
    var isIE = UTIL.isIE();
    var isIE9 = UTIL.isIE9();
    var doingLoopingDwell = false;
    var isFirefox = UTIL.isFirefox();
    var enableSmallGoogleMap = true;
    var enablePanoVideo = true;
    var isChrome = UTIL.isChrome();
    var loadTimelapseWithPreviousViewAndTime = false;
    var didHashChangeFirstTimeOnLoad = false;
    var didFirstTimeOnLoad = false;

    // Viewer
    var viewerDivId = timeMachineDivId + " .player";
    var viewerType;
    var videoDiv;
    var tiles = {};
    var framesPerFragment = 0;
    var secondsPerFragment = 0;
    var panoWidth = 0;
    var panoHeight = 0;
    var viewportWidth = 0;
    var viewportHeight = 0;
    var tileWidth = 0;
    var tileHeight = 0;
    var videoWidth = 0;
    var videoHeight = 0;
    var frames = 0;
    var maxLevel = 0;
    var levelInfo;
    var metadata = null;
    var view = null;
    var targetView = {};
    var currentIdx = null;
    var currentVideo = null;
    var animateInterval = null;
    var lastAnimationTime;
    var keyIntervals = [];
    var targetViewChangeListeners = [];
    var viewChangeListeners = [];
    var viewEndChangeListeners = [];
    var playbackRateChangeListeners = [];
    var thisObj = this;
    var tmJSON;
    var datasetJSON = null;
    var videoDivId;
    var datasetIndex;
    var datasetPath;
    var tileRootPath;
    var customPlaybackTimeout = null;
    var projectionType;
    var loopStartTimeoutId;
    var loopEndTimeoutId;
    var timelapseDurationInSeconds = 0.0;
    var timelapseCurrentTimeInSeconds = 0.0;
    var timelapseCurrentCaptureTimeIndex = 0;
    var captureTimes = [];
    var homeView;
    var panoView;
    var firstVideoId;
    var originalPlaybackRate = playbackSpeed;
    var originalLoopPlayback = loopPlayback;
    var translationSpeedConstant = 20;
    var parabolicMotionController;
    var parabolicMotionObj = org.gigapan.timelapse.parabolicMotion;
    var previousCaptureTime;
    var mediaType = null;
    var desiredInitialDate;
    var onNewTimelapseLoadCompleteCallBack;

    // animateRate in milliseconds, 40 means 25 FPS
    var animateRate = isHyperwall ? 10 : 40;
    // animationFractionPerSecond, 3 means goes 300% toward goal in 1 sec
    var animationFractionPerSecond = isHyperwall ? 3 : 5;
    // minTranslateSpeedPixelsPerSecond in pixels
    var minTranslateSpeedPixelsPerSecond = isHyperwall ? 25 : 25;
    // minZoomSpeedPerSecond in log2 scale
    // If animateRate is halved, minZoomSpeedPerSecond should also be halved.
    var minZoomSpeedPerSecond = isHyperwall ? 0.0001 : 0.125;
    // How fast we move the camera along the parabolic path
    var parabolicMotionPathSpeed = 1.35;

    // Joystick Variables
    var isJoystickButtonPressed = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    var joystickTimers = [0.0, 0.0];

    // levelThreshold sets the quality of display by deciding what level of tile to show for a given level of zoom:
    //  1.0: select a tile that's shown between 50% and 100% size  (never supersample)
    //  0.5: select a tile that's shown between 71% and 141% size
    //  0.0: select a tile that's shown between 100% and 200% size (never subsample)
    // -0.5: select a tile that's shown between 141% and 242% size (always supersample)
    // -1.0: select a tile that's shown between 200% and 400% size (always supersample)
    var defaultLevelThreshold = 0.05;
    var levelThreshold = defaultLevelThreshold;

    // Scale bar, small google map, visualizer
    var panoVideo;
    var topLevelVideo = {};
    var leader;

    // Constants
    var CONSTANTS = {
      COORDINATE_SYSTEM: {
        PIXEL: 0,
        LAT_LNG: 1
      },
      VIEW_FIT: {
        CENTER: 0,
        BOUNDING_BOX: 1
      }
    };
    this.CONSTANTS = CONSTANTS;

    var rootAppURL = org.gigapan.Util.getRootAppURL();

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.getHomeView = function() {
      return homeView;
    };

    this.getPanoView = function() {
      return panoView;
    };

    this.getDatasetType = function() {
      return datasetType;
    };

    this.useCustomUI = function() {
      return useCustomUI;
    };

    this.getStartDwell = function() {
      return startDwell;
    };

    this.getEndDwell = function() {
      return endDwell;
    };

    this.getPlayOnLoad = function() {
      return playOnLoad;
    };

    this.setMinZoomSpeedPerSecond = function(value) {
      minZoomSpeedPerSecond = value;
    };

    this.setMinTranslateSpeedPixelsPerSecond = function(value) {
      minTranslateSpeedPixelsPerSecond = value;
    };

    this.setAnimateRate = function(value) {
      animateRate = value;
    };

    this.setAnimationFractionPerSecond = function(value) {
      animationFractionPerSecond = value;
    };

    this.getSettings = function() {
      return settings;
    };

    this.isDoingLoopingDwell = function() {
      return doingLoopingDwell;
    };

    this.isEditorEnabled = function() {
      return editorEnabled;
    };

    this.isPresentationSliderEnabled = function() {
      return presentationSliderEnabled;
    };

    this.isAnnotatorEnabled = function() {
      return annotatorEnabled;
    };

    this.getDefaultUI = function() {
      return defaultUI;
    };

    this.getCustomUI = function() {
      return customUI;
    };

    this.getMinViewportHeight = function() {
      return minViewportHeight;
    };

    this.getMinViewportWidth = function() {
      return minViewportWidth;
    };

    // Used by defaultUI to switch between modes (player, editor, etc)
    // TODO: Rename?
    this.getMode = function() {
      return defaultUI.getMode();
    };

    this.getTimelapseCurrentCaptureTimeIndex = function() {
      return timelapseCurrentCaptureTimeIndex;
    };

    this.getCaptureTimes = function() {
      return captureTimes;
    };

    this.getCurrentCaptureTime = function() {
      return captureTimes[timelapseCurrentCaptureTimeIndex];
    };

    this.doChromeSeekableHack = function() {
      return doChromeSeekableHack;
    };

    this.doChromeBufferedHack = function() {
      return doChromeBufferedHack;
    };

    this.doChromeCacheBreaker = function() {
      return doChromeCacheBreaker;
    };

    this.getSmallGoogleMap = function() {
      return smallGoogleMap;
    };

    this.getScaleBar = function() {
      return scaleBar;
    };

    this.getVideoStretchRatio = function() {
      return videoStretchRatio;
    };

    this.getScaleRatio = function() {
      return scaleRatio;
    };

    this.getVisualizer = function() {
      return visualizer;
    };

    this.setSmallGoogleMapEnableStatus = function(status) {
      enableSmallGoogleMap = status;
    };

    this.isSmallGoogleMapEnable = function() {
      return enableSmallGoogleMap;
    };

    this.getTimeMachineDivId = function() {
      return timeMachineDivId;
    };

    this.getViewerDivId = function() {
      return viewerDivId;
    };

    this.getVideoDivId = function() {
      return videoDivId;
    };

    this.getSnaplapse = function() {
      return snaplapse;
    };

    this.getSnaplapseForSharedTour = function() {
      return snaplapseForSharedTour;
    };

    this.getSnaplapseForPresentationSlider = function() {
      return snaplapseForPresentationSlider;
    };

    this.getCanvas = function() {
      return canvas;
    };

    this.getAnnotator = function() {
      return annotator;
    };

    this.getDataPanesId = function() {
      return dataPanesId;
    };

    this.getLoopPlayback = function() {
      return loopPlayback;
    };

    this.setLoopPlayback = function(newLoopPlayback, preserveOriginalLoop) {
      if (!preserveOriginalLoop)
        originalLoopPlayback = loopPlayback;
      loopPlayback = newLoopPlayback;
    };

    this.restoreLoopPlayback = function() {
      loopPlayback = originalLoopPlayback;
    };

    this.handleEditorModeToolbarChange = function() {
      snaplapse.getSnaplapseViewer().handleEditorModeToolbarChange();
    };

    this.isFullScreen = function() {
      return fullScreen;
    };

    this.handlePlayPause = function() {
      if (timelapseCurrentTimeInSeconds <= 0 && thisObj.getPlaybackRate() <= 0)
        return;
      if (doingLoopingDwell && (snaplapse && !snaplapse.isPlaying())) {
        doingLoopingDwell = false;
        _pause();
        // Need to manually do this because of the looping dwell code
        var playPauseBtn;
        if (customUI)
          playPauseBtn = " .customPlay";
        else
          playPauseBtn = " .playbackButton";
        $("#" + viewerDivId + playPauseBtn).button({
          icons: {
            primary: "ui-icon-custom-play"
          },
          text: false
        }).attr({
          "title": "Play"
        });
        return;
      }
      if (_isPaused()) {
        if (isCurrentTimeAtOrPastDuration() && thisObj.getPlaybackRate() > 0) {
          _seek(0);
          _play();
        } else {
          _play();
        }
      } else {
        _pause();
      }
    };

    var stopParabolicMotion = function() {
      if (parabolicMotionController)
        parabolicMotionController._disableAnimation();
    };
    this.stopParabolicMotion = stopParabolicMotion;

    var convertViewportToTimeMachine = function(point) {
      var boundingBox = thisObj.getBoundingBoxForCurrentView();
      var newPoint = {
        x: boundingBox.xmin + point.x * ((boundingBox.xmax - boundingBox.xmin) / viewportWidth),
        y: boundingBox.ymin + point.y * ((boundingBox.ymax - boundingBox.ymin) / viewportHeight)
      };
      return newPoint;
    };
    this.convertViewportToTimeMachine = convertViewportToTimeMachine;

    var convertTimeMachineToViewport = function(point) {
      var boundingBox = thisObj.getBoundingBoxForCurrentView();
      var newPoint = {
        x: (point.x - boundingBox.xmin) * (viewportWidth / (boundingBox.xmax - boundingBox.xmin)),
        y: (point.y - boundingBox.ymin) * (viewportHeight / (boundingBox.ymax - boundingBox.ymin))
      };
      return newPoint;
    };
    this.convertTimeMachineToViewport = convertTimeMachineToViewport;

    var getCurrentZoom = function() {
      return scaleToZoom(view.scale);
    };
    this.getCurrentZoom = getCurrentZoom;

    var scaleToZoom = function(scale) {
      if (scale == undefined) {
        scale = view.scale;
      }
      return Math.round(1e3 * Math.log(scale / (panoView.scale)) / Math.log(2)) / 1e3;
    };
    this.scaleToZoom = scaleToZoom;

    var zoomToScale = function(zoom) {
      if (zoom == undefined) {
        zoom = getCurrentZoom();
      }
      return Math.pow(2, zoom) * panoView.scale;
    };
    this.zoomToScale = zoomToScale;

    var getZoomFromBoundingBoxView = function(bboxView) {
      var newView;
      if (!bboxView || !bboxView['bbox'])
        return;
      var bboxViewNE = bboxView.bbox.ne;
      var bboxViewSW = bboxView.bbox.sw;
      if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && bboxViewNE && bboxViewSW && UTIL.isNumber(bboxViewNE.lat) && UTIL.isNumber(bboxViewNE.lng) && UTIL.isNumber(bboxViewSW.lat) && UTIL.isNumber(bboxViewSW.lng)) {
        newView = latLngBoundingBoxToPixelCenter(bboxView);
      } else if (UTIL.isNumber(bboxView.bbox.xmin) && UTIL.isNumber(bboxView.bbox.xmax) && UTIL.isNumber(bboxView.bbox.ymin) && UTIL.isNumber(bboxView.bbox.ymax)) {
        newView = pixelBoundingBoxToPixelCenter(bboxView);
      } else {
        newView = view;
      }
      return scaleToZoom(newView.scale);
    };
    this.getZoomFromBoundingBoxView = getZoomFromBoundingBoxView;

    var handleKeydownEvent = function(event) {
      var activeElement = document.activeElement;
      // If we are focused on a text field or the slider handlers, do not run any player specific controls.
      if ($("#" + viewerDivId + " .timelineSlider .ui-slider-handle:focus").length || $("#" + viewerDivId + " .zoomSlider .ui-slider-handle:focus").length || activeElement == "[object HTMLInputElement]" || activeElement == "[object HTMLTextAreaElement]")
        return;
      var moveFn;
      switch (event.which) {
        // Left arrow
        case 37:
          if ($(activeElement).hasClass("timeTickClickRegion")) {
            if (customUI) {
              $(activeElement).removeClass("openHand closedHand");
              seekToFrame(getCurrentFrameNumber() - 1);
              customUI.focusTimeTick(getCurrentFrameNumber() - 1);
            }
            return;
          }
          moveFn = function() {
            if (event.shiftKey) {
              targetView.x -= (translationSpeedConstant * videoStretchRatio * 0.4) / view.scale;
            } else {
              targetView.x -= (translationSpeedConstant * videoStretchRatio * 0.8) / view.scale;
            }
            setTargetView(targetView);
          };
          break;
        // Right arrow
        case 39:
          if ($(activeElement).hasClass("timeTickClickRegion")) {
            if (customUI) {
              $(activeElement).removeClass("openHand closedHand");
              seekToFrame(getCurrentFrameNumber() + 1);
              customUI.focusTimeTick(getCurrentFrameNumber() + 1);
            }
            return;
          }
          moveFn = function() {
            if (event.shiftKey) {
              targetView.x += (translationSpeedConstant * videoStretchRatio * 0.4) / view.scale;
            } else {
              targetView.x += (translationSpeedConstant * videoStretchRatio * 0.8) / view.scale;
            }
            setTargetView(targetView);
          };
          break;
        // Up arrow
        case 38:
          moveFn = function() {
            if (event.shiftKey) {
              targetView.y -= (translationSpeedConstant * videoStretchRatio * 0.4) / view.scale;
            } else {
              targetView.y -= (translationSpeedConstant * videoStretchRatio * 0.8) / view.scale;
            }
            setTargetView(targetView);
          };
          break;
        // Down arrow
        case 40:
          moveFn = function() {
            if (event.shiftKey) {
              targetView.y += (translationSpeedConstant * videoStretchRatio * 0.4) / view.scale;
            } else {
              targetView.y += (translationSpeedConstant * videoStretchRatio * 0.8) / view.scale;
            }
            setTargetView(targetView);
          };
          break;
        // Minus
        case 173:
        case 109:
        case 189:
          moveFn = function() {
            if (event.shiftKey) {
              targetView.scale *= 0.999;
            } else {
              targetView.scale *= 0.94;
            }
            setTargetView(targetView);
          };
          break;
        // Plus
        case 61:
        case 107:
        case 187:
          moveFn = function() {
            if (event.shiftKey) {
              targetView.scale /= 0.999;
            } else {
              targetView.scale /= 0.94;
            }
            setTargetView(targetView);
          };
          break;
        // P
        case 80:
          thisObj.handlePlayPause();
          break;
        default:
          return;
      }
      // Install interval to run every 50 msec while key is down
      // Each arrow key and +/- has its own interval, so multiple can be down at once
      if (keyIntervals[event.which] == undefined)
        keyIntervals[event.which] = setInterval(moveFn, 50);
      // Don't propagate arrow events -- prevent scrolling of the document
      if (event.which <= 40) {
        event.preventDefault();
      }
    };

    var handleKeyupEvent = function(event) {
      if (keyIntervals[event.which] != undefined) {
        clearInterval(keyIntervals[event.which]);
        keyIntervals[event.which] = undefined;
      }
    };

    var handleMousescrollEvent = function(event, delta) {
      event.preventDefault();
      //UTIL.log('mousescroll delta  ' + delta);
      if (event.shiftKey) {
        if (delta > 0) {
          zoomAbout(1 / 0.99, event.pageX, event.pageY);
        } else if (delta < 0) {
          zoomAbout(0.99, event.pageX, event.pageY);
        }
      } else {
        if (delta > 0) {
          zoomAbout(1 / 0.9, event.pageX, event.pageY);
        } else if (delta < 0) {
          zoomAbout(0.9, event.pageX, event.pageY);
        }
      }
    };
    this.handleMousescrollEvent = handleMousescrollEvent;

    var _warpTo = function(newView) {
      setTargetView(newView);
      view.x = targetView.x;
      view.y = targetView.y;
      view.scale = targetView.scale;
      refresh();
    };
    this.warpTo = _warpTo;

    var computeHomeView = function() {
      computePanoView();
      if (settings["newHomeView"] != undefined) {
        // Store the home view so we don't need to compute it every time
        homeView = pixelBoundingBoxToPixelCenter(pixelCenterToPixelBoundingBoxView(settings["newHomeView"]).bbox);
      } else {
        homeView = panoView;
      }
    };

    var computePanoView = function() {
      panoView = pixelBoundingBoxToPixelCenter({
        xmin: 0,
        ymin: 0,
        xmax: panoWidth,
        ymax: panoHeight
      });
    };

    this.getBoundingBoxForCurrentView = function() {
      var bboxView = pixelCenterToPixelBoundingBoxView(view);
      if (bboxView == null)
        return null;
      else
        return bboxView.bbox;
    };

    this.warpToBoundingBox = function(bbox) {
      this.warpTo(pixelBoundingBoxToPixelCenter(bbox));
    };

    this.resetPerf = function() {
      videoset.resetPerf();
    };

    this.getPerf = function() {
      return videoset.getPerf();
    };

    this.getView = function() {
      // Clone current view
      var originalView = $.extend({}, view);
      return originalView;
    };

    this.getVideoset = function() {
      return videoset;
    };

    var _addTargetViewChangeListener = function(listener) {
      targetViewChangeListeners.push(listener);
    };
    this.addTargetViewChangeListener = _addTargetViewChangeListener;

    var _removeTargetViewChangeListener = function(listener) {
      for (var i = 0; i < targetViewChangeListeners.length; i++) {
        if (targetViewChangeListeners[i] == listener[0]) {
          targetViewChangeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeTargetViewChangeListener = _removeTargetViewChangeListener;

    var _addViewChangeListener = function(listener) {
      viewChangeListeners.push(listener);
    };
    this.addViewChangeListener = _addViewChangeListener;

    var _removeViewChangeListener = function(listener) {
      for (var i = 0; i < viewChangeListeners.length; i++) {
        if (viewChangeListeners[i] == listener[0]) {
          viewChangeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeViewChangeListener = _removeViewChangeListener;

    var _addViewEndChangeListener = function(listener) {
      viewEndChangeListeners.push(listener);
    };
    this.addViewEndChangeListener = _addViewEndChangeListener;

    var _removeEndViewChangeListener = function(listener) {
      for (var i = 0; i < viewEndChangeListeners.length; i++) {
        if (viewEndChangeListeners[i] == listener[0]) {
          viewEndChangeListeners.splice(i, 1);
          break;
        }
      }
    };
    this.removeEndViewChangeListener = _removeEndViewChangeListener;

    var _addVideoPauseListener = function(listener) {
      videoset.addEventListener('videoset-pause', listener);
    };
    this.addVideoPauseListener = _addVideoPauseListener;

    var _addVideoPlayListener = function(listener) {
      videoset.addEventListener('videoset-play', listener);
    };
    this.addVideoPlayListener = _addVideoPlayListener;

    var _makeVideoVisibleListener = function(listener) {
      videoset.addEventListener('video-made-visible', listener);
    };
    this.makeVideoVisibleListener = _makeVideoVisibleListener;

    var _removeVideoVisibleListener = function(listener) {
      videoset.removeEventListener('video-made-visible', listener);
    };
    this.removeVideoVisibleListener = _removeVideoVisibleListener;

    var _addPlaybackRateChangeListener = function(listener) {
      playbackRateChangeListeners.push(listener);
    };
    this.addPlaybackRateChangeListener = _addPlaybackRateChangeListener;

    var _getProjection = function(desiredProjectionType) {
      projectionType = typeof (desiredProjectionType) != 'undefined' ? desiredProjectionType : "mercator";
      if (projectionType == "mercator") {
        var projectionBounds = tmJSON['projection-bounds'];
        return new org.gigapan.timelapse.MercatorProjection(projectionBounds.west, projectionBounds.north, projectionBounds.east, projectionBounds.south, panoWidth, panoHeight);
      }
    };
    this.getProjection = _getProjection;

    var getProjectionType = function() {
      return projectionType;
    };
    this.getProjectionType = getProjectionType;

    var getViewStrAsProjection = function() {
      var latlng = _getProjection().pointToLatlng(view);
      return Math.round(1e5 * latlng.lat) / 1e5 + "," + Math.round(1e5 * latlng.lng) / 1e5 + "," + Math.round(1e3 * Math.log(view.scale / panoView.scale) / Math.log(2)) / 1e3 + "," + "latLng";
    };

    var getViewStrAsPoints = function() {
      return Math.round(1e5 * view.x) / 1e5 + "," + Math.round(1e5 * view.y) / 1e5 + "," + Math.round(1e3 * Math.log(view.scale / panoView.scale) / Math.log(2)) / 1e3 + "," + "pts";
    };

    var _getViewStr = function() {
      // TODO: let the user choose lat/lng or points for a dataset with projection info
      if ( typeof (tmJSON['projection-bounds']) != 'undefined') {
        return getViewStrAsProjection();
      } else {
        return getViewStrAsPoints();
      }
    };
    this.getViewStr = _getViewStr;

    var _setNewView = function(newView, doWarp, doPlay, callBack) {
      if ( typeof (newView) === 'undefined' || newView == null)
        return;

      newView = _normalizeView(newView);

      var defaultEndViewCallback = function() {
        _removeEndViewChangeListener(this);
        parabolicMotionController = null;
        if (doPlay)
          thisObj.handlePlayPause();
        if ( typeof (callBack) === "function")
          callBack();
      };

      if (doWarp) {
        _addViewEndChangeListener(defaultEndViewCallback);
        _warpTo(newView);
      } else {
        // If we are really close to our current location, just slide there rather than do a very short parabolic curve.
        if (newView.scale && newView.scale.toFixed(17) == view.scale.toFixed(17) && (Math.abs(newView.x - view.x) <= 1000 && Math.abs(newView.y - view.y) <= 1000)) {
          _addViewEndChangeListener(defaultEndViewCallback);
          setTargetView(newView);
        } else {
          if (!parabolicMotionController) {
            parabolicMotionController = new parabolicMotionObj.MotionController({
              animationFPS: 1000 / animateRate,
              pathSpeed: parabolicMotionPathSpeed,
              animateCallback: function(pt) {
                _warpTo(parabolicMotionObj.pixelPointToView(viewportWidth, viewportHeight, pt));
              },
              onCompleteCallback: defaultEndViewCallback
            });
          }
          var a = parabolicMotionObj.viewToPixelPoint(viewportWidth, viewportHeight, view);
          var b = parabolicMotionObj.viewToPixelPoint(viewportWidth, viewportHeight, newView);
          var path = org.gigapan.timelapse.parabolicMotion.computeParabolicPath(a, b);
          parabolicMotionController.moveAlongPath(path);
        }
      }
    };
    this.setNewView = _setNewView;

    var _normalizeView = function(newView) {
      if (newView.center) {// Center view
        var newCenterView = newView.center;
        if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && UTIL.isNumber(newCenterView.lat) && UTIL.isNumber(newCenterView.lng) && UTIL.isNumber(newView.zoom)) {
          newView = latLngCenterViewToPixelCenter(newView);
        } else if (UTIL.isNumber(newCenterView.x) && UTIL.isNumber(newCenterView.y) && UTIL.isNumber(newView.zoom)) {
          newView = pixelCenterViewToPixelCenter(newView);
        } else {
          newView = view;
        }
      } else if (newView.bbox) {// Bounding box view
        var newViewBbox = newView.bbox;
        var newViewBboxNE = newViewBbox.ne;
        var newViewBboxSW = newViewBbox.sw;
        if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && newViewBboxNE && newViewBboxSW && UTIL.isNumber(newViewBboxNE.lat) && UTIL.isNumber(newViewBboxNE.lng) && UTIL.isNumber(newViewBboxSW.lat) && UTIL.isNumber(newViewBboxSW.lng)) {
          newView = latLngBoundingBoxToPixelCenter(newView);
        } else if (UTIL.isNumber(newViewBbox.xmin) && UTIL.isNumber(newViewBbox.xmax) && UTIL.isNumber(newViewBbox.ymin) && UTIL.isNumber(newViewBbox.ymax)) {
          newView = pixelBoundingBoxToPixelCenter(newView);
        } else {
          newView = view;
        }
      }
      return newView;
    };
    this.normalizeView = _normalizeView;

    var getShareView = function() {
      var shareStr = '#v=' + _getViewStr() + '&t=' + thisObj.getCurrentTime().toFixed(2);
      if (datasetType == "modis" && customUI.getLocker() != "none")
        shareStr += '&l=' + customUI.getLocker();
      if (datasetType == "breathecam")
        shareStr += '&d=' + settings["url"].match(/\d\d\d\d-\d\d-\d\d/);
      return shareStr;
    };
    this.getShareView = getShareView;

    // Extract a safe view from either a view object (i.e. {center:{x:val, y:val}, zoom:val}) or
    // from an array of strings (i.e. a share URL, such as #v=44.96185,59.06233,4.5,latLng&t=0.10,
    // that has been unpacked).
    var unsafeViewToView = function(unsafe_viewParam) {
      var view = null;

      if (!unsafe_viewParam)
        return null;

      // If we have a view object and not an array of strings (i.e. an unpacked share URL) then we need to unpack
      // the view object into an array of strings so that it can be properly sanitized further down.
      if (unsafe_viewParam.center || unsafe_viewParam.bbox) {
        var tmpViewParam = [];
        if (unsafe_viewParam.center) {
          var isLatLng = false;
          var centerView = unsafe_viewParam.center;
          for (var key in centerView) {
            tmpViewParam.push(centerView[key]);
            if (key == "lat")
              isLatLng = true;
          }
          tmpViewParam.push(unsafe_viewParam.zoom);
          isLatLng ? tmpViewParam.push("latLng") : tmpViewParam.push("pts");
          unsafe_viewParam = tmpViewParam;
        } else if (unsafe_viewParam.bbox) {
          var isLatLng = false;
          var bboxView = unsafe_viewParam.bbox;
          for (var key in bboxView) {
            if (key == "ne" || key == "sw") {
              isLatLng = true;
              for (var innerKey in bboxView[key])
              tmpViewParam.push(bboxView[key][innerKey]);
            } else {
              tmpViewParam.push(bboxView[key]);
            }
          }
          isLatLng ? tmpViewParam.push("latLng") : tmpViewParam.push("pts");
          unsafe_viewParam = tmpViewParam;
        }
      }

      if (unsafe_viewParam.indexOf("latLng") != -1) {
        if (unsafe_viewParam.length == 4)
          view = {
            center: {
              "lat": parseFloat(unsafe_viewParam[0]),
              "lng": parseFloat(unsafe_viewParam[1])
            },
            "zoom": parseFloat(unsafe_viewParam[2])
          };
        else if (unsafe_viewParam.length == 5)
          view = {
            bbox: {
              "ne": {
                "lat": parseFloat(unsafe_viewParam[0]),
                "lng": parseFloat(unsafe_viewParam[1])
              },
              "sw": {
                "lat": parseFloat(unsafe_viewParam[2]),
                "lng": parseFloat(unsafe_viewParam[3])
              }
            }
          };
      } else {// Assume points if the user did not specify latLng. Also allow for the omission of 'pts' param for backwards compatibility
        if ((unsafe_viewParam.indexOf("pts") == -1 && unsafe_viewParam.length == 3) || unsafe_viewParam.length == 4)
          view = {
            center: {
              "x": parseFloat(unsafe_viewParam[0]),
              "y": parseFloat(unsafe_viewParam[1])
            },
            "zoom": parseFloat(unsafe_viewParam[2])
          };
        else if ((unsafe_viewParam.indexOf("pts") == -1 && unsafe_viewParam.length == 4) || unsafe_viewParam.length == 5)
          view = {
            bbox: {
              "xmin": parseFloat(unsafe_viewParam[0]),
              "xmax": parseFloat(unsafe_viewParam[1]),
              "ymin": parseFloat(unsafe_viewParam[2]),
              "ymax": parseFloat(unsafe_viewParam[3])
            }
          };
      }
      return view;
    };
    this.unsafeViewToView = unsafeViewToView;

    ///////////////////////////
    // Timelapse video control
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.getThumbnailOfCurrentView = function(width, height) {
      var snaplapse = thisObj.getSnaplapse();
      if (snaplapse) {
        var snaplapseViewer = snaplapse.getSnaplapseViewer();
        if (!snaplapseViewer)
          return null;
        if (!width)
          width = 126;
        if (!height)
          height = 73;
        return snaplapseViewer.generateThumbnailURL(tileRootPath, thisObj.getBoundingBoxForCurrentView(), width, height, thisObj.getCurrentTime().toFixed(2));
      }
    };

    var _isPaused = function() {
      return videoset.isPaused();
    };
    this.isPaused = _isPaused;

    var _pause = function() {
      window.clearTimeout(customPlaybackTimeout);
      window.clearTimeout(loopStartTimeoutId);
      window.clearTimeout(loopEndTimeoutId);
      //thisObj.setPlaybackRate(originalPlaybackRate);
      videoset.pause();

      // Pano video is used for the timewarp map in editor
      if (panoVideo) {
        panoVideo.pause();
        // Rather than writing a sync function,
        // we naively resync when the video is paused
        if (panoVideo.currentTime != leader + videoset.getCurrentTime()) {
          seek_panoVideo(videoset.getCurrentTime());
        }
      }
    };
    this.pause = _pause;

    var _seek = function(t) {
      // In IE, seeking to <= 20% of the first frame causes flickering from that point forward
      var minIESeekTime = (1 / _getFps()) * 0.2;
      var seekTime = Math.min(Math.max(0, t), timelapseDurationInSeconds);
      if (isIE && seekTime < minIESeekTime)
        seekTime = minIESeekTime;
      videoset.seek(seekTime);
      seek_panoVideo(seekTime);
    };
    this.seek = _seek;

    var seekToFrame = function(frameIdx) {
      if (frameIdx < 0 || frameIdx > frames - 1)
        return;
      var timePadding = isFirefox ? 0 : 0.3;
      var seekTime = (frameIdx + timePadding) / _getFps();
      _seek(seekTime);
      seek_panoVideo(seekTime);
    };
    this.seekToFrame = seekToFrame;

    var _play = function() {
      updateCustomPlayback();
      videoset.play();

      // Pano video is used for the timewarp map in editor
      if (panoVideo && defaultUI.getMode() != "player" && !fullScreen && enablePanoVideo) {
        // Rather than writing a sync function,
        // we naively resync when the video is played
        if (panoVideo.currentTime != leader + videoset.getCurrentTime()) {
          seek_panoVideo(videoset.getCurrentTime());
        }
        panoVideo.play();
      }
    };
    this.play = _play;

    // Pano video is used for the timewarp map in editor
    var seek_panoVideo = function(t) {
      if (panoVideo && enablePanoVideo && !panoVideo.seeking && defaultUI.getMode() != "player" && !fullScreen && panoVideo.readyState >= 2) {
        panoVideo.currentTime = leader + t;
      }
    };
    this.seek_panoVideo = seek_panoVideo;

    this.setPanoVideoEnableStatus = function(status) {
      enablePanoVideo = status;
      if (status == false)
        panoVideo.pause();
    };

    // The function is used for pausing the video for some duration
    // and optionally doing something afterwards
    var waitFor = function(seconds, callBack) {
      // True means do not save the PlaybackRate
      thisObj.setPlaybackRate(0, true);
      return setTimeout(function() {
        if (callBack)
          callBack();
        thisObj.setPlaybackRate(originalPlaybackRate);
      }, seconds * 1000);
    };
    this.waitFor = waitFor;

    this.restorePlaybackRate = function() {
      thisObj.setPlaybackRate(originalPlaybackRate);
    };

    this.setPlaybackRate = function(rate, preserveOriginalRate, skipUpdateUI) {
      if (!preserveOriginalRate)
        originalPlaybackRate = rate;
      videoset.setPlaybackRate(rate);

      // Pano video is used for the timewarp map in editor
      // TODO: This should probably be done through a listener
      if (panoVideo && defaultUI.getMode() != "player" && !fullScreen) {
        panoVideo.playbackRate = rate;
      }

      for (var i = 0; i < playbackRateChangeListeners.length; i++)
        playbackRateChangeListeners[i](rate, skipUpdateUI);
    };

    this.toggleMainControls = function() {
      defaultUI.toggleMainControls();
    };

    this.getPlaybackRate = function() {
      return videoset.getPlaybackRate();
    };

    this.getVideoPosition = function() {
      return videoset.getVideoPosition();
    };

    this.getDuration = function() {
      return timelapseDurationInSeconds;
    };

    var updateCustomPlayback = function() {
      // Startup custom playback stuff if possible
      if (loopPlayback && customLoopPlaybackRates) {
        var nextSegment = null;
        // Next segment with custom playback
        for (var i in customLoopPlaybackRates) {
          var rateObj = customLoopPlaybackRates[i];
          if (timelapseCurrentTimeInSeconds < rateObj.end) {
            if (timelapseCurrentTimeInSeconds >= rateObj.start) {
              nextSegment = rateObj;
              break;
            } else if (nextSegment === null || rateObj.start < nextSegment.start) {
              nextSegment = rateObj;
            }
          }
        }
        // Make sure playback rate matches selection
        if (nextSegment === null) {
          thisObj.setPlaybackRate(originalPlaybackRate, true);
        } else {
          var difference = nextSegment.start - timelapseCurrentTimeInSeconds;
          if (difference > 0)
            customPlaybackTimeout = window.setTimeout(updateCustomPlayback, difference);
          else {
            thisObj.setPlaybackRate(nextSegment.rate, true);
            customPlaybackTimeout = window.setTimeout(updateCustomPlayback, difference);
          }
        }
      }
    };

    this.setStatusLoggingEnabled = function(enable) {
      videoset.setStatusLoggingEnabled(enable);
    };

    this.setNativeVideoControlsEnabled = function(enable) {
      videoset.setNativeVideoControlsEnabled(enable);
    };

    var _getNumFrames = function() {
      return frames;
    };
    this.getNumFrames = _getNumFrames;

    var _getFps = function() {
      return videoset.getFps();
    };
    this.getFps = _getFps;

    this.getVideoWidth = function() {
      return videoWidth;
    };

    this.getVideoHeight = function() {
      return videoHeight;
    };

    this.getPanoWidth = function() {
      return panoWidth;
    };

    this.getPanoHeight = function() {
      return panoHeight;
    };

    this.getViewportWidth = function() {
      return viewportWidth;
    };

    this.getViewportHeight = function() {
      return viewportHeight;
    };

    this.getMetadata = function() {
      return metadata;
    };

    var _addTimeChangeListener = function(listener) {
      videoset.addEventListener('sync', listener);
    };
    this.addTimeChangeListener = _addTimeChangeListener;

    var _removeTimeChangeListener = function(listener) {
      videoset.removeEventListener('sync', listener);
    };
    this.removeTimeChangeListener = _removeTimeChangeListener;

    this.getCurrentTime = function() {
      return videoset.getCurrentTime();
    };

    this.setScale = function(val) {
      targetView.scale = val;
      setTargetView(targetView);
    };

    this.setScaleFromSlider = function(val) {
      targetView.scale = _zoomSliderToViewScale(val);
      setTargetView(targetView);
    };

    var _getMinScale = function() {
      return panoView.scale * 0.5;
    };
    this.getMinScale = _getMinScale;

    var _getMaxScale = function() {
      if (tmJSON['projection-bounds'])
        return 1.05;
      else
        return 2;
    };
    this.getMaxScale = _getMaxScale;

    var _viewScaleToZoomSlider = function(value) {
      var tmpValue = Math.sqrt((value - _getMinScale()) / (_getMaxScale() - _getMinScale()));
      return (1 / (Math.log(2))) * (Math.log(tmpValue + 1));
    };
    this.viewScaleToZoomSlider = _viewScaleToZoomSlider;

    var _zoomSliderToViewScale = function(value) {
      return _getMaxScale() * (Math.pow((Math.pow(2, value) - 1), 2)) - Math.pow(4, value) * _getMinScale() + 2 * Math.pow(2, value) * _getMinScale();
    };
    this.zoomSliderToViewScale = _zoomSliderToViewScale;

    var _getDatasetJSON = function() {
      return datasetJSON;
    };
    this.getDatasetJSON = _getDatasetJSON;

    var _getTmJSON = function() {
      return tmJSON;
    };
    this.getTmJSON = _getTmJSON;

    var _fullScreen = function(state) {
      // TODO: Real full screen
    };
    this.fullScreen = _fullScreen;

    var initializeUI = function() {
      var $timeMachineDiv = $("#" + timeMachineDivId);
      var $viewerDiv = $("#" + viewerDivId);

      var originalVideoWidth = datasetJSON["video_width"] - datasetJSON["tile_width"];
      var originalVideoHeight = datasetJSON["video_height"] - datasetJSON["tile_height"];

      var viewerBottomPx = 0;
      if (editorEnabled)
        viewerBottomPx = 210;
      else {
        if (presentationSliderEnabled)
          viewerBottomPx = 100;
      }

      if ($timeMachineDiv.css("position") == "static") {
        $timeMachineDiv.css({
          "position": "absolute",
          "top": "0px",
          "left": "0px",
          "width": originalVideoWidth + "px",
          "height": (originalVideoHeight + viewerBottomPx) + "px"
        });
      }

      $viewerDiv.css({
        "position": "absolute",
        "top": "0px",
        "left": "0px",
        "right": "0px",
        "bottom": viewerBottomPx + "px",
        "width": "auto",
        "height": "auto"
      });

      resizeViewer();

      window.onresize = function() {
        if (viewportWidth == $viewerDiv.width() && viewportHeight == $viewerDiv.height())
          return;
        resizeViewer();
        // TODO implement a resize listener and put this in the snaplapseViewer class
        if (snaplapse)
          snaplapse.getSnaplapseViewer().resizeUI();
        // TODO implement a resize listener and put this in the snaplapseViewer class
        if (snaplapseForPresentationSlider)
          snaplapseForPresentationSlider.getSnaplapseViewer().resizeUI();
        // TODO implement a resize listener and put this in the scaleBar class
        if (scaleBar)
          scaleBar.updateCachedVideoSize();
        // TODO implement a resize listener and put this in the visualizer class
        if (visualizer && defaultUI)
          visualizer.setMode(defaultUI.getMode(), false);
        // TODO implement a resize listener and put this in the annotator class
        if (annotator)
          annotator.resizeUI();
        updateLocationContextUI();
      };
    };

    var setInitialView = function() {
      if (loadSharedViewFromUnsafeURL(UTIL.getUnsafeHashString())) {
        // loadSharedViewFromUnsafeURL() sets our view (if valid) and returns a boolean
      } else if (initialView) {
        view = initialView;
      } else if (!loadTimelapseWithPreviousViewAndTime) {
        view = null;
      }
    };

    var resizeViewer = function() {
      var $viewerDiv = $("#" + viewerDivId);

      viewportWidth = $viewerDiv.width();
      viewportHeight = $viewerDiv.height();

      var originalVideoStretchRatio = videoStretchRatio;
      var originalVideoWidth = datasetJSON["video_width"] - datasetJSON["tile_width"];
      var originalVideoHeight = datasetJSON["video_height"] - datasetJSON["tile_height"];

      // If the video is too small, we need to stretch the video to fit the viewport,
      // so users don't see black bars around the viewport
      videoStretchRatio = Math.max(viewportWidth / originalVideoWidth, viewportHeight / originalVideoHeight);
      levelThreshold = defaultLevelThreshold - log2(videoStretchRatio);
      scaleRatio = videoStretchRatio / originalVideoStretchRatio;

      // Update canvas size
      $(canvas).attr({
        width: viewportWidth,
        height: viewportHeight
      });
      $(blackFrameDetectionCanvas).attr({
        width: viewportWidth,
        height: viewportHeight
      });

      // Stretching the video affects the home view,
      // set home view to undefined so that it gets recomputed
      computeHomeView();

      if (!didFirstTimeOnLoad)
        setInitialView();

      // Set to the correct view
      if (view) {
        view.scale *= scaleRatio;
      } else {
        // If it is the first time that we call this function, set the view to home view
        view = $.extend({}, homeView);
      }
      _warpTo(view);
    };

    var _computeMotion = function(start, end, timeRatio) {
      var s0 = start.xmax - start.xmin;
      var s1 = end.xmax - end.xmin;
      var s1_over_s0 = s1 / s0;

      // Compute f(t), but check whether we're merely panning, in which case we shouldn't attempt to do the
      // special scaling (because it'll blow up with f(1) being NaN since we'd be dividing zero by zero).
      var f_of_t = (Math.abs(s1_over_s0 - 1) < 0.000001) ? timeRatio : (Math.pow(s1_over_s0, timeRatio) - 1) / (s1_over_s0 - 1);

      var boundsXminOffset = (end.xmin - start.xmin ) * f_of_t;
      var boundsYminOffset = (end.ymin - start.ymin ) * f_of_t;
      var boundsXmaxOffset = (end.xmax - start.xmax ) * f_of_t;
      var boundsYmaxOffset = (end.ymax - start.ymax ) * f_of_t;

      var bounds = {};
      bounds.xmin = start.xmin + boundsXminOffset;
      bounds.ymin = start.ymin + boundsYminOffset;
      bounds.xmax = start.xmax + boundsXmaxOffset;
      bounds.ymax = start.ymax + boundsYmaxOffset;

      return bounds;
    };
    this.computeMotion = _computeMotion;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    // Handle any hash variables related to time machines
    var handleHashChange = function() {
      var unsafeHashString = UTIL.getUnsafeHashString();

      // Share views
      loadSharedViewFromUnsafeURL(unsafeHashString);
      // Tours and presentations
      loadSharedDataFromUnsafeURL(unsafeHashString);
    };

    var loadSharedViewFromUnsafeURL = function(unsafe_fullURL) {
      var unsafe_matchURL = unsafe_fullURL.match(/#(.+)/);
      if (unsafe_matchURL) {
        var unsafeHashObj = UTIL.unpackVars(unsafe_matchURL[1]);
        var newView = getViewFromHash(unsafeHashObj);
        var newTime = getTimeFromHash(unsafeHashObj);

        // If the current URL happens to include a hash with a share link, but a new dataset
        // is being loaded with the current view/time preserved (which is mostly likely
        // different from the shared view) then move on.
        if (loadTimelapseWithPreviousViewAndTime)
          return;

        if (newView) {
          if (didFirstTimeOnLoad) {
            _setNewView(newView, true);
          } else {
            view = _normalizeView(newView);
          }
        }
        if (newTime && typeof desiredInitialDate == "undefined") {
          if (didFirstTimeOnLoad) {
            _seek(newTime);
          } else {
            initialTime = newTime;
          }
        }
        return true;
      } else {
        return false;
      }
    };
    this.loadSharedViewFromUnsafeURL = loadSharedViewFromUnsafeURL;

    // Gets safe view values (Object) from an unsafe object containing key-value pairs from the URL hash.
    var getViewFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.v) {
        var newView = unsafeViewToView(unsafeHashObj.v.split(","));
        return newView;
      }
      return null;
    };

    // Gets a safe time value (Float) from an unsafe object containing key-value pairs from the URL hash.
    // TODO: what if time is 0?
    var getTimeFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.t) {
        var newTime = parseFloat(unsafeHashObj.t);
        return newTime;
      }
      return null;
    };

    // Gets safe tour JSON from an unsafe object containing key-value pairs from the URL hash.
    // The JSON returned is safe because calls to urlStringToJSON go to carefully-designed methods that use strict encoders
    // (and naming conventions to mark strings not strictly sanitized) to ensure the input is safe.
    var getTourFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.tour) {
        if (snaplapseForSharedTour) {
          var tourJSON = snaplapseForSharedTour.urlStringToJSON(unsafeHashObj.tour);
          return tourJSON;
        }
      }
      return null;
    };

    // Gets safe presentation JSON from an unsafe object containing key-value pairs from the URL hash.
    // The JSON returned is safe because calls to urlStringToJSON go to carefully-designed methods that use strict encoders
    // (and naming conventions to mark strings not strictly sanitized) to ensure the input is safe.
    var getPresentationFromHash = function(unsafeHashObj) {
      if (unsafeHashObj && unsafeHashObj.presentation) {
        if (snaplapseForPresentationSlider) {
          var presentationJSON = snaplapseForPresentationSlider.urlStringToJSON(unsafeHashObj.presentation);
          return presentationJSON;
        }
      }
      return null;
    };

    var handleMousedownEvent = function(event) {
      if (event.which != 1 || (annotator && (event.metaKey || event.ctrlKey || event.altKey || annotator.getCanMoveAnnotation())))
        return;
      var mouseIsDown = true;
      var lastEvent = event;
      var saveMouseMove = document.onmousemove;
      var saveMouseUp = document.onmouseup;
      $(videoDiv).removeClass("openHand closedHand").addClass('closedHand');
      stopParabolicMotion();
      document.onmousemove = function(event) {
        if (mouseIsDown) {
          //if (videoset.isStalled()) return;
          // This is for the tile content holder
          if (event.shiftKey) {
            targetView.x += (lastEvent.pageX - event.pageX) * 0.2 / view.scale;
            targetView.y += (lastEvent.pageY - event.pageY) * 0.2 / view.scale;
          } else {
            targetView.x += (lastEvent.pageX - event.pageX) / view.scale;
            targetView.y += (lastEvent.pageY - event.pageY) / view.scale;
          }
          setTargetView(targetView);
          lastEvent = event;
        }
        return false;
      };
      // Make sure we release mousedown upon exiting our viewport if we are inside an iframe
      $("body").one("mouseleave", function(event) {
        if (window && (window.self !== window.top)) {
          mouseIsDown = false;
          $(videoDiv).removeClass("openHand closedHand");
          document.onmousemove = saveMouseMove;
          document.onmouseup = saveMouseUp;
        }
      });
      // Release mousedown upon mouseup
      $(document).one("mouseup", function(event) {
        mouseIsDown = false;
        $(videoDiv).removeClass("openHand closedHand");
        document.onmousemove = saveMouseMove;
        document.onmouseup = saveMouseUp;
      });
      return false;
    };
    this.handleMousedownEvent = handleMousedownEvent;

    var zoomAbout = function(zoom, x, y, isFromGoogleMap) {
      //if (videoset.isStalled()) return;
      var newScale = limitScale(targetView.scale * zoom);
      var actualZoom = newScale / targetView.scale;
      // We want to zoom to the center of the current view if we zoom from google map
      if (isFromGoogleMap == undefined) {
        targetView.x += 1 * (1 - 1 / actualZoom) * (x - $(videoDiv).offset().left - viewportWidth * 0.5) / targetView.scale;
        targetView.y += 1 * (1 - 1 / actualZoom) * (y - $(videoDiv).offset().top - viewportHeight * 0.5) / targetView.scale;
      }
      targetView.scale = newScale;
      setTargetView(targetView);
    };
    this.zoomAbout = zoomAbout;

    var handleDoubleClickEvent = function(event, isFromGoogleMap) {
      zoomAbout(2.0, event.pageX, event.pageY, isFromGoogleMap);
    };

    var limitScale = function(scale) {
      return Math.max(_getMinScale(), Math.min(_getMaxScale(), scale));
    };
    this.limitScale = limitScale;

    var view2string = function(view) {
      return "[view x:" + view.x + " y:" + view.y + " scale:" + view.scale + "]";
    };

    var setTargetView = function(newView, offset) {
      if (newView) {
        var tempView = {};
        tempView.scale = limitScale(newView.scale);
        if (isHyperwall) {
          targetView.x = newView.x;
          targetView.y = newView.y;
        } else {
          tempView.x = Math.max(0, Math.min(panoWidth, newView.x));
          tempView.y = Math.max(0, Math.min(panoHeight, newView.y));
          targetView.x = tempView.x;
          targetView.y = tempView.y;
        }
        targetView.scale = tempView.scale;
      } else {
        // Rather than specifying a new view, it is easier to just specify the offset for translating
        if (offset) {
          targetView.x += offset.x / view.scale;
          targetView.y += offset.y / view.scale;
        }
      }

      // ~35Hz or 12.5Hz
      if (animateInterval == null) {
        animateInterval = setInterval(function() {
          animate();
        }, animateRate);
        lastAnimationTime = UTIL.getCurrentTimeInSecs();
      }

      refresh();

      for (var i = 0; i < targetViewChangeListeners.length; i++)
        targetViewChangeListeners[i](targetView);
    };
    this.setTargetView = setTargetView;

    var point2mag = function(point) {
      return Math.sqrt(point.x * point.x + point.y * point.y);
    };

    var point2sub = function(a, b) {
      return {
        x: a.x - b.x,
        y: a.y - b.y
      };
    };

    var point2scale = function(point, scale) {
      return {
        x: point.x * scale,
        y: point.y * scale
      };
    };

    var log2 = function(x) {
      return Math.log(x) / Math.log(2);
    };

    var exp2 = function(x) {
      return Math.pow(2, x);
    };

    var checkForJoystick = function() {
      if (!isChrome) {
        return false;
      }

      var gamepad = navigator.webkitGetGamepads()[0];
      var translationSpeedConstant = 30;
      var joystickError = 0.15;
      var scalingConstant = 0.94;
      var secondaryFunctionsEnabled = true;

      if (gamepad == null) {
        return false;
      }

      // Horizontal Motion
      if (Math.abs(gamepad.axes[0]) > joystickError) {
        view.x = Math.max(0, Math.min(panoWidth, view.x + (gamepad.axes[0] * translationSpeedConstant) / view.scale));
        targetView = view;
      }

      // Vertical Motion
      if (Math.abs(gamepad.axes[1]) > joystickError) {
        view.y = Math.max(0, Math.min(panoHeight, view.y + (gamepad.axes[1] * translationSpeedConstant) / view.scale));
        targetView = view;
      }

      // Zooming in/out
      if (gamepad.axes[3] > joystickError) {
        view.scale = limitScale(view.scale * (scalingConstant + (1 - scalingConstant) * (1 - gamepad.axes[3])));
        targetView = view;
      } else if (gamepad.axes[3] < -joystickError) {
        view.scale = limitScale(view.scale / (scalingConstant + (1 - scalingConstant) * (1 + gamepad.axes[3])));
        targetView = view;
      }
      refresh();

      // Time Control
      if (secondaryFunctionsEnabled) {
        // Seek the video
        var seekFPS = 5.0;
        if (gamepad.buttons[7] && !gamepad.buttons[6]) {
          if (joystickTimers[0] > 1.0 / seekFPS) {
            thisObj.handlePlayPause();
            videoset.seek(videoset.getCurrentTime() + (1.0 / _getFps()));
            joystickTimers[0] = 0.0;
          }
          joystickTimers[0] += 0.040;
        }
        if (gamepad.buttons[6] && !gamepad.buttons[7]) {
          if (joystickTimers[1] > 1.0 / seekFPS) {
            thisObj.handlePlayPause();
            videoset.seek(videoset.getCurrentTime() - (1.0 / _getFps()));
            joystickTimers[1] = 0.0;
          }
          joystickTimers[1] += 0.040;
        }

        // Play/Pause Video
        var buttonNumberForPlay = 0;
        if (gamepad.buttons[buttonNumberForPlay] && !isJoystickButtonPressed[buttonNumberForPlay]) {
          thisObj.handlePlayPause();
          isJoystickButtonPressed[buttonNumberForPlay] = true;
        } else if (!gamepad.buttons[buttonNumberForPlay] && isJoystickButtonPressed[buttonNumberForPlay]) {
          isJoystickButtonPressed[buttonNumberForPlay] = false;
        }

        // Set FullScreen
        var buttonNumberForFullScreen = 1;
        if (gamepad.buttons[buttonNumberForFullScreen] && !isJoystickButtonPressed[buttonNumberForFullScreen]) {
          _fullScreen(!fullScreen);
          isJoystickButtonPressed[buttonNumberForFullScreen] = true;
        } else if (!gamepad.buttons[buttonNumberForFullScreen] && isJoystickButtonPressed[buttonNumberForFullScreen]) {
          isJoystickButtonPressed[buttonNumberForFullScreen] = false;
        }
      }
      return true;
    };

    var animate = function() {
      //var isJoystickWorking = checkForJoystick();

      // Compute deltaT between this animation frame and last
      var now = UTIL.getCurrentTimeInSecs();
      var deltaT = now - lastAnimationTime;
      if (deltaT < 0.001)
        deltaT = 0.001;
      else if (deltaT > 0.2)
        deltaT = 0.2;
      lastAnimationTime = now;
      deltaT = Math.min(0.5, animationFractionPerSecond * deltaT);

      // Animate translation
      var minTranslateSpeed = minTranslateSpeedPixelsPerSecond / view.scale;
      // Convert to pano coords / sec
      var minTranslateDelta = minTranslateSpeed * deltaT;
      var toGoal = point2sub(targetView, view);
      var toGoalMag = point2mag(toGoal);
      var translationDesiredDeltaT = minTranslateDelta / toGoalMag;

      var minZoomSpeed = minZoomSpeedPerSecond;
      var minZoomDelta = minZoomSpeed * deltaT;
      toGoalMag = Math.abs(log2(targetView.scale) - log2(view.scale));
      var zoomDesiredDeltaT = minZoomDelta / toGoalMag;

      var t = Math.min(1, Math.max(deltaT, Math.min(translationDesiredDeltaT, zoomDesiredDeltaT)));
      var i;
      if (t == 1) {
        view.x = targetView.x;
        view.y = targetView.y;
        view.scale = targetView.scale;
        //UTIL.log("animation finished, clearing interval");
        //if (!isJoystickWorking) {
        clearInterval(animateInterval);
        animateInterval = null;
        //}
        // We are done changing the view, run listeners specific to this.
        for (var i = 0; i < viewEndChangeListeners.length; i++)
          viewEndChangeListeners[i](view);
      } else {
        view = pixelBoundingBoxToPixelCenter(_computeMotion(pixelCenterToPixelBoundingBoxView(view).bbox, pixelCenterToPixelBoundingBoxView(targetView).bbox, t));
      }
      refresh();
      // Run listeners as the view changes
      for (var i = 0; i < viewChangeListeners.length; i++)
        viewChangeListeners[i](view);
    };

    //// Views with scale ////

    // Convert {bbox:{xmin, xmax, ymin, ymax}} OR {xmin, xmax, ymin, ymax} to {x, y, scale}
    var pixelBoundingBoxToPixelCenter = function(bbox) {
      if (!bbox)
        return null;

      // If input happens to be of the form {bbox:{xmin, xmax, ymin, ymax}}
      if ( typeof (bbox.bbox) !== 'undefined')
        bbox = bbox.bbox;

      var scale = Math.min(viewportWidth / (bbox.xmax - bbox.xmin), viewportHeight / (bbox.ymax - bbox.ymin));

      return {
        x: 0.5 * (bbox.xmin + bbox.xmax),
        y: 0.5 * (bbox.ymin + bbox.ymax),
        scale: scale
      };
    };
    this.pixelBoundingBoxToPixelCenter = pixelBoundingBoxToPixelCenter;

    // Convert {bbox:{ne:{lat:val,lng:val},sw:{lat:val,lng:val}}} OR {ne:{lat:val,lng:val},sw:{lat:val,lng:val}} to {x, y, scale}
    var latLngBoundingBoxToPixelCenter = function(bbox) {
      if (!bbox)
        return null;

      // If input happens to be of the form {bbox:{...}}
      if ( typeof (bbox.bbox) !== 'undefined')
        bbox = bbox.bbox;

      var projection = _getProjection();
      var newViewBboxNE = bbox.ne;
      var newViewBboxSW = bbox.sw;

      var a = projection.latlngToPoint({
        lat: newViewBboxNE.lat,
        lng: newViewBboxNE.lng
      });
      var b = projection.latlngToPoint({
        lat: newViewBboxSW.lat,
        lng: newViewBboxSW.lng
      });

      var xmax = Math.max(a.x, b.x);
      var xmin = Math.min(a.x, b.x);
      var ymax = Math.max(a.y, b.y);
      var ymin = Math.min(a.y, b.y);

      var scale = Math.min(viewportWidth / (xmax - xmin), viewportHeight / (ymax - ymin));

      return {
        x: 0.5 * (xmin + xmax),
        y: 0.5 * (ymin + ymax),
        scale: scale
      };
    };
    this.latLngBoundingBoxToPixelCenter = latLngBoundingBoxToPixelCenter;

    // Convert {center:{x:val, y:val}, zoom:val} to {x, y, scale}
    var pixelCenterViewToPixelCenter = function(theView) {
      if (!theView)
        return null;

      return {
        x: theView.center.x,
        y: theView.center.y,
        scale: Math.pow(2, theView.zoom) * panoView.scale
      };
    };
    this.pixelCenterViewToPixelCenter = pixelCenterViewToPixelCenter;

    // Convert {center:{lat:val, lng:val}, zoom:val} to {x, y, scale}
    var latLngCenterViewToPixelCenter = function(theView) {
      if (!theView)
        return null;

      var point = _getProjection().latlngToPoint({
        lat: theView.center.lat,
        lng: theView.center.lng
      });
      return {
        x: point.x,
        y: point.y,
        scale: Math.pow(2, theView.zoom) * panoView.scale
      };
    };
    this.latLngCenterViewToPixelCenter = latLngCenterViewToPixelCenter;

    //// Views with zoom ////

    // Convert {x, y, scale} OR {center:{x:val, y:val}, zoom:val} to {center:{lat:val, lng:val}, zoom:val}
    var pixelCenterToLatLngCenterView = function(theView) {
      if (!theView)
        return null;
      if (!theView.scale)
        theView = _normalizeView(theView);

      var projection = _getProjection();
      var latLng = projection.pointToLatlng({
        x: theView.x,
        y: theView.y
      });
      return {
        center: {
          lat: latLng.lat,
          lng: latLng.lng
        },
        zoom: scaleToZoom(theView.scale)
      };
    };
    this.pixelCenterToLatLngCenterView = pixelCenterToLatLngCenterView;

    // Convert pixel bounding box to {center:{lat, lng}, zoom:z}
    var pixelBoundingBoxToLatLngCenterView = function(bbox) {
      if (!bbox)
        return null;

      // bbox will be normalized if it is in the form {bbox:{...}}
      var centerView = pixelBoundingBoxToPixelCenter(bbox);
      var projection = _getProjection();
      var latLng = projection.pointToLatlng({
        x: centerView.x,
        y: centerView.y
      });
      return {
        center: {
          lat: latLng.lat,
          lng: latLng.lng
        },
        zoom: scaleToZoom(centerView.scale)
      };
    };
    this.pixelBoundingBoxToLatLngCenterView = pixelBoundingBoxToLatLngCenterView;

    // Convert {xmin:val, xmax:val, ymin:val, ymax:val} OR {bbox:{xmin:{x:val,y:val},xmax:{x:val,y:val}}} to {center:{x:val, y:val}, zoom:val}
    var pixelBoundingBoxToPixelCenterView = function(bbox) {
      if (!bbox)
        return null;
      if (bbox.bbox)
        bbox = _normalizeView(bbox);

      var pixelFit = pixelBoundingBoxToPixelCenter(bbox);
      return {
        center: {
          x: pixelFit.x,
          y: pixelFit.y
        },
        zoom: scaleToZoom(pixelFit.scale)
      };
    };
    this.pixelBoundingBoxToPixelCenterView = pixelBoundingBoxToPixelCenterView;

    // Convert {x, y, scale} OR {center:{x:val, y:val}, zoom:val} to {bbox:{xmin:val,xmax:val,ymin:val,ymax:val}}
    var pixelCenterToPixelBoundingBoxView = function(theView) {
      if (!theView)
        return null;
      if (!theView.scale)
        theView = _normalizeView(theView);

      var halfWidth = 0.5 * viewportWidth / theView.scale;
      var halfHeight = 0.5 * viewportHeight / theView.scale;
      return {
        bbox: {
          xmin: theView.x - halfWidth,
          xmax: theView.x + halfWidth,
          ymin: theView.y - halfHeight,
          ymax: theView.y + halfHeight
        }
      };
    };
    this.pixelCenterToPixelBoundingBoxView = pixelCenterToPixelBoundingBoxView;

    // Convert {x, y, scale} OR {center:{x:val, y:val}, zoom:val} to {bbox:{ne:{lat:val,lng:val},sw:{lat:val,lng:val}}}
    var pixelCenterToLatLngBoundingBoxView = function(theView) {
      if (!theView)
        return null;
      if (!theView.scale)
        theView = _normalizeView(theView);

      var pixelBound = pixelCenterToPixelBoundingBoxView(theView).bbox;
      var projection = _getProjection();
      var min = projection.pointToLatlng({
        x: pixelBound.xmin,
        y: pixelBound.ymin
      });
      var max = projection.pointToLatlng({
        x: pixelBound.xmax,
        y: pixelBound.ymax
      });
      return {
        bbox: {
          ne: min,
          sw: max
        }
      };
    };
    this.pixelCenterToLatLngBoundingBoxView = pixelCenterToLatLngBoundingBoxView;

    // Convert {xmin:val, xmax:val, ymin:val, ymax:val} OR {bbox:{xmin:{x:val,y:val},xmax:{x:val,y:val}}} to {bbox:{ne:{lat:val,lng:val},sw:{lat:val,lng:val}}}
    var pixelBoundingBoxToLatLngBoundingBoxView = function(bbox) {
      if (!bbox)
        return null;
      return pixelCenterToLatLngBoundingBoxView(pixelBoundingBoxToPixelCenter(bbox));
    };
    this.pixelBoundingBoxToLatLngBoundingBoxView = pixelBoundingBoxToLatLngBoundingBoxView;

    var onPanoLoadSuccessCallback = function(data, desiredView, doWarp) {
      UTIL.log('onPanoLoadSuccessCallback(' + JSON.stringify(data) + ', ' + view + ', ' + ')');
      isSplitVideo = 'frames_per_fragment' in data;
      framesPerFragment = isSplitVideo ? data['frames_per_fragment'] : data['frames'];
      secondsPerFragment = isSplitVideo ? framesPerFragment / data['fps'] : 1 / data['fps'] * (data['frames'] - 1);
      UTIL.log("isSplitVideo=[" + isSplitVideo + "], framesPerFragment=[" + framesPerFragment + "], secondsPerFragment=[" + secondsPerFragment + "]");
      panoWidth = data['width'];
      panoHeight = data['height'];
      tileWidth = data['tile_width'];
      tileHeight = data['tile_height'];
      videoWidth = data['video_width'];
      videoHeight = data['video_height'];
      videoset.setFps(data['fps']);
      var framesToSkipAtStart = (data['frames'] < skippedFramesAtStart) ? 0 : skippedFramesAtStart;
      var framesToSkipAtEnd = (data['frames'] < skippedFramesAtEnd) ? 0 : skippedFramesAtEnd;
      frames = data['frames'] - framesToSkipAtEnd - framesToSkipAtStart;
      videoset.setDuration((1 / data['fps']) * frames);
      videoset.setLeader((data['leader'] + framesToSkipAtStart) / data['fps']);
      videoset.setIsSplitVideo(isSplitVideo);
      videoset.setSecondsPerFragment(secondsPerFragment);
      maxLevel = data['nlevels'] - 1;
      levelInfo = data['level_info'];
      metadata = data;
      timelapseDurationInSeconds = (frames - 0.7) / data['fps'];

      if (loadTimelapseWithPreviousViewAndTime && captureTimes.length > 0 && captureTimes[timelapseCurrentCaptureTimeIndex].length >= 11) {
        var captureTimeStamp = captureTimes[timelapseCurrentCaptureTimeIndex].substring(11);
        previousCaptureTime = new Date("2000/01/01 " + captureTimeStamp).toTimeString().substr(0, 5);
      }

      // Set capture time
      if (tmJSON["capture-times"]) {
        tmJSON["capture-times"].splice(tmJSON["capture-times"].length - framesToSkipAtEnd, framesToSkipAtEnd);
        tmJSON["capture-times"].splice(0, framesToSkipAtStart);
        captureTimes = tmJSON["capture-times"];
      } else {
        for (var i = 0; i < frames; i++) {
          captureTimes.push("--");
        }
      }
    };

    var refresh = function() {
      if (!isFinite(view.scale))
        return;

      var bestIdx = computeBestVideo(targetView);
      if (bestIdx != currentIdx) {
        currentVideo = addTileidx(bestIdx);
        currentIdx = bestIdx;
      }

      var activeVideos = videoset.getActiveVideos();
      for (var key in activeVideos) {
        var video = activeVideos[key];
        repositionVideo(video);
      }
    };

    var getTimelapseCurrentTimeInSeconds = function() {
      return timelapseCurrentTimeInSeconds;
    };
    this.getTimelapseCurrentTimeInSeconds = getTimelapseCurrentTimeInSeconds;

    var getCurrentFrameNumber = function() {
      return Math.floor(timelapseCurrentTimeInSeconds * _getFps());
    };
    this.getCurrentFrameNumber = getCurrentFrameNumber;

    // Update the scale bar and the context map
    // Need to call this when changing the view
    var updateLocationContextUI = function() {
      if (!defaultUI)
        return null;
      if (scaleBar == undefined && smallGoogleMap == undefined && defaultUI.getMode() == "player")
        return null;
      if (visualizer || smallGoogleMap || scaleBar) {
        // Need to get the projection dynamically when the viewer size changes
        var videoViewer_projection;
        if (tmJSON['projection-bounds'])
          videoViewer_projection = _getProjection();

        if (isHyperwall && !masterView)
          masterView = thisObj.getView();

        var desiredView = isHyperwall ? masterView : view;

        var latlngCenter;
        if (videoViewer_projection) {
          latlngCenter = videoViewer_projection.pointToLatlng(desiredView);
        }
        // Update the scale bar
        if (scaleBar && videoViewer_projection) {
          scaleBar.setScaleBar(desiredView, latlngCenter);
        }
        // Update context maps
        if (visualizer || smallGoogleMap) {
          var desiredBound = pixelCenterToPixelBoundingBoxView(desiredView).bbox;
          if (videoViewer_projection && smallGoogleMap && enableSmallGoogleMap == true) {
            smallGoogleMap.setMap(desiredBound, latlngCenter);
          }
          if (visualizer) {
            visualizer.setMap(desiredBound);
          }
        }// End of if (visualizer || smallGoogleMap)
      }// End of if (visualizer || smallGoogleMap || scaleBar)
    };
    this.updateLocationContextUI = updateLocationContextUI;

    var loadSharedDataFromUnsafeURL = function(unsafe_fullURL, playOnLoad) {
      var unsafe_matchURL = unsafe_fullURL.match(/#(.+)/);
      if (unsafe_matchURL) {
        var unsafe_sharedVars = UTIL.unpackVars(unsafe_matchURL[1]);
        // Can be a tour or a presentation slider
        var unsafe_sharedData;
        var snaplapseForSharedData;
        // Find if shared data exists in the URL
        if (unsafe_sharedVars.tour && snaplapseForSharedTour) {
          unsafe_sharedData = unsafe_sharedVars.tour;
          snaplapseForSharedData = snaplapseForSharedTour;
          UTIL.addGoogleAnalyticEvent('window', 'onHashChange', 'url-load-tour');
        } else if (unsafe_sharedVars.presentation && snaplapseForPresentationSlider) {
          unsafe_sharedData = unsafe_sharedVars.presentation;
          snaplapseForSharedData = snaplapseForPresentationSlider;
          UTIL.addGoogleAnalyticEvent('window', 'onHashChange', 'url-load-presentation');
        }
        // Handle the shared data
        if (unsafe_sharedData) {
          var snaplapseViewerForSharedData = snaplapseForSharedData.getSnaplapseViewer();
          if (snaplapseViewerForSharedData) {
            // Sanitize and parse data
            var sharedData = snaplapseForSharedData.urlStringToJSON(unsafe_sharedData);
            if (sharedData) {
              // Tours
              if (playOnLoad && unsafe_sharedVars.tour) {
                var onLoad = function() {
                  snaplapseViewerForSharedData.removeEventListener('snaplapse-loaded', onLoad);
                  $("#" + viewerDivId + " .tourLoadOverlay").css("visibility", "visible");
                  //$("#" + viewerDivId + " .tourLoadOverlayPlay").css("visibility", "visible");
                  snaplapseViewerForSharedData.animateTourOverlayAndPlay(0);
                };
                snaplapseViewerForSharedData.addEventListener('snaplapse-loaded', onLoad);
              }
              // Load the tour or presentation slider, depending upon what is contained in sharedData.
              snaplapseViewerForSharedData.loadNewSnaplapse(sharedData, playOnLoad);
            }
          }
        }
      }
    };
    this.loadSharedDataFromUnsafeURL = loadSharedDataFromUnsafeURL;

    var needFirstAncestor = function(tileidx) {
      //UTIL.log("need ancestor for " + dumpTileidx(tileidx));
      var a = tileidx;
      while (a) {
        a = getTileidxParent(a);
        //UTIL.log("checking " + dumpTileidx(a) + ": present=" + !!tiles[a] + ", ready=" + (tiles[a]?tiles[a].video.ready:"n/a"));
        if (tiles[a] && tiles[a].video.ready) {
          tiles[a].needed = true;
          //UTIL.log("need ancestor " + dumpTileidx(tileidx) + ": " + dumpTileidx(a));
          return;
        }
      }
      //UTIL.log("need ancestor " + dumpTileidx(tileidx) + ": none found");
    };

    var findFirstNeededAncestor = function(tileidx) {
      var a = tileidx;
      while (a) {
        a = getTileidxParent(a);
        if (tiles[a] && tiles[a].needed)
          return a;
      }
      return false;
    };

    var addTileidx = function(tileidx) {
      var url = getTileidxUrl(tileidx);
      var geom = tileidxGeometry(tileidx);
      //UTIL.log("adding tile " + dumpTileidx(tileidx) + " from " + url + " and geom = (left:" + geom['left'] + " ,top:" + geom['top'] + ", width:" + geom['width'] + ", height:" + geom['height'] + ")");
      var video = videoset.addVideo(url, geom);
      video.tileidx = tileidx;
      return video;
    };

    var deleteTileidx = function(tileidx) {
      var tile = tiles[tileidx];
      if (!tile) {
        UTIL.error('deleteTileidx(' + dumpTileidx(tileidx) + '): not loaded');
        return;
      }
      UTIL.log("removing tile " + dumpTileidx(tileidx) + " ready=" + tile.video.ready);

      videoset.deleteVideo(tile.video);
      delete tiles[tileidx];
    };

    var getTileidxUrl = function(tileidx) {
      //var shardIndex = (getTileidxRow(tileidx) % 2) * 2 + (getTileidxColumn(tileidx) % 2);
      //var urlPrefix = url.replace("//", "//t" + shardIndex + ".");
      var fragmentSpecifier = isSplitVideo ? "_" + videoset.getFragment(videoset.getCurrentTime()) : "";
      var videoURL = datasetPath + getTileidxLevel(tileidx) + "/" + getTileidxRow(tileidx) + "/" + getTileidxColumn(tileidx) + fragmentSpecifier + mediaType;
      //return ( isIE9 ? videoURL + "?time=" + new Date().getTime() : videoURL);
      return videoURL;
    };

    var computeBestVideo = function(theView) {
      //UTIL.log("computeBestVideo " + view2string(theView));
      var level = scale2level(view.scale);
      var levelScale = Math.pow(2, maxLevel - level);
      var col = Math.round((theView.x - (videoWidth * levelScale * 0.5)) / (tileWidth * levelScale));
      col = Math.max(col, 0);
      col = Math.min(col, levelInfo[level].cols - 1);
      var row = Math.round((theView.y - (videoHeight * levelScale * 0.5)) / (tileHeight * levelScale));
      row = Math.max(row, 0);
      row = Math.min(row, levelInfo[level].rows - 1);
      //UTIL.log("computeBestVideo l=" + level + ", c=" + col + ", r=" + row);
      return tileidxCreate(level, col, row);
    };

    var scale2level = function(scale) {
      // Minimum level is 0, which has one tile
      // Maximum level is maxLevel, which is displayed 1:1 at scale=1
      var idealLevel = Math.log(scale) / Math.log(2) + maxLevel;
      var selectedLevel = Math.floor(idealLevel + levelThreshold);
      selectedLevel = Math.max(selectedLevel, 0);
      selectedLevel = Math.min(selectedLevel, maxLevel);
      //UTIL.log('scale2level('+scale+'): idealLevel='+idealLevel+', ret='+selectedLevel);
      return selectedLevel;
    };

    var tileidxGeometry = function(tileidx) {
      var levelScale = Math.pow(2, maxLevel - getTileidxLevel(tileidx));

      // Calculate left, right, top, bottom, rounding to nearest pixel;  avoid gaps between tiles.
      var left = view.scale * (getTileidxColumn(tileidx) * tileWidth * levelScale - view.x) + viewportWidth * 0.5;
      var right = Math.round(left + view.scale * levelScale * videoWidth);
      left = Math.round(left);

      var top = view.scale * (getTileidxRow(tileidx) * tileHeight * levelScale - view.y) + viewportHeight * 0.5;
      var bottom = Math.round(top + view.scale * levelScale * videoHeight);
      top = Math.round(top);

      return {
        left: left,
        top: top,
        width: (right - left),
        height: (bottom - top)
      };
    };

    var repositionVideo = function(video) {
      videoset.repositionVideo(video, tileidxGeometry(video.tileidx));
    };

    this.writeStatusToLog = function() {
      videoset.writeStatusToLog();
    };

    this.getTiles = function() {
      return tiles;
    };

    ///////////////////////////
    // Tile index
    //
    // Represent tile coord as a 31-bit integer so we can use it as an index
    // l:4 (0-15)   r:13 (0-8191)  c:14 (0-16383)
    // 31-bit representation
    //
    var tileidxCreate = function(l, c, r) {
      return (l << 27) + (r << 14) + c;
    };

    var getTileidxLevel = function(t) {
      return t >> 27;
    };

    var getTileidxRow = function(t) {
      return 8191 & (t >> 14);
    };

    var getTileidxColumn = function(t) {
      return 16383 & t;
    };

    var getTileidxParent = function(t) {
      return tileidxCreate(getTileidxLevel(t) - 1, getTileidxColumn(t) >> 1, getTileidxRow(t) >> 1);
    };

    var dumpTileidx = function(t) {
      return "{l:" + getTileidxLevel(t) + ",c:" + getTileidxColumn(t) + ",r:" + getTileidxRow(t) + "}";
    };

    function validateAndSetDatasetIndex(newDatasetIndex) {
      // Make sure the datasetIndex is a valid number, and within the range of datasets for this timelapse.
      if (!UTIL.isNumber(newDatasetIndex)) {
        datasetIndex = 0;
      } else {
        datasetIndex = Math.max(0, Math.min(newDatasetIndex, tmJSON["datasets"].length - 1));
      }
    }

    function getMetadataCacheBreaker() {
      return ( enableMetadataCacheBreaker ? ("?" + new Date().getTime()) : "");
    }

    var handleLeavePageWithEditor = function() {
      if ((editorEnabled && snaplapse && snaplapse.getKeyframes().length > 0) || (annotator && annotator.getAnnotationList().length > 0)) {
        return "You are attempting to leave this page while creating a tour.";
      }
    };

    function setupUIHandlers() {
      // Alert when an editor (tour or annotator) is up and the user tries to leave the page.
      if (editorEnabled || annotator) {
        $(window).on('beforeunload', handleLeavePageWithEditor);
      }

      // On URL hash change, do share view related stuff
      window.onhashchange = handleHashChange;
    }

    var isCurrentTimeAtOrPastDuration = function() {
      // Fix the numbers, but subtract 0 from each to convert back to float since toFixed gives a string
      var num1Fixed = timelapseCurrentTimeInSeconds.toFixed(3) - 0;
      var num2Fixed = timelapseDurationInSeconds.toFixed(3) - 0;
      if (isIE9)
        num1Fixed += 0.07;
      return num1Fixed >= num2Fixed;
    };
    this.isCurrentTimeAtOrPastDuration = isCurrentTimeAtOrPastDuration;

    function setupTimelapse() {
      _addTimeChangeListener(function(t) {
        if (annotator)
          annotator.updateAnnotationPositions();

        timelapseCurrentTimeInSeconds = t;
        timelapseCurrentCaptureTimeIndex = Math.min(frames - 1, Math.floor(t * _getFps()));
        if (timelapseCurrentTimeInSeconds.toFixed(3) < 0 || (timelapseCurrentTimeInSeconds.toFixed(3) == 0 && thisObj.getPlaybackRate() < 0)) {
          timelapseCurrentTimeInSeconds = 0;
          _pause();
          _seek(0);
        }

        if (isCurrentTimeAtOrPastDuration() && thisObj.getPlaybackRate() > 0) {
          timelapseCurrentTimeInSeconds = timelapseDurationInSeconds;
          if (!thisObj.isPaused()) {
            if (snaplapse != null && snaplapse.isPlaying())
              return;
            if (loopPlayback) {
              if (loopDwell) {
                if (doingLoopingDwell)
                  return;
                doingLoopingDwell = true;
                updateCustomPlayback();
                _pause();
                loopStartTimeoutId = window.setTimeout(function() {
                  _seek(0);
                  loopEndTimeoutId = window.setTimeout(function() {
                    _play();
                    doingLoopingDwell = false;
                  }, endDwell * 1000);
                }, startDwell * 1000);
              } else {
                updateCustomPlayback();
                _seek(0);
                _pause();
                _play();
              }
            } else {
              _pause();
            }
          }
        }
        $("#" + viewerDivId + " .currentTime").html(UTIL.formatTime(timelapseCurrentTimeInSeconds, true));
        $("#" + viewerDivId + " .currentCaptureTime").html(UTIL.htmlForTextWithEmbeddedNewlines(captureTimes[timelapseCurrentCaptureTimeIndex]));
        $("#" + viewerDivId + " .timelineSlider").slider("value", (timelapseCurrentTimeInSeconds * _getFps() - 0.3));
      });

      _addTargetViewChangeListener(function(view) {
        $("#" + viewerDivId + " .zoomSlider").slider("value", _viewScaleToZoomSlider(view.scale));
      });

      _addViewChangeListener(function() {
        // TODO: move to the annotator
        if (annotator)
          annotator.updateAnnotationPositions();
        if (!isHyperwall)
          updateLocationContextUI();
      });

      _addVideoPauseListener(function() {
        // The videoset might cause playback to pause, such as when it decides
        // it's hit the end (even though the current time might not be >= duration),
        // so we need to make sure the play button is updated.
        if (doingLoopingDwell)
          return;
        // TODO: UI Class should handle this
        if (customUI) {
          $("#" + viewerDivId + " .customPlay").button({
            icons: {
              primary: "ui-icon-custom-play"
            },
            text: false
          }).attr({
            "title": "Play"
          });
          if (customUI.getLocker() != "month") {
            // The UI when the month locker is enabled is handled in customUI.js
            $("#" + viewerDivId + " .modisCustomPlay").button({
              icons: {
                primary: "ui-icon-custom-play"
              },
              text: false
            }).attr({
              "title": "Play"
            });
          }
        }
        // TODO: UI Class should handle this
        $("#" + viewerDivId + " .playbackButton").button({
          icons: {
            secondary: "ui-icon-custom-play"
          }
        }).attr('title', 'Play');
        $("#" + viewerDivId + " .playbackButton").removeClass("pause").addClass("play").attr('title', 'Play');
      });

      _addVideoPlayListener(function() {
        // Always make sure that when we are playing, the button status is updated
        if (doingLoopingDwell)
          return;
        // TODO: UI Class should handle this
        if (customUI) {
          $("#" + viewerDivId + " .customPlay").button({
            icons: {
              primary: "ui-icon-custom-pause"
            },
            text: false
          }).attr({
            "title": "Pause"
          });
          if (customUI.getLocker() != "month") {
            // The UI when the month locker is enabled is handled in customUI.js
            $("#" + viewerDivId + " .modisCustomPlay").button({
              icons: {
                primary: "ui-icon-custom-pause"
              },
              text: false
            }).attr({
              "title": "Pause"
            });
          }
        }
        // TODO: UI Class should handle this
        $("#" + viewerDivId + " .playbackButton").button({
          icons: {
            secondary: "ui-icon-custom-pause"
          }
        }).attr('title', 'Pause');
        $("#" + viewerDivId + " .playbackButton").removeClass("play").addClass("pause").attr('title', 'Pause');
      });

      _makeVideoVisibleListener(function(videoId) {
        // This is the first video of the dataset being displayed
        if (videoId == firstVideoId) {
          // If the user requested the same point spatial and temporal point in the previous dataset, calculate and seek there.
          if (loadTimelapseWithPreviousViewAndTime) {
            var closestFrame = findExactOrClosestCaptureTime(previousCaptureTime);
            seekToFrame(closestFrame);
            timelapseCurrentTimeInSeconds = closestFrame / _getFps();
          } else {
            if (desiredInitialDate) {
              initialTime = findExactOrClosestCaptureTime(desiredInitialDate.toTimeString().substr(0, 5)) / _getFps();
            }
            if (initialTime == 0) {
              timelapseCurrentTimeInSeconds = 0;
              // Fixes Safari/IE bug which causes the video to not be displayed if the video has no leader and the initial
              // time is zero (the video seeked event is never fired, so videoset never gets the cue that the video
              // should be displayed).  The fix is to simply seek half a frame in.  Yeah, the video won't be starting at
              // *zero*, but the displayed frame will still be the right one, so...good enough.  :-)
              if (videoset.getLeader() <= 0 && (isSafari || isIE)) {
                var halfOfAFrame = 1 / _getFps() / 2;
                _seek(halfOfAFrame);
              }
            } else {
              timelapseCurrentTimeInSeconds = initialTime;
              _seek(initialTime);
            }
          }

          if (didFirstTimeOnLoad) {
            timelapseCurrentCaptureTimeIndex = Math.min(frames - 1, Math.floor(timelapseCurrentTimeInSeconds * _getFps()));
            // Recreate timeline slider.
            // There seems to be an issue with the jQuery UI slider widget, since just changing the max value and refreshing
            // the slider does not proplerly update the available range. So we have to manually recreate it...
            var $timeSlider = $("#" + viewerDivId + " .timelineSlider");
            $timeSlider.slider("destroy");
            defaultUI.createTimelineSlider();
            $timeSlider.slider("option", "value", timelapseCurrentCaptureTimeIndex);
          } else {
            loadSharedDataFromUnsafeURL(UTIL.getUnsafeHashString());
            didFirstTimeOnLoad = true;
            // Fire onTimeMachinePlayerReady the first time the page is loaded.
            if ( typeof (settings["onTimeMachinePlayerReady"]) === "function") {
              settings["onTimeMachinePlayerReady"](timeMachineDivId);
            }
          }

          hideSpinner(viewerDivId);
          if (typeof onNewTimelapseLoadCompleteCallBack === "function")
            onNewTimelapseLoadCompleteCallBack();
        }
      });

      snaplapseForSharedTour = new org.gigapan.timelapse.Snaplapse(thisObj, settings, "noUI");

      if (editorEnabled) {
        $("#" + videoDivId).append('<div class="snaplapse-annotation-description"><div></div></div>');
        snaplapse = new org.gigapan.timelapse.Snaplapse(thisObj, settings);

        // TODO:
        // Disabled by default because of odd behavior in Chrome. Causes an endless 'waiting for socket' error to appear
        // if too many tabs/windows are open with Time Machines loaded. The behavior is a bit similar to the Chrome
        // cache bug in the sense that once you close a window, one that was stuck will start to work.
        // Visualizer loads a top level video to be used as a context map in the editor. It seeks when the main video also seeks.
        // Most likely that is at the heart of the problem.
        //
        // Timewarp visualizer that shows the location of the current view and transitions between keyframes
        if (enableContextMapOnDefaultUI && !tmJSON['projection-bounds'])
          visualizer = new org.gigapan.timelapse.Visualizer(thisObj, snaplapse, visualizerGeometry);
      }

      if (presentationSliderEnabled)
        snaplapseForPresentationSlider = new org.gigapan.timelapse.Snaplapse(thisObj, settings, "presentation");
      if (annotatorEnabled)
        annotator = new org.gigapan.timelapse.Annotator(thisObj);

      defaultUI = new org.gigapan.timelapse.DefaultUI(thisObj, settings);
      if (useCustomUI)
        customUI = new org.gigapan.timelapse.CustomUI(thisObj, settings);

      // TODO(pdille):
      // Bring back this feature for those with RealPlayer/DivX or other plugins that take-over the video tag element.
      //handlePluginVideoTagOverride();

      // Must be placed after customUI is created
      if (settings["scaleBarOptions"] && tmJSON['projection-bounds'])
        scaleBar = new org.gigapan.timelapse.ScaleBar(settings["scaleBarOptions"], thisObj);

      if (isHyperwall)
        customUI.handleHyperwallChangeUI();

      if (settings["smallGoogleMapOptions"] && tmJSON['projection-bounds'] && typeof google !== "undefined") {
        if (!isHyperwall || fields.showMap)
          smallGoogleMap = new org.gigapan.timelapse.SmallGoogleMap(settings["smallGoogleMapOptions"], thisObj, settings);
      }

      thisObj.setPlaybackRate(playbackSpeed);

      setupUIHandlers();
      setupSliderHandlers(viewerDivId);

      // The UI is now ready and we can display it
      $("#" + viewerDivId).css("visibility", "visible");
    }


    this.switchLayer = function(layerNum) {
      var newIndex = layerNum * tmJSON["sizes"].length;
      datasetLayer = layerNum;
      loadTimelapseWithPreviousViewAndTime = true;
      validateAndSetDatasetIndex(newIndex);
      loadTimelapseCallback(tmJSON);
    };

    var loadTimelapse = function(url, desiredView, desiredTime, preserveCurrentViewAndTime, desiredDate, onLoadCompleteCallBack) {
      showSpinner(viewerDivId);

      settings["url"] = url;
      // Add trailing slash to url if it was omitted
      if (settings["url"].charAt(settings["url"].length - 1) != "/")
        settings["url"] += "/";

      // If the user specifies a starting view, use it.
      if (desiredView && typeof (desiredView) === "object") {
        initialView = desiredView;
      } else {
        initialView = null;
      }
      settings["initialView"] = initialView;

      // If the user specifies a starting time, use it.
      if (desiredTime && typeof (desiredTime) === "number") {
        initialTime = desiredTime;
        settings["initialTime"] = initialTime;
      } else {
        initialTime = 0;
      }

      // Set the initial desired date (Date object)
      desiredInitialDate = desiredDate;

      // Set the call back
      onNewTimelapseLoadCompleteCallBack = onLoadCompleteCallBack;

      loadTimelapseWithPreviousViewAndTime = !!preserveCurrentViewAndTime;

      // We are loading a new timelapse and in order for code that should only be run when the
      // first video of a timelapse is displayed, we need to reset the firstVideoId to the next
      // id that the videoset class will use. See _makeVideoVisibleListener() where we check for
      // first time videos.
      if (didFirstTimeOnLoad) {
        firstVideoId = videoDivId + "_" + (videoset.getCurrentVideoId() + 1);
      }

      UTIL.ajax("json", settings["url"], "tm.json" + getMetadataCacheBreaker(), loadTimelapseCallback);
    };
    this.loadTimelapse = loadTimelapse;

    var loadTimelapseCallback = function(json) {
      tmJSON = json;
      // Assume tiles and json are on same host
      tileRootPath = settings["url"];

      // layer + size = index of dataset
      validateAndSetDatasetIndex(datasetLayer * tmJSON["sizes"].length);
      var path = tmJSON["datasets"][datasetIndex]['id'] + "/";
      datasetPath = settings["url"] + path;
      UTIL.ajax("json", settings["url"], path + "r.json" + getMetadataCacheBreaker(), loadVideoSetCallback);
    };

    // Assumes dates are being used as capture times.
    var findExactOrClosestCaptureTime = function(timeToFind) {
      var low = 0, high = captureTimes.length - 1, i, comparison;
      while (low <= high) {
        i = Math.floor((low + high) / 2);
        if (captureTimes[i].length < 11)
          return 0;
        var captureTimeStamp = captureTimes[i].substring(11);
        var newCompare = new Date("2000/01/01 " + captureTimeStamp).toTimeString().substr(0, 5);
        if (newCompare < timeToFind) {
          low = i + 1;
          continue;
        };
        if (newCompare > timeToFind) {
          high = i - 1;
          continue;
        };
        return i;
      }
      return i;
    };
    this.findExactOrClosestCaptureTime = findExactOrClosestCaptureTime;

    var loadVideoSetCallback = function(data) {
      datasetJSON = data;

      // Reset currentIdx so that we'll load in the new tile with the different resolution.  We don't null the
      // currentVideo here because 1) it will be assigned in the refresh() method when it compares the bestIdx
      // and the currentIdx; and 2) we want currentVideo to be non-null so that the VideosetStats can keep
      // track of what video replaced it.
      currentIdx = null;
      onPanoLoadSuccessCallback(data, null, true);

      // We've already loaded the UI, so just do new dataset specific setup.
      if (didFirstTimeOnLoad) {
        setInitialView();
        // Discard the custom home view setting if the user is not preserving the previous current view for the new dataset
        if (!loadTimelapseWithPreviousViewAndTime)
          settings["newHomeView"] = undefined;
        // Reset home view
        computeHomeView();
        if (!view)
          view = $.extend({}, homeView);
        _warpTo(view);
      } else {
        initializeUI();
        setupTimelapse();
      }

      if (visualizer) {
        topLevelVideo.src = getTileidxUrl(0);
        topLevelVideo.geometry = tileidxGeometry(0);
        leader = videoset.getLeader();
        visualizer.loadContextMap();
        panoVideo = visualizer.clonePanoVideo(topLevelVideo);
      }
    };

    function loadPlayerControlsTemplate(html) {
      // Add player_template.html to the DOM
      $("#" + timeMachineDivId).html(html);
      var $viewerDiv = $("#" + viewerDivId);

      // Hide the UI because it is not ready yet
      $viewerDiv.css("visibility", "hidden");

      var tmp = document.getElementById("{REPLACE}");
      $(tmp).attr("id", timeMachineDivId + "_timelapse");
      videoDivId = $(tmp).attr("id");
      videoDiv = document.getElementById(videoDivId);
      firstVideoId = videoDivId + "_1";

      // Prevent the UI from being selected by the user.
      $viewerDiv.attr('unselectable', 'on').css({
        '-moz-user-select': 'none',
        '-o-user-select': 'none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
      });

      // TODO: Check that this hasn't bitrotted.
      dataPanesId = tmp.id + "_dataPanes";
      $("#" + videoDivId).append("<div id=" + dataPanesId + "></div>");

      if (viewerType == "canvas") {
        canvas = document.createElement('canvas');
        canvas.id = videoDivId + "_canvas";
        videoDiv.appendChild(canvas);
        blackFrameDetectionCanvas = document.createElement('canvas');
        blackFrameDetectionCanvas.id = videoDivId + "_canvas_blackFrameDetection";
        blackFrameDetectionCanvas.style.display = "none";
        if (blackFrameDetection)
          videoDiv.appendChild(blackFrameDetectionCanvas);
        videoset = new org.gigapan.timelapse.Videoset(viewerDivId, videoDivId, thisObj, canvas.id, blackFrameDetectionCanvas.id);
      } else if (viewerType == "video") {
        videoset = new org.gigapan.timelapse.Videoset(viewerDivId, videoDivId, thisObj);
      }

      // Setup viewport event handlers.
      videoDiv['onmousedown'] = handleMousedownEvent;
      videoDiv['ondblclick'] = handleDoubleClickEvent;

      $(videoDiv).mousewheel(thisObj.handleMousescrollEvent);

      $viewerDiv.one("click", function() {
        $(document).on("keydown.tm_keydown", handleKeydownEvent);
        $(document).on("keyup.tm_keyup", handleKeyupEvent);
      });

      // Remove focus from other UI elements (such as the timeline) when
      // the view port is clicked. This ensures when, for example, keyboard shortcuts
      // are used that the view port is the one that receives the events.
      $(videoDiv).attr("tabindex", 2013).on("click", function() {
        $(this).focus();
      });

      // When you do a path from an external css file in IE, it is actually relative to the document and not the css file. This is against the spec. ARGH!
      // So we have a choice: Do multiple paths in the css file, getting a 404 in Chrome for invalid relative paths OR we do the style in the document itself,
      // which in any browser will reslove relative paths correctly. We choose the latter to keep the message console clean.
      $('<style type="text/css">.closedHand {cursor: url("' + rootAppURL + 'css/cursors/closedhand.cur"), move !important;} .openHand {cursor: url("' + rootAppURL + 'css/cursors/openhand.cur"), move !important;} .tiledContentHolder {cursor: url("' + rootAppURL + 'css/cursors/openhand.cur"), move;}</style>').appendTo($('head'));

      loadTimelapse(settings["url"], settings["initialView"], settings["initialTime"]);
    }

    function setupSliderHandlers(viewerDivId) {
      var $viewerDiv = $("#" + viewerDivId);
      $viewerDiv.on("mouseover mouseup", ".ui-slider-handle", function() {
        $(this).removeClass("openHand closedHand").addClass("openHand");
      });

      $viewerDiv.on({
        slide: function() {
          $(this).removeClass("openHand closedHand").addClass("closedHand");
          $viewerDiv.on("mousemove", ".ui-slider-handle", function() {
            $(this).removeClass("openHand closedHand").addClass("closedHand");
          });
        },
        slidestop: function() {
          $viewerDiv.on("mousemove", ".ui-slider-handle", function() {
            $(this).removeClass("openHand closedHand").addClass("openHand");
          });
        },
        mouseover: function() {
          $(this).removeClass("openHand closedHand");
        }
      });
    }

    function handlePluginVideoTagOverride() {
      if (browserSupported && $("#1").is("EMBED")) {
        $("#player").hide();
        $("#time_warp_composer").hide();
        $("#html5_overridden_message").show();
      }
    }

    var showSpinner = function(viewerDivId) {
      UTIL.log("showSpinner");
      $("#" + viewerDivId + " .spinnerOverlay").show();
    };
    this.showSpinner = showSpinner;

    var hideSpinner = function(viewerDivId) {
      UTIL.log("hideSpinner");
      $("#" + viewerDivId + " .spinnerOverlay").hide();
    };
    this.hideSpinner = hideSpinner;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    browserSupported = UTIL.browserSupported(settings["mediaType"]);

    if (!browserSupported) {
      UTIL.ajax("html", rootAppURL, "templates/browser_not_supported_template.html", function(html) {
        $("#" + timeMachineDivId).html(html);
      });
      return;
    }

    mediaType = UTIL.getMediaType();

    if (settings["viewerType"])
      UTIL.setViewerType(settings["viewerType"]);

    viewerType = UTIL.getViewerType();

    // Set default loop dwell time
    // TODO: This should probably be set not just for landsat, but for all short datasets.
    // TODO: This should probably move to the setup function.
    if (datasetType == "landsat" && loopDwell == undefined) {
      loopDwell = {
        "startDwell": defaultLoopDwellTime,
        "endDwell": defaultLoopDwellTime
      };
      startDwell = defaultLoopDwellTime;
      endDwell = defaultLoopDwellTime;
    }

    UTIL.log('Timelapse("' + settings["url"] + '")');
    UTIL.ajax("html", rootAppURL, "templates/player_template.html", loadPlayerControlsTemplate);
  };
})();
