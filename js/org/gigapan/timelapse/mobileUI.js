/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Class for managing mobile UI
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
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.MobileUI";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.MobileUI = function(timelapse, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //

    // Objects
    var defaultUI = timelapse.getDefaultUI();
    var snaplapseForPresentationSlider = timelapse.getSnaplapseForPresentationSlider();

    // Parameters
    var initialPlayerHeight;
    var currentDrawerContentScrollPos = 0;

    // DOM elements
    var timeMachineDivId = timelapse.getTimeMachineDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var $timelineContainer = $("#" + viewerDivId + " .materialTimelineContainer");
    var $waypointDrawerContainer = $("#" + viewerDivId + " .waypointDrawerContainer");
    var $waypointDrawerContainerHeader = $("#" + viewerDivId + " .waypointDrawerContainerHeader");
    var $searchBox = $("#" + viewerDivId + " .etMobileSearchBox");
    var $searchBackButton = $("#" + viewerDivId + " .etMobileSearchBoxBack");
    var $searchBoxClear = $("#" + viewerDivId + " .etMobileSearchBoxClear");
    var $searchBoxIcon = $("#" + viewerDivId + " .etMobileSearchBoxIcon");
    var $searchOverlay = $("#" + viewerDivId + " .etMobileSearchOverlay");
    var $orientationChangeOverlay = $("#" + timeMachineDivId + " .etMobileOrientationChangeOverlay");

    // Flags
    var keepSearchResult = false;
    var lastSearchResultView = null;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    var createWaypointDrawer = function() {
      $waypointDrawerContainer.on("scroll", function(e) {
        if ($(this).hasClass("disableScroll")) {
          $(this).scrollTop(currentDrawerContentScrollPos);
          return;
        }
        if (this.scrollTop == 0) {
          $waypointDrawerContainerHeader.removeClass("scrolled");
        } else {
          $waypointDrawerContainerHeader.addClass("scrolled");
        }
      });

      $waypointDrawerContainer.on("mousedown", function(e) {
        if (!$(e.target).closest(".waypointDrawerContainerHeader").length) return;
        var lastYPos;
        var lastYDirection = null;
        var startYPos = e.pageY;
        lastYPos = startYPos;
        var startHeight = $(this).height();
        var currentYPos;
        $(this).addClass("disableScroll");

        currentDrawerContentScrollPos = $waypointDrawerContainer.scrollTop();

        $(document).on("mousemove.waypointPanel", function(e) {
          currentYPos = e.pageY;
          if (lastYPos > e.pageY) {
            lastYDirection = "up";
          } else if (lastYPos < e.pageY) {
            lastYDirection = "down";
          }
          lastYPos = currentYPos;
          var dist = startYPos - currentYPos;
          $waypointDrawerContainer.height(startHeight + dist);
        });
        $(document).one("mouseup.waypointPanel", function(e) {
          if (lastYDirection && lastYDirection == "up") {
            $waypointDrawerContainer.stop(true, false).animate({
              height: "100%"
            });
            $waypointDrawerContainer.addClass("maximized");
          } else if (lastYDirection && lastYDirection == "down") {
            $waypointDrawerContainer.stop(true, false).animate({
              height: "0px"
            }, function() {
               $waypointDrawerContainer.removeClass("maximized");
            });

          }
          $waypointDrawerContainer.removeClass("disableScroll");
          $(document).off(".waypointPanel");
        });
      });

      UTIL.verticalTouchScroll($waypointDrawerContainer);

      timelapse.onresize(true);
    };

    var initializeSearch = function() {
      if (window.location.search.indexOf("searchMode=true") >= 0) {
        window.history.replaceState(null, null, window.location.pathname + window.location.hash);
      }

      $(window).on('popstate', function() {
        var historyState = history.state;
        if (historyState && historyState.searchMode) {
          $searchBackButton.trigger("click");
        }
      });

      timelapse.addResizeListener(function() {
        var historyState = history.state;
        if (historyState && historyState.searchMode && initialPlayerHeight == $(".player").height()) {
          history.pushState({"searchMode" : true }, "", "?searchMode=true");
        }
      });

      UTIL.loadGoogleAPIs(initializeSearchBox, settings.apiKeys);
    };

    var initializeSearchBox = function() {
      var autocomplete = new google.maps.places.Autocomplete($searchBox.get(0));
      var geocoder = new google.maps.Geocoder();

      // Enable places selection from dropdown on touch devices
      $(document).on('touchstart', '.pac-item', function(e) {
        e.preventDefault();
        $(this).children().each(function( index ) {
          $(this).append(' ');
        });
        var searchItemText =  $(this).text();
        searchItemText = searchItemText.replace(/\s\s+/g, ' ');
        $searchBox.val(searchItemText);
        google.maps.event.trigger(autocomplete, 'place_changed', {
          locationName: searchItemText
        });
      });

      $searchBoxIcon.on("click", function() {
        $searchBox.trigger("focus");
      });

      $searchBox.on("focus", function() {
        toggleSearchOverlay("show");
      });

      $searchBackButton.on("click", function() {
        toggleSearchOverlay("hide");
        if (!keepSearchResult) {
          $searchBoxClear.trigger("click");
        } else if (lastSearchResultView) {
          timelapse.setNewView(lastSearchResultView, false, false);
        }
      });

      $searchBoxClear.on('click', function() {
        keepSearchResult = false;
        lastSearchResultView = null;
        $searchBox.val("");
        $(this).hide();
        $searchBoxIcon.show();
        $('.pac-container').hide();
      });

      var toggleSearchOverlay = function(state) {
        if (state == "show") {
          $searchBox.addClass("active");
          $searchOverlay.show();
          $timelineContainer.hide();
          history.pushState({"searchMode" : true }, "", "?searchMode=true");
        } else if (state == "hide") {
          $searchBox.removeClass("active");
          $searchOverlay.hide();
          $timelineContainer.show();
          $searchBox.blur();
          window.history.back();
        }
      };

      $searchBox.on("input", function() {
        if ($(this).val() == "") {
          $searchBoxClear.hide();
          $searchBoxIcon.show();
        } else {
          $searchBoxClear.show();
          $searchBoxIcon.hide();
        }
      });

      google.maps.event.addListener(autocomplete, 'place_changed', function() {
        toggleSearchOverlay("hide");
        var place = autocomplete.getPlace();
        keepSearchResult = true;
        if (!place || !place.geometry) {
          var address = $searchBox.val();
          geocoder.geocode({
            'address': address
          }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              var newView;
              var bounds = results[0].geometry.bounds;
              if (bounds) {
                var northEastLatLng = bounds.getNorthEast();
                var southWestLatLng = bounds.getSouthWest();
              }
              if (!northEastLatLng || !southWestLatLng) {
                var lat = results[0].geometry.location.lat();
                var lng = results[0].geometry.location.lng();
                newView = {
                  center: {
                    lat: lat,
                    lng: lng
                  },
                  zoom: 10
                };
              } else {
                newView = {
                  bbox: {
                    ne: {
                      lat: northEastLatLng.lat(),
                      lng: northEastLatLng.lng()
                    },
                    sw: {
                      lat: southWestLatLng.lat(),
                      lng: southWestLatLng.lng()
                    }
                  }
                };
              }
              lastSearchResultView = newView;
              timelapse.setNewView(newView, false, false);
              UTIL.addGoogleAnalyticEvent('textbox', 'search', 'go-to-searched-place');
            } else {
              UTIL.log("Geocode failed: " + status);
            }
          });
        } else {
          var newView = {
            center: {
              "lat": place.geometry.location.lat(),
              "lng": place.geometry.location.lng()
            },
            "zoom": 10
          };
          lastSearchResultView = newView;
          timelapse.setNewView(newView, false, false);
          UTIL.addGoogleAnalyticEvent('textbox', 'search', 'go-to-searched-place');
        }
        document.activeElement.blur();
      });

      defaultUI.populateSearchBoxWithLocationString(null, true, setSearchStateFromView);
    };

    var checkOrientation = function(fromPageLoad) {
      var windowOrientation = window.screen.msOrientation || window.screen.mozOrientation || (window.screen.orientation || {}).angle || window.orientation;
      var supportedOrientationAngle = windowOrientation == 0 || windowOrientation == 180;
      var supportedOrientation = window.innerHeight >= window.innerWidth;
      var widthHeightDiff = Math.abs(window.innerHeight - window.innerWidth);
      if ((fromPageLoad && supportedOrientation) ||
          (supportedOrientationAngle && supportedOrientation) ||
          (!supportedOrientationAngle && supportedOrientation) ||
          (supportedOrientationAngle && widthHeightDiff < 600)) {
        $orientationChangeOverlay.hide();
      } else {
        $orientationChangeOverlay.show();
      }
    };

    var setupUIEvents = function() {
      $(window).on('orientationchange', function() {
        $(window).one('resize', function() {
          // This timeout is here because there is some unknown delay after the resize before the window innerHeight/innerWidth are the correct values.
          // Every device/browser combo behaves a bit differently. If only there was a native orientationchangeend event.
          setTimeout(checkOrientation, 150);
        });
      });

      if (snaplapseForPresentationSlider) {
        var snaplapseViewerForPresentationSlider = snaplapseForPresentationSlider.getSnaplapseViewer();
        snaplapseViewerForPresentationSlider.addEventListener('slide-before-changed', function(waypoint) {
          $waypointDrawerContainer.animate({
            height: "0%"
          }, 150, function() {
            $waypointDrawerContainer.removeClass("maximized");
          });
        });
      }
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //

    var setSearchStateFromView = function(viewString) {
      if (!viewString) return;
      var viewStringArray = viewString.split(",");
      keepSearchResult = true;
      lastSearchResultView = {
        center: {
          lat: viewStringArray[0],
          lng: viewStringArray[1]
        },
        zoom: viewStringArray[2]
      };
    };
    this.setSearchStateFromView = setSearchStateFromView;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    $("body, #" + viewerDivId).addClass("no-hover");

    createWaypointDrawer();

    initializeSearch();

    initialPlayerHeight = $("#" + viewerDivId).height();

    checkOrientation(true);

    setupUIEvents();
  };
  //end of org.gigapan.timelapse.MobileUI
})();
//end of (function() {
