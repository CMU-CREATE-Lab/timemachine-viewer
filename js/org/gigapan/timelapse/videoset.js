// Class for managing timelapse videosets.
//
// Supports the following events to which listeners can subscribe.  Event handlers are called with the arguments listed
// in parentheses:
// * video-added (videoId, time)
// * video-loaded-metadata (videoId, time)
// * video-made-visible (videoId, time)
// * video-deleted (video.id, currentTime, videoWhichCausedTheDelete)
//   NOTE: the videoWhichCausedTheDelete parameter may be null
// * video-garbage-collected (videoId, time)
// * stall-status-change (isStalled)
// * sync (currentTime)
//
// Dependencies:
// * org.gigapan.Util
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
  var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Videoset";
  alert(noUtilMsg);
  throw new Error(noUtilMsg);
}
if (!window['$']) {
  var nojQueryMsg = "The jQuery library is required by org.gigapan.timelapse.Videoset";
  alert(nojQueryMsg);
  throw new Error(nojQueryMsg);
}

//
// CODE
//

(function() {
  var UTIL = org.gigapan.Util;
  var MAX_QUEUED_VIDEO_LENGTH = 2;   // max number of videos allowed to be queued without stalling
  var DEFAULT_ERROR_THRESHOLD = UTIL.isChrome() ? 0.005 : 0.04;

  org.gigapan.timelapse.Videoset = function(viewerDivId,videoDivId) {
    var videoDiv = document.getElementById(videoDivId);
    var viewerDiv = document.getElementById(viewerDivId);
    var isStatusLoggingEnabled = false;
    var activeVideos = {};
    var inactiveVideos = {};
    var playbackRate = 1;
    var id = 0;
    var fps = 25;
    var areNativeVideoControlsVisible = false;
    var duration = 0;
    var isCacheDisabled = false;
    var advancing = false;
    var paused = true;
    var stalled = false;
    var timeOffset = 0;
    var logInterval = null;
    var syncInterval = null;
    var garbageCollectionInterval = null;
    var perfInitialSeeks = 0;
    var perfTimeCorrections = [];
    var perfTimeTweaks = 0;
    var perfTimeSeeks = 0;
    var perfAdded = 0;
    var syncIntervalTime = 0.2; // in seconds
    var emulatingSyncIntervalTime = 1./12.; // in seconds
    var emulatingPlaybackRate = false;
    var leader = 0;
    var eventListeners = {};

    ////////////////////////
    //
    // Public methods
    //

    this.setStatusLoggingEnabled = function(enable) {
      enable = !!enable;  // make true or false
      //UTIL.log("videoset logging status: " + enable);
      if (isStatusLoggingEnabled == enable) {
        return;
      }
      isStatusLoggingEnabled = enable;
      if (enable) {
        //logInterval = setInterval(this.writeStatusToLog, 500);
        logInterval = setInterval(allStats, 200);
      } else {
        clearInterval(logInterval);
      }
    };

    this.setNativeVideoControlsEnabled = function(enable) {
      areNativeVideoControlsVisible = !!enable;  // make true or false

      for (var videoId1 in activeVideos) {
        var v1 = activeVideos[videoId1];
        enable ? v1.setAttribute('controls', true) : v1.removeAttribute('controls');
      }

      for (var videoId2 in inactiveVideos) {
        var v2 = inactiveVideos[videoId2];
        enable ? v2.setAttribute('controls', true) : v2.removeAttribute('controls');
      }
    };

    this.setFps = function(newFps) {
      fps = newFps;
    };

    this.setDuration = function(newDuration) {
      duration = newDuration;
    };

    this.getFps = function() {
      return fps;
    };

    this.setLeader = function(newLeader) {
      var currentTime = _getCurrentTime();
      leader = newLeader - 0;  // subtract 0 to force this to be a number
      // Yuck.  This adds one frame to the leader to prevent sometimes showing the leader at the beginning of the video.  Don't know why this is a problem.  Happens more with Safari
      // Disabled since it confuses the player about the length of the video
      //if (leader > 0) leader += 1.0/fps;
      _seek(currentTime);
    };

    this.getLeader = function() {
      return leader;
    };

    this.getActiveVideos = function() {
      return activeVideos;
    };

    this.getInactiveVideos = function() {
      return inactiveVideos;
    };

    this.resetPerf = function() {
      perfInitialSeeks = 0;
      perfAdded = 0;
      perfTimeCorrections = [];
      perfTimeTweaks = 0;
      perfTimeSeeks = 0;
    };

    var getPerf = function() {
      var perf = "Videos added: " + perfAdded;
      perf += "; initial seeks: " + perfInitialSeeks;
      perf += "; # time correction seeks: " + perfTimeSeeks;
      perf += "; # time correction tweaks: " + perfTimeTweaks;
      perf += "; Corrections: ";
      for (var i = 0; i < perfTimeCorrections.length; i++) {
        if (i) perf += ",";
        perf += perfTimeCorrections[i].toFixed(4);
      }
      return perf;
    };



    ///////////////////////////
    // Add and remove videos
    //

    this.addVideo = function(src, geometry, videoBeingReplaced, onloadCallback) {
      perfAdded++;
      id++;
      //Note: Safari and Chrome already let you do this
      //Left in codebase for quick toggling and in case other browsers don't have an easy way to do this
      if (isCacheDisabled) {
        src += "?nocache=" + UTIL.getCurrentTimeInSecs() + "." + id;
      }
      var msg = "video(" + id + ") added from " + src + " at left=" + geometry.left + ",top=" + geometry.top + ", w=" + geometry.width + ",h=" + geometry.height;
      if (videoBeingReplaced != null) msg += "; replace=video(" + videoBeingReplaced.id + ")";
      UTIL.log(msg);

      var currentTime = new Date();
      var video = document.createElement('video');
      video.id = videoDiv.id+"_"+id;
      video.active = true;
      video.ready = false;
      if (typeof videoBeingReplaced != 'undefined' && videoBeingReplaced != null) {
        video.idOfVideoBeingReplaced = videoBeingReplaced.id;
      }
      if (typeof onloadCallback == 'function') {
        video.onloadCallback = onloadCallback;
      }
      //UTIL.log(getVideoSummaryAsString(video));
      video.setAttribute('src', src);
      //UTIL.log("set src successfully");
      if (areNativeVideoControlsVisible) {
        video.setAttribute('controls', true);
      }
      video.setAttribute('preload', true);
      this.repositionVideo(video, geometry);
      video.defaultPlaybackRate = video.playbackRate = playbackRate;
      video.style.display = 'inline';
      video.style.position = 'absolute';
      activeVideos[video.id] = video;
      videoDiv.appendChild(video);
      video.addEventListener('loadedmetadata', videoLoadedMetadata, false);
      video.addEventListener('seeked', videoSeeked, false);
      video.bwLastTime = UTIL.getCurrentTimeInSecs();
      video.bwLastBuf = 0;
      video.bandwidth = 0;
      video.load();
      var check;
      var timeout = 2000;
      check = function() {
        UTIL.log("check load for video("+video.id+")");
        UTIL.log("readyState: " + video.readyState);
        if (video.readyState == 0 && activeVideos[video.id] == video) {
          // Ouch.  A brand new bug in Chrome 15 (apparently) causes videos to never load
          // if they've been loaded recently and are being loaded again now.
          // It's pretty weird, but this disgusting code seems to work around the problem.
          UTIL.log("we're still active but have ready state zero;  calling load again");
          video.setAttribute('src', src+"?time="+(new Date().getTime()));
          video.load();
          timeout *= 2;
          setTimeout(check, timeout);
        }
      }
      setTimeout(check, timeout);
      publishVideoEvent(video.id, 'video-added', currentTime);

      updateStallState();

      return video;
    };

    this.repositionVideo = function(video, geometry) {
      //UTIL.log("video(" + video.id + ") reposition to left=" + geometry.left + ",top=" + geometry.top + ", w=" + geometry.width + ",h=" + geometry.height + "; ready="+video.ready);
      // toFixed prevents going to scientific notation when close to zero;  this confuses the DOM
      video.style.left = geometry.left.toFixed(4) - (video.ready ? 0 : 100000) + "px";
      video.style.top = geometry.top.toFixed(4) + "px";

      video.style.width = geometry.width + "px";
      video.style.height = geometry.height + "px";
    };

    var garbageCollect = function() {
      var numInactiveVideos = 0;
      var idsOfVideosToDelete = [];
      for (var videoId in inactiveVideos) {
        numInactiveVideos++;
        var candidate = inactiveVideos[videoId];

        // TODO: is it safe to allow garbage collection for Chrome when readyState is 0?
        if ((!org.gigapan.Util.isChrome() || (candidate.readyState == 0 || candidate.readyState >= 4)) && !candidate.seeking) { // TODO: watch out! not checking readyState in non-chrome browsers might cause crashes!
          idsOfVideosToDelete[idsOfVideosToDelete.length] = candidate.id;
        }
      }

      if (numInactiveVideos == 0) {
        // shutdown the garbage collection timeout if there are no more inactive videos
        clearInterval(garbageCollectionInterval);
        garbageCollectionInterval = null;
        //UTIL.log("Stopped garbage collection");
      } else {
        for (var i = 0; i < idsOfVideosToDelete.length; i++) {
          var id = idsOfVideosToDelete[i];
          var videoElement = document.getElementById(id);
          if (videoElement) {
            // try to force browser to stop streaming the video
            videoElement.src = "data:video/mp4;base64";
						// TODO: Should we check that the video actually stopped streaming?
            videoDiv.removeChild(inactiveVideos[id]);
          }
          
          delete inactiveVideos[id];
          UTIL.log("video(" + id + ") garbage collected");

          publishVideoEvent(id, 'video-garbage-collected', new Date());
        }
      }
    };

    var _deleteVideo = function(video) {
      var msg = "video(" + video.id + ") deleted";
      var videoWhichCausedTheDelete = null;
      if (arguments.length > 1) {
        videoWhichCausedTheDelete = arguments[1];
        msg += " and replaced by video("+videoWhichCausedTheDelete.id+")";
      }
      UTIL.log(msg);
      video.active = false;
      video.pause();

      if (!org.gigapan.Util.isChrome()) {
        // this causes Safari and IE to stop streaming the video
        video.src = "data:video/mp4;base64";
      }

      //UTIL.log(getVideoSummaryAsString(video));
      video.style.display = 'none';
      //UTIL.log(getVideoSummaryAsString(video));
      delete activeVideos[video.id];
      inactiveVideos[video.id] = video;

      updateStallState();

      var currentTime = new Date();
      var listeners = eventListeners['video-deleted'];
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](video.id, currentTime, videoWhichCausedTheDelete ? videoWhichCausedTheDelete.id : null);
          } catch(e) {
            UTIL.error(e.name + " while publishing to videoset 'video-deleted' event listener: " + e.message, e);
          }
        }
      }

      if (garbageCollectionInterval == null) {
        garbageCollectionInterval = window.setInterval(garbageCollect, 100);
        //UTIL.log("Started garbage collection");
      }
    };
    this.deleteVideo = _deleteVideo;

    ///////////////////////////
    // Time controls
    //

    var _isPaused = function() {
      return paused;
    };
    this.isPaused = _isPaused;

    var _updateVideoAdvance = function() {
      //UTIL.log("_updateVideoAdvance");
      if (!advancing && !(paused || stalled)) {
        //UTIL.log("resume advance");
        // Resume advancing
        var time = _getCurrentTime();
        advancing = true;
        _updateSyncInterval();
        _seek(time);

        for (var videoId in activeVideos) {
          UTIL.log("video(" + videoId + ") play");
          activeVideos[videoId].play();
        }
      } else if (advancing && (paused || stalled)) {
        //UTIL.log("stop advance");
        // Stop advancing
        var time = _getCurrentTime();
        advancing = false;
        _updateSyncInterval();

        for (var videoId in activeVideos) {
          UTIL.log("video(" + videoId + ") pause");
          activeVideos[videoId].pause();
        }
        _seek(time);
      } else {
        UTIL.log("advance = " + !(paused || stalled));
      }
    };

    var _pause = function() {
      if (!paused) {
        UTIL.log("videoset pause");
        paused = true;
        _updateVideoAdvance();
        unstall();

        // notify pause listeners
        var listeners = eventListeners['videoset-pause'];
        if (listeners) {
          var adjustedTime = _getCurrentTime();
          for (var i = 0; i < listeners.length; i++) {
            try {
              listeners[i](adjustedTime);
            } catch(e) {
              UTIL.error(e.name + " while publishing to videoset 'videoset-pause' event listener: " + e.message, e);
            }
          }
        }
      }
    };
    this.pause = _pause;

    // Call this when advancing or emulatingSyncIntervalTime change
    var _updateSyncInterval = function() {
      if (syncInterval) window.clearInterval(syncInterval);
      if (advancing) {
        var intervalTime = 1000 * (emulatingSyncIntervalTime ? emulatingSyncIntervalTime : syncIntervalTime);
        UTIL.log("_updateSyncInterval: set for " + intervalTime);
        syncInterval = setInterval(sync, intervalTime);
      } else {
        UTIL.log("_updateSyncInterval: cleared");
      }
    }

    this.play = function() {
      if (paused) {
        UTIL.log("videoset play");
        paused = false;
        _updateVideoAdvance();

        // notify play listeners
        var listeners = eventListeners['videoset-play'];
        if (listeners) {
          var adjustedTime = _getCurrentTime();
          for (var i = 0; i < listeners.length; i++) {
            try {
              listeners[i](adjustedTime);
            } catch(e) {
              UTIL.error(e.name + " while publishing to videoset 'videoset-play' event listener: " + e.message, e);
            }
          }
        }
      }
    };

    this.getPlaybackRate = function() {
      return playbackRate;
    };

    var _doesBrowserSupportPlaybackRate = function(rate) {
      if (UTIL.isChrome()) return 0.0 <= rate;
      if (UTIL.isSafari()) return 0.0 == rate || (0.5 <= Math.abs(rate) && Math.abs(rate) <= 2.0);
      return true;
    };

    this.setPlaybackRate = function(rate) {
      if (rate != playbackRate) {
        var t = _getCurrentTime();
        playbackRate = rate;
        _seek(t);
        emulatingPlaybackRate = !_doesBrowserSupportPlaybackRate(rate);
        var videoRate = emulatingPlaybackRate ? 0 : rate;
        UTIL.log("*** SETTING VIDEO PLAYBACK RATE TO " + videoRate);
        for (var videoId in activeVideos) {
          activeVideos[videoId].defaultPlaybackRate = activeVideos[videoId].playbackRate = videoRate;
        }
        _updateSyncInterval();
      }
    };

    var _seek = function(new_time) {
      if (new_time > duration) {
        new_time = duration;
      }

      if (new_time != _getCurrentTime()) {
        //UTIL.log("_getCurrentTime() was " + _getCurrentTime());
        timeOffset = new_time - UTIL.getCurrentTimeInSecs() * (advancing ? playbackRate : 0);
        //UTIL.log("seek: timeOffset is " + timeOffset + ", frame " + timeOffset * fps);
        //UTIL.log("_getCurrentTime() now " + _getCurrentTime());
        sync(0.0);
      }
    };
    this.seek = _seek;

    var _getCurrentTime = function() {
      var t = timeOffset + UTIL.getCurrentTimeInSecs() * (advancing ? playbackRate : 0);
      return (t > duration) ? duration : t;
    };
    this.getCurrentTime = _getCurrentTime;

    this.addEventListener = function(eventName, listener) {
      if (eventName && listener && typeof(listener) == "function") {
        if (!eventListeners[eventName]) {
          eventListeners[eventName] = [];
        }

        eventListeners[eventName].push(listener);
      }
    };

    this.removeEventListener = function(eventName, listener) {
      if (eventName && eventListeners[eventName] && listener && typeof(listener) == "function") {
        for (var i = 0; i < eventListeners[eventName].length; i++) {
          if (listener == eventListeners[eventName][i]) {
            eventListeners[eventName].splice(i, 1);
            return;
          }
        }
      }
    };

    var publishVideoEvent = function(videoId, eventName, theTime) {
      var listeners = eventListeners[eventName];
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](videoId, theTime);
          } catch(e) {
            UTIL.error(e.name + " while publishing to videoset '" + eventName + "' event listener: " + e.message, e);
          }
        }
      }
    };

    this.isStalled = function() {
      return stalled;
    };

    //////////////////////////////////
    //
    // Private methods
    //

    // This seems to get called pretty late in the game
    var videoLoadedMetadata = function(event) {
      var video = event.target;
      publishVideoEvent(video.id, 'video-loaded-metadata', new Date());

      if (!video.active) {
        UTIL.log("video(" + video.id + ") videoLoadedMetadata after deactivation!");
        return;
      }

      _setVideoToCurrentTime(video);
      if (advancing) {
        video.play();
      }
    };

    var _setVideoToCurrentTime = function(video) {
      if (video.active) {
        if (video.readyState > 0) {
          var theCurrentTime = _getCurrentTime();
          var desiredTime = null;

          // clamp desired time to video.duration
          if (parseFloat(theCurrentTime.toFixed(3)) + leader >= video.duration) {
            desiredTime = video.duration;
            if (UTIL.isChrome()) {
              desiredTime = desiredTime - DEFAULT_ERROR_THRESHOLD;
            }
          } else {
            desiredTime = leader + theCurrentTime;
          }

          UTIL.log("video(" + video.id + ") _setVideoToCurrentTime; readyState=[" + video.readyState + "], seek to [" + theCurrentTime + "] which is [" + desiredTime + "]");

          // check the time ranges to see if we've loaded enough to perform a seek without causing a INDEX_SIZE_ERR: DOM Exception 1...
          var canSeek = false;
          var timeRanges = "";
          for (var i = 0; i < video.seekable.length; i++) {
            timeRanges += "(id=" + i + "|start=" + video.seekable.start(i) + "|end=" + video.seekable.end(i) + ")";
            if (video.seekable.start(i) <= desiredTime && desiredTime <= video.seekable.end(i)) {
              canSeek = true;
              break;
            }
          }

          if (canSeek) {
            perfInitialSeeks++;
            try {
              video.currentTime = desiredTime;
            } catch(e) {
              UTIL.error("video(" + video.id + ") _setVideoToCurrentTime(): caught " + e.toString() + " setting currentTime to [" + desiredTime + "].  Will retry in 10 ms...");
              setTimeout(function() { _setVideoToCurrentTime(video);}, 10);
            }
          } else {
            // try again in 10 ms
            UTIL.log("video(" + video.id + ") _setVideoToCurrentTime(): can't seek to [" + desiredTime + "] since no valid time range found [" + timeRanges + "].  Will retry in 10 ms...");
            setTimeout(function() {_setVideoToCurrentTime(video);}, 10);
          }
        } else {
          UTIL.log("video("+video.id+") _setVideoToCurrentTime: doing nothing since video.readyState is 0");
        }
      } else {
        UTIL.log("video("+video.id+") _setVideoToCurrentTime: doing nothing since video.active is false");
      }
    };

    var _makeVideoVisible = function(video, callingFunction) {
      if (!video.active) {
        UTIL.log("video(" + video.id + ") _makeVideoVisible, but it has already been deleted, so do nothing");
        return;
      }

      video.ready = true;
      video.style.left = parseFloat(video.style.left) + 100000 + "px";

      var error = video.currentTime - leader - _getCurrentTime();
      publishVideoEvent(video.id, 'video-made-visible', new Date());
      UTIL.log("video(" + video.id + ") _makeVideoVisible(" + callingFunction + "): ready=[" + video.ready + "] error=[" + error + "] " + videoStats(video));

      // Delete video which is being replaced, following the chain until we get to a null.  We do this in a timeout
      // to give the browser a chance to update the GUI so that it can render the new video positioned above.  This
      // (mostly) fixes the blanking problem we saw in Safari.
      window.setTimeout(function() {
        var videoToDelete = activeVideos[video.idOfVideoBeingReplaced];
        var chainOfDeletes = "";
        while (videoToDelete) {
          var nextVideoToDelete = activeVideos[videoToDelete.idOfVideoBeingReplaced];
          delete videoToDelete.idOfVideoBeingReplaced;  // delete this to prevent multiple deletes
          chainOfDeletes += videoToDelete.id + ",";
          _deleteVideo(videoToDelete, video);
          videoToDelete = nextVideoToDelete;
        }
        UTIL.log("video(" + video.id + ") _makeVideoVisible(" + callingFunction + "): chain of deletes: " + chainOfDeletes);
      }, 1);

      // notify onload listener by calling the callback, if any
      if (video.onloadCallback) {
        try {
          video.onloadCallback();
        } catch(e) {
          UTIL.error(e.name + " while calling callback function for onload of video [" + video.src + "]: " + e.message, e);
        }
      }
    };

    var videoSeeked = function(event) {
      var video = event.target;
      var error = video.currentTime - leader - _getCurrentTime();
      if (_isPaused() && Math.abs(error) > DEFAULT_ERROR_THRESHOLD) {
        UTIL.log("video(" + video.id + ") videoSeeked():  readyState=[" + video.readyState + "] currentTime=[" + video.currentTime + "] error=[" + error + "] is too high, must re-seek");
        _setVideoToCurrentTime(video);
      } else {
        UTIL.log("video(" + video.id + ") videoSeeked():  readyState=[" + video.readyState + "] currentTime=[" + video.currentTime + "] error=[" + error + "] is acceptable");

        if (!video.ready) {
          var checkVideoReadyState = function() {
            video.isWaitingOnReadyState = true;
            if (video.readyState >= 3) {
              video.isWaitingOnReadyState = false;

              _makeVideoVisible(video, "seek");
            } else {
              window.setTimeout(checkVideoReadyState, 10);
            }
          };

          if (!video.isWaitingOnReadyState) {
            checkVideoReadyState();
          }
        }
      }
    };

    // Call periodically, when video is running
    this.writeStatusToLog = function() {
      var msg = "video status:";
      for (var videoId1 in activeVideos) {
        msg += " " + getVideoSummaryAsString(activeVideos[videoId1]);
      }
      for (var videoId2 in inactiveVideos) {
        msg += " " + getVideoSummaryAsString(inactiveVideos[videoId2]);
      }
      UTIL.log(msg);
    };

    var getVideoSummaryAsString = function(video) {
      var summary = video.id.toString();
      summary += ":A=" + (video.active ? "y" : "n");
      summary += ";N=" + video.networkState;
      summary += ";R=" + video.readyState;
      summary += ";P=" + (video.paused ? "y" : "n");
      summary += ";S=" + (video.seeking ? "y" : "n");
      summary += ";T=" + video.currentTime.toFixed(3);
      summary += ";B=" + dumpTimerange(video.buffered);
      summary += ";P=" + dumpTimerange(video.played);
      summary += ";E=" + (video.error ? "y" : "n");
      return summary;
    };

    var dumpTimerange = function(timerange) {
      var ret = "{";
      for (var i = 0; i < timerange.length; i++) {
        ret += timerange.start(i).toFixed(3) + "-" + timerange.end(i).toFixed(3);
      }
      ret += "}";
      return ret;
    };

    var updateStallState = function() {
      // We stall if there are more than MAX_QUEUED_VIDEO_LENGTH videos queued, so count the number of active videos
      var numQueued = 0;
      for (var v in activeVideos) {
        numQueued++;
      }

      if (stalled && numQueued <= MAX_QUEUED_VIDEO_LENGTH) {
        unstall();
      } else if (!stalled && numQueued > MAX_QUEUED_VIDEO_LENGTH) {
        stall();
      } else if (stalled) {
        UTIL.log("Still stalled...");
      }
    };

    var stall = function () {
      if (stalled) {
        return;
      }
      UTIL.log("Video stalling...");
      stalled = true;
      showSpinner(viewerDivId);
      notifyStallEventListeners();
      _updateVideoAdvance();
    };

    var unstall = function () {
      if (!stalled) {
        return;
      }
      UTIL.log("Video unstalled...");
      stalled = false;
      hideSpinner(viewerDivId);
      notifyStallEventListeners();
      _updateVideoAdvance();
    };

    var notifyStallEventListeners = function() {
      var listeners = eventListeners['stall-status-change'];
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](stalled);
          } catch(e) {
            UTIL.error(e.name + " while publishing to videoset 'stall-status-change' event listener: " + e.message, e);
          }
        }
      }
    };

    var updateVideoBandwidth = function(video) {
      var newTime = UTIL.getCurrentTimeInSecs();
      var b = video.buffered;
      var newBufferPosition = (b && b.length) ? b.end(b.length-1) : 0;
      //UTIL.log("newTime " + newTime + " video.bwLastTime " + video.bwLastTime);
      var deltaTime = newTime - video.bwLastTime;
      //UTIL.log("newBufferPosition " + newBufferPosition + " video.bwLastBuf " + video.bwLastBuf);
      var deltaBuffer = newBufferPosition - video.bwLastBuf;
      video.bwLastTime = newTime;
      video.bwLastBuf = newBufferPosition;
      video.bandwidth = (deltaTime==0) ? 0 : deltaBuffer / deltaTime;
      //UTIL.log("bandwidth is " + video.bandwidth);
    };

    var videoStats = function(video) {
      var netstates=["Empty","Idle","Loading","NoSource"];
      var readystates=["Nothing","Metadata","CurrentData", "FutureData", "EnoughData"];
      var ret="["+readystates[video.readyState]+","+netstates[video.networkState];
      if (video.seeking) ret += ",Seeking";
      ret += ",bw="+video.bandwidth.toFixed(1)+"]";
      return ret;
    };

    var allStats = function() {
      var ready = [];
      var not_ready = [];
      var inactive = [];
      for (var activeVideoId in activeVideos) {
        var activeVideo = activeVideos[activeVideoId];
        updateVideoBandwidth(activeVideo);
        (activeVideo.ready ? ready : not_ready).push("video("+activeVideo.id+")"+videoStats(activeVideo));
      }
      for (var inactiveVideoId in inactiveVideos) {
        var inactiveVideo = inactiveVideos[inactiveVideoId];
        updateVideoBandwidth(inactiveVideo);
        inactive.push("video("+inactiveVideo.id+")"+videoStats(inactiveVideo));
      }
      var msg = "NOTREADY("+not_ready.length+") " + not_ready.join(" ");
      msg += " | READY("+ready.length+") " + ready.join(" ");
      msg += " | DELETED("+inactive.length+") " + inactive.join(" ");
      UTIL.log(msg);
    };

    var sync = function(errorThreshold) {
      //UTIL.log("sync");
      if (errorThreshold == undefined) {
        errorThreshold = DEFAULT_ERROR_THRESHOLD;
      }

      var t = _getCurrentTime();
      if (t < 0) {
        _pause();
        _seek(0);
        publishSyncEvent(0);
        return;
      } else if (duration > 0 && t > duration) {
        _pause();
        _seek(duration);
        publishSyncEvent(duration);
        return;
      }

      updateStallState();
      if (stalled) {
        return;
      }

      var ready_stats=[[],[],[],[],[]];
      var not_ready_stats=[[],[],[],[],[]];
      for (var videoId in activeVideos) {
        var video = activeVideos[videoId];
        //updateVideoBandwidth(video);
        var error = video.currentTime - leader - t;
        (video.ready ? ready_stats : not_ready_stats)[video.readyState].push(video.bandwidth.toFixed(1));
        if (video.readyState >= 1 && (Math.abs(error) > errorThreshold || emulatingPlaybackRate)) {  // HAVE_METADATA=1
          perfTimeCorrections.push(error);
          var rateTweak = 1 - error / syncIntervalTime;
          if (!advancing || emulatingPlaybackRate || rateTweak < .25 || rateTweak > 2) {
            perfTimeSeeks++;
            //UTIL.log("current time " + video.currentTime);
            //UTIL.log("leader " + leader);
            UTIL.log("video("+videoId+") time correction: seeking from " + (video.currentTime-leader) + " to " + t + " (error=" + error + ", state=" + video.readyState + ")");
            var desiredTime = leader + t + (advancing ? playbackRate * errorThreshold * .5 : 0);  // seek ahead slightly if advancing
            try {
              video.currentTime = desiredTime;
            } catch(e) {
              // log this, but otherwise don't worry about it since sync will try again later and take care of it
              UTIL.log("video(" + video.id + ") sync(): caught " + e.toString() + " setting currentTime to [" + desiredTime + "]");
            }
          } else {
            perfTimeTweaks++;
            UTIL.log("video("+videoId+") time correction: tweaking from " + (video.currentTime-leader) + " to " + t + " (error=" + error + ", rate=" + rateTweak + ", state=" + video.readyState + ")");
            // Speed or slow video so that we'll be even by the next sync interval
            video.playbackRate = playbackRate * rateTweak;
          }
        } else {
        if (video.playbackRate != playbackRate) video.playbackRate = playbackRate;
          //video.playbackRate = playbackRate;
          if (!video.ready && video.readyState >= 3) {
            _makeVideoVisible(video, "sync");
          }
        }
      }
      publishSyncEvent(t);
    };

    var publishSyncEvent = function(t) {
      var listeners = eventListeners['sync'];
      if (listeners) {
        var adjustedTime = (t >= duration) ? duration : t;
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](adjustedTime);
          } catch(e) {
            UTIL.error(e.name + " while publishing to videoset 'sync' event listener: " + e.message, e);
          }
        }
      }
    };

    //////////////////////////////////
    //
    // Constructor code
    //

    this.setStatusLoggingEnabled(false);
  };
})();
