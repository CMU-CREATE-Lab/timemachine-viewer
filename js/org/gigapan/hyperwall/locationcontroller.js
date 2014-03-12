// Testing the controller
if (fields.master) {
  var mapLatLng = {
    "lat": 99999,
    "lng": 99999
  };
  var controlReciever = io.connect('/controller');
  var getKeyframeFromCurrentHyperwallView = function(frameTitle) {
    var snaplapse = timelapse.getSnaplapse();
    var snaplapseViewer = snaplapse.getSnaplapseViewer();
    var keyframe = snaplapse.recordKeyframe();
    var settings = timelapse.getSettings();
    keyframe.unsafe_string_frameTitle = frameTitle;
    keyframe.centerView = timelapse.pixelBoundingBoxToLatLngCenter(keyframe.bounds);
    keyframe.thumbnailURL = snaplapseViewer.generateThumbnailURL(settings["url"], keyframe.bounds, 260, 185, keyframe.time);
    return keyframe;
  };

  controlReciever.on('connect', function() {
    console.log('controlReciever connected');
    timelapse.addVideoPlayListener(function() {
      if (timelapse.isDoingLoopingDwell())
        return;
      controlReciever.emit('handlePlayPauseController', true);
    });
    timelapse.addVideoPauseListener(function() {
      if (timelapse.isDoingLoopingDwell())
        return;
      controlReciever.emit('handlePlayPauseController', false);
    });
  });

  controlReciever.on('sync setControllerPlayButton', function() {
    if (timelapse.isDoingLoopingDwell())
      return;
    if (!timelapse.isPaused())
      controlReciever.emit('handlePlayPauseController', true);
    else
      controlReciever.emit('handlePlayPauseController', false);
  });

  controlReciever.on('sync setLocation', function(centerView) {
    cancelZoomGracefully();
    setViewGracefully(JSON.parse(centerView), false, false)
  });

  controlReciever.on('sync addKeyframe', function(frameTitle) {
    controlReciever.emit('returnAndAddKeyframe', getKeyframeFromCurrentHyperwallView(frameTitle));
  });

  controlReciever.on('sync updateKeyframe', function(frameTitle) {
    controlReciever.emit('returnAndUpdateKeyframe', getKeyframeFromCurrentHyperwallView(frameTitle));
  });

  controlReciever.on('sync playTour', function(tourFragment) {
    var snaplapse = timelapse.getSnaplapse();
    var snaplapseViewer = snaplapse.getSnaplapseViewer();
    var tourJSON = snaplapse.urlStringToJSON(tourFragment);
    snaplapse.loadFromJSON(tourJSON, 0);
    snaplapseViewer.addEventListener('snaplapse-loaded', function() {
      snaplapse.play();
    });
  });

  controlReciever.on('sync encodeTour', function(tourJSON) {
    controlReciever.emit('returnEncodeTour', timelapse.getSnaplapse().getAsUrlString(tourJSON.keyframes));
  });

  controlReciever.on('sync decodeTour', function(tourURL) {
    var snaplapse = timelapse.getSnaplapse();
    var snaplapseViewer = snaplapse.getSnaplapseViewer();
    var match = tourURL.match(/(presentation)=([^#?&]*)/);
    var presentation = match[2];
    var tourJSON = JSON.parse(snaplapse.urlStringToJSON(presentation));
    var tourJSON = tourJSON.snaplapse;
    var settings = timelapse.getSettings();
    for (var i = 0; i < tourJSON.keyframes.length; i++) {
      var keyframe = tourJSON.keyframes[i];
      keyframe.centerView = timelapse.pixelBoundingBoxToLatLngCenter(keyframe.bounds);
      keyframe.thumbnailURL = snaplapseViewer.generateThumbnailURL(settings["url"], keyframe.bounds, 260, 185, keyframe.time);
    }
    controlReciever.emit('returnDecodeTour', tourJSON);
  });

  controlReciever.on('sync mapViewUpdate', function(data) {
    var snaplapse = timelapse.getSnaplapse();
    if (snaplapse.isPlaying())
      snaplapse.stop();
    var formattedData = data.split(" ");
    mapLatLng.lat = parseFloat(formattedData[0]);
    mapLatLng.lng = parseFloat(formattedData[1]);
    var movePoint = timelapse.getProjection().latlngToPoint(mapLatLng);
    movePoint.scale = timelapse.zoomToScale(parseFloat(formattedData[2]));
    timelapse.setTargetView(movePoint);
  });

  controlReciever.on('sync mapZoomTo', function(data) {
    var snaplapse = timelapse.getSnaplapse();
    if (snaplapse.isPlaying())
      snaplapse.stop();
    var viewArray = data.split(",");
    if (viewArray.length < 3)
      return;
    var newView = {
      center: {
        "lat": viewArray[0],
        "lng": viewArray[1]
      },
      "zoom": viewArray[2]
    };
    setViewGracefully(newView, false, false);
  });

  controlReciever.on('sync handlePlayPauseServer', function(data) {
    if (timelapse.isDoingLoopingDwell())
      controlReciever.emit('handlePlayPauseController', false);
    timelapse.handlePlayPause();
  });
}
