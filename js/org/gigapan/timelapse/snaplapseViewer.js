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
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.snaplapse.SnaplapseViewer = function(snaplapse, timelapse, settings, mode) {

    // Objects
    var thisObj = this;
    var videoset = timelapse.getVideoset();
    var eventListeners = {};

    // Settings
    var viewerType = UTIL.getViewerType();
    var datasetType = timelapse.getDatasetType();
    var startEditorFromPresentationMode = settings["startEditorFromPresentationMode"] ? settings["startEditorFromPresentationMode"] : false;
    var showEditorOnLoad = ( typeof (settings["showEditorOnLoad"]) == "undefined") ? false : settings["showEditorOnLoad"];
    var usePresentationSlider = (mode == "presentation") ? true : false;
    var uiEnabled = (mode == "noUI") ? false : true;
    var editorEnabled = timelapse.isEditorEnabled();
    var useCustomUI = timelapse.useCustomUI();
    var useThumbnailServer = ( typeof (settings["useThumbnailServer"]) == "undefined") ? true : settings["useThumbnailServer"];
    var thumbnailServerRootTileUrl = ( typeof (settings["thumbnailServerRootTileUrl"]) == "undefined") ? settings["url"] : settings["thumbnailServerRootTileUrl"];
    var showFullScreenBtn = ( typeof (settings["showFullScreenBtn"]) == "undefined") ? true : settings["showFullScreenBtn"];
    var showEditorModeButton = ( typeof (settings["showEditorModeButton"]) == "undefined") ? true : settings["showEditorModeButton"];
    var showAddressLookup = ( typeof (settings["showAddressLookup"]) == "undefined") ? false : settings["showAddressLookup"];
    var disableKeyframeTitle = ( typeof (settings["disableKeyframeTitle"]) == "undefined") ? false : settings["disableKeyframeTitle"];
    var screenIdleTime = ( settings["presentationSliderSettings"] && typeof (settings["presentationSliderSettings"]["screenIdleTime"]) != "undefined") ? settings["presentationSliderSettings"]["screenIdleTime"] : 20000;
    var waypointDelayTime = ( settings["presentationSliderSettings"] && typeof (settings["presentationSliderSettings"]["waypointDelayTime"]) != "undefined") ? settings["presentationSliderSettings"]["waypointDelayTime"] : 10000;
    var doAutoMode = ( settings["presentationSliderSettings"] && typeof (settings["presentationSliderSettings"]["doAutoMode"]) != "undefined") ? settings["presentationSliderSettings"]["doAutoMode"] : false;
    var showAnnotations = ( settings["presentationSliderSettings"] && typeof (settings["presentationSliderSettings"]["showAnnotations"]) != "undefined") ?  settings["presentationSliderSettings"]["showAnnotations"] : true;
    var initialWaypointIndex = ( settings["presentationSliderSettings"] && typeof (settings["presentationSliderSettings"]["initialWaypointIndex"]) != "undefined") ? settings["presentationSliderSettings"]["initialWaypointIndex"] : 0;
    var presentationSliderLoadAnimation = ( settings["presentationSliderSettings"] && typeof (settings["presentationSliderSettings"]["onLoadAnimation"]) != "undefined") ? settings["presentationSliderSettings"]["onLoadAnimation"] : "zoom";
    var presentationSliderPlayAfterAnimation = ( settings["presentationSliderSettings"] && typeof (settings["presentationSliderSettings"]["playAfterAnimation"]) != "undefined") ? settings["presentationSliderSettings"]["playAfterAnimation"] : "true";
    // Flags
    var didOnce = false;
    var presentationSliderEnabled = timelapse.isPresentationSliderEnabled();
    var isHidingCustomUI = false;
    var useTouchFriendlyUI = timelapse.useTouchFriendlyUI();
    var autoModeTimeout;
    var currentAutoModeWaypointIdx = (initialWaypointIndex >= 0) ? initialWaypointIndex : -1;
    var wayPointClickedByAutoMode = false;

    // DOM elements
    var composerDivId = snaplapse.getComposerDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var timeMachineDivId = timelapse.getTimeMachineDivId();
    var $sortable;
    var $videoSizeSelect;
    var $createSubtitle_dialog = $("#" + composerDivId + " .createSubtitle_dialog");
    var $keyframeContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");

    if (useTouchFriendlyUI)
      timelapse.touchHorizontalScroll($keyframeContainer);

    var $toolbar = $("#" + composerDivId + " .toolbar");

    // Parameters
    var rootURL;
    var rootEmbedURL;
    var rootAppURL = UTIL.getRootAppURL();
    var maxSubtitleLength = 120;
    var embedWidth = 854;
    var embedHeight = 480 + ( presentationSliderEnabled ? 103 : 0);
    var sortingStartDistance = 30;
    var moveOneKeyframeIdx = {
      from: undefined,
      to: undefined
    };
    var toolbarHeight = $toolbar.outerHeight();
    var KEYFRAME_THUMBNAIL_WIDTH = useTouchFriendlyUI ? 146 : 126;
    var KEYFRAME_THUMBNAIL_HEIGHT = useTouchFriendlyUI ? 101 : 73;

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

    var hideCustomUI = function() {
      if (!isHidingCustomUI) {
        isHidingCustomUI = true;
        $("#" + viewerDivId + " .sideToolBar").hide();
        $("#" + viewerDivId + " .googleLogo").css("bottom", "-=45px");
        $("#" + viewerDivId + " .toggleGoogleMapBtn").hide();
        $("#" + viewerDivId + " .smallMapResizer").hide();
        $("#" + viewerDivId + " .customTimeline").hide();
        $("#" + viewerDivId + " .customHelpLabel").hide();
        $("#" + viewerDivId + " .videoQualityContainer").hide();
        if (datasetType == "landsat") {
          $("#" + viewerDivId + " .customToggleSpeed").hide();
          $("#" + viewerDivId + " .customPlay").hide();
          $("#" + viewerDivId + " .timeText").addClass("timeTextTour");
        } else if (datasetType == "modis") {
          $("#" + viewerDivId + " .modisCustomToggleSpeed").hide();
          $("#" + viewerDivId + " .toggleLock").hide();
          $("#" + viewerDivId + " .modisTimeText").css("top", "+=20px");
          $("#" + viewerDivId + " .monthSpinnerContainer").css("top", "+=20px");
          $("#" + viewerDivId + " .scaleBarContainer").css("bottom", "-=20px");
          $("#" + viewerDivId + " .modisCustomPlay").hide();
        }
      }
    };

    var showCustomUI = function() {
      if (isHidingCustomUI) {
        isHidingCustomUI = false;
        $("#" + viewerDivId + " .sideToolBar").show();
        $("#" + viewerDivId + " .googleLogo").css("bottom", "+=45px");
        $("#" + viewerDivId + " .toggleGoogleMapBtn").show();
        $("#" + viewerDivId + " .smallMapResizer").show();
        $("#" + viewerDivId + " .customTimeline").show();
        $("#" + viewerDivId + " .customHelpLabel").show();
        $("#" + viewerDivId + " .videoQualityContainer").show();
        if (datasetType == "landsat") {
          $("#" + viewerDivId + " .customPlay").show();
          $("#" + viewerDivId + " .timeText").removeClass("timeTextTour");
        } else if (datasetType == "modis") {
          $("#" + viewerDivId + " .toggleLock").show();
          $("#" + viewerDivId + " .modisTimeText").css("top", "-=20px");
          $("#" + viewerDivId + " .monthSpinnerContainer").css("top", "-=20px");
          $("#" + viewerDivId + " .scaleBarContainer").css("bottom", "+=20px");
          $("#" + viewerDivId + " .modisCustomPlay").show();
        }
      }
    };
    this.showCustomUI = showCustomUI;

    // Hide the transition area for the last keyframe on the UI
    var hideLastKeyframeTransition = function(showIdx) {
      var $keyframeItems = $("#" + composerDivId + " .snaplapse_keyframe_list").children();
      var numItems = $keyframeItems.length;
      // Unhide the transition options
      if ( typeof (showIdx) == "undefined" || showIdx == numItems - 1)
        showIdx = numItems - 2;
      var $keyframeItems_show = $keyframeItems.eq(showIdx);
      if ($keyframeItems_show) {
        $keyframeItems_show.find(".transition_table_mask").children().show();
        $keyframeItems_show.find(".snaplapse_keyframe_list_item_play_button").button("option", "disabled", false);
      }
      // Hide the transition options and reset the keyframe
      var $keyframeItems_hide = $keyframeItems.eq(numItems - 1);
      $keyframeItems_hide.find(".snaplapse_keyframe_list_item_play_button").button("option", "disabled", true);
      $keyframeItems_hide.find(".transition_table_mask").children().hide();
    };
    this.hideLastKeyframeTransition = hideLastKeyframeTransition;

    var initializeTourOverlyUI = function(tourTitle) {
      timelapse.stopParabolicMotion();

      $("#" + viewerDivId + " .snaplapseTourPlayBack").remove();
      $("#" + viewerDivId + " .tourLoadOverlay").remove();
      $("#" + viewerDivId).append('<div class="snaplapseTourPlayBack playTour"></div>');
      $("#" + viewerDivId).append('<div class="tourLoadOverlay"><div class="tourLoadOverlayTitle"></div><img class="tourLoadOverlayPlay" title="Click to start the tour" src="' + rootAppURL + 'images/tour_play_outline.png"></div>');

      // Add the tour title to be used during tour playback
      var $tourLoadOverlayTitle = $("#" + viewerDivId + " .tourLoadOverlayTitle");
      $tourLoadOverlayTitle.text("Tour: " + tourTitle).css("margin-left", -($tourLoadOverlayTitle.width() / 2) + "px");

      var $tourLoadOverlayPlay = $("#" + viewerDivId + " .tourLoadOverlayPlay");
      $("#" + viewerDivId + " .tourLoadOverlay").hover(function() {
        if (!snaplapse.isPlaying())
          $tourLoadOverlayPlay.css("opacity", 1.0);
      }, function() {
        if (!snaplapse.isPlaying())
          $tourLoadOverlayPlay.css("opacity", 0.8);
      }).click(function() {
        animateTourOverlayAndPlay(500);
      });

      // Stop tour button
      $("#" + viewerDivId + " .snaplapseTourPlayBack").click(function() {
        if ($(this).hasClass("playTour"))
          snaplapse.play();
        else
          snaplapse.stop();
      });
    };

    var animateTourOverlayAndPlay = function(duration) {
      $("#" + viewerDivId + " .snaplapseTourPlayBack").css("visibility", "visible");
      // Animate tour title]
      $("#" + viewerDivId + " .tourLoadOverlayTitle").animate({
        "top": "26px",
        "left": "63px",
        "margin-left": "0px"
      }, duration, function() {
        $("#" + viewerDivId + " .tourLoadOverlayTitle").appendTo($("#" + viewerDivId + " .snaplapseTourPlayBack"));
      });
      // Animate tour play button
      $("#" + viewerDivId + " .tourLoadOverlayPlay").animate({
        "top": "18px",
        "left": "18px",
        "width": "40px",
        "height": "40px",
        "margin-left": "0px",
        "margin-top": "0px",
        "opacity": "1.0"
      }, duration, function() {
        $("#" + viewerDivId + " .tourLoadOverlayPlay").appendTo($("#" + viewerDivId + " .snaplapseTourPlayBack"));
        $("#" + viewerDivId + " .tourLoadOverlay").css("visibility", "hidden");
        $(this).attr({
          "src": rootAppURL + "images/tour_stop_outline.png",
          "title": ""
        });
        snaplapse.play();
      });
    };
    this.animateTourOverlayAndPlay = animateTourOverlayAndPlay;

    var initializeSnaplapseUI = function() {
      if (!usePresentationSlider && uiEnabled) {
        createEditorToolbar();
        createDialogWindows();
      } else {
        $("#" + composerDivId + " .toolbar").remove();
        $createSubtitle_dialog.remove();
        $("#" + composerDivId + " .saveTimewarpWindow").remove();
        $("#" + composerDivId + " .loadTimewarpWindow").remove();
      }

      hideAnnotationBubble();

      // Add mouseover actions to all of the buttons
      $('.button').hover(function() {
        $(this).addClass('ui-state-hover');
      }, function() {
        $(this).removeClass('ui-state-hover');
      });

      // Configure the keyframe list's selectable handlers
      if (uiEnabled) {
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
            UTIL.addGoogleAnalyticEvent('button', 'drag', 'editor-sort-keyframes');
          },
          stop: function(event, ui) {
            var newIdx = $(ui.item).index();
            moveOneKeyframeIdx.to = newIdx;
            snaplapse.moveOneKeyframe(moveOneKeyframeIdx);
            $sortable.sortable("refreshPositions").sortable("refresh");
            if (!startEditorFromPresentationMode)
              hideLastKeyframeTransition(newIdx);
            ui.item.animate({
              "opacity": "1"
            }, 300);
          },
          change: function(event, ui) {
            $sortable.sortable("refreshPositions").sortable("refresh");
          }
        });
      }

      // Handle editor hiding
      if (!usePresentationSlider) {
        if (!showEditorOnLoad && !useCustomUI)
          $("#" + composerDivId).hide();
      } else
        $("#" + composerDivId).hide();

      // Handle description box
      if (uiEnabled && !usePresentationSlider)
        setSubtitlePosition("up");

      // Editor should be placed on top of the presentation slider
      if (!usePresentationSlider)
        $keyframeContainer.css("z-index", "5");

      if (uiEnabled)
        setPresentationMode(startEditorFromPresentationMode);
    };

    var createDialogWindows = function() {
      // Handle the tour title on the save window
      $("#" + composerDivId + " .saveTimewarpWindow_tourTitleInput").focus(function() {
        if ($(this).val() == "Untitled")
          $(this).val("");
      }).blur(function() {
        if ($(this).val() == "")
          $(this).val("Untitled");
        var tourUrl = snaplapse.getAsUrlString();
        $("#" + composerDivId + " .saveTimewarpWindow_JSON").val(rootURL + tourUrl);
        $("#" + composerDivId + " .saveTimewarpWindow_JSON2").val('<iframe width="' + embedWidth + '" height="' + embedHeight + '" src="' + rootEmbedURL + tourUrl + '" frameborder="0"></iframe>');
        $("#" + composerDivId + " .saveTimewarpWindow_JSON2_sizes").trigger("change");
      });

      // Set embed size selection
      $videoSizeSelect = $("#" + composerDivId + " .saveTimewarpWindow_JSON2_sizes");
      $videoSizeSelect.change(function() {
        var sizeArray = $(this).val().split(",");
        if (sizeArray.length == 2) {
          embedWidth = sizeArray[0];
          embedHeight = parseInt(sizeArray[1]) + ( presentationSliderEnabled ? 103 : 0);
          $("#" + composerDivId + " .saveTimewarpWindow_JSON2").val('<iframe width="' + embedWidth + '" height="' + embedHeight + '" src="' + rootEmbedURL + snaplapse.getAsUrlString() + '" frameborder="0"></iframe>');
        }
      });

      // Load dialog
      $("#" + composerDivId + " .loadTimewarpWindow").dialog({
        resizable: false,
        autoOpen: false,
        appendTo: "#" + composerDivId,
        width: 400,
        height: 200
      });

      // Load button in load dialog
      $("#" + composerDivId + " #loadSnaplapseButton").button({
        text: true
      }).click(function() {
        var fullURL = $("#" + composerDivId + " .loadTimewarpWindow_JSON").val();
        var match = fullURL.match(/(tour|presentation)=([^#?&]*)/);
        if (match) {
          var tour = match[2];
          loadSnaplapse(snaplapse.urlStringToJSON(tour));
          UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-load-keyframes');
        } else {
          alert("Error: Invalid tour");
        }
      });

      // Save dialog
      $("#" + composerDivId + " .saveTimewarpWindow").dialog({
        resizable: false,
        autoOpen: false,
        appendTo: "#" + composerDivId,
        width: 410,
        height: 484
      });

      // Create the subtitle dialog
      var dialogHeight = disableKeyframeTitle ? 210 : 250;
      if (disableKeyframeTitle) {
        $(".keyframe_title_container").hide();
        $(".createSubtitle_dialog_txt").css("top", "11px");
        $(".subtitle_textarea").css("top", "31px");
      }
      $createSubtitle_dialog.dialog({
        autoOpen: false,
        height: dialogHeight,
        width: 310,
        modal: true,
        resizable: false,
        appendTo: "#" + composerDivId,
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
    };

    var createEditorToolbar = function() {
      var $editorModeToolbar = $("#" + composerDivId + " .editorModeToolbar");
      // Create add button
      $editorModeToolbar.append('<button class="addTimetag" title="Add a keyframe">Add</button>');
      $("#" + composerDivId + " .toolbar .addTimetag").button({
        icons: {
          primary: "ui-icon-plus"
        },
        text: true
      }).click(function() {
        // The button will be enabled at the end of addSnaplapseKeyframeListItem() in snaplapseViewer
        $("#" + composerDivId + " .toolbar .addTimetag").button("option", "disabled", true);
        recordKeyframe();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-add-keyframe');
      });
      // Create save button
      $editorModeToolbar.append('<button class="saveTimewarp" title="Share a tour">Share</button>');
      $("#" + composerDivId + " .toolbar .saveTimewarp").button({
        icons: {
          primary: "ui-icon-person"
        },
        text: true,
        disabled: true
      }).click(function() {
        saveSnaplapse();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-show-share-dialog');
      });
      // Create load button
      $editorModeToolbar.append('<button class="loadTimewarp" title="Load a tour">Load</button>');
      $("#" + composerDivId + " .toolbar .loadTimewarp").button({
        icons: {
          primary: "ui-icon-folder-open"
        },
        text: true
      }).click(function() {
        showLoadSnaplapseWindow();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-show-load-dialog');
      });
      // Create delete button
      $editorModeToolbar.append('<button class="deleteTimetag" title="Delete a keyframe">Del</button>');
      $("#" + composerDivId + " .toolbar .deleteTimetag").button({
        icons: {
          primary: "ui-icon-minus"
        },
        text: true,
        disabled: true
      }).click(function() {
        deleteSelectedKeyframes();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-delete-keyframe');
      });
      // Create new button
      $editorModeToolbar.append('<button class="newTimewarp" title="Remove all keyframes">Clear</button>');
      $("#" + composerDivId + " .toolbar .newTimewarp").button({
        icons: {
          primary: "ui-icon-trash"
        },
        text: true
      }).click(function() {
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-show-clear-dialog');
        var confirmClearAlert = confirm("Are you sure you want to delete all keyframes?");
        if (!confirmClearAlert)
          return;
        loadNewSnaplapse(null);
        handleEditorModeToolbarChange();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-clear-keyframes');
      });
      // Create play button
      $editorModeToolbar.append('<button class="playStopTimewarp" title="Play or stop a tour">Play Tour</button>');
      $("#" + composerDivId + " .toolbar .playStopTimewarp").button({
        icons: {
          primary: "ui-icon-play"
        },
        text: true,
        disabled: true
      }).click(function() {
        playStopSnaplapseOnButtonClicked();
      });
      // Create mode toggle button and options
      if (showEditorModeButton) {
        // Populate the dropdown
        var editorModeOptions = "";
        editorModeOptions += '<li><a href="javascript:void(0);">' + getEditorModeText("presentation") + '</a></li>';
        editorModeOptions += '<li><a href="javascript:void(0);">' + getEditorModeText("tour") + '</a></li>';
        var $editorModeOptions = $("#" + composerDivId + " .editorModeOptions").append(editorModeOptions);
        // Create button
        $("#" + composerDivId + " .toolbar .toggleMode").button({
          icons: {
            secondary: "ui-icon-triangle-1-s"
          },
          text: true
        }).click(function() {
          if ($editorModeOptions.is(":visible")) {
            $editorModeOptions.hide();
          } else {
            $editorModeOptions.show().position({
              my: "center top",
              at: "center bottom",
              of: $(this)
            });
            $(document).one("mouseup", function(e) {
              var targetGroup = $(e.target).parents().addBack();
              if (!targetGroup.is(".toggleMode"))
                $editorModeOptions.hide();
            });
          }
        });
        if (startEditorFromPresentationMode)
          $("#" + composerDivId + " .toolbar .toggleMode .ui-button-text").text(getEditorModeText("presentation"));
        else
          $("#" + composerDivId + " .toolbar .toggleMode .ui-button-text").text(getEditorModeText("tour"));
        $editorModeOptions.hide().menu();
        // Set the dropdown
        $("#" + composerDivId + " .toolbar .editorModeOptions li").click(function() {
          var selectedModeTxt = $(this).text();
          if (selectedModeTxt == getEditorModeText("tour")) {
            setPresentationMode(false);
            UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-set-to-tour-mode');
          } else if (selectedModeTxt == getEditorModeText("presentation")) {
            setPresentationMode(true);
            UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-set-to-presentation-mode');
          }
          $("#" + composerDivId + " .toolbar .toggleMode span").text(selectedModeTxt);
        });
        if (startEditorFromPresentationMode)
          setPresentationMode(true);
      } else {
        $("#" + composerDivId + " .toolbar .toggleMode").remove();
        $("#" + composerDivId + " .toolbar .editorModeOptions").remove();
      }
      // Create search box
      if (showAddressLookup)
        setAddressLookupUI();
      // Create fullscreen button
      if (showFullScreenBtn) {
        var $fullScreenBtnContainer = $("#" + composerDivId + " .fullScreenBtnContainer");
        $fullScreenBtnContainer.append('<input type="checkbox" class="fullscreenCheckbox"/>');
        $fullScreenBtnContainer.append('<label class="fullscreenLabel" title="Toggle fullscreen"></label>');
        var $fullscreenCheckbox = $("#" + composerDivId + " .fullscreenCheckbox");
        $fullscreenCheckbox.attr("id", timeMachineDivId + "_composer_fullscreenCheckbox");
        $("#" + composerDivId + " .fullscreenLabel").attr("for", timeMachineDivId + "_composer_fullscreenCheckbox");
        $fullscreenCheckbox.button({
          icons: {
            primary: "ui-icon-arrow-4-diag"
          },
          text: false
        }).change(function() {
          if ($fullscreenCheckbox.is(":checked"))
            timelapse.fullScreen(true);
          else
            timelapse.fullScreen(false);
        });
      }
    };

    var getEditorModeText = function(mode) {
      if (mode == "tour")
        return "Tour Editor";
      else if (mode == "presentation")
        return "Presentation Editor";
    };

    var setAddressLookupUI = function() {
      if ( typeof google === "undefined")
        return;

      var $addressLookupElem = $('<input>').attr({
        size: 35,
        type: "textbox",
        "placeholder": "Enter the name of a place to zoom to..."
      }).addClass("addressLookup");

      if (!showEditorModeButton)
        $addressLookupElem.css("left", "18px");

      $toolbar.append($addressLookupElem);

      var autocomplete = new google.maps.places.Autocomplete($addressLookupElem.get(0));
      var geocoder = new google.maps.Geocoder();

      google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
        if (!place.geometry) {
          var address = $addressLookupElem.val();
          geocoder.geocode({
            'address': address
          }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              var lat = results[0].geometry.location.lat();
              var lng = results[0].geometry.location.lng();
              newView = {
                center: {
                  "lat": lat,
                  "lng": lng
                },
                "zoom": 10
              };
              timelapse.setNewView(newView, false, false);
              UTIL.addGoogleAnalyticEvent('textbox', 'search', 'go-to-searched-place');
            } else {
              console.log("Geocode failed: " + status);
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
      });
    };

    // Change the status of the editor toolbar
    var handleEditorModeToolbarChange = function() {
      var $keyframeItems = $("#" + composerDivId + " .snaplapse_keyframe_list").children();
      var numItems = $keyframeItems.size();
      if (numItems >= 1) {
        $("#" + composerDivId + " .deleteTimetag").button("option", "disabled", false);
        $("#" + composerDivId + " .saveTimewarp").button("option", "disabled", false);
        $("#" + composerDivId + " .newTimewarp").button("option", "disabled", false);
      } else {
        $("#" + composerDivId + " .deleteTimetag").button("option", "disabled", true);
        $("#" + composerDivId + " .saveTimewarp").button("option", "disabled", true);
        $("#" + composerDivId + " .newTimewarp").button("option", "disabled", true);
      }
      if (numItems >= 2) {
        $("#" + composerDivId + " .playStopTimewarp").button("option", "disabled", false);
      } else {
        $("#" + composerDivId + " .playStopTimewarp").button("option", "disabled", true);
      }
    };
    this.handleEditorModeToolbarChange = handleEditorModeToolbarChange;

    // Disable buttons in editor
    var disableEditorToolbarButtons = function() {
      $("#" + composerDivId + " .addTimetag").button("option", "disabled", true);
      $("#" + composerDivId + " .deleteTimetag").button("option", "disabled", true);
      $("#" + composerDivId + " .saveTimewarp").button("option", "disabled", true);
      $("#" + composerDivId + " .loadTimewarp").button("option", "disabled", true);
      $("#" + composerDivId + " .newTimewarp").button("option", "disabled", true);
      $("#" + composerDivId + " .setTimewarp").button("option", "disabled", true);
      if (showAddressLookup)
        $("#" + composerDivId + ' .addressLookup').attr("disabled", "disabled").css("opacity", "0.5");
      if (showEditorModeButton)
        $("#" + composerDivId + " .toggleMode").button("option", "disabled", true);
    };

    // Enable buttons in editor
    var enableEditorToolbarButtons = function() {
      $("#" + composerDivId + " .addTimetag").button("option", "disabled", false);
      $("#" + composerDivId + " .deleteTimetag").button("option", "disabled", false);
      $("#" + composerDivId + " .saveTimewarp").button("option", "disabled", false);
      $("#" + composerDivId + " .loadTimewarp").button("option", "disabled", false);
      $("#" + composerDivId + " .newTimewarp").button("option", "disabled", false);
      $("#" + composerDivId + " .setTimewarp").button("option", "disabled", false);
      if (showAddressLookup)
        $("#" + composerDivId + ' .addressLookup').removeAttr("disabled").css("opacity", "1");
      if (showEditorModeButton)
        $("#" + composerDivId + " .toggleMode").button("option", "disabled", false);
    };

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
        var keyframe = snaplapse.getKeyframeById(keyframeId);
        setKeyframeTitleUI(keyframe);
      }
    };

    var setKeyframeCaptionUI = function(keyframe, element, wantToHide) {
      var $keyframeSubtitleBox = $("#" + composerDivId + " .keyframeSubtitleBoxForHovering");
      var $keyframeSubtitle = $keyframeSubtitleBox.find("p");
      if (wantToHide == true)
        $keyframeSubtitleBox.stop(true, true).fadeOut(200);
      else {
        if (isTextNonEmpty(keyframe['unsafe_string_description'])) {
          $keyframeSubtitle.text(keyframe["unsafe_string_description"]);
          var $element = $(element);
          var containerOffset = $keyframeContainer.position();
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
            "left": captionLeft + "px"
          });
          $keyframeSubtitle.css({
            "background-position": pointerLeftPercent + "% 100%"
          });
          $keyframeSubtitleBox.stop(true, true).fadeIn(200);
        } else
          $keyframeSubtitleBox.stop(true, true).fadeOut(200);
      }
    };

    var setKeyframeTitleUI = function(keyframe, wantToHide) {
      var $thisKeyframeTitle = $("#" + timeMachineDivId + "_snaplapse_keyframe_" + keyframe.id + "_title");
      if (wantToHide == true)
        $thisKeyframeTitle.hide();
      else {
        if (isTextNonEmpty(keyframe['unsafe_string_frameTitle'])) {
          if (keyframe['is-description-visible']) {
            $thisKeyframeTitle.text(keyframe["unsafe_string_frameTitle"]);
            $thisKeyframeTitle.show();
          }
        } else
          $thisKeyframeTitle.hide();
      }
    };

    var setPresentationMode = function(status) {
      var $snaplapseContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");
      if (status == true) {
        snaplapse.setKeyframeTitleState("enable");
        startEditorFromPresentationMode = true;
        $("#" + composerDivId + " .toolbar .playStopTimewarp").hide();
        $("#" + viewerDivId + " .videoQualityContainer").hide();
        $snaplapseContainer.find(".snaplapse_keyframe_list_item").css("margin-left", "-1px");
        $snaplapseContainer.find(".snaplapse_keyframe_list_item_play_button").hide();
        $snaplapseContainer.find(".transition_table").hide();
        if ($videoSizeSelect)
          $videoSizeSelect.find("option[value='750,530']").attr('selected', 'selected');
      } else {
        snaplapse.setKeyframeTitleState("disable");
        startEditorFromPresentationMode = false;
        $("#" + composerDivId + " .toolbar .playStopTimewarp").show();
        $("#" + viewerDivId + " .videoQualityContainer").show();
        $snaplapseContainer.find(".snaplapse_keyframe_list_item").css("margin-left", "0px");
        $snaplapseContainer.find(".snaplapse_keyframe_list_item_play_button").show();
        $snaplapseContainer.find(".transition_table").show();
        if ($videoSizeSelect)
          $videoSizeSelect.find("option[value='854,480']").attr('selected', 'selected');
      }
      setRootURLs();
    };

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
      if (sourceUrl.indexOf("timemachine.cmucreatelab.org") > -1 || sourceUrl.indexOf("timemachine.gigapan.org") > -1)
        sourceUrl = sourceUrl.replace("/wiki-viewer.html", "/wiki-viewer-embed.html");
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

    var displaySnaplapseFrameAnnotation = function(keyframe) {
      if (keyframe && !usePresentationSlider) {
        if (keyframe['is-description-visible']) {
          if (isTextNonEmpty(keyframe['unsafe_string_description'])) {
            // Uses .text() and not .html() to prevent cross-site scripting
            $("#" + viewerDivId + " .snaplapse-annotation-description > div").text(keyframe['unsafe_string_description']);
            $("#" + viewerDivId + " .snaplapse-annotation-description").show();
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

    var loadNewSnaplapse = function(json, noPlaybackOverlay) {
      snaplapse.clearSnaplapse();
      timelapse.stopParabolicMotion();
      if (!didOnce) {
        if (usePresentationSlider) {
          setToPresentationViewOnlyMode();
          $("#" + timeMachineDivId).on("mousedown", clearAutoModeTimeout).on("mouseup", startAutoModeIdleTimeout);
          timelapse.addZoomChangeListener(startAutoModeIdleTimeout);
        }
        var $playbackButton = $("#" + viewerDivId + ' .playbackButton');
        var $controls = $("#" + viewerDivId + ' .controls');
        var $sideToolbar = $("#" + viewerDivId + ' .sideToolBar');

        snaplapse.addEventListener('play', function() {
          timelapse.stopParabolicMotion();

          // Add masks to prevent clicking
          $("#" + viewerDivId).append('<div class="snaplapsePlayingMaskViewer"></div>');
          $("#" + composerDivId).append('<div class="snaplapsePlayingMask"></div>');
          var leftOffset = 0;
          var topOffset = 0;
          var $snaplapseContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");
          if ($snaplapseContainer.length > 0) {
            leftOffset = $snaplapseContainer.offset().left;
            topOffset = $snaplapseContainer.offset().top;
          }

          if (uiEnabled) {
            // If users play tours from the editor
            disableEditorToolbarButtons();
            var visualizer = timelapse.getVisualizer();
            if (visualizer) {
              visualizer.handleShowHideNavigationMap("hide");
              timelapse.setPanoVideoEnableStatus(false);
              visualizer.setMode(timelapse.getMode(), false, true);
            }
            $("#" + composerDivId + " .playStopTimewarp").text("stop").button("option", {
              icons: {
                primary: "ui-icon-stop"
              },
              label: "Stop Tour"
            }).addClass("isPlaying");
            $("#" + viewerDivId + " .snaplapseTourPlayBack").css("visibility", "hidden");
            $sortable.css("opacity", "0.5");
          } else {
            // If users play tours from the viewer
            $("#" + timeMachineDivId + " .presentationSlider").hide();
            if (useCustomUI)
              $("#" + timeMachineDivId + " .composer").hide();
            else
              setDefaultUIToPlayerMode();
          };

          if (!useCustomUI) {
            $sideToolbar.hide();
            $controls.hide();
            setCaptureTimePosition("down");
          } else {
            if ($("#" + viewerDivId + " .customTimeline").is(':visible'))
              hideCustomUI();
          }

          setSubtitlePosition("down");

          $("#" + viewerDivId + ' .help').removeClass("enabled").addClass("disabled");
          $("#" + viewerDivId + " .instructions").hide();
          $("#" + viewerDivId + " .instructions").removeClass('on');
          $("#" + viewerDivId + ' .timelineSlider').slider("disable");
          $("#" + viewerDivId + " .tourLoadOverlayPlay").attr("src", rootAppURL + "images/tour_stop_outline.png").css("opacity", "1.0");
          $("#" + viewerDivId + " .snaplapseTourPlayBack").css("left", "0px").toggleClass("playTour stopTour").attr("title", "Click to stop this tour");
        });

        snaplapse.addEventListener('stop', function() {
          // Remove masks
          $("#" + viewerDivId + " .snaplapsePlayingMaskViewer").remove();
          $("#" + composerDivId + " .snaplapsePlayingMask").remove();

          if (editorEnabled)
            setSubtitlePosition("up");

          if (uiEnabled) {
            // If users play tours from the editor
            enableEditorToolbarButtons();
            var visualizer = timelapse.getVisualizer();
            if (visualizer)
              visualizer.handleShowHideNavigationMap("show");
            if (visualizer) {
              timelapse.setPanoVideoEnableStatus(true);
              timelapse.seek(timelapse.getCurrentTime());
            }
            $("#" + composerDivId + " .playStopTimewarp").button("option", {
              icons: {
                primary: "ui-icon-play"
              },
              label: "Play Tour"
            }).removeClass("isPlaying");
            $("#" + viewerDivId + " .snaplapseTourPlayBack").css("visibility", "visible");
            $sortable.css("opacity", "1");
          } else {
            // If users play tours from the viewer
            var presentationSlider = timelapse.getSnaplapseForPresentationSlider();
            if (presentationSlider && presentationSlider.getKeyframes().length > 0)
              $("#" + timeMachineDivId + " .presentationSlider").show();
            if (useCustomUI)
              $("#" + timeMachineDivId + " .composer").show();
            hideAnnotationBubble();
          }

          if (!useCustomUI) {
            $sideToolbar.show();
            $controls.show();
            setCaptureTimePosition("up");
          } else {
            showCustomUI();
          }

          $playbackButton.removeClass("pause").addClass("play");
          $playbackButton.attr("title", "Play");
          $("#" + viewerDivId + ' .help').removeClass("disabled").addClass("enabled");
          $("#" + viewerDivId + ' .timelineSlider').slider("enable");
          $("#" + viewerDivId + " .tourLoadOverlayPlay").attr("src", rootAppURL + "images/tour_replay_outline.png").css("opacity", "1.0");
          $("#" + viewerDivId + " .snaplapseTourPlayBack").css("left", "67px").toggleClass("stopTour playTour").attr("title", "Click to replay this tour");
        });

        snaplapse.addEventListener('keyframe-added', function(keyframe, insertionIndex, keyframes) {
          addSnaplapseKeyframeListItem(keyframe, insertionIndex, undefined, keyframes);
        });

        snaplapse.addEventListener('keyframe-loaded', function(keyframe, insertionIndex, keyframes, loadKeyframesLength) {
          var loadNextKeyframe = function() {
            if (uiEnabled && !useThumbnailServer)
              videoset.removeEventListener('video-seeked', loadNextKeyframe);
            // Timeout since the seeked event does not fire correctly, so delay a bit
            var waitTime = 700;
            if (!uiEnabled || useThumbnailServer)
              waitTime = 0;
            setTimeout(function() {
              if (uiEnabled)
                addSnaplapseKeyframeListItem(keyframe, insertionIndex, true, keyframes, loadKeyframesLength);
              if (insertionIndex == loadKeyframesLength - 1) {
                // Loading completed
                $(".loadingOverlay").remove();
                $(document.body).css("cursor", "default");
                // Set the value of the last keyframe to null (need to use reference but not clone)
                // so swaping it with other keyframes will give a default value
                snaplapse.resetKeyframe();
                if (usePresentationSlider) {
                  $("#" + composerDivId + " .snaplapse_keyframe_container").scrollLeft(0);
                  if (presentationSliderLoadAnimation != "none") {
                    var unsafeHashObj = UTIL.getUnsafeHashVars();
                    // Go to the desired keyframe if there is no shared view and no tour
                    if ( typeof unsafeHashObj.v == "undefined" && typeof unsafeHashObj.tour == "undefined") {
                      var $desiredSlide;
                      if ( typeof unsafeHashObj.slide != "undefined") {
                        $desiredSlide = $("#" + unsafeHashObj.slide);
                      }
                      if (!$desiredSlide || $desiredSlide.length == 0) {
                        if (initialWaypointIndex > 0) {
                          var waypointId = $("#" + composerDivId + " .snaplapse_keyframe_list").children().eq(initialWaypointIndex).children()[0].id;
                          $desiredSlide = $("#" + waypointId)
                        } else {
                          // Go to the first keyframe if there is no desired keyframe
                          var firstFrame = snaplapse.getKeyframes()[0];
                          $desiredSlide = $("#" + timeMachineDivId + "_snaplapse_keyframe_" + firstFrame.id).children(".snaplapse_keyframe_list_item_thumbnail_container_presentation");
                        }
                      }
                    }
                    var keyframeId = $desiredSlide.parent().attr("id").split("_")[3];
                    var frames = snaplapse.getKeyframeById(keyframeId);
                    if (presentationSliderLoadAnimation == "zoom") {
                      timelapse.setNewView(timelapse.pixelBoundingBoxToLatLngCenterView(frames['bounds']), false, presentationSliderPlayAfterAnimation);
                    } else if (presentationSliderLoadAnimation == "warp") {
                      timelapse.setNewView(timelapse.pixelBoundingBoxToLatLngCenterView(frames['bounds']), true, presentationSliderPlayAfterAnimation);
                    }
                    selectAndGo($("#" + timeMachineDivId + "_snaplapse_keyframe_" + keyframeId), keyframeId, true, true, true);
                  } else {
                    if (currentAutoModeWaypointIdx != -1) currentAutoModeWaypointIdx--;
                  }
                  // Check if there are not enough slides to fit into the slider
                  var firstFrame = snaplapse.getKeyframes()[0];
                  var $firstFrameThumbnailButton = $("#" + timeMachineDivId + "_snaplapse_keyframe_" + firstFrame.id).children(".snaplapse_keyframe_list_item_thumbnail_container_presentation");
                  var slideWidth = $firstFrameThumbnailButton.width() + 2;
                  var stripWidth = slideWidth*keyframes.length;
                  var maxWidth = $("#" + timeMachineDivId + " .player").width();
                  var viewerDivBottom = 100;
                  if (stripWidth < maxWidth) {
                    $("#" + timeMachineDivId + " .presentationSlider .snaplapse_keyframe_container").css("right", "auto");
                    viewerDivBottom = 80;
                  }
                  // Resize the slider and the viewer to fit the window
                  $("#" + viewerDivId).css({
                    "position": "absolute",
                    "top": "0px",
                    "left": "0px",
                    "right": "0px",
                    "bottom": viewerDivBottom + "px",
                    "width": "auto",
                    "height": "auto"
                  });
                  timelapse.onresize();
                  startAutoModeIdleTimeout();
                } else {
                  if (!uiEnabled) {
                    // If the editor UI is not enabled, then we are in view-only mode
                    // and we need to seek to the first keyframe.
                    var firstFrame = snaplapse.getKeyframes()[0];
                    timelapse.warpToBoundingBox(firstFrame.bounds);
                    timelapse.seek(firstFrame.time);
                    displaySnaplapseFrameAnnotation(firstFrame);
                  } else {
                    if (useThumbnailServer) {
                      // If we are using the thumbnail server, we aren't already seeking to each keyframe
                      // so we need to seek to the last keyframe manually.
                      timelapse.warpToBoundingBox(keyframe.bounds);
                      timelapse.seek(keyframe.time);
                    }
                    displaySnaplapseFrameAnnotation(keyframe);
                  }
                }
                var listeners = eventListeners["snaplapse-loaded"];
                if (listeners) {
                  for (var i = 0; i < listeners.length; i++)
                    listeners[i](keyframes.length);
                }
              } else {
                // Load the next keyframe
                snaplapse.loadFromJSON(undefined, insertionIndex + 1);
              }
            }, waitTime);
          };
          // Handle next keyframe loading
          if (uiEnabled && !useThumbnailServer) {
            timelapse.warpToBoundingBox(keyframe['bounds']);
            timelapse.seek(keyframe['time']);
            videoset.addEventListener('video-seeked', loadNextKeyframe);
          } else
            loadNextKeyframe();
        });

        snaplapse.addEventListener('keyframe-modified', function(keyframe) {
          $("#" + timeMachineDivId + "_snaplapse_keyframe_" + keyframe['id'] + "_timestamp").text(keyframe['captureTime']);
          // TODO: check if the thumbnail server is down and set the flag automatically
          if (useThumbnailServer)
            loadThumbnailFromServer(keyframe);
          else
            setKeyframeThumbail(keyframe);
        });

        snaplapse.addEventListener('keyframe-interval-change', function(keyframe) {
          UTIL.log("##################### snaplapse keyframe-interval-change: " + JSON.stringify(keyframe));
          // Render the keyframe as selected to show that it's being played
          displaySnaplapseFrameAnnotation(keyframe);
        });

        // TODO: add videoset listener which listens for the stall event so we can disable the recordKeyframeButton
        // (if not already disabled due to playback)
        didOnce = true;
      }
      if ($sortable)
        $sortable.empty();
      $("#" + viewerDivId + " .snaplapse-annotation-description > div").text("");

      // Set the UI after starting to load a new tour
      if ( typeof json != 'undefined' && json != null) {
        var loadJSON = JSON.parse(json);
        var tourTitle = loadJSON['snaplapse']['unsafe_string_title'] ? loadJSON['snaplapse']['unsafe_string_title'] : "Untitled";
        if (uiEnabled && !usePresentationSlider) {
          // Add the tour title to the save dialogue
          $("#" + composerDivId + " .saveTimewarpWindow_tourTitleInput").val(tourTitle);
        }
        if (usePresentationSlider) {
          var unsafeHashObj = UTIL.getUnsafeHashVars();
          if ( typeof unsafeHashObj.tour == "undefined")
            $("#" + composerDivId).show();
          if (useCustomUI && uiEnabled)
            $("#" + timeMachineDivId + " .composer").hide();
        }
        if (!uiEnabled && !usePresentationSlider) {
          timelapse.pause();
          initializeTourOverlyUI(tourTitle);
          if (noPlaybackOverlay != true) {
            $("#" + viewerDivId + " .tourLoadOverlay").css("visibility", "visible");
            //$("#" + viewerDivId + " .tourLoadOverlayPlay").css("visibility", "visible");
          }
          setSubtitlePosition("down");
          $("#" + timeMachineDivId + " .presentationSlider").hide();
          if (useCustomUI) {
            hideCustomUI();
            $("#" + timeMachineDivId + " .composer").hide();
          } else {
            $("#" + viewerDivId + " .controls").hide();
            $("#" + viewerDivId + " .sideToolBar").hide();
            setCaptureTimePosition("down");
            setDefaultUIToPlayerMode();
          }
        }
        return snaplapse.loadFromJSON(json, 0);
      }

      return true;
    };
    this.loadNewSnaplapse = loadNewSnaplapse;

    var setSubtitlePosition = function(position) {
      var positionBottom;
      if (position == "up")
        positionBottom = 62;
      else if (position == "down")
        positionBottom = 15;
      $("#" + viewerDivId + " .snaplapse-annotation-description").css("bottom", positionBottom + "px");
    };

    var setCaptureTimePosition = function(position) {
      var positionBottom;
      var positionLeft;
      var fontSize;
      if (position == "up") {
        positionLeft = 90;
        positionBottom = 42;
        fontSize = 18;
      } else if (position == "down") {
        positionLeft = 8;
        positionBottom = 5;
        fontSize = 15;
      }
      $("#" + viewerDivId + " .captureTime").css({
        "bottom": positionBottom + "px",
        "left": positionLeft + "px",
        "font-size": fontSize + "px"
      });
    };

    var setDefaultUIToPlayerMode = function() {
      var $editorToggleCheckbox = $("#" + viewerDivId + " .editorToggleCheckbox");
      var $annotatorToggleCheckbox = $("#" + viewerDivId + " .annotatorToggleCheckbox");
      if ($editorToggleCheckbox.is(":checked"))
        $editorToggleCheckbox.click();
      if ($annotatorToggleCheckbox.is(":checked"))
        $annotatorToggleCheckbox.click();
    };

    var setKeyframeThumbail = function(keyframe) {
      if (!uiEnabled)
        return;
      try {
        // Find max video id
        var videoElement = videoset.getCurrentActiveVideo();
        if (videoElement != null) {
          var scale = KEYFRAME_THUMBNAIL_WIDTH / timelapse.getViewportWidth();
          var thumbnailCanvas = $("#" + timeMachineDivId + "_snaplapse_keyframe_" + keyframe['id'] + "_thumbnail").get(0);
          var ctx = thumbnailCanvas.getContext("2d");
          ctx.clearRect(0, 0, KEYFRAME_THUMBNAIL_WIDTH, KEYFRAME_THUMBNAIL_HEIGHT);

          if (viewerType == "video") {
            var vid = $(videoElement);
            var vWidth = vid.width();
            var vHeight = vid.height();
            var vTopLeftX = vid.position().left;
            var vTopLeftY = vid.position().top;
            ctx.drawImage(vid.get(0), 0, 0, timelapse.getVideoWidth(), timelapse.getVideoHeight(), vTopLeftX * scale, vTopLeftY * scale, vWidth * scale, vHeight * scale);
          } else {
            var canvas = timelapse.getCanvas();
            var cWidth = canvas.width;
            var cHeight = canvas.height;
            ctx.drawImage(canvas, 0, 0, cWidth, cHeight, 0, 0, KEYFRAME_THUMBNAIL_WIDTH, KEYFRAME_THUMBNAIL_HEIGHT);
          }
        } else {
          UTIL.error("setKeyframeThumbail(): failed to find a good video");
        }
      } catch(e) {
        UTIL.error("Exception while trying to create thumbnail: " + e);
      }
    };

    var isTextNonEmpty = function(text) {
      return ( typeof text != 'undefined' && text.length > 0);
    };

    var hideAnnotationBubble = function() {
      $("#" + viewerDivId + " .snaplapse-annotation-description").hide();
    };
    this.hideAnnotationBubble = hideAnnotationBubble;

    var addSnaplapseKeyframeListItem = function(keyframe, insertionIndex, isKeyframeFromLoad, keyframes, loadKeyframesLength) {
      var keyframeId = keyframe['id'];
      var keyframeListItem = document.createElement("div");
      keyframeListItem.id = timeMachineDivId + "_snaplapse_keyframe_" + keyframeId;

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

      var duration = typeof keyframe['duration'] != 'undefined' && keyframe['duration'] != null ? keyframe['duration'] : '';
      var speed = typeof keyframe['speed'] != 'undefined' && keyframe['speed'] != null ? keyframe['speed'] : 100;
      var isDescriptionVisible = typeof keyframe['is-description-visible'] == 'undefined' ? true : keyframe['is-description-visible'];
      var buildConstraint = typeof keyframe['buildConstraint'] == 'undefined' ? "speed" : keyframe['buildConstraint'];
      var loopTimes = typeof keyframe['loopTimes'] == 'undefined' ? null : keyframe['loopTimes'];
      var disableTourLooping = ( typeof settings['disableTourLooping'] == "undefined") ? false : settings['disableTourLooping'];

      var content = '';
      if (!usePresentationSlider) {
        // Tour or presentation editor
        content += '<table id="' + tableId + '" border="0" cellspacing="0" cellpadding="0" class="snaplapse_keyframe_list_item_table">';
        content += '  <tr valign="center">';
        content += '    <td valign="center" id="' + keyframeTableId + '" class="keyframe_table">';
        content += '      <div id="' + timestampId + '" class="snaplapse_keyframe_list_item_timestamp">' + keyframe['captureTime'] + '</div>';
        content += '			<div id="' + thumbnailButtonId + '" class="snaplapse_keyframe_list_item_thumbnail_container" title="Go to this keyframe">';
        content += '				<div class="snaplapse_keyframe_list_item_thumbnail_overlay"></div>';
        if (useThumbnailServer)
          content += '      	<img id="' + thumbnailId + '" width="' + KEYFRAME_THUMBNAIL_WIDTH + '" height="' + KEYFRAME_THUMBNAIL_HEIGHT + '" class="snaplapse_keyframe_list_item_thumbnail"></img>';
        else
          content += '      	<canvas id="' + thumbnailId + '" width="' + KEYFRAME_THUMBNAIL_WIDTH + '" height="' + KEYFRAME_THUMBNAIL_HEIGHT + '" class="snaplapse_keyframe_list_item_thumbnail"></canvas>';
        if (!disableKeyframeTitle)
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
      if (useTouchFriendlyUI)
        $(".snaplapse_keyframe_list_item_thumbnail_overlay_presentation").addClass("snaplapse_keyframe_list_item_thumbnail_overlay_presentation-touchFriendly");

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
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-select-keyframe');
      });

      if (!usePresentationSlider) {
        $keyframeTable.hover(function() {
          var $keyframeListItem = $("#" + keyframeListItem.id);
          if (!$keyframeListItem.hasClass("ui-selected"))
            UTIL.changeBackgroundColorOpacity($keyframeListItem.get(0), 0.15);
        }, function() {
          var $keyframeListItem = $("#" + keyframeListItem.id);
          if (!$keyframeListItem.hasClass("ui-selected"))
            UTIL.changeBackgroundColorOpacity($keyframeListItem.get(0), 0);
        });
      }

      var $thumbnailButton = $("#" + thumbnailButtonId);

      $thumbnailButton.click(function(event) {
        clearAutoModeTimeout();
        wayPointClickedByAutoMode = (event.pageX == 0 && event.pageY == 0) ? true : false;
        //event.stopPropagation();
        var keyframeId = $(this).parent().attr("id").split("_")[3];
        selectAndGo($("#" + keyframeListItem.id), keyframeId);
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-go-to-keyframe');
      }).mousedown(function() {
        //event.stopPropagation();
      });

      if (usePresentationSlider) {
        $thumbnailButton.attr("id", keyframe.unsafe_string_frameTitle.split(' ').join('_'));
        $thumbnailButton.hover(function() {
          var thisKeyframeId = $(this).parent().attr("id").split("_")[3];
          var thisKeyframe = snaplapse.getKeyframeById(thisKeyframeId);
          setKeyframeCaptionUI(thisKeyframe, this);
        }, function() {
          var thisKeyframeId = $(this).parent().attr("id").split("_")[3];
          var thisKeyframe = snaplapse.getKeyframeById(thisKeyframeId);
          setKeyframeCaptionUI(thisKeyframe, this, true);
        });/*.click(function() {
          // Change the hash to the current slide
          // TODO: do not override the original hash
          var slideId = $(this).attr("id");
          if (window && (window.self !== window.top)) {
            // If this is an iframe page
            window.top.location.hash = "#slide=" + slideId;
          } else {
            // If this is a source page
            window.location.hash = "#slide=" + slideId;
          }
        });*/
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
          UTIL.addGoogleAnalyticEvent('radio', 'click', 'editor-set-transition-to-speed-for-keyframe');
        } else {
          // Using duration as the main constraint
          snaplapse.resetDurationBlockForKeyframe(thisKeyframeId);
          UTIL.addGoogleAnalyticEvent('radio', 'click', 'editor-set-transition-to-duration-for-keyframe');
        }
        resetKeyframeTransitionUI(this.value, timeMachineDivId + "_snaplapse_keyframe_" + thisKeyframeId);
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
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-set-metadata-for-keyframe');
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
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-update-keyframe');
      }).mousedown(function() {
        event.stopPropagation();
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
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-duplicate-keyframe');
      }).mousedown(function() {
        event.stopPropagation();
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
        if (snaplapse.isPlaying())
          snaplapse.stop();
        var thisKeyframeId = this.id.split("_")[3];
        snaplapse.play(thisKeyframeId);
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-play-tour-from-keyframe');
      }).mousedown(function() {
        event.stopPropagation();
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
        UTIL.addGoogleAnalyticEvent('textbox', 'change', 'editor-change-duration-for-keyframe');
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
        UTIL.addGoogleAnalyticEvent('textbox', 'change', 'editor-change-speed-for-keyframe');
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
        UTIL.addGoogleAnalyticEvent('textbox', 'change', 'editor-change-loop-for-keyframe');
      });

      // Override the color of keyframe items
      keyframeListItem.style.backgroundColor = "rgba(1,1,1,0)";

      // Hide the last keyframe transition area
      hideLastKeyframeTransition();
      handleEditorModeToolbarChange();
      $("#" + composerDivId + " .toolbar .addTimetag").button("option", "disabled", false);

      // Reset the UI
      resetKeyframeTransitionUI(buildConstraint, keyframeListItem.id);

      // Add a time tag on the context map
      if (timelapse.getVisualizer() && !usePresentationSlider && uiEnabled && !useCustomUI)
        timelapse.getVisualizer().addTimeTag(keyframes, insertionIndex, isKeyframeFromLoad);

      // Grab the current video frame and store it as the thumbnail in the canvas
      if (useThumbnailServer)
        loadThumbnailFromServer(keyframe);
      else {
        setTimeout(function() {
          setKeyframeThumbail(keyframe);
        }, 500);
      }

      // Select the element
      UTIL.selectSortableElements($sortable, $("#" + keyframeListItem.id), false);
      setKeyframeTitleUI(keyframe);
    };

    var selectAndGo = function($select, keyframeId, skipAnnotation, skipGo, doNotFireListener) {
      var setViewCallback = null;

      if (doAutoMode) {
        setViewCallback = function() {
          if (wayPointClickedByAutoMode) {
            startAutoModeWaypointTimeout();
          } else {
            startAutoModeIdleTimeout();
          }
        }
      } else if (usePresentationSlider) {
        setKeyframeCaptionUI(undefined, undefined, true);
      }

      UTIL.selectSortableElements($sortable, $select, true, function() {
        if (doAutoMode && showAnnotations) {
          setKeyframeCaptionUI(snaplapse.getKeyframeById(keyframeId), $("#timeMachine_snaplapse_keyframe_" + keyframeId));
        }
      });
      if (usePresentationSlider) {
        $sortable.children().children().children(".snaplapse_keyframe_list_item_thumbnail_overlay_presentation").removeClass("thumbnail_highlight");
        $select.children().children(".snaplapse_keyframe_list_item_thumbnail_overlay_presentation").addClass("thumbnail_highlight");
      }
      if ( typeof (keyframeId) != "undefined") {
        var keyframe = snaplapse.getKeyframeById(keyframeId);
        if (skipAnnotation != true) {
          displaySnaplapseFrameAnnotation(keyframe);
          setKeyframeTitleUI(keyframe);
        }
        if (skipGo != true) {
          var newView = timelapse.pixelBoundingBoxToLatLngCenterView(keyframe['bounds']);
          // TODO: Hack for hyperwall
          newView.zoom += 0.8;
          if (usePresentationSlider && useCustomUI) {
            timelapse.setNewView(newView, false, false, setViewCallback);
          } else {
            timelapse.setNewView(newView, true, false, setViewCallback);
          }
          timelapse.seek(keyframe['time']);
          if (usePresentationSlider && doNotFireListener != true) {
            var listeners = eventListeners["slide-changed"];
            if (listeners) {
              for (var i = 0; i < listeners.length; i++) {
                try {
                  listeners[i](keyframe.unsafe_string_frameTitle);
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

    var loadThumbnailFromServer = function(keyframe) {
      var $img = $("#" + timeMachineDivId + "_snaplapse_keyframe_" + keyframe['id'] + "_thumbnail");
      var thumbnailURL = generateThumbnailURL(thumbnailServerRootTileUrl, keyframe.bounds, $img.width(), $img.height(), keyframe.time);
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
      // TODO: There are issues pulling thumbnails from mp4 files. Below is a quick hack, since at the moment
      // Landsat is the only dataset that will be utilizing the 'thumbnailServerRootTileUrl' flag.
      if (mediaType && ( typeof (settings["thumbnailServerRootTileUrl"]) == "undefined"))
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
      var $snaplapseContainer = $("#" + composerDivId + " .snaplapse_keyframe_container");
      $snaplapseContainer.css({
        "top": "0px",
        "height": "inherit",
        "overflow-x": "auto"
      });
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
            UTIL.error("Failed to load snaplapse json from URL [" + snaplapseJsonUrl + "]");
          }
        },
        error: function() {
          UTIL.error("Error loading snaplapse json from URL [" + snaplapseJsonUrl + "]");
        }
      });
      return false;
    };

    var playStopSnaplapseOnButtonClicked = function() {
      if (snaplapse.isPlaying()) {
        snaplapse.stop();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-stop-tour');
      } else {
        snaplapse.play();
        UTIL.addGoogleAnalyticEvent('button', 'click', 'editor-play-tour');
      }
    };

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

    var showLoadSnaplapseWindow = function() {
      $("#" + composerDivId + " .loadTimewarpWindow").dialog("open");
      $("#" + composerDivId + " .loadTimewarpWindow_JSON").val("");
    };

    var loadSnaplapse = function(json) {
      if (loadNewSnaplapse(json)) {
        $('#' + composerDivId + " .snaplapse_composer_controls").show();
        $("#" + composerDivId + " .loadTimewarpWindow").dialog("close");
        hideAnnotationBubble();
        handleEditorModeToolbarChange();
      } else {
        alert("ERROR: Invalid tour file.");
      }
    };

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
          handleEditorModeToolbarChange();
          // The reason to hide and show the elements is to workaround a webkit refresh bug
          $keyframeContainer.hide().show(0);
        }
        handleSnaplapseFrameSelectionChange();
      }
    };

    var resizeUI = function() {
      var viewportHeight = timelapse.getViewportHeight();
      var newTop = usePresentationSlider ? (viewportHeight + (useTouchFriendlyUI ? -3 : 4)) : (viewportHeight - 2);
      $("#" + composerDivId).css({
        "position": "absolute",
        "top": newTop + "px",
        "left": "0px",
        "right": "2px",
        "bottom": "",
        "width": "auto",
        "height": ""
      });
    };
    this.resizeUI = resizeUI;

    var startAutoModeIdleTimeout = function() {
      if (!doAutoMode)
        return;
      clearAutoModeTimeout();
      autoModeTimeout = setTimeout(function() {
        var listeners = eventListeners["automode-start"];
        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            listeners[i]();
          }
        }
        runAutoMode();
      }, screenIdleTime);
    };

    var startAutoModeWaypointTimeout = function() {
      if (!doAutoMode)
        return;
      clearAutoModeTimeout();
      autoModeTimeout = setTimeout(function() {
        runAutoMode();
      }, waypointDelayTime);
    };

    var clearAutoModeTimeout = function() {
      clearTimeout(autoModeTimeout);
      autoModeTimeout = null;
      $("#" + composerDivId + " .keyframeSubtitleBoxForHovering").fadeOut(200);
    };

    var runAutoMode = function() {
      triggerAutoModeClick();
    };

    var triggerAutoModeClick = function() {
      currentAutoModeWaypointIdx++;
      if (currentAutoModeWaypointIdx >= timelapse.getSnaplapseForPresentationSlider().getNumKeyframes())
        currentAutoModeWaypointIdx = 0;
      var waypoint = $("#" + composerDivId + " .snaplapse_keyframe_list").children().eq(currentAutoModeWaypointIdx).children()[0];
      waypoint.click();
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    resizeUI();
    initializeSnaplapseUI();
    loadNewSnaplapse(null);
  };
})();
