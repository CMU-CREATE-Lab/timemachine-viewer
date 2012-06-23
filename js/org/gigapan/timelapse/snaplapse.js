// Class for managing a snaplapse.
//
// Dependencies:
// * org.gigapan.Util
// * org.gigapan.timelapse.Timelapse
// * Math.uuid (http://www.broofa.com/blog/?p=151)
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
  var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Snaplapse";
  alert(noUtilMsg);
  throw new Error(noUtilMsg);
}
if (!org.gigapan.timelapse.Timelapse) {
  var noVideosetMsg = "The org.gigapan.timelapse.Videoset library is required by org.gigapan.timelapse.Snaplapse";
  alert(noVideosetMsg);
  throw new Error(noVideosetMsg);
}
if (!Math.uuid) {
  var noMathUUID = "The Math.uuid library is required by org.gigapan.timelapse.Snaplapse";
  alert(noMathUUID);
  throw new Error(noMathUUID);
}

//
// CODE
//

(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.Snaplapse = function(composerDivId, timelapse) {

    var eventListeners = {};
    var keyframes = [];
    var keyframesById = {};
    var keyframeIntervals = [];
    var currentKeyframeInterval = null;
    var isCurrentlyPlaying = false;
    var warpStartingTime = null;
    var timeCounterIntervalHandle = null;
    var thisObj = this;
    var $composerDivObj = $("#"+composerDivId);

    this.getComposerDivId = function() {
    	return composerDivId;
    }

    timelapse.getVideoset().addEventListener('stall-status-change', function(isStalled) {
      if (isCurrentlyPlaying) {
        if (isStalled) {
          UTIL.log("videoset stall-status-change listener: pausing time warp time counter interval");
          pauseTimeCounterInterval();
        } else {
          UTIL.log("videoset stall-status-change listener: resuming time warp time counter interval");
          resumeTimeCounterInterval();
        }
      }
    });

    this.getAsJSON = function() {
      var snaplapseJSON = {};
      snaplapseJSON['snaplapse'] = {};
      snaplapseJSON['snaplapse']['keyframes'] = keyframes;
      return JSON.stringify(snaplapseJSON, null, 3);
    };

    this.getAsCaptionXML = function() {
      var intervals = buildKeyframeIntervals(0);

      var xmlPrefix = '<tt xmlns="http://www.w3.org/2006/10/ttaf1" xmlns:tts="http://www.w3.org/2006/04/ttaf1#styling">' + "\n" +
                      '  <head>' + "\n" +
                      '   <styling>' + "\n" +
                      '      <style id="normal" tts:fontSize="13" />' + "\n" +
                      '   </styling>' + "\n" +
                      '  </head>' + "\n" +
                      '  <body>' + "\n" +
                      '    <div>' + "\n";
      var xmlSuffix = '    </div>' + "\n" +
                      '  </body>' + "\n" +
                      '</tt>';

      var xml = xmlPrefix;
      var currentCaption = '';
      for (var i = 0; i < intervals.length; i++) {
        var startTime = UTIL.formatTime(intervals[i].getStartingRunningDurationInMillis() / 1000, true, true);
        var endTime = UTIL.formatTime(intervals[i].getEndingRunningDurationInMillis() / 1000, true, true);
        var startingFrame = intervals[i].getStartingFrame();

        if (startingFrame['is-description-visible']) {
          currentCaption = startingFrame['description'];
        }

        xml += '      <p begin="' + startTime + '" end="' + endTime + '" style="normal">' + currentCaption + '</p>' + "\n";
      }

      xml += xmlSuffix;
      UTIL.log("\n" + xml);
    };

    this.loadFromJSON = function(json) {
      try {
        var obj = JSON.parse(json);

        if (typeof obj['snaplapse'] != 'undefined' && typeof obj['snaplapse']['keyframes'] != 'undefined') {
          UTIL.log("Found [" + obj['snaplapse']['keyframes'].length + "] keyframes in the json:\n\n" + json);
          for (var i = 0; i < obj['snaplapse']['keyframes'].length; i++) {
            var keyframe = obj['snaplapse']['keyframes'][i];
            if (typeof keyframe['time'] != 'undefined' &&
                typeof keyframe['bounds'] != 'undefined' &&
                typeof keyframe['bounds']['xmin'] != 'undefined' &&
                typeof keyframe['bounds']['ymin'] != 'undefined' &&
                typeof keyframe['bounds']['xmax'] != 'undefined' &&
                typeof keyframe['bounds']['ymax'] != 'undefined') {
            // NOTE: if is-description-visible is undefined, then we define it as *true* in order to maintain
            // backward compatibility with older time warps which don't have this property.
            this.recordKeyframe(null,
                                keyframe['time'],
                                keyframe['bounds'],
                                keyframe['description'],
                                (typeof keyframe['is-description-visible'] == 'undefined') ? true : keyframe['is-description-visible'],
                                keyframe['duration'],
                                true);
            } else {
              UTIL.error("Ignoring invalid keyframe during snaplapse load.")
            }
          }
        } else {
          UTIL.error("ERROR: Invalid snaplapse file.");
          return false;
        }
      } catch(e) {
        UTIL.error("ERROR: Invalid snaplapse file.\n\n" + e.name + " while parsing snaplapse JSON: " + e.message, e);
        return false;
      }

      return true;
    };

    this.duplicateKeyframe = function(idOfSourceKeyframe) {
      var keyframeCopy = this.getKeyframeById(idOfSourceKeyframe);
      this.recordKeyframe(idOfSourceKeyframe,
                          keyframeCopy['time'],
                          keyframeCopy['bounds'],
                          keyframeCopy['description'],
                          keyframeCopy['is-description-visible'],
                          keyframeCopy['duration'],
                          false);
    };

    this.recordKeyframe = function(idOfKeyframeToAppendAfter, time, bounds, description, isDescriptionVisible, duration, isFromLoad) {
      if (typeof bounds == 'undefined') {
        bounds = timelapse.getBoundingBoxForCurrentView();
      }

      var isKeyframeFromLoad = (typeof isFromLoad == 'undefined') ? false : isFromLoad;

      // create the new keyframe
      var keyframeId = Math.uuid(20);
      var keyframe = {};
      keyframe['id'] = keyframeId;
      keyframe['time'] = org.gigapan.timelapse.Snaplapse.normalizeTime((typeof time == 'undefined') ? timelapse.getCurrentTime() : time);
      keyframe['bounds'] = {};
      keyframe['bounds'].xmin = bounds.xmin;
      keyframe['bounds'].ymin = bounds.ymin;
      keyframe['bounds'].xmax = bounds.xmax;
      keyframe['bounds'].ymax = bounds.ymax;
      keyframe['duration'] = sanitizeDuration(duration);
      keyframe['description'] = (typeof description == 'undefined') ? '' : description;
      keyframe['is-description-visible'] = (typeof isDescriptionVisible == 'undefined') ? false : isDescriptionVisible;

      // determine where the new keyframe will be inserted
      var insertionIndex = keyframes.length;
      if (typeof idOfKeyframeToAppendAfter != 'undefined' && idOfKeyframeToAppendAfter != null) {
        for (var j = 0; j < keyframes.length; j++) {
          if (idOfKeyframeToAppendAfter == keyframes[j]['id']) {
            insertionIndex = j + 1;
            break;
          }
        }
      }

      keyframes.splice(insertionIndex, 0, null);
      keyframes[insertionIndex] = keyframe;
      keyframesById[keyframeId] = keyframe;

      var eventType = isKeyframeFromLoad ? 'keyframe-loaded' : 'keyframe-added';
      var listeners = eventListeners[eventType];
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](cloneFrame(keyframe), insertionIndex);
          } catch(e) {
            UTIL.error(e.name + " while calling snaplapse '" + eventType + "' event listener: " + e.message, e);
          }
        }
      }
    };

		this.setTextAnnotationForKeyframe = function(keyframeId, description, isDescriptionVisible) {
      if (keyframeId && keyframesById[keyframeId]) {
        keyframesById[keyframeId]['description'] = description;
        keyframesById[keyframeId]['is-description-visible'] = isDescriptionVisible;
        return true;
      }
      return false;
    };

    var sanitizeDuration = function(rawDuration) {
      if (typeof rawDuration != 'undefined' && rawDuration != null) {
        var rawDurationStr = rawDuration + '';
        if (rawDurationStr.length > 0) {
          var num = parseFloat(rawDurationStr);
          if (!isNaN(num) && (num >= 0)) {
            return num.toFixed(1) - 0;
          }
        }
      }
      return null;
    };

    this.setDurationForKeyframe = function(keyframeId, duration) {
      if (keyframeId && keyframesById[keyframeId]) {
        keyframesById[keyframeId]['duration'] = sanitizeDuration(duration);
      }
    };

    this.updateTimeAndPositionForKeyframe = function(keyframeId) {
      if (keyframeId && keyframesById[keyframeId]) {
	      var bounds = timelapse.getBoundingBoxForCurrentView();
	      var keyframe = keyframesById[keyframeId];
	      keyframe['time'] = org.gigapan.timelapse.Snaplapse.normalizeTime(timelapse.getCurrentTime());
	      keyframe['bounds'] = {};
	      keyframe['bounds'].xmin = bounds.xmin;
	      keyframe['bounds'].ymin = bounds.ymin;
	      keyframe['bounds'].xmax = bounds.xmax;
	      keyframe['bounds'].ymax = bounds.ymax;

	      var listeners = eventListeners['keyframe-modified'];
	      if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            try {
              listeners[i](cloneFrame(keyframe));
            } catch(e) {
              UTIL.error(e.name + " while calling snaplapse 'keyframe-modified' event listener: " + e.message, e);
            }
          }
        }
      }
    };

    this.deleteKeyframeById = function(keyframeId) {
      if (keyframeId && keyframesById[keyframeId]) {
        var indexToDelete = -1;
        for (var i = 0; i < keyframes.length; i++) {
          if (keyframeId == keyframes[i]['id']) {
            indexToDelete = i;
          }
        }
        keyframes.splice(indexToDelete, 1);
        delete keyframesById[keyframeId];
        return true;
      }
      return false;
    };

   this.getKeyframes = function() {
      var keyframesClone = [];
      for (var i = 0; i < keyframes.length; i++) {
        keyframesClone[i] = cloneFrame(keyframes[i]);
      }
      return keyframesClone;
    };

    var buildKeyframeIntervals = function(startingKeyframeIndex) {
      UTIL.log("buildKeyframeIntervals()");
      var intervals = [];
      for (var k = startingKeyframeIndex + 1; k < keyframes.length; k++) {
        var previousKeyframeInterval = (intervals.length > 0) ? intervals[intervals.length - 1] : null;
        var keyframeInterval = new org.gigapan.timelapse.KeyframeInterval(keyframes[k - 1], keyframes[k], previousKeyframeInterval);
        intervals[intervals.length] = keyframeInterval;
        UTIL.log("   buildKeyframeIntervals(): created keyframe interval (" + (intervals.length - 1) + "): between time [" + keyframes[k - 1]['time'] + "] and [" + keyframes[k]['time'] + "]: " + keyframeInterval);
      }
      return intervals;
    };

    this.play = function(startingKeyframeId) {
      UTIL.log("play(): playing time warp!");
      if (keyframes.length > 1) {
        if (!isCurrentlyPlaying) {
          isCurrentlyPlaying = true;

          // find the starting keyframe
          var startingKeyframeIndex = 0;
          for (var j = 0; j < keyframes.length; j++) {
            if (keyframes[j]['id'] == startingKeyframeId) {
              startingKeyframeIndex = j;
              break;
            }
          }

         // compute the keyframe intervals
         keyframeIntervals = buildKeyframeIntervals(startingKeyframeIndex);

         // make sure playback is stopped
         timelapse.pause();

         // jump to the proper time
         timelapse.seek(keyframeIntervals[0].getStartingTime());

         // initialize the current keyframe interval
         warpStartingTime = new Date().getTime();
         setCurrentKeyframeInterval(keyframeIntervals[0]);

         // start playback
         UTIL.log("play(): starting time warp playback");
         timelapse.play();

         // Set an interval which calls the timeCounterHandler.  This is much more reliable than adding
         // a listener to the timelapse because the video element doesn't actually fire time change events
         // for every time change.
         startTimeCounterInterval();

         var listeners = eventListeners['play'];
         if (listeners) {
           for (var i = 0; i < listeners.length; i++) {
             try {
               listeners[i]();
             } catch(e) {
               UTIL.error(e.name + " while calling snaplapse 'play' event listener: " + e.message, e);
             }
           }
         }
       }
     }
   };

    var _stop = function(willJumpToLastKeyframe) {
      if (isCurrentlyPlaying) {
        isCurrentlyPlaying = false;

        // stop playback
        timelapse.pause();

        // clear the time counter interval
        stopTimeCounterInterval();

        if (typeof willJumpToLastKeyframe != 'undefined' && willJumpToLastKeyframe) {
          timelapse.seek(keyframes[keyframes.length - 1]['time']);
          timelapse.warpToBoundingBox(keyframes[keyframes.length - 1]['bounds']);
        }

        var listeners = eventListeners['stop'];
        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            try {
              listeners[i]();
            } catch(e) {
              UTIL.error(e.name + " while calling snaplapse 'stop' event listener: " + e.message, e);
            }
          }
        }
      }
    };

    this.stop = _stop;

    this.getKeyframeById = function(keyframeId) {
      if (keyframeId) {
        var keyframe = keyframesById[keyframeId];
        if (keyframe) {
          return cloneFrame(keyframe);
        }
      }
      return null;
    };

    this.getNumKeyframes = function() {
      return keyframes.length;
    };

    this.isPlaying = function() {
      return isCurrentlyPlaying;
    };

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

    this.getSnaplapseViewer = function() { return viewer;};

    var cloneFrame = function(frame) {
      var frameCopy = null;
      if (frame) {
        frameCopy = {};
        frameCopy['id'] = frame['id'];
        frameCopy['time'] = frame['time'];
        frameCopy['duration'] = frame['duration'];
        frameCopy['description'] = frame['description'];
        frameCopy['is-description-visible'] = frame['is-description-visible'];
        frameCopy['bounds'] = {};
        frameCopy['bounds'].xmin = frame['bounds'].xmin;
        frameCopy['bounds'].ymin = frame['bounds'].ymin;
        frameCopy['bounds'].xmax = frame['bounds'].xmax;
        frameCopy['bounds'].ymax = frame['bounds'].ymax;
      }

      return frameCopy;
    };

    var setCurrentKeyframeInterval = function(newKeyframeInterval) {
      UTIL.log("setCurrentKeyframeInterval(" + newKeyframeInterval + ")");

      currentKeyframeInterval = newKeyframeInterval;

      if (currentKeyframeInterval != null) {
        var rate = currentKeyframeInterval.getPlaybackRate();
        timelapse.setPlaybackRate(rate);

        if (rate < -0.55) rate = -1;
        else if (rate < 0.0) rate = -.5;
        else if (rate < 0.55) rate = .5;
        else rate = 1;

	var speedChoice;
        var timelapseViewerDivId = timelapse.getViewerDivId();
	$("#"+timelapseViewerDivId+" .playbackSpeedChoices li a").each(function() {
	  speedChoice = $(this);
	  if ((speedChoice.attr("data-speed")-0) == rate) return false;
	});
	$("#"+timelapseViewerDivId+" .playbackSpeedChoices li a").removeClass("current");
	speedChoice.addClass("current");
	$("#"+timelapseViewerDivId+" .playbackSpeedText").text(speedChoice.text());

        var keyframeStartingTime = currentKeyframeInterval.getStartingTime();
        timelapse.seek(keyframeStartingTime);              // make sure we're on track
        updateWarpStartingTime(keyframeStartingTime);      // update the warp starting time since we just corrected with a seek
      }

      // notify listeners
      var listeners = eventListeners['keyframe-interval-change'];
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](cloneFrame(currentKeyframeInterval ? currentKeyframeInterval.getStartingFrame() : keyframes[keyframes.length - 1]));
          } catch(e) {
            UTIL.error(e.name + " while calling snaplapse 'keyframe-interval-change' event listener: " + e.message, e);
          }
        }
      }
    };

    var startTimeCounterInterval = function() {
      // record starting timestamp
      warpStartingTime = new Date().getTime();

      createTimeCounterInterval();
    };

    var stopTimeCounterInterval = function() {
      clearInterval(timeCounterIntervalHandle);
    };

    var resumeTimeCounterInterval = function() {
      // update the starting timestamp since we're resuming from a stall
      updateWarpStartingTime(timelapse.getCurrentTime());
      createTimeCounterInterval();
    };

    var pauseTimeCounterInterval = function() {
      stopTimeCounterInterval();
    };

    var createTimeCounterInterval = function() {
      timeCounterIntervalHandle = setInterval(function() {
        timeCounterHandler();
      }, 20);
    };

    var updateWarpStartingTime = function(videoTime) {
      if (currentKeyframeInterval.getActualDuration() > 0) {
        var elapsedVideoTimePercentage = Math.abs(videoTime - currentKeyframeInterval.getStartingTime()) / currentKeyframeInterval.getActualDuration();
        var oldWarpStartingTime = warpStartingTime;
        warpStartingTime = new Date().getTime() - (currentKeyframeInterval.getDesiredDurationInMillis() * elapsedVideoTimePercentage + currentKeyframeInterval.getStartingRunningDurationInMillis());
        UTIL.log("updateWarpStartingTime(): adjusted warp starting time by [" + (warpStartingTime - oldWarpStartingTime) + "] millis (videoTime=" + videoTime + ")");
      }
    };

    var timeCounterHandler = function() {
      // compute how much time (in millis) has already elapsed
      var elapsedTimeInMillis = new Date().getTime() - warpStartingTime;

      //UTIL.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> timeCounterHandler(" + elapsedTimeInMillis + ")");

      // update the current keyframe interval based on the elapsed time
      var foundMatchingInterval = false;
      do {
        var containsElapsedTime = currentKeyframeInterval.containsElapsedTime(elapsedTimeInMillis);
        if (containsElapsedTime) {
          foundMatchingInterval = true;
        } else {
          setCurrentKeyframeInterval(currentKeyframeInterval.getNextKeyframeInterval());
        }
      } while (!foundMatchingInterval && currentKeyframeInterval != null);

      if (currentKeyframeInterval) {
        // compute the frame for the current time
        var frameBounds = currentKeyframeInterval.computeFrameBoundsForElapsedTime(elapsedTimeInMillis);
        if (frameBounds) {
          // warp to the correct view
          timelapse.warpToBoundingBox(frameBounds);
        } else {
          UTIL.error("Failed to compute time warp frame for time [" + elapsedTimeInMillis + "]");
          _stop(true);
        }
      } else {
        UTIL.error("Failed to compute current keyframe interval for time [" + elapsedTimeInMillis + "]");
        _stop(true);
      }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    var viewer;

    org.gigapan.Util.ajax("html","time_warp_composer.html",function(html){
      $composerDivObj.html(html);
      viewer = org.gigapan.timelapse.snaplapse.SnaplapseViewer(thisObj,timelapse);
    });

    /*$composerDivObj.load('time_warp_composer.html', function(response, status, xhr) {
      if (status == "error") {
        org.gigapan.Util.error("Error loading time warp composer controls.");
        return;
      }
      viewer = org.gigapan.timelapse.snaplapse.SnaplapseViewer(thisObj,timelapse);
    });*/

  };

  org.gigapan.timelapse.Snaplapse.normalizeTime = function(t) {
    return parseFloat(t.toFixed(6));
  };

  org.gigapan.timelapse.KeyframeInterval = function(startingFrame, endingFrame, previousKeyframeInterval) {
    var nextKeyframeInterval = null;
    var timeDirection = (startingFrame['time'] <= endingFrame['time']) ? 1 : -1;
    var actualDuration = parseFloat(Math.abs(endingFrame['time'] - startingFrame['time']).toFixed(6));
    var desiredDuration = startingFrame['duration'] == null ? actualDuration : startingFrame['duration'];
    var desiredDurationInMillis = desiredDuration * 1000;
    var startingRunningDurationInMillis = 0;
    var endingRunningDurationInMillis = desiredDurationInMillis;
    if (previousKeyframeInterval != null) {
      previousKeyframeInterval.setNextKeyframeInterval(this);
      var previousRunningDurationInMillis = previousKeyframeInterval.getEndingRunningDurationInMillis();
      endingRunningDurationInMillis += previousRunningDurationInMillis;
      startingRunningDurationInMillis = previousRunningDurationInMillis
    }

    var playbackRate = null;
    if (desiredDuration == 0 || actualDuration == 0) {
      playbackRate = 0;
    } else {
      playbackRate = timeDirection * actualDuration / desiredDuration;
    }

    this.getStartingFrame = function() {
      return startingFrame;
    };

    this.getStartingTime = function() {
      return startingFrame['time'];
    };

    this.getEndingTime = function() {
      return endingFrame['time'];
    };

    this.getActualDuration = function() {
      return actualDuration;
    };

    this.getDesiredDurationInMillis = function() {
      return desiredDurationInMillis;
    };

    this.getNextKeyframeInterval = function() {
      return nextKeyframeInterval;
    };

    this.setNextKeyframeInterval = function(theNextKeyframeInterval) {
      nextKeyframeInterval = theNextKeyframeInterval;
    };

    this.getPlaybackRate = function() {
      return playbackRate;
    };

    this.getStartingRunningDurationInMillis = function() {
      return startingRunningDurationInMillis;
    };

    this.getEndingRunningDurationInMillis = function() {
      return endingRunningDurationInMillis;
    };

    this.containsElapsedTime = function(millis) {
      return startingRunningDurationInMillis <= millis && millis <= endingRunningDurationInMillis;
    };

    this.computeFrameBoundsForElapsedTime = function(elapsedMillis) {
      if (this.containsElapsedTime(elapsedMillis)) {

        var timeRatio = (elapsedMillis - startingRunningDurationInMillis) / desiredDurationInMillis;

        var s0 = startingFrame['bounds'].xmax - startingFrame['bounds'].xmin;
        var s1 = endingFrame['bounds'].xmax - endingFrame['bounds'].xmin;
        var s1_over_s0 = s1 / s0;

        // Compute f(t), but check whether we're merely panning, in which case we shouldn't attempt to do the
        // special scaling (because it'll blow up with f(1) being NaN since we'd be dividing by zero by zero).
        var f_of_t = (s1_over_s0 == 1) ? timeRatio : (Math.pow(s1_over_s0, timeRatio) - 1) / (s1_over_s0 - 1);

        var boundsXminOffset = (endingFrame['bounds'].xmin - startingFrame['bounds'].xmin ) * f_of_t;
        var boundsYminOffset = (endingFrame['bounds'].ymin - startingFrame['bounds'].ymin ) * f_of_t;
        var boundsXmaxOffset = (endingFrame['bounds'].xmax - startingFrame['bounds'].xmax ) * f_of_t;
        var boundsYmaxOffset = (endingFrame['bounds'].ymax - startingFrame['bounds'].ymax ) * f_of_t;

        var bounds = {};
        bounds.xmin = startingFrame['bounds'].xmin + boundsXminOffset;
        bounds.ymin = startingFrame['bounds'].ymin + boundsYminOffset;
        bounds.xmax = startingFrame['bounds'].xmax + boundsXmaxOffset;
        bounds.ymax = startingFrame['bounds'].ymax + boundsYmaxOffset;

        return bounds;
      }

      return null;
    };

    this.toString = function() {
      return 'KeyframeInterval' +
             '[startTime=' + startingFrame['time'] +
             ',endTime=' + endingFrame['time'] +
             ',actualDuration=' + actualDuration +
             ',desiredDuration=' + desiredDuration +
             ',playbackRate=' + playbackRate +
             ',timeDirection=' + timeDirection +
             ',startingRunningDurationInMillis=' + startingRunningDurationInMillis +
             ',endingRunningDurationInMillis=' + endingRunningDurationInMillis +
             ']';
    };

  };
})();