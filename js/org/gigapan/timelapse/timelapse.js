//======================================================================================================================
// Class for managing timelapses.
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

var g_timelapse={};

// level_threshold sets the quality of display by deciding what level of tile to show for a given level of zoom:
//
//  1.0: select a tile that's shown between 50% and 100% size  (never supersample)
//  0.5: select a tile that's shown between 71% and 141% size
//  0.0: select a tile that's shown between 100% and 200% size (never subsample)
// -0.5: select a tile that's shown between 141% and 242% size (always supersample)
// -1.0: select a tile that's shown between 200% and 400% size (always supersample)

g_timelapse.level_threshold=0;


/////////////////////////////////////////////////////////////
//
// Timelapse public api
//

var UTIL = org.gigapan.Util; // TODO: make me a static global
var videoset = null; // TODO: make me a class member

function timelapse_load(url, video_div_name, status_div_name, optional_info) {
  videoset = new org.gigapan.timelapse.Videoset(video_div_name);
  videoset.add_sync_listener(timelapse_update_slider);

  g_timelapse.video_div=document.getElementById(video_div_name);
  g_timelapse.status_div=document.getElementById(status_div_name);
  g_timelapse.url=url;
  g_timelapse.tiles={};
  g_timelapse.playback_rate=.5;
  g_timelapse.view = timelapse_home_view();
  g_timelapse.target_view = timelapse_home_view();
  UTIL.log("playback rate is " + g_timelapse.playback_rate);
  g_timelapse.video_pos = 0;             // position of video, if paused.  undefined if playing
  g_timelapse.video_offset = undefined;  // undefined if paused.  otherwise video time is (UTIL.getCurrentTimeInSecs() - video_offset) * video_rate
  UTIL.log('timelapse_load("'+url+'")');
  g_timelapse.video_div.onmousedown = timelapse_handle_mousedown;
  g_timelapse.video_div.ondblclick = timelapse_handle_double_click;
            

  if (optional_info) {
    timelapse__load_cb(optional_info, "", "");
  } else {
    $.ajax({url:url+'r.json', dataType: 'json', success: timelapse__load_cb});
  }    
}

function timelapse_handle_mousedown(event) {
  var last_event = event;
  UTIL.log("mousedown");
  g_timelapse.video_div.style.cursor = "url('css/cursors/closedhand.cur')";
  g_timelapse.video_div.onmousemove = function(event) {
    UTIL.log("mousemove");
    g_timelapse.target_view.x += (last_event.pageX - event.pageX) / g_timelapse.view.scale;
    g_timelapse.target_view.y += (last_event.pageY - event.pageY) / g_timelapse.view.scale;
    timelapse_set_target_view(g_timelapse.target_view);
    last_event = event;
    return false;
  };
  g_timelapse.video_div.onmouseup = function() {
    UTIL.log("mouseup");
    g_timelapse.video_div.style.cursor = "url('css/cursors/openhand.cur')";
    g_timelapse.video_div.onmousemove = null;
  };
  return false;
}

function timelapse_set_target_view(view) {
  var max_scale = 2;
  var min_scale = timelapse_home_view().scale * .5;
  view.scale = Math.max(min_scale, Math.min(max_scale, view.scale));
  view.x = Math.max(0, Math.min(g_timelapse.width, view.x));
  view.y = Math.max(0, Math.min(g_timelapse.height, view.y));
  g_timelapse.target_view.x = view.x;
  g_timelapse.target_view.y = view.y;
  g_timelapse.target_view.scale = view.scale;
//  if (!g_videoset.animate_interval) g_videoset.animate_interval = setInterval(timelapse__animate, 100);
  // TEMPORARY
  g_timelapse.view.x = g_timelapse.target_view.x;
  g_timelapse.view.y = g_timelapse.target_view.y;
  g_timelapse.view.scale = g_timelapse.target_view.scale;
  timelapse__refresh();
}

//function timelapse__animate() {
//  var log_scale = Math.log(g_timelapse.view.scale);
//  var log_target_scale = Math.log(g_timelapse.target_view.scale);
//  var delta_log_scale = log_target_scale - log_scale;
//  var min_scale_speed = .05;
//  var scale_proportion = .1;
//
//  if (Math.abs(delta_log_scale) < 
//}

function timelapse_warp_to(view) {
  timelapse_set_target_view(view);
  g_timelapse.view.x = g_timelapse.target_view.x;
  g_timelapse.view.y = g_timelapse.target_view.y;
  g_timelapse.view.scale = g_timelapse.target_view.scale;
  timelapse__refresh();
}

function timelapse_home_view() {
  return timelapse_compute_view_fit({xmin:0, ymin:0, xmax:g_timelapse.width, ymax:g_timelapse.height});
}

function timelapse_compute_view_fit(bbox) {
  var scale = Math.min(g_timelapse.viewport_width/(bbox.xmax-bbox.xmin),
                       g_timelapse.viewport_height/(bbox.ymax-bbox.ymin));
  return {x:.5*(bbox.xmin+bbox.xmax), y:.5*(bbox.ymin+bbox.ymax), scale: scale};
}

function timelapse_compute_bbox(view) {
  var half_width = .5 * g_timelapse.viewport_width / view.scale;
  var half_height = g_timelapse.viewport_height / view.scale;
  return {xmin:view.x-half_width, xmax:view.x+half_width, ymin:view.y-half_height, ymax:view.y+half_height};
}

/////////////////////////////////////////////////////////////
//
// Timelapse private funcs
//

function timelapse__load_cb(data, status, xhr) {
  UTIL.log('timelapse_load_cb('+UTIL.dumpObject(data)+', '+status+', '+xhr+')');
  g_timelapse.width=data.width;
  g_timelapse.height=data.height;
  g_timelapse.tile_width=data.tile_width;
  g_timelapse.tile_height=data.tile_height;
  g_timelapse.fps=data.fps;
  g_timelapse.frames=data.frames;

  // Compute max level #
  for (g_timelapse.max_level = 1;
       (g_timelapse.tile_width << g_timelapse.max_level) < g_timelapse.width ||
       (g_timelapse.tile_height << g_timelapse.max_level) < g_timelapse.height;
       g_timelapse.max_level++);

  timelapse__read_video_div_size();
  timelapse_warp_to(timelapse_home_view());
}

function timelapse__read_video_div_size() {
  g_timelapse.viewport_width = parseInt(g_timelapse.video_div.style.width);
  g_timelapse.viewport_height = parseInt(g_timelapse.video_div.style.height);
}

function timelapse_handle_keydown(event) {
  UTIL.log('keydown ' + event.which);
  var translation_speed_constant = 20;
  var translation = translation_speed_constant / g_timelapse.view.scale;
  switch (event.which) {
  case 37:  g_timelapse.target_view.x -= translation;  break;  // left arrow
  case 39:  g_timelapse.target_view.x += translation;  break;  // right arrow
  case 38:  g_timelapse.target_view.y -= translation;  break;  // up arrow
  case 40:  g_timelapse.target_view.y += translation;  break;  // down arrow
  case 189: g_timelapse.target_view.scale *= .9;       break;  // minus
  case 187: g_timelapse.target_view.scale /= .9;       break;  // plus
  case 80:  // P
    if (timelapse_is_paused()) timelapse_play();
    else timelapse_pause();
    return;
  }
  timelapse_set_target_view(g_timelapse.target_view);
}

function timelapse_handle_mousescroll(event) {
  UTIL.log('mousescroll delta  ' + event.wheelDelta);
  if (event.wheelDelta > 0) g_timelapse.target_view.scale /= .9;
  else if (event.wheelDelta < 0) g_timelapse.target_view.scale *= .9;
  timelapse_set_target_view(g_timelapse.target_view);
}  

function timelapse_handle_double_click() {
  UTIL.log('double click');
  g_timelapse.target_view.scale *= 2;
  timelapse_set_target_view(g_timelapse.target_view);
}

function timelapse_handle_keyup() {
}

function timelapse__refresh() {
  UTIL.log('refresh');
  var tileidxs = timelapse__compute_needed_tiles(g_timelapse.view);
  // Add new tiles and reposition ones we want to keep
  for (var tileidx1 in tileidxs) {
    if (!g_timelapse.tiles[tileidx1]) {
      UTIL.log('need ' + tileidx_dump(tileidx1) + ' from ' + timelapse__tileidx_url(tileidx1));
      timelapse__add_tileidx(tileidx1);
    } else {
      UTIL.log('already have ' + tileidx_dump(tileidx1));
      timelapse__reposition_tileidx(tileidx1, g_timelapse.view);
    }
  }
  // Delete tiles we no longer need
  for (var tileidx2 in g_timelapse.tiles) {
    if (tileidxs[tileidx2] == undefined) {
      timelapse__delete_tileidx(tileidx2);
    }
  }
}

function timelapse__add_tileidx(tileidx) {
  if (g_timelapse.tiles[tileidx]) {
    UTIL.error('timelapse__add_tileidx(' + tileidx_dump(tileidx) + '): already loaded');
    return;
  }
  var url = timelapse__tileidx_url(tileidx);
  UTIL.log("adding tile " + tileidx_dump(tileidx) + " from " + url);
  var video = videoset.add_video(url, timelapse__tileidx_geometry(tileidx));

  g_timelapse.tiles[tileidx] = {video:video};
}
  
function timelapse__delete_tileidx(tileidx) {
  var tile = g_timelapse.tiles[tileidx];
  if (!tile) {
    UTIL.error('timelapse__delete_tileidx(' + tileidx_dump(tileidx) + '): not loaded');
    return;
  }
  UTIL.log("removing tile " + tileidx_dump(tileidx));

  videoset.delete_video(tile.video);
  delete g_timelapse.tiles[tileidx];
}
  
function timelapse__tileidx_url(tileidx) {
  var shard_index = (tileidx_r(tileidx)%2)*2 + (tileidx_c(tileidx)%2);
  var url_prefix = g_timelapse.url.replace("//", "//t"+shard_index+".");
  var ret = url_prefix + tileidx_path(tileidx) + ".mp4";
  //UTIL.log("url is " + ret);
  return ret;
}

function timelapse__compute_needed_tiles(view) {
  var level = timelapse__scale2level(view.scale);
  var bbox= timelapse_compute_bbox(view);
  var tilemin= timelapse__tileidx_at(level, Math.max(0, bbox.xmin), Math.max(0, bbox.ymin));
  var tilemax= timelapse__tileidx_at(level, Math.min(g_timelapse.width-1, bbox.xmax), Math.min(g_timelapse.height-1, bbox.ymax));
  UTIL.log("needed tiles " + tileidx_dump(tilemin) + " to " + tileidx_dump(tilemax));
  var tiles=[];
  for (var r=tileidx_r(tilemin); r <= tileidx_r(tilemax); r++) {
    for (var c=tileidx_c(tilemin); c <= tileidx_c(tilemax); c++) {
      var tileidx=tileidx_create(level, c, r);
      var tile_ctr=timelapse__tileidx_center(tileidx)
      var dist_sq= (tile_ctr.x-view.x)*(tile_ctr.x-view.x) + (tile_ctr.y-view.y)*(tile_ctr.y-view.y);
      tiles.push({dist_sq:dist_sq, tileidx:tileidx});
    }
  }
  tiles.sort(function(a,b){return a.dist_sq-b.dist_sq; });
  var tileidxs = {};
  for (var i in tiles) {
    var tileidx = tiles[i].tileidx;
    tileidxs[tileidx] = tileidx;
  }
  UTIL.log("returning " + tiles.length + " tiles");
  return tileidxs;
}

function timelapse__tileidx_at(level, x, y)
{
  var ret= tileidx_create(level,
                          Math.floor(x / (g_timelapse.tile_width << (g_timelapse.max_level-level))),
                          Math.floor(y / (g_timelapse.tile_height << (g_timelapse.max_level-level))));
  UTIL.log('timelapse__tileidx_at('+x+','+y+','+level+')='+tileidx_dump(ret));
  return ret;
}

function timelapse__scale2level(scale) {
  // Minimum level is 0, which has one tile
  // Maximum level is g_timelapse.max_level, which is displayed 1:1 at scale=1
  var ideal_level = Math.log(scale)/Math.log(2)+g_timelapse.max_level;
  var selected_level = Math.floor(ideal_level+g_timelapse.level_threshold);
  selected_level = Math.max(selected_level, 0);
  selected_level = Math.min(selected_level, g_timelapse.max_level);
  //UTIL.log('timelapse_scale2level('+scale+'): ideal_level='+ideal_level+', ret='+selected_level);
  return selected_level;
}

function timelapse__tileidx_center(t)
{
  var level_shift = g_timelapse.max_level - tileidx_l(t);
  return {x: (tileidx_c(t)+.5) * (g_timelapse.tile_width << level_shift),
         y: (tileidx_r(t)+.5) * (g_timelapse.tile_height << level_shift)};
}

function timelapse__tileidx_geometry(tileidx)
{
  var view = g_timelapse.view;
  
  var level_shift = g_timelapse.max_level - tileidx_l(tileidx);
  var tile_width = g_timelapse.tile_width << level_shift;
  var tile_height = g_timelapse.tile_height << level_shift;

  var width = view.scale * tile_width;
  var height = view.scale * tile_height;

  // Calculate left, right, top, bottom, rounding to nearest pixel;  avoid gaps between tiles.
  var left = Math.round(view.scale * (tileidx_c(tileidx) * tile_width - view.x) + g_timelapse.viewport_width*.5);
  var right = Math.round(view.scale * ((tileidx_c(tileidx)+1) * tile_width - view.x) + g_timelapse.viewport_width*.5);
  //if (!tile.loaded) { left = -10000; }
  var top = Math.round(view.scale * (tileidx_r(tileidx) * tile_height - view.y) + g_timelapse.viewport_height*.5);
  var bottom = Math.round(view.scale * ((tileidx_r(tileidx)+1) * tile_height - view.y) + g_timelapse.viewport_height*.5);

  return {left:left, top:top, width:(right-left), height:(bottom-top)};
}

function timelapse__reposition_tileidx(tileidx)
{
  var tile = g_timelapse.tiles[tileidx];
  if (!tile) {
    UTIL.error('timelapse__refresh_tileidx('+tileidx_dump(tileidx)+'): tile does not exist');
    return;
  }
  //UTIL.log('timelapse__refresh_tileidx('+tileidx_dump(tileidx)+')');

  videoset.reposition_video(tile.video, timelapse__tileidx_geometry(tileidx));
}

/////////////////////////////////////////////////////////////
//
// Timelapse video control
//

function timelapse_update_slider(t) {
  $("#currentTime").text(t.toFixed(2));
  $("#timelineSlider").slider("option", "value", t);
}

function timelapse_is_paused() {
  return videoset.is_paused();
}

function timelapse_pause() {
  videoset.pause();
}

function timelapse_seek(t) {
  videoset.seek(t);
}

function timelapse_set_playback_rate(rate) {
  videoset.set_playback_rate(rate);
}

function timelapse_get_video_position() {
  return videoset.get_video_position();
}

function timelapse_play() {
  videoset.play();
}

function timelapse_log_status(enable) {
  videoset.log_status(enable);
}

function timelapse_enable_native_video_controls(enable) {
  videoset.enable_native_video_controls(enable);
}

function timelapse__video_loaded_metadata(event) {
  var video = event.target;
  UTIL.log("loaded_metadata " + tileidx_dump(video.id));
  video.currentTime = timelapse_get_video_position();
  if (!timelapse_is_paused()) video.play();
}

// Call periodically, when video is running
function timelapse__update() {
  var msg = "readystate";
  for (var tileidx in g_timelapse.tiles) {
    var video = g_timelapse.tiles[tileidx].video;
    msg += " r=" + video.readyState;
    msg += "/n=" + video.networkState;
    msg += "/s=" + video.seeking;
    msg += "/e=" + video.error;
    msg += "/p=" + video.paused;
    msg += "/t=" + video.currentTime;
  }
  UTIL.log(msg);
}

/////////////////////////////////////////////////////////////
//
// Tile index
//

// Represent tile coord as a 31-bit integer so we can use it as an index
// l:4 (0-15)   r:13 (0-8191)  c:14 (0-16383)  
// 31-bit representation
//   
function tileidx_create(l,c,r) { return (l << 27) + (r << 14) + c; }
function tileidx_l(t) { return t >> 27; }
function tileidx_r(t) { return 8191 & (t >> 14); }
function tileidx_c(t) { return 16383 & t; }
function tileidx_dump(t) { return "{l:"+tileidx_l(t)+",c:"+tileidx_c(t)+",r:"+tileidx_r(t)+"}"; }

function tileidx_path(t) {
  var name = "r";
  for (var pos = tileidx_l(t)-1; pos >= 0; pos--) {
    // Append 0-3 depending on bits from col and row
    name += (1 & (tileidx_c(t) >> pos)) + 2*(1 & (tileidx_r(t) >> pos));
  }
  var dir = '';
  for (var i = 0; i < name.length - 3; i += 3) {
    dir +=  name.substr(i, 3) + "/";
  }
  return dir + name;
}  
