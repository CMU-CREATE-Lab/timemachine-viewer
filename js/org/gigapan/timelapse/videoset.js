//======================================================================================================================
// Class for managing timelapse videosets.
//
// Dependencies:
// * org.gigapan.Util
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
   var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Videoset";
   alert(noUtilMsg);
   throw new Error(noUtilMsg);
   }
//======================================================================================================================

//======================================================================================================================
// CODE
//======================================================================================================================
(function()
   {
      var UTIL = org.gigapan.Util;

      org.gigapan.timelapse.Videoset = function(video_div_name)
         {
            var video_div = document.getElementById(video_div_name);
            var active = false;
            var active_videos = {};
            var inactive_videos = {};
            var playback_rate = 1;
            var id = 0;
            var controls_status = false;
            var duration = 0;
            var is_cache_disabled = false;
            var paused = true;
            var time_offset = 0;
            var log_interval = null;
            var sync_interval = null;
            var sync_listeners = [];

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Public methods
            //

            this.log_status = function(enable)
               {
                  enable = !!enable;  // make true or false
                  UTIL.log("videoset log status " + enable);
                  if (active == enable)
                     {
                     return;
                     }
                  active = enable;
                  if (enable)
                     {
                     log_interval = setInterval(log_status, 500);
                     }
                  else
                     {
                     clearInterval(log_interval);
                     }
               };

            this.enable_native_video_controls = function(enable)
               {
                  controls_status = !!enable;  // make true or false

                  for (var videoId1 in active_videos)
                     {
                     var v1 = active_videos[videoId1];
                     enable ? v1.setAttribute('controls', true) : v1.removeAttribute('controls');
                     }

                  for (var videoId2 in inactive_videos)
                     {
                     var v2 = inactive_videos[videoId2];
                     enable ? v2.setAttribute('controls', true) : v2.removeAttribute('controls');
                     }
               };

            this.add_sync_listener = function(listener)
               {
                  if (listener && typeof(listener) == "function")
                     {
                     sync_listeners.push(listener);
                     }
               };

            this.remove_sync_listener = function(listener)
               {
                  if (listener && typeof(listener) == "function")
                     {
                     for (var i = 0; i < sync_listeners.length; i++)
                        {
                        if (listener == sync_listeners[i])
                           {
                           sync_listeners.splice(i, 1);
                           return;
                           }
                        }
                     }
               };

            ///////////////////////////
            // Add and remove videos
            //

            this.add_video = function(src, geometry)
               {
                  id++;
                  if (is_cache_disabled)
                     {
                     src += "?nocache=" + UTIL.getCurrentTimeInSecs() + "." + id;
                     }
                  UTIL.log("video(" + id + ") added from " + src + " at left=" + geometry.left + ",top=" + geometry.top + ", w=" + geometry.width + ",h=" + geometry.height);

                  var video = null;
                  // Try to find an existing video to recycle

                  for (var videoId in inactive_videos)
                     {
                     var candidate = inactive_videos[videoId];
                     if (candidate.readyState >= 4 && !candidate.seeking)
                        {
                        video = candidate;
                        delete inactive_videos[videoId];
                        UTIL.log("video(" + videoId + ") reused from video(" + candidate.id + ")");
                        break;
                        }
                     }
                  if (video == null)
                     {
                     video = document.createElement('video');
                     }
                  video.id = id;
                  video.active = true;
                  UTIL.log(video_summary(video));
                  video.setAttribute('src', src);
                  UTIL.log("set src successfully");
                  if (controls_status)
                     {
                     video.setAttribute('controls', true);
                     }
                  video.setAttribute('preload', true);
                  this.reposition_video(video, geometry);
                  video.defaultPlaybackRate = video.playbackRate = playback_rate;
                  video.load();
                  video.style.display = 'inline';
                  video.style.position = 'absolute';
                  active_videos[video.id] = video;
                  video_div.appendChild(video);
                  video.addEventListener('loadedmetadata', video_loaded_metadata, false);
                  return video;
               };

            this.reposition_video = function(video, geometry)
               {
                  UTIL.log("video(" + video.id + ") reposition to left=" + geometry.left + ",top=" + geometry.top + ", w=" + geometry.width + ",h=" + geometry.height);
                  // toFixed prevents going to scientific notation when close to zero;  this confuses the DOM
                  video.style.left = geometry.left.toFixed(4);
                  video.style.top = geometry.top.toFixed(4);

                  video.style.width = geometry.width;
                  video.style.height = geometry.height;
               };

            this.delete_video = function(video)
               {
                  UTIL.log("video(" + video.id + ") delete");
                  video.active = false;
                  video.pause();
                  UTIL.log(video_summary(video));
                  video.removeAttribute('src');
                  UTIL.log(video_summary(video));
                  video.style.display = 'none';
                  UTIL.log(video_summary(video));
                  delete active_videos[video.id];
                  inactive_videos[video.id] = video;
               };

            ///////////////////////////
            // Time controls
            //

            var _is_paused = function()
               {
                  return paused;
               };
            this.is_paused = _is_paused;

            var _pause = function()
               {
                  if (!paused)
                     {
                     UTIL.log("videoset pause");
                     clearInterval(sync_interval);
                     var time = _current_time();
                     paused = true;

                     for (var videoId in active_videos)
                        {
                        UTIL.log("video(" + videoId + ") play");
                        active_videos[videoId].pause();
                        }

                     _seek(time);
                     }
               };
            this.pause = _pause;

            this.play = function()
               {
                  if (paused)
                     {
                     var time = _current_time();
                     paused = false;
                     _seek(time);

                     for (var videoId in active_videos)
                        {
                        UTIL.log("video(" + videoId + ") play");
                        active_videos[videoId].play();
                        }

                     sync_interval = setInterval(sync, 200);
                     }
               };

            this.set_playback_rate = function(rate)
               {
                  if (rate != playback_rate)
                     {
                     var t = _current_time();
                     playback_rate = rate;
                     _seek(t);
                     for (var videoId in active_videos)
                        {
                        active_videos[videoId].defaultPlaybackRate = active_videos[videoId].playbackRate = rate;
                        }
                     }
               };

            var _seek = function(new_time)
               {
                  if (new_time != _current_time())
                     {
                     time_offset = new_time - UTIL.getCurrentTimeInSecs() * (paused ? 0 : playback_rate);
                     sync(0.0);
                     }
               };
            this.seek = _seek;

            var _current_time = function()
               {
                  return time_offset + UTIL.getCurrentTimeInSecs() * (paused ? 0 : playback_rate);
               };
            this.current_time = _current_time;

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Private methods
            //

            // This seems to get called pretty late in the game
            var video_loaded_metadata = function(event)
               {
                  var video = event.target;
                  if (!video.active)
                     {
                     UTIL.log("video(" + video.id + ") loaded_metadata after deactivation!");
                     return;
                     }
                  if (!duration)
                     {
                     duration = video.duration;
                     }
                  UTIL.log("video(" + video.id + ") loaded_metadata;  seek to " + _current_time());
                  video.currentTime = _current_time();
                  if (!_is_paused())
                     {
                     video.play();
                     }
               };

            // Call periodically, when video is running
            var log_status = function()
               {
                  var msg = "video status:";
                  for (var videoId1 in active_videos)
                     {
                     msg += " " + video_summary(active_videos[videoId1]);
                     }
                  for (var videoId2 in inactive_videos)
                     {
                     msg += " " + video_summary(inactive_videos[videoId2]);
                     }
                  UTIL.log(msg);
               };

            var video_summary = function(video)
               {
                  var summary = video.id.toString();
                  summary += ":A=" + (video.active ? "y" : "n");
                  summary += ";N=" + video.networkState;
                  summary += ";R=" + video.readyState;
                  summary += ";P=" + (video.paused ? "y" : "n");
                  summary += ";S=" + (video.seeking ? "y" : "n");
                  summary += ";T=" + video.currentTime.toFixed(3);
                  summary += ";B=" + dump_timerange(video.buffered);
                  summary += ";P=" + dump_timerange(video.played);
                  summary += ";E=" + (video.error ? "y" : "n");
                  return summary;
               };

            var dump_timerange = function(timerange)
               {
                  var ret = "{";
                  for (var i = 0; i < timerange.length; i++)
                     {
                     ret += timerange.start(i).toFixed(3) + "-" + timerange.end(i).toFixed(3);
                     }
                  ret += "}";
                  return ret;
               };

            var sync = function(error_threshold)
               {
                  if (error_threshold == undefined)
                     {
                     error_threshold = 0.01;
                     }

                  var t = _current_time();
                  if (t < 0)
                     {
                     _pause();
                     _seek(0);
                     }
                  else if (t > duration)
                     {
                     _pause();
                     _seek(duration);
                     }

                  for (var videoId in active_videos)
                     {
                     var video = active_videos[videoId];
                     if (video.readyState >= 1 && Math.abs(video.currentTime - t) > error_threshold)
                        {  // HAVE_METADATA=1
                        UTIL.log("Corrected video(" + videoId + ") from " + video.currentTime + " to " + t + " (error=" + (video.currentTime - t) + ", state=" + video.readyState + ")");
                        video.currentTime = t + error_threshold * .5; // seek ahead slightly
                        }
                     //    else if (!tile.loaded && video.readyState >= 2) { // HAVE_CURRENT_DATA=2
                     //      tile.loaded = true;
                     //      videoset__reposition_tileidx(tileidx, view);
                     //    }
                     }

                  for (var i = 0; i < sync_listeners.length; i++)
                     {
                     try
                        {
                        sync_listeners[i](t);
                        }
                     catch(e)
                        {
                        UTIL.error(e.name + " while executing videoset sync listener handler: " + e.message, e);
                        }
                     }
               };

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Constructor code
            //

            UTIL.log('Videoset() constructor');

            this.log_status(false);

         };
   })();
