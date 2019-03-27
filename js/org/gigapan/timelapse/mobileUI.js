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
    var videoset = timelapse.getVideoset();

    // Parameters
    var captureTimes;
    var numFrames;

    // DOM elements
    var timeMachineDivId = timelapse.getTimeMachineDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var $playbackButton = $("#" + viewerDivId + " .etMobilePlaybackButton");
    var $timeline = $("#" + viewerDivId + " .etMobileTimeline")
    var $timelineContainer = $("#" + viewerDivId + " .etMobileTimelineContainer");
    var $waypointDrawerContainer = $("#" + viewerDivId + " .etMobileWaypointDrawerContainer");
    var $waypointDrawerContainerHeader = $("#" + viewerDivId + " .etMobileWaypointDrawerContainerHeader");
    var $waypointDrawerMainContent = $("#" + viewerDivId + " .presentationSlider");

    // Flags
    var addedTimelineSliderListener = false;
    var isScrolling = false;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    var initializeTimelineSlider = function() {
      createTimelineSlider();
      UTIL.touchHorizontalScroll($timelineContainer);
    }

    var createTimelineSlider = function() {
      var timelineHTML = "";
      captureTimes = timelapse.getCaptureTimes();
      numFrames = captureTimes.length;

      for (var i = 0; i < captureTimes.length; i++) {
        timelineHTML += "<span class='etMobileTimelineTick' data-frame=" + i + ">" + captureTimes[i] + "</span>";
      }
      timelineHTML += "<span class='etMobileTimelineDivider'>&#8226;</span>";
      for (var i = 0; i < captureTimes.length; i++) {
        timelineHTML += "<span class='etMobileTimelineTick etMainMobileTimelineTick' data-frame=" + i + ">" + captureTimes[i] + "</span>";
      }
      $timeline.html(timelineHTML);

      $timelineContainer.swipe( {
        // Generic swipe handler for all directions
        swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
          var $selectedElm = $(".etMobileTimelineTickSelected");
          if (!$selectedElm.length) return;
          var currentFrameNum = parseInt($selectedElm.attr("data-frame"));
          if ((currentFrameNum > 0 || $selectedElm.hasClass("etMainMobileTimelineTick")) && direction == "right") {
            updateTimelineSlider(null,  $selectedElm.prevAll(".etMobileTimelineTick:first")[0], false);
          } else if ((currentFrameNum < numFrames - 1 || !$selectedElm.hasClass("etMainMobileTimelineTick")) && direction == "left") {
            updateTimelineSlider(null,  $selectedElm.nextAll(".etMobileTimelineTick:first")[0], false);
          }
        },
        threshold: 30
      });

      $(".etMobileTimelineTick").on("click", function() {
        updateTimelineSlider(null, this, false);
      });

      if (!addedTimelineSliderListener) {
        addedTimelineSliderListener = true;
        videoset.addEventListener('sync', function() {
          var currentFrameNumber = timelapse.getCurrentFrameNumber();
          var $selectedElm = $(".etMobileTimelineTickSelected");
          if (!$selectedElm.hasClass("etMainMobileTimelineTick") || parseInt($selectedElm.attr("data-frame")) == currentFrameNumber) return;
          updateTimelineSlider(currentFrameNumber, null, true);
        });
      }

      var startTimeElm = $(".etMainMobileTimelineTick").first();
      updateTimelineSlider(0, startTimeElm);
    };

    var updateTimelineSlider = function(frameNum, timeTick, fromSync) {
      var elementToHighlight = timeTick;
      if (!elementToHighlight) {
        elementToHighlight = $('.etMainMobileTimelineTick[data-frame="' + frameNum + '"]');
      }
      if (elementToHighlight) {
        if (frameNum == null) {
          frameNum = parseInt($(elementToHighlight).attr("data-frame"));
        }
        //var scrollOptions = {inline: 'center'};
        var scrollOptions = {time: 100};
        if (fromSync) {
          scrollOptions = {
           ease: null,
           time: 0
         }
        }
        $(".etMobileTimelineTick").removeClass("etMobileTimelineTickSelected");
        $(elementToHighlight).addClass("etMobileTimelineTickSelected");
        window.scrollIntoView($(elementToHighlight)[0], scrollOptions, function() {
          isScrolling = false;
        });
        if (timelapse.isPaused()) {
          timelapse.seekToFrame(frameNum);
        }
      }
    };

    var createPlayPauseButton = function() {
      // Create play button
      $playbackButton.button({
        icons: {
          primary: "ui-icon-custom-play-white"
        },
        text: false
      }).on("click", function() {
        var $selectedElm = $(".etMobileTimelineTickSelected");
        if (!$selectedElm.hasClass("etMainMobileTimelineTick")) {
          $(".etMainMobileTimelineTick").first().click();
        }
        timelapse.handlePlayPause();
        //if (!timelapse.isPaused())
        //  UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-play');
        //else
        //  UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-pause');
      });
    }


    var createWaypointDrawer = function() {
      $waypointDrawerMainContent.on("scroll", function() {
        if (this.scrollTop == 0) {
          $waypointDrawerContainerHeader.removeClass("scrolled");
        } else {
          $waypointDrawerContainerHeader.addClass("scrolled");
        }
      });

      var moveThreshold = 20;

      $waypointDrawerContainer.on("mousedown", function(e) {
        var startYPos = e.pageY;
        var currentYPos;
        if (!$(e.target).closest(".etMobileWaypointDrawerContainerHeader").length) return;
        //if ($(e.target).parents(".waypointDrawerMainContentContainer").first().length) return;
        $(document).on("mousemove.waypointPanel", function(e) {
          currentYPos = e.pageY;
        });
        $(document).one("mouseup.waypointPanel", function(e) {

          if (currentYPos + moveThreshold < startYPos) {
            $waypointDrawerContainer.addClass("maximized");
          } else if (currentYPos - moveThreshold > startYPos) {
            $waypointDrawerContainer.removeClass("maximized");
          }
          $(document).off(".waypointPanel");
        });
      });

      UTIL.verticalTouchScroll($(".presentationSlider"));

      timelapse.onresize(true);
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //

    var setPlaybackButtonIcon = function(type) {
      if (type == "pause") {
        $playbackButton.button({
          icons: {
            primary: "ui-icon-custom-play-white"
          },
          text: false
        }).attr({
          "title": "Play"
        });
      } else if (type == "play") {
        $playbackButton.button({
          icons: {
            primary: "ui-icon-custom-pause-white"
          },
          text: false
        }).attr({
          "title": "Pause"
        });
      }
    };
    this.setPlaybackButtonIcon = setPlaybackButtonIcon;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    $("#" + timeMachineDivId).addClass("mobile no-hover");
    $("#" + viewerDivId).addClass("no-hover");

    createPlayPauseButton();

    initializeTimelineSlider()

    createWaypointDrawer();

    UTIL.loadGoogleAPIs("org.gigapan.timelapse.MobileUI.initializeSearchBox", settings.apiKeys);

    // TODO: Force portrait mode. Maybe someday allow landscape?
    $(window).on("orientationchange", function() {
      if (screen.orientation.angle == 90) {
        $("html").addClass("forced-portrait");
      } else {
        $("html").removeClass("forced-portrait");
      }
    });

  };
  //end of org.gigapan.timelapse.MobileUI

  org.gigapan.timelapse.MobileUI.initializeSearchBox = function() {
    if (typeof google === "undefined")
      return;

    var $searchBox = $(".etMobileSearchBox");
    var $searchBoxClear = $(".etMobileSearchBoxClear");
    var autocomplete = new google.maps.places.Autocomplete($searchBox.get(0));
    var geocoder = new google.maps.Geocoder();

    // Enable places selection from dropdown on touch devices
    $(document).on('touchstart', '.pac-item', function(e) {
      e.preventDefault();
      var searchItemText = $(this).text();
      $searchBox.val(searchItemText);
      google.maps.event.trigger(autocomplete, 'place_changed', {
        locationName: searchItemText
      });
    });

    $searchBoxClear.on('click', function() {
      $searchBox.val("");
      $(this).hide();
      $('.pac-container').hide();
    });

    $searchBox.on("input", function() {
      if ($(this).val() == "") {
        $searchBoxClear.hide();
      } else {
        $searchBoxClear.show();
      }
    });

    google.maps.event.addListener(autocomplete, 'place_changed', function() {
      var place = autocomplete.getPlace();
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
        timelapse.setNewView(newView, false, false);
        UTIL.addGoogleAnalyticEvent('textbox', 'search', 'go-to-searched-place');
      }
      document.activeElement.blur();
    });
  };

})();
//end of (function() {
