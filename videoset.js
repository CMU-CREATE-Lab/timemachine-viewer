var g_videoset={}

///////////////////////////////////////////////////////
//
// Generic utilies
//

function log(str) {
  var now = (new Date()).getTime();
  var mins = ("0" + Math.floor((now / 60000) % 60)).substr(-2);
  var secs = ("0" + ((now / 1000) % 60).toFixed(3)).substr(-6);
  console.log(mins + ":" + secs + ": " + str);
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

function time_secs() {
  return .001 * (new Date()).getTime();
}

/////////////////////////////////////////////////////////////
//
// Videoset api
//

function videoset_init(video_div_name, status_div_name) {
  log('videoset_init');
  g_videoset.video_div=document.getElementById(video_div_name);
  g_videoset.status_div=document.getElementById(status_div_name);
  g_videoset.active_videos={};
  g_videoset.inactive_videos={};
  g_videoset.playback_rate=1;
  g_videoset.id=0;
  videoset_disable_cache(false);
  g_videoset.video_pos = 0;             // position of video, if paused.  undefined if playing
  g_videoset.video_offset = undefined;  // undefined if paused.  otherwise video time is (time_secs() - video_offset) * video_rate
  videoset_activate();
}

function videoset_activate() {
  log("videoset activate");
  if (g_videoset.active) return;
  g_videoset.active = true;
  g_videoset.log_interval = setInterval(videoset__log_status, 500);
}

function videoset_deactivate() {
  log("videoset deactivate");
  if (!g_videoset.active) return;
  g_videoset_active = false;
  clearInterval(g_videoset.log_interval);
}

function videoset_disable_cache(disable) {
  log("videoset disable_cache=" + disable);
  g_videoset.disable_cache=disable;
}

///////////////////////////
// Add and remove videos
//

function videoset_add_video(src, geometry) {
  g_videoset.id++;
  if (g_videoset.disable_cache) {
    src += "?nocache=" + time_secs()+"."+g_videoset.id;
  }
  log("video(" + g_videoset.id + ") added from " + src + " at left="+geometry.left+",top="+geometry.top+", w="+geometry.width+",h="+geometry.height);

  var video = null;
  // Try to find an existing video to recycle

  for (id in g_videoset.inactive_videos) {
    var candidate = g_videoset.inactive_videos[id];
    if (candidate.readyState >= 4 && candidate.seeking == false) {
      video = candidate;
      delete g_videoset.inactive_videos[id];
      log("video(" + g_videoset.id + ") reused from video(" + candidate.id + ")");
      break;
    }    
  }
  if (video == null) video = document.createElement('video');
  video.id = g_videoset.id;
  video.active = true;
  log(videoset__video_summary(video));
  video.setAttribute('src', src);
  log("set src successfully");
  video.setAttribute('controls', true);
  video.setAttribute('preload', true);
  videoset_reposition_video(video, geometry);
  video.defaultPlaybackRate= g_videoset.playback_rate;
  video.load();
  video.style.display = 'inline';
  video.style.position = 'absolute';
  g_videoset.active_videos[video.id]=video;
  g_videoset.video_div.appendChild(video);
  video.addEventListener('loadedmetadata', videoset__video_loaded_metadata, false);
  return video;
}
  

function videoset_reposition_video(video, geometry)
{
  log("video(" + video.id + ") reposition to left="+geometry.left+",top="+geometry.top+", w="+geometry.width+",h="+geometry.height);
  // toFixed prevents going to scientific notation when close to zero;  this confuses the DOM
  video.style.left = geometry.left.toFixed(4);
  video.style.top  = geometry.top.toFixed(4);

  video.style.width = geometry.width;
  video.style.height = geometry.height;
}

function videoset_delete_video(video) {
  log("video(" + video.id + ") delete");
  video.active = false;
  video.pause();
  log(videoset__video_summary(video));
  video.removeAttribute('src');
  log(videoset__video_summary(video));
  video.style.display = 'none';
  log(videoset__video_summary(video));
  delete g_videoset.active_videos[video.id];
  g_videoset.inactive_videos[video.id]=video;
}

/////////////////////////
// Time controls
//

function videoset_is_paused() {
  return (g_videoset.video_offset == undefined);
}

function videoset_pause() {
  if (videoset_is_paused()) return;
  if (g_videoset.update_callback) {
    window.clearInterval(g_videoset.update_callback);
    delete g_videoset.update_callback;
  }
  g_videoset.video_pos = videoset_get_video_position();
  g_videoset.video_offset = undefined;
  for (id in g_videoset.active_videos) {
    log("video("+id+") pause");
    g_videoset.active_videos[id].pause();
  }
}

function videoset_change_playback_rate() {
  // TODO
  log('videoset_change_playback_rate() is unimplemented');
}

function videoset_pause_and_seek(t) {
  videoset_pause();
  g_videoset.video_pos=t;
  for (id in g_videoset.active_videos) {
    g_videoset.active_videos[id].currentTime = t;
  }
}

function videoset_get_video_position() {
  return videoset_is_paused() ? g_videoset.video_pos :
    (time_secs() - g_videoset.video_offset) * g_videoset.playback_rate;
}

function videoset_play() {
  log("videoset play");
  if (!videoset_is_paused()) return;
  //if (!g_videoset.update_callback) g_videoset.update_callback = window.setInterval(videoset__update, 50);
  g_videoset.video_offset = time_secs() - g_videoset.video_pos/g_videoset.playback_rate;
  g_videoset.video_pos = undefined;
  for (id in g_videoset.active_videos) {
    log("video("+id+") play");
    g_videoset.active_videos[id].play();
  }
}

/////////////////////////////////////////////////////////////
//
// Videoset private funcs
//

// This seems to get called pretty late in the game
function videoset__video_loaded_metadata(event) {
  var video = event.target;
  if (!video.active) {
    log("video("+video.id+") loaded_metadata after deactivation!");
    return;
  }
  log("video("+video.id+") loaded_metadata;  seek to " + videoset_get_video_position());
  video.currentTime = videoset_get_video_position();
  if (!videoset_is_paused()) video.play();
}

// Call periodically, when video is running
function videoset__log_status() {
  var msg = "video status:";
  for (id in g_videoset.active_videos) {
    msg += " " + videoset__video_summary(g_videoset.active_videos[id]);
  }
  for (id in g_videoset.inactive_videos) {
    msg += " " + videoset__video_summary(g_videoset.inactive_videos[id]);
  }
  log(msg);
}

function videoset__video_summary(video) {
  var summary = video.id.toString();
  summary += ":A=" + (video.active ? "y" : "n");
  summary += ";N=" + video.networkState;
  summary += ";R=" + video.readyState;
  summary += ";P=" + (video.paused ? "y" : "n");
  summary += ";S=" + (video.seeking ? "y" : "n");
  summary += ";T=" + video.currentTime.toFixed(3);
  summary += ";B=" + videoset__dump_timerange(video.buffered);
  summary += ";P=" + videoset__dump_timerange(video.played);
  summary += ";E=" + (video.error ? "y" : "n");
  return summary;
}

function videoset__dump_timerange(timerange) {
  ret = "{";
  for (var i=0; i<timerange.length; i++) {
    ret += timerange.start(i).toFixed(3) + "-" + timerange.end(i).toFixed(3);
  }
  ret += "}";
  return ret;
}

function videoset__sync() {
  var error_threshold = .1;
  
  if (videoset_is_paused()) return;
  
  var t = videoset_get_video_position();
  for (tileidx in g_videoset.videos) {
    var tile = g_videoset.videos[tileidx];
    var video = tile.video;
    if (video.readyState >= 1 && Math.abs(video.currentTime - t) > error_threshold) {  // HAVE_METADATA=1
      log("Corrected " + tileidx_dump(tileidx) + " from " + video.currentTime + " to " + t + " (error=" + (video.currentTime-t) +", state=" + video.readyState + ")");
      video.currentTime = t;
    } else if (!tile.loaded && video.readyState >= 2) { // HAVE_CURRENT_DATA=2
      tile.loaded = true;
      videoset__reposition_tileidx(tileidx, g_videoset.view);
    }
  }
}

