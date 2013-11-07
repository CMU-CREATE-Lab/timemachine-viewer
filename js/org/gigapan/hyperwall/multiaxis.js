// multi-axis input device handling

var NAV_SENSITIVITY = 0.005;
var NAV_GUTTER_VALUE = 0.06;
var NAV_xMotion = 0;
var NAV_yMotion = 0;
var NAV_zoom = 0;

// Update view from MultiAxis Input
function updateViewFromMultiAxis () {
  var translationSpeedConstant = 20;
  var scalingConstant = 0.96;
  var view = timelapse.getView();
  var dirty = false;
  
  /// Horizontal Motion
  if(Math.abs(NAV_xMotion) > NAV_GUTTER_VALUE) {
    view.x = Math.max(0, Math.min(timelapse.getPanoWidth(), view.x + (NAV_xMotion * translationSpeedConstant) / view.scale));
    dirty = true;
  }
  
  // Vertical Motion
  if(Math.abs(NAV_yMotion) > NAV_GUTTER_VALUE) {
    view.y = Math.max(0, Math.min(timelapse.getPanoHeight(), view.y + (NAV_yMotion * translationSpeedConstant) / view.scale));
    dirty = true;
	}
  
  // Zooming in/out
  if(NAV_zoom > NAV_GUTTER_VALUE) {
    view.scale = timelapse.limitScale(view.scale*(scalingConstant + (1-scalingConstant)*(1-NAV_zoom)));
    dirty = true;
	}
  else if(NAV_zoom < -NAV_GUTTER_VALUE) {
    view.scale = timelapse.limitScale(view.scale/(scalingConstant + (1-scalingConstant)*(1+NAV_zoom)));
    dirty = true;
  }
  
  if(dirty) {
    //console.log(view);
    timelapse.warpTo(view);
  }
}

if (fields.master) {
  var multiaxis = io.connect('/multiaxis');
  var updateInterval;
  multiaxis.on('connect',function() {
               updateInterval = setInterval(updateViewFromMultiAxis,30);
               console.log("setting interval");
               });
  
  
  
  multiaxis.on('state',function(data) {
               //console.log('multiaxis abs: ' + data.abs);
               
               var value;
               var dirty = false;
               for( var axis in data.abs ) {
               switch(axis) {
               case '3':
               value = data.abs[axis];
               NAV_yMotion = value * NAV_SENSITIVITY * -4;
               break;
               case '5':
               value = data.abs[axis];
               NAV_xMotion = value * NAV_SENSITIVITY * 2;
               break;
               case '1':
               value = data.abs[axis];
               NAV_zoom = value * NAV_SENSITIVITY;
               break;
               }
               }
               if (dirty) {
               console.log( 'updating view from multiaxis state' );
               // XXX
               }
               });
  
  multiaxis.on('disconnect',function() {
               clearInterval(updateInterval);
               console.log('MultiAxis disconnected');
               });
}
