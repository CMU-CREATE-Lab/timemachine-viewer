var g_timelapse={}

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

function timelapse_load(url, video_div_name, status_div_name, optional_info) {
  videoset_init(video_div_name, status_div_name);
  g_timelapse.video_div=document.getElementById(video_div_name);
  g_timelapse.status_div=document.getElementById(status_div_name);
  g_timelapse.url=url;
  g_timelapse.tiles={};
  g_timelapse.playback_rate=.5;
  log("playback rate is " + g_timelapse.playback_rate);
  g_timelapse.video_pos = 0;             // position of video, if paused.  undefined if playing
  g_timelapse.video_offset = undefined;  // undefined if paused.  otherwise video time is (time_secs() - video_offset) * video_rate
  log('timelapse_load("'+url+'")');
  if (optional_info) {
    timelapse__load_cb(optional_info, "", "");
  } else {
    $.ajax({url:url+'r.json', dataType: 'json', success: timelapse__load_cb});
  }    
}

function timelapse_warp_to(view) {
  g_timelapse.view=view;
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
  log('timelapse_load_cb('+dump(data)+', '+status+', '+xhr+')');
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
  log('keydown ' + event.which);
  var translation_speed_constant = 20;
  if (event.which == 37) { // left arrow
    g_timelapse.view.x -= translation_speed_constant / g_timelapse.view.scale;
    timelapse__refresh();
  }
  if (event.which == 39) { // right arrow
    g_timelapse.view.x += translation_speed_constant / g_timelapse.view.scale;
    timelapse__refresh();
  }
  if (event.which == 38) { // up arrow
    g_timelapse.view.y -= translation_speed_constant / g_timelapse.view.scale;
    timelapse__refresh();
  }
  if (event.which == 40) { // down arrow
    g_timelapse.view.y += translation_speed_constant / g_timelapse.view.scale;
    timelapse__refresh();
  }
  if (event.which == 189) { // minus
    g_timelapse.view.scale *= .9;
    timelapse__refresh();
  }
  if (event.which == 187) { // plus
    g_timelapse.view.scale /= .9;
    timelapse__refresh();
  }
  if (event.which == 82) { // R
    timelapse__refresh();
  }
  if (event.which == 80) { // P
    if (timelapse_is_paused()) {
      timelapse_play();
    } else {
      timelapse_pause();
    }
  }
}

function timelapse_handle_mousescroll(event) {
  log('mousescroll delta  ' + event.wheelDelta);
  if (event.wheelDelta > 0) {
    g_timelapse.view.scale /= .9;
    timelapse__refresh();
  } else if (event.wheelDelta < 0) {
    g_timelapse.view.scale *= .9;
    timelapse__refresh();
  }
}

function timelapse_handle_mousemove(end_x, end_y) {
  log('mouse distance moved (' + end_x + ',' + end_y + ')');
  if (end_x > 0 && end_y > 0) {
	g_timelapse.view.x -= Math.abs(end_x) / g_timelapse.view.scale;
	g_timelapse.view.y -= Math.abs(end_y) / g_timelapse.view.scale;
	timelapse__refresh();
  }else if (end_x > 0 && end_y < 0) {
	g_timelapse.view.x -= Math.abs(end_x) / g_timelapse.view.scale;
	g_timelapse.view.y += Math.abs(end_y) / g_timelapse.view.scale;
	timelapse__refresh();
  }else if (end_x < 0 && end_y > 0) {
	g_timelapse.view.x += Math.abs(end_x) / g_timelapse.view.scale;
	g_timelapse.view.y -= Math.abs(end_y) / g_timelapse.view.scale;
	timelapse__refresh();
  }else if (end_x < 0 && end_y < 0) {
	g_timelapse.view.x += Math.abs(end_x) / g_timelapse.view.scale;
	g_timelapse.view.y += Math.abs(end_y) / g_timelapse.view.scale;
	timelapse__refresh();
  }else if (end_x == 0 && end_y < 0) {
	g_timelapse.view.y += Math.abs(end_y) / g_timelapse.view.scale;
	timelapse__refresh();
  }else if (end_x == 0 && end_y > 0) {
	g_timelapse.view.y -= Math.abs(end_y) / g_timelapse.view.scale;
	timelapse__refresh();
  }else if (end_x < 0 && end_y == 0) {
	g_timelapse.view.x += Math.abs(end_x) / g_timelapse.view.scale;
	timelapse__refresh();
  }else if (end_x > 0 && end_y == 0) {
	g_timelapse.view.x -= Math.abs(end_x) / g_timelapse.view.scale;
	timelapse__refresh();
  }
}

function timelapse_handle_double_click() {
  log('double click');
  g_timelapse.view.scale /= .45; //zoom in by a factor of 2
  timelapse__refresh();
}

function timelapse_handle_keyup(event) {
}

function timelapse__refresh() {
  log('refresh');
  tileidxs = timelapse__compute_needed_tiles(g_timelapse.view);
  // Add new tiles and reposition ones we want to keep
  for (var tileidx in tileidxs) {
    if (!g_timelapse.tiles[tileidx]) {
      log('need ' + tileidx_dump(tileidx) + ' from ' + timelapse__tileidx_url(tileidx));
      timelapse__add_tileidx(tileidx);
    } else {
      log('already have ' + tileidx_dump(tileidx));
      timelapse__reposition_tileidx(tileidx, g_timelapse.view);
    }
  }
  // Delete tiles we no longer need
  for (var tileidx in g_timelapse.tiles) {
    if (tileidxs[tileidx] == undefined) {
      timelapse__delete_tileidx(tileidx);
    }
  }
}

function timelapse__add_tileidx(tileidx) {
  if (g_timelapse.tiles[tileidx]) {
    error('timelapse__add_tileidx(' + tileidx_dump(tileidx) + '): already loaded');
    return;
  }
  var url = timelapse__tileidx_url(tileidx);
  log("adding tile " + tileidx_dump(tileidx) + " from " + url);
  var video = videoset_add_video(url, timelapse__tileidx_geometry(tileidx));

  g_timelapse.tiles[tileidx] = {video:video};
}
  
function timelapse__delete_tileidx(tileidx) {
  var tile = g_timelapse.tiles[tileidx];
  if (!tile) {
    error('timelapse__delete_tileidx(' + tileidx_dump(tileidx) + '): not loaded');
    return;
  }
  log("removing tile " + tileidx_dump(tileidx));

  videoset_delete_video(tile.video);
  delete g_timelapse.tiles[tileidx];
}
  
function timelapse__tileidx_url(tileidx) {
  var shard_index = (tileidx_r(tileidx)%2)*2 + (tileidx_c(tileidx)%2);
  var url_prefix = g_timelapse.url.replace("//", "//t"+shard_index+".");
  var ret = url_prefix + tileidx_path(tileidx) + ".mp4";
  //log("url is " + ret);
  return ret;
}

function timelapse__compute_needed_tiles(view) {
  var level = timelapse__scale2level(view.scale);
  var bbox= timelapse_compute_bbox(view);
  var tilemin= timelapse__tileidx_at(level, Math.max(0, bbox.xmin), Math.max(0, bbox.ymin));
  var tilemax= timelapse__tileidx_at(level, Math.min(g_timelapse.width-1, bbox.xmax), Math.min(g_timelapse.height-1, bbox.ymax));
  log("needed tiles " + tileidx_dump(tilemin) + " to " + tileidx_dump(tilemax));
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
  log("returning " + tiles.length + " tiles");
  return tileidxs;
}

function timelapse__tileidx_at(level, x, y)
{
  var ret= tileidx_create(level,
                          Math.floor(x / (g_timelapse.tile_width << (g_timelapse.max_level-level))),
                          Math.floor(y / (g_timelapse.tile_height << (g_timelapse.max_level-level))));
  log('timelapse__tileidx_at('+x+','+y+','+level+')='+tileidx_dump(ret));
  return ret;
}

function timelapse__scale2level(scale) {
  // Minimum level is 0, which has one tile
  // Maximum level is g_timelapse.max_level, which is displayed 1:1 at scale=1
  var ideal_level = Math.log(scale)/Math.log(2)+g_timelapse.max_level;
  var selected_level = Math.floor(ideal_level+g_timelapse.level_threshold);
  selected_level = Math.max(selected_level, 0);
  selected_level = Math.min(selected_level, g_timelapse.max_level);
  //log('timelapse_scale2level('+scale+'): ideal_level='+ideal_level+', ret='+selected_level);
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
    error('timelapse__refresh_tileidx('+tileidx_dump(tileidx)+'): tile does not exist');
    return;
  }
  //log('timelapse__refresh_tileidx('+tileidx_dump(tileidx)+')');

  videoset_reposition_video(tile.video, timelapse__tileidx_geometry(tileidx));
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
  return videoset_is_paused();
}

function timelapse_pause() {
  videoset_pause();
}

function timelapse_seek(t) {
  videoset_seek(t);
}

function timelapse_set_playback_rate(rate) {
  videoset_set_playback_rate(rate);
}

function timelapse_get_video_position() {
  return videoset_get_video_position();
}

function timelapse_play() {
  videoset_play();
}

function timelapse__video_loaded_metadata(event) {
  var video = event.target;
  log("loaded_metadata " + tileidx_dump(video.id));
  video.currentTime = timelapse_get_video_position();
  if (!timelapse_is_paused()) video.play();
}

// Call periodically, when video is running
function timelapse__update() {
  //timelapse__sync();
  var msg = "readystate";
  for (tileidx in g_timelapse.tiles) {
    var video = g_timelapse.tiles[tileidx].video;
    msg += " r=" + video.readyState;
    msg += "/n=" + video.networkState;
    msg += "/s=" + video.seeking;
    msg += "/e=" + video.error;
    msg += "/p=" + video.paused;
    msg += "/t=" + video.currentTime;
  }
  log(msg);
}

function timelapse__sync() {
  videoset__sync();
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
