var g_videoset={};

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
  g_videoset.controls_status=false;
  g_videoset.duration=0;
  videoset_disable_cache(false);
  // current_time = time_offset + time_secs() * (paused ? 0 : playback_rate)
  // time_offset = current_time - time_secs() * (paused ? 0 : playback_rate)
  g_videoset.paused = true;
  g_videoset.time_offset = 0;
  videoset_log_status(false);
}

function videoset_log_status(enable) {
  enable = !!enable;  // make true or false
  log("videoset log status " + enable);
  if (g_videoset.active == enable) return;
  g_videoset.active = enable;
  if (enable) {
    g_videoset.log_interval = setInterval(videoset__log_status, 500);
  } else {
    clearInterval(g_videoset.log_interval);
  }
}

function videoset_disable_cache(disable) {
  log("videoset disable_cache=" + disable);
  g_videoset.disable_cache=disable;
}

function videoset_enable_native_video_controls(enable) {
  g_videoset.controls_status = !!enable;  // make true or false

  for (id in g_videoset.active_videos) {
    var v = g_videoset.active_videos[id];
    enable ? v.setAttribute('controls', true) : v.removeAttribute('controls');
  }
    
  for (id in g_videoset.inactive_videos) {
    var v = g_videoset.inactive_videos[id];
    enable ? v.setAttribute('controls', true) : v.removeAttribute('controls');
  }
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
  if (g_videoset.controls_status) video.setAttribute('controls', true);
  video.setAttribute('preload', true);
  videoset_reposition_video(video, geometry);
  video.defaultPlaybackRate = video.playbackRate =  g_videoset.playback_rate;
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
  return g_videoset.paused;
}

function videoset_pause() {
  if (!g_videoset.paused) {
    log("videoset pause");
    clearInterval(g_videoset.sync_interval);
    var time = videoset_current_time();
    g_videoset.paused = true;

    for (id in g_videoset.active_videos) {
      log("video("+id+") play");
      g_videoset.active_videos[id].pause();
    }

    videoset_seek(time);
  }
}

function videoset_play() {
  if (g_videoset.paused) {
    var time = videoset_current_time();
    g_videoset.paused = false;
    videoset_seek(time);

    for (id in g_videoset.active_videos) {
      log("video("+id+") play");
      g_videoset.active_videos[id].play();
    }
    
    g_videoset.sync_interval = setInterval(videoset__sync, 200);
  }
}

function videoset_set_playback_rate(rate) {
  if (rate != g_videoset.playback_rate) {
    var t = videoset_current_time();
    g_videoset.playback_rate = rate;
    videoset_seek(t);
    for (id in g_videoset.active_videos) {
      g_videoset.active_videos[id].defaultPlaybackRate = g_videoset.active_videos[id].playbackRate = rate;
    }
  }
}

function videoset_seek(new_time) {
  if (new_time != videoset_current_time()) {
    g_videoset.time_offset = new_time - time_secs() * (g_videoset.paused ? 0 : g_videoset.playback_rate);
    videoset__sync(0.0);
  }
}

function videoset_current_time() {
  return g_videoset.time_offset + time_secs() * (g_videoset.paused ? 0 : g_videoset.playback_rate);
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
  if (!g_videoset.duration) g_videoset.duration = video.duration;
  log("video("+video.id+") loaded_metadata;  seek to " + videoset_current_time());
  video.currentTime = videoset_current_time();
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

function videoset__sync(error_threshold) {
  if (error_threshold == undefined) error_threshold = 0.01;
  
  var t = videoset_current_time();
  if (t < 0) {
    videoset_pause();
    videoset_seek(0);
  } else if (t > g_videoset.duration) {
    videoset_pause();
    videoset_seek(g_videoset.duration);
  }

  for (id in g_videoset.active_videos) {
    var video = g_videoset.active_videos[id];
    if (video.readyState >= 1 && Math.abs(video.currentTime - t) > error_threshold) {  // HAVE_METADATA=1
      log("Corrected video(" + id + ") from " + video.currentTime + " to " + t + " (error=" + (video.currentTime-t) +", state=" + video.readyState + ")");
      video.currentTime = t + error_threshold *.5; // seek ahead slightly
    }
//    else if (!tile.loaded && video.readyState >= 2) { // HAVE_CURRENT_DATA=2
//      tile.loaded = true;
//      videoset__reposition_tileidx(tileidx, g_videoset.view);
//    }
  }
  
  timelapse_update_slider(t);

}

