// @license
// Redistribution and use in source and binary forms ...

// Copyright 2011 Carnegie Mellon University. All rights reserved.
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
// Chris Bartley (bartley@cmu.edu)
// Paul Dille (pdille@andrew.cmu.edu)
// Yen-Chia Hsu (legenddolphin@gmail.com)
// Randy Sargent (randy.sargent@cs.cmu.edu)

"use strict";

var cachedSnaplapses = {};
var currentlyDisplayedVideoId = 1;
var KEYFRAME_THUMBNAIL_WIDTH = 100;
// should really be 56.25
var KEYFRAME_THUMBNAIL_HEIGHT = 56;

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

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse.snaplapse) {
  org.gigapan.timelapse.snaplapse = {};
} else {
  if ( typeof org.gigapan.timelapse.snaplapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse.snaplapse namespace: org.gigapan.timelapse.snaplapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

//
// CODE
//

var activeSnaplapse;

function playCachedSnaplapse(snaplapseId) {
  org.gigapan.Util.log("playCachedSnaplapse(" + snaplapseId + ")");
  var s = cachedSnaplapses[snaplapseId];
  var snaplapse = timelapse.getSnaplapse();
  var snaplapseViewer = snaplapse.getSnaplapseViewer();
  if ( typeof s != 'undefined' && s) {
    if (snaplapse && snaplapse.isPlaying()) {
      snaplapse.stop();
    }
    if (snaplapseViewer.loadNewSnaplapse(JSON.stringify(s))) {
      var onLoad = function() {
        snaplapseViewer.playStopSnaplapse();
        snaplapseViewer.removeEventListener('snaplapse-loaded', onLoad);
      };
      snaplapseViewer.addEventListener('snaplapse-loaded', onLoad);
    } else {
      alert("ERROR: Invalid tour file.");
    }
  }
}

(function() {
  var UTIL = org.gigapan.Util;
  var browserSupported = UTIL.browserSupported();
  var didOnce = false;
  org.gigapan.timelapse.snaplapse.SnaplapseViewer = function(snaplapse, timelapse, settings) {
    var thisObj = this;
    var videoset = timelapse.getVideoset();
    var viewerType = UTIL.getViewerType();
    var composerDivId = snaplapse.getComposerDivId();
    var timelapseViewerDivId = timelapse.getViewerDivId();
    var maxSubtitleLength = 120;

    var eventListeners = {};
    // If the user requested a tour editor AND has a div in the DOM for the editor,
    // then do all related edtior stuff (pull thumbnails for keyframes, etc.)
    // Otherwise, we will still handle tours but no editor will be displayed.
    // (No thumbnails for keyframes pulled and loading a tour will display a load
    // button with the tour name on the center of the viewport.)
    var editorEnabled = settings["composerDiv"] && $("#" + settings["composerDiv"]).length;

    this.addEventListener = function(eventName, listener) {
      if (eventName && listener && typeof (listener) == "function") {
        if (!eventListeners[eventName]) {
          eventListeners[eventName] = [];
        }

        eventListeners[eventName].push(listener);
      }
    };

    this.removeEventListener = function(eventName, listener) {
      if (eventName && eventListeners[eventName] && listener && typeof (listener) == "function") {
        for (var i = 0; i < eventListeners[eventName].length; i++) {
          if (listener == eventListeners[eventName][i]) {
            eventListeners[eventName].splice(i, 1);
            return;
          }
        }
      }
    };

    var hideViewerUI = function() {
      var $speedControl = $("#" + timelapseViewerDivId + " .toggleSpeed");
      var $googleLogo = $("#" + timelapseViewerDivId + " .googleLogo");
      var $googleMapToggle = $("#" + timelapseViewerDivId + " .toggleGoogleMapBtn");
      var $contextMapResizer = $("#" + timelapseViewerDivId + " .smallMapResizer");
      var $customTimeline = $("#" + timelapseViewerDivId + "_customTimeline");
      var $customHelpLabel = $(".customHelpLabel");
      var $customPlay = $(".customPlay");
      var $timeText = $("#" + timelapseViewerDivId + "_customTimeline_timeText");
      var $sideToolBar = $("#" + timelapseViewerDivId + " .sideToolBar").stop(true, true).fadeOut(200);

      $sideToolBar.hide();
      $customTimeline.stop(true, true).fadeOut(100);
      $speedControl.hide();
      $customHelpLabel.stop(true, true).fadeOut(100);
      $googleLogo.css("bottom", "-=" + 50 + "px");
      $customPlay.hide();
      $timeText.css({
        "text-align": "center",
        "left": "-=" + 14 + "px",
        "padding-left": "12px"
      });
      $googleMapToggle.fadeOut(100);
      $contextMapResizer.fadeOut(100);
      if (editorEnabled)
        moveDescriptionBox("down");
    };
    this.hideViewerUI = hideViewerUI;

    var showViewerUI = function() {
      var $googleLogo = $("#" + timelapseViewerDivId + " .googleLogo");
      var $googleMapToggle = $("#" + timelapseViewerDivId + " .toggleGoogleMapBtn");
      var $contextMapResizer = $("#" + timelapseViewerDivId + " .smallMapResizer");
      var $customTimeline = $("#" + timelapseViewerDivId + "_customTimeline");
      var $customHelpLabel = $(".customHelpLabel");
      var $customPlay = $(".customPlay");
      var $timeText = $("#" + timelapseViewerDivId + "_customTimeline_timeText");
      var $sideToolBar = $("#" + timelapseViewerDivId + " .sideToolBar").stop(true, true).fadeOut(200);

      $customTimeline.stop(true, true).fadeIn(100);
      $customHelpLabel.stop(true, true).fadeIn(100);
      $googleLogo.css("bottom", "+=" + 50 + "px");
      $customPlay.show();
      $timeText.css({
        "text-align": "right",
        "left": "+=" + 14 + "px",
        "padding-left": "0px"
      });
      $googleMapToggle.fadeIn(100);
      $contextMapResizer.fadeIn(100);
      $sideToolBar.stop(true, true).fadeIn(100);
      if (editorEnabled)
        moveDescriptionBox("up");
    };
    this.showViewerUI = showViewerUI;

    var initializeTourOverlyUI = function() {

      $("#" + timelapseViewerDivId + " .tourLoadOverlayTitleContainer").css({
        'width': '100%'
      });

      $("#" + timelapseViewerDivId + " .tourLoadOverlay").hover(function() {
        if (!snaplapse.isPlaying())
          $("#" + timelapseViewerDivId + " .tourLoadOverlayPlay").css("opacity", 1.0);
      }, function() {
        if (!snaplapse.isPlaying())
          $("#" + timelapseViewerDivId + " .tourLoadOverlayPlay").css("opacity", 0.8);
      }).click(function() {
        $("#" + timelapseViewerDivId + " .snaplapseTourPlayBack").show();
        $("#" + timelapseViewerDivId + " .tourLoadOverlayTitleContainer").animate({
          top: "20px",
          left: "-440px",
        }, 500, function() {
          $(this).css({
            'text-align': 'left',
            'left': '70px',
            'width': ''
          });
          $("#" + timelapseViewerDivId + " .tourLoadOverlayTitle").css({
            'padding-left': '0px',
            'padding-right': '0px'
          });
        });

        $("#" + timelapseViewerDivId + " .tourLoadOverlayPlay").animate({
          top: "10px",
          width: "40px",
          height: "40px",
          left: "25px",
          "margin-left": "0px",
          "margin-top": "0px",
          "opacity": "1.0"
        }, 500, function() {

          $("#" + timelapseViewerDivId + " .tourLoadOverlayTitleContainer").css({
            'position': 'static',
            'margin-left': '70px',
            'margin-top': '19px'
          });

          $("#" + timelapseViewerDivId + " .tourLoadOverlayPlay").appendTo($("#" + timelapseViewerDivId + " .snaplapseTourPlayBack"));
          $("#" + timelapseViewerDivId + " .tourLoadOverlayTitleContainer").appendTo($("#" + timelapseViewerDivId + " .snaplapseTourPlayBack"));
          $("#" + timelapseViewerDivId + " .tourLoadOverlay").hide();
          $(this).attr({
            "src": "images/tour_stop_outline.png",
            "title": ""
          });
          $("#" + timelapseViewerDivId + " .snaplapseTourPlayBack").attr("title", "Click to stop tour playback");
          snaplapse.play();
        });

      });
    };
    this.initializeTourOverlyUI = initializeTourOverlyUI;

    var initializeSnaplapseUI = function() {
      // Hide the annotation bubble
      hideAnnotationBubble();
      initializeTourOverlyUI();

      // Stop tour button if in viewing only mode
      $("#" + timelapseViewerDivId + " .snaplapseTourPlayBack").click(function() {
        if ($(this).hasClass("playTour")) {
          snaplapse.play();
        } else {
          snaplapse.stop();
        }
      });

      // Handle the tour title on the save window
      $("#" + composerDivId + " .saveTimewarpWindow_tourTitleInput").focus(function() {
        if ($(this).val() == "Untitled") {
          $(this).val("");
        }
      }).blur(function() {
        if ($(this).val() == "") {
          $(this).val("Untitled");
        }
        var tourUrl = snaplapse.getAsUrlString();
        $("#" + composerDivId + " .saveTimewarpWindow_JSON").val("http://earthengine.google.org/#timelapse/tour=" + tourUrl);
        $("#" + composerDivId + " .saveTimewarpWindow_JSON2").val('<iframe width="854" height="480" src="http://earthengine.google.org/timelapse/player?c=http%3A%2F%2Fearthengine.google.org%2Ftimelapse%2Fdata#tour=' + tourUrl + '" frameborder="0"></iframe>');
        $("#" + composerDivId + " .saveTimewarpWindow_JSON2_sizes").trigger("change");
      });

      $("#" + composerDivId + " .saveTimewarpWindow_JSON2_sizes").change(function() {
        var sizeArray = $(this).val().split(",");
        if (sizeArray.length == 2) {
          $("#" + composerDivId + " .saveTimewarpWindow_JSON2").val('<iframe width="' + sizeArray[0] + '" height="' + sizeArray[1] + '" src="http://earthengine.google.org/timelapse/player?c=http%3A%2F%2Fearthengine.google.org%2Ftimelapse%2Fdata#tour=' + snaplapse.getAsUrlString() + '" frameborder="0"></iframe>');
        }
      });

      // Load window
      $("#" + composerDivId + " .loadTimewarpWindow").dialog({
        resizable: false,
        autoOpen: false,
        width: 400,
        height: 200
      }).parent().appendTo($("#" + composerDivId));

      $("#" + composerDivId + " #loadSnaplapseButton").button({
        text: true
      }).click(function() {
        var fullURL = $("#" + composerDivId + " .loadTimewarpWindow_JSON").val();
        var match = fullURL.match(/tour=[^#?&]*/);
        if (match) {
          var tour = match[0].substring(5);
          thisObj.loadSnaplapse(snaplapse.urlStringToJSON(tour));
        } else {
          alert("Error: Invalid tour");
        }
      });

      // Save window
      $("#" + composerDivId + " .saveTimewarpWindow").dialog({
        resizable: false,
        autoOpen: false,
        width: 410,
        height: 460
      }).parent().appendTo($("#" + composerDivId));

      // Add an event listener to the videoset so we can keep track of which video is currently visible, so that we can
      // Create the keyframe thumbnails
      timelapse.getVideoset().addEventListener('video-made-visible', function(videoId) {
        currentlyDisplayedVideoId = videoId;
      });

      // Add mouseover actions to all of the buttons
      $('.button').hover(function() {
        $(this).addClass('ui-state-hover');
      }, function() {
        $(this).removeClass('ui-state-hover');
      });

      // Hide the snaplapse Stop button
      $("#" + timelapseViewerDivId + ' .stopTimeWarp').hide();

      // Configure the keyframe list's selectable handlers
      $("#" + composerDivId + " .snaplapse_keyframe_list")['selectable']({
        selected: function(event, ui) {
          if ($(ui.selected).hasClass("snaplapse_keyframe_list_item")) {
            // Get the original color
            var tagColor = ui.selected.style.backgroundColor;
            var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
            // Change the selected color
            $(ui.selected).css("background-color", "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",0.15)");
          }
          handleSnaplapseFrameSelectionChange(false);
        },
        selecting: function(event, ui) {
          if ($(ui.selecting).hasClass("snaplapse_keyframe_list_item")) {
            // Get the original color
            var tagColor = ui.selecting.style.backgroundColor;
            var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
            // Change the selected color
            $(ui.selecting).css("background-color", "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",0.1)");
          }
        },
        unselected: function(event, ui) {
          // Get the original color
          var tagColor = ui.unselected.style.backgroundColor;
          var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
          // Restore the original color
          if ($(ui.unselected).hasClass("snaplapse_keyframe_list_item"))
            $(ui.unselected).css("background-color", "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",0)");
          handleSnaplapseFrameSelectionChange(false);
        },
        unselecting: function(event, ui) {
          // Get the original color
          var tagColor = ui.unselecting.style.backgroundColor;
          var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
          // Restore the original color
          if ($(ui.unselecting).hasClass("snaplapse_keyframe_list_item"))
            $(ui.unselecting).css("background-color", "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",0)");
        },
        stop: function() {
          handleSnaplapseFrameSelectionChange(true);
        },
        cancel: ':input,textarea,.button,label'
      });

      // Add mouse event handlers to the Play/Stop button in the viewer
      $("#" + timelapseViewerDivId + ' .stopTimeWarp').click(function() {
        _playStopSnaplapse();
        return false;
      });

      // Finally, set up the snaplapse links
      setupSnaplapseLinks();

      $(".createSubtitle_dialog").dialog({
        autoOpen: false,
        height: 260,
        width: 333,
        modal: true,
        resizable: false,
        buttons: {
          "Finish and Close": function() {
            $(this).dialog("close");
          }
        },
        close: function() {
        },
      });

      // Display the text annotation when you focus on the description field.
      $(".subtitle_textarea").on("focus", function(event) {
        var thisKeyframeId = $(event.target.parentNode).dialog("option", "keyframeId");
        displaySnaplapseFrameAnnotation(snaplapse.getKeyframeById(thisKeyframeId));
        checkTextareaMaxlength(this, maxSubtitleLength);
      }).on("keyup", function(event) {// Save the text annotation on keyup, so that we don't need a save button
        var thisKeyframeId = $(event.target.parentNode).dialog("option", "keyframeId");
        snaplapse.setTextAnnotationForKeyframe(thisKeyframeId, $(this).val(), true);
        displaySnaplapseFrameAnnotation(snaplapse.getKeyframeById(thisKeyframeId));
        checkTextareaMaxlength(this, maxSubtitleLength);
      }).on("paste", function() {// Set text limit
        checkTextareaMaxlength(this, maxSubtitleLength);
      });

      // Set the position
      var $tiledContentHolder = $("#" + timelapseViewerDivId + " .tiledContentHolder");
      var playerOffset = $tiledContentHolder.offset();
      var timelineSliderFillerHeight = $("#" + composerDivId + " .timelineSliderFiller").outerHeight() || 12;
      var newTop = $("#" + timelapseViewerDivId + " .timelineSliderFiller").outerHeight() + $("#" + timelapseViewerDivId + " .controls").outerHeight() + $tiledContentHolder.outerHeight() + playerOffset.top - 1 - (timelineSliderFillerHeight * +!!settings["enableCustomUI"]);
      var newLeft = playerOffset.left;
      var newWidth = $tiledContentHolder.width();
      $("#" + composerDivId + " .snaplapse_keyframe_container").css({
        "position": "absolute",
        "top": newTop + "px",
        "left": newLeft + "px",
        "width": newWidth + "px"
      });
      if (!editorEnabled || !settings["enableCustomUI"]) {
        $("#" + composerDivId).hide();
      } else {
        if (settings["enableCustomUI"]) {
          moveDescriptionBox("up");
        }
      }
    };

    var moveDescriptionBox = function(direction) {
      var customEditorControlOuterHeight = $("#" + timelapseViewerDivId + " .customEditorControl").outerHeight() || 41;
      var descriptionOffset = customEditorControlOuterHeight ? customEditorControlOuterHeight + 20 : 0;
      if (direction == "up") {
        $("#" + timelapseViewerDivId + " .snaplapse-annotation-description").css({
          "bottom": "+=" + descriptionOffset + "px"
        });
      } else if (direction == "down") {
        $("#" + timelapseViewerDivId + " .snaplapse-annotation-description").css({
          "bottom": "-=" + descriptionOffset + "px"
        });
      }
    };
    this.moveDescriptionBox = moveDescriptionBox;

    var handleSnaplapseFrameSelectionChange = function(willWarp) {
      if (snaplapse.isPlaying()) {
        return;
      }

      var selectedItems = $("#" + composerDivId + " .snaplapse_keyframe_list > .ui-selected");
      var numSelected = selectedItems.size();

      if (numSelected == 1) {
        var id = selectedItems.get(0).id;
        var keyframeId = id.split("_")[3];
        var frame = snaplapse.getKeyframeById(keyframeId);
        displaySnaplapseFrameAnnotation(frame);

        if ( typeof willWarp != 'undefined' && willWarp) {
          timelapse.warpToBoundingBox(frame['bounds']);
          timelapse.seek(frame['time']);
        }
      } else {
        // Either 0 or more than 1
        displaySnaplapseFrameAnnotation(null);
      }
    };

    var displaySnaplapseFrameAnnotation = function(frame) {
      if (frame) {
        if (frame['is-description-visible']) {
          if (isTextNonEmpty(frame['unsafe_string_description'])) {
            // Uses .text() and not .html() to prevent cross-site scripting
            $("#" + timelapseViewerDivId + " .snaplapse-annotation-description > div").text(frame['unsafe_string_description']);
            $("#" + timelapseViewerDivId + " .snaplapse-annotation-description").show();
          } else {
            hideAnnotationBubble();
          }
        } else {
          hideAnnotationBubble();
        }
      } else {
        hideAnnotationBubble();
      }
    };

    var newSnaplapse = function(json) {
      snaplapse.clearSnaplapse();

      if (!didOnce) {
        var $playbackButton = $("#" + timelapseViewerDivId + ' .playbackButton');
        snaplapse.addEventListener('play', function() {
          var visualizer = timelapse.getVisualizer();
          var isFullScreen = timelapse.isFullScreen();
          var $snaplapseContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");

          // Add mask to viewer to prevent clicking
          $("#" + timelapseViewerDivId).append('<div class="snaplapsePlayingMask"></div>');
          // Add mask to keyframes container to prevent clicking
          $("#" + composerDivId).append('<div class="snaplapsePlayingMask"></div>');
          var leftOffset = 0;
          var topOffset = 0;
          if ($snaplapseContainer.length > 0) {
            leftOffset = $snaplapseContainer.offset().left;
            topOffset = $snaplapseContainer.offset().top;
          }

          $("#" + composerDivId + " .snaplapsePlayingMask").css({
            "left": leftOffset + 1,
            "top": topOffset + 1,
            "width": $snaplapseContainer.width(),
            "height": $snaplapseContainer.height()
          });
          // Other UI
          $("#" + timelapseViewerDivId + " .viewerModeBtn").button("disable");
          if (!isFullScreen)
            timelapse.disableEditorToolbarButtons();
          if (visualizer) {
            visualizer.handleShowHideNavigationMap("hide");
            timelapse.setPanoVideoEnableStatus(false);
            visualizer.setMode(timelapse.getMode(), isFullScreen, true);
          }
          // Change the play stop button icon
          $("#" + timelapseViewerDivId + " .playStopTimewarp").text("stop").button("option", {
            icons: {
              primary: "ui-icon-stop"
            },
            label: "Stop"
          });
          if (timelapse.getMode() != "player") {
            // Stop timewarp playback if we aren't using the editor controls
            $("#" + timelapseViewerDivId + " .stopTimeWarp").button("option", {
              icons: {
                primary: "ui-icon-custom-play"
              },
              disabled: true
            });
          }

          $("#" + timelapseViewerDivId + ' .help').removeClass("enabled").addClass("disabled");
          $("#" + timelapseViewerDivId + " .instructions").stop(true, true).fadeOut(50);
          $("#" + timelapseViewerDivId + " .instructions").removeClass('on');
          $("#" + timelapseViewerDivId + ' .repeatCheckbox').button("disable");
          $playbackButton.hide();
          $("#" + timelapseViewerDivId + ' .stopTimeWarp').show();
          $("#" + timelapseViewerDivId + ' .addressLookup').attr("disabled", "disabled");
        });

        snaplapse.addEventListener('stop', function() {
          var visualizer = timelapse.getVisualizer();
          var isFullScreen = timelapse.isFullScreen();

          $("#" + timelapseViewerDivId + " .snaplapsePlayingMask").remove();
          $("#" + composerDivId + " .snaplapsePlayingMask").remove();
          $("#" + timelapseViewerDivId + " .viewerModeBtn").button("enable");
          if (!isFullScreen)
            timelapse.enableEditorToolbarButtons();
          if (visualizer && !isFullScreen)
            visualizer.handleShowHideNavigationMap("show");
          if (visualizer) {
            timelapse.setPanoVideoEnableStatus(true);
            timelapse.seek(timelapse.getCurrentTime());
          }
          // Change the play stop button icon
          $("#" + timelapseViewerDivId + " .playStopTimewarp").button("option", {
            icons: {
              primary: "ui-icon-play"
            },
            label: "Play"
          });
          if (timelapse.getMode() != "player") {
            $("#" + timelapseViewerDivId + " .stopTimeWarp").button("option", {
              icons: {
                primary: "ui-icon-custom-stop"
              },
              disabled: false
            });
          }
          $("#" + timelapseViewerDivId + ' .stopTimeWarp').hide();
          $playbackButton.removeClass("pause").addClass("play");
          $playbackButton.attr("title", "Play");
          $playbackButton.show();
          $("#" + timelapseViewerDivId + ' .repeatCheckbox').button("enable");
          $("#" + timelapseViewerDivId + ' .help').removeClass("disabled").addClass("enabled");
          $("#" + timelapseViewerDivId + ' .addressLookup').removeAttr("disabled");
          hideAnnotationBubble();
        });

        snaplapse.addEventListener('keyframe-added', function(keyframe, insertionIndex) {
          addSnaplapseKeyframeListItem(keyframe, insertionIndex, true);
        });

        snaplapse.addEventListener('keyframe-loaded', function(keyframe, insertionIndex, keyframes, loadKeyframesLength) {
          addSnaplapseKeyframeListItem(keyframe, insertionIndex, true, true, keyframes, loadKeyframesLength);
        });

        snaplapse.addEventListener('keyframe-modified', function(keyframe) {
          $("#" + composerDivId + "_snaplapse_keyframe_" + keyframe['id'] + "_timestamp").text(keyframe['captureTime']);
          setKeyframeThumbail(keyframe);
        });

        snaplapse.addEventListener('keyframe-interval-change', function(keyframe) {
          org.gigapan.Util.log("##################### snaplapse keyframe-interval-change: " + JSON.stringify(keyframe));

          // Render the keyframe as selected to show that it's being played
          displaySnaplapseFrameAnnotation(keyframe);
        });

        // TODO: add videoset listener which listens for the stall event so we can disable the recordKeyframeButton (if not already disabled due to playback)
        didOnce = true;
      }
      $("#" + composerDivId + " .snaplapse_keyframe_list").empty();
      $("#" + timelapseViewerDivId + " .snaplapse-annotation-description > div").text("");

      if ( typeof json != 'undefined' && json != null) {
        timelapse.pause();
        if (!editorEnabled) {
          $("#" + timelapseViewerDivId + " .tourLoadOverlay").show();
          $("#" + timelapseViewerDivId + " .tourLoadOverlayPlay").show();
          if ($("#" + timelapseViewerDivId + "_customTimeline").is(':visible')) {
            timelapse.getSnaplapse().getSnaplapseViewer().hideViewerUI();
          }
        }
        return snaplapse.loadFromJSON(json, 0);
      }

      return true;
    };
    this.loadNewSnaplapse = newSnaplapse;

    var setKeyframeThumbail = function(keyframe) {
      if (!editorEnabled)
        return;
      try {
        // Find max video id
        var videoElement = videoset.getCurrentActiveVideo();
        if (videoElement != null) {
          var scale = KEYFRAME_THUMBNAIL_WIDTH / timelapse.getViewportWidth();
          var thumbnailCanvas = $("#" + composerDivId + "_snaplapse_keyframe_" + keyframe['id'] + "_thumbnail").get(0);
          var ctx = thumbnailCanvas.getContext("2d");
          ctx.clearRect(0, 0, KEYFRAME_THUMBNAIL_WIDTH, KEYFRAME_THUMBNAIL_HEIGHT);

          if (viewerType == "video") {
            var vid = $(videoElement);
            var vWidth = vid.width();
            var vHeight = vid.height();
            var vTopLeftX = vid.position().left;
            var vTopLeftY = vid.position().top;
            ctx.drawImage(vid.get(0), 0, 0, timelapse.getVideoWidth(), timelapse.getVideoHeight(), vTopLeftX * scale, vTopLeftY * scale, vWidth * scale, vHeight * scale);
          } else if (viewerType == "canvas") {
            var canvas = timelapse.getCanvas();
            var cWidth = canvas.width;
            var cHeight = canvas.height;
            ctx.drawImage(canvas, 0, 0, cWidth, cHeight, 0, 0, KEYFRAME_THUMBNAIL_WIDTH, KEYFRAME_THUMBNAIL_HEIGHT);
          }
        } else {
          org.gigapan.Util.error("setKeyframeThumbail(): failed to find a good video");
        }
      } catch(e) {
        org.gigapan.Util.error("Exception while trying to create thumbnail: " + e);
      }
    };

    var isTextNonEmpty = function(text) {
      return ( typeof text != 'undefined' && text.length > 0);
    };

    var hideAnnotationBubble = function() {
      $("#" + timelapseViewerDivId + " .snaplapse-annotation-description").hide();
    };
    this.hideAnnotationBubble = hideAnnotationBubble;

    var addSnaplapseKeyframeListItem = function(frame, insertionIndex, shouldDrawThumbnail, isKeyframeFromLoad, keyframes, loadKeyframesLength) {
      var keyframeId = frame['id'];
      var keyframeListItem = document.createElement("div");
      keyframeListItem.id = composerDivId + "_snaplapse_keyframe_" + keyframeId;

      var keyframeListItems = $("#" + composerDivId + " .snaplapse_keyframe_list_item").get();
      if (insertionIndex < keyframeListItems.length && isKeyframeFromLoad != true) {
        $("#" + keyframeListItems[insertionIndex - 1]['id']).after(keyframeListItem);
      } else {
        $("#" + composerDivId + " .snaplapse_keyframe_list").append(keyframeListItem);
      }

      var thumbnailId = keyframeListItem.id + "_thumbnail";
      var timestampId = keyframeListItem.id + "_timestamp";
      var descriptionVisibleCheckboxId = keyframeListItem.id + "_description_visible";
      var durationId = keyframeListItem.id + "_duration";
      var speedId = keyframeListItem.id + "_speed";
      var loopTimesId = keyframeListItem.id + "_loopTimes";
      var buttonContainerId = keyframeListItem.id + "_buttons";
      var updateButtonId = keyframeListItem.id + "_update";
      var duplicateButtonId = keyframeListItem.id + "_duplicate";
      var playFromHereButtonId = keyframeListItem.id + "_play";
      var durationBlockId = keyframeListItem.id + "_durationBlock";
      var speedBlockId = keyframeListItem.id + "_speedBlock";
      var transitionSelection = keyframeListItem.id + "_transitionSelection";
      var loopTextId = keyframeListItem.id + "_loopText";

      var duration = typeof frame['duration'] != 'undefined' && frame['duration'] != null ? frame['duration'] : '';
      var speed = typeof frame['speed'] != 'undefined' && frame['speed'] != null ? frame['speed'] : 100;
      var isDescriptionVisible = typeof frame['is-description-visible'] == 'undefined' ? true : frame['is-description-visible'];
      var buildConstraint = typeof frame['buildConstraint'] == 'undefined' ? "speed" : frame['buildConstraint'];
      var loopTimes = typeof frame['loopTimes'] == 'undefined' ? null : frame['loopTimes'];
      var disableTourLooping = ( typeof settings['disableTourLooping'] == "undefined") ? false : settings['disableTourLooping'];

      var content = '';
      content += '<table border="0" cellspacing="0" cellpadding="0" class="snaplapse_keyframe_list_item_table">';
      content += '  <tr valign="center">';
      content += '    <td valign="center" class="keyframe_table">';
      content += '      <div id="' + timestampId + '" class="snaplapse_keyframe_list_item_timestamp">' + frame['captureTime'] + '</div>';
      content += '      <canvas id="' + thumbnailId + '" width="' + KEYFRAME_THUMBNAIL_WIDTH + '" height="' + KEYFRAME_THUMBNAIL_HEIGHT + '" class="snaplapse_keyframe_list_item_thumbnail"></canvas>';
      content += '      <div id="' + buttonContainerId + '" class="keyframe-button-container">';
      content += '        <button id="' + updateButtonId + '" title="Update this keyframe to current view">&nbsp</button>';
      content += '        <button id="' + duplicateButtonId + '" title="Duplicate this keyframe">&nbsp</button>';
      content += '        <button id="' + playFromHereButtonId + '" class="snaplapse_keyframe_list_item_play_button" title="Play warp starting at this keyframe">&nbsp</button>';
      content += '        <input class="snaplapse_keyframe_list_item_description_checkbox" id="' + descriptionVisibleCheckboxId + '" type="checkbox" ' + ( isDescriptionVisible ? 'checked="checked"' : '') + '/>';
      content += '        <label class="snaplapse_keyframe_list_item_description_label" title="Enable/Disable subtitle" for="' + descriptionVisibleCheckboxId + '">&nbsp</label>';
      content += '      </div>';
      content += '    </td>';
      content += '    <td valign="center" class="transition_table">';
      content += '      <div class="transition_table_mask">';
      content += '        <div class="snaplapse_keyframe_list_item_duration_container">';
      content += '					<input type="radio" name="' + transitionSelection + '" id="' + durationBlockId + '" value="duration" style="position: absolute; left: -23px; top: -3px;" ' + (buildConstraint == "duration" ? 'checked="checked"' : '') + '/>';
      content += '          <span class="snaplapse_keyframe_list_item_duration_label_1">Duration:</span>';
      content += '          <input type="text" id="' + durationId + '" class="snaplapse_keyframe_list_item_duration" value="' + duration + '">';
      content += '          <span class="snaplapse_keyframe_list_item_duration_label_2">secs</span>';
      content += '        </div>';
      content += '        <div style="height:100%; position: absolute; margin-top: 20px"><div class="snaplapse_keyframe_list_item_speed_container">';
      content += '          <span class="snaplapse_keyframe_list_item_speed_label_1">Speed:</span>';
      content += '          <input type="text" id="' + speedId + '" class="snaplapse_keyframe_list_item_speed" value="' + speed + '">';
      content += '          <span class="snaplapse_keyframe_list_item_speed_label_2">%</span>';
      content += '        </div>';
      content += '        <div class="snaplapse_keyframe_list_item_loop_container">';
      content += '					<input type="radio" name="' + transitionSelection + '" id="' + speedBlockId + '"  value="speed" style="position: absolute; left: -23px;  top: -3px;" ' + (buildConstraint == "speed" ? 'checked="checked"' : '') + '/>';
      content += '          <span class="snaplapse_keyframe_list_item_duration_label_1" id="' + loopTextId + '">Loops:</span>';
      content += '          <input type="text" id="' + loopTimesId + '" class="snaplapse_keyframe_list_item_loop" title="Times for looping the entire video" value="' + loopTimes + '">';
      content += '        </div></div>';
      content += '      </div>';
      content += '    </td>';
      content += '  </tr>';
      content += '</table>';

      $("#" + keyframeListItem.id).html(content).addClass("snaplapse_keyframe_list_item");

      if (disableTourLooping) {
        $("#" + loopTimesId).hide();
        $("#" + loopTextId).hide();
        $("#" + speedBlockId).css({
          "top": "14px"
        });
        $("#" + composerDivId + " .snaplapse_keyframe_list_item_speed_container").css({
          "top": "15px"
        });
        $("#" + composerDivId + " .snaplapse_keyframe_list_item_duration_container").css({
          "top": "90px"
        });
      }

      $('input[name=' + transitionSelection + ']').change(function() {
        var elem = $(this);
        var id = elem.prop("id");
        var thisKeyframeId = this.id.split("_")[3];
        if (id.indexOf("speedBlock") !== -1) {
          // Using speed as the main constraint
          snaplapse.resetSpeedBlockForKeyframe(thisKeyframeId);
        } else {
          // Using duration as the main constraint
          snaplapse.resetDurationBlockForKeyframe(thisKeyframeId);
        }
        resetKeyframeTransitionUI(this.value, composerDivId + "_snaplapse_keyframe_" + thisKeyframeId);
      });

      // Toggle the description field enabled/disabled
      $("#" + descriptionVisibleCheckboxId).button({
        icons: {
          primary: "ui-icon-comment"
        },
        text: true
      }).change(function() {
        var thisKeyframeId = this.id.split("_")[3];
        if (this.checked) {
          snaplapse.setTextAnnotationForKeyframe(thisKeyframeId, undefined, true);
          var thisKeyframe = snaplapse.getKeyframeById(thisKeyframeId);
          if (thisKeyframe["unsafe_string_description"] != undefined) {
            $(".subtitle_textarea").val(thisKeyframe["unsafe_string_description"]);
          }
          $(".createSubtitle_dialog").dialog("option", {
            "keyframeId": thisKeyframeId,
            "descriptionVisibleCheckboxId": this.id
          }).dialog("open");
        } else {
          snaplapse.setTextAnnotationForKeyframe(thisKeyframeId, undefined, false);
          displaySnaplapseFrameAnnotation(snaplapse.getKeyframeById(thisKeyframeId));
        }
      });

      // Create update button
      $("#" + updateButtonId).button({
        icons: {
          primary: "ui-icon-refresh"
        },
        text: true
      }).click(function() {
        var thisKeyframeId = this.id.split("_")[3];
        var color_head = snaplapse.updateTimeAndPositionForKeyframe(thisKeyframeId);
        keyframeListItem.style.backgroundColor = color_head + "0.15)";
        // Select the element
        UTIL.selectSelectableElements($("#" + composerDivId + " .snaplapse_keyframe_list"), $("#" + keyframeListItem.id));
      });

      // Create duplicate button
      $("#" + duplicateButtonId).button({
        icons: {
          primary: "ui-icon-copy"
        },
        text: true
      }).click(function() {
        var thisKeyframeId = this.id.split("_")[3];
        snaplapse.duplicateKeyframe(thisKeyframeId);
        // Select the element
        UTIL.selectSelectableElements($("#" + composerDivId + " .snaplapse_keyframe_list"), $("#" + keyframeListItem.id));
      });

      // Create play button
      $("#" + playFromHereButtonId).button({
        icons: {
          primary: "ui-icon-play"
        },
        text: true,
        disabled: false
      }).click(function() {
        if (snaplapse.isPlaying()) {
          snaplapse.stop();
        }
        var thisKeyframeId = this.id.split("_")[3];
        snaplapse.play(thisKeyframeId);
      });

      // Create buttonset
      $(".keyframe-button-container").buttonset();

      // Validate the duration on keyup, reformat it on change
      $("#" + durationId).on("change", function() {
        // Validate and sanitize, and get the cleaned duration.
        var newDuration = validateAndSanitizeDuration(durationId);
        var thisKeyframeId = this.id.split("_")[3];
        var keyframe = snaplapse.setDurationForKeyframe(thisKeyframeId, newDuration);
        if (timelapse.getVisualizer())
          timelapse.getVisualizer().updateTagPaths(keyframeListItem.id, keyframe);
      });

      $("#" + speedId).on("change", function() {
        var newSpeed = parseInt(this.value);
        var max = 10000;
        var min = 0;
        if (isNaN(newSpeed)) {
          this.value = 100;
          newSpeed = 100;
        }
        if (newSpeed > max) {
          this.value = max;
          newSpeed = max;
        } else if (newSpeed < min) {
          this.value = min;
          newSpeed = min;
        }
        var thisKeyframeId = this.id.split("_")[3];
        var keyframe = snaplapse.setSpeedForKeyframe(thisKeyframeId, newSpeed);
        if (timelapse.getVisualizer())
          timelapse.getVisualizer().updateTagPaths(keyframeListItem.id, keyframe);
      });

      $("#" + loopTimesId).change(function() {
        if (this.value == "" || !UTIL.isNumber(this.value))
          this.value = 1;
        var newLoopTimes = Math.round(parseInt(this.value));
        this.value = newLoopTimes;
        var thisKeyframeId = this.id.split("_")[3];
        var keyframe = snaplapse.setLoopTimesForKeyframe(thisKeyframeId, newLoopTimes);
        if (timelapse.getVisualizer())
          timelapse.getVisualizer().updateTagPaths(keyframeListItem.id, keyframe);
      });

      // Grab the current video frame and store it as the thumbnail in the canvas
      if (!isKeyframeFromLoad) {
        if (shouldDrawThumbnail) {
          setTimeout(function() {
            setKeyframeThumbail(frame);
          }, 100);
        }
      } else {
        var loadNextKeyframe = function() {
          // Timeout since the seeked event hasn't actually fired yet, so delay a bit
          var waitTime = 700;
          if (!editorEnabled)
            waitTime = 0;
          setTimeout(function() {
            if (timelapse.getVisualizer())
              timelapse.getVisualizer().addTimeTag(keyframes, insertionIndex);
            if (shouldDrawThumbnail) {
              setKeyframeThumbail(frame);
            }
            if (insertionIndex == loadKeyframesLength - 1) {
              $(".loadingOverlay").remove();
              $(document.body).css("cursor", "default");
              var firstFrame = snaplapse.getKeyframes()[0];
              timelapse.warpToBoundingBox(firstFrame.bounds);
              timelapse.seek(firstFrame.time);
              var listeners = eventListeners["snaplapse-loaded"];
              if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                  try {
                    listeners[i](keyframes.length);
                  } catch(e) {
                    UTIL.error(e.name + " while calling snaplapse snaplapse-loaded event listener: " + e.message, e);
                  }
                }
              }
            } else {
              snaplapse.loadFromJSON(undefined, insertionIndex + 1);
            }
          }, waitTime);
          if (editorEnabled)
            videoset.removeEventListener('video-seeked', loadNextKeyframe);
        };
        if (editorEnabled)
          videoset.addEventListener('video-seeked', loadNextKeyframe);
        else
          loadNextKeyframe();
      }
      // Override the color of keyframe items
      var tagColor;
      if (timelapse.getVisualizer()) {
        tagColor = timelapse.getTagColor();
      } else {
        tagColor = [1, 1, 1];
      }
      keyframeListItem.style.backgroundColor = "rgba(" + tagColor[0] + "," + tagColor[1] + "," + tagColor[2] + ",0)";
      // Select the element
      UTIL.selectSelectableElements($("#" + composerDivId + " .snaplapse_keyframe_list"), $("#" + keyframeListItem.id));
      // Hide the last keyframe transition area
      snaplapse.hideLastKeyframeTransition();
      timelapse.handleEditorModeToolbarChange();
      $(".addTimetag").button("option", "disabled", false);
      // The reason to hide and show the elements is the workaround for a webkit refresh bug
      $(".snaplapse_keyframe_container").hide().show(0);

      resetKeyframeTransitionUI(buildConstraint, keyframeListItem.id);
    };

    var resetKeyframeTransitionUI = function(buildConstraint, keyframeElementId) {
      if (buildConstraint == "duration") {
        $("#" + keyframeElementId + "_duration").prop('disabled', false);
        $("#" + keyframeElementId + "_speed").prop('disabled', true);
        $("#" + keyframeElementId + "_loopTimes").prop('disabled', true);
      } else if (buildConstraint == "speed") {
        $("#" + keyframeElementId + "_duration").prop('disabled', true);
        $("#" + keyframeElementId + "_speed").prop('disabled', false);
        $("#" + keyframeElementId + "_loopTimes").prop('disabled', false);
      }
    };

    var checkTextareaMaxlength = function(thisTextarea, maxlength) {
      if ($(thisTextarea).val().length > maxlength) {
        var text = $(thisTextarea).val();
        $(thisTextarea).val(text.substr(0, maxlength));
      }
    };

    var validateAndSanitizeDuration = function(durationId) {
      var durationField = $("#" + durationId);
      var durationStr = durationField.val().trim();

      if (durationStr.length > 0) {
        var num = parseFloat(durationStr);

        if (!isNaN(num) && (num >= 0)) {
          return num.toFixed(1);
        }
      }
      return '';
    };

    var recordKeyframe = function() {
      if (snaplapse) {
        // If there's a keyframe already selected, then we'll append after that one.  Otherwise, just append to the end.
        var selectedItems = $("#" + composerDivId + " .snaplapse_keyframe_list > .ui-selected");
        var numSelected = selectedItems.size();

        if (numSelected == 1) {
          var id = selectedItems.get(0).id;
          var keyframeId = id.split("_")[3];
          snaplapse.recordKeyframe(keyframeId);
        } else {
          snaplapse.recordKeyframe();
        }
      }
    };
    this.recordKeyframe = recordKeyframe;

    var cacheSnaplapse = function(snaplapseJsonUrl, callback) {
      $.ajax({
        dataType: 'json',
        url: snaplapseJsonUrl,
        success: function(snaplapseJSON) {
          if (snaplapseJSON) {
            //org.gigapan.Util.log("Loaded this snaplapse JSON: [" + JSON.stringify(snaplapseJSON) + "]");
            cachedSnaplapses[snaplapseJsonUrl] = snaplapseJSON;
            if (callback && typeof callback == 'function') {
              callback();
            }
          } else {
            org.gigapan.Util.error("Failed to load snaplapse json from URL [" + snaplapseJsonUrl + "]");
          }
        },
        error: function() {
          org.gigapan.Util.error("Error loading snaplapse json from URL [" + snaplapseJsonUrl + "]");
        }
      });
      return false;
    };

    // This function finds all the links to snaplapses generated by the Template:SnaplapseLinkAJAX wiki template, fetches
    // the referenced snaplapse JSON via AJAX (and caches it), and creates a link to play the snaplapse.  This code assumes
    // that the wiki template Template:SnaplapseLinkAJAX converts this wiki code...
    //
    //    {{SnaplapseLinkAJAX|filename=Brassica_1.warp|label=cotyledon development}}
    //
    // ...to this HTML...
    //
    //    <span class="snaplapse_link">
    //       <span class="snaplapse_label">cotyledon development</span>
    //       <span class="snaplapse_filename" style="display:none"><a href="/images/8/8d/Brassica_1.warp" class="internal" title="Brassica 1.warp">Media:Brassica_1.warp</a></span>
    //    </span>
    //
    // This code will take the above HTML and modify it to be simply:
    //
    //    <a href="#timelapse_viewer_anchor" onclick="playCachedSnaplapse('http://lauwers.ece.cmu.edu/images/8/8d/Brassica_1.warp');">cotyledon development</a>
    //

    var setupSnaplapseLinks = function() {
      $(".snaplapse_link").each(function(index, elmt) {
        var linkSpan = $(elmt);
        var labelSpan = linkSpan.children().first();
        var filenameSpan = labelSpan.next();
        var snaplapseJsonUrl = filenameSpan.children('a').first().get(0).href;
        filenameSpan.detach();
        var originalContent = labelSpan.html();

        org.gigapan.Util.log("setupSnaplapseLinks(): [" + index + "]" + labelSpan.text() + "|" + snaplapseJsonUrl + "|" + originalContent);

        if (!browserSupported) {
          linkSpan.replaceWith('<a class="time_warp_link" href="#" onclick="loadVideoSnaplapse(\'' + filenameSpan.text() + '\');return false;">' + originalContent + '</a>');
        } else {
          cacheSnaplapse(snaplapseJsonUrl, function() {
            linkSpan.replaceWith('<a class="time_warp_link" href="#" onclick="playCachedSnaplapse(\'' + snaplapseJsonUrl + '\');return false;">' + originalContent + '</a>');
          });
        }
      });
    };

    var _playStopSnaplapse = function() {
      if (snaplapse.isPlaying()) {
        snaplapse.stop();
      } else {
        snaplapse.play();
      }
    };
    this.playStopSnaplapse = _playStopSnaplapse;

    var saveSnaplapse = function() {
      if (snaplapse && (snaplapse.getNumKeyframes() >= 1)) {
        var tourUrl = snaplapse.getAsUrlString();
        $("#" + composerDivId + " .saveTimewarpWindow").dialog("open");
        $("#" + composerDivId + " .saveTimewarpWindow_JSON").val("http://earthengine.google.org/#timelapse/tour=" + tourUrl).focus().select().click(function() {
          $(this).focus().select();
        });
        $("#" + composerDivId + " .saveTimewarpWindow_JSON2").val('<iframe width="854" height="480" src="http://earthengine.google.org/timelapse/player?c=http%3A%2F%2Fearthengine.google.org%2Ftimelapse%2Fdata#tour=' + tourUrl + '" frameborder="0"></iframe>').click(function() {
          $(this).focus().select();
        });
      } else {
        alert("ERROR: No tour to save--please create a tour and add at least two keyframes to it.");
      }
    };
    this.saveSnaplapse = saveSnaplapse;

    var showLoadSnaplapseWindow = function() {
      activeSnaplapse = thisObj;
      $("#" + composerDivId + " .loadTimewarpWindow").dialog("open");
      $("#" + composerDivId + " .loadTimewarpWindow_JSON").val("");
    };
    this.showLoadSnaplapseWindow = showLoadSnaplapseWindow;

    var showSetSnaplapseWindow = function() {
      activeSnaplapse = thisObj;
      $("#" + composerDivId + " .setTimewarpWindow").dialog("open");
    };
    this.showSetSnaplapseWindow = showSetSnaplapseWindow;

    var _loadSnaplapse = function(json) {
      if (newSnaplapse(json)) {
        $('#' + composerDivId + " .snaplapse_composer_controls").show();
        $("#" + composerDivId + " .loadTimewarpWindow").dialog("close");
        hideAnnotationBubble();
        timelapse.handleEditorModeToolbarChange();
      } else {
        alert("ERROR: Invalid tour file.");
      }
    };
    this.loadSnaplapse = _loadSnaplapse;

    var deleteSelectedKeyframes = function() {
      var selectedItems = $("#" + composerDivId + " .snaplapse_keyframe_list > .ui-selected");
      var numSelected = selectedItems.size();

      if (numSelected > 0) {
        var selectedKeyframeElements = selectedItems.get();
        for (var i = 0; i < numSelected; i++) {
          var keyframeElement = selectedKeyframeElements[i];
          var id = keyframeElement['id'];
          var keyframeId = id.split("_")[3];
          $("#" + id).remove();
          snaplapse.deleteKeyframeById(keyframeId);

          timelapse.handleEditorModeToolbarChange();
          // The reason to hide and show the elements is to workaround a webkit refresh bug
          $(".snaplapse_keyframe_container").hide().show(0);
        }

        handleSnaplapseFrameSelectionChange(false);
      }
    };
    this.deleteSelectedKeyframes = deleteSelectedKeyframes;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    if ($("#" + timelapseViewerDivId + " .customEditorControl").length == 0) {
      $("#" + timelapseViewerDivId).append('<div class="snaplapseTourPlayBack playTour"></div>');
      $("#" + timelapseViewerDivId).append('<div class="tourLoadOverlay"><div class="tourLoadOverlayTitleContainer"><div class="tourLoadOverlayTitle"></div></div><img class="tourLoadOverlayPlay" title="Click to start the tour" src="images/tour_play_outline.png"></div></div>');
    }
    timelapse.setSnaplapseViewer(thisObj);
    initializeSnaplapseUI();
    newSnaplapse(null);
  };
})();
