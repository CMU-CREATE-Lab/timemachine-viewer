// @license
// Redistribution and use in source and binary forms ...

// Copyright 2013 Carnegie Mellon University. All rights reserved.
//
// Dependencies: postmessage.js
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//    of conditions and the following disclaimer in the documentation and/or other materials
//    provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of Carnegie Mellon University.
//
// Authors:
// Paul Dille (pdille@andrew.cmu.edu)

var geocoder, newView, newZoom, doPlay;

function setupPostMessageHandlers() {
  // Handles the cross-domain iframe request to see whether a time machine is supported by the current user.
  pm.bind("timemachine-is-supported", function() {
    post("timemachine-is-supported", org.gigapan.Util.browserSupported());
  });

  // Handles the cross-domain iframe request to send the current view of a time machine.
  pm.bind("timemachine-get-current-view", function() {
    if (timelapse) post("timemachine-get-current-view", timelapse.getViewStr());
  });

  // Handles the cross-domain iframe request to send information to be used in a time machine share URL.
  pm.bind("timemachine-get-share-view", function() {
    if (timelapse) post("timemachine-get-share-view", timelapse.getShareView());
  });

  // Handles the cross-domain iframe request to start playing a time machine.
  pm.bind("timemachine-play", function() {
    if (timelapse) timelapse.play();
  });

  // Handles the cross-domain iframe request to pause a time machine.
  pm.bind("timemachine-pause", function() {
    if (timelapse) timelapse.pause();
  });

  // Handles the cross-domain iframe request to seek a time machine to the specified time.
  pm.bind("timemachine-seek", function(data) {
    if (timelapse) timelapse.seek(data);
  });

  // Handles the cross-domain iframe request to change the view of a time machine.
  // There is logic here to make the change to a new view happen gracefully
  // and give the user context of where they were and where they are going.
  pm.bind("timemachine-set-view", function(data) {
    if (timelapse) {
      setViewGracefully(data.view, data.doWarp, data.doPlay);
    }
  });

  // Handles the cross-domain iframe request of changing the view of a time machine based
  // on a share URL.
  pm.bind("timemachine-set-share-view", function(data) {
    if (timelapse) {
      var viewArray = data.v.split(",");
      var view;
      var doWarp = true;
      if (viewArray) view = timelapse.unsafeViewToView(viewArray);
      if (view) timelapse.setNewView(view, doWarp);
      var time = data.t;
      if (time) timelapse.seek(time);
    }
  });
}

// Set the view, animating smoothly if doWarp is false.
function setViewGracefully(toView, doWarp, doPlayParam) {
  newView = toView;
  newZoom = toView.zoom;
  doPlay = doPlayParam ? doPlayParam : false;

  var currentView = timelapse.getViewStr().split(",");
  var homeView = {center: {"lat": currentView[0], "lng": currentView[1]}, "zoom": currentView[2]};

  if (doWarp) {
    timelapse.setNewView(newView,true);
    if (doPlay) timelapse.play();
  } else {
    newView.zoom = 0;
    if (currentView[0] == "0" && currentView[1] == "0" && currentView[2] == "0")
      zoomGracefully(newView);
    else
      zoomHome(homeView);
  }
}

// Handles the sending of cross-domain iframe requests.
function post(type,data) {
  pm({
    target: window.parent,
    type: type,
    data: data,
    url: document.referrer, // needed for hash fallback in older browsers
    origin: document.referrer // TODO: Change this (and above) to explicity set a domain we'll be receiving requests from
  });
}

// Zoom out before moving to the new view.
function zoomHome(view) {
  if (view.zoom > 0) {
    var doWarp = false;
    timelapse.setNewView(view, doWarp);
    view.zoom -= 0.5;
    setTimeout(function() { zoomHome(view); }, 150);
  } else {
    setTimeout(function() { zoomGracefully(newView); }, 550);
  }
}

// This function, combined with zoomHome() above, will change the view of a time machine gracefully, since
// just calling setNewView(), even with the animation flag set, will update the view too quickly.
function zoomGracefully(view) {
  if ((newZoom != 0 && newZoom >= view.zoom) || (newZoom == 0 && view.zoom <= 10)) {
    var doWarp = false;
    timelapse.setNewView(view,doWarp);
    view.zoom += 0.5;
    setTimeout(function() { zoomGracefully(view); }, 150);
  } else {
    if (doPlay) timelapse.play();
  }
}
