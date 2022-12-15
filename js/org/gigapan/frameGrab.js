var gFrameGrab = {}

gFrameGrab.apiVersion = 2;

/* Override this if more needs to be loaded */
gFrameGrab.isLoaded = function() {
  return (typeof(timelapse) == "object" && timelapse.didFirstTimeLoadAndPlayerReadyCallback());
}

gFrameGrab.captureFrame = function(state) {
  //var before_frameno = timelapse.frameno;
  timelapse.setNewView(state.bounds, true);
  timelapse.seek(state.seek_time);

  return {
    complete: timelapse.lastFrameCompletelyDrawn,
    after_time: timelapse.getCurrentTime(),
    /*before_frameno: before_frameno,
    frameno: gEarthTime.timelapse.frameno,*/
    aux_info: {}
  }
}

gFrameGrab.getPlaybackTimeFromStringDate = function(date) {
  return timelapse.playbackTimeFromShareDate(date);
}

gFrameGrab.getEndPlaybackTime = function() {
  return timelapse.getDuration();
}
