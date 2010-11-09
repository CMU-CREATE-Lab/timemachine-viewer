var g_timelapse={}

// level_threshold sets the quality of display by deciding what level of tile to show for a given level of zoom:
//
//  1.0: select a tile that's shown between 50% and 100% size  (never supersample)
//  0.5: select a tile that's shown between 71% and 141% size
//  0.0: select a tile that's shown between 100% and 200% size (never subsample)
// -0.5: select a tile that's shown between 141% and 242% size (always supersample)
// -1.0: select a tile that's shown between 200% and 400% size (always supersample)

g_timelapse.level_threshold=0;


///////////////////////////////////////////////////////
//
// Generic utilies
//

function log(str) {
  console.log(str);
}

function error(str) {
  log('*ERROR: ' + str);
}

function dump(obj) {
  if (typeof obj != 'object') return obj;
  var ret = '{';
  for (property in obj) {
    if (ret != '{') ret += ',';
    //ret += property + ':' + dump(obj[property]);
    ret += property + ':' + obj[property];
  }
  ret += '}';
  return ret;
}


/////////////////////////////////////////////////////////////
//
// Timelapse public api
//

function timelapse_load(url, div) {
  g_timelapse.div=$("#"+div);
  g_timelapse.url=url;
  g_timelapse.tiles={};
  log('timelapse_load("'+url+'")');
  $.ajax({url:url+'r.json', dataType: 'json', success: timelapse__load_cb});
}

function timelapse_warp_to(view) {
  g_timelapse.view=view;
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

  timelapse__read_div_size();
  timelapse_warp_to(timelapse_home_view());
  timelapse__refresh();
}

function timelapse__read_div_size() {
  g_timelapse.viewport_width = g_timelapse.div.width();
  g_timelapse.viewport_height = g_timelapse.div.height();
}

function timelapse_handle_keydown(event) {
  log('keydown ' + event.which);
  if (event.which == 37) { // left arrow
    g_timelapse.view.x -= 10 / g_timelapse.view.scale;
    timelapse__refresh();
  }
  if (event.which == 39) { // right arrow
    g_timelapse.view.x += 10 / g_timelapse.view.scale;
    timelapse__refresh();
  }
  if (event.which == 38) { // up arrow
    g_timelapse.view.y -= 10 / g_timelapse.view.scale;
    timelapse__refresh();
  }
  if (event.which == 40) { // down arrow
    g_timelapse.view.y += 10 / g_timelapse.view.scale;
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
}

function timelapse_handle_keyup(event) {
}

function timelapse__refresh() {
  tileidxs = timelapse__compute_needed_tiles(g_timelapse.view);
  // Add new tiles and reposition ones we want to keep
  for (var tileidx in tileidxs) {
    if (!g_timelapse.tiles[tileidx]) {
      //log('need ' + tileidx_dump(tileidx) + ' from ' + timelapse__tileidx_url(tileidx));
      timelapse__add_tileidx(tileidx);
    } else {
      //log('already have ' + tileidx_dump(tileidx));
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
  g_timelapse.div.append('<video controls id="'+tileidx+'" src="'+url+'" style="position:absolute">');

  // WARNING: this doesn't work with more than one viewer
  // tile_elt = $("#"+tileidx);
  var elt = document.getElementById(tileidx);
  g_timelapse.tiles[tileidx] = {element:elt};
  timelapse__reposition_tileidx(tileidx, g_timelapse.view);
  //log("  tiles=" + dump(g_timelapse.tiles));
}
  
function timelapse__delete_tileidx(tileidx) {
  var tile = g_timelapse.tiles[tileidx];
  if (!tile) {
    error('timelapse__delete_tileidx(' + tileidx_dump(tileidx) + '): not loaded');
    return;
  }
  log("removing tile " + tileidx_dump(tileidx));
  
  tile.element.parentNode.removeChild(g_timelapse.tiles[tileidx].element);
  //log('tiles = ' + dump(g_timelapse.tiles));
  //log('removing ' + tileidx);
  delete g_timelapse.tiles[tileidx];
  //log('tiles now ' + dump(g_timelapse.tiles));
}
  
function timelapse__tileidx_url(tileidx) {
  var shard_index = (tileidx_r(tileidx)%2)*2 + (tileidx_c(tileidx)%2);
  var url_prefix = g_timelapse.url.replace("//", "//t"+shard_index+".");
  var ret = url_prefix + tileidx_path(tileidx) + ".mp4";
  log("url is " + ret);
  return ret;
}

function timelapse__compute_needed_tiles(view) {
  var level = timelapse__scale2level(view.scale);
  var bbox= timelapse_compute_bbox(view);
  var tilemin= timelapse__tileidx_at(level, Math.max(0, bbox.xmin), Math.max(0, bbox.ymin));
  var tilemax= timelapse__tileidx_at(level, Math.min(g_timelapse.width-1, bbox.xmax), Math.min(g_timelapse.height-1, bbox.ymax));
  var tiles=[];
  for (var r=tilemin.r; r <= tilemax.r; r++) {
    for (var c=tilemin.c; c <= tilemax.c; c++) {
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
  return tileidxs;
}

function timelapse__tileidx_at(level, x, y)
{
  var ret= {c: Math.floor(x / (g_timelapse.tile_width << (g_timelapse.max_level-level))),
            r: Math.floor(y / (g_timelapse.tile_height << (g_timelapse.max_level-level))),
            l: level};
  log('timelapse__tileidx_at('+x+','+y+','+level+')='+dump(ret));
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

function timelapse__reposition_tileidx(tileidx, view)
{
  var tile = g_timelapse.tiles[tileidx];
  if (!tile) {
    error('timelapse__refresh_tileidx('+tileidx_dump(tileidx)+'): tile does not exist');
    return;
  }
  //log('timelapse__refresh_tileidx('+tileidx_dump(tileidx)+')');

  var level_shift = g_timelapse.max_level - tileidx_l(tileidx);
  var tile_width = g_timelapse.tile_width << level_shift;
  var tile_height = g_timelapse.tile_height << level_shift;

  tile.element.style.width = view.scale * tile_width;
  tile.element.style.height = view.scale * tile_height;

  var left = view.scale * (tileidx_c(tileidx) * tile_width - view.x) + g_timelapse.viewport_width*.5;
  var top = view.scale * (tileidx_r(tileidx) * tile_height - view.y) + g_timelapse.viewport_height*.5;

  // When setting left or top, the number is converted to a string
  // When # is close enough to zero that we revert to scientific notation, 
  log("left will be " + Math.round(left*1000)/1000);
  log("top will be " + Math.round(top*1000)/1000);
  tile.element.style.left = Math.round(left*1000)/1000;
  tile.element.style.top = Math.round(top*1000)/1000;
  log("left now " + tile.element.style.left);
  log("top now " + tile.element.style.top);
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
