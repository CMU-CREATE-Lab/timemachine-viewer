/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Class for managing the context map map for the timelapse.
 *
 * Dependencies:
 *  org.gigapan.timelapse.Timelapse
 *  jQuery (http://jquery.com/)
 *  Leaflet (http://leafletjs.com/)
 *
 * Copyright 2013 Carnegie Mellon University. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Carnegie Mellon University.
 *
 * Authors:
 *  Paul Dille (pdille@cmucreatelab.org)
 *  Yen-Chia Hsu (legenddolphin@gmail.com)
 *
 */

"use strict";

//
// VERIFY NAMESPACE
//

// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
if (!org) {
  org = {};
} else {
  if (typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if (typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse) {
  org.gigapan.timelapse = {};
} else {
  if (typeof org.gigapan.timelapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

//
// DEPENDECIES
//
if (!org.gigapan.timelapse.Timelapse) {
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.contextMap";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.ContextMap = function(contextMapOptions, timelapse, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //
    var availableTileSources = ["Bing", "Google", "OpenStreetMap", "Custom"];
    var isHyperwall = settings["isHyperwall"];
    var useTouchFriendlyUI = timelapse.useTouchFriendlyUI();
    var defaultUI = timelapse.getDefaultUI();
    var minHeight = isHyperwall ? 450 : 120;
    var minWidth = isHyperwall ? 500 : 160;
    var maxHeight = isHyperwall ? 768 : 380;
    var maxWidth = isHyperwall ? 1024 : 504;
    var startWidth = useTouchFriendlyUI ? 300 : minWidth;
    var startHeight = useTouchFriendlyUI ? 235 : minHeight;
    if ((typeof(contextMapOptions["geometry"]) != "undefined")) {
      if ((typeof(contextMapOptions["geometry"]["width"]) != "undefined")) {
        startWidth = contextMapOptions["geometry"]["width"];
        maxWidth = contextMapOptions["geometry"]["width"] + 100;
      }
      if ((typeof(contextMapOptions["geometry"]["height"]) != "undefined")) {
        startHeight = contextMapOptions["geometry"]["height"];
        maxHeight = contextMapOptions["geometry"]["height"] + 100;
      }
    }
    var showAddressLookup = (typeof(settings["showAddressLookup"]) == "undefined") ? false : settings["showAddressLookup"];
    var contextMapDivId = (typeof(contextMapOptions["contextMapDiv"]) == "undefined") ? "timelapse-contextmap" : contextMapOptions["contextMapDiv"];
    var resizable = (typeof(contextMapOptions["resizable"]) == "undefined") ? true : contextMapOptions["resizable"];
    var showToggleBtn = (typeof(contextMapOptions["showToggleBtn"]) == "undefined") ? true : contextMapOptions["showToggleBtn"];
    var tileType = (availableTileSources.indexOf(contextMapOptions["tileType"]) < 0) ? "Google" : contextMapOptions["tileType"];
    var apiKeys = (typeof (settings["apiKeys"]) == "undefined") ? {} : settings["apiKeys"];
    var uiType = timelapse.getUIType();

    var mapResizeStart = {
      "x": undefined,
      "y": undefined
    };
    var mapGeometry = {
      "width": startWidth,
      "height": startHeight,
      "right": 74,
      "top": 21
    };
    var lastMapGeometry;
    var newestLocation = {
      "lat": undefined,
      "lng": undefined
    };
    var lastLocation = {
      "lat": 99999,
      "lng": 99999
    };
    var videoDivID = timelapse.getVideoDivId();
    var smallMapContainer_width;
    var smallMapContainer_height;
    var smallMapResizer_width;
    var smallMapResizer_height;
    var isMiniMapMinimized = false;
    var zoomOffset;
    var oldMapZoom;
    var leafletTileLayer;
    var googleMapsHybridLayer;
    var customLayers = timelapse.getCustomLayers();
    var materialUI = timelapse.getMaterialUI();
    var isDefaultMiniMapLayer = true;


    // DOM elements
    var smallMapContainer;
    var smallMap;
    var smallMapResizer;
    var $smallMapResizer;
    var $smallMapContainer;
    var $smallMap;
    var contextMap;
    var contextMapBox;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    // Resize the context map (top-right mode)
    var resizeContextMap = function(event) {
      var nowX = event.clientX;
      var nowY = event.clientY;
      var dx = parseInt(mapResizeStart.x - nowX);
      var dy = parseInt(nowY - mapResizeStart.y);
      var newHeight = mapGeometry.height + dy;
      var newWidth = mapGeometry.width + dx;
      // Check max and min size
      if (newHeight > minHeight && newHeight < maxHeight) {
        mapResizeStart.y = nowY;
        mapGeometry.height += dy;
      }
      if (newWidth > minWidth && newWidth < maxWidth) {
        mapResizeStart.x = nowX;
        mapGeometry.width += dx;
      }
      setMiniMapSize(mapGeometry.height, mapGeometry.width);
      // Force map redraw because of container resize
      contextMap.invalidateSize();
    };

    // Set context map size
    var setMiniMapSize = function(newHeight, newWidth, animate, onComplete, callBackOnComplete) {
      if (animate) {
        $smallMapContainer.stop(true, true).animate({
          "height": newHeight + "px",
          "width": newWidth + "px"
        }, {
          duration: 200,
          progress: onComplete,
          complete: function() {
            if (onComplete)
              onComplete();
            if (callBackOnComplete)
              callBackOnComplete();
          }
        });
      } else {
        smallMapContainer.style.height = newHeight + "px";
        smallMapContainer.style.width = newWidth + "px";
      }
    };

    // Load context map
    var setupMiniMapForLeaflet = function() {
      var style;
      var noLabelsStyle;

      if (tileType === "Google") {
        style = [{
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{
            hue: "#000000"
          }, {
            saturation: -100
          }]
        }, {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{
            hue: "#000000"
          }, {
            saturation: -100
          }, {
            lightness: 0
          }]
        }, {
          featureType: 'water',
          elementType: 'labels',
          stylers: [{
            hue: "#000000"
          }, {
            saturation: -100
          }, {
            lightness: 100
          }]
        }, {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{
            hue: "#ffffff"
          }, {
            saturation: -100
          }, {
            lightness: 100
          }]
        }];

        noLabelsStyle = [{
          elementType: "labels",
          stylers: [{
              visibility: "off"
            }]
        }, {
          featureType: "administrative",
          elementType: "geometry",
          stylers: [{
              visibility: "off"
            }]
        }, {
          featureType: "administrative.land_parcel",
          stylers: [{
              visibility: "off"
            }]
        }, {
          featureType: "administrative.neighborhood",
          stylers: [{
              visibility: "off"
            }]
        }, {
          featureType: "poi",
          stylers: [{
              visibility: "off"
            }]
        }, {
          featureType: "road",
          stylers: [{
              visibility: "off"
            }]
        }, {
          featureType: "road",
          elementType: "labels.icon",
          stylers: [{
              visibility: "off"
            }]
        }, {
          featureType: "transit",
          stylers: [{
              visibility: "off"
            }]
        }];

        // Callback when google APIs are loaded
        var googleMapForLeafletCallback = function() {
          var googleAPIScript;
          googleAPIScript = document.createElement('script');
          googleAPIScript.setAttribute('src', UTIL.getRootAppURL() + 'js/leaflet/Google.js');
          googleAPIScript.setAttribute('type', 'text/javascript');
          document.getElementsByTagName('head')[0].appendChild(googleAPIScript);
          googleAPIScript.onload = function() {
            // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
            leafletTileLayer = new L.Google('ROADMAP', {
              mapOptions: {
                styles: style
              }
            });
            googleMapsHybridLayer = new L.Google('HYBRID', {
              mapOptions: {
                styles: noLabelsStyle
              }
            });
            loadContextMapCallback();
            // Create search box
            if (defaultUI && showAddressLookup) {
              defaultUI.createAddressLookupUI();
            }
            // TODO: Is this legacy support still needed? (is used for EarthTime)
            if (typeof (googleMapsLoadedCallback) === "function") {
              googleMapsLoadedCallback();
            }
          };
        };
        UTIL.loadGoogleAPIs(googleMapForLeafletCallback, apiKeys);
      } else if (tileType == "OpenStreetMap") {
        var osmUrl = contextMapOptions["tileUrl"] || 'http://{s}.tile.openstreetmap.org/';
        osmUrl += '/{z}/{x}/{y}.png';
        var osmAttrib = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        leafletTileLayer = new L.TileLayer(osmUrl, {
          attribution: osmAttrib
        });
        loadContextMapCallback();
      } else if (tileType == "Bing") {
        var bingAPIScript = document.createElement('script');
        bingAPIScript.setAttribute('src', UTIL.getRootAppURL() + 'js/leaflet/Bing.js');
        bingAPIScript.setAttribute('type', 'text/javascript');
        document.getElementsByTagName('head')[0].appendChild(bingAPIScript);
        bingAPIScript.onload = function() {
          // Possible types: Aerial, AerialWithLabels, Birdseye, BirdseyeWithLabels, Road
          leafletTileLayer = new L.BingLayer("LfO3DMI9S6GnXD7d0WGs~bq2DRVkmIAzSOFdodzZLvw~Arx8dclDxmZA0Y38tHIJlJfnMbGq5GXeYmrGOUIbS2VLFzRKCK0Yv_bAl6oe-DOc", {
            type: "Road"
          });
          loadContextMapCallback();
        };
      } else if (tileType == "Custom") {
        var tileUrl = contextMapOptions["tileUrl"];
        leafletTileLayer = new L.TileLayer(tileUrl);
        loadContextMapCallback();
      }
    };

    var loadContextMapCallback = function() {
      // Leaflet
      var mapOptions = {
        center: [0, 0],
        zoom: 0,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
        attributionControl: true
      };

      if (uiType == "materialUI") {
        var materialUIOptions = {
          dragging : false,
          scrollWheelZoom: false,
          tap: false,
          touchZoom: false,
          doubleClickZoom: false,
          boxZoom: false
        };
        $.extend(mapOptions, materialUIOptions);
      }

      contextMap = new L.Map(contextMapDivId + "_contextMap", mapOptions);
      contextMap.attributionControl.setPrefix("");
      contextMap.addLayer(leafletTileLayer);

      // Draw the rectangle bounding box on the map
      contextMapBox = L.rectangle([
        [0, 0],
        [0, 0]
      ], {
        color: "rgb(219,48,48)",
        weight: 1
      });
      contextMapBox.addTo(contextMap);

      // Add event listeners for the context map
      if (uiType != "materialUI" && !useTouchFriendlyUI) {
        $smallMapContainer.mousewheel(function(event, delta) {
          if (event.shiftKey) {
            if (delta > 0) {
              timelapse.zoomAbout(1 / 0.999, undefined, undefined, true);
            } else if (delta < 0) {
              timelapse.zoomAbout(0.999, undefined, undefined, true);
            }
          } else {
            if (delta > 0) {
              timelapse.zoomAbout(1 / 0.9, undefined, undefined, true);
            } else if (delta < 0) {
              timelapse.zoomAbout(0.9, undefined, undefined, true);
            }
          }
        }).dblclick(function(event) {
          var $target = $(event.target);
          if ($target.hasClass("contextMapResizer") || $target.hasClass("togglecontextMapBtn"))
            return;
          timelapse.zoomAbout(2, undefined, undefined, true);
        });
        contextMap.on("drag", updateLocation);
      } else if (uiType == "materialUI") {
        $smallMapContainer.addClass("cursorPointer");
        $smallMapContainer.prop("title", "Click to enter Maps mode");
        $smallMapContainer.on("dblclick mousedown", function(e) {
          return false;
        });
        $smallMapContainer.on("click", function(e) {
          if (isDefaultMiniMapLayer) {
            $smallMap.prop("title", "Click to enter Timelapse mode");
            contextMap.addLayer(googleMapsHybridLayer);
            contextMap.removeLayer(leafletTileLayer);
          } else {
            $smallMap.prop("title", "Click to enter Maps mode");
            contextMap.addLayer(leafletTileLayer);
            contextMap.removeLayer(googleMapsHybridLayer);
          }
          isDefaultMiniMapLayer = !isDefaultMiniMapLayer;
          customLayers.toggleGoogleMapLayer(materialUI.handleContextMapUICallback);
        });
      }
      // Create resizer
      if (resizable && !isHyperwall && uiType != "materialUI") {
        smallMapResizer = document.createElement("div");
        $smallMapResizer = $(smallMapResizer);
        $smallMapResizer.addClass("contextMapResizer");
        if (useTouchFriendlyUI)
          $smallMapResizer.addClass("contextMapResizer-touchFriendly");
        smallMapResizer.id = contextMapDivId + "_contextMapResizer";
        smallMapResizer.title = "Drag for resizing. Double click for resetting.";
        $smallMapContainer.append(smallMap, smallMapResizer);
        smallMapResizer_width = $smallMapResizer.width();
        smallMapResizer_height = $smallMapResizer.height();
        smallMapResizer.addEventListener('dblclick', resetContextMapSize, false);
        smallMapResizer.addEventListener('mousedown', function(event) {
          event.stopPropagation();
          mapResizeStart.x = event.clientX;
          mapResizeStart.y = event.clientY;
          document.addEventListener('mousemove', resizeContextMap, false);
          document.addEventListener('mouseup', addContextMapMouseupEvents, false);
          $("body").bind("mouseleave", addContextMapMouseupEvents);
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-resize-context-map');
        }, false);
        contextMap.on("resize", function() {
          contextMap.once('moveend', function(e) {
            timelapse.updateLocationContextUI();
          });
        });
      }
      // Create toggle button
      if (showToggleBtn && !isHyperwall && uiType != "materialUI") {
        var toggleIconClose = useTouchFriendlyUI ? "ui-icon-custom-arrowthick-1-ne" : "ui-icon-arrowthick-1-ne";
        var toggleIconOpen = useTouchFriendlyUI ? "ui-icon-custom-arrowthick-1-sw" : "ui-icon-arrowthick-1-sw";
        $smallMapContainer.append('<button class="toggleContextMapBtn" title="Toggle context map">Toggle</button>');
        var $toggleContextMapBtn = $(".toggleContextMapBtn");
        $toggleContextMapBtn.button({
          icons: {
            primary: toggleIconClose
          },
          text: false
        }).click(function() {
          toggleContextMapSize();
          var $icon = $(this).children(".ui-icon");
          if ($icon.hasClass(toggleIconOpen)) {
            $toggleContextMapBtn.button({
              icons: {
                primary: toggleIconClose
              },
              text: false
            }).children(".ui-icon").css("margin-left", "-8px");
            UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-show-context-map');
          } else if ($icon.hasClass(toggleIconClose)) {
            $toggleContextMapBtn.button({
              icons: {
                primary: toggleIconOpen
              },
              text: false
            }).children(".ui-icon").css("margin-left", "-8px");
            UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-hide-context-map');
          }
        }).css({
          position: "absolute",
          right: "0px",
          top: "0px"
        });

        if (useTouchFriendlyUI)
          $toggleContextMapBtn.addClass("ui-custom-button");
      }
      // Compute the zoom offset
      var maxView = timelapse.getView();
      maxView.scale = timelapse.getMaxScale();
      var maxViewBound = timelapse.pixelCenterToLatLngBoundingBoxView(maxView).bbox;
      var bounds = [
        [maxViewBound.sw.lat, maxViewBound.sw.lng],
        [maxViewBound.ne.lat, maxViewBound.ne.lng]
      ];
      contextMap.once('moveend', function(e) {
        if (typeof(oldMapZoom) !== "undefined") return;
        var mapZoom = contextMap.getZoom();
        var maxViewerZoom = timelapse.scaleToZoom(timelapse.getMaxScale());
        oldMapZoom = mapZoom;
        // Google maps starts counting its zoom level at 1, so we need to add 1
        // When using Leaflet, we need to use <= 0.4
        zoomOffset = mapZoom - maxViewerZoom + 0.3;
        // Zoom back to the initial view
        timelapse.updateLocationContextUI();
      });
      contextMap.fitBounds(bounds);
    };

    // Add mouse events for resize
    var addContextMapMouseupEvents = function() {
      mapResizeStart.x = undefined;
      mapResizeStart.y = undefined;
      document.removeEventListener('mousemove', resizeContextMap);
      document.removeEventListener('mouseup', addContextMapMouseupEvents);
      $("body").unbind("mouseleave", addContextMapMouseupEvents);
    };

    // Update map view
    var updateLocation = function() {
      var mapLatLng = contextMap.getCenter();
      newestLocation.lat = mapLatLng.lat;
      newestLocation.lng = mapLatLng.lng;
      if (needLocationUpdate() === true) {
        moveView_fromContextMap();
      }
    };

    // Check location update
    var needLocationUpdate = function() {
      var roundTo = 100000;
      var last_lat = Math.round(lastLocation.lat * roundTo) / roundTo;
      var new_lat = Math.round(newestLocation.lat * roundTo) / roundTo;
      var last_lng = Math.round(lastLocation.lng * roundTo) / roundTo;
      var new_lng = Math.round(newestLocation.lng * roundTo) / roundTo;
      if (last_lat != new_lat || last_lng != new_lng)
        return true;
      else
        return false;
    };

    // Move the view
    var moveView_fromContextMap = function() {
      var moveLatLng = $.extend({}, newestLocation);
      lastLocation = moveLatLng;
      // Need to get the projection dynamically when the viewer size changes
      var movePoint = timelapse.getProjection().latlngToPoint(moveLatLng);
      movePoint.scale = timelapse.getView().scale;
      timelapse.warpTo(movePoint);
    };

    // Create small context map DOM elements
    var createMiniMapElements = function() {
      // Create div elements
      smallMapContainer = document.createElement("div");
      smallMap = document.createElement("div");
      // jQuery variables
      $smallMapContainer = $(smallMapContainer);
      $smallMap = $(smallMap);
      // Add class for css
      $smallMapContainer.addClass("contextMapContainer");
      $smallMap.addClass("contextMap");
      // Set id
      smallMapContainer.id = contextMapDivId + "_contextMapContainer";
      smallMap.id = contextMapDivId + "_contextMap";
      // Append elements
      $smallMapContainer.append(smallMap);
      $("#" + videoDivID).append(smallMapContainer);
      // Set geometry
      $smallMapContainer.css({
        "width": mapGeometry.width + "px",
        "height": mapGeometry.height + "px"
      });
      setContextMapShadow(true);
      // Set position
      if (isHyperwall) {
        if (fields.mapPosition == "topRight") {
          $smallMapContainer.css({
            "right": mapGeometry.right + "px",
            "top": mapGeometry.top + "px"
          });
        } else if (fields.mapPosition == "topLeft") {
          $smallMapContainer.css({
            "left": mapGeometry.right + "px",
            "top": mapGeometry.top + "px"
          });
        } else if (fields.mapPosition == "bottomLeft") {
          $smallMapContainer.css({
            "left": mapGeometry.right + "px",
            "bottom": mapGeometry.top + "px"
          });
        } else {
          $smallMapContainer.css({
            "right": mapGeometry.right + "px",
            "bottom": mapGeometry.top + "px"
          });
        }
      } else {
        $smallMapContainer.css({
          "right": mapGeometry.right + "px",
          "top": mapGeometry.top + "px"
        });
      }
      // Get attribute
      smallMapContainer_width = $smallMapContainer.width();
      smallMapContainer_height = $smallMapContainer.height();
    };

    var setContextMapShadow = function(flag) {
      if (flag === true) {
        $smallMapContainer.css({
          "box-shadow": "2px 2px 3px rgba(0,0,0,0.3)",
          "border": "1px solid #656565"
        });
      } else {
        $smallMapContainer.css({
          "box-shadow": "0px 0px 0px rgba(0,0,0,0.3)",
          "border": "1px solid transparent"
        });
      }
    };

    var setContextMap = function(latlngCenter) {
      if (isMiniMapMinimized === false) {
        if (!latlngCenter || latlngCenter.lat === undefined || latlngCenter.lng === undefined || zoomOffset === undefined) {
          return;
        }
        var extendRatio = ((mapGeometry.width + mapGeometry.height) / (startHeight + startWidth) || 0);
        if (extendRatio >= 1) {
          extendRatio *= 0.6;
        } else {
          extendRatio *= -0.5;
        }
        var newZoom = Math.floor((timelapse.getCurrentZoom() + zoomOffset) + extendRatio);
        if (oldMapZoom != newZoom) {
          oldMapZoom = newZoom;
        }
        contextMap.setView([latlngCenter.lat, latlngCenter.lng], newZoom);
      }
    };

    var setMiniMapLocation = function(latlngNE, latlngSW) {
      if (!isHyperwall) {
        var bounds = [
          [latlngSW.lat, latlngSW.lng],
          [latlngNE.lat, latlngNE.lng]
        ];
        contextMapBox.setBounds(bounds);
      }
    };

    var resetContextMapSize = function() {
      if (mapGeometry.height != minHeight || mapGeometry.width != minWidth) {
        lastMapGeometry = $.extend({}, mapGeometry);
        mapGeometry.height = startHeight;
        mapGeometry.width = startWidth;
      } else {
        if (lastMapGeometry !== undefined)
          mapGeometry = $.extend({}, lastMapGeometry);
      }
      setMiniMapSize(mapGeometry.height, mapGeometry.width, true, function() {
        // Force map redraw because of container resize
        contextMap.invalidateSize();
      });
    };

    var toggleContextMapSize = function() {
      if (mapGeometry.height != 20 || mapGeometry.width != 20) {
        lastMapGeometry = $.extend({}, mapGeometry);
        mapGeometry.height = 20;
        mapGeometry.width = 20;
        isMiniMapMinimized = true;
      } else {
        $smallMap.show();
        setContextMapShadow(true);
        isMiniMapMinimized = false;
        if (lastMapGeometry !== undefined) {
          mapGeometry = $.extend({}, lastMapGeometry);
        }
      }
      var callBackOnComplete = function() {
        if (isMiniMapMinimized === true) {
          $smallMap.hide();
          setContextMapShadow(false);
        }
      };
      setMiniMapSize(mapGeometry.height, mapGeometry.width, true, function() {
        // Force map redraw because of container resize
        contextMap.invalidateSize();
      }, callBackOnComplete);
    };



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //

    var setMiniMap = function(bbox, latlngCenter) {
      if (!leafletTileLayer) return;
      var projection = timelapse.getProjection();
      var latlngNE = projection.pointToLatlng({
        "x": bbox.xmin,
        "y": bbox.ymin
      });
      var latlngSW = projection.pointToLatlng({
        "x": bbox.xmax,
        "y": bbox.ymax
      });
      setContextMap(latlngCenter);
      setMiniMapLocation(latlngNE, latlngSW);
    };
    this.setMiniMap = setMiniMap;



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    createMiniMapElements();
    setupMiniMapForLeaflet();
  };
})();
