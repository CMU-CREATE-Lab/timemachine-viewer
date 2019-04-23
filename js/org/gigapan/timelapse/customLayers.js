/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Class for managing layers
 *
 * Dependencies:
 *  org.gigapan.timelapse.Timelapse
 *  jQuery (http://jquery.com/)
 *
 * Copyright 2019 Carnegie Mellon University. All rights reserved.
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
 *  Paul Dille (pdille@andrew.cmu.edu)
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
  if ( typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if ( typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse) {
  org.gigapan.timelapse = {};
} else {
  if ( typeof org.gigapan.timelapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

//
// DEPENDENCIES
//
if (!org.gigapan.timelapse.Timelapse) {
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.CustomLayers";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  org.gigapan.timelapse.CustomLayers = function(timelapse, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //

    // Objects
    var UTIL = org.gigapan.Util;
    var googleMapsCenterViewFromToggle;

    // DOM elements
    var googleMapLayer;
    var $staticBaseLayerMap;

    // Flags
    var keepOriginalTimelapseViewFromToggle = true;
    var timelapseWasPlayingBeforeLayerToggle = false;
    var isGoogleMapLayerVisible = false;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private Methods
    //

    var createGoogleMapsStaticLayer = function() {
      $staticBaseLayerMap = $("<div id='static_map_base_layer'></div>");
      $("#timeMachine_timelapse_dataPanes").append($staticBaseLayerMap);
    };

    var didOnce = false;

    var initializeGoogleMapsStaticLayer = function() {
      createGoogleMapsStaticLayer();
      var startView = timelapse.pixelCenterToLatLngCenterView(timelapse.getView());
      googleMapLayer = new google.maps.Map(document.getElementById('static_map_base_layer'), {
        center: {lat: startView.center.lat, lng: startView.center.lng},
        zoom: startView.zoom,
        maxZoom: 14,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy'
      });

      google.maps.event.addListener(googleMapLayer, 'center_changed', function() {
        if (!didOnce && isGoogleMapLayerVisible) {
          didOnce = true;
          google.maps.event.addListenerOnce(googleMapLayer, 'idle', function() {
            didOnce = false;
            setTimelapseViewFromCurrentGoogleMapsView();
          });
        }
      });

      google.maps.event.addListener(googleMapLayer, 'zoom_changed', function() {
        if (isGoogleMapLayerVisible) {
          setTimelapseViewFromCurrentGoogleMapsView();
        }
      });

      google.maps.event.addListener(googleMapLayer, 'idle', function() {
        if (googleMapsCenterViewFromToggle && isGoogleMapLayerVisible && keepOriginalTimelapseViewFromToggle) {
          var mapCenter = googleMapLayer.getCenter();
          if (googleMapsCenterViewFromToggle.lat != mapCenter.lat() && googleMapsCenterViewFromToggle.lng != mapCenter.lng()) {
            keepOriginalTimelapseViewFromToggle = false;
          }
        }
      });

      timelapse.addViewEndChangeListener(function() {
        if (!isGoogleMapLayerVisible) {
          setGoogleMapsViewFromCurrentTimelapseView();
        }
      });
    };

    var setGoogleMapsViewFromCurrentTimelapseView = function() {
      googleMapsCenterViewFromToggle = timelapse.pixelBoundingBoxToLatLngCenterView(timelapse.getBoundingBoxForCurrentView()).center;
      var mapLatLng = new google.maps.LatLng(googleMapsCenterViewFromToggle.lat, googleMapsCenterViewFromToggle.lng);
      googleMapLayer.setCenter(mapLatLng);
      googleMapLayer.setZoom(Math.log2(timelapse.getView().scale / 256 * timelapse.getPanoWidth()));
    };

    var setTimelapseViewFromCurrentGoogleMapsView = function() {
      var mapCenter = googleMapLayer.getCenter();
      timelapse.setNewView({
        center: {
          lat: mapCenter.lat(),
          lng: (mapCenter.lng() + 180) % 360 - 180
        },
        zoom: timelapse.scaleToZoom(Math.pow(2, googleMapLayer.getZoom()) * 256 / timelapse.getPanoWidth())
      }, true);
    };



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //

    var getGoogleMapLayer = function() {
      return googleMapLayer;
    };
    this.getGoogleMapLayer = getGoogleMapLayer;

    var isGoogleMapLayerActive = function() {
      return isGoogleMapLayerVisible;
    };
    this.isGoogleMapLayerActive = isGoogleMapLayerActive;

    var toggleGoogleMapLayer = function(callback) {
      if (isGoogleMapLayerVisible) {
        if (timelapseWasPlayingBeforeLayerToggle) {
          timelapse.handlePlayPause();
        }
        $staticBaseLayerMap.hide();
        if (!keepOriginalTimelapseViewFromToggle) {
          setTimelapseViewFromCurrentGoogleMapsView();
        }
      } else {
        keepOriginalTimelapseViewFromToggle = true;
        if (!timelapse.isPaused()) {
          timelapseWasPlayingBeforeLayerToggle = true;
          timelapse.handlePlayPause();
        } else {
          timelapseWasPlayingBeforeLayerToggle = false;
        }
        $staticBaseLayerMap.show();
        setGoogleMapsViewFromCurrentTimelapseView();
      }
      isGoogleMapLayerVisible = !isGoogleMapLayerVisible;
      if (typeof(callback) === "function") {
        callback(isGoogleMapLayerVisible);
      }
    };
    this.toggleGoogleMapLayer = toggleGoogleMapLayer;



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    UTIL.loadGoogleAPIs(initializeGoogleMapsStaticLayer, settings.apiKeys);
  };
  //end of org.gigapan.timelapse.CustomLayers
})();
//end of (function() {
