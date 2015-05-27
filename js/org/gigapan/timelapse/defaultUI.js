// @license
// Redistribution and use in source and binary forms ...

/*
 Class for managing the default UI

 Dependencies:
 * org.gigapan.timelapse.Timelapse
 * jQuery (http://jquery.com/)

 Copyright 2013 Carnegie Mellon University. All rights reserved.

 Redistribution and use in source and binary forms, with or without modification, are
 permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this list of
 conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright notice, this list
 of conditions and the following disclaimer in the documentation and/or other materials
 provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
 WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 The views and conclusions contained in the software and documentation are those of the
 authors and should not be interpreted as representing official policies, either expressed
 or implied, of Carnegie Mellon University.

 Authors:
 Yen-Chia Hsu (legenddolphin@gmail.com)

 VERIFY NAMESPACE

 Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
 */
"use strict";

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
// DEPENDECIES
//
if (!org.gigapan.timelapse.Timelapse) {
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.DefaultUI";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.DefaultUI = function(timelapse, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //

    // Objects
    var visualizer = timelapse.getVisualizer();
    var annotator = timelapse.getAnnotator();
    var videoset = timelapse.getVideoset();
    var thumbnailTool = timelapse.getThumbnailTool();
    var changeDetectionTool = timelapse.getChangeDetectionTool();
    var tmJSON = timelapse.getTmJSON();
    var panInterval;

    // DOM elements
    var timeMachineDivId = timelapse.getTimeMachineDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var $playbackButton = $("#" + viewerDivId + " .playbackButton");
    var $controls = $("#" + viewerDivId + " .controls");
    var $fastSpeed = $("#fastSpeed");
    var $mediumSpeed = $("#mediumSpeed");
    var $slowSpeed = $("#slowSpeed");
    var $timelineSlider = $("#" + viewerDivId + " .timelineSlider");
    var $timelineSelector = $("#" + viewerDivId + " .timelineSelector");
    var $timelineSliderFiller = $("#" + viewerDivId + " .timelineSliderFiller");
    var $timelineSelectorFiller = $("#" + viewerDivId + " .timelineSelectorFiller");
    var $thumbnailPreview = $("#" + viewerDivId + " .thumbnail-preview");
    var $thumbnailPreviewCopyTextContainer = $("#" + viewerDivId + " .thumbnail-preview-copy-text-container");
    var $thumbnailPreviewContainer = $("#" + viewerDivId + " .thumbnail-preview-container");
    var $thumbnailPreviewCopyText = $("#" + viewerDivId + " .thumbnail-preview-copy-text");
    var $thumbnailPreviewLink = $("#" + viewerDivId + " .thumbnail-preview-link");

    // Settings
    var useCustomUI = timelapse.useCustomUI();
    var showShareBtn = ( typeof (settings["showShareBtn"]) == "undefined") ? ( useCustomUI ? false : true) : settings["showShareBtn"];
    var showHomeBtn = ( typeof (settings["showHomeBtn"]) == "undefined") ? true : settings["showHomeBtn"];
    var showFullScreenBtn = ( typeof (settings["showFullScreenBtn"]) == "undefined") ? true : settings["showFullScreenBtn"];
    var showMainControls = ( typeof (settings["showMainControls"]) == "undefined") ? true : settings["showMainControls"];
    var showZoomControls = ( typeof (settings["showZoomControls"]) == "undefined") ? true : settings["showZoomControls"];
    var showPanControls = ( typeof (settings["showPanControls"]) == "undefined") ? true : settings["showPanControls"];
    var showLogoOnDefaultUI = ( typeof (settings["showLogoOnDefaultUI"]) == "undefined") ? true : settings["showLogoOnDefaultUI"];
    var showEditorOnLoad = ( typeof (settings["showEditorOnLoad"]) == "undefined") ? false : settings["showEditorOnLoad"];
    var editorEnabled = timelapse.isEditorEnabled();
    var presentationSliderEnabled = timelapse.isPresentationSliderEnabled();
    var annotatorEnabled = timelapse.isAnnotatorEnabled();
    var changeDetectionEnabled = timelapse.isChangeDetectionEnabled();

    // Flags
    var isSafari = UTIL.isSafari();
    var originalIsPaused;
    var useTouchFriendlyUI = timelapse.useTouchFriendlyUI();

    // Parameters
    var minViewportHeight = timelapse.getMinViewportHeight();
    var minViewportWidth = timelapse.getMinViewportWidth();
    var mode = "player";
    var translationSpeedConstant = 20;
    var scrollBarWidth = UTIL.getScrollBarWidth();
    var timelineSelectorDefaultRangeOffset = 50;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    // Create main UI
    var createMainUI = function() {
      // Create play button
      $playbackButton.button({
        icons: {
          secondary: "ui-icon-custom-play"
        },
        text: false
      }).on("click", function() {
        if ($(this).hasClass("from_help"))
          return;
        timelapse.handlePlayPause();
        if (!timelapse.isPaused())
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-play');
        else
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-pause');
      });
      // Create help button
      var helpPlayerCheckbox = $("#" + viewerDivId + " .helpPlayerCheckbox");
      helpPlayerCheckbox.attr("id", timeMachineDivId + "_helpPlayerCheckbox");
      var $helpPlayerLabel = $("#" + viewerDivId + " .helpPlayerLabel");
      $helpPlayerLabel.attr("for", timeMachineDivId + "_helpPlayerCheckbox");
      helpPlayerCheckbox.button({
        icons: {
          primary: useTouchFriendlyUI ? "ui-icon-custom-help" : "ui-icon-help"
        },
        text: true
      }).change(function() {
        if (helpPlayerCheckbox.is(":checked")) {
          doHelpOverlay();
          $(document).one("mouseup", function(e) {
            if ($helpPlayerLabel.has(e.target).length == 0)
              helpPlayerCheckbox.prop("checked", false).button("refresh").change();
          });
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-show-help');
        } else {
          removeHelpOverlay();
        }
      });
      // Create Full Screen button
      if (showFullScreenBtn) {
        $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function() {
          timelapse.changeFullScreenState();
          var $fullScreenPlayer = $("#" + viewerDivId + " .fullScreen");
          if (timelapse.isFullScreen()) {
            // Safari 5 and older webkit browsers causes the screen to be white and not show the video once we enter
            // full screen mode. So we do a hack and seek 10% further into the video to make the browser repaint the canvas.
            // Sadly, this needs to be done on a timer...
            if (document.webkitCancelFullScreen && !document.webkitExitFullscreen) {
              setTimeout(function() {
                timelapse.seek(timelapse.getCurrentTime() + ((1 / timelapse.getFps()) * 0.1));
              }, 500);
            }
            $fullScreenPlayer.button({
              icons: {
                primary: "ui-icon-custom-fullScreenOff"
              }
            });
          } else {
            $fullScreenPlayer.button({
              icons: {
                primary: "ui-icon-custom-fullScreenOn"
              }
            });
          }
        });
        var $fullScreenPlayer = $("<div class='fullScreen'></div>");
        $fullScreenPlayer.attr({
          "id": timeMachineDivId + "_fullScreen",
          "title": "Toggle fullscreen mode"
        });
        $fullScreenPlayer.button({
          icons: {
            primary: "ui-icon-custom-fullScreenOn"
          },
          text: false
        }).on("click", function() {
          timelapse.fullScreen();
        });
        $fullScreenPlayer.appendTo($("#" + viewerDivId + " .controls"));
      }
      // Create share button
      if (showShareBtn) {
        createShareButton();
      } else {
        $("#" + viewerDivId + " .share").remove();
        $("#" + viewerDivId + " .shareView").remove();
      }
      // Create tool button
      if (editorEnabled || annotatorEnabled || changeDetectionEnabled) {
        createToolButton();
      }
      // Create other UI components
      createTimelineSlider();
      createTimelineSelector();
      createSpeedControl();
      // Settings
      if (!showMainControls || useCustomUI) {
        $("#" + viewerDivId + " .controls").hide();
        $("#" + viewerDivId + " .timelineSliderFiller").hide();
      }
      if (!showLogoOnDefaultUI)
        $("#" + viewerDivId + " .logo").hide();
    };

    var createToolButton = function() {
      $("#" + viewerDivId + " .tool").button({
        icons: {
          primary: "ui-icon-wrench"
        },
        text: true
      }).click(function() {
        var $toolDialog = $("#" + viewerDivId + " .toolDialog");
        if ($toolDialog.dialog("isOpen")) {
          $toolDialog.dialog("close");
        } else {
          $toolDialog.dialog("open");
        }
      });
      if (!editorEnabled) {
        removeAccordionPanel("accordion-editor");
      }
      if (!annotatorEnabled) {
        removeAccordionPanel("accordion-annotator");
      }
      if (!changeDetectionEnabled) {
        removeAccordionPanel("accordion-change-detection");
      }
      var activeState = false;
      if (showEditorOnLoad) {
        activeState = 0;
      }
      // Tool accordion
      var $accordion = $("#" + viewerDivId + " .toolDialog .accordion");
      $accordion.accordion({
        heightStyle: "content",
        animate: false,
        collapsible: true,
        active: activeState,
        beforeActivate: function(event, ui) {
          if (ui.newPanel.length > 0) {
            if (ui.newPanel.hasClass("accordion-editor")) {
              setMode("editor");
              if ( typeof changeDetectionTool != "undefined") {
                changeDetectionTool.disable();
              }
              UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-to-editor-mode');
            } else if (ui.newPanel.hasClass("accordion-annotator")) {
              setMode("annotator");
              if ( typeof changeDetectionTool != "undefined") {
                changeDetectionTool.disable();
              }
            } else if (ui.newPanel.hasClass("accordion-change-detection")) {
              setMode("player");
              if ( typeof changeDetectionTool != "undefined") {
                changeDetectionTool.enable();
              }
              UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-to-player-mode');
            }
          } else {
            if (ui.oldPanel.hasClass("accordion-editor") || ui.oldPanel.hasClass("accordion-annotator")) {
              setMode("player");
              UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-to-player-mode');
            } else if (ui.oldPanel.hasClass("accordion-change-detection")) {
              if ( typeof changeDetectionTool != "undefined") {
                changeDetectionTool.disable();
              }
            }
          }
        }
      });
      // Tool dialog
      $("#" + viewerDivId + " .toolDialog").dialog({
        resizable: false,
        autoOpen: false,
        dialogClass: "customDialog",
        appendTo: "#" + viewerDivId,
        width: 444,
        minHeight: 50
      });
      // Add events
      $("#" + viewerDivId + " .reset-large-change-detect").click(function(event) {
        changeDetectionTool.centerAndDrawFilterBound("large");
      });
      $("#" + viewerDivId + " .reset-medium-change-detect").click(function(event) {
        changeDetectionTool.centerAndDrawFilterBound("medium");
      });
      $("#" + viewerDivId + " .reset-small-change-detect").click(function(event) {
        changeDetectionTool.centerAndDrawFilterBound("small");
      });
    };

    var removeAccordionPanel = function(panelClass) {
      var $el = $("#" + viewerDivId + " ." + panelClass);
      $el.prev().remove();
      $el.remove();
    };

    var enableShareThumbnail = function() {
      thumbnailTool.showCropBox();
      $timelineSelectorFiller.show();
      var currentPos = timeToSliderValue(timelapse.getTimelapseCurrentTimeInSeconds());
      $timelineSelector.slider("values", 0, currentPos);
      $timelineSelector.slider("values", 1, currentPos + timelineSelectorDefaultRangeOffset);
      $timelineSliderFiller.hide();
      $playbackButton.button("option", "disabled", true);
      $("#" + viewerDivId + " .toggleSpeed").button("option", "disabled", true);
      originalIsPaused = timelapse.isPaused();
      if (!originalIsPaused)
        timelapse.handlePlayPause();
    };

    var disableShareThumbnail = function() {
      thumbnailTool.hideCropBox();
      $timelineSelectorFiller.hide();
      $timelineSliderFiller.show();
      $playbackButton.button("option", "disabled", false);
      $("#" + viewerDivId + " .toggleSpeed").button("option", "disabled", false);
      if (!originalIsPaused)
        timelapse.handlePlayPause();
    };

    var sliderValueToTime = function(value) {
      return (value + 0.3) / timelapse.getFps();
    };

    var timeToSliderValue = function(time) {
      return time * timelapse.getFps() - 0.3;
    };

    var createShareButton = function() {
      $("#" + viewerDivId + " .share").button({
        icons: {
          primary: "ui-icon-person"
        },
        text: true
      }).click(function() {
        var $shareViewDialog = $("#" + viewerDivId + " .shareView");
        if ($shareViewDialog.dialog("isOpen")) {
          $shareViewDialog.dialog("close");
        } else {
          $shareViewDialog.dialog("open");
          shareView();
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-show-share-dialog');
        }
      });
      // Share view accordion
      var $accordion = $("#" + viewerDivId + " .shareView .accordion")
      $accordion.accordion({
        heightStyle: "content",
        animate: false,
        beforeActivate: function(event, ui) {
          if (ui.oldPanel.hasClass("share-thumbnail")) {
            disableShareThumbnail();
          }
          if (ui.newPanel.hasClass("share-thumbnail")) {
            enableShareThumbnail();
          }
        }
      });
      // Share view dialog
      $("#" + viewerDivId + " .shareView").dialog({
        resizable: false,
        autoOpen: false,
        dialogClass: "customDialog",
        appendTo: "#" + viewerDivId,
        width: 444,
        minHeight: 50,
        beforeClose: function(event, ui) {
          var activeIdx = $accordion.accordion("option", "active");
          var $activePanel = $($accordion.accordion("instance").panels[activeIdx]);
          if ($activePanel.hasClass("share-thumbnail")) {
            disableShareThumbnail();
          }
        },
        open: function(event, ui) {
          var activeIdx = $accordion.accordion("option", "active");
          var $activePanel = $($accordion.accordion("instance").panels[activeIdx]);
          if ($activePanel.hasClass("share-thumbnail")) {
            enableShareThumbnail();
          }
        }
      });
      $thumbnailPreviewContainer.hide();
      $thumbnailPreviewCopyTextContainer.hide();
      // Add events
      $("#" + viewerDivId + " .get-current-thumbnail").click(function(event) {
        var urlSettings = {
          format: "png"
        };
        setThumbnailPreviewArea(thumbnailTool.getURL(urlSettings));
      });
      $("#" + viewerDivId + " .get-current-gif").click(function(event) {
        var urlSettings = {
          startTime: sliderValueToTime($timelineSelector.slider("values", 0)),
          endTime: sliderValueToTime($timelineSelector.slider("values", 1)),
          format: "gif"
        };
        setThumbnailPreviewArea(thumbnailTool.getURL(urlSettings));
      });
      $("#" + viewerDivId + " .get-current-video").click(function(event) {
        var urlSettings = {
          startTime: sliderValueToTime($timelineSelector.slider("values", 0)),
          endTime: sliderValueToTime($timelineSelector.slider("values", 1)),
          format: "mp4"
        };
        setThumbnailPreviewArea(thumbnailTool.getURL(urlSettings));
      });
      $("#" + viewerDivId + " .reset-large").click(function(event) {
        thumbnailTool.centerAndDrawCropBox("large");
      });
      $("#" + viewerDivId + " .reset-medium").click(function(event) {
        thumbnailTool.centerAndDrawCropBox("medium");
      });
      $("#" + viewerDivId + " .reset-small").click(function(event) {
        thumbnailTool.centerAndDrawCropBox("small");
      });
      $("#" + viewerDivId + " .thumbnail-preview-copy-text-button").click(function(event) {
        $thumbnailPreviewCopyText.select();
        document.execCommand('copy');
      });
      $thumbnailPreviewCopyText.on("focus", function() {
        $(this).select();
      }).click(function() {
        $(this).select();
      }).mouseup(function(e) {
        e.preventDefault();
      });
      timelapse.addViewEndChangeListener(function() {
        shareView();
      });
      timelapse.addTimeChangeListener(function() {
        shareView();
      });
    };

    var setThumbnailPreviewArea = function(response) {
      $thumbnailPreviewContainer.show();
      $thumbnailPreviewCopyTextContainer.show();

      // This code block is used to solve a problem related to scrollbar overflowing
      var maxContainerWidth = parseInt($thumbnailPreviewContainer.css("max-width"));
      var maxContainerHeight = parseInt($thumbnailPreviewContainer.css("max-height"));
      var width = response.args.width;
      var height = response.args.height;
      if (width > maxContainerWidth) {
        $thumbnailPreviewContainer.css("overflow-x", "auto");
        height += scrollBarWidth;
      } else {
        $thumbnailPreviewContainer.css("overflow-x", "hidden");
      }
      if (height > maxContainerHeight) {
        $thumbnailPreviewContainer.css("overflow-y", "auto");
        width += scrollBarWidth;
      } else {
        $thumbnailPreviewContainer.css("overflow-y", "hidden");
      }
      $thumbnailPreviewContainer.width(width);
      $thumbnailPreviewContainer.height(height);

      // Hide the preview and show it when the thumbnail is loaded
      $thumbnailPreview.hide();
      $thumbnailPreviewCopyText.val(response.url);
      $thumbnailPreview.one("load", function() {
        $thumbnailPreview.show();
      });
      $thumbnailPreview.attr("src", response.url);
      $thumbnailPreviewLink.attr("href", UTIL.getParentURL() + timelapse.getShareView());
    };

    var createSideToolBar = function() {
      if (showPanControls)
        createPanControl();
      if (showZoomControls)
        createZoomControl();
    };

    var createPanControl = function() {
      var $pan = $("#" + viewerDivId + " .pan");
      // Create pan left button
      $pan.append('<div class="panLeft"></div>');
      $("#" + viewerDivId + " .panLeft").button({
        icons: {
          primary: "ui-icon-triangle-1-w"
        },
        text: false
      }).position({
        "my": "left center",
        "at": "left center",
        "of": $("#" + viewerDivId + " .panLeft").parent()
      }).on("mousedown", function() {
        panInterval = setInterval(function() {
          var offset = {
            x: -translationSpeedConstant,
            y: 0
          };
          timelapse.setTargetView(undefined, offset);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-pan-left-from-button');
      });
      // Create pan left button
      $pan.append('<div class="panRight"></div>');
      $("#" + viewerDivId + " .panRight").button({
        icons: {
          primary: "ui-icon-triangle-1-e"
        },
        text: false
      }).position({
        "my": "right center",
        "at": "right center",
        "of": $("#" + viewerDivId + " .panLeft").parent()
      }).on("mousedown", function() {
        panInterval = setInterval(function() {
          var offset = {
            x: translationSpeedConstant,
            y: 0
          };
          timelapse.setTargetView(undefined, offset);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-pan-right-from-button');
      });
      // Create pan left button
      $pan.append('<div class="panUp"></div>');
      $("#" + viewerDivId + " .panUp").button({
        icons: {
          primary: "ui-icon-triangle-1-n"
        },
        text: false
      }).position({
        "my": "center top",
        "at": "center top",
        "of": $("#" + viewerDivId + " .panLeft").parent()
      }).on("mousedown", function() {
        panInterval = setInterval(function() {
          var offset = {
            x: 0,
            y: -translationSpeedConstant
          };
          timelapse.setTargetView(undefined, offset);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-pan-up-from-button');
      });
      // Create pan left button
      $pan.append('<div class="panDown"></div>');
      $("#" + viewerDivId + " .panDown").button({
        icons: {
          primary: "ui-icon-triangle-1-s"
        },
        text: false
      }).position({
        "my": "center bottom",
        "at": "center bottom",
        "of": $("#" + viewerDivId + " .panLeft").parent()
      }).on("mousedown", function() {
        panInterval = setInterval(function() {
          var offset = {
            x: 0,
            y: translationSpeedConstant
          };
          timelapse.setTargetView(undefined, offset);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-pan-down-from-button');
      });
    };

    var createZoomControl = function() {
      var intervalId;
      var $zoom = $("#" + viewerDivId + " .zoom");
      // Create zoom in button
      $zoom.append('<button class="zoomin" title="Zoom in"></button>');

      if (useTouchFriendlyUI)
        $zoom.addClass("zoom-touchFriendly")

      $("#" + viewerDivId + " .zoomin").button({
        icons: {
          primary: useTouchFriendlyUI ? "ui-icon-custom-plus" : "ui-icon-plus"
        },
        text: false
      }).mousedown(function() {
        intervalId = setInterval(function() {
          zoomIn();
        }, 50);
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-zoom-in-from-button');
      }).click(function() {
        zoomIn();
      }).mouseup(function() {
        clearInterval(intervalId);
      }).mouseout(function() {
        clearInterval(intervalId);
      });
      // Create zoom slider
      createZoomSlider($zoom);
      // Create zoom out button
      $zoom.append('<button class="zoomout" title="Zoom out"></button>');
      $("#" + viewerDivId + " .zoomout").button({
        icons: {
          primary: useTouchFriendlyUI ? "ui-icon-custom-minus" : "ui-icon-minus"
        },
        text: false
      }).mousedown(function() {
        intervalId = setInterval(function() {
          zoomOut();
        }, 50);
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-zoom-out-from-button');
      }).click(function() {
        zoomOut();
      }).mouseup(function() {
        clearInterval(intervalId);
      }).mouseout(function() {
        clearInterval(intervalId);
      });
      // Create zoom all button
      if (showHomeBtn) {
        $zoom.append('<button class="zoomall" title="Home"></button>');
        $("#" + viewerDivId + " .zoomall").button({
          icons: {
            primary: useTouchFriendlyUI ? "ui-icon-custom-home" : "ui-icon-home"
          },
          text: false
        }).click(function() {
          timelapse.warpTo(timelapse.getHomeView());
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-zoom-to-home-view');
        });
      }
    };

    var createZoomSlider = function($zoom) {
      $zoom.append('<div class="zoomSlider" title="Click to zoom"></div>');
      var $zoomSlider = $("#" + viewerDivId + " .zoomSlider");
      $zoomSlider.slider({
        orientation: "vertical",
        value: timelapse.viewScaleToZoomSlider(timelapse.getHomeView().scale),
        min: 0,
        max: 1,
        step: useTouchFriendlyUI ? 0.003 : 0.01,
        slide: function(e, ui) {
          timelapse.setScaleFromSlider(ui.value);
        }
      }).removeClass("ui-corner-all");

      $zoomSlider.bind("mousedown", function() {
        if (window && (window.self !== window.top)) {
          $("body").one("mouseleave", function(event) {
            $zoomSlider.trigger("mouseup");
          });
        }
        UTIL.addGoogleAnalyticEvent('slider', 'click', 'viewer-zoom-from-slider');
      });

      $("#" + viewerDivId + " .zoomSlider .ui-slider-handle").attr("title", "Drag to zoom");

      if (useTouchFriendlyUI)
        $("#" + viewerDivId + " .pan, .zoomSlider").hide();

    };

    var createSpeedControl = function() {
      // Speeds < 0.5x in Safari, even if emulated, result in broken playback, so do not include the "slow" (0.25x) speed option
      if (isSafari)
        $slowSpeed.remove();

      $fastSpeed.button({
        text: true
      }).click(function() {
        timelapse.setPlaybackRate(0.5, null, true);
        $controls.prepend($mediumSpeed);
        $mediumSpeed.stop(true, true).show();
        $fastSpeed.slideUp(300);
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-speed-to-medium');
      });

      $mediumSpeed.button({
        text: true
      }).click(function() {
        // Due to playback issues, we are not allowing the "slow" option for Safari users
        if (isSafari) {
          timelapse.setPlaybackRate(1, null, true);
          $controls.prepend($fastSpeed);
          $fastSpeed.stop(true, true).show();
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-speed-to-fast');
        } else {
          timelapse.setPlaybackRate(0.25, null, true);
          $controls.prepend($slowSpeed);
          $slowSpeed.stop(true, true).show();
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-speed-to-slow');
        }
        $mediumSpeed.slideUp(300);
      });

      $slowSpeed.button({
        text: true
      }).click(function() {
        timelapse.setPlaybackRate(1, null, true);
        $controls.prepend($fastSpeed);
        $fastSpeed.stop(true, true).show();
        $slowSpeed.slideUp(300);
        UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-set-speed-to-fast');
      });

      timelapse.addPlaybackRateChangeListener(function(rate, skipUpdateUI) {
        if (!skipUpdateUI) {
          var snaplapse = timelapse.getSnaplapse();
          var snaplapseForSharedTour = timelapse.getSnaplapseForSharedTour();
          if ((snaplapse && snaplapse.isPlaying()) || (snaplapseForSharedTour && snaplapseForSharedTour.isPlaying()))
            return;
          $("#" + viewerDivId + " .toggleSpeed").hide();
          if (rate >= 1) {
            $fastSpeed.show();
            $mediumSpeed.hide();
            $slowSpeed.hide();
          } else if ((rate < 1 && rate >= 0.5) || (isSafari && rate < 0.5)) {
            $mediumSpeed.show();
            $fastSpeed.hide();
            $slowSpeed.hide();
          } else {
            $slowSpeed.show();
            $mediumSpeed.hide();
            $fastSpeed.hide();
          }
        }
      });

      // Since the call to set the playback rate when first creating the timelapse
      // happens before the UI is setup, we need to run it again below to properly
      // update the UI.
      var playbackRate = timelapse.getPlaybackRate();
      if (playbackRate >= 1) {
        $fastSpeed.show();
      } else if (playbackRate < 1 && playbackRate >= 0.5) {
        $mediumSpeed.show();
      } else {
        $slowSpeed.show();
      }
    };

    // Change the UI according to different modes
    var setMode = function(newMode) {
      var snaplapse = timelapse.getSnaplapse();
      var smallGoogleMap = timelapse.getSmallGoogleMap();
      var enableSmallGoogleMap = timelapse.isSmallGoogleMapEnable();
      var annotator = timelapse.getAnnotator();
      var panoVideo, snaplapseViewer;
      if (visualizer)
        panoVideo = visualizer.getPanoVideo();
      if (snaplapse)
        snaplapseViewer = timelapse.getSnaplapse().getSnaplapseViewer();

      if (newMode == "player") {
        mode = "player";
        $("#" + timeMachineDivId + " .composer").hide();
        $("#" + timeMachineDivId + " .annotator").hide();
        if (snaplapseViewer)
          snaplapseViewer.hideAnnotationBubble();
        if (panoVideo)
          panoVideo.pause();
        if (annotator)
          annotator.resetToolbar();
      } else if (newMode == "editor") {
        mode = "editor";
        $("#" + timeMachineDivId + " .composer").show();
        $("#" + timeMachineDivId + " .annotator").hide();
        timelapse.seek_panoVideo(videoset.getCurrentTime());
        if (!videoset.isPaused() && panoVideo)
          panoVideo.play();
        timelapse.updateLocationContextUI();
      } else if (newMode == "annotator") {
        mode = "annotator";
        $("#" + timeMachineDivId + " .annotator").show();
        $("#" + timeMachineDivId + " .composer").hide();
      }
      if (visualizer)
        visualizer.setMode(mode, false);
    };
    this.setMode = setMode;

    var shareView = function() {
      var $shareUrl = $("#" + viewerDivId + " .shareurl");
      var parentUrl = UTIL.getParentURL();
      $shareUrl.val(parentUrl + timelapse.getShareView()).focus(function() {
        $(this).select();
      }).click(function() {
        $(this).select();
      }).mouseup(function(e) {
        e.preventDefault();
      });
    };

    var doHelpOverlay = function() {
      $("#" + viewerDivId + " .instructions").fadeIn(200);

      if ($playbackButton.hasClass('pause')) {
        timelapse.handlePlayPause();
        $playbackButton.removeClass("pause").addClass("play from_help");
      }
    };

    var removeHelpOverlay = function() {
      $("#" + viewerDivId + " .instructions").fadeOut(200);

      if ($playbackButton.hasClass('from_help')) {
        timelapse.handlePlayPause();
        $playbackButton.addClass("pause").removeClass("play from_help");
      }
    };

    var zoomIn = function() {
      var val = Math.min($("#" + viewerDivId + " .zoomSlider").slider("value") + ( useTouchFriendlyUI ? 0.003 : 0.01), 1);
      timelapse.setScaleFromSlider(val);
    };

    var zoomOut = function() {
      var val = Math.max($("#" + viewerDivId + " .zoomSlider").slider("value") - ( useTouchFriendlyUI ? 0.003 : 0.01), 0);
      timelapse.setScaleFromSlider(val);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.getMode = function() {
      return mode;
    };

    this.isShowMainControls = function() {
      return showMainControls;
    };

    var _toggleMainControls = function() {
      showMainControls = !showMainControls;
      $("#" + viewerDivId + " .controls").toggle();
      $("#" + viewerDivId + " .timelineSliderFiller").toggle();
    };
    this.toggleMainControls = _toggleMainControls;

    var _toggleZoomControls = function() {
      showZoomControls = !showZoomControls;
      $("#" + viewerDivId + " .zoom").toggle();
    };
    this.toggleZoomControls = _toggleZoomControls;

    var _togglePanControls = function() {
      showPanControls = !showPanControls;
      $("#" + viewerDivId + " .pan").toggle();
    };
    this.togglePanControls = _togglePanControls;

    var createTimelineSelector = function() {
      var numFrames = timelapse.getNumFrames();

      // Remove all previously added events
      $timelineSelector.unbind("mousedown");

      $timelineSelector.slider({
        range: true,
        min: 0,
        max: numFrames - 1, // this way the time scrubber goes exactly to the end of timeline
        step: 1,
        values: [0, timelineSelectorDefaultRangeOffset],
        slide: function(e, ui) {
          // $(this).slider('value')  --> previous value
          // ui.value                 --> current value
          // If we are manually using the slider and we are pulling it back to the start
          // we wont actually get to time 0 because of how we are snapping.
          // Manually seek to position 0 when this happens.
          if (($(this).slider('value') > ui.value) && ui.value == 0)
            timelapse.seek(0);
          else
            timelapse.seek(sliderValueToTime(ui.value));
        }
      }).removeClass("ui-corner-all").children().removeClass("ui-corner-all");
      var $sliderHandles = $("#" + viewerDivId + " .timelineSelector .ui-slider-handle");
      $($sliderHandles.get(0)).attr("title", "Drag to set the starting time");
      $($sliderHandles.get(1)).attr("title", "Drag to set the ending time");
    };

    var createTimelineSlider = function() {
      var numFrames = timelapse.getNumFrames();
      var captureTimes = timelapse.getCaptureTimes();

      $("#" + viewerDivId + " .currentTime").html(UTIL.formatTime(timelapse.getTimelapseCurrentTimeInSeconds(), true));
      $("#" + viewerDivId + " .totalTime").html(UTIL.formatTime(timelapse.getDuration(), true));
      $("#" + viewerDivId + " .currentCaptureTime").html(UTIL.htmlForTextWithEmbeddedNewlines(captureTimes[timelapse.getTimelapseCurrentCaptureTimeIndex()]));

      // Remove all previously added events
      $timelineSlider.unbind("mousedown");

      $timelineSlider.slider({
        min: 0,
        max: numFrames - 1, // this way the time scrubber goes exactly to the end of timeline
        range: "min",
        step: 1,
        slide: function(e, ui) {
          // $(this).slider('value')  --> previous value
          // ui.value                 --> current value
          // If we are manually using the slider and we are pulling it back to the start
          // we wont actually get to time 0 because of how we are snapping.
          // Manually seek to position 0 when this happens.
          if (($(this).slider('value') > ui.value) && ui.value == 0)
            timelapse.seek(0);
          else
            timelapse.seek(sliderValueToTime(ui.value));
        }
      }).removeClass("ui-corner-all").children().removeClass("ui-corner-all");
      $("#" + viewerDivId + " .timelineSlider .ui-slider-handle").attr("title", "Drag to go to a different point in time");

      $timelineSlider.bind("mousedown", function() {
        originalIsPaused = timelapse.isPaused();
        if (!originalIsPaused)
          timelapse.handlePlayPause();
        if (window && (window.self !== window.top)) {
          $("body").one("mouseleave", function(event) {
            $timelineSlider.trigger("mouseup");
          });
        }
        // Make sure we release mousedown upon exiting our viewport if we are inside an iframe
        $("body").one("mouseleave", function(event) {
          if (window && (window.self !== window.top)) {
            if (!originalIsPaused)
              timelapse.handlePlayPause();
          }
        });
        // Release mousedown upon mouseup
        $(document).one("mouseup", function(event) {
          if (!originalIsPaused)
            timelapse.handlePlayPause();
        });
        UTIL.addGoogleAnalyticEvent('slider', 'click', 'viewer-seek');
      });
    };
    this.createTimelineSlider = createTimelineSlider;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    createSideToolBar();

    if (!useCustomUI) {
      createMainUI();
      if (timelapse.getPlayOnLoad())
        timelapse.play();
    } else {// custom UI is being used, alter main UI accordingly
      // Create share button
      if (showShareBtn) {
        createShareButton();
        var shareButton = $("#" + viewerDivId + " .share");
        $("#" + viewerDivId + " .controls").children().not(shareButton).remove();
        shareButton.css("bottom", "110px");
      } else {
        $("#" + viewerDivId + " .controls").remove();
        $("#" + viewerDivId + " .shareView").remove();
      }
      $("#" + viewerDivId + " .captureTime").remove();
    }
  };
  //end of org.gigapan.timelapse.DefaultUI
})();
//end of (function() {
