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
  org.gigapan.timelapse.DefaultUI = function(timelapse, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //
    var mode = "player";
    var viewerDivId = timelapse.getViewerDivId();
    var videoDivId = timelapse.getVideoDivId();
    var tmJSON = timelapse.getTmJSON();
    var panInterval;
    var translationSpeedConstant = 20;
    var $playbackButton = $("#" + viewerDivId + " .playbackButton");

    var visualizer = timelapse.getVisualizer();
    var annotator = timelapse.getAnnotator();
    var videoset = timelapse.getVideoset();

    var showShareBtn = ( typeof (settings["showShareBtn"]) == "undefined") ? true : settings["showShareBtn"];
    var showHomeBtn = ( typeof (settings["showHomeBtn"]) == "undefined") ? true : settings["showHomeBtn"];
    var showMainControls = ( typeof (settings["showMainControls"]) == "undefined") ? true : settings["showMainControls"];
    var showZoomControls = ( typeof (settings["showZoomControls"]) == "undefined") ? true : settings["showZoomControls"];
    var showPanControls = ( typeof (settings["showPanControls"]) == "undefined") ? true : settings["showPanControls"];
    var showFullScreenBtn = ( typeof (settings["showFullScreenBtn"]) == "undefined") ? true : settings["showFullScreenBtn"];

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    //create the toolbar
    var createToolbar = function() {
      createPlayerModeToolbar();
      createSideToolBar();
      // Play button
      $playbackButton.button({
        icons: {
          secondary: "ui-icon-custom-play"
        },
        text: false
      }).on("click", function() {
        if ($(this).hasClass("from_help")) return;
        timelapse.handlePlayPause();
      });
      // Stop button
      $("#" + viewerDivId + " .stopTimeWarp").button({
        icons: {
          secondary: "ui-icon-custom-stop"
        },
        text: false
      });
      // Create fullscreen button
      if (showFullScreenBtn) {
        var $fullScreenBtnContainer = $("#" + viewerDivId + " .fullScreenBtnContainer");
        $fullScreenBtnContainer.append('<input type="checkbox" class="fullscreenCheckbox"/>');
        $fullScreenBtnContainer.append('<label class="fullscreenLabel" title="Toggle fullscreen"></label>');
        var $fullscreenCheckbox = $("#" + viewerDivId + " .fullscreenCheckbox");
        $fullscreenCheckbox.attr("id", viewerDivId + "_fullscreenCheckbox");
        $("#" + viewerDivId + " .fullscreenLabel").attr("for", viewerDivId + "_fullscreenCheckbox");
        $fullscreenCheckbox.button({
          icons: {
            primary: "ui-icon-arrow-4-diag"
          },
          text: false
        }).change(function() {
          if ($fullscreenCheckbox.is(":checked")) {
            timelapse.fullScreen(true);
          } else {
            timelapse.fullScreen(false);
          }
        });
      }
      // Create loop button
      var $repeatBtnContainer = $("#" + viewerDivId + " .repeatBtnContainer");
      $repeatBtnContainer.append('<input type="checkbox" class="repeatCheckbox"/>');
      $repeatBtnContainer.append('<label class="repeatLabel" title="Repeat playback">Repeat</label>');
      var $repeatCheckbox = $("#" + viewerDivId + " .repeatCheckbox");
      $repeatCheckbox.attr("id", viewerDivId + "_repeatCheckbox");
      $("#" + viewerDivId + " .repeatLabel").attr("for", viewerDivId + "_repeatCheckbox");
      $repeatCheckbox.button({
        icons: {
          primary: "ui-icon-custom-repeat"
        },
        text: false
      }).change(function() {
        if ($repeatCheckbox.is(":checked")) {
          timelapse.setLoopPlayback(true);
        } else {
          timelapse.setLoopPlayback(false);
        }
      });
      // Create mode switch button
      if (settings["composerDiv"] || settings["annotatorDiv"]) {
        createModeSwitchButton();
        if (settings["composerDiv"]) {
          createEditorModeToolbar();
        }
        if (settings["annotatorDiv"]) {
          createAnnotatorModeToolbar();
        }
      }

      if (!showFullScreenBtn && !$("#" + viewerDivId + ".viewerModeBtnContainer").is(":visible")) {
        $("#" + viewerDivId + " .instructions span.speedhelp p").css("background-position", "bottom center");
      }

      // Layers for a dataset
      if (tmJSON["layers"]) {
        $("#" + viewerDivId + " .layerSlider").show();
        populateLayers();

        $("#" + viewerDivId + " .layerSlider .jCarouselLite").jCarouselLite({
          btnNext: "#" + viewerDivId + " .layerSlider .next",
          btnPrev: "#" + viewerDivId + " .layerSlider .prev",
          circular: true,
          visible: 3.5
        });
      }
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
          timelapse.setTargetView(undefined, undefined, offset);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
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
          timelapse.setTargetView(undefined, undefined, offset);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
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
          timelapse.setTargetView(undefined, undefined, offset);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
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
          timelapse.setTargetView(undefined, undefined, offset);
        }, 50);
        $(document).one("mouseup", function() {
          clearInterval(panInterval);
        });
      });
    };

    var createZoomControl = function() {
      var intervalId;
      var $zoom = $("#" + viewerDivId + " .zoom");
      // Create zoom in button
      $zoom.append('<button class="zoomin" title="Zoom in"></button>');
      $("#" + viewerDivId + " .zoomin").button({
        icons: {
          primary: "ui-icon-plus"
        },
        text: false
      }).mousedown(function() {
        intervalId = setInterval(function() {
          zoomIn();
        }, 50);
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
          primary: "ui-icon-minus"
        },
        text: false
      }).mousedown(function() {
        intervalId = setInterval(function() {
          zoomOut();
        }, 50);
      }).click(function() {
        zoomOut();
      }).mouseup(function() {
        clearInterval(intervalId);
      }).mouseout(function() {
        clearInterval(intervalId);
      });
      // Create zoom all button
      $zoom.append('<button class="zoomall" title="Home"></button>');
      $("#" + viewerDivId + " .zoomall").button({
        icons: {
          primary: "ui-icon-home"
        },
        text: false
      }).click(function() {
        timelapse.warpTo(timelapse.homeView());
      });
    };

    var createSideToolBar = function() {
      createPanControl();
      createZoomControl();
      var $tools = $("#" + viewerDivId + " .tools");
      // Create hide annotation button
      if (settings["annotatorDiv"]) {
        $tools.append('<input type="checkbox" class="hideAnnotationCheckbox"/>');
        $tools.append('<label class="hideAnnotationLabel" title="Toggle hiding annotations">Hide</label>');
        var hideAnnotationCheckbox = $("#" + viewerDivId + " .hideAnnotationCheckbox");
        hideAnnotationCheckbox.attr("id", viewerDivId + "_hideAnnotationCheckbox");
        $("#" + viewerDivId + " .hideAnnotationLabel").attr("for", viewerDivId + "_hideAnnotationCheckbox");
        hideAnnotationCheckbox.button({
          icons: {
            primary: "ui-icon-tag"
          },
          text: false
        }).change(function() {
          if (hideAnnotationCheckbox.is(":checked")) {
            annotator.getAnnotationLayer().hide();
          } else {
            annotator.getAnnotationLayer().show();
            annotator.getAnnotationLayer().draw();
          }
        });
      }
    };

    // Create the player mode toolbar
    var createPlayerModeToolbar = function() {
      var playerModeToolbar = $("#" + viewerDivId + " .playerModeToolbar");
      // Create share button
      if (showShareBtn) {
        playerModeToolbar.append('<button class="share" title="Share current view">Share</button>');
        $("#" + viewerDivId + " .share").button({
          icons: {
            primary: "ui-icon-person"
          },
          text: true
        }).click(function() {
          shareView();
        });
      }
      // Share view window
      $("#" + viewerDivId + " .shareView").dialog({
        resizable: false,
        autoOpen: false,
        width: 632,
        height: 95,
        create: function() {
          $(this).parents("#" + viewerDivId + " .ui-dialog").css({
            'border': '1px solid #000'
          });
        }
      }).parent().appendTo($("#" + viewerDivId));
      // Create playbackSpeed menu and button
      createPlaybackSpeedMenu();
      playerModeToolbar.append('<button class="playbackSpeed" title="Change playback speed"></button>');
      var $playbackSpeed = $("#" + viewerDivId + " .playbackSpeed");
      var $playbackSpeedOptions = $("#" + viewerDivId + " .playbackSpeedOptions");
      $playbackSpeed.button({
        icons: {
          secondary: "ui-icon-triangle-1-s"
        },
        text: true
      }).click(function() {
        if ($playbackSpeedOptions.is(":visible")) {
          $playbackSpeedOptions.hide();
        } else {
          $playbackSpeedOptions.show().position({
            my: "left bottom",
            at: "left top",
            of: this
          });
          $("#" + viewerDivId + " .sizeOptions").hide();
          $("#" + viewerDivId + " .viewerModeOptions").hide();
          $(document).one("mouseup", function(e) {
            if ($playbackSpeed.has(e.target).length == 0)
              $playbackSpeedOptions.hide();
          });
        }
      });
      //$("#" + viewerDivId + " .playbackSpeed span").text("");
      // Create size menu and button
      if (settings["showSizeBtn"] == true) {
        populateSizes();
        playerModeToolbar.append('<button class="size" title="Change viewer size">Size</button>');
        var $size = $("#" + viewerDivId + " .size");
        var $sizeOptions = $("#" + viewerDivId + " .sizeOptions");
        $size.button({
          icons: {
            secondary: "ui-icon-triangle-1-s"
          },
          text: true
        }).click(function() {
          if ($sizeOptions.is(":visible")) {
            $sizeOptions.hide();
          } else {
            $sizeOptions.show().position({
              my: "left bottom",
              at: "left top",
              of: this
            });
            $playbackSpeedOptions.hide();
            $("#" + viewerDivId + " .viewerModeOptions").hide();
            $(document).one("mouseup", function(e) {
              if ($size.has(e.target).length == 0)
                $sizeOptions.hide();
            });
          }
        });
        $sizeOptions.hide().menu();
      }
      // Create help button
      playerModeToolbar.append('<input type="checkbox" class="helpPlayerCheckbox"/>');
      playerModeToolbar.append('<label class="helpPlayerLabel" title="Show instructions"></label>');
      var helpPlayerCheckbox = $("#" + viewerDivId + " .helpPlayerCheckbox");
      helpPlayerCheckbox.attr("id", viewerDivId + "_helpPlayerCheckbox");
      var $helpPlayerLabel = $("#" + viewerDivId + " .helpPlayerLabel");
      $helpPlayerLabel.attr("for", viewerDivId + "_helpPlayerCheckbox");
      helpPlayerCheckbox.button({
        icons: {
          primary: "ui-icon-help"
        },
        text: false
      }).change(function() {
        if (helpPlayerCheckbox.is(":checked")) {
          doHelpOverlay();
          $(document).one("mouseup", function(e) {
            if ($helpPlayerLabel.has(e.target).length == 0)
              helpPlayerCheckbox.prop("checked", false).button("refresh").change();
          });
        } else {
          removeHelpOverlay();
        }
      });
      // Create buttonset
      playerModeToolbar.buttonset();
    };

    // Create the editor mode toolbar
    var createEditorModeToolbar = function() {
      var editorModeToolbar = $("#" + viewerDivId + " .editorModeToolbar");
      // Create play button
      editorModeToolbar.append('<button class="playStopTimewarp" title="Play or stop a tour">Play</button>');
      $("#" + viewerDivId + " .playStopTimewarp").button({
        icons: {
          primary: "ui-icon-play"
        },
        text: true,
        disabled: true
      }).click(function() {
        timelapse.getSnaplapse().getSnaplapseViewer().playStopSnaplapse();
      });
      // Create add button
      editorModeToolbar.append('<button class="addTimetag" title="Add a keyframe">Add</button>');
      $("#" + viewerDivId + " .addTimetag").button({
        icons: {
          primary: "ui-icon-plus"
        },
        text: true,
        disabled: true
      }).click(function() {
        // The button will be enabled at the end of addSnaplapseKeyframeListItem() in snaplapseViewer
        $("#" + viewerDivId + " .addTimetag").button("option", "disabled", true);
        timelapse.getSnaplapse().getSnaplapseViewer().recordKeyframe();
      });
      // Create delete button
      editorModeToolbar.append('<button class="deleteTimetag" title="Delete a keyframe">Del</button>');
      $("#" + viewerDivId + " .deleteTimetag").button({
        icons: {
          primary: "ui-icon-minus"
        },
        text: true,
        disabled: true
      }).click(function() {
        timelapse.getSnaplapse().getSnaplapseViewer().deleteSelectedKeyframes();
      });
      // Create save button
      editorModeToolbar.append('<button class="saveTimewarp" title="Share a tour">Share</button>');
      $("#" + viewerDivId + " .saveTimewarp").button({
        icons: {
          primary: "ui-icon-person"
        },
        text: true,
        disabled: true
      }).click(function() {
        timelapse.getSnaplapse().getSnaplapseViewer().saveSnaplapse();
      });
      // Create load button
      editorModeToolbar.append('<button class="loadTimewarp" title="Load a tour">Load</button>');
      $("#" + viewerDivId + " .loadTimewarp").button({
        icons: {
          primary: "ui-icon-folder-open"
        },
        text: true
      }).click(function() {
        timelapse.getSnaplapse().getSnaplapseViewer().showLoadSnaplapseWindow();
      });
      // Create new button
      editorModeToolbar.append('<button class="newTimewarp" title="Remove all keyframes">Clear</button>');
      $("#" + viewerDivId + " .newTimewarp").button({
        icons: {
          primary: "ui-icon-trash"
        },
        text: true
      }).click(function() {
        var confirmClearAlert = confirm("Are you sure you want to clear the timewarp?");
        if (!confirmClearAlert)
          return;
        timelapse.getSnaplapse().getSnaplapseViewer().loadNewSnaplapse(null);
        handleEditorModeToolbarChange();
      });
      // Create global setting button
      //editorModeToolbar.append('<button class="setTimewarp" title="Global settings">Set</button>');
      //$("#" + viewerDivId + " .setTimewarp").button({
      //  icons: {
      //    primary: "ui-icon-wrench"
      //  },
      //  text: false
      //}).click(function() {
      //  timelapse.getSnaplapse().getSnaplapseViewer().showSetSnaplapseWindow();
      //});
      // Create buttonset
      //editorModeToolbar.buttonset();
    };

    // Hide the area for editing the timewarp
    var hideEditorArea = function() {
      $("#" + settings["composerDiv"]).hide();

      if (visualizer) {
        $("#" + viewerDivId + " .timeSliderColorBot_div_playerMode").show();
        $("#" + viewerDivId + " .timeSliderColorSelectorBot_canvas_editorMode").css("visibility", "hidden");
      }
    };

    // Show the area for editing the timewarp
    var showEditorArea = function() {
      $("#" + settings["composerDiv"]).show();

      if (visualizer) {
        $("#" + viewerDivId + " .timeSliderColorSelectorBot_canvas_editorMode").css("visibility", "visible");
        $("#" + viewerDivId + " .timeSliderColorBot_div_playerMode").hide();
      }
    };

    // Create the annotator toolbar
    var createAnnotatorModeToolbar = function() {
      var $annotatorModeToolbar = $("#" + viewerDivId + " .annotatorModeToolbar");
      // Create add button
      $annotatorModeToolbar.append('<input type="checkbox" class="addAnnotationCheckbox"/>');
      $annotatorModeToolbar.append('<label class="addAnnotationLabel" title="Enable/Disable adding annotations (CTRL key or COMMAND key)">Add</label>');
      var $addAnnotationCheckbox = $("#" + viewerDivId + " .addAnnotationCheckbox");
      $addAnnotationCheckbox.attr("id", viewerDivId + "_addAnnotationCheckbox");
      $("#" + viewerDivId + " .addAnnotationLabel").attr("for", viewerDivId + "_addAnnotationCheckbox");
      $addAnnotationCheckbox.button({
        icons: {
          primary: "ui-icon-plus"
        },
        text: true
      }).change(function() {
        var $hideAnnotationCheckbox = $("#" + viewerDivId + " .hideAnnotationCheckbox");
        if ($hideAnnotationCheckbox.is(":checked")) {
          $hideAnnotationCheckbox.prop("checked", false).button("refresh").change();
        }
        if ($addAnnotationCheckbox.is(":checked")) {
          annotator.setCanAddAnnotation(true);
          if (!$("#" + viewerDivId + " .moveAnnotationCheckbox").is(":checked"))
            $hideAnnotationCheckbox.button("option", "disabled", true);
        } else {
          annotator.setCanAddAnnotation(false);
          if (!$("#" + viewerDivId + " .moveAnnotationCheckbox").is(":checked"))
            $hideAnnotationCheckbox.button("option", "disabled", false);
        }
      });
      // Create move button
      $annotatorModeToolbar.append('<input type="checkbox" class="moveAnnotationCheckbox"/>');
      $annotatorModeToolbar.append('<label class="moveAnnotationLabel" title="Enable/Disable moving annotations (ALT key)">Move</label>');
      var $moveAnnotationCheckbox = $("#" + viewerDivId + " .moveAnnotationCheckbox");
      $moveAnnotationCheckbox.attr("id", viewerDivId + "_moveAnnotationCheckbox");
      $("#" + viewerDivId + " .moveAnnotationLabel").attr("for", viewerDivId + "_moveAnnotationCheckbox");
      $moveAnnotationCheckbox.button({
        icons: {
          primary: "ui-icon-arrow-4"
        },
        text: true,
        disabled: true
      }).change(function() {
        var $hideAnnotationCheckbox = $("#" + viewerDivId + " .hideAnnotationCheckbox");
        var $addAnnotationCheckbox = $("#" + viewerDivId + " .addAnnotationCheckbox");
        if ($hideAnnotationCheckbox.is(":checked")) {
          $hideAnnotationCheckbox.prop("checked", false).button("refresh").change();
        }
        if ($moveAnnotationCheckbox.is(":checked")) {
          annotator.setCanMoveAnnotation(true);
          if (!$addAnnotationCheckbox.is(":checked"))
            $hideAnnotationCheckbox.button("option", "disabled", true);
        } else {
          annotator.setCanMoveAnnotation(false);
          if (!$addAnnotationCheckbox.is(":checked"))
            $hideAnnotationCheckbox.button("option", "disabled", false);
        }
      });
      // Create delete button
      $annotatorModeToolbar.append('<button class="deleteAnnotation" title="Delete an annotation">Del</button>');
      $("#" + viewerDivId + " .deleteAnnotation").button({
        icons: {
          primary: "ui-icon-minus"
        },
        text: true,
        disabled: true
      }).click(function() {
        annotator.deleteSelectedAnnotations();
        handleAnnotatorModeToolbarChange();
      });
      // Create save button
      $annotatorModeToolbar.append('<button class="saveAnnotation" title="Save annotations">Save</button>');
      $("#" + viewerDivId + " .saveAnnotation").button({
        icons: {
          primary: "ui-icon-folder-collapsed"
        },
        text: true,
        disabled: true
      }).click(function() {
        annotator.showSaveAnnotatorWindow();
      });
      // Create load button
      $annotatorModeToolbar.append('<button class="loadAnnotation" title="Load annotations">Load</button>');
      $("#" + viewerDivId + " .loadAnnotation").button({
        icons: {
          primary: "ui-icon-folder-open"
        },
        text: true
      }).click(function() {
        annotator.showLoadAnnotatorWindow();
      });
      // Create clear button
      $annotatorModeToolbar.append('<button class="clearAnnotation" title="Clear all annotations">Clear</button>');
      $("#" + viewerDivId + " .clearAnnotation").button({
        icons: {
          primary: "ui-icon-trash"
        },
        text: true,
        disabled: true
      }).click(function() {
        var confirmClearAlert = confirm("Are you sure you want to clear all annotations?");
        if (!confirmClearAlert)
          return;
        annotator.clearAnnotations();
      });
      // Create buttonset
      $annotatorModeToolbar.buttonset();
    };

    // Hide the area for annotation
    var hideAnnotatorArea = function() {
      if (annotator != undefined) {
        $("#" + settings["annotatorDiv"]).hide();
      }
    };

    // Show the area for annotation
    var showAnnotatorArea = function() {
      if (annotator != undefined) {
        $("#" + settings["annotatorDiv"]).show();
      }
    };

    // Change the UI according to different modes
    var setMode = function(newMode) {
      var snaplapse = timelapse.getSnaplapse();
      var fullScreen = timelapse.isFullScreen();
      var smallGoogleMap = timelapse.getSmallGoogleMap();
      var enableSmallGoogleMap = timelapse.isSmallGoogleMapEnable();
      var panoVideo, snaplapseViewer;
      if (visualizer)
        panoVideo = visualizer.getPanoVideo();
      if (snaplapse)
        snaplapseViewer = timelapse.getSnaplapse().getSnaplapseViewer();

      if (newMode == "player") {
        mode = newMode;
        $("#" + viewerDivId + " .annotatorModeToolbar").hide();
        $("#" + viewerDivId + " .editorModeToolbar").hide();
        $("#" + viewerDivId + " .playerModeToolbar").show();
        $("#" + viewerDivId + " .fullscreenCheckbox").prop("checked", fullScreen).button("refresh");
        $("#" + viewerDivId + " .moveAnnotationCheckbox").prop("checked", false).button("refresh").change();
        if (!fullScreen) {
          hideAnnotatorArea();
          hideEditorArea();
        }
        if (snaplapse) {
          snaplapseViewer.hideAnnotationBubble();
        }
        if (smallGoogleMap && enableSmallGoogleMap == true) {
          smallGoogleMap.drawSmallMapBoxColor({
            r: 219,
            g: 48,
            b: 48
          });
        }
        if (mode == "player" && panoVideo != undefined) {
          panoVideo.pause();
        }
      } else if (newMode == "editor") {
        mode = newMode;
        $("#" + viewerDivId + " .playerModeToolbar").hide();
        $("#" + viewerDivId + " .annotatorModeToolbar").hide();
        $("#" + viewerDivId + " .editorModeToolbar").show();
        $("#" + viewerDivId + " .fullscreenCheckbox").prop("checked", fullScreen).button("refresh");
        $("#" + viewerDivId + " .moveAnnotationCheckbox").prop("checked", false).button("refresh").change();
        if (!fullScreen) {
          hideAnnotatorArea();
          showEditorArea();
          enableEditorToolbarButtons();
          handleEditorModeToolbarChange();
          timelapse.seek_panoVideo(videoset.getCurrentTime());
          if (!videoset.isPaused() && panoVideo) {
            panoVideo.play();
          }
        } else {
          disableEditorToolbarButtons();
        }
        timelapse.updateTagInfo_timeData();
        timelapse.updateTagInfo_locationData();
      } else if (newMode == "annotator") {
        mode = newMode;
        $("#" + viewerDivId + " .playerModeToolbar").hide();
        $("#" + viewerDivId + " .editorModeToolbar").hide();
        $("#" + viewerDivId + " .annotatorModeToolbar").show();
        $("#" + viewerDivId + " .fullscreenCheckbox").prop("checked", fullScreen).button("refresh");
        if (!fullScreen) {
          hideEditorArea();
          showAnnotatorArea();
          timelapse.seek_panoVideo(videoset.getCurrentTime());
          if (!videoset.isPaused() && panoVideo) {
            panoVideo.play();
          }
        }
        if (snaplapse) {
          snaplapseViewer.hideAnnotationBubble();
        }
        timelapse.updateTagInfo_timeData();
        timelapse.updateTagInfo_locationData();
      }
      if (visualizer)
        visualizer.setMode(mode, fullScreen);
    };

    // Create the mode switching button
    var createModeSwitchButton = function() {
      // Populate the dropdown
      var html = "";
      if (settings["annotatorDiv"]) {
        html += '<li><a href="javascript:void(0);">Annotator</a></li>';
      }
      if (settings["composerDiv"]) {
        html += '<li><a href="javascript:void(0);">Editor</a></li>';
      }
      html += '<li><a href="javascript:void(0);">Player</a></li>';
      $("#" + viewerDivId + " .viewerModeOptions").append(html);

      // Create menu and button
      var viewerModeBtnContainer = $("#" + viewerDivId + " .viewerModeBtnContainer");
      viewerModeBtnContainer.append('<button class="viewerModeBtn" title="Change viewer mode">Player</button>');
      var $viewerModeBtn = $("#" + viewerDivId + " .viewerModeBtn");
      var $viewerModeOptions = $("#" + viewerDivId + " .viewerModeOptions");
      $viewerModeBtn.attr("id", viewerDivId + "_viewerModeBtn");
      $viewerModeBtn.button({
        icons: {
          primary: "ui-icon-gear"
        },
        text: true
      }).click(function() {
        if ($viewerModeOptions.is(":visible")) {
          $viewerModeOptions.hide();
        } else {
          $viewerModeOptions.show().position({
            my: "right bottom",
            at: "right top",
            of: this
          });
          $("#" + viewerDivId + " .playbackSpeedOptions").hide();
          $("#" + viewerDivId + " .sizeOptions").hide();
        }
        $(document).one("mouseup", function(e) {
          if ($viewerModeBtn.has(e.target).length == 0)
            $viewerModeOptions.hide();
        });
      });
      $("#" + viewerDivId + " .viewerModeOptions").hide().menu();

      // Set the dropdown
      $("#" + viewerDivId + " .viewerModeOptions li a").bind("click", function() {
        var newMode = $(this).text();
        $viewerModeBtn.button("option", "label", newMode);
        if (newMode == "Editor") {
          setMode("editor");
        } else if (newMode == "Player") {
          setMode("player");
        } else if (newMode == "Annotator") {
          setMode("annotator");
        }
      });
    };

    var shareView = function() {
      var $shareUrl = $("#" + viewerDivId + " .shareurl");
      $shareUrl.val(
        window.location.href.split("#")[0] + timelapse.getShareView()
      ).focus(function() {
        $(this).select();
      }).click(function() {
        $(this).select();
      }).mouseup(function(e) {
        e.preventDefault();
      });
      $("#" + viewerDivId + " .shareView").dialog("open");
    };

    function createPlaybackSpeedMenu() {
      // Populate playback speed dropdown (the function is in timelapseViewer.js)
      populateSpeedPlaybackChoices();

      var $playbackSpeedOptionsSelection = $("#" + viewerDivId + " .playbackSpeedOptions li a");
      $playbackSpeedOptionsSelection.bind("click", function() {
        timelapse.changePlaybackRate(this);
      });
      $("#" + viewerDivId + " .playbackSpeedOptions").hide().menu();

      timelapse.addPlaybackRateChangeListener(function(rate, fromUI) {
        var speedChoice;
        // Set the playback speed dropdown
        var $playbackSpeedOptionsSelection = $("#" + viewerDivId + " .playbackSpeedOptions li a");
        $playbackSpeedOptionsSelection.each(function() {
          speedChoice = $(this);
          if (speedChoice.attr("data-speed") == rate) {
            return false;
          }
        });
        $("#" + viewerDivId + " .playbackSpeed span").text(speedChoice.text());
      });
    }

    function populateSpeedPlaybackChoices() {
      var choices = [];

      // Only show backward playback options for non-split video datasets
      // Backward playback - emulated since Chrome/Safari doesn't properly handle it
      if ( typeof (timelapse.getDatasetJSON()["frames_per_fragment"]) == "undefined") {
        choices.push({
          "name": "Backward, Full Speed",
          "value": -1.0
        }, {
          "name": "Backward, &#189; Speed",
          "value": -0.5
        }, {
          "name": "Backward, &#188; Speed",
          "value": -0.25
        });
      }

      // Forward playback - 1/4 speed is emulated on Safari but we still give the option
      choices.push({
        "name": "Forward, &#188; Speed",
        "value": 0.25
      }, {
        "name": "Forward, &#189; Speed",
        "value": 0.5
      }, {
        "name": "Forward, Full Speed",
        "value": 1.0
      });
      var html = "";
      var numChoices = choices.length;
      for (var i = 0; i < numChoices; i++) {
        html += '<li><a href="javascript:void(0);" data-speed=\'' + choices[i]["value"] + '\'>' + choices[i]["name"] + '</a></li>';
      }
      $("#" + viewerDivId + " .playbackSpeedOptions").append(html);
    }

    function doHelpOverlay() {
      $("#" + viewerDivId + " .instructions").fadeIn(200);

      if ($playbackButton.hasClass('pause')) {
        timelapse.handlePlayPause();
        $playbackButton.removeClass("pause").addClass("play from_help");
      }
    }

    function removeHelpOverlay() {
      $("#" + viewerDivId + " .instructions").fadeOut(200);

      if ($playbackButton.hasClass('from_help')) {
        timelapse.handlePlayPause();
        $playbackButton.addClass("pause").removeClass("play from_help");
      }
    }

    function populateSizes() {
      // Populate the player size dropdown
      var html = "";
      var numSizes = tmJSON["sizes"].length;
      for (var i = 0; i < numSizes; i++) {
        html += '<li><a href="javascript:void(0);" data-index=\'' + i + '\'>' + tmJSON["sizes"][i] + '</a></li>';
      }
      $("#" + viewerDivId + " .sizeOptions").append(html);

      // Set the size dropdown
      $("#" + viewerDivId + " .sizeOptions li a").bind("click", function() {
        timelapse.switchSize($(this).attr("data-index"));
      });
    }

    function populateLayers() {
      var numLayers = tmJSON["layers"].length;
      var html = "";
      for (var i = 0; i < numLayers; i++) {
        html += "<li data-index=" + i + "><img src=\"" + tmJSON["layers"][i]["tn-path"] + "\" " + "alt='layer' width='45' height='45' ><br/><span style='font-size:small; text-align:center; display:block; margin: -5px 0px 0px 0px !important;'>" + tmJSON["layers"][i]["description"] + "</span></li>";
      }
      $("#" + viewerDivId + " .layerChoices").append(html);

      $("#" + viewerDivId + " .layerChoices li").bind("click", function() {
        timelapse.switchLayer($(this).attr("data-index"));
      });
    }

    function zoomIn() {
      var val = Math.min($("#" + viewerDivId + " .zoomSlider").slider("value") + 0.01, 1);
      timelapse.setScaleFromSlider(val);
    }

    function zoomOut() {
      var val = Math.max($("#" + viewerDivId + " .zoomSlider").slider("value") - 0.01, 0);
      timelapse.setScaleFromSlider(val);
    }

    function createZoomSlider($zoom) {
      $zoom.append('<div class="zoomSlider" title="Click to zoom"></div>');
      $("#" + viewerDivId + " .zoomSlider").slider({
        orientation: "vertical",
        value: timelapse.viewScaleToZoomSlider(timelapse.getDefaultScale()),
        min: 0,
        max: 1,
        step: 0.01,
        slide: function(e, ui) {
          timelapse.setScaleFromSlider(ui.value);
        }
      }).removeClass("ui-corner-all");

      $("#" + viewerDivId + " .zoomSlider .ui-slider-handle").attr("title", "Drag to zoom");
    }

    function createTimelineSlider() {
      var numFrames = timelapse.getNumFrames();
      var FPS = timelapse.getFps();
      var captureTimes = timelapse.getCaptureTimes();

      $("#" + viewerDivId + " .currentTime").html(org.gigapan.Util.formatTime(timelapse.getTimelapseCurrentTimeInSeconds(), true));
      $("#" + viewerDivId + " .totalTime").html(org.gigapan.Util.formatTime(timelapse.getDuration(), true));
      $("#" + viewerDivId + " .currentCaptureTime").html(org.gigapan.Util.htmlForTextWithEmbeddedNewlines(captureTimes[timelapse.getTimelapseCurrentCaptureTimeIndex()]));

      $("#" + viewerDivId + " .timelineSlider").slider({
        min: 0,
        max: numFrames - 1, // this way the time scrubber goes exactly to the end of timeline
        range: "max",
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
            timelapse.seek((ui.value + 0.3) / FPS);
        }
      }).removeClass("ui-corner-all").children().removeClass("ui-corner-all");
      $("#" + viewerDivId + " .timelineSlider .ui-slider-handle").attr("title", "Drag to go to a different point in time");
    }

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

    // Change the status of the editor toolbar
    var handleAnnotatorModeToolbarChange = function() {
      var $Annotationtems = $("#" + settings["annotatorDiv"] + " .annotation_list > .ui-selectee");
      var numItems = $Annotationtems.size();
      if (numItems > 0) {
        $("#" + viewerDivId + " .deleteAnnotation").button("option", "disabled", false);
        $("#" + viewerDivId + " .saveAnnotation").button("option", "disabled", false);
        $("#" + viewerDivId + " .clearAnnotation").button("option", "disabled", false);
        $("#" + viewerDivId + " .moveAnnotationCheckbox").button("option", "disabled", false);
      } else {
        $("#" + viewerDivId + " .deleteAnnotation").button("option", "disabled", true);
        $("#" + viewerDivId + " .saveAnnotation").button("option", "disabled", true);
        $("#" + viewerDivId + " .clearAnnotation").button("option", "disabled", true);
        $("#" + viewerDivId + " .moveAnnotationCheckbox").button("option", "disabled", true);
      }
    };
    this.handleAnnotatorModeToolbarChange = handleAnnotatorModeToolbarChange;

    // Change the status of the editor toolbar
    var handleEditorModeToolbarChange = function() {
      var $keyframeItems = $("#" + settings["composerDiv"] + " .snaplapse_keyframe_list > .ui-selectee");
      var numItems = $keyframeItems.size();
      if (numItems >= 1) {
        $("#" + viewerDivId + " .deleteTimetag").button("option", "disabled", false);
        $("#" + viewerDivId + " .saveTimewarp").button("option", "disabled", false);
        $("#" + viewerDivId + " .newTimewarp").button("option", "disabled", false);
      } else {
        $("#" + viewerDivId + " .deleteTimetag").button("option", "disabled", true);
        $("#" + viewerDivId + " .saveTimewarp").button("option", "disabled", true);
        $("#" + viewerDivId + " .newTimewarp").button("option", "disabled", true);
      }
      if (numItems >= 2) {
        $("#" + viewerDivId + " .playStopTimewarp").button("option", "disabled", false);
      } else {
        $("#" + viewerDivId + " .playStopTimewarp").button("option", "disabled", true);
      }
    };
    this.handleEditorModeToolbarChange = handleEditorModeToolbarChange;

    var handleFullScreenChange = function(fullScreen) {
      var panoVideo;
      if (visualizer)
        panoVideo = visualizer.getPanoVideo();
      if (fullScreen) {
        if (mode == "editor") {
          hideEditorArea();
          disableEditorToolbarButtons();
          if (panoVideo) {
            panoVideo.pause();
          }
          if (visualizer)
            $("#" + viewerDivId + " .timeSliderColorSelectorBot_canvas_editorMode").css("visibility", "hidden");
        } else if (mode == "annotator") {
          hideAnnotatorArea();
          if (panoVideo)
            panoVideo.pause();
        }
      } else {
        if (mode == "editor") {
          if (!timelapse.getSnaplapse().isPlaying()) {
            enableEditorToolbarButtons();
            handleEditorModeToolbarChange();
          }
          timelapse.seek_panoVideo(videoset.getCurrentTime());
          if (!videoset.isPaused() && panoVideo) {
            panoVideo.play();
          }
          showEditorArea();
          if (visualizer)
            $("#" + viewerDivId + " .timeSliderColorSelectorBot_canvas_editorMode").css("visibility", "visible");
        } else if (mode == "annotator") {
          showAnnotatorArea();
          timelapse.seek_panoVideo(videoset.getCurrentTime());
          if (!videoset.isPaused() && panoVideo)
            panoVideo.play();
        }
      }
      if (visualizer)
        visualizer.setMode(mode, fullScreen);
    };
    this.handleFullScreenChange = handleFullScreenChange;

    var _toggleMainControls = function() {
      showMainControls = !showMainControls;
      $("#" + viewerDivId + " .controls").toggle();
      $("#" + viewerDivId + " .timelineSliderFiller").toggle();
      $("#" + viewerDivId + " .timeSliderColorSelectorBot_canvas_editorMode").toggle();
      timelapse.fullScreen(timelapse.isFullScreen());
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

    // Disable buttons in editor full screen mode
    var disableEditorToolbarButtons = function() {
      $("#" + viewerDivId + " .addTimetag").button("option", "disabled", true);
      $("#" + viewerDivId + " .deleteTimetag").button("option", "disabled", true);
      $("#" + viewerDivId + " .saveTimewarp").button("option", "disabled", true);
      $("#" + viewerDivId + " .loadTimewarp").button("option", "disabled", true);
      $("#" + viewerDivId + " .newTimewarp").button("option", "disabled", true);
      $("#" + viewerDivId + " .setTimewarp").button("option", "disabled", true);
    };
    this.disableEditorToolbarButtons = disableEditorToolbarButtons;

    // Enable buttons from editor full screen mode
    var enableEditorToolbarButtons = function() {
      $("#" + viewerDivId + " .addTimetag").button("option", "disabled", false);
      $("#" + viewerDivId + " .deleteTimetag").button("option", "disabled", false);
      $("#" + viewerDivId + " .saveTimewarp").button("option", "disabled", false);
      $("#" + viewerDivId + " .loadTimewarp").button("option", "disabled", false);
      $("#" + viewerDivId + " .newTimewarp").button("option", "disabled", false);
      $("#" + viewerDivId + " .setTimewarp").button("option", "disabled", false);
    };
    this.enableEditorToolbarButtons = enableEditorToolbarButtons;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    createTimelineSlider();
    createToolbar();
    if (!showZoomControls) {
      $("#" + viewerDivId + " .zoom").hide();
    }
    if (!showPanControls) {
      $("#" + viewerDivId + " .pan").hide();
    }
    if (!showMainControls) {
      $("#" + viewerDivId + " .controls").hide();
      $("#" + viewerDivId + " .timelineSliderFiller").hide();
      $("#" + viewerDivId + " .timeSliderColorSelectorBot_canvas_editorMode").hide();
    }
    if (!showHomeBtn) {
      $("#" + viewerDivId + " .zoomall").hide();
    }
    if (timelapse.getLoopPlayback()) {
      $("#" + viewerDivId + " .repeatCheckbox").prop("checked", true).button("refresh").change();
    }
  };
  //end of org.gigapan.timelapse.DefaultUI
})();
//end of (function() {
