/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Copyright 2013 Carnegie Mellon University. All rights reserved.
 *
 * Dependencies:
 *  postmessage.js
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of
 *    conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list
 *    of conditions and the following disclaimer in the documentation and/or other materials
 *    provided with the distribution.
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

function setupPostMessageHandlers() {
  // Ensure handlers are not enabled more than once
  if (org && org.gigapan && org.gigapan.timelapse) {
    if (org.gigapan.timelapse.isPostMessageAPIEnabled) return;
    org.gigapan.timelapse.isPostMessageAPIEnabled = true;
  }

  // Handles the cross-domain iframe request to see whether a time machine is supported by the current user.
  pm.bind("timemachine-is-supported", function() {
    post("timemachine-is-supported", org.gigapan.Util.browserSupported());
  });

  // Handles the cross-domain iframe request to see whether the user is on a mobile device.
  pm.bind("timemachine-is-mobile", function() {
    post("timemachine-is-mobile", org.gigapan.Util.isMobileDevice());
  });

  // Handles the cross-domain iframe request to see whether the user browser/OS combo supports webgl.
  pm.bind("timemachine-is-webgl-supported", function() {
    post("timemachine-is-webgl-supported", org.gigapan.Util.isWebGLSupported());
  });

  // Handles the cross-domain iframe request to send the current view of a time machine.
  pm.bind("timemachine-get-current-view", function() {
    if (timelapse)
      post("timemachine-get-current-view", timelapse.getViewStr());
  });

  // Handles the cross-domain iframe request to send information to be used in a time machine share URL.
  pm.bind("timemachine-get-share-view", function() {
    if (timelapse)
      post("timemachine-get-share-view", timelapse.getShareView());
  });

  // Handles the cross-domain iframe request to start playing a time machine.
  pm.bind("timemachine-play", function() {
    if (timelapse && timelapse.isPaused())
      timelapse.handlePlayPause();
  });

  // Handles the cross-domain iframe request to pause a time machine.
  pm.bind("timemachine-pause", function() {
    if (timelapse && !timelapse.isPaused())
      timelapse.handlePlayPause();
  });

  // Handles the cross-domain iframe request to seek a time machine to the specified time.
  pm.bind("timemachine-seek", function(unsafe_data) {
    if (unsafe_data && typeof (unsafe_data) !== 'undefined' && timelapse) {
      var time = parseFloat(unsafe_data);
      timelapse.seek(time);
    }
  });

  // Handles the cross-domain iframe request to seek a time machine to the specified frame number.
  // Note that frame counting begins at 0.
  pm.bind("timemachine-set-frame", function(unsafe_data) {
    if (unsafe_data && typeof (unsafe_data) !== 'undefined' && timelapse) {
      var frameNumber = parseInt(unsafe_data);
      timelapse.seekToFrame(frameNumber)
    }
  });

  // Handles the cross-domain iframe request to change the view of a time machine.
  pm.bind("timemachine-set-view", function(unsafe_data) {
    if (unsafe_data && typeof (unsafe_data) !== 'undefined' && timelapse) {
      // Before we change the view, cancel any tours that may be playing.
      var snaplapseTour = timelapse.getSnaplapseForSharedTour();
      if (snaplapseTour) {
        var viewerDivId = timelapse.getViewerDivId();
        snaplapseTour.clearSnaplapse();
        timelapse.stopParabolicMotion();
        $("#" + viewerDivId + " .snaplapseTourPlayBack").remove();
        $("#" + viewerDivId + " .tourLoadOverlay").remove();
      }

      // Sanitize data
      var view = timelapse.unsafeViewToView(unsafe_data.view);
      var doWarp = !!unsafe_data.doWarp;
      var doPlay = !!unsafe_data.doPlay;
      timelapse.setNewView(view, doWarp, doPlay);
    }
  });

  // Handles the cross-domain iframe request of changing the view of a time machine based on a share URL.
  pm.bind("timemachine-set-share-view", function(unsafe_data) {
    if (unsafe_data && typeof (unsafe_data) !== 'undefined' && timelapse) {
      // If a share URL (e.g. #v=44.96185,59.06233,4.5,latLng&t=0.10) is passed in
      // as a string, then unpack it based on the hash vars.
      // Otherwise we are dealing with an object of unpacked hash vars, so move on.
      if (typeof (unsafe_data) === "string") {
        var unsafe_matchURL = unsafe_data.match(/#(.+)/);
        if (unsafe_matchURL) {
          unsafe_data = org.gigapan.Util.unpackVars(unsafe_matchURL[1]);
        }
      }

      // Before we change the view, cancel any tours that may be playing.
      var snaplapseTour = timelapse.getSnaplapseForSharedTour();
      if (snaplapseTour) {
        var viewerDivId = timelapse.getViewerDivId();
        snaplapseTour.clearSnaplapse();
        timelapse.stopParabolicMotion();
        $("#" + viewerDivId + " .snaplapseTourPlayBack").remove();
        $("#" + viewerDivId + " .tourLoadOverlay").remove();
      }

      if (unsafe_data.v) {
        var newView = timelapse.unsafeViewToView(unsafe_data.v.split(","));
        // Always warp to the new view (i.e. pass in true for the second value)
        timelapse.setNewView(newView, true);
      }
      if (unsafe_data.t) {
        var newTime = parseFloat(unsafe_data.t);
        timelapse.seek(newTime);
      }
    }
  });

  // Handles the cross-domain iframe request of going to a location on the presentation slider
  pm.bind("timemachine-goto-presentation-slide", function(unsafe_slideTitle) {
    if (timelapse && unsafe_slideTitle) {
      var slideId = unsafe_slideTitle.split(' ').join('_');
      var $slideContainer = $("#" + slideId).parent();
      if ($slideContainer) {
        $("#" + slideId).click();
      }
    }
  });

  // Handles the cross-domain iframe request of loading a tour
  pm.bind("timemachine-load-tour", function(unsafe_data) {
    if (timelapse && unsafe_data)
      timelapse.loadSharedDataFromUnsafeURL(unsafe_data.tourURL, unsafe_data.playOnLoad);
  });

  // Handles switching layers
  pm.bind("timemachine-switch-layer", function(unsafe_layerNum) {
    var layerNum = parseInt(unsafe_layerNum);
    if (timelapse && !isNaN(layerNum))
      timelapse.switchLayer(layerNum);
  });
}

// Handles the sending of cross-domain iframe requests.
function post(type, data) {
  pm({
    target: window.parent,
    type: type,
    data: data,
    origin: document.referrer // TODO: Change this (and above) to explicity set a domain we'll be receiving requests from
  });
}
