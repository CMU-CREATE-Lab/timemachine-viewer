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
//if (!org.gigapan.timelapse.VideosetStats) {
//  var noVideosetStatsMsg = "The org.gigapan.timelapse.VideosetStats library is required by org.gigapan.timelapse.Timelapse";
//  alert(noVideosetStatsMsg);
//  throw new Error(noVideosetStatsMsg);
//}
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

  org.gigapan.timelapse.loadTimeMachine = function(json) {
    var timelapseObj = availableTimelapses[availableTimelapses.length - 1];
    timelapseObj.loadTimelapseJSON(json);
  };

  org.gigapan.timelapse.loadVideoset = function(json) {
    var timelapseObj = availableTimelapses[availableTimelapses.length - 1];
    if (timelapseObj.getDatasetJSON() == null)
      timelapseObj.loadInitialVideoSet(json);
    else
      timelapseObj.loadVideoSet(json);
  };

  org.gigapan.timelapse.loadTours = function(json) {
    var timelapseObj = availableTimelapses[availableTimelapses.length - 1];
    timelapseObj.loadToursJSON(json);
  };

  org.gigapan.timelapse.Timelapse = function(viewerDivId, settings) {
    availableTimelapses.push(this);

    // Settings
    //settings["videosetStatsDivId"] = settings["videosetStatsDivId"] || "videoset_stats_container";
    //var hasLayers = settings["hasLayers"] || false;
    var loopPlayback = settings["loopPlayback"] || false;
    var customLoopPlaybackRates = settings["customLoopPlaybackRates"] || null;
    var playOnLoad = settings["playOnLoad"] || false;
    var playbackSpeed = settings["playbackSpeed"] && UTIL.isNumber(settings["playbackSpeed"]) ? settings["playbackSpeed"] : 1;
    var datasetLayer = settings["layer"] && UTIL.isNumber(settings["layer"]) ? settings["layer"] : 0;
    var initialTime = settings["initialTime"] && UTIL.isNumber(settings["initialTime"]) ? settings["initialTime"] : 0;
    var initialView = settings["initialView"] || null;
    var showShareBtn = ( typeof (settings["showShareBtn"]) == "undefined") ? true : settings["showShareBtn"];
    var showHomeBtn = ( typeof (settings["showHomeBtn"]) == "undefined") ? true : settings["showHomeBtn"];
    var showMainControls = ( typeof (settings["showMainControls"]) == "undefined") ? true : settings["showMainControls"];
    var showZoomControls = ( typeof (settings["showZoomControls"]) == "undefined") ? true : settings["showZoomControls"];
    var showFullScreenBtn = ( typeof (settings["showFullScreenBtn"]) == "undefined") ? true : settings["showFullScreenBtn"];
    var doChromeSeekableHack = ( typeof (settings["doChromeSeekableHack"]) == "undefined") ? true : settings["doChromeSeekableHack"];
    var doChromeBufferedHack = ( typeof (settings["doChromeBufferedHack"]) == "undefined") ? true : settings["doChromeBufferedHack"];
    var loopDwell = ( typeof (settings["loopDwell"]) == "undefined" || typeof (settings["loopDwell"]["startDwell"]) == "undefined" || typeof (settings["loopDwell"]["endDwell"]) == "undefined") ? null : settings["loopDwell"];
    var startDwell = (!loopDwell || typeof (settings["loopDwell"]["startDwell"]) == "undefined") ? 0 : settings["loopDwell"]["startDwell"];
    var endDwell = (!loopDwell || typeof (settings["loopDwell"]["endDwell"]) == "undefined") ? 0 : settings["loopDwell"]["endDwell"];
    var blackFrameDetection = ( typeof (settings["blackFrameDetection"]) == "undefined") ? false : settings["blackFrameDetection"];
    var viewportGeometry = {
      width: ( typeof (settings["viewportGeometry"]) == "undefined" || typeof (settings["viewportGeometry"]['width']) == "undefined") ? undefined : settings["viewportGeometry"]['width'],
      height: ( typeof (settings["viewportGeometry"]) == "undefined" || typeof (settings["viewportGeometry"]['height']) == "undefined") ? undefined : settings["viewportGeometry"]['height'],
      ratio: ( typeof (settings["viewportGeometry"]) == "undefined" || typeof (settings["viewportGeometry"]['ratio']) == "undefined") ? undefined : settings["viewportGeometry"]['ratio']
    };
    var skippedFrames = ( typeof (settings["skippedFrames"]) == "undefined") ? 0 : settings["skippedFrames"];
    var mediaType = ( typeof (settings["mediaType"]) == "undefined") ? null : settings["mediaType"];
    var showAddressLookup = ( typeof (settings["showAddressLookup"]) == "undefined") ? false : settings["showAddressLookup"];

    // Objects
    var videoset;
    //var videosetStats;
    var snaplapse;
    var snaplapseViewer;
    var scaleBar;
    var smallGoogleMap;
    var annotator;
    var customTimeline;
    var visualizer;

    // DOM elements
    var scaleBar_DOM;
    var $scaleBar_DOM;
    var smallGoogleMap_DOM;
    var $smallGoogleMap_DOM;
    var videoQualityContainer_DOM;
    var $videoQualityContainer_DOM;

    // Canvas version
    var canvas;
    var canvasTmp;
    var canvasContext;
    var canvasTmpContext;

    // Full screen variables
    var originalViewportWidth;
    var originalViewportHeight;
    var resizeTimeout;
    var fullScreen = false;
    var videoStretchRatio = 1;
    var scaleRatio = 1;
    var paraBeforeFullScreen = {
      homeViewX: undefined,
      homeViewY: undefined,
      homeViewScale: undefined,
      panoWidth: undefined,
      panoHeight: undefined,
      videoWidth: undefined,
      videoHeight: undefined,
      tileWidth: undefined,
      tileHeight: undefined,
      offset: {
        left: undefined,
        top: undefined
      }
    };

    // Flags
    var isSplitVideo = false;
    var isSafari = UTIL.isSafari();
    var isIE = UTIL.isIE();
    var isIE9 = UTIL.isIE9();
    var doingLoopingDwell = false;
    var isFirefox = UTIL.isFirefox();

    // Viewer
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
    var targetView = null;
    var currentIdx = null;
    var currentVideo = null;
    var animateInterval = null;
    var lastAnimationTime;
    var minTranslateSpeedPixelsPerSecond = 25.0;
    var animationFractionPerSecond = 3.0; // goes 300% toward goal in 1 sec
    var minZoomSpeedPerSecond = 0.25; // in log2
    var keyIntervals = [];
    var targetViewChangeListeners = [];
    var viewChangeListeners = [];
    var playbackRateChangeListeners = [];
    var thisObj = this;
    var tmJSON;
    var datasetJSON = null;
    var videoDivId;
    var playerSize;
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
    var firstVideoId;
    var videoViewer_projection;
    var originalPlaybackRate = playbackSpeed;
    var toursJSON = {};
    var panInterval;
    var translationSpeedConstant = 20;

    // levelThreshold sets the quality of display by deciding what level of tile to show for a given level of zoom:
    //
    //  1.0: select a tile that's shown between 50% and 100% size  (never supersample)
    //  0.5: select a tile that's shown between 71% and 141% size
    //  0.0: select a tile that's shown between 100% and 200% size (never subsample)
    // -0.5: select a tile that's shown between 141% and 242% size (always supersample)
    // -1.0: select a tile that's shown between 200% and 400% size (always supersample)
    var levelThreshold = 0.05;

    // Scale bar, small google map, editor, annotator
    var tagInfo_locationData = {
      "tagPointNE_nav": {
        "x": undefined,
        "y": undefined
      },
      "tagPointSW_nav": {
        "x": undefined,
        "y": undefined
      },
      "tagPointCenter_nav": {
        "x": undefined,
        "y": undefined
      },
      "tagPointNE_timewarp": {
        "x": undefined,
        "y": undefined
      },
      "tagPointSW_timewarp": {
        "x": undefined,
        "y": undefined
      },
      "tagPointCenter_timewarp": {
        "x": undefined,
        "y": undefined
      },
      "tagLatLngNE_nav": {
        "lat": undefined,
        "lng": undefined
      },
      "tagLatLngSW_nav": {
        "lat": undefined,
        "lng": undefined
      },
      "tagLatLngCenter_nav": {
        "lat": undefined,
        "lng": undefined
      },
      "homeView": {
        "xmin": undefined,
        "ymin": undefined
      },
      "distance_pixel_lng": undefined,
      "scale_map_nav": undefined,
      "scale_map_timewarp": undefined
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.disableEditorToolbarButtons = function() {
      //defaultUI.disableEditorToolbarButtons();
    };

    this.enableEditorToolbarButtons = function() {
      //defaultUI.enableEditorToolbarButtons();
    };

    this.getMode = function() {
      //return defaultUI.getMode();
      return "player";
    };

    this.getCaptureTimes = function() {
      return captureTimes;
    };

    this.doChromeSeekableHack = function() {
      return doChromeSeekableHack;
    };

    this.doChromeBufferedHack = function() {
      return doChromeBufferedHack;
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

    this.getVisualizer = function() {
      return visualizer;
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

    this.getCanvas = function() {
      return canvas;
    };

    this.getCanvasTmp = function() {
      return canvasTmp;
    };

    this.getAnnotator = function() {
      return annotator;
    };

    this.handleEditorModeToolbarChange = function() {
      //defaultUI.handleEditorModeToolbarChange();
    };

    this.isFullScreen = function() {
      return fullScreen;
    };

    this.handlePlayPause = function() {
      if ($("#" + viewerDivId + " .timelineSlider").slider("option", "disabled"))
        return;
      if (timelapseCurrentTimeInSeconds <= 0 && thisObj.getPlaybackRate() <= 0)
        return;
      if (doingLoopingDwell) {
        doingLoopingDwell = false;
        _pause();
        // Need to manually do this because of the looping dwell code
        if (customTimeline) {
          $(".customPlay").button({
            icons: {
              primary: "ui-icon-custom-play"
            },
            text: false
          }).attr({
            "title": "Play"
          });
        } else {
          $("#" + viewerDivId + " .playbackButton").removeClass("pause").addClass("play").attr('title', 'Play');
        }
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
      return scaleToZoom(view.scale / scaleRatio);
    };
    this.getCurrentZoom = getCurrentZoom;

    var scaleToZoom = function(scale) {
      if (scale == undefined) {
        scale = view.scale / scaleRatio;
      }
      return Math.round(1e3 * Math.log(scale / (_homeView().scale / scaleRatio)) / Math.log(2)) / 1e3;
    };
    this.scaleToZoom = scaleToZoom;

    var zoomToScale = function(zoom) {
      if (zoom == undefined) {
        zoom = getCurrentZoom();
      }
      return Math.pow(2, zoom) * _homeView().scale;
    };
    this.zoomToScale = zoomToScale;

    var getZoomFromBoundingBoxView = function(bboxView) {
      var newView;
      if (!bboxView || !bboxView['bbox'])
        return;
      var bboxViewNE = bboxView.bbox.ne;
      var bboxViewSW = bboxView.bbox.sw;
      if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && bboxViewNE && bboxViewSW && UTIL.isNumber(bboxViewNE.lat) && UTIL.isNumber(bboxViewNE.lng) && UTIL.isNumber(bboxViewSW.lat) && UTIL.isNumber(bboxViewSW.lng)) {
        newView = computeViewLatLngFit(bboxView);
      } else if (UTIL.isNumber(bboxView.bbox.xmin) && UTIL.isNumber(bboxView.bbox.xmax) && UTIL.isNumber(bboxView.bbox.ymin) && UTIL.isNumber(bboxView.bbox.ymax)) {
        newView = computeViewFit(bboxView);
      } else {
        newView = view;
      }
      return scaleToZoom(newView.scale);
    };
    this.getZoomFromBoundingBoxView = getZoomFromBoundingBoxView;

    this.changeDataset = function(data) {
      //datasetPath = gigapanUrl;
      UTIL.log("changeDataset(" + datasetPath + "): view is " + JSON.stringify(view));

      // Reset currentIdx so that we'll load in the new tile with the different resolution.  We don't null the
      // currentVideo here because 1) it will be assigned in the refresh() method when it compares the bestIdx
      // and the currentIdx; and 2) we want currentVideo to be non-null so that the VideosetStats can keep
      // track of what video replaced it.
      currentIdx = null;
      onPanoLoadSuccessCallback(data, view);
    };

    var handleKeydownEvent = function(event) {
      var activeElement = document.activeElement;
      // If we are focused on a text field or the slider handlers, do not run any player specific controls.
      if ($(".timelineSlider .ui-slider-handle:focus").length || $(".zoomSlider .ui-slider-handle:focus").length || document.activeElement == "[object HTMLInputElement]" || document.activeElement == "[object HTMLTextAreaElement]")
        return;

      var moveFn;
      switch (event.which) {
        // Left arrow
        case 37:
          if ($(activeElement).hasClass("timeTickClickRegion")) {
            if (customTimeline) {
              $(activeElement).removeClass("openHand closedHand");
              seekToFrame(getCurrentFrameNumber() - 1);
              customTimeline.focusTimeTick(getCurrentFrameNumber() - 1);
            }
            return;
          }
          moveFn = function() {
            if (event.shiftKey) {
              targetView.x -= (translationSpeedConstant * 0.2) / view.scale;
            } else {
              targetView.x -= translationSpeedConstant / view.scale;
            }
            setTargetView(targetView);
          };
          break;
        // Right arrow
        case 39:
          if ($(activeElement).hasClass("timeTickClickRegion")) {
            if (customTimeline) {
              $(activeElement).removeClass("openHand closedHand");
              seekToFrame(getCurrentFrameNumber() + 1);
              customTimeline.focusTimeTick(getCurrentFrameNumber() + 1);
            }
            return;
          }
          moveFn = function() {
            if (event.shiftKey) {
              targetView.x += (translationSpeedConstant * 0.2) / view.scale;
            } else {
              targetView.x += translationSpeedConstant / view.scale;
            }
            setTargetView(targetView);
          };
          break;
        // Up arrow
        case 38:
          moveFn = function() {
            if (event.shiftKey) {
              targetView.y -= (translationSpeedConstant * 0.2) / view.scale;
            } else {
              targetView.y -= translationSpeedConstant / view.scale;
            }
            setTargetView(targetView);
          };
          break;
        // Down arrow
        case 40:
          moveFn = function() {
            if (event.shiftKey) {
              targetView.y += (translationSpeedConstant * 0.2) / view.scale;
            } else {
              targetView.y += translationSpeedConstant / view.scale;
            }
            setTargetView(targetView);
          };
          break;
        // Minus
        case 173:
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
          zoomAbout(1 / 0.999, event.pageX, event.pageY);
        } else if (delta < 0) {
          zoomAbout(0.999, event.pageX, event.pageY);
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

    var _warpTo = function(newView, fromGoogleMapflag) {
      setTargetView(newView, fromGoogleMapflag);
      view.x = targetView.x;
      view.y = targetView.y;
      view.scale = targetView.scale;
      refresh(fromGoogleMapflag);
      for (var i = 0; i < viewChangeListeners.length; i++)
        viewChangeListeners[i](view);
    };
    this.warpTo = _warpTo;

    var _homeView = function() {
      if (homeView == undefined || !UTIL.isNumber(homeView.scale)) {
        if (settings["newHomeView"] != undefined) {
          // Store the home view so we don't need to compute it every time
          homeView = computeViewFit(computeBoundingBox(settings["newHomeView"]));
        } else {
          homeView = computeViewFit({
            xmin: 0,
            ymin: 0,
            xmax: panoWidth,
            ymax: panoHeight
          });
        }
      }
      return homeView;
    };
    this.homeView = _homeView;

    this.getBoundingBoxForCurrentView = function() {
      return computeBoundingBox(view);
    };

    this.warpToBoundingBox = function(bbox) {
      this.warpTo(computeViewFit(bbox));
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
      originalView.x /= videoStretchRatio;
      originalView.y /= videoStretchRatio;
      originalView.scale /= scaleRatio;
      return originalView;
    };

    this.getVideoset = function() {
      return videoset;
    };

    var _addTargetViewChangeListener = function(listener) {
      targetViewChangeListeners.push(listener);
    };
    this.addTargetViewChangeListener = _addTargetViewChangeListener;

    var _addViewChangeListener = function(listener) {
      viewChangeListeners.push(listener);
    };
    this.addViewChangeListener = _addViewChangeListener;

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
      return Math.round(1e5 * latlng.lat) / 1e5 + "," + Math.round(1e5 * latlng.lng) / 1e5 + "," + Math.round(1e3 * Math.log(view.scale / _homeView().scale) / Math.log(2)) / 1e3 + "," + "latLng";
    };

    var getViewStrAsPoints = function() {
      return Math.round(1e5 * view.x) / 1e5 + "," + Math.round(1e5 * view.y) / 1e5 + "," + Math.round(1e3 * Math.log(view.scale / _homeView().scale) / Math.log(2)) / 1e3 + "," + "pts";
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

    var _setNewView = function(newView, doWarp) {
      if ( typeof (newView) === 'undefined' || newView == null)
        return;

      newView = _normalizeView(newView);
      if (doWarp)
        _warpTo(newView);
      else
        setTargetView(newView);
    };
    this.setNewView = _setNewView;

    var _normalizeView = function(newView) {
      if (newView.center) {// Center view
        var newCenterView = newView.center;
        if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && UTIL.isNumber(newCenterView.lat) && UTIL.isNumber(newCenterView.lng) && UTIL.isNumber(newView.zoom)) {
          newView = computeViewLatLngCenter(newView);
        } else if (UTIL.isNumber(newCenterView.x) && UTIL.isNumber(newCenterView.y) && UTIL.isNumber(newView.zoom)) {
          newView = computeViewPointCenter(newView);
        } else {
          newView = view;
        }
      } else if (newView.bbox) {// Bounding box view
        var newViewBbox = newView.bbox;
        var newViewBboxNE = newViewBbox.ne;
        var newViewBboxSW = newViewBbox.sw;
        if (( typeof (tmJSON['projection-bounds']) !== 'undefined') && newViewBboxNE && newViewBboxSW && UTIL.isNumber(newViewBboxNE.lat) && UTIL.isNumber(newViewBboxNE.lng) && UTIL.isNumber(newViewBboxSW.lat) && UTIL.isNumber(newViewBboxSW.lng)) {
          newView = computeViewLatLngFit(newView);
        } else if (UTIL.isNumber(newViewBbox.xmin) && UTIL.isNumber(newViewBbox.xmax) && UTIL.isNumber(newViewBbox.ymin) && UTIL.isNumber(newViewBbox.ymax)) {
          newView = computeViewFit(newView);
        } else {
          newView = view;
        }
      }
      return newView;
    };
    this.normalizeView = _normalizeView;

    var _shareView = function() {
      $("#" + viewerDivId + " .shareurl").val(window.location.href.split("#")[0] + '#v=' + _getViewStr() + '&t=' + thisObj.getCurrentTime().toFixed(2));
      $("#" + viewerDivId + " .shareurl").focus(function() {
        $(this).select();
      });
      $("#" + viewerDivId + " .shareurl").click(function() {
        $(this).select();
      });
      $("#" + viewerDivId + " .shareurl").mouseup(function(e) {
        e.preventDefault();
      });
      $("#" + viewerDivId + " .shareView").dialog("open");
    };
    this.shareView = _shareView;

    var getShareView = function() {
      return '#v=' + _getViewStr() + '&t=' + thisObj.getCurrentTime().toFixed(2);
    };
    this.getShareView = getShareView;

    // Extract a safe view object from an unsafe view string.
    var unsafeViewToView = function(viewParam) {
      var view = null;
      if (viewParam.indexOf("latLng") != -1) {
        if (viewParam.length == 4)
          view = {
            center: {
              "lat": parseFloat(viewParam[0]),
              "lng": parseFloat(viewParam[1])
            },
            "zoom": parseFloat(viewParam[2])
          };
        else if (viewParam.length == 5)
          view = {
            bbox: {
              "ne": {
                "lat": parseFloat(viewParam[0]),
                "lng": parseFloat(viewParam[1])
              },
              "sw": {
                "lat": parseFloat(viewParam[2]),
                "lng": parseFloat(viewParam[3])
              }
            }
          };
      } else {// Assume points if the user did not specify latLng. Also allow for the omission of 'pts' param for backwards compatibility
        if ((viewParam.indexOf("pts") == -1 && viewParam.length == 3) || viewParam.length == 4)
          view = {
            center: {
              "x": parseFloat(viewParam[0]),
              "y": parseFloat(viewParam[1])
            },
            "zoom": parseFloat(viewParam[2])
          };
        else if ((viewParam.indexOf("pts") == -1 && viewParam.length == 4) || viewParam.length == 5)
          view = {
            bbox: {
              "xmin": parseFloat(viewParam[0]),
              "xmax": parseFloat(viewParam[1]),
              "ymin": parseFloat(viewParam[2]),
              "ymax": parseFloat(viewParam[3])
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
    };
    this.pause = _pause;

    var _seek = function(t) {
      // In IE, seeking to <= 20% of the first frame causes flickering from that point forward
      var minIESeekTime = (1 / _getFps()) * 0.2;
      var seekTime = Math.min(Math.max(0, t), timelapseDurationInSeconds);
      if (isIE && seekTime < minIESeekTime)
        seekTime = minIESeekTime;
      videoset.seek(seekTime);
    };
    this.seek = _seek;

    var seekToFrame = function(frameIdx) {
      if (frameIdx < 0 || frameIdx > frames - 1)
        return;
      var timePadding = isFirefox ? 0 : 0.3;
      var seekTime = (frameIdx + timePadding) / _getFps();
      _seek(seekTime);
    };
    this.seekToFrame = seekToFrame;

    var _play = function() {
      updateCustomPlayback();
      videoset.play();
    };
    this.play = _play;

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

    this.setPlaybackRate = function(rate, preserveOriginalRate, fromUI) {
      if (!preserveOriginalRate)
        originalPlaybackRate = rate;

      videoset.setPlaybackRate(rate);

      for (var i = 0; i < playbackRateChangeListeners.length; i++)
        playbackRateChangeListeners[i](rate, fromUI);

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
      return _homeView().scale * 0.5;
    };

    this.getMinScale = _getMinScale;

    var _getMaxScale = function() {
      return 1.05 * scaleRatio;
      //return 2 * scaleRatio;
    };

    this.getMaxScale = _getMaxScale;

    this.getDefaultScale = function() {
      return _homeView().scale;
    };

    this.updateDimensions = function(newViewportWidth, newViewportHeight) {
      viewportWidth = newViewportWidth;
      viewportHeight = newViewportHeight;
    };

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
      var newViewportWidth, newViewportHeight;

      if (originalViewportWidth == null) {
        originalViewportWidth = $("#" + videoDivId).width();
        originalViewportHeight = $("#" + videoDivId).height();
      }

      if (state == undefined || state) {
        fullScreen = true;
        $("body").css("overflow", "hidden");
        var extraViewportHeight = showMainControls ? ($("#" + viewerDivId + " .controls").outerHeight() + $("#" + viewerDivId + " .timelineSlider").outerHeight() + 2) : 0;
        newViewportWidth = window.innerWidth - 2;
        // Extra 2px for the borders
        newViewportHeight = window.innerHeight - extraViewportHeight;
        // Subtract height of controls and extra 2px for borders
        // Ensure minimum dimensions to not break controls
        if (newViewportWidth < 816)
          newViewportWidth = 816;
        if (newViewportHeight < 468)
          newViewportHeight = 468;
        resetParaBeforeFullScreen();
        var originalVideoWidth = datasetJSON["video_width"] - datasetJSON["tile_width"];
        var originalVideoHeight = datasetJSON["video_height"] - datasetJSON["tile_height"];
        // When the viewer is in full screen mode
        // If the video is too small, we need to stretch the video to fit the viewport,
        // so users don't see black bars around the viewport.
        var newVideoStretchRatio;
        // When the viewer is in full screen mode, view.scale changes
        // view.scale in full screen mode = newScaleRatio * view.scale in nomal mode
        var newScaleRatio = Math.max(newViewportWidth / originalViewportWidth, newViewportHeight / originalViewportHeight);
        if (newViewportWidth > originalVideoWidth || newViewportHeight > originalVideoHeight) {
          newVideoStretchRatio = Math.max(newViewportWidth / originalVideoWidth, newViewportHeight / originalVideoHeight);
        } else {
          newVideoStretchRatio = 1;
        }
        newScaleRatio = newScaleRatio / newVideoStretchRatio;
        setViewportSize(newViewportWidth, newViewportHeight, timelapse);
        setParaBeforeFullScreen(newVideoStretchRatio, newScaleRatio, newViewportWidth, newViewportHeight);
        window.scrollTo(0, 0);
      } else {
        fullScreen = false;
        $("body").css("overflow", "auto");
        newViewportWidth = originalViewportWidth;
        newViewportHeight = originalViewportHeight;
        setViewportSize(newViewportWidth, newViewportHeight, timelapse);
        resetParaBeforeFullScreen(newViewportWidth, newViewportHeight);
      }
      _warpTo(view);
    };
    this.fullScreen = _fullScreen;

    var _toggleMainControls = function(state) {
      showMainControls = !showMainControls;
      $("#" + viewerDivId + " .controls").toggle();
      $("#" + viewerDivId + " .timelineSlider").toggle();
      _fullScreen(fullScreen);
    };
    this.toggleMainControls = _toggleMainControls;

    var _toggleZoomControls = function(state) {
      showZoomControls = !showZoomControls;
      $("#" + viewerDivId + " .zoom").toggle();
    };
    this.toggleZoomControls = _toggleZoomControls;

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
      var unsafeHashVars = UTIL.getUnsafeHashVars();
      var newView = getViewFromHash(unsafeHashVars);
      var newTime = getTimeFromHash(unsafeHashVars);
      var tourJSON = getTourFromHash(unsafeHashVars);
      if (newView || newTime || tourJSON) {
        if (newView) {
          _setNewView(newView, true);
        }
        if (newTime) {
          _seek(newTime);
        }
        if (tourJSON) {
          var snaplapse = thisObj.getSnaplapse();
          if (snaplapse) {
            var snaplapseViewer = snaplapse.getSnaplapseViewer();
            if (snaplapseViewer) {
              snaplapse.clearSnaplapse();
              snaplapseViewer.loadNewSnaplapse(tourJSON);
            }
          }
        }
        return true;
      } else {
        return false;
      }
    };

    // Gets safe view values from an unsafe hash string.
    var getViewFromHash = function(unsafeHashVars) {
      if (unsafeHashVars && unsafeHashVars.v) {
        var newView = unsafeViewToView(unsafeHashVars.v.split(","));
        return newView;
      }
      return null;
    };

    // Gets a safe time value from an unsafe hash string.
    var getTimeFromHash = function(unsafeHashVars) {
      if (unsafeHashVars && unsafeHashVars.t) {
        var newTime = parseFloat(unsafeHashVars.t);
        return newTime;
      }
      return null;
    };

    // Gets safe tour JSON from an unsafe hash string.
    var getTourFromHash = function(unsafeHashVars) {
      if (unsafeHashVars && unsafeHashVars.tour) {
        var snaplapse = thisObj.getSnaplapse();
        if (snaplapse) {
          var tourJSON = snaplapse.urlStringToJSON(unsafeHashVars.tour);
          return tourJSON;
        }
      }
      return null;
    };

    var updateSmallGoogleMap = function(newViewportWidth, newViewportHeight) {
      var newLeft = viewportWidth + 1 - $smallGoogleMap_DOM.width();
      var newTop = viewportHeight + 1 - $smallGoogleMap_DOM.height();
      smallGoogleMap.updateMapGeometry(newTop, newLeft, newViewportWidth, newViewportHeight);
    };

    var updateScaleBar = function() {
      var newTop = viewportHeight - $scaleBar_DOM.height();
      scaleBar_DOM.style.top = newTop + "px";
      scaleBar.updateVideoSize();
      if (settings['scaleBarOptions']['enableVideoQualitySelector'] == true) {
        newTop = newTop - $videoQualityContainer_DOM.height() - 1;
        videoQualityContainer_DOM.style.top = newTop + "px";
        scaleBar.setVideoRatioBar();
      }
    };

    var saveParaBeforeFullScreen = function() {
      paraBeforeFullScreen.homeViewX = homeView.x;
      paraBeforeFullScreen.homeViewY = homeView.y;
      paraBeforeFullScreen.homeViewScale = homeView.scale;
      paraBeforeFullScreen.panoWidth = panoWidth;
      paraBeforeFullScreen.panoHeight = panoHeight;
      paraBeforeFullScreen.tileWidth = tileWidth;
      paraBeforeFullScreen.tileHeight = tileHeight;
      paraBeforeFullScreen.videoWidth = videoWidth;
      paraBeforeFullScreen.videoHeight = videoHeight;
      var currentOffset = $("#" + viewerDivId).offset();
      paraBeforeFullScreen.offset.top = currentOffset.top;
      paraBeforeFullScreen.offset.left = currentOffset.left;
    };

    var setParaBeforeFullScreen = function(newVideoStretchRatio, newScaleRatio, newViewportWidth, newViewportHeight) {
      saveParaBeforeFullScreen();
      videoStretchRatio = newVideoStretchRatio;
      scaleRatio = newScaleRatio;
      view.x *= videoStretchRatio;
      view.y *= videoStretchRatio;
      view.scale *= scaleRatio;
      homeView.x *= videoStretchRatio;
      homeView.y *= videoStretchRatio;
      homeView.scale *= scaleRatio;
      panoWidth *= videoStretchRatio;
      panoHeight *= videoStretchRatio;
      videoWidth *= videoStretchRatio;
      videoHeight *= videoStretchRatio;
      tileWidth *= videoStretchRatio;
      tileHeight *= videoStretchRatio;
      $("#" + viewerDivId).css("top", "0px").css("left", "0px");
      if (smallGoogleMap) {
        updateSmallGoogleMap(newViewportWidth, newViewportHeight);
      }
      if (scaleBar) {
        updateScaleBar();
      }
    };

    var resetParaBeforeFullScreen = function(newViewportWidth, newViewportHeight) {
      if (paraBeforeFullScreen.homeViewX != undefined) {
        view.x /= videoStretchRatio;
        view.y /= videoStretchRatio;
        view.scale /= scaleRatio;
        videoStretchRatio = 1;
        scaleRatio = 1;
        homeView.x = paraBeforeFullScreen.homeViewX;
        homeView.y = paraBeforeFullScreen.homeViewY;
        homeView.scale = paraBeforeFullScreen.homeViewScale;
        panoWidth = paraBeforeFullScreen.panoWidth;
        panoHeight = paraBeforeFullScreen.panoHeight;
        tileWidth = paraBeforeFullScreen.tileWidth;
        tileHeight = paraBeforeFullScreen.tileHeight;
        videoWidth = paraBeforeFullScreen.videoWidth;
        videoHeight = paraBeforeFullScreen.videoHeight;
        $("#" + viewerDivId).css("top", paraBeforeFullScreen.offset.top + "px").css("left", paraBeforeFullScreen.offset.left + "px");
        if (smallGoogleMap) {
          updateSmallGoogleMap(newViewportWidth, newViewportHeight);
        }
        if (scaleBar) {
          updateScaleBar();
        }
      }
    };

    var handleMousedownEvent = function(event) {
      if (event.which != 1 || (annotator && (event.metaKey || event.ctrlKey || event.altKey)))
        return;
      var mouseIsDown = true;
      var lastEvent = event;
      var saveMouseMove = document.onmousemove;
      var saveMouseUp = document.onmouseup;
      $(videoDiv).removeClass("openHand closedHand").addClass('closedHand');
      document.onmousemove = function(event) {
        if (mouseIsDown) {
          //if (videoset.isStalled()) return;
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
      $("body").bind("mouseup mouseleave", function() {
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

    var view2string = function(view) {
      return "[view x:" + view.x + " y:" + view.y + " scale:" + view.scale + "]";
    };

    var setTargetView = function(newView, fromGoogleMapflag) {
      var tempView = {};
      tempView.scale = limitScale(newView.scale);
      tempView.x = Math.max(0, Math.min(panoWidth, newView.x));
      tempView.y = Math.max(0, Math.min(panoHeight, newView.y));
      targetView.x = tempView.x;
      targetView.y = tempView.y;
      targetView.scale = tempView.scale;

      if (animateInterval == null) {
        animateInterval = setInterval(function() {
          animate(fromGoogleMapflag);
        }, 80); // 12.5 hz
        lastAnimationTime = UTIL.getCurrentTimeInSecs();
      }

      refresh(fromGoogleMapflag);

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

    var animate = function(fromGoogleMapflag) {
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
        clearInterval(animateInterval);
        animateInterval = null;
        for (i = 0; i < viewChangeListeners.length; i++)
          viewChangeListeners[i](view);
      } else {
        view = computeViewFit(_computeMotion(computeBoundingBox(view), computeBoundingBox(targetView), t));
      }
      refresh(fromGoogleMapflag);
      // Run listeners
      for (i = 0; i < viewChangeListeners.length; i++)
        viewChangeListeners[i](view);
    };

    // Bounding box point fit
    var computeViewFit = function(bbox) {
      if ( typeof (bbox.bbox) != 'undefined')
        bbox = bbox.bbox;

      var scale = Math.min(viewportWidth / (bbox.xmax - bbox.xmin), viewportHeight / (bbox.ymax - bbox.ymin));

      return {
        x: 0.5 * (bbox.xmin + bbox.xmax),
        y: 0.5 * (bbox.ymin + bbox.ymax),
        scale: scale
      };
    };
    this.computeViewFit = computeViewFit;

    // Bounding box lat/lng fit
    var computeViewLatLngFit = function(newView) {
      var projection = _getProjection();
      var newViewBboxNE = newView.bbox.ne;
      var newViewBboxSW = newView.bbox.sw;

      var a = projection.latlngToPoint({
        "lat": newViewBboxNE.lat,
        "lng": newViewBboxNE.lng
      });
      var b = projection.latlngToPoint({
        "lat": newViewBboxSW.lat,
        "lng": newViewBboxSW.lng
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
    this.computeViewLatLngFit = computeViewLatLngFit;

    // Point center
    var computeViewPointCenter = function(newView) {
      return {
        x: newView.center.x,
        y: newView.center.y,
        scale: Math.pow(2, newView.zoom) * _homeView().scale
      };
    };
    this.computeViewPointCenter = computeViewPointCenter;

    // LatLng center
    var computeViewLatLngCenter = function(newView) {
      var point = _getProjection().latlngToPoint({
        "lat": newView.center.lat,
        "lng": newView.center.lng
      });
      return {
        x: point.x,
        y: point.y,
        scale: Math.pow(2, newView.zoom) * _homeView().scale
      };
    };
    this.computeViewLatLngCenter = computeViewLatLngCenter;

    var computeBoundingBox = function(theView) {
      var halfWidth = 0.5 * viewportWidth / theView.scale;
      var halfHeight = 0.5 * viewportHeight / theView.scale;
      return {
        xmin: theView.x - halfWidth,
        xmax: theView.x + halfWidth,
        ymin: theView.y - halfHeight,
        ymax: theView.y + halfHeight
      };
    };
    this.computeBoundingBox = computeBoundingBox;

    var computeBoundingBoxLatLng = function(theView) {
      if (theView == undefined)
        theView = view;
      var pixelBound = computeBoundingBox(theView);
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
        min: min,
        max: max
      };
    };
    this.computeBoundingBoxLatLng = computeBoundingBoxLatLng;

    var onPanoLoadSuccessCallback = function(data, desiredView) {
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
      frames = (data['frames'] - skippedFrames) >= 0 ? (data['frames'] - skippedFrames) : data['frames'];
      videoset.setDuration((1 / data['fps']) * frames);
      videoset.setLeader(data['leader'] / data['fps']);
      videoset.setIsSplitVideo(isSplitVideo);
      videoset.setSecondsPerFragment(secondsPerFragment);
      maxLevel = data['nlevels'] - 1;
      levelInfo = data['level_info'];
      metadata = data;

      readVideoDivSize();
      _warpTo( typeof (desiredView) != 'undefined' && desiredView ? desiredView : _homeView());
    };

    var readVideoDivSize = function() {
      viewportWidth = $(videoDiv).width();
      viewportHeight = $(videoDiv).height();
    };

    var refresh = function(dragFromGoogleMapflag) {
      if (!isFinite(view.scale))
        return;

      var bestIdx = computeBestVideo(targetView);
      if (bestIdx != currentIdx) {
        currentVideo = addTileidx(bestIdx, currentVideo);
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

    // Set the snaplapse viewer after the ajax call, called by snaplapse
    this.setSnaplapseViewer = function(_snaplapseViewer) {
      snaplapseViewer = _snaplapseViewer;
      $("#" + viewerDivId + " .addTimetag").button("option", "disabled", false);
    };

    // Create the zoom bar
    var createZoomPanbar = function(viewerDivId, obj) {
      // Create pan left button
      $(".panLeft").button({
        icons: {
          primary: "ui-icon-triangle-1-w"
        },
        text: false
      }).position({
        "my": "left center",
        "at": "left center",
        "of": $(".panLeft").parent()
      }).on("mousedown", function() {
        panInterval = setInterval(function() {
          targetView.x -= translationSpeedConstant / view.scale;
          setTargetView(targetView);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
      });
      // Create pan left button
      $(".panRight").button({
        icons: {
          primary: "ui-icon-triangle-1-e"
        },
        text: false
      }).position({
        "my": "right center",
        "at": "right center",
        "of": $(".panLeft").parent()
      }).on("mousedown", function() {
        panInterval = setInterval(function() {
          targetView.x += translationSpeedConstant / view.scale;
          setTargetView(targetView);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
      });
      // Create pan left button
      $(".panUp").button({
        icons: {
          primary: "ui-icon-triangle-1-n"
        },
        text: false
      }).position({
        "my": "center top",
        "at": "center top",
        "of": $(".panLeft").parent()
      }).on("mousedown", function() {
        panInterval = setInterval(function() {
          targetView.y -= translationSpeedConstant / view.scale;
          setTargetView(targetView);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
      });
      // Create pan left button
      $(".panDown").button({
        icons: {
          primary: "ui-icon-triangle-1-s"
        },
        text: false
      }).position({
        "my": "center bottom",
        "at": "center bottom",
        "of": $(".panLeft").parent()
      }).on("mousedown", function() {
        panInterval = setInterval(function() {
          targetView.y += translationSpeedConstant / view.scale;
          setTargetView(targetView);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
      });
      // Create zoom in button
      $(".zoomin").button({
        icons: {
          primary: "ui-icon-plus"
        },
        text: false
      });
      // Create zoom slider
      createZoomSlider(viewerDivId, obj);
      // Create zoom out button
      $(".zoomout").button({
        icons: {
          primary: "ui-icon-minus"
        },
        text: false
      });
      // Create zoom all button
      $(".zoomall").button({
        icons: {
          primary: "ui-icon-home"
        },
        text: false
      });
    };

    // Update tag information of location data
    var updateTagInfo_locationData = function(dragFromGoogleMapflag) {
      if (scaleBar == undefined && smallGoogleMap == undefined) {
        if (fullScreen) {
          return null;
        }
      }
      if (smallGoogleMap || scaleBar) {
        // Get video viewer center location
        var scale = view.scale;
        var videoViewer_centerPoint = {
          "x": view.x / videoStretchRatio,
          "y": view.y / videoStretchRatio,
          "scale": scale / scaleRatio
        };
        var tagLatLngCenter_nav;
        if (videoViewer_projection) {
          tagLatLngCenter_nav = videoViewer_projection.pointToLatlng(videoViewer_centerPoint);
          tagInfo_locationData.tagLatLngCenter_nav.lat = tagLatLngCenter_nav.lat;
          tagInfo_locationData.tagLatLngCenter_nav.lng = tagLatLngCenter_nav.lng;
        }
        if (scaleBar) {
          // Compute the the distance between two center pixels
          var videoViewer_nearCenterPoint = {
            "x": (view.x + 1 / scale) / videoStretchRatio,
            "y": view.y / videoStretchRatio,
            "scale": scale / scaleRatio
          };
          var tagLatLngNearCenter_nav, distance_pixel_lng;
          if (videoViewer_projection) {
            tagLatLngNearCenter_nav = videoViewer_projection.pointToLatlng(videoViewer_nearCenterPoint);
            distance_pixel_lng = Math.abs(tagLatLngCenter_nav.lng - tagLatLngNearCenter_nav.lng);
            tagInfo_locationData.distance_pixel_lng = distance_pixel_lng;
            scaleBar.setScaleBar(distance_pixel_lng, tagLatLngCenter_nav);
          }
        }
        if (smallGoogleMap) {
          // Get the location bound of the video viewer
          var offsetX = (viewportWidth / 2) / scale;
          var offsetY = (viewportHeight / 2) / scale;
          var videoViewer_leftTopPoint = {
            "x": (view.x - offsetX) / videoStretchRatio,
            "y": (view.y - offsetY) / videoStretchRatio,
            "scale": scale / scaleRatio
          };
          var videoViewer_rightBotPoint = {
            "x": (view.x + offsetX) / videoStretchRatio,
            "y": (view.y + offsetY) / videoStretchRatio,
            "scale": scale / scaleRatio
          };
          var tagLatLngNE_nav, tagLatLngSW_nav;
          if (videoViewer_projection) {
            tagLatLngNE_nav = videoViewer_projection.pointToLatlng(videoViewer_leftTopPoint);
            tagLatLngSW_nav = videoViewer_projection.pointToLatlng(videoViewer_rightBotPoint);
            tagInfo_locationData.tagLatLngNE_nav.lat = tagLatLngNE_nav.lat;
            tagInfo_locationData.tagLatLngNE_nav.lng = tagLatLngNE_nav.lng;
            tagInfo_locationData.tagLatLngSW_nav.lat = tagLatLngSW_nav.lat;
            tagInfo_locationData.tagLatLngSW_nav.lng = tagLatLngSW_nav.lng;
          }
          // Update the small google map
          if (smallGoogleMap) {
            if (dragFromGoogleMapflag != undefined) {
              smallGoogleMap.setSmallMapBoxLocation(tagLatLngNE_nav, tagLatLngSW_nav);
            } else {
              smallGoogleMap.setSmallGoogleMap(tagLatLngCenter_nav, videoViewer_centerPoint.scale);
              smallGoogleMap.setSmallMapBoxLocation(tagLatLngNE_nav, tagLatLngSW_nav);
            }
          }

        }
      }
    };
    this.updateTagInfo_locationData = updateTagInfo_locationData;

    // Get the location bound of the viewer
    var getViewerLocationBound = function() {
      var viewer = document.getElementById(videoDivId);
      var viewerProjection = _getProjection();
      var leftTopPoint = $.extend({}, view);
      var rightBotPoint = $.extend({}, view);
      leftTopPoint.x -= (viewer.offsetWidth / 2) / view.scale;
      leftTopPoint.y -= (viewer.offsetHeight / 2) / view.scale;
      var leftTopLatLng = viewerProjection.pointToLatlng(leftTopPoint);
      rightBotPoint.x += (viewer.offsetWidth / 2) / view.scale;
      rightBotPoint.y += (viewer.offsetHeight / 2) / view.scale;
      var rightBotLatLng = viewerProjection.pointToLatlng(rightBotPoint);
      return {
        "leftTopLatLng": leftTopLatLng,
        "rightBotLatLng": rightBotLatLng
      };
    };
    this.getViewerLocationBound = getViewerLocationBound;

    // Get the center of the view
    var getViewerLocationCenter = function() {
      var viewerProjection = _getProjection();
      var centerLatLng = viewerProjection.pointToLatlng(thisObj.getView());
      return centerLatLng;
    };
    this.getViewerLocationCenter = getViewerLocationCenter;

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

    var addTileidx = function(tileidx, videoToUnload) {
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

    function createTimelineSlider(div) {
      if (tmJSON["capture-times"]) {
        captureTimes = tmJSON["capture-times"];
      } else {
        for (var i = 0; i < _getNumFrames(); i++) {
          captureTimes.push("--");
        }
      }

      timelapseDurationInSeconds = (_getNumFrames() - 0.7) / _getFps();

      $("#" + div + " .currentTime").html(UTIL.formatTime(timelapseCurrentTimeInSeconds, true));
      $("#" + div + " .totalTime").html(UTIL.formatTime(timelapseDurationInSeconds, true));
      $("#" + div + " .currentCaptureTime").html(UTIL.htmlForTextWithEmbeddedNewlines(captureTimes[timelapseCurrentCaptureTimeIndex]));

      $("#" + div + " .timelineSlider").slider({
        min: 0,
        max: _getNumFrames() - 1, // this way the time scrubber goes exactly to the end of timeline
        range: "min",
        step: 1,
        slide: function(e, ui) {
          // $(this).slider('value')  --> previous value
          // ui.value                 --> current value
          // If we are manually using the slider and we are pulling it back to the start
          // we wont actually get to time 0 because of how we are snapping.
          // Manually seek to position 0 when this happens.
          if (($(this).slider('value') > ui.value) && ui.value == 0)
            _seek(0);
          else
            _seek((ui.value + 0.3) / _getFps());
        }
      }).removeClass("ui-corner-all").children().removeClass("ui-corner-all");
      $("#" + div + " .timelineSlider .ui-slider-handle").attr("title", "Drag to go to a different point in time");
    }

    function createPlaybackSpeedSlider(div, timelapseObj) {
      // Populate playback speed dropdown
      populateSpeedPlaybackChoices(div, timelapseObj);

      // Add click event to each of the options to change the speed
      $("#" + div + " .playbackSpeedChoices li a").bind("click", function() {
        changePlaybackRate(this);
      });

      _addPlaybackRateChangeListener(function(rate, fromUI) {
        var speedChoice;
        // Set the playback speed dropdown
        $("#" + viewerDivId + " .playbackSpeedChoices li a").each(function() {
          speedChoice = $(this);
          if (speedChoice.attr("data-speed") == rate) {
            return false;
          }
        });
        $("#" + viewerDivId + " li.playbackSpeedOptions").hide();
        $("#" + viewerDivId + " li.playbackSpeedOptions a").removeClass("current");
        speedChoice.addClass("current");
        $("#" + viewerDivId + " .playbackSpeedText").text(speedChoice.text());
      });

      timelapseObj.setPlaybackRate(playbackSpeed);
    }

    function changePlaybackRate(obj) {
      var rate = $(obj).attr("data-speed") - 0; // convert to number
      thisObj.setPlaybackRate(rate);
      playbackSpeed = rate;
    }

    function populateSizes(viewerDivId) {
      // populate the player size dropdown
      var html = "";
      var numSizes = tmJSON["sizes"].length;
      for (var i = 0; i < numSizes; i++) {
        html += '<li><a href="javascript:void(0);" data-index=\'' + i + '\'>' + tmJSON["sizes"][i] + '</a></li>';
      }
      $("#" + viewerDivId + " .sizechoices").append(html);

      // set the size dropdown
      $("#" + viewerDivId + " .sizechoices li a:contains(" + tmJSON["datasets"][datasetIndex]["name"] + ")").addClass("current");
      $("#" + viewerDivId + " .playerSizeText").text(tmJSON["datasets"][datasetIndex]["name"]);

      $("#" + viewerDivId + " .sizechoices li a").bind("click", function() {
        thisObj.switchSize($(this).attr("data-index"));
        $("#" + viewerDivId + " li.sizeoptions a").removeClass("current");
        $(this).addClass("current");
      });
    }

    function populateLayers() {
      var numLayers = tmJSON["layers"].length;
      var html = "";
      for (var i = 0; i < numLayers; i++) {
        html += "<li data-index=" + i + "><img src=\"" + tmJSON["layers"][i]["tn-path"] + "\" " + "alt='layer' width='45' height='45' ><br/><span style='font-size:small; text-align:center; display:block; margin: -5px 0px 0px 0px !important;'>" + tmJSON['layers'][i]['description'] + "</span></li>";
      }
      $("#" + viewerDivId + " .layerChoices").append(html);

      $("#" + viewerDivId + " .layerChoices li").bind("click", function() {
        thisObj.switchLayer($(this).attr("data-index"));
      });
    }

    this.switchSize = function(index) {
      playerSize = index;
      var newIndex = datasetLayer * tmJSON["sizes"].length + playerSize;
      validateAndSetDatasetIndex(newIndex);
      loadVideosetJSON();
      $("#" + viewerDivId + " .playerSizeText").text(tmJSON["datasets"][index]["name"]);
    };

    this.switchLayer = function(index) {
      var newIndex = index * tmJSON["sizes"].length + playerSize;
      validateAndSetDatasetIndex(newIndex);
      loadVideosetJSON();
    };

    function validateAndSetDatasetIndex(newDatasetIndex) {
      // Make sure the datasetIndex is a valid number, and within the range of datasets for this timelapse.
      if (!UTIL.isNumber(newDatasetIndex)) {
        datasetIndex = 0;
      } else {
        datasetIndex = Math.max(0, Math.min(newDatasetIndex, tmJSON["datasets"].length - 1));
      }
    }

    function loadVideosetJSON() {
      var path = tmJSON["datasets"][datasetIndex]['id'] + "/";
      datasetPath = settings["url"] + path;
      showSpinner(viewerDivId);
      //org.gigapan.Util.log("Attempting to fetch videoset JSON from URL [" + datasetPath + "]...");
      UTIL.ajax("json", settings["url"], path + 'r.json', loadVideoSet);
    }

    function loadVideoSet(data) {
      datasetJSON = data;
      thisObj.changeDataset(data);
      if (!fullScreen)
        setViewportSize(data["video_width"] - data["tile_width"], data["video_height"] - data["tile_height"], thisObj);
      hideSpinner(viewerDivId);
    }

    function doHelpOverlay(obj) {
      if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled"))
        return;
      $("#" + viewerDivId + " li.sizeoptions").hide(); // might be already opened
      $("#" + viewerDivId + " li.playbackSpeedOptions").hide(); // might be already opened
      $("#" + viewerDivId + " .instructions").fadeIn(100);
      $("#" + viewerDivId + " .repeat").addClass("disabled");
      $("#" + viewerDivId + " .help").addClass("on");
      if ($("#" + viewerDivId + " .playbackButton").hasClass('pause')) {
        obj.handlePlayPause();
        $("#" + viewerDivId + " .playbackButton").addClass("pause_disabled from_help");
      } else {
        $("#" + viewerDivId + " .playbackButton").addClass("play_disabled");
      }
      $("#" + viewerDivId + " .timelineSlider").slider("option", "disabled", true);
    }

    function removeHelpOverlay(obj) {
      if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled"))
        return;
      $("#" + viewerDivId + " .instructions").fadeOut(50);
      $("#" + viewerDivId + " .repeat").removeClass("disabled");
      $("#" + viewerDivId + " .help").removeClass("on");
      if ($("#" + viewerDivId + " .playbackButton").hasClass('from_help')) {
        obj.handlePlayPause();
        $("#" + viewerDivId + " .playbackButton").addClass("pause");
        $("#" + viewerDivId + " .playbackButton").removeClass("from_help");
      } else {
        $("#" + viewerDivId + " .playbackButton").addClass("play");
      }
      $("#" + viewerDivId + " .timelineSlider").slider("option", "disabled", false);
    }

    function setupUIHandlers(viewerDivId, obj) {
      var intervalId;

      $("#" + viewerDivId + " .shareView").dialog({
        resizable: false,
        autoOpen: false,
        width: 640,
        height: 110,
        create: function(event, ui) {
          $(this).parents(".ui-dialog").css({
            'border': '1px solid #000'
          });
        }
      }).parent().appendTo($("#" + viewerDivId));

      if (showShareBtn) {
        $("#" + viewerDivId + " .share").bind("click", function() {
          _shareView();
        });
      } else {
        $("#" + viewerDivId + " .share").hide();
      }

      if (tmJSON["layers"]) {
        $("#" + viewerDivId + " .layerSlider").show();
        populateLayers();

        $("#" + viewerDivId + " .layerSlider .jCarouselLite").jCarouselLite({
          btnNext: "#" + viewerDivId + " .layerSlider .next",
          btnPrev: "#" + viewerDivId + " .layerSlider .prev",
          circular: true,
          visible: 3.5
        });
      }

      $("#" + viewerDivId + " a.playbackspeed").click(function() {
        if ($("#" + viewerDivId + " .help").hasClass("on") || $("#" + viewerDivId + " .zoomSlider").slider("option", "disabled"))
          return;
        $("#" + viewerDivId + " li.playbackSpeedOptions").fadeIn(100);
      });

      $("#" + viewerDivId + " a.size").click(function() {
        if ($("#" + viewerDivId + " .help").hasClass("on") || $("#" + viewerDivId + " .zoomSlider").slider("option", "disabled"))
          return;
        $("#" + viewerDivId + " li.sizeoptions").fadeIn(100);
      });

      $(document).click(function(event) {
        if ($(event.target).closest("#" + viewerDivId + " a.playbackspeed").get(0) == null) {
          $("#" + viewerDivId + " li.playbackSpeedOptions").hide();
        }
        if ($(event.target).closest("#" + viewerDivId + " a.size").get(0) == null) {
          $("#" + viewerDivId + " li.sizeoptions").hide();
        }
        if ($(event.target).closest("#" + viewerDivId + " .help").get(0) == null) {
          if ($("#" + viewerDivId + " .help").hasClass("on"))
            removeHelpOverlay(obj);
        }
      });

      $("#" + viewerDivId + " .help").click(function() {
        if ($("#" + viewerDivId + " .help").hasClass("on"))
          removeHelpOverlay(obj);
        else
          doHelpOverlay(obj);
      });

      createZoomPanbar(viewerDivId, obj);

      $("#" + viewerDivId + " .playbackButton").bind("click", function() {
        thisObj.handlePlayPause();
      });

      $("#" + viewerDivId + " .fullScreen").bind("click", function() {
        if ($(this).hasClass("disabled") || $("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true)
          return;

        if (!fullScreen) {
          $(this).toggleClass("inactive active");
          $(this).prop('title', 'Exit full screen');
          _fullScreen(true);
        } else {
          $(this).toggleClass("active inactive");
          $(this).prop('title', 'Full screen');
          _fullScreen(false);
        }
      });

      $("#" + viewerDivId + " .repeat").bind("click", function() {
        if ($(this).hasClass("disabled") || $("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true)
          return;
        loopPlayback = !loopPlayback;
        if (loopPlayback) {
          $(this).toggleClass("inactive active");
        } else {
          $(this).toggleClass("active inactive");
          // Set playback back to what the dropdown says
          changePlaybackRate($("#" + viewerDivId + " .playbackSpeedChoices .current"));
        }
      });

      $("#" + viewerDivId + " .zoomall").click(function() {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true)
          return;
        obj.warpTo(obj.homeView());
      });

      $("#" + viewerDivId + " .zoomin").mousedown(function() {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true)
          return;
        intervalId = setInterval(function() {
          zoomIn(viewerDivId, obj);
        }, 50);
      }).click(function() {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true)
          return;
        zoomIn(viewerDivId, obj);
      }).mouseup(function() {
        clearInterval(intervalId);
      }).mouseout(function() {
        clearInterval(intervalId);
      });

      $("#" + viewerDivId + " .zoomout").mousedown(function() {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true)
          return;
        intervalId = setInterval(function() {
          zoomOut(viewerDivId, obj);
        }, 50);
      }).click(function() {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true)
          return;
        zoomOut(viewerDivId, obj);
      }).mouseup(function() {
        clearInterval(intervalId);
      }).mouseout(function() {
        clearInterval(intervalId);
      });

      window.onresize = function(event) {
        clearTimeout(resizeTimeout);
        if (fullScreen) {
          resizeTimeout = setTimeout(function() {
            _fullScreen(true);
          }, 100);
        }
      };

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

      _addViewChangeListener(function(view) {
        if (annotator)
          annotator.updateAnnotationPositions();

        updateTagInfo_locationData();
      });

      _addVideoPauseListener(function() {
        // The videoset might cause playback to pause, such as when it decides
        // it's hit the end (even though the current time might not be >= duration),
        // so we need to make sure the play button is updated.
        if (doingLoopingDwell)
          return;
        if (customTimeline) {
          $(".customPlay").button({
            icons: {
              primary: "ui-icon-custom-play"
            },
            text: false
          }).attr({
            "title": "Play"
          });
        }
        $("#" + viewerDivId + " .playbackButton").removeClass("pause").addClass("play").attr('title', 'Play');
      });

      _addVideoPlayListener(function() {
        // Always make sure that when we are playing, the button status is updated
        if (doingLoopingDwell)
          return;
        if (customTimeline) {
          $(".customPlay").button({
            icons: {
              primary: "ui-icon-custom-pause"
            },
            text: false
          }).attr({
            "title": "Pause"
          });
        }
        $("#" + viewerDivId + " .playbackButton").removeClass("play").addClass("pause").attr('title', 'Pause');
      });

      _makeVideoVisibleListener(function(videoId, theTime) {
        if (videoId == firstVideoId) {
          // Hash params override the view set during initialization
          if (handleHashChange()) {
            // handleHashChange() already did what we wanted
          } else {
            // Seek to the initial time
            if (initialTime != 0) {
              _seek(initialTime);
            }
            // Set the initial view
            if (initialView) {
              _setNewView(initialView, true);
            }
          }
          // Fire onTimeMachinePlayerReady when the first video is ready
          if ( typeof (onTimeMachinePlayerReady) === "function") {
            onTimeMachinePlayerReady(viewerDivId);
          }
          updateTagInfo_locationData();
        }
      });

      if (settings["composerDiv"]) {
        $("#" + videoDivId).append('<div class="snaplapse-annotation-description"><div></div></div>');
        snaplapse = new org.gigapan.timelapse.Snaplapse(settings["composerDiv"], thisObj, settings);
      }
      if (settings["annotatorDiv"])
        annotator = new org.gigapan.timelapse.Annotator(settings["annotatorDiv"], thisObj);

      populateSizes(viewerDivId);
      //hasLayers = timelapseMetadataJSON["has_layers"] || false;
      createTimelineSlider(viewerDivId);
      createZoomSlider(viewerDivId, thisObj);
      createPlaybackSpeedSlider(viewerDivId, thisObj);
      setupUIHandlers(viewerDivId, thisObj);
      //handlePluginVideoTagOverride(); //TODO

      if (settings["scaleBarOptions"] && tmJSON['projection-bounds'])
        scaleBar = new org.gigapan.timelapse.ScaleBar(settings["scaleBarOptions"], thisObj);
      // Must be placed after TimelineSlider is created
      if (settings["smallGoogleMapOptions"] && tmJSON['projection-bounds'])
        smallGoogleMap = new org.gigapan.timelapse.SmallGoogleMap(settings["smallGoogleMapOptions"], thisObj);

      // Fixes Safari bug which causes the video to not be displayed if the video has no leader and the initial
      // time is zero (the video seeked event is never fired, so videoset never gets the cue that the video
      // should be displayed).  The fix is to simply seek half a frame in.  Yeah, the video won't be starting at
      // *zero*, but the displayed frame will still be the right one, so...good enough.  :-)
      if (videoset.getLeader() <= 0 && (isSafari || isIE)) {
        var halfOfAFrame = 1 / _getFps() / 2;
        _seek(halfOfAFrame);
      }

      setupSliderHandlers(viewerDivId);
      cacheAndInitializeElements();

      if (settings["enableCustomTimeline"] == true)
        customTimeline = new org.gigapan.timelapse.CustomTimeline(thisObj, settings);
    }

    // TODO: factor out most of this map related code
    // Cache and initialize DOM elements
    var cacheAndInitializeElements = function() {
      if (tmJSON['projection-bounds'])
        videoViewer_projection = _getProjection();
      if (scaleBar) {
        scaleBar_DOM = scaleBar.getScaleBarContainer();
        $scaleBar_DOM = $(scaleBar_DOM);
        if (settings['scaleBarOptions']['enableVideoQualitySelector'] == true) {
          videoQualityContainer_DOM = scaleBar.getVideoQualityContainer();
          $videoQualityContainer_DOM = $(videoQualityContainer_DOM);
        }
      }
      // must be placed after TimelineSlider is created
      if (smallGoogleMap) {
        smallGoogleMap_DOM = smallGoogleMap.getSmallMapContainer();
        $smallGoogleMap_DOM = $(smallGoogleMap_DOM);
      }
    };

    var computeViewportGeometry = function(data) {
      var newWidth, newHeight;
      if (viewportGeometry.width == undefined && viewportGeometry.height == undefined) {
        newWidth = data["video_width"] - data["tile_width"];
        newHeight = data["video_height"] - data["tile_height"];
      } else {
        if (viewportGeometry.height == undefined) {
          if (viewportGeometry.ratio != undefined && viewportGeometry.width != "max") {
            viewportGeometry.height = viewportGeometry.width / viewportGeometry.ratio;
          } else {
            viewportGeometry.height = data["video_height"] - data["tile_height"];
          }
        }
        if (viewportGeometry.width == undefined) {
          if (viewportGeometry.ratio != undefined && viewportGeometry.height != "max") {
            viewportGeometry.width = viewportGeometry.height * viewportGeometry.ratio;
          } else {
            viewportGeometry.width = data["video_width"] - data["tile_width"];
          }
        }
        newWidth = viewportGeometry.width;
        newHeight = viewportGeometry.height;
        if (viewportGeometry.height == "max") {
          newHeight = window.innerHeight - $(".controls").outerHeight() - $(".timelineSliderFiller").outerHeight() * 2 - 2;
        }
        if (viewportGeometry.width == "max") {
          newWidth = window.innerWidth * 2;
          if (settings['composerDiv'] || settings['annotatorDiv']) {
            newWidth -= $(".timelineSliderFiller2").outerWidth() + 19;
          }
        }
        if (viewportGeometry.width == "max" && viewportGeometry.height == "max") {
          if (viewportGeometry.ratio != undefined) {
            newWidth = newHeight * viewportGeometry.ratio;
          }
        }
        if (newHeight < 468) {
          newHeight = 468;
        }
        if (newWidth < 816) {
          newWidth = 816;
        }
      }
      return {
        width: newWidth,
        height: newHeight
      };
    };

    var _loadToursJSON = function(json) {
      toursJSON = json;
      // Do stuff
    };
    this.loadToursJSON = _loadToursJSON;

    var _loadTimelapseJSON = function(json) {
      tmJSON = json;
      // Assume tiles and json are on same host
      tileRootPath = settings["url"];
      for (var i = 0; i < tmJSON["sizes"].length; i++) {
        playerSize = i;
        if (settings["playerSize"] && tmJSON["sizes"][i].toLowerCase() == settings["playerSize"].toLowerCase())
          break;
      }
      // layer + size = index of dataset
      validateAndSetDatasetIndex(datasetLayer * tmJSON["sizes"].length + playerSize);
      var path = tmJSON["datasets"][datasetIndex]['id'] + "/";
      datasetPath = settings["url"] + path;
      UTIL.ajax("json", settings["url"], path + 'r.json', _loadInitialVideoSet);
    };
    this.loadTimelapseJSON = _loadTimelapseJSON;

    var _loadInitialVideoSet = function(data) {
      datasetJSON = data;

      view = _homeView();

      var newViewportGeometry = computeViewportGeometry(data);
      setViewportSize(newViewportGeometry.width, newViewportGeometry.height, thisObj);

      onPanoLoadSuccessCallback(data, null);

      setupTimelapse();

      if (loopPlayback)
        $("#" + viewerDivId + " .repeat").toggleClass("inactive active");
      if (playOnLoad)
        _play();

      hideSpinner(viewerDivId);

      $("#" + viewerDivId + " img " + ", #" + viewerDivId + " a").css({
        "-moz-user-select": "none",
        "-webkit-user-select": "none",
        "-webkit-user-drag": "none",
        "-khtml-user-select": "none",
        "-o-user-select": "none",
        "user-select": "none"
      });
    };
    this.loadInitialVideoSet = _loadInitialVideoSet;

    function loadPlayerControlsTemplate(html) {
      var viewerDiv = document.getElementById(viewerDivId);

      $(viewerDiv).html(html);
      var tmp = document.getElementById("{REPLACE}");
      $(tmp).attr("id", viewerDivId + "_timelapse");
      videoDivId = $(tmp).attr("id");
      videoDiv = document.getElementById(videoDivId);
      firstVideoId = videoDivId + "_1";

      $(viewerDiv).attr('unselectable', 'on').css({
        '-moz-user-select': 'none',
        '-o-user-select': 'none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
      });

      if (viewerType == "canvas") {
        canvas = document.createElement('canvas');
        canvas.id = videoDivId + "_canvas";
        canvasContext = canvas.getContext('2d');
        videoDiv.appendChild(canvas);
        canvasTmp = document.createElement('canvas');
        canvasTmp.id = videoDivId + "_canvas_tmp";
        canvasTmp.style.display = "none";
        canvasTmpContext = canvasTmp.getContext('2d');
        if (blackFrameDetection)
          videoDiv.appendChild(canvasTmp);
        videoset = new org.gigapan.timelapse.Videoset(viewerDivId, videoDivId, thisObj, canvas.id, canvasTmp.id);
      } else if (viewerType == "video") {
        videoset = new org.gigapan.timelapse.Videoset(viewerDivId, videoDivId, thisObj);
      }

      //videosetStats = new org.gigapan.timelapse.VideosetStats(videoset, settings["videosetStatsDivId"]);

      videoDiv['onmousedown'] = handleMousedownEvent;
      videoDiv['ondblclick'] = handleDoubleClickEvent;

      $(videoDiv).mousewheel(thisObj.handleMousescrollEvent);

      $(viewerDiv).bind("click", function() {
        $(document).unbind('keydown.tm_keydown keyup.tm_keyup');
        $(document).bind("keydown.tm_keydown", handleKeydownEvent);
        $(document).bind("keyup.tm_keyup", handleKeyupEvent);
      });

      $(videoDiv).attr("tabindex", 2013).on("click", function() {
        $(this).focus();
      });

      // When you do a path from an external css file in IE, it is actually relative to the document and not the css file. This is against the spec. ARGH!
      // So we have a choice: Do multiple paths in the css file, getting a 404 in Chrome for invalid relative paths OR we do the style in the document itself,
      // which in any browser will reslove relative paths correctly. We choose the latter to keep the message console clean.
      $('<style type="text/css">.closedHand {cursor: url("./css/cursors/closedhand.cur"), move !important;} .openHand {cursor: url("./css/cursors/openhand.cur"), move !important;} .tiledContentHolder {cursor: url("./css/cursors/openhand.cur"), move;}</style>').appendTo($('head'));

      if (!showZoomControls) {
        $("#" + viewerDivId + " .zoom").hide();
      }

      if (!showMainControls) {
        $("#" + viewerDivId + " .controls").hide();
        $("#" + viewerDivId + " .timelineSlider").hide();
      }

      if (!showHomeBtn) {
        $("#" + viewerDivId + " .zoomall").hide();
      }

      UTIL.ajax("json", settings["url"], "tm.json", _loadTimelapseJSON);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    browserSupported = UTIL.browserSupported();
    if (!browserSupported) {
      UTIL.ajax("html", "", "browser_not_supported_template.html", function(html) {
        $("#" + viewerDivId).html(html);
        $("#browser_not_supported").show();
      });
      return;
    }
    if (mediaType == null) {
      mediaType = UTIL.getMediaType();
    } else {
      UTIL.setMediaType(mediaType);
    }
    if (settings["viewerType"])
      UTIL.setViewerType(settings["viewerType"]);
    viewerType = UTIL.getViewerType();
    targetView = {};

    // Add trailing slash to url if it was omitted
    if (settings["url"].charAt(settings["url"].length - 1) != "/")
      settings["url"] += "/";

    UTIL.log('Timelapse("' + settings["url"] + '")');
    showSpinner(viewerDivId);
    UTIL.ajax("html", "", "player_template.html", loadPlayerControlsTemplate);
  };
})();
