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
// Randy Sargent (randy.sargent@cs.cmu.edu)
//
// VERIFY NAMESPACE
//
// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
"use strict";
var org;
var availableTimelapses=[];
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
if (!org.gigapan.timelapse.VideosetStats) {
  var noVideosetStatsMsg = "The org.gigapan.timelapse.VideosetStats library is required by org.gigapan.timelapse.Timelapse";
  alert(noVideosetStatsMsg);
  throw new Error(noVideosetStatsMsg);
}
if (!window['$']) {
  var nojQueryMsg = "The jQuery library is required by org.gigapan.timelapse.Timelapse";
  alert(nojQueryMsg);
  throw new Error(nojQueryMsg);
}

//
// CODE
//
(function () {
  var UTIL = org.gigapan.Util;

  org.gigapan.timelapse.loadTimeMachine = function (json) {
    var timelapseObj = availableTimelapses[availableTimelapses.length-1];
    timelapseObj.loadTimelapseJSON(json);
  };

  org.gigapan.timelapse.loadVideoset = function (json) {
    var timelapseObj = availableTimelapses[availableTimelapses.length-1];
    if (timelapseObj.getDatasetJSON() == null) timelapseObj.loadInitialVideoSet(json);
    else timelapseObj.loadVideoSet(json);
  };

  org.gigapan.timelapse.loadTours = function (json) {
    var timelapseObj = availableTimelapses[availableTimelapses.length-1];
    timelapseObj.loadToursJSON(json);
  };

  org.gigapan.timelapse.Timelapse = function (viewerDivId, settings) {
    availableTimelapses.push(this);
    settings["videosetStatsDivId"] = settings["videosetStatsDivId"] || "videoset_stats_container";
    var videoset;
    var videosetStats;
    var videoDiv;
    var tiles = {};
    var isSplitVideo = false;
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
    var translateFractionPerSecond = 3.0;   // goes 300% toward goal in 1 sec
    var minZoomSpeedPerSecond = .25; // in log2
    var zoomFractionPerSecond = 3.0; // in log2
    var keyIntervals = [];
    var targetViewChangeListeners = [];
    var viewChangeListeners = [];
    var thisObj = this;
    var tmJSON;
    var datasetJSON = null;
    var videoDivId;
    //var hasLayers = settings["hasLayers"] || false;
    var loopPlayback = settings["loopPlayback"] || false;
    var fullScreen = false;
    var customLoopPlaybackRates = settings["customLoopPlaybackRates"] || null;
    var playOnLoad = settings["playOnLoad"] || false;
    var playbackSpeed = settings["playbackSpeed"] && org.gigapan.Util.isNumber(settings["playbackSpeed"]) ? settings["playbackSpeed"] : 1;
    var datasetLayer = settings["layer"] && org.gigapan.Util.isNumber(settings["layer"]) ? settings["layer"] : 0;
    var playerSize;
    var datasetIndex;
    var initialTime = settings["initialTime"] && org.gigapan.Util.isNumber(settings["initialTime"]) ? settings["initialTime"] : 0;
    var initialView = settings["initialView"] || null;
    var showShareBtn = (typeof(settings["showShareBtn"]) == "undefined") ? true : settings["showShareBtn"];
    var showMainControls = (typeof(settings["showMainControls"]) == "undefined") ? true : settings["showMainControls"];
    var showZoomControls = (typeof(settings["showZoomControls"]) == "undefined") ? true : settings["showZoomControls"];
    var datasetPath;
    var tileRootPath;
    var customPlaybackTimeout = null;

    var timelapseDurationInSeconds = 0.0;
    var timelapseCurrentTimeInSeconds = 0.0;
    var timelapseCurrentCaptureTimeIndex = 0;
    var captureTimes = new Array();

    var snaplapse;
    var toursJSON = {};

    var canvas;
    var canvasTmp;
    var canvasContext;
    var canvasTmpContext;

    var originalWidth;
    var originalHeight;
    var resizeTimeout;

    // levelThreshold sets the quality of display by deciding what level of tile to show for a given level of zoom:
    //
    //  1.0: select a tile that's shown between 50% and 100% size  (never supersample)
    //  0.5: select a tile that's shown between 71% and 141% size
    //  0.0: select a tile that's shown between 100% and 200% size (never subsample)
    // -0.5: select a tile that's shown between 141% and 242% size (always supersample)
    // -1.0: select a tile that's shown between 200% and 400% size (always supersample)
    var levelThreshold = 0.05;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //

    this.getViewerDivId = function () {
      return viewerDivId;
    }

    this.getVideoDivId = function () {
      return videoDivId;
    }

    this.getSnaplapse = function () {
      return snaplapse;
    }

    this.getCanvas = function () {
      return canvas;
    }

    this.getCanvasTmp = function () {
      return canvasTmp;
    }

    this.changeDataset = function (data) {
      //datasetPath = gigapanUrl;
      UTIL.log("changeDataset(" + datasetPath + "): view is " + JSON.stringify(view));

      // Reset currentIdx so that we'll load in the new tile with the different resolution.  We don't null the
      // currentVideo here because 1) it will be assigned in the refresh() method when it compares the bestIdx
      // and the currentIdx; and 2) we want currentVideo to be non-null so that the VideosetStats can keep
      // track of what video replaced it.
      currentIdx = null;

      onPanoLoadSuccessCallback(data, view);
    };

    var handleKeydownEvent = function (event) {

      // if we are focused on a text field or the slider handlers, do not run any player specific controls
      if ($(".timelineSlider .ui-slider-handle:focus").length ||
          $(".zoomSlider .ui-slider-handle:focus").length ||
          document.activeElement == "[object HTMLInputElement]" ||
          document.activeElement == "[object HTMLTextAreaElement]") return;

      var translationSpeedConstant = 20;
      var moveFn;
      //console.log(event.which);
      switch (event.which) {
      case 37:
        moveFn = function () {
          targetView.x -= translationSpeedConstant / view.scale;
          setTargetView(targetView);
        };
        break; // left arrow
      case 39:
        moveFn = function () {
          targetView.x += translationSpeedConstant / view.scale;
          setTargetView(targetView);
        };
        break; // right arrow
      case 38:
        moveFn = function () {
          targetView.y -= translationSpeedConstant / view.scale;
          setTargetView(targetView);
        };
        break; // up arrow
      case 40:
        moveFn = function () {
          targetView.y += translationSpeedConstant / view.scale;
          setTargetView(targetView);
        };
        break; // down arrow
      case 189:
        moveFn = function () {
          targetView.scale *= .94;
          setTargetView(targetView);
        };
        break; // minus
      case 187:
        moveFn = function () {
          targetView.scale /= .94;
          setTargetView(targetView);
        };
        break; // plus
      case 80:
        // P
        if (_isPaused()) {
          _play();
        } else {
          _pause();
        }
        break;
      default:
        return;
      }
      // Install interval to run every 50 msec while key is down
      // Each arrow key and +/- has its own interval, so multiple can be down at once
      if (keyIntervals[event.which] == undefined) keyIntervals[event.which] = setInterval(moveFn, 50);
      // Don't propagate arrow events -- prevent scrolling of the document
      if (event.which <= 40) {
        event.preventDefault();
      }
    }

    var handleKeyupEvent = function () {
      if (keyIntervals[event.which] != undefined) {
        clearInterval(keyIntervals[event.which]);
        keyIntervals[event.which] = undefined;
      }
    };

    this.handleMousescrollEvent = function(event, delta) {
      event.preventDefault();
      //UTIL.log('mousescroll delta  ' + delta);
      if (delta > 0) {
        zoomAbout(1 / .9, event.pageX, event.pageY);
      } else if (delta < 0) {
        zoomAbout(.9, event.pageX, event.pageY);
      }
    };

    var _warpTo = function (newView) {
      setTargetView(newView);
      view.x = targetView.x;
      view.y = targetView.y;
      view.scale = targetView.scale;
      refresh();
    };
    this.warpTo = _warpTo;

    var _homeView = function () {
      var ret = computeViewFit({
        xmin: 0,
        ymin: 0,
        xmax: panoWidth,
        ymax: panoHeight
      });
      return ret;
    };
    this.homeView = _homeView;

    this.getBoundingBoxForCurrentView = function () {
      return computeBoundingBox(view);
    };

    this.warpToBoundingBox = function (bbox) {
      this.warpTo(computeViewFit(bbox));
    };

    this.resetPerf = function () {
      videoset.resetPerf();
    };

    this.getPerf = function () {
      return videoset.getPerf();
    };

    this.getView = function () {
      // Clone current view
      return $.extend({}, view);
    };

    this.getVideoset = function () {
      return videoset;
    };

    var _addTargetViewChangeListener = function (listener) {
      targetViewChangeListeners.push(listener);
    };
    this.addTargetViewChangeListener = _addTargetViewChangeListener;

    var _addViewChangeListener = function (listener) {
      viewChangeListeners.push(listener);
    };
    this.addViewChangeListener = _addViewChangeListener;

    var _addVideoPauseListener = function (listener) {
      videoset.addEventListener('videoset-pause', listener);
    };
    this.addVideoPauseListener = _addVideoPauseListener;

    var _addVideoPlayListener = function (listener) {
      videoset.addEventListener('videoset-play', listener);
    };
    this.addVideoPlayListener = _addVideoPlayListener;

    var _makeVideoVisibleListener = function(listener) {
      videoset.addEventListener('video-made-visible', listener);
    };
    this.makeVideoVisibleListener = _makeVideoVisibleListener;

    var _getProjection = function (projectionType) {
      projectionType = typeof(projectionType) != 'undefined' ? projectionType : "mercator";
      if (projectionType == "mercator") {
        var projectionBounds = tmJSON['projection-bounds'];

        return new org.gigapan.timelapse.MercatorProjection(
          projectionBounds["west"], projectionBounds["north"],
          projectionBounds["east"], projectionBounds["south"],
          panoWidth, panoHeight);
      }
    };
    this.getProjection = _getProjection;

    var getViewStrAsProjection = function () {
      var latlng = _getProjection().pointToLatlng(view);
      return Math.round(1e5 * latlng.lat) / 1e5 + "," +
             Math.round(1e5 * latlng.lng) / 1e5 + "," +
             Math.round(1e3 * Math.log(view.scale / _homeView().scale) / Math.log(2))/ 1e3 + "," +
             "latLng";
    };

    var getViewStrAsPoints = function () {
      return Math.round(1e5 * view.x) / 1e5 + "," +
             Math.round(1e5 * view.y) / 1e5 + "," +
             Math.round(1e3 * Math.log(view.scale / _homeView().scale) / Math.log(2))/ 1e3 + "," +
             "pts";
    };

    var _getViewStr  = function () {
      // TODO: let the user choose lat/lng or points for a dataset with projection info
      if (typeof(tmJSON['projection-bounds']) != 'undefined') {
        return getViewStrAsProjection();
      } else {
        return getViewStrAsPoints();
      }
    };
    this.getViewStr = _getViewStr;

    var _setNewView  = function (newView, doWarp) {
      if (typeof(newView) === 'undefined' || newView == null) return;

      if (newView['center']) { // Center view
        if ((typeof(tmJSON['projection-bounds']) !== 'undefined') &&
            org.gigapan.Util.isNumber(newView['center']['lat']) && org.gigapan.Util.isNumber(newView['center']['lng']) && org.gigapan.Util.isNumber(newView['zoom'])) {
          newView = computeViewLatLngCenter(newView);
        } else if (org.gigapan.Util.isNumber(newView['center']['x']) && org.gigapan.Util.isNumber(newView['center']['y']) && org.gigapan.Util.isNumber(newView['zoom'])) {
          newView = computeViewPointCenter(newView);
        } else {
          newView = view;
        }
      } else if (newView['bbox']) { // Bounding box view
        if ((typeof(tmJSON['projection-bounds']) !== 'undefined') &&
            org.gigapan.Util.isNumber(newView['bbox']['ne']) && org.gigapan.Util.isNumber(newView['bbox']['sw']) &&
            org.gigapan.Util.isNumber(newView['bbox']['ne']['lat']) && org.gigapan.Util.isNumber(newView['bbox']['ne']['lng']) &&
            org.gigapan.Util.isNumber(newView['bbox']['sw']['lat']) && org.gigapan.Util.isNumber(newView['bbox']['sw']['lng'])) {
          newView = computeViewLatLngFit(newView);
        } else if (org.gigapan.Util.isNumber(newView['bbox']['xmin']) && org.gigapan.Util.isNumber(newView['bbox']['xmax']) && org.gigapan.Util.isNumber(newView['bbox']['ymin']) && org.gigapan.Util.isNumber(newView['bbox']['ymax'])) {
          newView = computeViewFit(newView);
        } else {
          newView = view;
        }
      }

      if (doWarp)
        _warpTo(newView);
      else
        setTargetView(newView);
    };
    this.setNewView = _setNewView;

    var _shareView = function () {
      $("#" + viewerDivId + " .shareurl").val(window.location.href.split("#")[0] + '#v=' + _getViewStr() + '&t=' + timelapse.getCurrentTime().toFixed(2));
      $("#" + viewerDivId + " .shareurl").focus(function(){$(this).select();});
      $("#" + viewerDivId + " .shareurl").click(function(){$(this).select();});
      $("#" + viewerDivId + " .shareurl").mouseup(function(e){e.preventDefault();});
      $("#" + viewerDivId + " .shareView").dialog("open");
    };
    this.shareView = _shareView;

    ///////////////////////////
    // Timelapse video control
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    var _isPaused = function () {
      return videoset.isPaused();
    };
    this.isPaused = _isPaused;

    var _pause = function () {
      window.clearTimeout(customPlaybackTimeout);
      videoset.pause();
    };
    this.pause = _pause;

    var _seek = function (t) {
      videoset.seek(Math.min(Math.max(0,t),timelapseDurationInSeconds));
    };
    this.seek = _seek;

    this.setPlaybackRate = function (rate) {
      videoset.setPlaybackRate(rate);
    };

    this.getPlaybackRate = function () {
      return videoset.getPlaybackRate();
    };

    this.getVideoPosition = function () {
      return videoset.getVideoPosition();
    };

    function updateCustomPlayback() {
      /* Startup custom playback stuff if possible */
      if(loopPlayback && customLoopPlaybackRates) {
        var nextSegment = null; /* next segment with custom playback */
        for(var i in customLoopPlaybackRates) {
          var rateObj = customLoopPlaybackRates[i];
          if(timelapseCurrentTimeInSeconds < rateObj.end) {
            if(timelapseCurrentTimeInSeconds >= rateObj.start) {
              nextSegment = rateObj;
              break;
            }
            else if(nextSegment === null || rateObj.start < nextSegment.start) {
              nextSegment = rateObj;
            }
          }
        }
        if(nextSegment === null) { /* Make sure playback rate matches selection */
          thisObj.setPlaybackRate(playbackRate);
        }
        else {
          var difference = nextSegment.start - timelapseCurrentTimeInSeconds;
          if(difference > 0)
            customPlaybackTimeout = window.setTimeout(updateCustomPlayback, difference);
          else {
            thisObj.setPlaybackRate(nextSegment.rate);
            customPlaybackTimeout = window.setTimeout(updateCustomPlayback, difference);
          }
        }
      }
    }

    var _play = function () {
      updateCustomPlayback();
      videoset.play();
    };
    this.play = _play;

    this.setStatusLoggingEnabled = function (enable) {
      videoset.setStatusLoggingEnabled(enable);
    };

    this.setNativeVideoControlsEnabled = function (enable) {
      videoset.setNativeVideoControlsEnabled(enable);
    };

    var _getNumFrames = function () {
      return frames;
    };
    this.getNumFrames = _getNumFrames;

    var _getFps = function () {
      return videoset.getFps();
    };
    this.getFps = _getFps;

    this.getVideoWidth = function () {
      return videoWidth;
    };

    this.getVideoHeight = function () {
      return videoHeight;
    };

    this.getWidth = function () {
      return panoWidth;
    };

    this.getHeight = function () {
      return panoHeight;
    };

    this.getMetadata = function () {
      return metadata;
    }

    var _addTimeChangeListener = function (listener) {
      videoset.addEventListener('sync', listener);
    };
    this.addTimeChangeListener = _addTimeChangeListener;

    var _removeTimeChangeListener = function (listener) {
      videoset.removeEventListener('sync', listener);
    };
    this.removeTimeChangeListener = _removeTimeChangeListener;

    this.getCurrentTime = function () {
      return videoset.getCurrentTime();
    };

    this.setScale = function (val) {
      targetView.scale = val;
      setTargetView(targetView);
    };

    this.setScaleFromSlider = function (val) {
      targetView.scale = _zoomSliderToViewScale(val);
      setTargetView(targetView);
    };

    var _getMinScale = function () {
      return _homeView().scale * .5;
    };

    this.getMinScale = _getMinScale;

    var _getMaxScale = function () {
      return 2;
    };

    this.getMaxScale = _getMaxScale;

    this.getDefaultScale = function () {
      return _homeView().scale;
    };

    this.updateDimensions = function () {
      readVideoDivSize();
    };

    var _viewScaleToZoomSlider = function (value) {
      var tmpValue = Math.sqrt((value - _getMinScale()) / (_getMaxScale() - _getMinScale()));
      return (1 / (Math.log(2))) * (Math.log(tmpValue + 1));
    };
    this.viewScaleToZoomSlider = _viewScaleToZoomSlider;

    var _zoomSliderToViewScale = function (value) {
      return _getMaxScale() * (Math.pow((Math.pow(2, value) - 1), 2)) - Math.pow(4, value) * _getMinScale() + 2 * Math.pow(2, value) * _getMinScale();
    };
    this.zoomSliderToViewScale = _zoomSliderToViewScale;

    var _getDatasetJSON = function () {
      return datasetJSON;
    }
    this.getDatasetJSON = _getDatasetJSON;

    var _fullScreen = function (state) {
      var newWidth, newHeight;

      if (originalWidth == null) {
        originalWidth = $("#"+videoDivId).width();
        originalHeight = $("#"+videoDivId).height();
      }

      if (state == undefined || state) {
        $("body").css({'overflow': 'hidden'});
        fullScreen = true;
        var extraHeight = showMainControls ? ($("#"+viewerDivId+" .controls").outerHeight() + $("#"+viewerDivId+" .timelineSlider").outerHeight() + 2) : 0;
        newWidth = window.innerWidth - 2; // extra 2px for the borders
        newHeight = window.innerHeight - extraHeight; // subtract height of controls and extra 2px for borders

        // ensure minimum dimensions to not break controls
        if (newWidth < 700)
          newWidth = 700;
        if (newHeight < 250)
          newHeight = 240;
      } else {
        fullScreen = false;
        $("body").css({'overflow': 'auto'});
        newWidth = originalWidth;
        newHeight = originalHeight;
      }
      setViewportSize(newWidth, newHeight, timelapse);
    }
    this.fullScreen = _fullScreen;

    var _toggleMainControls = function (state) {
      showMainControls = !showMainControls;
      $("#" + viewerDivId + " .controls").toggle();
      $("#" + viewerDivId + " .timelineSlider").toggle();
      _fullScreen(fullScreen);
    }
    this.toggleMainControls = _toggleMainControls;

    var _toggleZoomControls = function (state) {
      showZoomControls = !showZoomControls;
      $("#" + viewerDivId + " .zoom").toggle();
    }
    this.toggleZoomControls = _toggleZoomControls;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    var handleMousedownEvent = function (event) {
      if (event.which != 1) return;
      var mouseIsDown = true;
      var lastEvent = event;
      var saveMouseMove = document.onmousemove;
      var saveMouseUp = document.onmouseup;
      videoDiv.style.cursor = 'url("css/cursors/closedhand.png") 10 10, move';
      document.onmousemove = function (event) {
        if (mouseIsDown) {
          targetView.x += (lastEvent.pageX - event.pageX) / view.scale;
          targetView.y += (lastEvent.pageY - event.pageY) / view.scale;
          setTargetView(targetView);
          lastEvent = event;
        }
        return false;
      };
      $("body").bind("mouseup mouseleave", function(event){
        mouseIsDown = false;
        videoDiv.style.cursor = 'url("css/cursors/openhand.png") 10 10, move';
        document.onmousemove = saveMouseMove;
        document.onmouseup = saveMouseUp;
      });
      return false;
    };

    var zoomAbout = function (zoom, x, y) {
      var newScale = limitScale(targetView.scale * zoom);
      var actualZoom = newScale / targetView.scale;
      targetView.x += 1 * (1 - 1 / actualZoom) * (x - $(videoDiv).offset().left - viewportWidth * .5) / targetView.scale;
      targetView.y += 1 * (1 - 1 / actualZoom) * (y - $(videoDiv).offset().top - viewportHeight * .5) / targetView.scale;
      targetView.scale = newScale;
      setTargetView(targetView);
    };

    var handleDoubleClickEvent = function (event) {
      zoomAbout(2.0, event.pageX, event.pageY);
    };

    var limitScale = function (scale) {
      return Math.max(_getMinScale(), Math.min(_getMaxScale(), scale));
    };

    var view2string = function (view) {
      return "[view x:" + view.x + " y:" + view.y + " scale:" + view.scale + "]";
    };

    var setTargetView = function (newView) {
      var tempView = {};
      tempView.scale = limitScale(newView.scale);
      tempView.x = Math.max(0, Math.min(panoWidth, newView.x));
      tempView.y = Math.max(0, Math.min(panoHeight, newView.y));
      targetView.x = tempView.x;
      targetView.y = tempView.y;
      targetView.scale = tempView.scale;

      if (animateInterval == null) {
        animateInterval = setInterval(animate, 80); // 12.5 hz
        lastAnimationTime = UTIL.getCurrentTimeInSecs();
      }

      refresh();

      for (var i = 0; i < targetViewChangeListeners.length; i++) targetViewChangeListeners[i](targetView);
    };
    this.setTargetView = setTargetView;

    var point2mag = function (point) {
      return Math.sqrt(point.x * point.x + point.y * point.y);
    };

    var point2sub = function (a, b) {
      return {
        x: a.x - b.x,
        y: a.y - b.y
      };
    };

    var point2scale = function (point, scale) {
      return {
        x: point.x * scale,
        y: point.y * scale
      };
    };

    var log2 = function (x) {
      return Math.log(x) / Math.log(2);
    };

    var exp2 = function (x) {
      return Math.pow(2, x);
    };

    var animate = function () {
      // Compute deltaT between this animation frame and last
      var now = UTIL.getCurrentTimeInSecs();
      var deltaT = now - lastAnimationTime;
      if (deltaT < .001) deltaT = .001;
      if (deltaT > .2) deltaT = .2;
      lastAnimationTime = now;

      var viewChanged = false;

      // Animate translation
      var minTranslateSpeed = minTranslateSpeedPixelsPerSecond / view.scale;    // convert to pano coords / sec
      var minTranslateDelta = minTranslateSpeed * deltaT;
      var translateFraction = Math.min(.5, translateFractionPerSecond * deltaT);

      var toGoal = point2sub(targetView, view);
      var toGoalMag = point2mag(toGoal);

      if (toGoalMag > 0) {
        var translateDelta;
        if (toGoalMag * translateFraction > minTranslateDelta) {
          translateDelta = point2scale(toGoal, translateFraction);
          //UTIL.log("translating by fraction " + translateFraction + ", mag " + point2mag(translateDelta));
        } else if (toGoalMag > minTranslateDelta) {
          translateDelta = point2scale(toGoal, minTranslateDelta / toGoalMag);
          //UTIL.log("translating by min delta " + minTranslateDelta + ", mag " + point2mag(translateDelta));
        } else {
          translateDelta = toGoal;
          //UTIL.log("translating full amount " + point2mag(translateDelta));
        }
        view.x += translateDelta.x;
        view.y += translateDelta.y;
        viewChanged = true;
      }

      // Animate scale
      var minZoomSpeed = minZoomSpeedPerSecond;
      var minZoomDelta = minZoomSpeed * deltaT;
      var zoomFraction = zoomFractionPerSecond * deltaT;

      if (targetView.scale != view.scale) {
        var zoomDelta;
        var toGoal = log2(targetView.scale) - log2(view.scale);
        if (Math.abs(toGoal) * zoomFraction > minZoomDelta) {
          view.scale = exp2(log2(view.scale) + toGoal * translateFraction);
        } else if (Math.abs(toGoal) > minZoomDelta) {
          view.scale = exp2(log2(view.scale) + toGoal * minZoomDelta / Math.abs(toGoal));
        } else {
          view.scale = targetView.scale;
        }
        viewChanged = true;
      }

      if (!viewChanged) {
        //UTIL.log("animation finished, clearing interval");
        clearInterval(animateInterval);
        animateInterval = null;
      } else {
        refresh();
        for (var i = 0; i < viewChangeListeners.length; i++) viewChangeListeners[i](view);
      }
    };

    //bounding box point fit
    var computeViewFit = function (bbox) {
      if (typeof(bbox['bbox']) != 'undefined') bbox = bbox['bbox'];

      var scale = Math.min(viewportWidth / (bbox.xmax - bbox.xmin), viewportHeight / (bbox.ymax - bbox.ymin));

      return {
        x: .5 * (bbox.xmin + bbox.xmax),
        y: .5 * (bbox.ymin + bbox.ymax),
        scale: scale
      };
    };

    //bounding box lat/lng fit
    var computeViewLatLngFit = function (newView) {
      var projection = _getProjection();

      var a = projection.latlngToPoint({"lat": newView['bbox']['ne']['lng'], "lng": newView['bbox']['sw']['lng']});
      var b = projection.latlngToPoint({"lat": newView['bbox']['ne']['lat'], "lng": newView['bbox']['sw']['lat']});

      var scale = Math.min(viewportWidth / (b.x - a.x), viewportHeight / (a.y - b.y));

      return {
        x: .5 * (a.x + b.x),
        y: .5 * (a.y + b.y),
        scale: scale
      };
    };

    //point center
    var computeViewPointCenter = function (newView) {
      return {
        x: newView["center"].x,
        y: newView["center"].y,
        scale: Math.pow(2, newView["zoom"]) * _homeView().scale
      };
    };

    //latlng center
    var computeViewLatLngCenter = function (newView) {
      var point = _getProjection().latlngToPoint({"lat": newView["center"]["lat"], "lng": newView["center"]["lng"]});
      return {
        x: point.x,
        y: point.y,
        scale: Math.pow(2, newView["zoom"]) * _homeView().scale
      };
    };

    var computeBoundingBox = function (theView) {
      var halfWidth = .5 * viewportWidth / theView.scale;
      var halfHeight = .5 * viewportHeight / theView.scale;
      return {
        xmin: theView.x - halfWidth,
        xmax: theView.x + halfWidth,
        ymin: theView.y - halfHeight,
        ymax: theView.y + halfHeight
      };
    };

    var onPanoLoadSuccessCallback = function (data, desiredView) {
      UTIL.log('onPanoLoadSuccessCallback(' + JSON.stringify(data) + ', ' + view + ', ' + ')');
      isSplitVideo = 'frames_per_fragment' in data;
      framesPerFragment = isSplitVideo ? data['frames_per_fragment'] : data['frames'];
      secondsPerFragment = isSplitVideo ? framesPerFragment / data['fps'] :  1 / data['fps'] * (data['frames'] - 1);
      UTIL.log("isSplitVideo=[" + isSplitVideo + "], framesPerFragment=[" + framesPerFragment + "], secondsPerFragment=[" + secondsPerFragment + "]");
      panoWidth = data['width'];
      panoHeight = data['height'];
      tileWidth = data['tile_width'];
      tileHeight = data['tile_height'];
      videoWidth = data['video_width'];
      videoHeight = data['video_height'];
      videoset.setFps(data['fps']);
      videoset.setDuration(1 / data['fps'] * (data['frames'] ));
      videoset.setLeader(data['leader'] / data['fps']);
      videoset.setIsSplitVideo(isSplitVideo);
      videoset.setSecondsPerFragment(secondsPerFragment);
      frames = data['frames'];
      maxLevel = data['nlevels'] - 1;
      levelInfo = data['level_info'];
      metadata = data;

      readVideoDivSize();

      _warpTo(typeof desiredView != 'undefined' && desiredView ? desiredView : _homeView());
    };

    var readVideoDivSize = function () {
      viewportWidth = $(videoDiv).width();
      viewportHeight = $(videoDiv).height();
    };

    var refresh = function () {
      if (!isFinite(view.scale)) return;

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

    var needFirstAncestor = function (tileidx) {
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

    var findFirstNeededAncestor = function (tileidx) {
      var a = tileidx;
      while (a) {
        a = getTileidxParent(a);
        if (tiles[a] && tiles[a].needed) return a;
      }
      return false;
    };

    var addTileidx = function (tileidx, videoToUnload) {
      var url = getTileidxUrl(tileidx);
      var geom = tileidxGeometry(tileidx);
      //UTIL.log("adding tile " + dumpTileidx(tileidx) + " from " + url + " and geom = (left:" + geom['left'] + " ,top:" + geom['top'] + ", width:" + geom['width'] + ", height:" + geom['height'] + ")");
      var video = videoset.addVideo(url, geom);
      video.tileidx = tileidx;
      return video;
    };

    var deleteTileidx = function (tileidx) {
      var tile = tiles[tileidx];
      if (!tile) {
        UTIL.error('deleteTileidx(' + dumpTileidx(tileidx) + '): not loaded');
        return;
      }
      UTIL.log("removing tile " + dumpTileidx(tileidx) + " ready=" + tile.video.ready);

      videoset.deleteVideo(tile.video);
      delete tiles[tileidx];
    };

    var getTileidxUrl = function (tileidx) {
      //var shardIndex = (getTileidxRow(tileidx) % 2) * 2 + (getTileidxColumn(tileidx) % 2);
      //var urlPrefix = url.replace("//", "//t" + shardIndex + ".");
      var fragmentSpecifier = isSplitVideo ? "_" + videoset.getFragment(videoset.getCurrentTime()) : "";
      var videoURL = datasetPath + getTileidxLevel(tileidx) + "/" + getTileidxRow(tileidx) + "/" + getTileidxColumn(tileidx) + fragmentSpecifier + ".mp4";
      return (UTIL.isIE9() ? videoURL+"?time="+new Date().getTime() : videoURL);
    };

    var computeBestVideo = function (theView) {
      //UTIL.log("computeBestVideo " + view2string(theView));
      var level = scale2level(view.scale);
      var levelScale = Math.pow(2, maxLevel - level);
      var col = Math.round((theView.x - (videoWidth * levelScale * .5)) / (tileWidth * levelScale));
      col = Math.max(col, 0);
      col = Math.min(col, levelInfo[level].cols - 1);
      var row = Math.round((theView.y - (videoHeight * levelScale * .5)) / (tileHeight * levelScale));
      row = Math.max(row, 0);
      row = Math.min(row, levelInfo[level].rows - 1);
      //UTIL.log("computeBestVideo l=" + level + ", c=" + col + ", r=" + row);
      return tileidxCreate(level, col, row);
    };

    var scale2level = function (scale) {
      // Minimum level is 0, which has one tile
      // Maximum level is maxLevel, which is displayed 1:1 at scale=1
      var idealLevel = Math.log(scale) / Math.log(2) + maxLevel;
      var selectedLevel = Math.floor(idealLevel + levelThreshold);
      selectedLevel = Math.max(selectedLevel, 0);
      selectedLevel = Math.min(selectedLevel, maxLevel);
      //UTIL.log('scale2level('+scale+'): idealLevel='+idealLevel+', ret='+selectedLevel);
      return selectedLevel;
    };

    var tileidxGeometry = function (tileidx) {
      var levelScale = Math.pow(2, maxLevel - getTileidxLevel(tileidx));

      // Calculate left, right, top, bottom, rounding to nearest pixel;  avoid gaps between tiles.
      var left = view.scale * (getTileidxColumn(tileidx) * tileWidth * levelScale - view.x) + viewportWidth * .5;
      var right = Math.round(left + view.scale * levelScale * videoWidth);
      left = Math.round(left);

      var top = view.scale * (getTileidxRow(tileidx) * tileHeight * levelScale - view.y) + viewportHeight * .5;
      var bottom = Math.round(top + view.scale * levelScale * videoHeight);
      top = Math.round(top);

      return {
        left : left,
        top: top,
        width: (right - left),
        height: (bottom - top)
      };
    };

    var repositionVideo = function (video) {
      videoset.repositionVideo(video, tileidxGeometry(video.tileidx));
    };

    this.writeStatusToLog = function () {
      videoset.writeStatusToLog();
    };

    this.getTiles = function () {
      return tiles;
    };

    ///////////////////////////
    // Tile index
    //
    // Represent tile coord as a 31-bit integer so we can use it as an index
    // l:4 (0-15)   r:13 (0-8191)  c:14 (0-16383)
    // 31-bit representation
    //
    var tileidxCreate = function (l, c, r) {
      return (l << 27) + (r << 14) + c;
    };

    var getTileidxLevel = function (t) {
      return t >> 27;
    };

    var getTileidxRow = function (t) {
      return 8191 & (t >> 14);
    };

    var getTileidxColumn = function (t) {
      return 16383 & t;
    };

    var getTileidxParent = function (t) {
      return tileidxCreate(getTileidxLevel(t) - 1, getTileidxColumn(t) >> 1, getTileidxRow(t) >> 1);
    };

    var dumpTileidx = function (t) {
      return "{l:" + getTileidxLevel(t) + ",c:" + getTileidxColumn(t) + ",r:" + getTileidxRow(t) + "}";
    };

    function createTimelineSlider(div) {
      if (tmJSON["capture-times"]) {
        captureTimes = tmJSON["capture-times"];
      } else {
        for (var i = 0; i < _getNumFrames(); i++) {
          captureTimes.push("--")
        }
      }

      timelapseDurationInSeconds = (_getNumFrames() - 0.7) / _getFps();

      $("#" + div + " .currentTime").html(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds, true));
      $("#" + div + " .totalTime").html(org.gigapan.Util.formatTime(timelapseDurationInSeconds, true));
      $("#" + div + " .currentCaptureTime").html(org.gigapan.Util.htmlForTextWithEmbeddedNewlines(captureTimes[timelapseCurrentCaptureTimeIndex]));

      $("#" + div + " .timelineSlider").slider({
        min: 0,
        max: _getNumFrames() - 1, // this way the time scrubber goes exactly to the end of timeline
        range: "min",
        step: 1,
        slide: function (e, ui) {
          // $(this).slider('value')  --> previous value
          // ui.value                 --> current value
          // If we are manually using the slider and we are pulling it back to the start
          // we wont actually get to time 0 because of how we are snapping.
          // Manually seek to position 0 when this happens.
          if (($(this).slider('value') > ui.value) && ui.value == 0) _seek(0);
          else _seek((ui.value + 0.3) / _getFps());
        }
      }).removeClass("ui-corner-all");

      $("#" + div + " .timelineSlider .ui-slider-handle").attr("title", "Drag to go to a different point in time");
    }

    function createPlaybackSpeedSlider(div, timelapseObj) {
      //populate playback speed dropdown
      populateSpeedPlaybackChoices(div, timelapseObj);
      var speedChoice;
      // set the playback speed dropdown
      $("#" + div + " .playbackSpeedChoices li a").each(function () {
        speedChoice = $(this);
        if (speedChoice.attr("data-speed") == playbackSpeed) return false;
      });
      speedChoice.addClass("current");
      $("#" + div + " .playbackSpeedText").text(speedChoice.text());
      $("#" + div + " .playbackSpeedChoices li a").bind("click", function () {
        changePlaybackRate(this);
      });
    }

    function changePlaybackRate(obj) {
      var rate = $(obj).attr("data-speed") - 0; //convert to number
      thisObj.setPlaybackRate(rate);
      playbackSpeed = rate;
      $("#" + viewerDivId + " li.playbackSpeedOptions").hide();
      $("#" + viewerDivId + " li.playbackSpeedOptions a").removeClass("current");
      $(obj).addClass("current");
      $("#" + viewerDivId + " .playbackSpeedText").text($(obj).text());
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


      $("#" + viewerDivId + " .sizechoices li a").bind("click", function () {
        thisObj.switchSize($(this).attr("data-index"));
        $("#" + viewerDivId + " li.sizeoptions a").removeClass("current");
        $(this).addClass("current");
      });
    }

    function populateLayers() {
      var numLayers = tmJSON["layers"].length
      var html = "";
      for (var i = 0; i < numLayers; i++) {
        html += "<li data-index=" + i + "><img src=\"" + tmJSON["layers"][i]["tn-path"] + "\" " + "alt='layer' width='45' height='45' ><br/><span style='font-size:small; text-align:center; display:block; margin: -5px 0px 0px 0px !important;'>" + tmJSON['layers'][i]['description'] + "</span></li>"
      }
      $("#" + viewerDivId + " .layerChoices").append(html);

      $("#" + viewerDivId + " .layerChoices li").bind("click", function () {
        thisObj.switchLayer($(this).attr("data-index"));
      });
    }

    this.switchSize = function (index) {
      playerSize = index;
      var newIndex = datasetLayer * tmJSON["sizes"].length + playerSize;
      validateAndSetDatasetIndex(newIndex);
      loadVideosetJSON();
      $("#" + viewerDivId + " .playerSizeText").text(tmJSON["datasets"][index]["name"]);
    }

    this.switchLayer = function (index) {
      var newIndex = index * tmJSON["sizes"].length + playerSize;
      validateAndSetDatasetIndex(newIndex);
      loadVideosetJSON();
    }

    function validateAndSetDatasetIndex(newDatasetIndex) {
      // make sure the datasetIndex is a valid number, and within the range of datasets for this timelapse.
      if (!org.gigapan.Util.isNumber(newDatasetIndex)) {
        datasetIndex = 0;
      } else {
        datasetIndex = Math.max(0, Math.min(newDatasetIndex, tmJSON["datasets"].length - 1));
      }
    }

    function loadVideosetJSON() {
      datasetPath = settings["url"] + tmJSON["datasets"][datasetIndex]['id'] + "/";
      showSpinner(viewerDivId);
      //org.gigapan.Util.log("Attempting to fetch videoset JSON from URL [" + datasetPath + "]...");
      org.gigapan.Util.ajax("json",datasetPath + 'r.json',loadVideoSet);
    }

    function loadVideoSet(data) {
      datasetJSON = data;
      thisObj.changeDataset(data);
      if (!fullScreen)
        setViewportSize(data["video_width"] - data["tile_width"], data["video_height"] - data["tile_height"], thisObj);
      hideSpinner(viewerDivId);
    }

    function doHelpOverlay(obj) {
      if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled")) return;
      $("#" + viewerDivId + " li.sizeoptions").hide(); //might be already opened
      $("#" + viewerDivId + " li.playbackSpeedOptions").hide(); //might be already opened
      $("#" + viewerDivId + " .instructions").fadeIn(100);
      $("#" + viewerDivId + " .repeat").addClass("disabled");
      $("#" + viewerDivId + " .help").addClass("on");
      if ($("#" + viewerDivId + " .playbackButton").hasClass('pause')) {
        obj.pause();
        $("#" + viewerDivId + " .playbackButton").addClass("pause_disabled from_help");
      } else {
        $("#" + viewerDivId + " .playbackButton").addClass("play_disabled");
      }
      $("#" + viewerDivId + " .timelineSlider").slider("option", "disabled", true);
    }

    function removeHelpOverlay(obj) {
      if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled")) return;
      $("#" + viewerDivId + " .instructions").fadeOut(50);
      $("#" + viewerDivId + " .repeat").removeClass("disabled");
      $("#" + viewerDivId + " .help").removeClass("on");
      if ($("#" + viewerDivId + " .playbackButton").hasClass('from_help')) {
        obj.play();
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
            $(this).parents(".ui-dialog").css({'border': '1px solid #000'});
          }
        }
      ).parent().appendTo($("#" + viewerDivId));

      if (showShareBtn) {
        $("#" + viewerDivId + " .share").bind("click", function () {
          _shareView()
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

      $("#" + viewerDivId + " a.playbackspeed").click(function () {
        if ($("#" + viewerDivId + " .help").hasClass("on") || $("#" + viewerDivId + " .zoomSlider").slider("option", "disabled")) return;
        $("#" + viewerDivId + " li.playbackSpeedOptions").fadeIn(100);
      });

      $("#" + viewerDivId + " a.size").click(function () {
        if ($("#" + viewerDivId + " .help").hasClass("on") || $("#" + viewerDivId + " .zoomSlider").slider("option", "disabled")) return;
        $("#" + viewerDivId + " li.sizeoptions").fadeIn(100);
      });

      $(document).click(function (event) {
        if ($(event.target).closest("#" + viewerDivId + " a.playbackspeed").get(0) == null) {
          $("#" + viewerDivId + " li.playbackSpeedOptions").hide();
        }
        if ($(event.target).closest("#" + viewerDivId + " a.size").get(0) == null) {
          $("#" + viewerDivId + " li.sizeoptions").hide();
        }
        if ($(event.target).closest("#" + viewerDivId + " .help").get(0) == null) {
          if ($("#" + viewerDivId + " .help").hasClass("on")) removeHelpOverlay(obj);
        }
      });

      $("#" + viewerDivId + " .help").click(function () {
        if ($("#" + viewerDivId + " .help").hasClass("on")) removeHelpOverlay(obj);
        else doHelpOverlay(obj);
      });

      $("#" + viewerDivId + " .playbackButton").bind("click", function () {
        if ($("#" + viewerDivId + " .timelineSlider").slider("option", "disabled")) return;
        if (timelapseCurrentTimeInSeconds <=0 && thisObj.getPlaybackRate() <= 0) return;

        if ($(this).hasClass('play')) {
          $(this).toggleClass("play pause");
          $(this).attr({
            "title": "Pause"
          });
          if (isCurrentTimeAtOrPastDuration() && thisObj.getPlaybackRate() > 0) {
            $("#" + viewerDivId + " .timelineSlider").slider("option", "value", 0);
            obj.pause();
            obj.seek(0);
          }
          obj.play();
        } else if ($(this).hasClass('pause')) {
          $(this).toggleClass("pause play");
          $(this).attr({
            "title": "Play"
          });
          obj.pause();
        }
      });

      $("#" + viewerDivId + " .fullScreen").bind("click", function () {
        if ($(this).hasClass("disabled") || $("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true) return;

        if (!fullScreen) {
          $(this).toggleClass("inactive active");
          $(this).prop('title', 'Exit full screen');
          _fullScreen(true);
        }
        else {
          $(this).toggleClass("active inactive");
          $(this).prop('title', 'Full screen');
          _fullScreen(false);
        }
      });

      $("#" + viewerDivId + " .repeat").bind("click", function () {
        if ($(this).hasClass("disabled") || $("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true) return;
        loopPlayback = !loopPlayback
        updateCustomPlayback();
        if (loopPlayback) {
          $(this).toggleClass("inactive active");
        }
        else {
          $(this).toggleClass("active inactive");
          /* Set playback back to what the dropdown says */
          changePlaybackRate($("#" + viewerDivId + " .playbackSpeedChoices .current"));
        }
      });

      $("#" + viewerDivId + " .zoomall").click(function () {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true) return;
        obj.warpTo(obj.homeView());
        //$("#" + viewerDivId + " .zoomSlider")['slider']("option", "value", obj.viewScaleToZoomSlider(obj.getDefaultScale()));
      });

      $("#" + viewerDivId + " .zoomin").mousedown(function () {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true) return;
        intervalId = setInterval(function () {
          zoomIn(viewerDivId, obj);
        }, 50);
      }).click(function () {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true) return;
        zoomIn(viewerDivId, obj);
      }).mouseup(function () {
        clearInterval(intervalId);
      }).mouseout(function () {
        clearInterval(intervalId);
      });

      $("#" + viewerDivId + " .zoomout").mousedown(function () {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true) return;
        intervalId = setInterval(function () {
          zoomOut(viewerDivId, obj);
        }, 50);
      }).click(function () {
        if ($("#" + viewerDivId + " .zoomSlider").slider("option", "disabled") == true) return;
        zoomOut(viewerDivId, obj);
      }).mouseup(function () {
        clearInterval(intervalId);
      }).mouseout(function () {
        clearInterval(intervalId);
      });

      window.onresize = function(event) {
          clearTimeout(resizeTimeout);
          if (fullScreen) {
            resizeTimeout = setTimeout(function() {
              _fullScreen(true);
            }, 100);
         }
      }
    }

    function isCurrentTimeAtOrPastDuration() {
      // fix the numbers, but subtract 0 from each to convert back to float since toFixed gives a string
      var num1Fixed = timelapseCurrentTimeInSeconds.toFixed(3) - 0;
      var num2Fixed = timelapseDurationInSeconds.toFixed(3) - 0;
      return num1Fixed >= num2Fixed;
    }

    function setupTimelapse(){
      _addTimeChangeListener(function (t) {
        timelapseCurrentTimeInSeconds = t;
        timelapseCurrentCaptureTimeIndex = Math.floor(t * _getFps());
        if(t == timelapseDurationInSeconds)
          timelapseCurrentCaptureTimeIndex--;
        if (timelapseCurrentTimeInSeconds.toFixed(3) < 0 || (timelapseCurrentTimeInSeconds.toFixed(3) == 0 && thisObj.getPlaybackRate() < 0)) {
          timelapseCurrentTimeInSeconds = 0;
          _pause();
          _seek(0);
          $("#" + viewerDivId + " .playbackButton").removeClass("pause");
          $("#" + viewerDivId + " .playbackButton").addClass("play");
          $("#" + viewerDivId + " .playbackButton").attr({"title": "Play"});
        }
        //console.log("current time: " + t);
        //console.log("total time: " + timelapseDurationInSeconds);

        if (isCurrentTimeAtOrPastDuration() && thisObj.getPlaybackRate() > 0) {
          timelapseCurrentTimeInSeconds = timelapseDurationInSeconds;
          if (snaplapse != null && snaplapse.isPlaying()) return;
          if (loopPlayback) {
            if ($("#" + viewerDivId + " .playbackButton").hasClass("pause")) {
              _seek(0);
              //_pause();
              //_play();
            }
          } else {
           _pause();
           $("#" + viewerDivId + " .playbackButton").removeClass("pause");
           $("#" + viewerDivId + " .playbackButton").addClass("play");
           $("#" + viewerDivId + " .playbackButton").attr({"title": "Play"});
          }
        }
        $("#" + viewerDivId + " .currentTime").html(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds, true));
        $("#" + viewerDivId + " .currentCaptureTime").html(org.gigapan.Util.htmlForTextWithEmbeddedNewlines(captureTimes[timelapseCurrentCaptureTimeIndex]));
        $("#" + viewerDivId + " .timelineSlider").slider("value", (timelapseCurrentTimeInSeconds * _getFps() - 0.3));
      });

      _addTargetViewChangeListener(function (view) {
        $("#" + viewerDivId + " .zoomSlider").slider("value", _viewScaleToZoomSlider(view.scale));
      });

      _addVideoPauseListener(function() {
        // the videoset might cause playback to pause, such as when it decides
        // it's hit the end (even though the current time might not be >= duration),
        // so we need to make sure the play button is updated
        $("#" + viewerDivId + " .playbackButton").removeClass("pause");
        $("#" + viewerDivId + " .playbackButton").addClass("play");
        $("#" + viewerDivId + " .playbackButton").attr({"title": "Play"});
      });

      _addVideoPlayListener(function() {
        // always make sure that when we are playing, the button status is updated
        $("#" + viewerDivId + " .playbackButton").removeClass("play");
        $("#" + viewerDivId + " .playbackButton").addClass("pause");
        $("#" + viewerDivId + " .playbackButton").attr({"title": "Pause"});
      });

      _makeVideoVisibleListener(function(videoId, theTime) {
        if (videoId == videoDivId + "_1") {
          // Fire onTimeMachinePlayerReady when the first video is ready
          if ( typeof (onTimeMachinePlayerReady) === "function") {
            onTimeMachinePlayerReady(viewerDivId);
          }
        }
      });

      if (settings["composerDiv"]) snaplapse = new org.gigapan.timelapse.Snaplapse(settings["composerDiv"], thisObj);

      populateSizes(viewerDivId);
      //hasLayers = timelapseMetadataJSON["has_layers"] || false;
      createTimelineSlider(viewerDivId);
      createZoomSlider(viewerDivId, thisObj);
      createPlaybackSpeedSlider(viewerDivId, thisObj);
      setupSliderHandlers(viewerDivId);
      setupUIHandlers(viewerDivId, thisObj);
      //handlePluginVideoTagOverride(); //TODO

      // Fixes Safari bug which causes the video to not be displayed if the video has no leader and the initial
      // time is zero (the video seeked event is never fired, so videoset never gets the cue that the video
      // should be displayed).  The fix is to simply seek half a frame in.  Yeah, the video won't be starting at
      // *zero*, but the displayed frame will still be the right one, so...good enough.  :-)
      if (videoset.getLeader() <= 0 && (UTIL.isSafari() || UTIL.isIE())) {
        var halfOfAFrame = 1 / _getFps() / 2;
        _seek(halfOfAFrame);
      }
    }

    var _loadToursJSON = function (json) {
      toursJSON = json;
      // Do stuff
    }
    this.loadToursJSON = _loadToursJSON;

    var _loadTimelapseJSON = function (json) {
      tmJSON = json;
      tileRootPath = settings["url"]; // assume tiles and json are on same host
      for (var i = 0; i < tmJSON["sizes"].length; i++) {
        playerSize = i;
        if (settings["playerSize"] && tmJSON["sizes"][i].toLowerCase() == settings["playerSize"].toLowerCase()) break;
      }
      validateAndSetDatasetIndex(datasetLayer * tmJSON["sizes"].length + playerSize); //layer + size = index of dataset
      datasetPath = settings["url"] + tmJSON["datasets"][datasetIndex]['id'] + "/";
      org.gigapan.Util.ajax("json",datasetPath + 'r.json',_loadInitialVideoSet);
    }
    this.loadTimelapseJSON = _loadTimelapseJSON;

    var _loadInitialVideoSet= function (data) {
      datasetJSON = data;
      setViewportSize(data["video_width"] - data["tile_width"], data["video_height"] - data["tile_height"], thisObj);

      onPanoLoadSuccessCallback(data, null);

      setupTimelapse();

      if (initialView) {
        _setNewView(initialView);
      }

      if (loopPlayback) $("#" + viewerDivId + " .repeat").toggleClass("inactive active");
      if (playOnLoad) _play();
      if (initialTime != 0) _seek(initialTime);

      hideSpinner(viewerDivId);

      // Fix for the video initially not being displayed
      $("#" + videoDivId +" :first-child").css({'display': 'none'});
      $("#" + videoDivId +" :first-child").css({'display': 'inherit'});

      $("#" + viewerDivId + " img " + ", #" + viewerDivId + " a").css({
        "-moz-user-select": "none",
        "-webkit-user-select": "none",
        "-webkit-user-drag": "none",
        "-khtml-user-select": "none",
        "-o-user-select": "none",
        "user-select": "none"
      });

    }
    this.loadInitialVideoSet = _loadInitialVideoSet;

    function loadPlayerControlsTemplate(html) {
      var viewerDiv = document.getElementById(viewerDivId);
      $(viewerDiv).html(html);
      var tmp = document.getElementById("{REPLACE}");
      $(tmp).attr("id", viewerDivId + "_timelapse");
      videoDivId = $(tmp).attr("id");
      videoDiv = document.getElementById(videoDivId);

      $(viewerDiv).attr('unselectable', 'on').css({
        '-moz-user-select': 'none',
        '-o-user-select': 'none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
      });

      // TODO: Should this be part of player_template.html?
      canvas = document.createElement('canvas');
      canvas.id = videoDivId+"_canvas";
      videoDiv.appendChild(canvas);

      canvasTmp = document.createElement('canvas');
      canvasTmp.id = videoDivId+"_canvas_tmp";
      canvasTmp.style.display = "none";
      videoDiv.appendChild(canvasTmp);

      canvasContext = canvas.getContext('2d');
      canvasTmpContext = canvasTmp.getContext('2d');

      videoset = new org.gigapan.timelapse.Videoset(viewerDivId, videoDivId, canvas.id, canvasTmp.id);
      videosetStats = new org.gigapan.timelapse.VideosetStats(videoset, settings["videosetStatsDivId"]);

      videoDiv['onmousedown'] = handleMousedownEvent;
      videoDiv['ondblclick'] = handleDoubleClickEvent;

      $(videoDiv).mousewheel(thisObj.handleMousescrollEvent);

      $(videoDiv).bind("click", function () {
        $(document).unbind('keydown.tm_keydown keyup.tm_keyup');
        $(document).bind("keydown.tm_keydown", handleKeydownEvent);
        $(document).bind("keyup.tm_keyup", handleKeyupEvent);
      });

      if (!showZoomControls) {
        $("#" + viewerDivId + " .zoom").hide();
      }

      if (!showMainControls) {
        $("#" + viewerDivId + " .controls").hide();
        $("#" + viewerDivId + " .timelineSlider").hide();
      }

      org.gigapan.Util.ajax("json",settings["url"] + "tm.json",_loadTimelapseJSON);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    browserSupported = org.gigapan.Util.browserSupported();
    if (!browserSupported) {
      org.gigapan.Util.ajax("html","browser_not_supported_template.html",function(html){
        $("#" + viewerDivId).html(html);
        $("#browser_not_supported").show();
      });
      return;
    }

    view =  _homeView();
    targetView = {};

    // add trailing slash to url if it was omitted
    if (settings["url"].charAt(settings["url"].length - 1) != "/") settings["url"] += "/";

    UTIL.log('Timelapse("' + settings["url"] + '")');
    showSpinner(viewerDivId);
    org.gigapan.Util.ajax("html","player_template.html",loadPlayerControlsTemplate);

  };
})();
