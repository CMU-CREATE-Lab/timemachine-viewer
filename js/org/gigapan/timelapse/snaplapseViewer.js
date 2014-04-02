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
var KEYFRAME_THUMBNAIL_WIDTH = 126;
// should really be 56.25
var KEYFRAME_THUMBNAIL_HEIGHT = 73;

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

// Legacy code for wiki
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
  org.gigapan.timelapse.snaplapse.SnaplapseViewer = function(snaplapse, timelapse, settings, usePresentationSlider) {
    var didOnce = false;
    var thisObj = this;
    var videoset = timelapse.getVideoset();
    var viewerType = UTIL.getViewerType();
    var composerDivId = snaplapse.getComposerDivId();
    var timelapseViewerDivId = timelapse.getViewerDivId();
    var maxSubtitleLength = 120;
    var datasetType = timelapse.getDatasetType();
    var startEditorFromPresentationMode = settings["startEditorFromPresentationMode"] ? settings["startEditorFromPresentationMode"] : false;
    var showEditorOnLoad = ( typeof (settings["showEditorOnLoad"]) == "undefined") ? false : settings["showEditorOnLoad"];
    var rootURL;
    var rootEmbedURL;
    var embedWidth = 854;
    var embedHeight = 480;
    var useThumbnailServer = ( typeof (settings["useThumbnailServer"]) == "undefined") ? true : settings["useThumbnailServer"];
    var $sortable;
    var sortingStartDistance = 30;
    var moveOneKeyframeIdx = {
      from: undefined,
      to: undefined
    };
    var $videoSizeSelect;
    var $createSubtitle_dialog = $("#" + composerDivId + " .createSubtitle_dialog");
    var $keyframeContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");

    var eventListeners = {};
    var editorEnabled = timelapse.getEditorEnabled();

    var rootAppURL = org.gigapan.Util.getRootAppURL();

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
      var $modisSpeedControl = $("#" + timelapseViewerDivId + " .modisToggleSpeed");
      var $googleLogo = $("#" + timelapseViewerDivId + " .googleLogo");
      var $googleMapToggle = $("#" + timelapseViewerDivId + " .toggleGoogleMapBtn");
      var $contextMapResizer = $("#" + timelapseViewerDivId + " .smallMapResizer");
      var $customTimeline = $("#" + timelapseViewerDivId + " .customTimeline");
      var $customHelpLabel = $("#" + timelapseViewerDivId + " .customHelpLabel");
      var $customPlay = $("#" + timelapseViewerDivId + " .customPlay");
      var $modisCustomPlay = $("#" + timelapseViewerDivId + " .modisCustomPlay");
      var $timeText = $("#" + timelapseViewerDivId + " .timeText");
      var $sideToolBar = $("#" + timelapseViewerDivId + " .sideToolBar");
      var $modisTimeText = $("#" + timelapseViewerDivId + " .modisTimeText");
      var $monthSpinnerContainer = $("#" + timelapseViewerDivId + " .monthSpinnerContainer");
      var $toggleLock = $("#" + timelapseViewerDivId + " .toggleLock");
      var $scaleBarContainer = $("#" + timelapseViewerDivId + " .scaleBarContainer");

      $sideToolBar.hide();
      $customTimeline.hide();
      $speedControl.hide();
      $modisSpeedControl.hide();
      $customHelpLabel.hide();
      $googleLogo.css("bottom", "-=" + 45 + "px");
      $customPlay.hide();
      $modisCustomPlay.hide();
      $timeText.addClass("timeTextTour");
      $googleMapToggle.hide();
      $contextMapResizer.hide();
      $modisTimeText.css("top", "+=25px");
      $monthSpinnerContainer.css("top", "+=25px");
      $toggleLock.hide();
      if (datasetType == "modis")
        $scaleBarContainer.css("bottom", "-=25px");
      if (editorEnabled)
        moveDescriptionBox("down");
    };
    this.hideViewerUI = hideViewerUI;

    var showViewerUI = function() {
      var $googleLogo = $("#" + timelapseViewerDivId + " .googleLogo");
      var $googleMapToggle = $("#" + timelapseViewerDivId + " .toggleGoogleMapBtn");
      var $contextMapResizer = $("#" + timelapseViewerDivId + " .smallMapResizer");
      var $customTimeline = $("#" + timelapseViewerDivId + " .customTimeline");
      var $customHelpLabel = $("#" + timelapseViewerDivId + " .customHelpLabel");
      var $customPlay = $("#" + timelapseViewerDivId + " .customPlay");
      var $modisCustomPlay = $("#" + timelapseViewerDivId + " .modisCustomPlay");
      var $timeText = $("#" + timelapseViewerDivId + " .timeText");
      var $sideToolBar = $("#" + timelapseViewerDivId + " .sideToolBar");
      var $modisTimeText = $("#" + timelapseViewerDivId + " .modisTimeText");
      var $monthSpinnerContainer = $("#" + timelapseViewerDivId + " .monthSpinnerContainer");
      var $toggleLock = $("#" + timelapseViewerDivId + " .toggleLock");
      var $scaleBarContainer = $("#" + timelapseViewerDivId + " .scaleBarContainer");

      $customTimeline.show();
      $customHelpLabel.show();
      $googleLogo.css("bottom", "+=" + 45 + "px");
      $customPlay.show();
      $modisCustomPlay.show();
      $timeText.removeClass("timeTextTour");
      $googleMapToggle.show();
      $contextMapResizer.show();
      $sideToolBar.show();
      $modisTimeText.css("top", "-=25px");
      $monthSpinnerContainer.css("top", "-=25px");
      $toggleLock.show();
      if (datasetType == "modis")
        $scaleBarContainer.css("bottom", "+=25px");
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
          left: "-440px"
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
            "src": rootAppURL + "images/tour_stop_outline.png",
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

      if (!usePresentationSlider) {
        initializeTourOverlyUI();
        // Stop tour button if in viewing only mode
        $("#" + timelapseViewerDivId + " .snaplapseTourPlayBack").click(function() {
          if ($(this).hasClass("playTour"))
            snaplapse.play();
          else
            snaplapse.stop();
        });
      }

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
        $("#" + composerDivId + " .saveTimewarpWindow_JSON").val(rootURL + tourUrl);
        $("#" + composerDivId + " .saveTimewarpWindow_JSON2").val('<iframe width="' + embedWidth + '" height="' + embedHeight + '" src="' + rootEmbedURL + tourUrl + '" frameborder="0"></iframe>');
        $("#" + composerDivId + " .saveTimewarpWindow_JSON2_sizes").trigger("change");
      });

      $videoSizeSelect = $("#" + composerDivId + " .saveTimewarpWindow_JSON2_sizes");
      $videoSizeSelect.change(function() {
        var sizeArray = $(this).val().split(",");
        if (sizeArray.length == 2) {
          embedWidth = sizeArray[0];
          embedHeight = sizeArray[1];
          $("#" + composerDivId + " .saveTimewarpWindow_JSON2").val('<iframe width="' + embedWidth + '" height="' + embedHeight + '" src="' + rootEmbedURL + snaplapse.getAsUrlString() + '" frameborder="0"></iframe>');
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
        var match = fullURL.match(/(tour|presentation)=([^#?&]*)/);
        if (match) {
          var tour = match[2];
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
        height: 484
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
      $sortable = $("#" + composerDivId + " .snaplapse_keyframe_list");
      $sortable.sortable({
        axis: "x",
        cursor: "move",
        distance: sortingStartDistance,
        tolerance: "pointer",
        scrollSensitivity: 150,
        delay: 100,
        start: function(event, ui) {
          moveOneKeyframeIdx.from = $(ui.item).index();
          $sortable.sortable("refreshPositions").sortable("refresh");
          ui.item.animate({
            "opacity": "0.5"
          }, 300);
        },
        stop: function(event, ui) {
          var newIdx = $(ui.item).index();
          moveOneKeyframeIdx.to = newIdx;
          snaplapse.moveOneKeyframe(moveOneKeyframeIdx);
          $sortable.sortable("refreshPositions").sortable("refresh");
          if (!startEditorFromPresentationMode)
            snaplapse.hideLastKeyframeTransition(newIdx);
          ui.item.animate({
            "opacity": "1"
          }, 300);
        },
        change: function(event, ui) {
          $sortable.sortable("refreshPositions").sortable("refresh");
        }
      });

      // Add mouse event handlers to the Play/Stop button in the viewer
      $("#" + timelapseViewerDivId + ' .stopTimeWarp').click(function() {
        _playStopSnaplapse();
        return false;
      });

      // Finally, set up the snaplapse links
      setupSnaplapseLinks();

      if (usePresentationSlider)
        $createSubtitle_dialog.remove();
      else {
        $createSubtitle_dialog.dialog({
          autoOpen: false,
          height: 250,
          width: 310,
          modal: true,
          resizable: false,
          buttons: {
            "Finish and Close": function() {
              $(this).dialog("close");
            }
          }
        });
        // Display the text annotation when you focus on the description field.
        $(".subtitle_textarea").on("focus", function(event) {
          var thisKeyframeId = $createSubtitle_dialog.dialog("option", "keyframeId");
          var thisKeyframe = snaplapse.getKeyframeById(thisKeyframeId);
          displaySnaplapseFrameAnnotation(thisKeyframe);
          checkTextareaMaxlength(this, maxSubtitleLength);
        }).on("keyup", function(event) {
          // Save the text annotation on keyup, so that we don't need a save button
          var thisKeyframeId = $createSubtitle_dialog.dialog("option", "keyframeId");
          snaplapse.setTextAnnotationForKeyframe(thisKeyframeId, $(this).val(), true);
          var thisKeyframe = snaplapse.getKeyframeById(thisKeyframeId);
          displaySnaplapseFrameAnnotation(thisKeyframe);
          checkTextareaMaxlength(this, maxSubtitleLength);
        }).on("paste", function() {// Set text limit
          checkTextareaMaxlength(this, maxSubtitleLength);
        });
        // Display the keyframe title when you focus on the text input.
        $(".keyframe_title_input").on("focus", function(event) {
          var thisKeyframeId = $createSubtitle_dialog.dialog("option", "keyframeId");
          setKeyframeTitleUI(snaplapse.getKeyframeById(thisKeyframeId));
        }).on("keyup", function(event) {
          // Save the text annotation on keyup, so that we don't need a save button
          var thisKeyframeId = $createSubtitle_dialog.dialog("option", "keyframeId");
          snaplapse.setTitleForKeyframe(thisKeyframeId, $(this).val(), true);
          setKeyframeTitleUI(snaplapse.getKeyframeById(thisKeyframeId));
        });
      }

      // Set the position
      var $tiledContentHolder = $("#" + timelapseViewerDivId + " .tiledContentHolder");
      var playerOffset = $tiledContentHolder.offset();
      var newTop = $("#" + timelapseViewerDivId + " .toolbar").outerHeight() + $tiledContentHolder.outerHeight() + playerOffset.top - 1;
      var newLeft = playerOffset.left;
      var newWidth = $tiledContentHolder.width();
      $("#" + composerDivId + " .snaplapse_keyframe_container").css({
        "position": "absolute",
        "top": newTop + "px",
        "left": newLeft + "px",
        "width": newWidth + "px"
      });
      if (!usePresentationSlider) {
        if (!editorEnabled || !settings["enableCustomUI"]) {
          if (!showEditorOnLoad)
            $("#" + composerDivId).hide();
          if (!settings["enableCustomUI"])
            moveDescriptionBox("up");
        } else
          moveDescriptionBox("up");
      } else
        $("#" + composerDivId).hide();
    };

    var moveDescriptionBox = function(direction) {
      var descriptionOffset;
      if (datasetType == undefined) {
        descriptionOffset = 47;
      } else {
        var customEditorControlOuterHeight = $("#" + timelapseViewerDivId + " .customEditorControl").outerHeight() || 41;
        descriptionOffset = customEditorControlOuterHeight ? customEditorControlOuterHeight + 20 : 0;
      }
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

    var handleSnaplapseFrameSelectionChange = function() {
      if (snaplapse.isPlaying()) {
        return;
      }

      var selectedItems = $("#" + composerDivId + " .snaplapse_keyframe_list > .ui-selected");
      var numSelected = selectedItems.size();
      displaySnaplapseFrameAnnotation(null);

      if (numSelected == 1) {
        var id = selectedItems.get(0).id;
        var keyframeId = id.split("_")[3];
        var frame = snaplapse.getKeyframeById(keyframeId);
        setKeyframeTitleUI(frame);
      }
    };

    var setKeyframeCaptionUI = function(frame, element, wantToHide) {
      var $keyframeSubtitleBox = $("#" + composerDivId + " .keyframeSubtitleBoxForHovering");
      var $keyframeSubtitle = $keyframeSubtitleBox.find("p");
      if (wantToHide == true)
        $keyframeSubtitleBox.stop(true, true).fadeOut(200);
      else {
        if (isTextNonEmpty(frame['unsafe_string_description'])) {
          $keyframeSubtitle.text(frame["unsafe_string_description"]);
          var $element = $(element);
          var containerOffset = $keyframeContainer.offset();
          var containerWidth = $keyframeContainer.width();
          var elementOffset = $element.offset();
          var elementWidth = $element.width();
          var captionWidth = $keyframeSubtitleBox.width();
          var documentHeight = $(document).height();
          var pointerLeft = elementOffset.left + elementWidth / 2;
          var captionLeft = pointerLeft - captionWidth / 2;
          var distanceBetweenElementAndLeftEdge = elementOffset.left + elementWidth - containerOffset.left;
          var distanceBetweenElementAndRightEdge = containerWidth - elementOffset.left + containerOffset.left;
          var minCaptionLeft = containerOffset.left;
          var maxCaptionLeft = containerWidth - captionWidth + containerOffset.left;
          var minPointerLeft = containerOffset.left;
          var maxPointerLeft = containerWidth + containerOffset.left;
          if (captionLeft < minCaptionLeft)
            captionLeft = minCaptionLeft + 5;
          else if (captionLeft > maxCaptionLeft)
            captionLeft = maxCaptionLeft - 5;
          if (pointerLeft < minPointerLeft && distanceBetweenElementAndLeftEdge > 19)
            pointerLeft = minPointerLeft + 5;
          else if (pointerLeft > maxPointerLeft && distanceBetweenElementAndRightEdge > 19)
            pointerLeft = maxPointerLeft - 5;
          var pointerLeftPercent = ((pointerLeft - captionLeft) / captionWidth) * 100;
          $keyframeSubtitleBox.css({
            "left": captionLeft + "px",
            "bottom": (documentHeight - elementOffset.top + 9) + "px"
          });
          $keyframeSubtitle.css({
            "background-position": pointerLeftPercent + "% 100%"
          });
          $keyframeSubtitleBox.stop(true, true).fadeIn(200);
        } else
          $keyframeSubtitleBox.stop(true, true).fadeOut(200);
      }
    };

    var setKeyframeTitleUI = function(frame, wantToHide) {
      var $thisKeyframeTitle = $("#" + composerDivId + "_snaplapse_keyframe_" + frame.id + "_title");
      if (wantToHide == true)
        $thisKeyframeTitle.hide();
      else {
        if (isTextNonEmpty(frame['unsafe_string_frameTitle'])) {
          if (frame['is-description-visible']) {
            $thisKeyframeTitle.text(frame["unsafe_string_frameTitle"]);
            $thisKeyframeTitle.show();
          }
        } else
          $thisKeyframeTitle.hide();
      }
    };

    var setPresentationMode = function(status) {
      var $snaplapseContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");
      if (status == true) {
        startEditorFromPresentationMode = true;
        $snaplapseContainer.find(".snaplapse_keyframe_list_item").css("margin-left", "-1px");
        $snaplapseContainer.find(".snaplapse_keyframe_list_item_play_button").hide();
        $snaplapseContainer.find(".transition_table").hide();
        $videoSizeSelect.find("option[value='750,530']").attr('selected', 'selected');
      } else {
        startEditorFromPresentationMode = false;
        $snaplapseContainer.find(".snaplapse_keyframe_list_item").css("margin-left", "0px");
        $snaplapseContainer.find(".snaplapse_keyframe_list_item_play_button").show();
        $snaplapseContainer.find(".transition_table").show();
        $videoSizeSelect.find("option[value='854,480']").attr('selected', 'selected');
      }
      setRootURLs();
    };
    this.setPresentationMode = setPresentationMode;

    var setRootURLs = function() {
      var parentUrl = "";
      var sourceUrl = window.location.href.split("#")[0];
      // TODO: link to our page on the time machine website
      if (window.top === window.self) {
        // no iframe
        parentUrl = sourceUrl;
      } else {
        // inside iframe
        try {
          parentUrl = window.top.location.href.split("#")[0];
        } catch(e) {
          parentUrl = document.referrer.split("#")[0];
        }
      }
      if (startEditorFromPresentationMode) {
        rootURL = parentUrl + "#presentation=";
        rootEmbedURL = sourceUrl + "#presentation=";
      } else {
        rootURL = parentUrl + "#tour=";
        rootEmbedURL = sourceUrl + "#tour=";
        if (datasetType == "landsat") {
          rootURL = "http://earthengine.google.org/#timelapse/tour=";
          rootEmbedURL = "http://earthengine.google.org/timelapse/player?c=http%3A%2F%2Fearthengine.google.org%2Ftimelapse%2Fdata#tour=";
        }
      }
    };

    var displaySnaplapseFrameAnnotation = function(frame) {
      if (frame && !usePresentationSlider) {
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
        if (usePresentationSlider)
          setToPresentationViewOnlyMode();
        var $playbackButton = $("#" + timelapseViewerDivId + ' .playbackButton');
        var $controls = $("#" + timelapseViewerDivId + ' .controls');
        var $sideToolbar = $("#" + timelapseViewerDivId + ' .sideToolBar');
        snaplapse.addEventListener('play', function() {
          var visualizer = timelapse.getVisualizer();
          var isFullScreen = timelapse.isFullScreen();
          var $snaplapseContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");

          // Add mask to viewer to prevent clicking
          $("#" + timelapseViewerDivId).append('<div class="snaplapsePlayingMaskViewer"></div>');
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
            label: "Stop Tour"
          }).addClass("isPlaying");
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
          if (datasetType == undefined) {
            $sideToolbar.stop(true, true).fadeOut(100);
            $controls.stop(true, true).fadeOut(100);
            moveDescriptionBox("down");
          }
          $("#" + timelapseViewerDivId + ' .stopTimeWarp').show();
          $("#" + timelapseViewerDivId + ' .addressLookup').attr("disabled", "disabled");
          $("#" + timelapseViewerDivId + ' .timelineSlider').slider("disable");
          $("#" + timelapseViewerDivId + " .tourLoadOverlayPlay").attr("src", rootAppURL + "images/tour_stop_outline.png").css("opacity", "1.0");
          $("#" + timelapseViewerDivId + " .snaplapseTourPlayBack").css("left", "0px").toggleClass("playTour stopTour").attr("title", "Click to stop this tour");
          $("#" + timelapseViewerDivId + " .videoQualityContainer").css("left", "20px");
          $sortable.css("opacity", "0.5");
        });

        snaplapse.addEventListener('stop', function() {
          var visualizer = timelapse.getVisualizer();
          var isFullScreen = timelapse.isFullScreen();

          $("#" + timelapseViewerDivId + " .snaplapsePlayingMaskViewer").remove();
          $("#" + composerDivId + " .snaplapsePlayingMask").remove();
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
            label: "Play Tour"
          }).removeClass("isPlaying");
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
          if (datasetType == undefined) {
            $sideToolbar.stop(true, true).fadeIn(100);
            $controls.stop(true, true).fadeIn(100);
            moveDescriptionBox("up");
          }
          $("#" + timelapseViewerDivId + ' .repeatCheckbox').button("enable");
          $("#" + timelapseViewerDivId + ' .help').removeClass("disabled").addClass("enabled");
          $("#" + timelapseViewerDivId + ' .addressLookup').removeAttr("disabled");
          hideAnnotationBubble();
          $("#" + timelapseViewerDivId + ' .timelineSlider').slider("enable");
          $("#" + timelapseViewerDivId + " .tourLoadOverlayPlay").attr("src", rootAppURL + "images/tour_replay_outline.png").css("opacity", "1.0");
          $("#" + timelapseViewerDivId + " .snaplapseTourPlayBack").css("left", "60px").toggleClass("stopTour playTour").attr("title", "Click to replay this tour");
          $("#" + timelapseViewerDivId + " .videoQualityContainer").css("left", "95px");
          $sortable.css("opacity", "1");
        });

        snaplapse.addEventListener('keyframe-added', function(keyframe, insertionIndex, keyframes) {
          addSnaplapseKeyframeListItem(keyframe, insertionIndex, true, undefined, keyframes);
        });

        snaplapse.addEventListener('keyframe-loaded', function(keyframe, insertionIndex, keyframes, loadKeyframesLength) {
          addSnaplapseKeyframeListItem(keyframe, insertionIndex, true, true, keyframes, loadKeyframesLength);
        });

        snaplapse.addEventListener('keyframe-modified', function(keyframe) {
          $("#" + composerDivId + "_snaplapse_keyframe_" + keyframe['id'] + "_timestamp").text(keyframe['captureTime']);
          // TODO: check if the thumbnail server is down and set the flag automatically
          if (useThumbnailServer)
            loadThumbnailFromServer(keyframe);
          else
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
      $sortable.empty();
      $("#" + timelapseViewerDivId + " .snaplapse-annotation-description > div").text("");

      if ( typeof json != 'undefined' && json != null) {
        if (!editorEnabled && !usePresentationSlider)
          timelapse.pause();
        if (usePresentationSlider) {
          $("#" + composerDivId).show();
          if (settings["enableCustomUI"] && editorEnabled) {
            $("#" + settings["composerDiv"]).hide();
            $("#" + timelapseViewerDivId + " .customEditorControl").css("visibility", "hidden");
          }
        }
        if (!editorEnabled && !usePresentationSlider) {
          $("#" + timelapseViewerDivId + " .tourLoadOverlay").show();
          $("#" + timelapseViewerDivId + " .tourLoadOverlayPlay").show();
          timelapse.getSnaplapse().getSnaplapseViewer().hideViewerUI();
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
      if (insertionIndex < keyframeListItems.length && isKeyframeFromLoad != true)
        $("#" + keyframeListItems[insertionIndex - 1]['id']).after(keyframeListItem);
      else
        $sortable.append(keyframeListItem);

      var thumbnailId = keyframeListItem.id + "_thumbnail";
      var timestampId = keyframeListItem.id + "_timestamp";
      var descriptionVisibleCheckboxId = keyframeListItem.id + "_description_visible";
      var descriptionVisibleCheckboxLabelId = keyframeListItem.id + "_description_label";
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
      var titleId = keyframeListItem.id + "_title";
      var tableId = keyframeListItem.id + "_table";
      var keyframeTableId = keyframeListItem.id + "_keyframeTable";
      var transitionTableId = keyframeListItem.id + "_transitionTable";
      var thumbnailButtonId = keyframeListItem.id + "_thumbnailButton";

      var duration = typeof frame['duration'] != 'undefined' && frame['duration'] != null ? frame['duration'] : '';
      var speed = typeof frame['speed'] != 'undefined' && frame['speed'] != null ? frame['speed'] : 100;
      var isDescriptionVisible = typeof frame['is-description-visible'] == 'undefined' ? true : frame['is-description-visible'];
      var buildConstraint = typeof frame['buildConstraint'] == 'undefined' ? "speed" : frame['buildConstraint'];
      var loopTimes = typeof frame['loopTimes'] == 'undefined' ? null : frame['loopTimes'];
      var disableTourLooping = ( typeof settings['disableTourLooping'] == "undefined") ? false : settings['disableTourLooping'];

      var content = '';
      if (!usePresentationSlider) {
        // Tour or presentation editor
        content += '<table id="' + tableId + '" border="0" cellspacing="0" cellpadding="0" class="snaplapse_keyframe_list_item_table">';
        content += '  <tr valign="center">';
        content += '    <td valign="center" id="' + keyframeTableId + '" class="keyframe_table">';
        content += '      <div id="' + timestampId + '" class="snaplapse_keyframe_list_item_timestamp">' + frame['captureTime'] + '</div>';
        content += '			<div id="' + thumbnailButtonId + '" class="snaplapse_keyframe_list_item_thumbnail_container" title="Warp to this frame">';
        content += '				<div class="snaplapse_keyframe_list_item_thumbnail_overlay"></div>';
        if (useThumbnailServer)
          content += '      	<img id="' + thumbnailId + '" width="' + KEYFRAME_THUMBNAIL_WIDTH + '" height="' + KEYFRAME_THUMBNAIL_HEIGHT + '" class="snaplapse_keyframe_list_item_thumbnail"></img>';
        else
          content += '      	<canvas id="' + thumbnailId + '" width="' + KEYFRAME_THUMBNAIL_WIDTH + '" height="' + KEYFRAME_THUMBNAIL_HEIGHT + '" class="snaplapse_keyframe_list_item_thumbnail"></canvas>';
        content += '				<div id="' + titleId + '" class="snaplapse_keyframe_list_item_title"></div>';
        content += '			</div>';
        content += '      <div id="' + buttonContainerId + '" class="keyframe-button-container">';
        content += '        <button id="' + updateButtonId + '" title="Update this keyframe to current view">&nbsp</button>';
        content += '        <button id="' + duplicateButtonId + '" title="Duplicate this keyframe">&nbsp</button>';
        content += '        <button id="' + playFromHereButtonId + '" class="snaplapse_keyframe_list_item_play_button" title="Play warp starting at this keyframe">&nbsp</button>';
        content += '        <input class="snaplapse_keyframe_list_item_description_checkbox" id="' + descriptionVisibleCheckboxId + '" type="checkbox" ' + ( isDescriptionVisible ? 'checked="checked"' : '') + '/>';
        content += '        <label class="snaplapse_keyframe_list_item_description_label" id="' + descriptionVisibleCheckboxLabelId + '" title="Enable/Disable subtitle" for="' + descriptionVisibleCheckboxId + '">&nbsp</label>';
        content += '      </div>';
        content += '    </td>';
        content += '    <td valign="center" id="' + transitionTableId + '" class="transition_table">';
        content += '      <table border="0" cellspacing="0" cellpadding="0" class="transition_table_mask">';
        content += '  			<tr>';
        content += '  				<td>';
        content += '						<input class="snaplapse_keyframe_list_item_loopRadio" type="radio" name="' + transitionSelection + '" id="' + speedBlockId + '"  value="speed" ' + (buildConstraint == "speed" ? 'checked="checked"' : '') + '/>';
        content += '					</td>';
        content += '  				<td>';
        content += '        		<div class="snaplapse_keyframe_list_item_loop_container">';
        content += '          		<span class="snaplapse_keyframe_list_item_loop_label" id="' + loopTextId + '">Loops:</span>';
        content += '          		<input type="text" id="' + loopTimesId + '" class="snaplapse_keyframe_list_item_loop" title="Times for looping the entire video" value="' + loopTimes + '">';
        content += '        		</div>';
        content += '						<div class="snaplapse_keyframe_list_item_speed_container">';
        content += '          		<span class="snaplapse_keyframe_list_item_speed_label_1">Speed:</span>';
        content += '          		<input type="text" id="' + speedId + '" class="snaplapse_keyframe_list_item_speed" value="' + speed + '">';
        content += '          		<span class="snaplapse_keyframe_list_item_speed_label_2">%</span>';
        content += '        		</div>';
        content += '					</td>';
        content += '				</tr>';
        content += '  			<tr>';
        content += '  				<td>';
        content += '						<input class="snaplapse_keyframe_list_item_durationRadio" type="radio" name="' + transitionSelection + '" id="' + durationBlockId + '" value="duration" ' + (buildConstraint == "duration" ? 'checked="checked"' : '') + '/>';
        content += '					</td>';
        content += '  				<td>';
        content += '        		<div class="snaplapse_keyframe_list_item_duration_container">';
        content += '          		<span class="snaplapse_keyframe_list_item_duration_label_1">Duration:</span>';
        content += '          		<input type="text" id="' + durationId + '" class="snaplapse_keyframe_list_item_duration" value="' + duration + '">';
        content += '          		<span class="snaplapse_keyframe_list_item_duration_label_2">secs</span>';
        content += '        		</div>';
        content += '					</td>';
        content += '				</tr>';
        content += '      </table>';
        content += '    </td>';
        content += '  </tr>';
        content += '</table>';
      } else {
        // Presentation mode view only state
        content += '			<div id="' + thumbnailButtonId + '" class="snaplapse_keyframe_list_item_thumbnail_container_presentation" title="">';
        content += '				<div class="snaplapse_keyframe_list_item_thumbnail_overlay_presentation"></div>';
        if (useThumbnailServer)
          content += '      	<img id="' + thumbnailId + '" width="' + KEYFRAME_THUMBNAIL_WIDTH + '" height="' + KEYFRAME_THUMBNAIL_HEIGHT + '" class="snaplapse_keyframe_list_item_thumbnail"></img>';
        else
          content += '      	<canvas id="' + thumbnailId + '" width="' + KEYFRAME_THUMBNAIL_WIDTH + '" height="' + KEYFRAME_THUMBNAIL_HEIGHT + '" class="snaplapse_keyframe_list_item_thumbnail"></canvas>';
        content += '				<div id="' + titleId + '" class="snaplapse_keyframe_list_item_title"></div>';
        content += '			</div>';
      }

      $("#" + keyframeListItem.id).html(content).addClass("snaplapse_keyframe_list_item");

      if (usePresentationSlider)
        $("#" + keyframeListItem.id).addClass("snaplapse_keyframe_list_item_presentation");

      if (startEditorFromPresentationMode && !usePresentationSlider) {
        // Presentation editor only state
        $("#" + keyframeListItem.id).css("margin-left", "-1px");
        $("#" + titleId).show();
        $("#" + playFromHereButtonId).hide();
        $("#" + transitionTableId).hide();
      }

      var $keyframeTable = $("#" + keyframeTableId);

      $keyframeTable.mousedown(function(event) {
        selectAndGo($("#" + keyframeListItem.id));
        displaySnaplapseFrameAnnotation(null);
      });

      if (!usePresentationSlider) {
        $keyframeTable.hover(function() {
          var $keyframeListItem = $("#" + keyframeListItem.id);
          if (!$keyframeListItem.hasClass("ui-selected"))
            org.gigapan.Util.changeBackgroundColorOpacity($keyframeListItem.get(0), 0.15);
        }, function() {
          var $keyframeListItem = $("#" + keyframeListItem.id);
          if (!$keyframeListItem.hasClass("ui-selected"))
            org.gigapan.Util.changeBackgroundColorOpacity($keyframeListItem.get(0), 0);
        });
      }

      var $thumbnailButton = $("#" + thumbnailButtonId);

      $thumbnailButton.click(function(event) {
        event.stopPropagation();
        var keyframeId = $(this).parent().attr("id").split("_")[3];
        selectAndGo($("#" + keyframeListItem.id), keyframeId);
      });

      if (usePresentationSlider) {
        $thumbnailButton.hover(function() {
          var thisKeyframeId = $(this).parent().attr("id").split("_")[3];
          var thisKeyframe = snaplapse.getKeyframeById(thisKeyframeId);
          setKeyframeCaptionUI(thisKeyframe, this);
        }, function() {
          var thisKeyframeId = $(this).parent().attr("id").split("_")[3];
          var thisKeyframe = snaplapse.getKeyframeById(thisKeyframeId);
          setKeyframeCaptionUI(thisKeyframe, this, true);
        }).click(function(event) {
          var $element = $(this);
          var containerOffset = $keyframeContainer.offset();
          var containerWidth = $keyframeContainer.width();
          var elementOffset = $element.offset();
          var elementWidth = $element.width();
          var distanceBetweenElementAndLeftEdge = elementOffset.left + elementWidth - containerOffset.left;
          var distanceBetweenElementAndRightEdge = containerWidth - elementOffset.left + containerOffset.left;
          if (distanceBetweenElementAndRightEdge < elementWidth * 1.5) {
            $keyframeContainer.animate({
              scrollLeft: $keyframeContainer.scrollLeft() + (elementWidth * 1.5 - distanceBetweenElementAndRightEdge)
            }, {
              duration: 500,
              start: function() {
                setKeyframeCaptionUI(undefined, undefined, true);
              }
            });
          } else if (distanceBetweenElementAndLeftEdge < elementWidth * 1.5) {
            $keyframeContainer.animate({
              scrollLeft: $keyframeContainer.scrollLeft() - (elementWidth * 1.5 - distanceBetweenElementAndLeftEdge)
            }, {
              duration: 500,
              start: function() {
                setKeyframeCaptionUI(undefined, undefined, true);
              }
            });
          }
        });
        $thumbnailButton.attr("id", frame.unsafe_string_frameTitle.split(' ').join('_'));
      }

      if (disableTourLooping) {
        $("#" + loopTimesId).hide();
        $("#" + loopTextId).hide();
        $("#" + speedBlockId).css("margin-top", "-10px");
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
      }).change(function(event) {
        var thisKeyframeId = this.id.split("_")[3];
        var thisKeyframe = snaplapse.getKeyframeById(thisKeyframeId);
        selectAndGo($("#" + keyframeListItem.id), thisKeyframeId, true);
        if (this.checked) {
          snaplapse.setTextAnnotationForKeyframe(thisKeyframeId, undefined, true);
          snaplapse.setTitleForKeyframe(thisKeyframeId, undefined, true);
          if (thisKeyframe["unsafe_string_description"] != undefined)
            $(".subtitle_textarea").val(thisKeyframe["unsafe_string_description"]);
          if (thisKeyframe["unsafe_string_frameTitle"] != undefined)
            $(".keyframe_title_input").val(thisKeyframe["unsafe_string_frameTitle"]);
          displaySnaplapseFrameAnnotation(thisKeyframe);
          $createSubtitle_dialog.dialog("option", {
            "keyframeId": thisKeyframeId,
            "descriptionVisibleCheckboxId": this.id
          }).dialog("open");
        } else {
          snaplapse.setTextAnnotationForKeyframe(thisKeyframeId, undefined, false);
          snaplapse.setTitleForKeyframe(thisKeyframeId, undefined, false);
          displaySnaplapseFrameAnnotation(null);
          setKeyframeTitleUI(thisKeyframe, true);
        }
      }).mousedown(function(event) {
        // For preventing the parent table from getting the click event
        // this is the first step for a checkbox
        // also need to prevent the label from bubbling the event
        event.stopPropagation();
      });

      $("#" + descriptionVisibleCheckboxLabelId).mousedown(function(event) {
        // For preventing the parent table from getting the click event
        // this is the second step for a checkbox
        // also need to prevent the checkbox from bubbling the event
        event.stopPropagation();
      });

      // Create update button
      $("#" + updateButtonId).button({
        icons: {
          primary: "ui-icon-refresh"
        },
        text: true
      }).click(function(event) {
        event.stopPropagation();
        var thisKeyframeId = this.id.split("_")[3];
        snaplapse.updateTimeAndPositionForKeyframe(thisKeyframeId);
        selectAndGo($("#" + keyframeListItem.id), thisKeyframeId, false, true);
      });

      // Create duplicate button
      $("#" + duplicateButtonId).button({
        icons: {
          primary: "ui-icon-copy"
        },
        text: true
      }).click(function(event) {
        event.stopPropagation();
        var thisKeyframeId = this.id.split("_")[3];
        snaplapse.duplicateKeyframe(thisKeyframeId);
        selectAndGo($("#" + keyframeListItem.id), thisKeyframeId, false, true);
      });

      // Create play button
      $("#" + playFromHereButtonId).button({
        icons: {
          primary: "ui-icon-play"
        },
        text: true,
        disabled: false
      }).click(function(event) {
        event.stopPropagation();
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

      // Override the color of keyframe items
      var tagColor;
      if (timelapse.getVisualizer()) {
        tagColor = timelapse.getTagColor();
      } else {
        tagColor = [1, 1, 1];
      }
      keyframeListItem.style.backgroundColor = "rgba(" + tagColor[0] + "," + tagColor[1] + "," + tagColor[2] + ",0)";

      // Select the element
      var autoScroll;
      if (insertionIndex == loadKeyframesLength - 1 || insertionIndex == keyframes.length - 1)
        autoScroll = true;
      UTIL.selectSortableElements($sortable, $("#" + keyframeListItem.id), autoScroll);
      setKeyframeTitleUI(frame);

      // Hide the last keyframe transition area
      snaplapse.hideLastKeyframeTransition();
      timelapse.handleEditorModeToolbarChange();
      $(".addTimetag").button("option", "disabled", false);

      // The reason to hide and show the elements is the workaround for a webkit refresh bug
      $keyframeContainer.hide().show(0);
      resetKeyframeTransitionUI(buildConstraint, keyframeListItem.id);

      // Grab the current video frame and store it as the thumbnail in the canvas
      if (!isKeyframeFromLoad) {
        if (shouldDrawThumbnail) {
          if (useThumbnailServer)
            loadThumbnailFromServer(frame);
          else {
            setTimeout(function() {
              setKeyframeThumbail(frame);
            }, 100);
          }
        }
      } else {
        var loadNextKeyframe = function() {
          // Timeout since the seeked event hasn't actually fired yet, so delay a bit
          var waitTime = 700;
          if (!editorEnabled || useThumbnailServer)
            waitTime = 0;
          setTimeout(function() {
            if (timelapse.getVisualizer() && !usePresentationSlider)
              timelapse.getVisualizer().addTimeTag(keyframes, insertionIndex, true);
            if (shouldDrawThumbnail) {
              if (useThumbnailServer)
                loadThumbnailFromServer(frame);
              else
                setKeyframeThumbail(frame);
            }
            if (insertionIndex == loadKeyframesLength - 1) {
              // Loading completed
              $(".loadingOverlay").remove();
              $(document.body).css("cursor", "default");
              // Set the value of the last keyframe to null (need to use reference but not clone)
              // so swaping it with other keyframes will give a default value
              snaplapse.resetKeyframe();
              if (usePresentationSlider) {
                $("#" + composerDivId + " .snaplapse_keyframe_container").scrollLeft(0);
                var unsafeHashVars = UTIL.getUnsafeHashVars();
                // Go to the desired keyframe if there is no shared view and no tour
                if ( typeof unsafeHashVars.v == "undefined" && typeof unsafeHashVars.tour == "undefined") {
                  var $desiredSlide;
                  if ( typeof unsafeHashVars.slide != "undefined")
                    $desiredSlide = $("#" + unsafeHashVars.slide);
                  if ($desiredSlide && $desiredSlide.length > 0)
                    $desiredSlide[0].click();
                  else {
                    // Go to the first keyframe if there is no desired keyframe
                    var firstFrame = snaplapse.getKeyframes()[0];
                    var $firstFrameThumbnailButton = $("#" + composerDivId + "_snaplapse_keyframe_" + firstFrame.id).children(".snaplapse_keyframe_list_item_thumbnail_container_presentation");
                    $firstFrameThumbnailButton.click();
                  }
                }
              } else {
                if (!editorEnabled) {
                  // If the editor UI is not enabled, then we are in view-only mode
                  // and we need to seek to the first frame.
                  var firstFrame = snaplapse.getKeyframes()[0];
                  timelapse.warpToBoundingBox(firstFrame.bounds);
                  timelapse.seek(firstFrame.time);
                  displaySnaplapseFrameAnnotation(firstFrame);
                } else {
                  if (useThumbnailServer) {
                    // If we are using the thumbnail server, we aren't already seeking to each frame
                    // so we need to seek to the last frame manually.
                    timelapse.warpToBoundingBox(frame.bounds);
                    timelapse.seek(frame.time);
                  }
                  displaySnaplapseFrameAnnotation(frame);
                }
              }
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
          if (editorEnabled && !useThumbnailServer)
            videoset.removeEventListener('video-seeked', loadNextKeyframe);
        };
        if (editorEnabled && !useThumbnailServer) {
          timelapse.warpToBoundingBox(frame['bounds']);
          timelapse.seek(frame['time']);
          videoset.addEventListener('video-seeked', loadNextKeyframe);
        } else
          loadNextKeyframe();
      }
    };

    var selectAndGo = function($select, keyframeId, skipAnnotation, skipGo, doNotFireListener) {
      UTIL.selectSortableElements($sortable, $select);
      if (usePresentationSlider) {
        $sortable.children().children().children(".snaplapse_keyframe_list_item_thumbnail_overlay_presentation").removeClass("thumbnail_highlight");
        $select.children().children(".snaplapse_keyframe_list_item_thumbnail_overlay_presentation").addClass("thumbnail_highlight");
      }
      if ( typeof (keyframeId) != "undefined") {
        var frame = snaplapse.getKeyframeById(keyframeId);
        if (skipAnnotation != true) {
          displaySnaplapseFrameAnnotation(frame);
          setKeyframeTitleUI(frame);
        }
        if (skipGo != true) {
          if (usePresentationSlider && datasetType != undefined)
            timelapse.setNewView(timelapse.pixelBoundingBoxToLatLngCenterView(frame['bounds']), false, false);
          else
            timelapse.warpToBoundingBox(frame['bounds']);
          timelapse.seek(frame['time']);
          if (usePresentationSlider && doNotFireListener != true) {
            var listeners = eventListeners["slide-changed"];
            if (listeners) {
              for (var i = 0; i < listeners.length; i++) {
                try {
                  listeners[i](frame.unsafe_string_frameTitle);
                } catch(e) {
                  UTIL.error(e.name + " while calling presentationSlider slide-changed event listener: " + e.message, e);
                }
              }
            }
          }
        }
      }
    };
    this.selectAndGo = selectAndGo;

    var loadThumbnailFromServer = function(frame) {
      var $img = $("#" + composerDivId + "_snaplapse_keyframe_" + frame['id'] + "_thumbnail");
      var thumbnailURL = generateThumbnailURL(settings["url"], frame.bounds, $img.width(), $img.height(), frame.time);
      $img.attr("src", thumbnailURL);
    };

    var generateThumbnailURL = function(root, bounds, width, height, time) {
      var serverURL = "http://timemachine-api.cmucreatelab.org/thumbnail?";
      var rootFlag = "root=" + root + "&";
      var boundsFlag = "boundsLTRB=" + bounds.xmin + "," + bounds.ymin + "," + bounds.xmax + "," + bounds.ymax + "&";
      var sizeFlag = "width=" + width + "&height=" + height + "&";
      var timeFlag = "frameTime=" + time;
      var thumbnailURL = serverURL + rootFlag + boundsFlag + sizeFlag + timeFlag;
      var mediaType = ( typeof (settings["mediaType"]) == "undefined") ? null : settings["mediaType"];
      if (mediaType)
        thumbnailURL += "&tileFormat=" + mediaType.split(".")[1];
      return thumbnailURL;
    };
    this.generateThumbnailURL = generateThumbnailURL;

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

    var setToPresentationViewOnlyMode = function() {
      // This is used to solve a race condition that customEditorControl is sometimes undefined
      // TODO: there will be a problem if toolbar and customEditorControl do not have the same height
      var $editorControl = $("#" + timelapseViewerDivId + " .toolbar");
      if ($editorControl == undefined)
        $editorControl = $("#" + timelapseViewerDivId + " .customEditorControl");
      var heightOffset = $editorControl.height() - 3;
      var isMaxWindowSize = settings["viewportGeometry"] && settings["viewportGeometry"]["max"];
      if (isMaxWindowSize)
        heightOffset = 0;
      var $snaplapseContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");
      $snaplapseContainer.css({
        "top": "-=" + heightOffset + "px",
        "min-height": "73px",
        "overflow-x": "auto",
        "border-left": "1px solid black",
        "border-bottom": "1px solid black",
        "border-right": "1px solid black",
        "height": "inherit"
      });
      if (!isMaxWindowSize) {
        $snaplapseContainer.css({
          "width": "inherit",
          "max-width": $("#" + timelapseViewerDivId + " .tiledContentHolder").width() + "px"
        });
      }
      $sortable.sortable("disable").css({
        "height": "75px",
        "margin-left": "-1px",
        "margin-right": "0",
        "margin-top": "0px",
        "margin-bottom": "0"
      });
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
      if (snaplapse.isPlaying())
        snaplapse.stop();
      else
        snaplapse.play();
    };
    this.playStopSnaplapse = _playStopSnaplapse;

    var saveSnaplapse = function() {
      if (snaplapse && (snaplapse.getNumKeyframes() >= 1)) {
        var tourUrl = snaplapse.getAsUrlString();
        $("#" + composerDivId + " .saveTimewarpWindow").dialog("open");
        $("#" + composerDivId + " .saveTimewarpWindow_JSON").val(rootURL + tourUrl).focus().select().click(function() {
          $(this).focus().select();
        });
        // Text will not be selected when the dialog is opened in IE.
        // We need to wait some amount of time and try to select the text again.
        // And even more crazy is that this only works if we keep the initial .focus().select() above. WTF.
        setTimeout(function() {
          $("#" + composerDivId + " .saveTimewarpWindow_JSON").focus().select();
        }, 50);
        $("#" + composerDivId + " .saveTimewarpWindow_JSON2").val('<iframe width="' + embedWidth + '" height="' + embedHeight + '" src="' + rootEmbedURL + tourUrl + '" frameborder="0"></iframe>').click(function() {
          $(this).focus().select();
        });
      } else {
        alert("ERROR: No tour to save--please create a tour and add at least two keyframes to it.");
      }
    };
    this.saveSnaplapse = saveSnaplapse;

    var showLoadSnaplapseWindow = function() {
      $("#" + composerDivId + " .loadTimewarpWindow").dialog("open");
      $("#" + composerDivId + " .loadTimewarpWindow_JSON").val("");
    };
    this.showLoadSnaplapseWindow = showLoadSnaplapseWindow;

    var showSetSnaplapseWindow = function() {
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
          $keyframeContainer.hide().show(0);
        }
        handleSnaplapseFrameSelectionChange();
      }
    };
    this.deleteSelectedKeyframes = deleteSelectedKeyframes;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    if ($("#" + timelapseViewerDivId + " .customEditorControl").length == 0 && !usePresentationSlider) {
      $("#" + timelapseViewerDivId).append('<div class="snaplapseTourPlayBack playTour"></div>');
      $("#" + timelapseViewerDivId).append('<div class="tourLoadOverlay"><div class="tourLoadOverlayTitleContainer"><div class="tourLoadOverlayTitle"></div></div><img class="tourLoadOverlayPlay" title="Click to start the tour" src="' + rootAppURL + 'images/tour_play_outline.png"></div>');
    }
    timelapse.setSnaplapseViewer(thisObj);
    initializeSnaplapseUI();
    newSnaplapse(null);
    setPresentationMode(startEditorFromPresentationMode);

    if (!usePresentationSlider)
      $keyframeContainer.css("z-index", "5");

    // TODO: There is sometimes a race condition that defaultUI and customUI is created before snaplapseViewer
    if ( typeof settings["enableCustomUI"] != "undefined" && settings["enableCustomUI"] != false) {
      var customUI = timelapse.getCustomUI();
      if (customUI)
        customUI.fitToWindow();
    } else {
      var defaultUI = timelapse.getDefaultUI();
      if (defaultUI && settings["viewportGeometry"] && settings["viewportGeometry"]["max"])
        defaultUI.fitToWindow();
    }
  };
})();
