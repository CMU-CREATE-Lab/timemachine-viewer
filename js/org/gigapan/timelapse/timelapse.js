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

(function() {
  var UTIL = org.gigapan.Util;

  org.gigapan.timelapse.Timelapse = function(url, videoDivName, optionalInfo, videosetStatsDivName) {
    var videoset = new org.gigapan.timelapse.Videoset(videoDivName);
    var videosetStats = new org.gigapan.timelapse.VideosetStats(videoset, videosetStatsDivName);
    var videoDiv = document.getElementById(videoDivName);
    var tiles = {};
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
    var view = null;
    var targetView = null;
    var currentIdx = null;
    var currentVideo = null;
    var animateInterval = null;
    var lastAnimationTime;
    var minTranslateSpeedPixelsPerSecond = 25.;
    var translateFractionPerSecond = 3.;
    var minZoomSpeedPerSecond = .25; // in log2
    var zoomFractionPerSecond = 3.; // in log2
    var keyIntervals = [];
    var targetViewChangeListeners = [];

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

    this.changeDataset = function(gigapanUrl, gigapanJSON) {
      url = gigapanUrl;
      UTIL.log("changeDataset("+gigapanUrl+"): view is " + JSON.stringify(view));

      // Reset currentIdx so that we'll load in the new tile with the different resolution.  We don't null the
      // currentVideo here because 1) it will be assigned in the refresh() method when it compares the bestIdx
      // and the currentIdx; and 2) we want currentVideo to be non-null so that the VideosetStats can keep
      // track of what video replaced it.
      currentIdx = null;

      onPanoLoadSuccessCallback(gigapanJSON, "", "", view);
    };

    this.handleKeydownEvent = function(event) {

      // if we are focused on a text field, do not run any player specific controls
      if (document.activeElement == "[object HTMLInputElement]" || document.activeElement == "[object HTMLTextAreaElement]") return;

      var translationSpeedConstant = 20;
      var moveFn;
      switch (event.which) {
        case 37:  moveFn = function() {targetView.x -= translationSpeedConstant / view.scale; setTargetView(targetView);}; break;  // left arrow
        case 39:  moveFn = function() {targetView.x += translationSpeedConstant / view.scale; setTargetView(targetView);}; break;  // right arrow
        case 38:  moveFn = function() {targetView.y -= translationSpeedConstant / view.scale; setTargetView(targetView);}; break;  // up arrow
        case 40:  moveFn = function() {targetView.y += translationSpeedConstant / view.scale; setTargetView(targetView);}; break;  // down arrow
        case 189: moveFn = function() {targetView.scale *= .94;                               setTargetView(targetView);}; break;  // minus
        case 187: moveFn = function() {targetView.scale /= .94;                               setTargetView(targetView);}; break;  // plus
        case 80:  // P
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
        event.preventDefault(); // depends on jQuery
      }
    }

    this.handleKeyupEvent = function() {
      if (keyIntervals[event.which] != undefined) {
        clearInterval(keyIntervals[event.which]);
        keyIntervals[event.which] = undefined;
      }
    };

    this.handleMousescrollEvent = function(event) {
      //UTIL.log('mousescroll delta  ' + event.wheelDelta);
      if (event.wheelDelta > 0) {
        zoomAbout(1/.9, event.pageX, event.pageY);
      } else if (event.wheelDelta < 0) {
        zoomAbout(.9, event.pageX, event.pageY);
      }
    };

    var _warpTo = function(newView) {
      setTargetView(newView);
      view.x = targetView.x;
      view.y = targetView.y;
      view.scale = targetView.scale;
      refresh();
    };
    this.warpTo = _warpTo;

    var _homeView = function() {
      var ret = computeViewFit({xmin:0, ymin:0, xmax:panoWidth, ymax:panoHeight});
      return ret;
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
      return view;
    };

    this.getVideoset = function() {
      return videoset;
    };

    this.addTargetViewChangeListener = function(listener) {
      targetViewChangeListeners.push(listener);
    };

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
      videoset.pause();
    };
    this.pause = _pause;

    this.seek = function(t) {
      videoset.seek(t);
    };

    this.setPlaybackRate = function(rate) {
      videoset.setPlaybackRate(rate);
    };

    this.getPlaybackRate = function() {
      return videoset.getPlaybackRate();
    };

    this.getVideoPosition = function() {
      return videoset.getVideoPosition();
    };

    var _play = function() {
      videoset.play();
    };
    this.play = _play;

    this.setStatusLoggingEnabled = function(enable) {
      videoset.setStatusLoggingEnabled(enable);
    };

    this.setNativeVideoControlsEnabled = function(enable) {
      videoset.setNativeVideoControlsEnabled(enable);
    };

    this.getNumFrames = function() {
      return frames;
    };

    this.getFps = function() {
      return videoset.getFps();
    };

    this.getVideoWidth = function() {
      return videoWidth;
    };

    this.getVideoHeight = function() {
      return videoHeight;
    };

    this.getWidth = function() {
      return panoWidth;
    };

    this.getHeight = function() {
      return panoHeight;
    };
		
    this.addTimeChangeListener = function(listener) {
      videoset.addEventListener('sync', listener);
    };

    this.removeTimeChangeListener = function(listener) {
      videoset.removeEventListener('sync', listener);
    };

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
      return _homeView().scale * .5;
    };

    this.getMinScale = _getMinScale;

    var _getMaxScale = function() {
      return 2;
    };

    this.getMaxScale = _getMaxScale;

    this.getDefaultScale = function() {
      return _homeView().scale;
    };

    this.updateDimensions = function() {
      readVideoDivSize();
    };

    var _viewScaleToZoomSlider = function(value) {
      var tmpValue = Math.sqrt((value - _getMinScale()) / (_getMaxScale() - _getMinScale()));
      return (1/(Math.log(2)))*(Math.log(tmpValue+1));
    };
    this.viewScaleToZoomSlider = _viewScaleToZoomSlider;

    var _zoomSliderToViewScale = function(value) {
      return _getMaxScale()*(Math.pow((Math.pow(2,value)-1),2)) - Math.pow(4,value)*_getMinScale() + 2*Math.pow(2,value)*_getMinScale();
    };
    this.zoomSliderToViewScale = _zoomSliderToViewScale;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    var handleMousedownEvent = function(event) {
      var lastEvent = event;
      var saveMouseMove = document.onmousemove;
      var saveMouseUp = document.onmouseup;
      videoDiv.style.cursor = 'url("../gigapan-timelapse-explorer/css/cursors/closedhand.cur") 10 10, move';
      document.onmousemove = function(event) {
        targetView.x += (lastEvent.pageX - event.pageX) / view.scale;
        targetView.y += (lastEvent.pageY - event.pageY) / view.scale;
        setTargetView(targetView);
        lastEvent = event;
        return false;
      };
      document.onmouseup = function() {
        videoDiv.style.cursor = 'url("../gigapan-timelapse-explorer/css/cursors/openhand.cur") 10 10, move';
        document.onmousemove = saveMouseMove;
        document.onmouseup = saveMouseUp;
      };
      return false;
    };

    var zoomAbout = function(zoom, x, y) {
      var newScale = limitScale(targetView.scale * zoom);
      var actualZoom = newScale / targetView.scale;
      targetView.x += 1 * (1 - 1 / actualZoom) * (x - $(videoDiv).offset().left - viewportWidth * .5) / targetView.scale; //depends on jquery
      targetView.y += 1 * (1 - 1 / actualZoom) * (y - $(videoDiv).offset().top - viewportHeight * .5) / targetView.scale; //depends on jquery
      targetView.scale = newScale;
      setTargetView(targetView);
      //make the scale map to the zoom slider range
      $("#slider-vertical")['slider']("option", "value", _viewScaleToZoomSlider(targetView.scale)); //depends on jquery
    };

    var handleDoubleClickEvent = function(event) {
      zoomAbout(2.0, event.pageX, event.pageY);
    };

    var limitScale = function(scale) {
      return Math.max(_getMinScale(), Math.min(_getMaxScale(), scale));
    };

    var view2string = function(view) {
      return "[view x:"+view.x+" y:"+view.y+" scale:"+view.scale+"]";
    };

    var setTargetView = function(newView) {
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

    var point2mag = function(point) {
      return Math.sqrt(point.x*point.x + point.y*point.y);
    };

    var point2sub = function(a,b) {
      return {x: a.x-b.x, y: a.y-b.y};
    };

    var point2scale = function(point, scale) {
      return {x: point.x*scale, y: point.y*scale};
    };

    var log2 = function(x) {
      return Math.log(x) / Math.log(2);
    };

    var exp2 = function(x) {
      return Math.pow(2,x);
    };

    var animate = function() {
      // Compute deltaT between this animation frame and last
      var now = UTIL.getCurrentTimeInSecs();
      var deltaT = now - lastAnimationTime;
      if (deltaT < .001) deltaT = .001;
      if (deltaT > .2) deltaT = .2;
      lastAnimationTime = now;

      var viewChanged = false;

      // Animate translation
      var minTranslateSpeed = minTranslateSpeedPixelsPerSecond / view.scale;
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
        var toGoal = log2(targetView.scale)-log2(view.scale);
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
      }
    };
            
    var computeViewFit = function(bbox) {
      var scale = Math.min(viewportWidth / (bbox.xmax - bbox.xmin),
      viewportHeight / (bbox.ymax - bbox.ymin));
      return {x:.5 * (bbox.xmin + bbox.xmax), y:.5 * (bbox.ymin + bbox.ymax), scale: scale};
    };

    var computeBoundingBox = function(theView) {
      var halfWidth = .5 * viewportWidth / theView.scale;
      var halfHeight = .5 * viewportHeight / theView.scale;
      return {xmin:theView.x - halfWidth, xmax:theView.x + halfWidth, ymin:theView.y - halfHeight, ymax:theView.y + halfHeight};
    };

    var onPanoLoadSuccessCallback = function(data, status, xhr, desiredView) {
      UTIL.log('onPanoLoadSuccessCallback(' + UTIL.dumpObject(data) + ', ' + status + ', ' + xhr + ')');
      panoWidth = data['width'];
      panoHeight = data['height'];
      tileWidth = data['tile_width'];
      tileHeight = data['tile_height'];
      videoWidth = data['video_width'];
      videoHeight = data['video_height'];
      videoset.setFps(data['fps']);
      videoset.setDuration(1 / data['fps'] * (data['frames']-1));
      videoset.setLeader(data['leader']/data['fps']);
      frames = data['frames'];
      maxLevel = data['nlevels']-1;
      levelInfo = data['level_info'];

      readVideoDivSize();
      _warpTo(typeof desiredView != 'undefined' && desiredView ? desiredView : _homeView());
    };

    var readVideoDivSize = function() {
      viewportWidth = parseInt(videoDiv.style.width);
      viewportHeight = parseInt(videoDiv.style.height);
    };

    var refresh = function() {
      if (!isFinite(view.scale)) return;

      var bestIdx = computeBestVideo(targetView);
      if (bestIdx != currentIdx) {
        currentVideo = addTileidx(bestIdx, currentVideo);
        currentIdx = bestIdx;
      }

      var activeVideos = videoset.getActiveVideos();
      for (var key in videoset.getActiveVideos()) {
        var video = activeVideos[key];
        repositionVideo(video);
      }
    };

    var needFirstAncestor = function(tileidx) {
      //UTIL.log("need ancestor for " + dumpTileidx(tileidx));
      var a = tileidx;
      while (a) {
        a = getTileidxParent(a);
        //UTIL.log("checking " + dumpTileidx(a) + ": present=" + !!tiles[a] + ", ready=" + (tiles[a]?tiles[a].video.ready:"n/a"));

        if (tiles[a] && tiles[a].video.ready) {
          tiles[a].needed=true;
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
        if (tiles[a] && tiles[a].needed) return a;
      }
      return false;
    };

    var addTileidx = function(tileidx, videoToUnload) {
      var url = getTileidxUrl(tileidx);
      var geom = tileidxGeometry(tileidx);
      //UTIL.log("adding tile " + dumpTileidx(tileidx) + " from " + url + " and geom = (left:" + geom['left'] + " ,top:" + geom['top'] + ", width:" + geom['width'] + ", height:" + geom['height'] + ")");
      var video = videoset.addVideo(url, geom, videoToUnload);
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
      return url + getTileidxLevel(tileidx) + "/" + getTileidxRow(tileidx) + "/" + getTileidxColumn(tileidx) + ".mp4";
    };

    var computeBestVideo = function(theView) {
      //UTIL.log("computeBestVideo " + view2string(theView));
      var level = scale2level(view.scale);
      var levelScale = Math.pow(2, maxLevel - level);
      var col = Math.round((theView.x - (videoWidth * levelScale * .5)) / (tileWidth * levelScale));
      col = Math.max(col, 0);
      col = Math.min(col, levelInfo[level].cols-1);
      var row = Math.round((theView.y - (videoHeight * levelScale * .5)) / (tileHeight * levelScale));
      row = Math.max(row, 0);
      row = Math.min(row, levelInfo[level].rows-1);
      //UTIL.log("computeBestVideo l=" + level + ", c=" + col + ", r=" + row);
      return tileidxCreate(level,col,row);
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
      var left = view.scale * (getTileidxColumn(tileidx) * tileWidth * levelScale - view.x) + viewportWidth * .5;
      var right = Math.round(left + view.scale * levelScale * videoWidth);
      left = Math.round(left);

      var top = view.scale * (getTileidxRow(tileidx) * tileHeight * levelScale - view.y) + viewportHeight * .5;
      var bottom = Math.round(top + view.scale * levelScale * videoHeight);
      top = Math.round(top);

      return {left:left, top:top, width:(right - left), height:(bottom - top)};
    };

    var repositionVideo = function(video) {
      videoset.repositionVideo(video, tileidxGeometry(video.tileidx));
    };

    this.writeStatusToLog = function() {
      videoset.writeStatusToLog();
    };
    
    this.getTiles = function() { return tiles; };

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
      return tileidxCreate(getTileidxLevel(t)-1, getTileidxColumn(t)>>1, getTileidxRow(t)>>1);
    };

    var dumpTileidx = function(t) {
      return "{l:" + getTileidxLevel(t) + ",c:" + getTileidxColumn(t) + ",r:" + getTileidxRow(t) + "}";
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    view = _homeView();
    targetView = _homeView();
    UTIL.log('Timelapse("' + url + '")');
    videoDiv['onmousedown'] = handleMousedownEvent;
    videoDiv['ondblclick'] = handleDoubleClickEvent;

    if (optionalInfo) {
      onPanoLoadSuccessCallback(optionalInfo, "", "");
    } else {
      $.ajax({url:url + 'r.json', dataType: 'json', success: onPanoLoadSuccessCallback});  // TODO: move this to index.html; depends upon jquery
    }

    // Fixes Safari bug which causes the video to not be displayed if the video has no leader and the initial
    // time is zero (the video seeked event is never fired, so videoset never gets the cue that the video
    // should be displayed).  The fix is to simply seek half a frame in.  Yeah, the video won't be starting at
    // *zero*, but the displayed frame will still be the right one, so...good enough.  :-)
    if (videoset.getLeader() <= 0  && UTIL.isSafari()) {
      var halfOfAFrame = 1 / this.getFps() / 2;
      this.seek(halfOfAFrame);
    }
  };
})();
