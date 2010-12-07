//======================================================================================================================
// Class for managing a timelapse.
//
// Dependencies:
// * org.gigapan.Util
// * org.gigapan.timelapse.Videoset
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
   var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Timelapse";
   alert(noUtilMsg);
   throw new Error(noUtilMsg);
   }
if (!org.gigapan.timelapse.Videoset)
   {
   var noVideosetMsg = "The org.gigapan.timelapse.Videoset library is required by org.gigapan.timelapse.Timelapse";
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

      org.gigapan.timelapse.Timelapse = function(url, video_div_name, optional_info)
         {
            var videoset = new org.gigapan.timelapse.Videoset(video_div_name);
            var video_div = document.getElementById(video_div_name);
            var tiles = {};
            var width = 0;
            var height = 0;
            var viewport_width = 0;
            var viewport_height = 0;
            var tile_width = 0;
            var tile_height = 0;
            var fps = 0;
            var frames = 0;
            var max_level = 0;
            var playback_rate = .5;
            var view = null;
            var target_view = null;

            // level_threshold sets the quality of display by deciding what level of tile to show for a given level of zoom:
            //
            //  1.0: select a tile that's shown between 50% and 100% size  (never supersample)
            //  0.5: select a tile that's shown between 71% and 141% size
            //  0.0: select a tile that's shown between 100% and 200% size (never subsample)
            // -0.5: select a tile that's shown between 141% and 242% size (always supersample)
            // -1.0: select a tile that's shown between 200% and 400% size (always supersample)
            var level_threshold = 0;

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Public methods
            //

            this.handle_window_close = function()
               {
                  /*num_active_removed = 0;
                   num_inactive_removed = 0;

                   for (id in g_videoset.inactive_videos) {
                   var candidate = g_videoset.inactive_videos[id];
                   if (candidate.readyState >= 4 && candidate.seeking == false) {
                   video = candidate;
                   delete g_videoset.inactive_videos[id];
                   num_inactive_removed += 1;
                   }
                   }

                   for (id in g_videoset.active_videos) {
                   var candidate = g_videoset.active_videos[id];
                   if (candidate.readyState >= 4 && candidate.seeking == false) {
                   video = candidate;
                   delete g_videoset.active_videos[id];
                   num_inactive_removed += 1;
                   }
                   }

                   alert("num active removed: " + num_active_removed + " " + "num inactive removed: " + num_inactive_removed);*/
               };

            this.handle_keydown = function(event)
               {
                  UTIL.log('keydown ' + event.which);
                  var translation_speed_constant = 20;
                  var translation = translation_speed_constant / view.scale;
                  switch (event.which)
                  {
                     case 37:  target_view.x -= translation;  break;  // left arrow
                     case 39:  target_view.x += translation;  break;  // right arrow
                     case 38:  target_view.y -= translation;  break;  // up arrow
                     case 40:  target_view.y += translation;  break;  // down arrow
                     case 189: target_view.scale *= .9;       break;  // minus
                     case 187: target_view.scale /= .9;       break;  // plus
                     case 80:  // P
                        if (_is_paused())
                           {
                           _play();
                           }
                        else
                           {
                           _pause();
                           }
                        return;
                  }
                  set_target_view(target_view);
               };

            this.handle_mousescroll = function(event)
               {
                  UTIL.log('mousescroll delta  ' + event.wheelDelta);
                  if (event.wheelDelta > 0)
                     {
                     target_view.scale /= .9;
                     }
                  else if (event.wheelDelta < 0)
                     {
                     target_view.scale *= .9;
                     }
                  set_target_view(target_view);
               };

            this.handle_keyup = function()
               {
               };

            var _warp_to = function(view)
               {
                  set_target_view(view);
                  view.x = target_view.x;
                  view.y = target_view.y;
                  view.scale = target_view.scale;
                  refresh();
               };
            this.warp_to = _warp_to;

            var _home_view = function()
               {
                  return compute_view_fit({xmin:0, ymin:0, xmax:width, ymax:height});
               };
            this.home_view = _home_view;

            ///////////////////////////
            // Timelapse video control
            //

            var _is_paused = function()
               {
                  return videoset.is_paused();
               };
            this.is_paused = _is_paused;

            var _pause = function()
               {
                  videoset.pause();
               };
            this.pause = _pause;

            this.seek = function(t)
               {
                  videoset.seek(t);
               };

            this.set_playback_rate = function(rate)
               {
                  videoset.set_playback_rate(rate);
               };

            this.get_video_position = function()
               {
                  return videoset.get_video_position();
               };

            var _play = function()
               {
                  videoset.play();
               };
            this.play = _play;

            this.log_status = function(enable)
               {
                  videoset.log_status(enable);
               };

            this.enable_native_video_controls = function(enable)
               {
                  videoset.enable_native_video_controls(enable);
               };

            this.get_num_frames = function()
               {
                  return frames;
               };

            this.get_fps = function()
               {
                  return fps;
               };
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Private methods
            //

            var handle_mousedown = function(event)
               {
                  var last_event = event;
                  UTIL.log("mousedown");
                  video_div.style.cursor = "url('css/cursors/closedhand.cur')";
                  video_div.onmousemove = function(event)
                     {
                        UTIL.log("mousemove");
                        target_view.x += (last_event.pageX - event.pageX) / view.scale;
                        target_view.y += (last_event.pageY - event.pageY) / view.scale;
                        set_target_view(target_view);
                        last_event = event;
                        return false;
                     };
                  video_div.onmouseup = function()
                     {
                        UTIL.log("mouseup");
                        video_div.style.cursor = "url('css/cursors/openhand.cur')";
                        video_div.onmousemove = null;
                     };
                  return false;
               };

            var handle_double_click = function()
               {
                  UTIL.log('double click');
                  target_view.scale *= 2;
                  set_target_view(target_view);
               };

            var set_target_view = function(view)
               {
                  var max_scale = 2;
                  var min_scale = _home_view().scale * .5;
                  view.scale = Math.max(min_scale, Math.min(max_scale, view.scale));
                  view.x = Math.max(0, Math.min(width, view.x));
                  view.y = Math.max(0, Math.min(height, view.y));
                  target_view.x = view.x;
                  target_view.y = view.y;
                  target_view.scale = view.scale;
                  //  if (!g_videoset.animate_interval) g_videoset.animate_interval = setInterval(timelapse__animate, 100);
                  // TEMPORARY
                  view.x = target_view.x;
                  view.y = target_view.y;
                  view.scale = target_view.scale;
                  refresh();
               };

            var compute_view_fit = function(bbox)
               {
                  var scale = Math.min(viewport_width / (bbox.xmax - bbox.xmin),
                                       viewport_height / (bbox.ymax - bbox.ymin));
                  return {x:.5 * (bbox.xmin + bbox.xmax), y:.5 * (bbox.ymin + bbox.ymax), scale: scale};
               };

            var compute_bbox = function(view)
               {
                  var half_width = .5 * viewport_width / view.scale;
                  var half_height = viewport_height / view.scale;
                  return {xmin:view.x - half_width, xmax:view.x + half_width, ymin:view.y - half_height, ymax:view.y + half_height};
               };

            var load_cb = function(data, status, xhr)
               {
                  UTIL.log('load_cb(' + UTIL.dumpObject(data) + ', ' + status + ', ' + xhr + ')');
                  width = data['width'];
                  height = data['height'];
                  tile_width = data['tile_width'];
                  tile_height = data['tile_height'];
                  fps = data['fps'];
                  frames = data['frames'];

                  // Compute max level #
                  for (max_level = 1;
                       (tile_width << max_level) < width || (tile_height << max_level) < height;
                       max_level++)
                     {
                     }

                  read_video_div_size();
                  _warp_to(_home_view());
               };

            var read_video_div_size = function()
               {
                  viewport_width = parseInt(video_div.style.width);
                  viewport_height = parseInt(video_div.style.height);
               };

            var refresh = function()
               {
                  UTIL.log('refresh');
                  var tileidxs = compute_needed_tiles(view);
                  // Add new tiles and reposition ones we want to keep
                  for (var tileidx1 in tileidxs)
                     {
                     if (!tiles[tileidx1])
                        {
                        UTIL.log('need ' + tileidx_dump(tileidx1) + ' from ' + tileidx_url(tileidx1));
                        add_tileidx(tileidx1);
                        }
                     else
                        {
                        UTIL.log('already have ' + tileidx_dump(tileidx1));
                        reposition_tileidx(tileidx1);
                        }
                     }
                  // Delete tiles we no longer need
                  for (var tileidx2 in tiles)
                     {
                     if (tileidxs[tileidx2] == undefined)
                        {
                        delete_tileidx(tileidx2);
                        }
                     }
               };

            var add_tileidx = function(tileidx)
               {
                  if (tiles[tileidx])
                     {
                     UTIL.error('add_tileidx(' + tileidx_dump(tileidx) + '): already loaded');
                     return;
                     }
                  var url = tileidx_url(tileidx);
                  var geom = tileidx_geometry(tileidx);
                  UTIL.log("adding tile " + tileidx_dump(tileidx) + " from " + url + " and geom = (left:" + geom['left'] + " ,top:" + geom['top'] + ", width:" + geom['width'] + ", height:" + geom['height'] + ")");
                  var video = videoset.add_video(url, geom);

                  tiles[tileidx] = {video:video};
               };

            var delete_tileidx = function(tileidx)
               {
                  var tile = tiles[tileidx];
                  if (!tile)
                     {
                     UTIL.error('delete_tileidx(' + tileidx_dump(tileidx) + '): not loaded');
                     return;
                     }
                  UTIL.log("removing tile " + tileidx_dump(tileidx));

                  videoset.delete_video(tile.video);
                  delete tiles[tileidx];
               };

            var tileidx_url = function(tileidx)
               {
                  var shard_index = (tileidx_r(tileidx) % 2) * 2 + (tileidx_c(tileidx) % 2);
                  var url_prefix = url.replace("//", "//t" + shard_index + ".");
                  return url_prefix + tileidx_path(tileidx) + ".mp4";
               };

            var compute_needed_tiles = function(view)
               {
                  var level = scale2level(view.scale);
                  var bbox = compute_bbox(view);
                  var tilemin = tileidx_at(level, Math.max(0, bbox.xmin), Math.max(0, bbox.ymin));
                  var tilemax = tileidx_at(level, Math.min(width - 1, bbox.xmax), Math.min(height - 1, bbox.ymax));
                  UTIL.log("needed tiles " + tileidx_dump(tilemin) + " to " + tileidx_dump(tilemax));
                  var tiles = [];
                  for (var r = tileidx_r(tilemin); r <= tileidx_r(tilemax); r++)
                     {
                     for (var c = tileidx_c(tilemin); c <= tileidx_c(tilemax); c++)
                        {
                        var tileidx1 = tileidx_create(level, c, r);
                        var tile_ctr = tileidx_center(tileidx1);
                        var dist_sq = (tile_ctr.x - view.x) * (tile_ctr.x - view.x) + (tile_ctr.y - view.y) * (tile_ctr.y - view.y);
                        tiles.push({dist_sq:dist_sq, tileidx:tileidx1});
                        }
                     }
                  tiles.sort(function(a, b)
                                {
                                   return a.dist_sq - b.dist_sq;
                                });
                  var tileidxs = {};
                  for (var i in tiles)
                     {
                     var tileidx = tiles[i].tileidx;
                     tileidxs[tileidx] = tileidx;
                     }
                  UTIL.log("returning " + tiles.length + " tiles");
                  return tileidxs;
               };

            var tileidx_at = function(level, x, y)
               {
                  var ret = tileidx_create(level,
                                           Math.floor(x / (tile_width << (max_level - level))),
                                           Math.floor(y / (tile_height << (max_level - level))));
                  UTIL.log('tileidx_at(' + x + ',' + y + ',' + level + ')=' + tileidx_dump(ret));
                  return ret;
               };

            var scale2level = function(scale)
               {
                  // Minimum level is 0, which has one tile
                  // Maximum level is g_timelapse.max_level, which is displayed 1:1 at scale=1
                  var ideal_level = Math.log(scale) / Math.log(2) + max_level;
                  var selected_level = Math.floor(ideal_level + level_threshold);
                  selected_level = Math.max(selected_level, 0);
                  selected_level = Math.min(selected_level, max_level);
                  //UTIL.log('scale2level('+scale+'): ideal_level='+ideal_level+', ret='+selected_level);
                  return selected_level;
               };

            var tileidx_center = function(t)
               {
                  var level_shift = max_level - tileidx_l(t);
                  return {
                     x: (tileidx_c(t) + .5) * (tile_width << level_shift),
                     y: (tileidx_r(t) + .5) * (tile_height << level_shift)
                  };
               };

            var tileidx_geometry = function(tileidx)
               {
                  var level_shift = max_level - tileidx_l(tileidx);
                  var tile_width_temp = tile_width << level_shift;
                  var tile_height_temp = tile_height << level_shift;

                  // Calculate left, right, top, bottom, rounding to nearest pixel;  avoid gaps between tiles.
                  var left = Math.round(view.scale * (tileidx_c(tileidx) * tile_width_temp - view.x) + viewport_width * .5);
                  var right = Math.round(view.scale * ((tileidx_c(tileidx) + 1) * tile_width_temp - view.x) + viewport_width * .5);
                  //if (!tile.loaded) { left = -10000; }
                  var top = Math.round(view.scale * (tileidx_r(tileidx) * tile_height_temp - view.y) + viewport_height * .5);
                  var bottom = Math.round(view.scale * ((tileidx_r(tileidx) + 1) * tile_height_temp - view.y) + viewport_height * .5);

                  return {left:left, top:top, width:(right - left), height:(bottom - top)};
               };

            var reposition_tileidx = function(tileidx)
               {
                  var tile = tiles[tileidx];
                  if (!tile)
                     {
                     UTIL.error('reposition_tileidx(' + tileidx_dump(tileidx) + '): tile does not exist');
                     return;
                     }
                  //UTIL.log('reposition_tileidx('+tileidx_dump(tileidx)+')');

                  videoset.reposition_video(tile['video'], tileidx_geometry(tileidx));
               };

            ///////////////////////////
            // Tile index
            //

            // Represent tile coord as a 31-bit integer so we can use it as an index
            // l:4 (0-15)   r:13 (0-8191)  c:14 (0-16383)
            // 31-bit representation
            //
            var tileidx_create = function(l, c, r)
               {
                  return (l << 27) + (r << 14) + c;
               };

            var tileidx_l = function(t)
               {
                  return t >> 27;
               };

            var tileidx_r = function(t)
               {
                  return 8191 & (t >> 14);
               };

            var tileidx_c = function(t)
               {
                  return 16383 & t;
               };

            var tileidx_dump = function(t)
               {
                  return "{l:" + tileidx_l(t) + ",c:" + tileidx_c(t) + ",r:" + tileidx_r(t) + "}";
               };

            var tileidx_path = function(t)
               {
                  var name = "r";
                  for (var pos = tileidx_l(t) - 1; pos >= 0; pos--)
                     {
                     // Append 0-3 depending on bits from col and row
                     name += (1 & (tileidx_c(t) >> pos)) + 2 * (1 & (tileidx_r(t) >> pos));
                     }
                  var dir = '';
                  for (var i = 0; i < name.length - 3; i += 3)
                     {
                     dir += name.substr(i, 3) + "/";
                     }
                  return dir + name;
               };

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Constructor code
            //

            view = _home_view();
            target_view = view;
            UTIL.log("playback rate is " + playback_rate);
            UTIL.log('Timelapse("' + url + '")');
            video_div['onmousedown'] = handle_mousedown;
            video_div['ondblclick'] = handle_double_click;

            // TODO: push this out to index.html
            videoset.add_sync_listener(function(t)
                                          {
                                             $("#currentTime").text(UTIL.formatTime(t));
                                             $("#timelineSlider")['slider']("option", "value", t);
                                          });

            if (optional_info)
               {
               load_cb(optional_info, "", "");
               }
            else
               {
               $.ajax({url:url + 'r.json', dataType: 'json', success: load_cb});  // TODO: move this to index.html
               }

         };
   })();
