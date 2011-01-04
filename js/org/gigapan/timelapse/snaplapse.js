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
            var frames = {};
            var isCurrentlyPlaying = false;
            var eventListeners = {};
            var timeStep = 1 / timelapse.getFps();
            var halfTimeStep = timeStep / 2;
            var minTime = timelapse.getNumFrames() / timelapse.getFps();
            var maxTime = 0;
            var timeDirection = 0;
            var intervalHandle = null;

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
                        UTIL.log("Found [" + obj['snaplapse']['keyframes'].length + "] keyframes in the json:\n\n" + json)
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
                              this.recordKeyframe(keyframe['time'], keyframe['bounds']);
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

            this.recordKeyframe = function(time, bounds)
               {
                  if (bounds == undefined)
                     {
                     bounds = timelapse.getBoundingBoxForCurrentView();
                     }

                  var keyframe = {};
                  keyframe['time'] = (time == undefined) ? timelapse.getCurrentTime() : time;

                  // check that the time isn't changing direction and that the new keyframe doesn't have the same time as the previous
                  if (keyframes.length > 0)
                     {
                     var normalizedTimeOfPreviousKeyframe = normalizeTime(keyframes[keyframes.length - 1]['time']);
                     var normalizedTimeOfCurrentKeyframe = normalizeTime(keyframe['time']);
                     if (normalizedTimeOfPreviousKeyframe == normalizedTimeOfCurrentKeyframe)
                        {
                        return false;
                        }
                     if (keyframes.length == 1)
                        {
                        timeDirection = (normalizedTimeOfCurrentKeyframe > normalizedTimeOfPreviousKeyframe) ? 1 : -1;
                        }
                     else if (keyframes.length > 1)
                        {
                        if ((timeDirection > 0 && normalizedTimeOfCurrentKeyframe <= normalizedTimeOfPreviousKeyframe) ||
                            (timeDirection < 0 && normalizedTimeOfCurrentKeyframe >= normalizedTimeOfPreviousKeyframe))
                           {
                           return false;
                           }
                        }
                     }

                  keyframe['bounds'] = {};
                  keyframe['bounds'].xmin = bounds.xmin;
                  keyframe['bounds'].ymin = bounds.ymin;
                  keyframe['bounds'].xmax = bounds.xmax;
                  keyframe['bounds'].ymax = bounds.ymax;
                  keyframes[keyframes.length] = keyframe;

                  // now add the intermediary frames
                  if (keyframes.length > 1)
                     {
                     var previousKeyframe = keyframes[keyframes.length - 2];
                     var currentKeyframe = keyframes[keyframes.length - 1];

                     var numStepsBetweenKeyframes = Math.abs((currentKeyframe['time'] - previousKeyframe['time']) / timeStep);

                     var timeOffset = (currentKeyframe['time'] - previousKeyframe['time'] ) / numStepsBetweenKeyframes;
                     var boundsXminOffset = (currentKeyframe['bounds'].xmin - previousKeyframe['bounds'].xmin ) / numStepsBetweenKeyframes;
                     var boundsYminOffset = (currentKeyframe['bounds'].ymin - previousKeyframe['bounds'].ymin ) / numStepsBetweenKeyframes;
                     var boundsXmaxOffset = (currentKeyframe['bounds'].xmax - previousKeyframe['bounds'].xmax ) / numStepsBetweenKeyframes;
                     var boundsYmaxOffset = (currentKeyframe['bounds'].ymax - previousKeyframe['bounds'].ymax ) / numStepsBetweenKeyframes;
                     UTIL.log("Processing snaplapse keyframe " + (keyframes.length - 1) + ": Num steps = [" + numStepsBetweenKeyframes + "]");

                     // record the frames between keyframes
                     var previousFrame = previousKeyframe;
                     for (var frameIndex = 1; frameIndex <= numStepsBetweenKeyframes; frameIndex++)
                        {
                        var frame = {};
                        frame['time'] = previousFrame['time'] + timeOffset;
                        frame['bounds'] = {};
                        frame['bounds'].xmin = previousFrame['bounds'].xmin + boundsXminOffset;
                        frame['bounds'].ymin = previousFrame['bounds'].ymin + boundsYminOffset;
                        frame['bounds'].xmax = previousFrame['bounds'].xmax + boundsXmaxOffset;
                        frame['bounds'].ymax = previousFrame['bounds'].ymax + boundsYmaxOffset;
                        addFrame(frame);
                        previousFrame = frame;
                        }

                     }
                  else
                     {
                     UTIL.log("Processing snaplapse keyframe " + (keyframes.length - 1));
                     }

                  // finally, add the keyframe to the frames collection
                  addFrame(keyframe);

                  var listeners = eventListeners['record-keyframe'];
                  if (listeners)
                     {
                     for (var i = 0; i < listeners.length; i++)
                        {
                        try
                           {
                           listeners[i](cloneFrame(keyframe));
                           }
                        catch(e)
                           {
                           UTIL.error(e.name + " while calling snaplapse 'record-keyframe' event listener: " + e.message, e);
                           }
                        }
                     }

                  return true;
               };

            this.play = function()
               {
                  if (keyframes.length > 0)
                     {
                     if (!isCurrentlyPlaying)
                        {
                        isCurrentlyPlaying = true;

                        // stop playback
                        timelapse.pause();

                        // jump to the proper time
                        timelapse.seek(keyframes[0]['time']);

                        // add time change listener to the timelapse
                        timelapse.addTimeChangeListener(timeChangeListener);

                        // set playback rate to the proper direction
                        timelapse.setPlaybackRate(timeDirection * Math.abs(timelapse.getPlaybackRate()));

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

            var _stop = function()
               {
                  if (isCurrentlyPlaying)
                     {
                     // stop playback
                     timelapse.pause();

                     // clear the time change interval
                     clearInterval(intervalHandle);

                     isCurrentlyPlaying = false;

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

            this.getKeyframes = function()
               {
                  return keyframes;
               };

            this.getFrames = function()
               {
                  return frames;
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
                     frameCopy['bounds'] = {};
                     frameCopy['bounds'].xmin = frame['bounds'].xmin;
                     frameCopy['bounds'].ymin = frame['bounds'].ymin;
                     frameCopy['bounds'].xmax = frame['bounds'].xmax;
                     frameCopy['bounds'].ymax = frame['bounds'].ymax;
                     }

                  return frameCopy;

               };

            var addFrame = function(frame)
               {
                  var normalizedTime = normalizeTime(frame['time']);
                  minTime = Math.min(minTime, normalizedTime);
                  maxTime = Math.max(maxTime, normalizedTime);
                  frames[normalizedTime] = frame;
               };

            var getFrameAtTime = function(t)
               {
                  return frames[normalizeTime(t)];
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
                  // get the frame (if any)
                  var frame = getFrameAtTime(t);
                  if (frame)
                     {
                     UTIL.log("warping to snaplapse view for frame at time [" + t + "|" + normalizeTime(t) + "]");

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
                     UTIL.log("ERROR: no snaplapse frame found for time [" + t + "|" + normalizeTime(t) + "]");
                     }

                  // stop play back if the current playing position is outside the bounds of the snaplapse
                  var playbackRate = timelapse.getPlaybackRate();
                  var normalizedTime = normalizeTime(t);
                  if ((playbackRate > 0 && normalizedTime >= maxTime) ||
                      (playbackRate < 0 && normalizedTime <= minTime))
                     {
                     _stop();
                     }

               };
         };
   })();
