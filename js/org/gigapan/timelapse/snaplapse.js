//======================================================================================================================
// Class for managing a snaplapse.
//
// Dependencies:
// * org.gigapan.Util
// * org.gigapan.timelapse.Timelapse
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
            var keyframeIntervals = [];
            var currentKeyframeIntervalIndex = 0;
            var isCurrentlyPlaying = false;
            var eventListeners = {};
            var timeStep = 1 / timelapse.getFps();
            var halfTimeStep = timeStep / 2;
            var intervalHandle = null;
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
                              this.recordKeyframe(keyframe['time'], keyframe['bounds'], keyframe['title'], keyframe['description']);
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

            this.recordKeyframe = function(time, bounds, title, description)
               {
                  if (typeof bounds == 'undefined')
                     {
                     bounds = timelapse.getBoundingBoxForCurrentView();
                     }

                  var keyframe = {};
                  keyframe['time'] = normalizeTime((typeof time == 'undefined') ? timelapse.getCurrentTime() : time);

                  // check that the new keyframe doesn't have the same time as the previous
                  if (keyframes.length > 0)
                     {
                     var normalizedTimeOfPreviousKeyframe = normalizeTime(keyframes[keyframes.length - 1]['time']);
                     if (normalizedTimeOfPreviousKeyframe == keyframe['time'])
                        {
                        return false;
                        }
                     }

                  keyframe['bounds'] = {};
                  keyframe['bounds'].xmin = bounds.xmin;
                  keyframe['bounds'].ymin = bounds.ymin;
                  keyframe['bounds'].xmax = bounds.xmax;
                  keyframe['bounds'].ymax = bounds.ymax;
                  var insertionIndex = keyframes.length;
                  keyframes[insertionIndex] = keyframe;

                  keyframe['title'] = (typeof title == 'undefined') ? '' : title;
                  keyframe['description'] = (typeof description == 'undefined') ? '' : description;
                  
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

            this.setTextAnnotationForKeyframe = function(index, title, description)
               {
                  UTIL.log("setTextAnnotationForKeyframe(" + index + "," + title + "," + description + ")");
                  if (index >= 0 && index < keyframes.length)
                     {
                     keyframes[index]['title'] = title;
                     keyframes[index]['description'] = description;
                     return true;
                     }
                  return false;
               };

            this.deleteKeyframeAtIndex = function(index)
               {
                  if (index >= 0 && index < keyframes.length)
                     {
                     keyframes.splice(index, 1);
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

            this.play = function()
               {
                  UTIL.log("################################################### Snaplapse play!");

                  if (keyframes.length > 1)
                     {
                     if (!isCurrentlyPlaying)
                        {
                        isCurrentlyPlaying = true;

                        // compute the keyframe intervals
                        for (var k = 1; k < keyframes.length; k++)
                           {
                           keyframeIntervals[keyframeIntervals.length] = new org.gigapan.timelapse.FrameInterval(keyframes[k - 1], keyframes[k], timeStep);
                           UTIL.log("##### Created keyframe interval: between time [" + keyframes[k - 1]['time'] + "] and [" + keyframes[k]['time'] + "]");
                           }

                        // set the current keyframe interval index
                        currentKeyframeIntervalIndex = 0;

                        // make sure playback is stopped
                        timelapse.pause();

                        // jump to the proper time
                        timelapse.seek(keyframes[0]['time']);

                        // set playback rate to the proper direction
                        setTimelapsePlaybackDirection(keyframeIntervals[0].getTimeDirection());

                        // Set an interval which calls the timeChangeListener.  This is much more reliable than adding
                        // a listener to the timelapse because the video element doesn't actually fire time change events
                        // for every time change.
                        intervalHandle = setInterval(function()
                                                        {
                                                           timeChangeListener(timelapse.getCurrentTime());
                                                        }, 1000 / timelapse.getFps());

                        // start playback
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

            var setTimelapsePlaybackDirection = function(timeDirection)
               {
                  timelapse.setPlaybackRate(timeDirection * Math.abs(timelapse.getPlaybackRate()));
               };

            var _stop = function()
               {
                  if (isCurrentlyPlaying)
                     {
                     isCurrentlyPlaying = false;

                     // stop playback
                     timelapse.pause();

                     // clear the time change interval
                     clearInterval(intervalHandle);

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

            this.getKeyframe = function(index)
               {
                  if (index >= 0 && index < keyframes.length)
                     {
                     var keyframe = keyframes[index];
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
                     frameCopy['time'] = frame['time'];
                     frameCopy['title'] = frame['title'];
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
                  var time = Math.floor(t / timeStep) * timeStep;
                  var diff = t - time;
                  if (diff >= halfTimeStep)
                     {
                     time += timeStep;
                     }

                  return parseFloat(time.toFixed(2));
               };

            var timeChangeListener = function(t)
               {
                  var normalizedTime = normalizeTime(t);

                  // get the current keyframe interval
                  var keyframeInterval = keyframeIntervals[currentKeyframeIntervalIndex];

                  // Make sure the time is in the interval.  If it isn't then just assume we've crossed to the next
                  // interval. In that case, update things accordingly
                  if (keyframeInterval.isTimeWithinInterval(normalizedTime))
                     {
                     if (isInIntervalTransitionMode)
                        {
                        // break out of interval transition mode since the time is within the interval now
                        isInIntervalTransitionMode = false;
                        }
                     }
                  else
                     {
                     if (isInIntervalTransitionMode)
                        {
                        // set the proper playback direction and time position
                        setTimelapsePlaybackDirection(keyframeInterval.getTimeDirection());
                        normalizedTime = keyframeInterval.getStartingTime();
                        timelapse.seek(normalizedTime);
                        }
                     else
                        {
                        currentKeyframeIntervalIndex++;
                        if (currentKeyframeIntervalIndex < keyframeIntervals.length)
                           {
                           isInIntervalTransitionMode = true;

                           keyframeInterval = keyframeIntervals[currentKeyframeIntervalIndex];

                           // set the proper playback direction and time position
                           setTimelapsePlaybackDirection(keyframeInterval.getTimeDirection());
                           normalizedTime = keyframeInterval.getStartingTime();
                           timelapse.seek(normalizedTime);
                           }
                        else
                           {
                           keyframeInterval = null;
                           }
                        }
                     }

                  if (keyframeInterval)
                     {
                     // compute the frame for the current (normalized) time
                     var frame = keyframeInterval.computeFrameAtNormalizedTime(normalizedTime);
                     if (frame)
                        {
                        // warp to the correct view
                        timelapse.warpToBoundingBox(frame['bounds']);

                        var listeners = eventListeners['warp'];
                        if (listeners)
                           {
                           for (var i = 0; i < listeners.length; i++)
                              {
                              try
                                 {
                                 listeners[i](cloneFrame(frame));
                                 }
                              catch(e)
                                 {
                                 UTIL.error(e.name + " while calling snaplapse 'warp' event listener: " + e.message, e);
                                 }
                              }
                           }
                        }
                     else
                        {
                        UTIL.error("Failed to compute snaplapse frame for time [" + t + "|" + normalizedTime + "]");
                        _stop();
                        }
                     }
                  else
                     {
                     UTIL.error("Failed to compute current keyframe interval for time [" + t + "|" + normalizedTime + "]");
                     _stop();
                     }
               };
         };

      org.gigapan.timelapse.FrameInterval = function(startingFrame, endingFrame, timeStep)
         {
            var numStepsBetweenKeyframes = Math.abs((endingFrame['time'] - startingFrame['time']) / timeStep);

            var timeOffset = (endingFrame['time'] - startingFrame['time'] ) / numStepsBetweenKeyframes;
            var boundsXminOffset = (endingFrame['bounds'].xmin - startingFrame['bounds'].xmin ) / numStepsBetweenKeyframes;
            var boundsYminOffset = (endingFrame['bounds'].ymin - startingFrame['bounds'].ymin ) / numStepsBetweenKeyframes;
            var boundsXmaxOffset = (endingFrame['bounds'].xmax - startingFrame['bounds'].xmax ) / numStepsBetweenKeyframes;
            var boundsYmaxOffset = (endingFrame['bounds'].ymax - startingFrame['bounds'].ymax ) / numStepsBetweenKeyframes;
            var timeDirection = (endingFrame['time'] > startingFrame['time']) ? 1 : -1;

            this.getStartingFrame = function()
               {
                  return startingFrame;
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

            this.isTimeWithinInterval = function(t)
               {
                  if (timeDirection > 0)
                     {
                     return this.getStartingTime() <= t && t <= this.getEndingTime();
                     }
                  return this.getEndingTime() <= t && t <= this.getStartingTime();
               };

            this.computeFrameAtNormalizedTime = function(t)
               {
                  if (this.isTimeWithinInterval(t))
                     {
                     var numSteps = Math.floor(Math.abs(t - this.getStartingTime()) / timeStep);
                     var frame = {};
                     frame['time'] = this.getStartingTime() + timeOffset * numSteps * timeDirection;
                     frame['bounds'] = {};
                     frame['bounds'].xmin = startingFrame['bounds'].xmin + boundsXminOffset * numSteps;
                     frame['bounds'].ymin = startingFrame['bounds'].ymin + boundsYminOffset * numSteps;
                     frame['bounds'].xmax = startingFrame['bounds'].xmax + boundsXmaxOffset * numSteps;
                     frame['bounds'].ymax = startingFrame['bounds'].ymax + boundsYmaxOffset * numSteps;

                     return frame;
                     }

                  UTIL.error("FrameInterval.computeFrameAtNormalizedTime(): time [" + t + "] is not within keframe interval [" + this.getStartingTime() + "," + this.getEndingTime() + "]");
                  return null;
               }
         };

   })();
