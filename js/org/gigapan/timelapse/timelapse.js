//======================================================================================================================
// Class for managing a timelapse.
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

(function()
   {
      var UTIL = org.gigapan.Util;

      org.gigapan.timelapse.Timelapse = function(url, videoDivName, optionalInfo)
         {
            var videoset = new org.gigapan.timelapse.Videoset(videoDivName);
            var videoDiv = document.getElementById(videoDivName);
            var tiles = {};
            var panoWidth = 0;
            var panoHeight = 0;
            var viewportWidth = 0;
            var viewportHeight = 0;
            var tileWidth = 0;
            var tileHeight = 0;
            var frames = 0;
            var maxLevel = 0;
            var playbackRate = .5;
            var view = null;
            var targetView = null;

            // levelThreshold sets the quality of display by deciding what level of tile to show for a given level of zoom:
            //
            //  1.0: select a tile that's shown between 50% and 100% size  (never supersample)
            //  0.5: select a tile that's shown between 71% and 141% size
            //  0.0: select a tile that's shown between 100% and 200% size (never subsample)
            // -0.5: select a tile that's shown between 141% and 242% size (always supersample)
            // -1.0: select a tile that's shown between 200% and 400% size (always supersample)
            var levelThreshold = 0;

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Public methods
            //

            // TODO: fix this
            this.handleWindowClose = function()
               {
                  /*num_active_removed = 0;
                   num_inactive_removed = 0;

                   for (id in g_videoset.inactiveVideos) {
                   var candidate = g_videoset.inactiveVideos[id];
                   if (candidate.readyState >= 4 && candidate.seeking == false) {
                   video = candidate;
                   delete g_videoset.inactiveVideos[id];
                   num_inactive_removed += 1;
                   }
                   }

                   for (id in g_videoset.activeVideos) {
                   var candidate = g_videoset.activeVideos[id];
                   if (candidate.readyState >= 4 && candidate.seeking == false) {
                   video = candidate;
                   delete g_videoset.activeVideos[id];
                   num_inactive_removed += 1;
                   }
                   }

                   alert("num active removed: " + num_active_removed + " " + "num inactive removed: " + num_inactive_removed);*/
               };

            this.handleKeydownEvent = function(event)
               {
                  UTIL.log('keydown ' + event.which);
                  var translationSpeedConstant = 20;
                  var translation = translationSpeedConstant / view.scale;
                  switch (event.which)
                  {
                     case 37:  targetView.x -= translation;  break;  // left arrow
                     case 39:  targetView.x += translation;  break;  // right arrow
                     case 38:  targetView.y -= translation;  break;  // up arrow
                     case 40:  targetView.y += translation;  break;  // down arrow
                     case 189: targetView.scale *= .9;       break;  // minus
                     case 187: targetView.scale /= .9;       break;  // plus
                     case 80:  // P
                        if (_isPaused())
                           {
                           _play();
                           }
                        else
                           {
                           _pause();
                           }
                        return;
                  }
                  setTargetView(targetView);
               };

            this.handleKeyupEvent = function()
               {
               };

            this.handleMousescrollEvent = function(event)
               {
                  UTIL.log('mousescroll delta  ' + event.wheelDelta);
                  if (event.wheelDelta > 0)
                     {
                     zoomAbout(1/.9, event.x, event.y);
                     }
                  else if (event.wheelDelta < 0)
                     {
                     zoomAbout(.9, event.x, event.y);
                     }
               };

            var _warpTo = function(newView)
               {
                  setTargetView(newView);
                  view.x = targetView.x;
                  view.y = targetView.y;
                  view.scale = targetView.scale;
                  refresh();
               };
            this.warpTo = _warpTo;

            var _homeView = function()
               {
                  return computeViewFit({xmin:0, ymin:0, xmax:panoWidth, ymax:panoHeight});
               };
            this.homeView = _homeView;

            this.getBoundingBoxForCurrentView = function()
               {
                  return computeBoundingBox(view);
               };

            this.warpToBoundingBox = function(bbox)
               {
                  this.warpTo(computeViewFit(bbox));
               };

            this.resetPerf = function()
               {
                  videoset.resetPerf();
               };

            this.getPerf = function()
               {
                  return videoset.getPerf();
               }
              
            ///////////////////////////
            // Timelapse video control
            //

            var _isPaused = function()
               {
                  return videoset.isPaused();
               };
            this.isPaused = _isPaused;

            var _pause = function()
               {
                  videoset.pause();
               };
            this.pause = _pause;

            this.seek = function(t)
               {
                  videoset.seek(t);
               };

            this.setPlaybackRate = function(rate)
               {
                  videoset.setPlaybackRate(rate);
               };

            this.getPlaybackRate = function()
               {
                  return videoset.getPlaybackRate();
               };

            this.getVideoPosition = function()
               {
                  return videoset.getVideoPosition();
               };

            var _play = function()
               {
                  videoset.play();
               };
            this.play = _play;

            this.setStatusLoggingEnabled = function(enable)
               {
                  videoset.setStatusLoggingEnabled(enable);
               };

            this.setNativeVideoControlsEnabled = function(enable)
               {
                  videoset.setNativeVideoControlsEnabled(enable);
               };

            this.getNumFrames = function()
               {
                  return frames;
               };

            this.getFps = function()
               {
                 return videoset.getFps();
               };

            this.addTimeChangeListener = function(listener)
               {
                  videoset.addSyncListener(listener);
               };

            this.removeTimeChangeListener = function(listener)
               {
                  videoset.removeSyncListener(listener);
               };

            this.getCurrentTime = function()
               {
                  return videoset.getCurrentTime();
               };

            this.movePos = function(dir)
               {
                  var translationSpeedConstant = 20;
                  var translation = translationSpeedConstant / view.scale;

                  if (dir == "left") targetView.x -= translation;
                  else if (dir == "right") targetView.x += translation;
                  else if (dir == "up") targetView.y -= translation;
                  else if (dir == "down") targetView.y += translation;

                  setTargetView(targetView);
               };

            this.setScale = function(val)
               {
                  targetView.scale = val;
                  setTargetView(targetView);
               };
               
            this.setScaleFromSlider = function(val)
               {
                  targetView.scale = _zoomSliderToViewScale(val);
                  setTargetView(targetView);
               };
               
            var _getMinScale = function()
               {
                  return _homeView().scale * .5;
               };

            this.getMinScale = _getMinScale;

            var _getMaxScale = function()
               {
                  return 2;
               };

            this.getMaxScale = _getMaxScale;

            this.getDefaultScale = function()
               {
                  return _homeView().scale;
               };

            this.updateDimensions = function()
               {
                  readVideoDivSize();
               };

            var _viewScaleToZoomSlider = function(value)
               {
                  var tmpValue = Math.sqrt((value - _getMinScale()) / (_getMaxScale() - _getMinScale()));
                  var newValue = (1/(Math.log(2)))*(Math.log(tmpValue+1));
                  return newValue;
               }
            this.viewScaleToZoomSlider = _viewScaleToZoomSlider;

            var _zoomSliderToViewScale = function(value)
               {
                  newValue = 2*_getMinScale() - _getMaxScale() - _getMinScale()*Math.exp(value*Math.log(2)) + _getMaxScale()*Math.exp(value*Math.log(2));
                  return newValue;
               }
            this.zoomSliderToViewScale = _zoomSliderToViewScale;

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Private methods
            //

            var handleMousedownEvent = function(event)
               {
                  var lastEvent = event;
                  var saveMouseMove = document.onmousemove;
                  var saveMouseUp = document.onmouseup;
                  UTIL.log("mousedown");
                  videoDiv.style.cursor = "url('css/cursors/closedhand.cur')";
                  document.onmousemove = function(event)
                     {
                        UTIL.log("mousemove");
                        targetView.x += (lastEvent.pageX - event.pageX) / view.scale;
                        targetView.y += (lastEvent.pageY - event.pageY) / view.scale;
                        setTargetView(targetView);
                        lastEvent = event;
                        return false;
                     };
                  document.onmouseup = function()
                     {
                        UTIL.log("mouseup");
                        videoDiv.style.cursor = "url('css/cursors/openhand.cur')";
                        document.onmousemove = saveMouseMove;
                        document.onmouseup = saveMouseUp;
                     };
                  return false;
               };

            var zoomAbout = function(zoom, x, y)
               {
                  var newScale = limitScale(targetView.scale * zoom);
                  var actualZoom = newScale / targetView.scale;
                  targetView.x += 1 * (1-1/actualZoom) * (event.x - viewportWidth*.5) / targetView.scale;
                  targetView.y += 1 * (1-1/actualZoom) * (event.y - viewportHeight*.5) / targetView.scale;
                  targetView.scale = newScale;
                  setTargetView(targetView);
                  //make the scale map to the zoom slider range
                  $("#slider-vertical")['slider']("option", "value", _viewScaleToZoomSlider(targetView.scale));
               };

            var handleDoubleClickEvent = function(event)
               {
                  UTIL.log('double click');
                  zoomAbout(2., event.x, event.y);
               };

            var limitScale = function(scale)
               {
                  return Math.max(_getMinScale(), Math.min(_getMaxScale(), scale));
               };
                  
            var setTargetView = function(newView)
               {
                  var tempView = {};
                  tempView.scale = limitScale(newView.scale);
                  tempView.x = Math.max(0, Math.min(panoWidth, newView.x));
                  tempView.y = Math.max(0, Math.min(panoHeight, newView.y));
                  targetView.x = tempView.x;
                  targetView.y = tempView.y;
                  targetView.scale = tempView.scale;
                  //  if (!g_videoset.animate_interval) g_videoset.animate_interval = setInterval(timelapse__animate, 100);
                  // TEMPORARY
                  view.x = targetView.x;
                  view.y = targetView.y;
                  view.scale = targetView.scale;

                  refresh();
               };

            var computeViewFit = function(bbox)
               {
                  var scale = Math.min(viewportWidth / (bbox.xmax - bbox.xmin),
                                       viewportHeight / (bbox.ymax - bbox.ymin));
                  return {x:.5 * (bbox.xmin + bbox.xmax), y:.5 * (bbox.ymin + bbox.ymax), scale: scale};
               };

            var computeBoundingBox = function(theView)
               {
                  var halfWidth = .5 * viewportWidth / theView.scale;
                  var halfHeight = .5 * viewportHeight / theView.scale;
                  return {xmin:theView.x - halfWidth, xmax:theView.x + halfWidth, ymin:theView.y - halfHeight, ymax:theView.y + halfHeight};
               };

            var onPanoLoadSuccessCallback = function(data, status, xhr)
               {
                  UTIL.log('onPanoLoadSuccessCallback(' + UTIL.dumpObject(data) + ', ' + status + ', ' + xhr + ')');
                  panoWidth = data['width'];
                  panoHeight = data['height'];
                  tileWidth = data['tile_width'];
                  tileHeight = data['tile_height'];
                  videoset.setFps(data['fps']);
                  frames = data['frames'];

                  // Compute max level #
                  for (maxLevel = 1;
                       (tileWidth << maxLevel) < panoWidth || (tileHeight << maxLevel) < panoHeight;
                       maxLevel++)
                     {
                     }

                  readVideoDivSize();
                  _warpTo(_homeView());
               };

            var readVideoDivSize = function()
               {
                  viewportWidth = parseInt(videoDiv.style.width);
                  viewportHeight = parseInt(videoDiv.style.height);
               };

            var refresh = function()
               {
                  UTIL.log('vvvvvvvvvvvvvvvvvvvvvvvv start refresh');
                  logReadyVideos();
                  
                  for (var tileidx in tiles) tiles[tileidx].needed = false;

                  var tileidxs = computeNeededTiles(view);
                  var currentLevel = scale2level(view.scale);
                  // Add new tiles, hold on to too-low-res tiles still needed
                  for (var tileidx1 in tileidxs)
                     {
                     var tile = tiles[tileidx1];
                     if (!tile)
                        {
                        UTIL.log('need ' + dumpTileidx(tileidx1) + ' from ' + getTileidxUrl(tileidx1));
                        tile = addTileidx(tileidx1);
                        }
                     tile.needed = true;
                     if (!tile.video.ready) needFirstAncestor(tileidx1);
                     }

                  // Sort ready, higher-level tiles according to level
                  // TODO: only consider on-screen tiles
                  var highLevelTileidxs = [];
                  for (var tileidx in tiles)
                     {
                     if (getTileidxLevel(tileidx) > currentLevel && tiles[tileidx].video.ready)
                        {
                        highLevelTileidxs.push(tileidx);
                        }
                     }
                  highLevelTileidxs = highLevelTileidxs.sort();

                  // Look for higher-level tiles we need to keep for now
                  for (var i = 0; i < highLevelTileidxs.length; i++)
                     {
                     var tileidx = highLevelTileidxs[i];
                     var ancestoridx = findFirstNeededAncestor(tileidx);
                     if (ancestoridx != false && !tiles[ancestoridx].video.ready)
                        {
                        UTIL.log("Need " + dumpTileidx(tileidx) + " because " + dumpTileidx(ancestoridx) + " isn't ready");
                        tiles[tileidx].needed = true;
                        }
                     }

                  // Delete tiles we no longer need and reposition the ones we need
                  for (var tileidx in tiles)
                     {
                     if (!tiles[tileidx].needed) deleteTileidx(tileidx);
                     else repositionTileidx(tileidx);
                     }
                  logReadyVideos();
                  UTIL.log('^^^^^^^^^^^^^^^^^^^^^^^^ end refresh');
               };

            var logReadyVideos = function()
               {
                  var levelCounts=[];
                  for (var tileidx in tiles)
                     {
                     if (tiles[tileidx].video.ready)
                        {
                        levelCounts[getTileidxLevel(tileidx)] = 1 + (levelCounts[getTileidxLevel(tileidx)] || 0);
                        }
                     }
                  var msg = "level counts:";
                  for (var i = 0; i < levelCounts.length; i++)
                     {
                     if (levelCounts[i]) msg += " " + i + ":" + levelCounts[i];
                     }
                  if (levelCounts.length == 0) msg += "**************************************************************************";
                  UTIL.log(msg);
                  //msg = "ready tiles:";
                  //for (var tileidx in tiles)
                  //   {
                  //   if (tiles[tileidx].video.ready)
                  //      {
                  //      msg += " " + dumpTileidx(tileidx);
                  //      }
                  //   }
                  //UTIL.log(msg);
               };

            var needFirstAncestor = function(tileidx)
               {
                  //UTIL.log("need ancestor for " + dumpTileidx(tileidx));
                  var a = tileidx;
                  while (a)
                     {
                     a = getTileidxParent(a);
                     //UTIL.log("checking " + dumpTileidx(a) + ": present=" + !!tiles[a] + ", ready=" + (tiles[a]?tiles[a].video.ready:"n/a"));
                     
                     if (tiles[a] && tiles[a].video.ready)
                        {
                        tiles[a].needed=true;
                        //UTIL.log("need ancestor " + dumpTileidx(tileidx) + ": " + dumpTileidx(a));
                        return;
                        }
                     }
                  //UTIL.log("need ancestor " + dumpTileidx(tileidx) + ": none found");
               }

            var findFirstNeededAncestor = function(tileidx)
               {
                  var a = tileidx;
                  while (a)
                     {
                     a = getTileidxParent(a);
                     if (tiles[a] && tiles[a].needed) return a;
                     }
                  return false;
               }

            var addTileidx = function(tileidx)
               {
                  if (tiles[tileidx])
                     {
                     UTIL.error('addTileidx(' + dumpTileidx(tileidx) + '): already loaded');
                     return;
                     }
                  var url = getTileidxUrl(tileidx);
                  var geom = tileidxGeometry(tileidx);
                  UTIL.log("adding tile " + dumpTileidx(tileidx) + " from " + url + " and geom = (left:" + geom['left'] + " ,top:" + geom['top'] + ", width:" + geom['width'] + ", height:" + geom['height'] + ")");
                  var video = videoset.addVideo(url, geom);

                  return tiles[tileidx] = {video:video};
               };

            var deleteTileidx = function(tileidx)
               {
                  var tile = tiles[tileidx];
                  if (!tile)
                     {
                     UTIL.error('deleteTileidx(' + dumpTileidx(tileidx) + '): not loaded');
                     return;
                     }
                  UTIL.log("removing tile " + dumpTileidx(tileidx) + " ready=" + tile.video.ready);

                  videoset.deleteVideo(tile.video);
                  delete tiles[tileidx];
               };

            var getTileidxUrl = function(tileidx)
               {
                  var shardIndex = (getTileidxRow(tileidx) % 2) * 2 + (getTileidxColumn(tileidx) % 2);
                  var urlPrefix = url.replace("//", "//t" + shardIndex + ".");
                  return urlPrefix + getTileidxPath(tileidx) + ".mp4";
               };

            var computeNeededTiles = function(theView)
               {
                  var level = scale2level(theView.scale);
                  var bbox = computeBoundingBox(theView);
                  var tilemin = tileidxAt(level, Math.max(0, bbox.xmin), Math.max(0, bbox.ymin));
                  var tilemax = tileidxAt(level, Math.min(panoWidth - 1, bbox.xmax), Math.min(panoHeight - 1, bbox.ymax));
                  UTIL.log("needed tiles " + dumpTileidx(tilemin) + " to " + dumpTileidx(tilemax));
                  var tiles = [];
                  for (var r = getTileidxRow(tilemin); r <= getTileidxRow(tilemax); r++)
                     {
                     for (var c = getTileidxColumn(tilemin); c <= getTileidxColumn(tilemax); c++)
                        {
                        var tileidx1 = tileidxCreate(level, c, r);
                        var tileCtr = tileidxCenter(tileidx1);
                        var distSq = (tileCtr.x - theView.x) * (tileCtr.x - theView.x) + (tileCtr.y - theView.y) * (tileCtr.y - theView.y);
                        tiles.push({distSq:distSq, tileidx:tileidx1});
                        }
                     }
                  tiles.sort(function(a, b)
                                {
                                   return a['distSq'] - b['distSq'];
                                });
                  var tileidxs = {};
                  for (var i in tiles)
                     {
                     var tileidx = tiles[i].tileidx;
                     tileidxs[tileidx] = tileidx;
                     }
                  return tileidxs;
               };

            var tileidxAt = function(level, x, y)
               {
                  var ret = tileidxCreate(level,
                                           Math.floor(x / (tileWidth << (maxLevel - level))),
                                           Math.floor(y / (tileHeight << (maxLevel - level))));
                  //UTIL.log('tileidxAt(' + x + ',' + y + ',' + level + ')=' + dumpTileidx(ret));
                  return ret;
               };

            var scale2level = function(scale)
               {
                  // Minimum level is 0, which has one tile
                  // Maximum level is maxLevel, which is displayed 1:1 at scale=1
                  var idealLevel = Math.log(scale) / Math.log(2) + maxLevel;
                  var selectedLevel = Math.floor(idealLevel + levelThreshold);
                  selectedLevel = Math.max(selectedLevel, 0);
                  selectedLevel = Math.min(selectedLevel, maxLevel);
                  //UTIL.log('scale2level('+scale+'): idealLevel='+idealLevel+', ret='+selectedLevel);
                  return selectedLevel;
               };

            var tileidxCenter = function(t)
               {
                  var levelShift = maxLevel - getTileidxLevel(t);
                  return {
                     x: (getTileidxColumn(t) + .5) * (tileWidth << levelShift),
                     y: (getTileidxRow(t) + .5) * (tileHeight << levelShift)
                  };
               };

            var tileidxGeometry = function(tileidx)
               {
                  var levelShift = maxLevel - getTileidxLevel(tileidx);
                  var tileWidthTemp = tileWidth << levelShift;
                  var tileHeightTemp = tileHeight << levelShift;

                  // Calculate left, right, top, bottom, rounding to nearest pixel;  avoid gaps between tiles.
                  var left = Math.round(view.scale * (getTileidxColumn(tileidx) * tileWidthTemp - view.x) + viewportWidth * .5);
                  var right = Math.round(view.scale * ((getTileidxColumn(tileidx) + 1) * tileWidthTemp - view.x) + viewportWidth * .5);
                  //if (!tile.loaded) { left = -10000; }
                  var top = Math.round(view.scale * (getTileidxRow(tileidx) * tileHeightTemp - view.y) + viewportHeight * .5);
                  var bottom = Math.round(view.scale * ((getTileidxRow(tileidx) + 1) * tileHeightTemp - view.y) + viewportHeight * .5);

                  return {left:left, top:top, width:(right - left), height:(bottom - top)};
               };

            var repositionTileidx = function(tileidx)
               {
                  var tile = tiles[tileidx];
                  if (!tile)
                     {
                     UTIL.error('repositionTileidx(' + dumpTileidx(tileidx) + '): tile does not exist');
                     return;
                     }
                  //UTIL.log('repositionTileidx('+dumpTileidx(tileidx)+')');

                  videoset.repositionVideo(tile['video'], tileidxGeometry(tileidx));
               };

            this.writeStatusToLog = function()
               {
                  videoset.writeStatusToLog();
               };
            this.getTiles = function() { return tiles; }

            ///////////////////////////
            // Tile index
            //

            // Represent tile coord as a 31-bit integer so we can use it as an index
            // l:4 (0-15)   r:13 (0-8191)  c:14 (0-16383)
            // 31-bit representation
            //
            var tileidxCreate = function(l, c, r)
               {
                  return (l << 27) + (r << 14) + c;
               };

            var getTileidxLevel = function(t)
               {
                  return t >> 27;
               };

            var getTileidxRow = function(t)
               {
                  return 8191 & (t >> 14);
               };

            var getTileidxColumn = function(t)
               {
                  return 16383 & t;
               };

            var getTileidxParent = function(t)
               {
                  return tileidxCreate(getTileidxLevel(t)-1, getTileidxColumn(t)>>1, getTileidxRow(t)>>1);
               };

            var dumpTileidx = function(t)
               {
                  return "{l:" + getTileidxLevel(t) + ",c:" + getTileidxColumn(t) + ",r:" + getTileidxRow(t) + "}";
               };

            var getTileidxPath = function(t)
               {
                  var name = "r";
                  for (var pos = getTileidxLevel(t) - 1; pos >= 0; pos--)
                     {
                     // Append 0-3 depending on bits from col and row
                     name += (1 & (getTileidxColumn(t) >> pos)) + 2 * (1 & (getTileidxRow(t) >> pos));
                     }
                  var dir = '';
                  for (var i = 0; i < name.length - 3; i += 3)
                     {
                     dir += name.substr(i, 3) + "/";
                     }
                  return dir + name;
               };

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Constructor code
            //

            view = _homeView();
            targetView = view;
            UTIL.log("playback rate is " + playbackRate);
            UTIL.log('Timelapse("' + url + '")');
            videoDiv['onmousedown'] = handleMousedownEvent;
            videoDiv['ondblclick'] = handleDoubleClickEvent;

            if (optionalInfo)
               {
               onPanoLoadSuccessCallback(optionalInfo, "", "");
               }
            else
               {
               $.ajax({url:url + 'r.json', dataType: 'json', success: onPanoLoadSuccessCallback});  // TODO: move this to index.html
               }

         };
   })();
