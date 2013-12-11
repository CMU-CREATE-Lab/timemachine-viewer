// Testing the controller
if (fields.master) {
  var mapLatLng = {
    "lat": 99999,
    "lng": 99999
  };
  var controlReciever = io.connect('/controller');

  controlReciever.on('connect', function() {
    console.log('controlReciever connected');
    timelapse.addVideoPlayListener(function() {
      //console.log("isPlaying", !timelapse.isPaused());
      if (timelapse.isDoingLoopingDwell()) return;
      controlReciever.emit('handlePlayPauseController', true);
    });
    timelapse.addVideoPauseListener(function() {
      //console.log("isPlaying", !timelapse.isPaused());
      if (timelapse.isDoingLoopingDwell()) return;
      controlReciever.emit('handlePlayPauseController', false);
    });
  });

  controlReciever.on('sync setControllerPlayButton', function() {
    //console.log("timelapse.isPaused()", timelapse.isPaused());
    if (timelapse.isDoingLoopingDwell()) return;
    if (!timelapse.isPaused())
      controlReciever.emit('handlePlayPauseController', true);
    else
      controlReciever.emit('handlePlayPauseController', false);
  });

  controlReciever.on('sync setLocation', function(centerView) {
    //console.log("sync setLocation", centerView);
    cancelZoomGracefully();
    setViewGracefully(JSON.parse(centerView), false, false)
  });

  controlReciever.on('sync playTour', function(tourFragment) {
    //console.log("sync playTour tourFragment", tourFragment);
    var snaplapse = timelapse.getSnaplapse();
    var snaplapseViewer = snaplapse.getSnaplapseViewer();
    var tourJSON = snaplapse.urlStringToJSON(tourFragment);
    snaplapse.loadFromJSON(tourJSON, 0);
    snaplapseViewer.addEventListener('snaplapse-loaded', function() {
      snaplapse.play();
    });
  });

  controlReciever.on('sync decodeTour', function(tourFragment) {
    //console.log("sync decodeTour tourFragment", tourFragment);
    var snaplapse = timelapse.getSnaplapse();
    var snaplapseViewer = snaplapse.getSnaplapseViewer();
    var tourJSON = JSON.parse(snaplapse.urlStringToJSON(tourFragment));
    var firstKeyframe = tourJSON.snaplapse.keyframes[0];
    var tour = {
      "title": tourJSON.snaplapse.unsafe_string_title,
      "firstKeyframe": {
        centerView: timelapse.pixelBoundingBoxToLatLngCenter(firstKeyframe.bounds),
        bounds: firstKeyframe.bounds,
        frame: Math.floor(parseInt(tourJSON.snaplapse.fps) * parseFloat(firstKeyframe.time))
      },
      "fragment": tourFragment
    }
    controlReciever.emit('returnTour', tour);
  });

  controlReciever.on('sync mapViewUpdate', function(data) {
    //console.log("sync mapViewUpdate", data);
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
    //console.log("sync mapZoomTo", data);
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
    //console.log("sync handlePlayPauseServer", data);
    if (timelapse.isDoingLoopingDwell())
      controlReciever.emit('handlePlayPauseController', false);
    timelapse.handlePlayPause();
  });
}
