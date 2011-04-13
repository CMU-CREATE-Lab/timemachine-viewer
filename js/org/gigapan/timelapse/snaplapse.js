//======================================================================================================================
// Class for managing a snaplapse.
//
// Dependencies:
// * org.gigapan.Util
// * org.gigapan.timelapse.Timelapse
// * Math.uuid (http://www.broofa.com/blog/?p=151)
//
// Authors:
// * Randy Sarget (randy.sargent@gmail.com)
// * Paul Dille (pdille@andrew.cmu.edu)
// * Chris Bartley (bartley@cmu.edu)
//======================================================================================================================

//======================================================================================================================
// VERIFY NAMESPACE
//======================================================================================================================
// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
if (!org)
   {
   org = {};
   }
else
   {
   if (typeof org != "object")
      {
      var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
      alert(orgExistsMessage);
      throw new Error(orgExistsMessage);
      }
   }

// Repeat the creation and type-checking for the next level
if (!org.gigapan)
   {
   org.gigapan = {};
   }
else
   {
   if (typeof org.gigapan != "object")
      {
      var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
      alert(orgGigapanExistsMessage);
      throw new Error(orgGigapanExistsMessage);
      }
   }

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse)
   {
   org.gigapan.timelapse = {};
   }
else
   {
   if (typeof org.gigapan.timelapse != "object")
      {
      var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
      alert(orgGigapanTimelapseExistsMessage);
      throw new Error(orgGigapanTimelapseExistsMessage);
      }
   }
//======================================================================================================================

//======================================================================================================================
// DEPENDECIES
//======================================================================================================================
if (!org.gigapan.Util)
   {
   var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Snaplapse";
   alert(noUtilMsg);
   throw new Error(noUtilMsg);
   }
if (!org.gigapan.timelapse.Timelapse)
   {
   var noVideosetMsg = "The org.gigapan.timelapse.Videoset library is required by org.gigapan.timelapse.Snaplapse";
   alert(noVideosetMsg);
   throw new Error(noVideosetMsg);
   }
if (!Math.uuid)
   {
   var noMathUUID = "The Math.uuid library is required by org.gigapan.timelapse.Snaplapse";
   alert(noMathUUID);
   throw new Error(noMathUUID);
   }
//======================================================================================================================

//======================================================================================================================
// CODE
//======================================================================================================================

(function()
   {
   var UTIL = org.gigapan.Util;

   org.gigapan.timelapse.Snaplapse = function(timelapse)
      {
      var keyframes = [];
      var keyframesById = {};
      var keyframeIntervals = [];
      var currentKeyframeIntervalIndex = -1;
      var isCurrentlyPlaying = false;
      var eventListeners = {};
      var timeChangeListenerIntervalHandle = null;
      var warpDuringPlaybackFreezeIntervalHandle = null;
      var isInIntervalTransitionMode = false;

      this.getAsJSON = function()
         {
         var snaplapseJSON = {};
         snaplapseJSON['snaplapse'] = {};
         snaplapseJSON['snaplapse']['keyframes'] = keyframes;
         return JSON.stringify(snaplapseJSON, null, 3);
         };

      this.loadFromJSON = function(json)
         {
         try
            {
            var obj = JSON.parse(json);

            if (typeof obj['snaplapse'] != 'undefined' &&
                typeof obj['snaplapse']['keyframes'] != 'undefined')
               {
               UTIL.log("Found [" + obj['snaplapse']['keyframes'].length + "] keyframes in the json:\n\n" + json);
               for (var i = 0; i < obj['snaplapse']['keyframes'].length; i++)
                  {
                  var keyframe = obj['snaplapse']['keyframes'][i];
                  if (typeof keyframe['time'] != 'undefined' &&
                      typeof keyframe['bounds'] != 'undefined' &&
                      typeof keyframe['bounds']['xmin'] != 'undefined' &&
                      typeof keyframe['bounds']['ymin'] != 'undefined' &&
                      typeof keyframe['bounds']['xmax'] != 'undefined' &&
                      typeof keyframe['bounds']['ymax'] != 'undefined')
                     {
                     this.recordKeyframe(null,
                                         keyframe['time'],
                                         keyframe['bounds'],
                                         keyframe['description'],
                                         keyframe['duration']);
                     }
                  else
                     {
                     UTIL.error("Ignoring invalid keyframe during snaplapse load.")
                     }
                  }
               }
            else
               {
               UTIL.error("ERROR: Invalid snaplapse file.");
               return false;
               }
            }
         catch(e)
            {
            UTIL.error("ERROR: Invalid snaplapse file.\n\n" + e.name + " while parsing snaplapse JSON: " + e.message, e);
            return false;
            }

         return true;
         };

      this.recordKeyframe = function(idOfKeyframeToAppendAfter, time, bounds, description, duration)
         {
         if (typeof bounds == 'undefined')
            {
            bounds = timelapse.getBoundingBoxForCurrentView();
            }

         // create the new keyframe
         var keyframeId = Math.uuid(20);
         var keyframe = {};
         keyframe['id'] = keyframeId;
         keyframe['time'] = normalizeTime((typeof time == 'undefined') ? timelapse.getCurrentTime() : time);
         keyframe['bounds'] = {};
         keyframe['bounds'].xmin = bounds.xmin;
         keyframe['bounds'].ymin = bounds.ymin;
         keyframe['bounds'].xmax = bounds.xmax;
         keyframe['bounds'].ymax = bounds.ymax;
         keyframe['duration'] = this.sanitizeDuration(duration);
         keyframe['description'] = (typeof description == 'undefined') ? '' : description;

         // determine where the new keyframe will be inserted
         var insertionIndex = keyframes.length;
         if (typeof idOfKeyframeToAppendAfter != 'undefined' && idOfKeyframeToAppendAfter != null)
            {
            for (var j = 0; j < keyframes.length; j++)
               {
               if (idOfKeyframeToAppendAfter == keyframes[j]['id'])
                  {
                  insertionIndex = j + 1;
                  UTIL.log("found matching id at j = " + j);
                  break;
                  }
               }
            }

         // If there's already at least one keyframe defined, make sure that, if this new one has the same time as the
         // one immediately before it, that the one before it doesn't have a duration of zero.
         if (keyframes.length > 0)
            {
            var previousKeyframe = keyframes[insertionIndex - 1];
            if (previousKeyframe['time'] == keyframe['time'])
               {
               if (previousKeyframe['duration'] == null || previousKeyframe['duration'] == 0)
                  {
                  return false;
                  }
               }
            }

         keyframes.splice(insertionIndex, 0, null);
         keyframes[insertionIndex] = keyframe;
         keyframesById[keyframeId] = keyframe;

         var listeners = eventListeners['keyframe-added'];
         if (listeners)
            {
            for (var i = 0; i < listeners.length; i++)
               {
               try
                  {
                  listeners[i](cloneFrame(keyframe), insertionIndex);
                  }
               catch(e)
                  {
                  UTIL.error(e.name + " while calling snaplapse 'keyframe-added' event listener: " + e.message, e);
                  }
               }
            }

         return true;
         };

      this.setTextAnnotationForKeyframe = function(keyframeId, description)
         {
         if (keyframeId && keyframesById[keyframeId])
            {
            keyframesById[keyframeId]['description'] = description;
            return true;
            }
         return false;
         };

      this.sanitizeDuration = function(rawDuration)
         {
         if (typeof rawDuration != 'undefined' && rawDuration != null)
            {
            var rawDurationStr = rawDuration + '';
            if (rawDurationStr.length > 0)
               {
               var num = parseFloat(rawDurationStr);

               if (!isNaN(num) && (num >= 0))
                  {
                  return num.toFixed(1) - 0;
                  }
               }
            }
         return null;
         };

      this.setDurationForKeyframe = function(keyframeId, duration)
         {
         if (keyframeId && keyframesById[keyframeId])
            {
            keyframesById[keyframeId]['duration'] = this.sanitizeDuration(duration);
            return true;
            }
         return false;
         };

      this.deleteKeyframeById = function(keyframeId)
         {
         if (keyframeId && keyframesById[keyframeId])
            {
            var indexToDelete = -1;
            for (var i = 0; i < keyframes.length; i++)
               {
               if (keyframeId == keyframes[i]['id'])
                  {
                  indexToDelete = i;
                  }
               }
            keyframes.splice(indexToDelete, 1);
            delete keyframesById[keyframeId];
            return true;
            }
         return false;
         };

      this.getKeyframes = function()
         {
         var keyframesClone = [];
         for (var i = 0; i < keyframes.length; i++)
            {
            keyframesClone[i] = cloneFrame(keyframes[i]);
            }
         return keyframesClone;
         };

      function startIntervalForTimeChangeListener()
         {
         timeChangeListenerIntervalHandle = setInterval(function()
                                                           {
                                                           timeChangeListener(timelapse.getCurrentTime());
                                                           }, 20);
         }

      function stopIntervalForTimeChangeListener()
         {
         clearInterval(timeChangeListenerIntervalHandle);
         }

      function stopIntervalForPlaybackFreeze()
         {
         clearInterval(warpDuringPlaybackFreezeIntervalHandle);
         }

      this.play = function()
         {
         UTIL.log("################################################### Snaplapse play!");

         if (keyframes.length > 1)
            {
            if (!isCurrentlyPlaying)
               {
               isCurrentlyPlaying = true;

               // compute the keyframe intervals
               keyframeIntervals = [];
               for (var k = 1; k < keyframes.length; k++)
                  {
                  // TODO:  Add validation here of time and duration!
                  var newFrameInterval = new org.gigapan.timelapse.FrameInterval(keyframes[k - 1], keyframes[k]);
                  keyframeIntervals[keyframeIntervals.length] = newFrameInterval;
                  UTIL.log("##### Created keyframe interval (" + (keyframeIntervals.length - 1) + "): between time [" + keyframes[k - 1]['time'] + "] and [" + keyframes[k]['time'] + "]: " + newFrameInterval);
                  }

               // set the current keyframe interval index
               currentKeyframeIntervalIndex = -1;

               // we're not in interval transition mode
               isInIntervalTransitionMode = false;

               // make sure playback is stopped
               timelapse.pause();

               // jump to the proper time
               timelapse.seek(keyframes[0]['time']);

               // set playback rate
               setTimelapsePlaybackRate(keyframeIntervals[0].getPlaybackRate());

               // Set an interval which calls the timeChangeListener.  This is much more reliable than adding
               // a listener to the timelapse because the video element doesn't actually fire time change events
               // for every time change.
               startIntervalForTimeChangeListener();

               // start playback
               UTIL.log("STARTING TIME WARP PLAYBACK!!!!!!!!!!!!!!!!!!!");
               timelapse.play();

               var listeners = eventListeners['play'];
               if (listeners)
                  {
                  for (var i = 0; i < listeners.length; i++)
                     {
                     try
                        {
                        listeners[i]();
                        }
                     catch(e)
                        {
                        UTIL.error(e.name + " while calling snaplapse 'play' event listener: " + e.message, e);
                        }
                     }
                  }
               }
            }
         };

      var setTimelapsePlaybackRate = function(playbackRate)
         {
         timelapse.setPlaybackRate(playbackRate);
         };

      var _stop = function()
         {
         if (isCurrentlyPlaying)
            {
            isCurrentlyPlaying = false;

            // stop playback
            timelapse.pause();

            // clear the time change interval
            stopIntervalForTimeChangeListener();
            stopIntervalForPlaybackFreeze();

            var listeners = eventListeners['stop'];
            if (listeners)
               {
               for (var i = 0; i < listeners.length; i++)
                  {
                  try
                     {
                     listeners[i]();
                     }
                  catch(e)
                     {
                     UTIL.error(e.name + " while calling snaplapse 'stop' event listener: " + e.message, e);
                     }
                  }
               }
            }
         };
      this.stop = _stop;

      this.getKeyframeById = function(keyframeId)
         {
         if (keyframeId)
            {
            var keyframe = keyframesById[keyframeId];
            if (keyframe)
               {
               return cloneFrame(keyframe);
               }
            }
         return null;
         };

      this.getNumKeyframes = function()
         {
         return keyframes.length;
         };

      this.isPlaying = function()
         {
         return isCurrentlyPlaying;
         };

      this.addEventListener = function(eventName, listener)
         {
         if (eventName && listener && typeof(listener) == "function")
            {
            if (!eventListeners[eventName])
               {
               eventListeners[eventName] = [];
               }

            eventListeners[eventName].push(listener);
            }
         };

      this.removeEventListener = function(eventName, listener)
         {
         if (eventName && eventListeners[eventName] && listener && typeof(listener) == "function")
            {
            for (var i = 0; i < eventListeners[eventName].length; i++)
               {
               if (listener == eventListeners[eventName][i])
                  {
                  eventListeners[eventName].splice(i, 1);
                  return;
                  }
               }
            }
         };

      var cloneFrame = function(frame)
         {
         var frameCopy = null;
         if (frame)
            {
            frameCopy = {};
            frameCopy['id'] = frame['id'];
            frameCopy['time'] = frame['time'];
            frameCopy['duration'] = frame['duration'];
            frameCopy['description'] = frame['description'];
            frameCopy['bounds'] = {};
            frameCopy['bounds'].xmin = frame['bounds'].xmin;
            frameCopy['bounds'].ymin = frame['bounds'].ymin;
            frameCopy['bounds'].xmax = frame['bounds'].xmax;
            frameCopy['bounds'].ymax = frame['bounds'].ymax;
            }

         return frameCopy;
         };

      var normalizeTime = function(t)
         {
         return parseFloat(t.toFixed(3));
         };

      var handlePlaybackFreeze = function()
         {
         UTIL.log("-------------- 13)");
         stopIntervalForTimeChangeListener();

         var keyframeInterval = (0 <= currentKeyframeIntervalIndex) ? keyframeIntervals[currentKeyframeIntervalIndex] : null;

         var startingTime = new Date().getTime();
         var desiredDurationInMillis = keyframeInterval.getDesiredDuration() * 1000;
         var endingTime = startingTime + desiredDurationInMillis;

         UTIL.log("-------------- 13b) startingTime=[" + startingTime + "]  endingTime=[" + endingTime + "]");

         var warpDuringPlaybackFreeze = function()
            {
            var currentTime = new Date().getTime();
            UTIL.log("-------------- 14) " + currentTime);
            if (currentTime > endingTime)
               {
               UTIL.log("-------------- 15) " + currentTime);
               stopIntervalForPlaybackFreeze();
               currentKeyframeIntervalIndex++;
               isInIntervalTransitionMode = false;

               keyframeInterval = (0 <= currentKeyframeIntervalIndex) ? keyframeIntervals[currentKeyframeIntervalIndex] : null;

               if (keyframeInterval != null)
                  {
                  // set the proper playback rate and time position
                  setTimelapsePlaybackRate(keyframeInterval.getPlaybackRate());
                  var normalizedTime = keyframeInterval.getStartingTime();
                  timelapse.seek(normalizedTime);

                  startIntervalForTimeChangeListener();
                  }
               else
                  {
                  _stop();
                  }
               notifyKeyframeIntervalChangeListeners(keyframeInterval);
               }
            else
               {
               UTIL.log("-------------- 16) " + currentTime);
               var timePercentage = (currentTime - startingTime) / desiredDurationInMillis;
               var frameBounds = keyframeInterval.computeFrameBoundsAtTimePercentage(timePercentage);
               if (frameBounds)
                  {
                  UTIL.log("-------------- 17)");
                  // warp to the correct view
                  timelapse.warpToBoundingBox(frameBounds);
                  }
               else
                  {
                  UTIL.error("Failed to compute frame bounds for time percentage [" + timePercentage + "]");
                  _stop();
                  }
               }
            };

         warpDuringPlaybackFreezeIntervalHandle = setInterval(warpDuringPlaybackFreeze, 20);
         };

      var notifyKeyframeIntervalChangeListeners = function(keyframeInterval)
         {
         var listeners = eventListeners['keyframe-interval-change'];
         if (listeners)
            {
            for (var i = 0; i < listeners.length; i++)
               {
               try
                  {
                  listeners[i](currentKeyframeIntervalIndex, cloneFrame(keyframeInterval ? keyframeInterval.getStartingFrame() : keyframes[keyframes.length - 1]));
                  }
               catch(e)
                  {
                  UTIL.error(e.name + " while calling snaplapse 'keyframe-interval-change' event listener: " + e.message, e);
                  }
               }
            }
         };

      var timeChangeListener = function(t)
         {
         UTIL.log("-------------- 1) timeChangeListener(" + t + ")");
         var normalizedTime = normalizeTime(t);

         // get the current keyframe interval
         var keyframeInterval = (0 <= currentKeyframeIntervalIndex) ? keyframeIntervals[currentKeyframeIntervalIndex] : null;

         UTIL.log("-------------- 2) keyframeInterval: " + keyframeInterval);

         // Make sure the time is in the interval.  If it isn't then just assume we've crossed to the next
         // interval. In that case, update things accordingly
         if (keyframeInterval != null && keyframeInterval.isTimeWithinInterval(normalizedTime))
            {
            UTIL.log("-------------- 3) isTimeWithinInterval=[" + keyframeInterval.isTimeWithinInterval(normalizedTime) + "] keyframeInterval=[" + keyframeInterval + "]");
            if (isInIntervalTransitionMode)
               {
               UTIL.log("-------------- 4)");
               // break out of interval transition mode since the time is within the interval now
               isInIntervalTransitionMode = false;
               }
            }
         else
            {
            UTIL.log("-------------- 5)");

            if (isInIntervalTransitionMode)
               {
               UTIL.log("-------------- 6)");
               // set the proper playback rate and time position
               setTimelapsePlaybackRate(keyframeInterval.getPlaybackRate());
               normalizedTime = keyframeInterval.getStartingTime();
               timelapse.seek(normalizedTime);
               }
            else
               {
               UTIL.log("-------------- 7)");

               currentKeyframeIntervalIndex++;
               UTIL.log("#################################################### currentKeyframeIntervalIndex = " + currentKeyframeIntervalIndex);
               if (currentKeyframeIntervalIndex < keyframeIntervals.length)
                  {
                  UTIL.log("-------------- 8)");
                  isInIntervalTransitionMode = true;

                  keyframeInterval = keyframeIntervals[currentKeyframeIntervalIndex];

                  // set the proper playback rate and time position
                  setTimelapsePlaybackRate(keyframeInterval.getPlaybackRate());
                  normalizedTime = keyframeInterval.getStartingTime();
                  timelapse.seek(normalizedTime);
                  }
               else
                  {
                  UTIL.log("-------------- 9)");
                  keyframeInterval = null;
                  }

               // notify listeners of keyframe interval change
               notifyKeyframeIntervalChangeListeners(keyframeInterval);
               }
            }

         if (keyframeInterval)
            {
            // check whether we're supposed to pause at this interval for duration seconds
            if (keyframeInterval.getTotalTime() == 0)
               {
               UTIL.log("-------------- 11)");
               handlePlaybackFreeze();
               }
            else
               {
               // compute the frame for the current (normalized) time
               var timePercentage = keyframeInterval.computeTimePercentage(normalizedTime);
               if (timePercentage != null)
                  {
                  var frameBounds = keyframeInterval.computeFrameBoundsAtTimePercentage(timePercentage);
                  if (frameBounds)
                     {
                     UTIL.log("-------------- 10)");
                     // warp to the correct view
                     timelapse.warpToBoundingBox(frameBounds);
                     }
                  else
                     {
                     UTIL.error("Failed to compute snaplapse frame for time [" + t + "|" + normalizedTime + "]");
                     _stop();
                     }
                  }
               else
                  {
                  UTIL.error("Failed to compute time percentage for time [" + t + "|" + normalizedTime + "]");
                  _stop();
                  }
               }
            }
         else
            {
            UTIL.error("Failed to compute current keyframe interval for time [" + t + "|" + normalizedTime + "]");
            _stop();
            }
         };
      };

   org.gigapan.timelapse.FrameInterval = function(startingFrame, endingFrame)
      {
      var timeDirection = (endingFrame['time'] > startingFrame['time']) ? 1 : -1;
      var totalTime = Math.abs(endingFrame['time'] - startingFrame['time']);
      var desiredDuration = startingFrame['duration'] == null ? totalTime : startingFrame['duration'];

      var playbackRate = null;
      if (desiredDuration == 0 || totalTime == 0)
         {
         playbackRate = 0;
         }
      else
         {
         playbackRate = timeDirection * totalTime / desiredDuration;
         }

      this.getStartingFrame = function()
         {
         return startingFrame;
         };

      this.getEndingFrame = function()
         {
         return endingFrame;
         };

      this.getStartingTime = function()
         {
         return startingFrame['time'];
         };

      this.getEndingTime = function()
         {
         return endingFrame['time'];
         };

      this.getTimeDirection = function()
         {
         return timeDirection;
         };

      this.getPlaybackRate = function()
         {
         return playbackRate;
         };

      this.getTotalTime = function()
         {
         return totalTime;
         };

      this.getDesiredDuration = function()
         {
         return desiredDuration;
         };

      this.isTimeWithinInterval = function(t)
         {
         if (timeDirection > 0)
            {
            return this.getStartingTime() <= t && t <= this.getEndingTime();
            }
         return this.getEndingTime() <= t && t <= this.getStartingTime();
         };

      this.computeTimePercentage = function(t)
         {
         if (this.isTimeWithinInterval(t))
            {
            return Math.abs(t - this.getStartingTime()) / totalTime;
            }

         return null;
         };

      this.computeFrameBoundsAtTimePercentage = function(timePercentage)
         {
         var boundsXminOffset = (endingFrame['bounds'].xmin - startingFrame['bounds'].xmin ) * timePercentage;
         var boundsYminOffset = (endingFrame['bounds'].ymin - startingFrame['bounds'].ymin ) * timePercentage;
         var boundsXmaxOffset = (endingFrame['bounds'].xmax - startingFrame['bounds'].xmax ) * timePercentage;
         var boundsYmaxOffset = (endingFrame['bounds'].ymax - startingFrame['bounds'].ymax ) * timePercentage;

         var bounds = {};
         bounds.xmin = startingFrame['bounds'].xmin + boundsXminOffset;
         bounds.ymin = startingFrame['bounds'].ymin + boundsYminOffset;
         bounds.xmax = startingFrame['bounds'].xmax + boundsXmaxOffset;
         bounds.ymax = startingFrame['bounds'].ymax + boundsYmaxOffset;

         return bounds;
         };

      this.toString = function()
         {
         return 'FrameInterval' +
                '[startTime=' + startingFrame['time'] +
                ',endTime=' + endingFrame['time'] +
                ',desiredDuration=' + desiredDuration +
                ',playbackRate=' + playbackRate +
                ',timeDirection=' + timeDirection +
                ',totalTime=' + totalTime +
                ']';
         };
      };

   })();
