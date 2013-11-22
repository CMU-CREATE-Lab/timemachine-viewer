console.log('initializing viewsync');

var MAX_TIME_DIFF = 1 / 60;
var MIN_SCALE = 0.05;

var yawOffset = (fields.yawOffset) ? fields.yawOffset : 0;
var pitchOffset = (fields.pitchOffset) ? fields.pitchOffset : 0;
var screensLeft = (fields.screensLeft) ? fields.screensLeft : 0;
var screensRight = (fields.screensRight) ? fields.screensRight : 0;
var screensUp = (fields.screensUp) ? fields.screensUp : 0;
var screensDown = (fields.screensDown) ? fields.screensDown : 0;
var viewsync = io.connect('/viewsync');
var masterView;

viewsync.on('connect', function() {
  console.log('viewsync connected');
  viewsync.emit('settings', {
    yawOffset: yawOffset,
    pitchOffset: pitchOffset
  });
});

viewsync.on('connect_failed', function() {
  console.log('viewsync connection failed!');
});
viewsync.on('disconnect', function() {
  console.log('viewsync disconnected');
});

function viewsync_init() {
  if (fields.master) {
    // events for master
    console.log('master of the universe');
    // wait for the timelapse to be ready, there must be a better way!
    setTimeout(function() {

      //console.log( 'video length: ' + get_video_length() + ' seconds' );

      var metadata = timelapse.getMetadata();
      masterView = timelapse.getView();
      //console.log( 'dimensions: ' + metadata.width + ' x ' + metadata.height );

      timelapse.addViewChangeListener(function() {

        // correct scale extents before checking x/y
        var view = timelapse.getView();
        masterView = view;
        /*if ( view.scale < MIN_SCALE ) {
         view.scale = MIN_SCALE;
         timelapse.setNewView( view, true );
         view = timelapse.getView();
         console.log( 'correcting scale extents' );
         }*/
        var bbox = timelapse.getBoundingBoxForCurrentView();
        //var bbWidth = bbox.xmax - bbox.xmin;
        //var bbHeight = bbox.ymax - bbox.ymin;

        //var xmax = metadata.width - bbWidth * screensRight;
        //var xmin = bbWidth * screensLeft;
        //var xmax = timelapse.getPanoWidth()*(1-(parseInt(screensRight)/(1+parseInt(screensRight)+parseInt(screensLeft))));
        //var xmin = timelapse.getPanoWidth()*(parseInt(screensLeft)/(1+parseInt(screensRight)+parseInt(screensLeft)));

        var xmax = timelapse.getPanoWidth();
        var xmin = 0;

        //var ymax = metadata.height - bbHeight * screensDown;
        //var ymin = bbHeight * screensUp;
        //var ymax = timelapse.getPanoHeight()*(1-(screensDown/(1+screensUp+screensDown)));
        //var ymin = timelapse.getPanoHeight()*(screensUp/(1+screensUp+screensDown));
        var ymax = timelapse.getPanoHeight();
        var ymin = 0;

        var xyExtents = false;

        if (view.x < xmin) {
          view.x = xmin;
          xyExtents = true;
        } else if (view.x > xmax) {
          view.x = xmax;
          xyExtents = true;
        }
        if (view.y < ymin) {
          view.y = ymin;
          xyExtents = true;
        } else if (view.y > ymax) {
          view.y = ymax;
          xyExtents = true;
        }

        //console.log(xyExtents);
        if (xyExtents) {
          //console.log( 'adjusted view:' );
          //console.log( view );
          timelapse.setNewView(view, true);
          bbox = timelapse.getBoundingBoxForCurrentView();
        }

        //console.log( bbox );
        if (fields.showMap || fields.showControls) {
          timelapse.updateTagInfo_locationData();
        }

        viewsync.emit('view', {
          "bbox": bbox,
          "view": view
        });
      });
      timelapse.addTimeChangeListener(function() {
        viewsync_send_time(false);
      });
      //setInterval(function(){
      //  viewsync_send_time( false );
      //}, 1000);

      timelapse.addVideoPlayListener(function() {
        console.log('master play');
        viewsync.emit('play', {
          play: true
        });
        viewsync_send_time(true);
      });
      timelapse.addVideoPauseListener(function() {
        console.log('master pause');
        viewsync.emit('play', {
          play: false
        });
        viewsync_send_time(true);
      });
    }, 1000);
  } else {
    // events for slaves
    viewsync.on('sync view', function(data) {
      //console.log( 'sync view: x: ' + data.xmin + '-' + data.xmax
      //             + ' y: ' + data.ymin + '-' + data.ymax
      //             + ' scale: ' + data.scale
      //           );
      masterView = data.view;
      var xoffset = (data.bbox.xmax - data.bbox.xmin ) * yawOffset;
      var yoffset = (data.bbox.ymax - data.bbox.ymin ) * pitchOffset;
      var adjusted = {
        bbox: {
          xmin: data.bbox.xmin + xoffset,
          xmax: data.bbox.xmax + xoffset,
          ymin: data.bbox.ymin + yoffset,
          ymax: data.bbox.ymax + yoffset
        }
      };

      if (fields.showMap || fields.showControls) {
        timelapse.updateTagInfo_locationData();
      }
      timelapse.setNewView(adjusted, true);
    });
    viewsync.on('sync time', function(data) {
      //console.log( 'sync time: ' + data.time );
      //var diff = timelapse.getCurrentTime() - data.time;
      //if( Math.abs( diff ) > MAX_TIME_DIFF || data.absolute ) {
      //console.log( 'out of sync by ' + diff + '! seeking..' );
      timelapse.seek(data.time);
      //}
    });
    viewsync.on('sync play', function(data) {
      console.log('sync play: ' + data.play);
      if (data.play)
        timelapse.play();
      else
        timelapse.pause();
    });
  }
}

function viewsync_send_time(absolute) {
  var t = timelapse.getCurrentTime();
  //console.log( 'sending time: ' + t );
  viewsync.emit('time', {
    time: t,
    absolute: absolute
  });
}

// helpers
function get_video_length() {
  return timelapse.getNumFrames() / Number(timelapse.getFps()) * timelapse.getPlaybackRate();
}

