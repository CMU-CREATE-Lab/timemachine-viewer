/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Class for managing the snaplapse visualization
 *
 * Dependencies:
 *  org.gigapan.timelapse.Timelapse
 *  org.gigapan.timelapse.Snaplapse
 *  jQuery (http://jquery.com/)
 *
 * Copyright 2013 Carnegie Mellon University. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright notice, this list
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
 *  Yen-Chia Hsu (legenddolphin@gmail.com)
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
// DEPENDECIES
//
if (!org.gigapan.timelapse.Timelapse) {
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.Visualizer";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.Visualizer = function(timelapse, snaplapse, visualizerGeometry) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //
    var videoset = timelapse.getVideoset();
    var timeMachineDivId = timelapse.getTimeMachineDivId();
    var visualizerDivId = timeMachineDivId + "_visualizer";
    var videoDivID = timelapse.getVideoDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var navigationMapGeometry = {
      "x": undefined,
      "y": undefined,
      "width": undefined,
      "height": undefined
    };
    var navWidth = visualizerGeometry.width;
    var navHeight = visualizerGeometry.height;

    // Variables for all visualizer elements
    var navigationMap_container;
    var $navigationMap_container;
    var navigationMap;
    var tagsNavigation;
    var $tagsNavigation;
    var $hideMapCheckbox;
    var $hideMapLabel;
    var panoVideo;

    // Variables for kinetic JS
    var navigationMap_layer_background;
    var navigationMap_layer_mask;
    var navigationMap_layer_navigation;
    var navigationMap_layer_tag;
    var navigationMap_stage;
    var navigationMap_background;
    var navigationMap_mask;
    var navigationMap_box;
    var navigationMap_circle;

    // Variables for attributes
    var navigationMap_width;
    var navigationMap_height;
    var tagsNavigation_position;
    var isHideNavigationMap = false;
    var panoViewBox;
    var contextMapScale;

    // Parameters for context map
    var defaultTagRGB = "255,0,0";
    var tagOpacity = 0.5;
    var maskOpacity = 0.8;
    var dotsPerSecond = 8;
    var navigationMapBox_borderWidth = 1;
    var navigationMapCircle_borderWidth = 1;
    var navigationMap_box_strokeOpacity = 0.5;
    var navigationMap_circle_radius = 5;
    var navigationMap_circle_strokeOpacity = 0.7;
    var navigationMap_circle_fillOpacity = 0.6;
    var navigationMap_tag_strokeWidth = 1;
    var navigationMap_tag_strokeOpacity = 0.7;
    var navigationMap_tag_fillOpacity = 0.4;
    var navigationMap_line_strokeOpacity = 0.4;
    var navigationMap_line_strokeWidth = 2;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //

    // Create snaplapse visualizer elements
    var createSnaplapseVisualizerElements = function() {
      // Create div elements
      var $visualizer = $('<div class="visualizer"></div>');
      navigationMap_container = createAnElement("div", "navigationMap_container", visualizerDivId + "_navigationMap_container");
      navigationMap = createAnElement("div", "navigationMap", visualizerDivId + "_navigationMap");
      tagsNavigation = createAnElement("div", "tagsNavigation", visualizerDivId + "_tagsNavigation");
      $hideMapCheckbox = $('<input type="checkbox" class="hideMapCheckbox"/>');
      $hideMapLabel = $('<label class="hideMapLabel" title="Hide/Show map"></label>');
      $hideMapCheckbox.attr("id", timeMachineDivId + "_hideMapCheckbox");
      $hideMapLabel.attr("for", timeMachineDivId + "_hideMapCheckbox");
      // jQuery
      $navigationMap_container = $(navigationMap_container);
      $tagsNavigation = $(tagsNavigation);
      // Append elements
      $navigationMap_container.append(navigationMap, tagsNavigation);
      $visualizer.append(navigationMap_container, $hideMapCheckbox, $hideMapLabel);
      $("#" + viewerDivId).append($visualizer);
      // Create hide/show map button
      $hideMapCheckbox.button({
        icons: {
          primary: "ui-icon-arrowthick-1-ne"
        },
        text: false
      }).click(function() {
        hideNavigationMap();
        if ($hideMapCheckbox.is(":checked")) {
          $hideMapCheckbox.button({
            icons: {
              secondary: "ui-icon-arrowthick-1-sw"
            }
          });
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-hide-context-map');
        } else {
          showNavigationMap();
          $hideMapCheckbox.button({
            icons: {
              secondary: "ui-icon-arrowthick-1-ne"
            }
          });
          UTIL.addGoogleAnalyticEvent('button', 'click', 'viewer-show-context-map');
        }
      });
      // Set position and size
      $navigationMap_container.css({
        "right": "20px",
        "top": "20px",
        "height": navHeight + "px",
        "width": navWidth + "px"
      });
      // Get attributes
      navigationMap_width = $(navigationMap).width();
      navigationMap_height = $(navigationMap).height();
      tagsNavigation_position = $(tagsNavigation).position();
      // Initialize kineticJS for navigation map
      navigationMap_stage = new Kinetic.Stage({
        container: navigationMap.id,
        width: navigationMap_width,
        height: navigationMap_height
      });
      navigationMap_layer_background = new Kinetic.Layer();
      navigationMap_layer_mask = new Kinetic.Layer();
      navigationMap_layer_navigation = new Kinetic.Layer();
      navigationMap_layer_tag = new Kinetic.Layer();
      navigationMap_stage.add(navigationMap_layer_background);
      navigationMap_stage.add(navigationMap_layer_mask);
      navigationMap_stage.add(navigationMap_layer_navigation);
      navigationMap_stage.add(navigationMap_layer_tag);
      navigationMap_layer_background.setZIndex(1);
      navigationMap_layer_mask.setZIndex(3);
      navigationMap_layer_navigation.setZIndex(5);
      navigationMap_layer_tag.setZIndex(7);
      // Initialize kineticJS for navigation map background layer
      navigationMap_background = new Kinetic.Image({
        x: 0,
        y: 0
      });
      navigationMap_layer_background.add(navigationMap_background);
      navigationMap_layer_background.draw();
      // Initialize kineticJS for navigation map navigation layer
      navigationMap_box = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        stroke: "rgb(" + defaultTagRGB + ")",
        opacity: navigationMap_box_strokeOpacity,
        strokeWidth: navigationMapBox_borderWidth
      });
      navigationMap_circle = new Kinetic.Circle({
        x: 0,
        y: 0,
        radius: navigationMap_circle_radius,
        fill: "rgba(" + defaultTagRGB + "," + navigationMap_circle_strokeOpacity + ")",
        stroke: "rgba(" + defaultTagRGB + "," + navigationMap_circle_fillOpacity + ")",
        strokeWidth: navigationMapCircle_borderWidth
      });
      navigationMap_layer_navigation.add(navigationMap_circle);
      navigationMap_layer_navigation.add(navigationMap_box);
      navigationMap_layer_navigation.draw();
      // Initialize kineticJS for navigation map mask layer
      navigationMap_mask = new Kinetic.Polygon({
        points: [{
          "x": 0,
          "y": 0
        }, {
          "x": 0,
          "y": 0
        }],
        fill: "rgb(255,255,255)",
        opacity: maskOpacity
      });
      navigationMap_layer_mask.add(navigationMap_mask);
      navigationMap_layer_mask.draw();
    };

    // Create an element
    var createAnElement = function(elemType, elemClass, elemId) {
      var element = document.createElement(elemType);
      $(element).addClass(elemClass);
      element.id = elemId;
      return element;
    };

    // (Unused)
    var updateSplines = function(kineticLayer) {
      //console.log(kineticLayer.getChildren());
    };

    // (Unused) Draw a Catmull-Rom spline on the canvas (Cardinal spline with tension=1)
    var drawSpline = function(kineticLayer, pStart, pEnd, lineW, lineColor, id, name) {
      var controlPoint = {
        x: (pStart.x + pEnd.x) / 3,
        y: ((pStart.y + pEnd.y) / 3) * 2
      };
      var controlRect = new Kinetic.Rect({
        x: controlPoint.x - 1.5 * lineW,
        y: controlPoint.y - 1.5 * lineW,
        width: 3 * lineW,
        height: 3 * lineW,
        stroke: lineColor,
        fill: lineColor,
        strokeWidth: 1,
        draggable: true
      });
      var spline = new Kinetic.Spline({
        points: [pStart.x, pStart.y, controlPoint.x, controlPoint.y, pEnd.x, pEnd.y],
        stroke: lineColor,
        strokeWidth: lineW,
        dashArray: [lineW, lineW],
        tension: 1,
        id: id, // End tag id
        name: name // Start tag id
      });
      //console.log(spline.getPoints());
      kineticLayer.add(controlRect);
      kineticLayer.add(spline);
      updateSplines(kineticLayer);
    };

    // Compute the span for dash lines on the visualizer
    var computeDashSpan = function(keyframe, lineW, lineLength) {
      var loopTimes = typeof keyframe['loopTimes'] == 'undefined' ? 0 : keyframe['loopTimes'];
      var startDwell = timelapse.getStartDwell();
      var endDwell = timelapse.getEndDwell();
      var duration_withoutWaiting = keyframe['duration'] - loopTimes * (startDwell + endDwell);
      var dashSpan;
      if (duration_withoutWaiting == 0) {
        dashSpan = lineW / 1.5;
      } else {
        dashSpan = lineLength / (duration_withoutWaiting * dotsPerSecond);
        if (dashSpan < lineW / 1.5) {
          dashSpan = lineW / 1.5;
        }
      }
      return dashSpan;
    };

    // Add a line to the canvas
    var addLine = function(kineticLayer, pStart, pEnd, lineW, lineColor, id, name, keyframe, circle_radius) {
      var lineLength = Math.sqrt(Math.pow(pEnd.x - pStart.x, 2) + Math.pow(pEnd.y - pStart.y, 2));
      var angle = Math.atan2(pEnd.y - pStart.y, pEnd.x - pStart.x);
      var open = 6;

      var line = new Kinetic.Line({
        points: [pStart.x, pStart.y, pEnd.x, pEnd.y],
        stroke: lineColor,
        strokeWidth: lineW,
        dashArray: [lineW, computeDashSpan(keyframe, lineW, lineLength)],
        id: id, // End tag id
        name: name // Start tag id
      });
      kineticLayer.add(line);

      if (lineLength > circle_radius * 2) {
        circle_radius += 1;
        var toX = pEnd.x - circle_radius * Math.cos(angle);
        var toY = pEnd.y - circle_radius * Math.sin(angle);
        var headlen = circle_radius;
        var rgb = lineColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
        var arrowHeadColor = "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",1)";
        var arrowHead = new Kinetic.Polygon({
          points: [toX - headlen * Math.cos(angle - Math.PI / open), toY - headlen * Math.sin(angle - Math.PI / open), toX, toY, toX - headlen * Math.cos(angle + Math.PI / open), toY - headlen * Math.sin(angle + Math.PI / open)],
          fill: arrowHeadColor,
          strokeWidth: 0,
          id: id + "_arrowHead",
          name: name + "_arrowHead"
        });
        kineticLayer.add(arrowHead);
      }
    };

    // Update a line on the canvas
    var updateLine = function(kineticLayer, tagId, keyframe) {
      var line = kineticLayer.get("." + tagId)[0];
      if (line) {
        var points = line.getPoints();
        var lineW = line.getStrokeWidth();
        var lineLength = Math.sqrt(Math.pow(points[0].x - points[1].x, 2) + Math.pow(points[0].y - points[1].y, 2));
        line.setDashArray([lineW, computeDashSpan(keyframe, lineW, lineLength)]);
      }
    };

    // Delete the lines coming out of a tag on the canvas
    var deleteLine_out = function(kineticLayer, tagId) {
      var line_out = kineticLayer.get("." + tagId)[0];
      var line_out_arrowHead = kineticLayer.get("." + tagId + "_arrowHead")[0];
      var tagEndId = undefined;
      var connection = {
        "pEnd": {
          "x": undefined,
          "y": undefined
        },
        "tagEndId": undefined,
        "color": undefined
      };
      if (line_out) {
        var line_out_points = line_out.getPoints();
        tagEndId = line_out.getId();
        connection.tagEndId = tagEndId;
        connection.pEnd.x = line_out_points[1].x;
        connection.pEnd.y = line_out_points[1].y;
        connection.color = line_out.getStroke();
        line_out.remove();
        if (line_out_arrowHead)
          line_out_arrowHead.remove();
      }
      return connection;
    };

    // Delete the lines coming in and out of a tag on the canvas
    var deleteLine_in_out = function(kineticLayer, tagId) {
      var line_in = kineticLayer.get("#" + tagId)[0];
      var line_in_arrowHead = kineticLayer.get("#" + tagId + "_arrowHead")[0];
      var line_out = kineticLayer.get("." + tagId)[0];
      var line_out_arrowHead = kineticLayer.get("." + tagId + "_arrowHead")[0];
      var tagStartId = undefined;
      var tagEndId = undefined;
      var connection = {
        "pStart": {
          "x": undefined,
          "y": undefined
        },
        "pEnd": {
          "x": undefined,
          "y": undefined
        },
        "tagStartId": undefined,
        "tagEndId": undefined,
        "color": undefined
      };
      if (line_in) {
        var line_in_points = line_in.getPoints();
        tagStartId = line_in.getName();
        connection.tagStartId = tagStartId;
        connection.pStart.x = line_in_points[0].x;
        connection.pStart.y = line_in_points[0].y;
        line_in.remove();
        if (line_in_arrowHead)
          line_in_arrowHead.remove();
      }
      if (line_out) {
        var line_out_points = line_out.getPoints();
        tagEndId = line_out.getId();
        connection.tagEndId = tagEndId;
        connection.pEnd.x = line_out_points[1].x;
        connection.pEnd.y = line_out_points[1].y;
        connection.color = line_out.getStroke();
        line_out.remove();
        if (line_out_arrowHead)
          line_out_arrowHead.remove();
      }
      return connection;
    };

    // (Unused) Draw a polygon on the canvas
    var drawPolygon_4Point = function(kineticLayer, p1, p2, p3, p4, color1, color2, grad_direction) {
      var gradientStartPoint, gradientEndPoint;
      if (grad_direction == "x") {
        gradientStartPoint = {
          "x": p1.x,
          "y": (p1.y + p2.y) / 2
        };
        gradientEndPoint = {
          "x": p4.x,
          "y": (p3.y + p4.y) / 2
        };
      } else if (grad_direction == "y") {
        gradientStartPoint = {
          "x": (p1.x + p2.x) / 2,
          "y": p1.y
        };
        gradientEndPoint = {
          "x": (p3.x + p4.x) / 2,
          "y": p4.y
        };
      }
      var linearGradPolygon = new Kinetic.Polygon({
        points: [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y],
        fillLinearGradientStartPoint: [gradientStartPoint.x, gradientStartPoint.y],
        fillLinearGradientEndPoint: [gradientEndPoint.x, gradientEndPoint.y],
        fillLinearGradientColorStops: [0, color1, 1, color2],
        strokeWidth: 0
      });
      // Add the shape to the layer
      kineticLayer.add(linearGradPolygon);
    };

    // Add the tag on the bottom canvas
    var addTagOnCanvas = function(tagInfo, tagContainer) {
      // Create div element
      var tagElement = document.createElement("div");
      $(tagElement).addClass("timeTag");
      // Set css
      tagElement.id = tagInfo.id;
      tagElement.style.position = tagInfo.position;
      tagElement.style.backgroundColor = tagInfo.backgroundColor;
      tagElement.style.top = tagInfo.top;
      tagElement.style.left = tagInfo.left;
      tagElement.style.height = tagInfo.height;
      tagElement.style.width = tagInfo.width;
      tagElement.style.cursor = "pointer";
      if (tagInfo.borderColor != undefined)
        tagElement.style.borderColor = tagInfo.borderColor;
      if (tagInfo.borderWidth != undefined)
        tagElement.style.borderWidth = tagInfo.borderWidth;
      if (tagInfo.borderStyle != undefined)
        tagElement.style.borderStyle = "solid";
      if (tagInfo.className != undefined)
        $(tagElement).addClass(tagInfo.className);
      // Add listeners
      tagElement.addEventListener("click", function(event) {
        var snaplapseID = event.target.id.match(/[a-zA-Z0-9]+(_snaplapse_keyframe_)[a-zA-Z0-9]+/);
        snaplapseID = snaplapseID[0];
        var keyframeId = snaplapseID.split("_")[3];
        snaplapse.getSnaplapseViewer().selectAndGo($("#" + snaplapseID), keyframeId);
      }, false);
      tagElement.addEventListener("mouseover", function(event) {
        var tagColor = event.target.style.backgroundColor;
        var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
        var colorChange = "rgb(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ")";
        $(event.target).css("background-color", colorChange);
      }, false);
      tagElement.addEventListener("mouseout", function(event) {
        var tagColor = event.target.style.backgroundColor;
        var rgb = tagColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        var colorChange_head = "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",";
        var colorChange_tag = colorChange_head + tagOpacity + ")";
        $(event.target).css("background-color", colorChange_tag);
      }, false);
      $(tagContainer).append(tagElement);
    };

    var hideNavigationMap = function() {
      isHideNavigationMap = true;
      $navigationMap_container.stop(true, true).hide(200);
    };

    var showNavigationMap = function() {
      isHideNavigationMap = false;
      $navigationMap_container.stop(true, true).show(200);
    };

    var viewPointToContextMapPoint = function(view) {
      return {
        x: (view.x - panoViewBox.xmin) * contextMapScale,
        y: (view.y - panoViewBox.ymin) * contextMapScale
      };
    };

    var computeContextMapPoint = function(bbox) {
      var pointNE = viewPointToContextMapPoint({
        "x": bbox.xmin,
        "y": bbox.ymin
      });
      var pointSW = viewPointToContextMapPoint({
        "x": bbox.xmax,
        "y": bbox.ymax
      });
      var pointCenter = viewPointToContextMapPoint({
        "x": (bbox.xmin + bbox.xmax) / 2,
        "y": (bbox.ymin + bbox.ymax) / 2
      });
      var radius = 4.7667 * Math.log(Math.abs(pointNE.x - pointSW.x) + Math.abs(pointNE.y - pointSW.y)) - 16.525;
      if (radius < 2)
        radius = 2;
      return {
        pointNE: pointNE,
        pointSW: pointSW,
        pointCenter: pointCenter,
        radius: radius
      };
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.getPanoVideo = function() {
      return panoVideo;
    };

    this.getNavigationMap_layer_tag = function() {
      return navigationMap_layer_tag;
    };

    this.getNavigationMap = function() {
      return navigationMap;
    };

    var handleShowHideNavigationMap = function(showHide) {
      if (showHide == "show" && !snaplapse.isPlaying()) {
        $hideMapLabel.stop(true, true).fadeIn(200);
        if (!isHideNavigationMap)
          $navigationMap_container.stop(true, true).fadeIn(200);
      } else if (showHide == "hide") {
        $navigationMap_container.stop(true, true).fadeOut(200);
        $hideMapLabel.stop(true, true).fadeOut(200);
      }
    };
    this.handleShowHideNavigationMap = handleShowHideNavigationMap;

    // Update lines on the canvas
    var updateTagPaths = function(tagIdHead, keyframe) {
      updateLine(navigationMap_layer_tag, tagIdHead + "_timeTagNavigation", keyframe);
      navigationMap_layer_tag.draw();
    };
    this.updateTagPaths = updateTagPaths;

    // Clone the pano video
    this.clonePanoVideo = function(topLevelVideo) {
      if (!panoVideo) {
        panoVideo = document.createElement("video");
        panoVideo.addEventListener("timeupdate", function() {
          if (!panoVideo.seeking) {
            navigationMap_background.setAttrs({
              image: panoVideo,
              x: navigationMapGeometry.x,
              y: navigationMapGeometry.y,
              width: navigationMapGeometry.width,
              height: navigationMapGeometry.height
            });
            navigationMap_layer_background.draw();
          }
        }, false);
        panoVideo.addEventListener("seeked", function() {
          navigationMap_background.setAttrs({
            image: panoVideo,
            x: navigationMapGeometry.x,
            y: navigationMapGeometry.y,
            width: navigationMapGeometry.width,
            height: navigationMapGeometry.height
          });
          navigationMap_layer_background.draw();
        }, false);
        panoVideo.addEventListener("loadeddata", function() {
          timelapse.seek_panoVideo(timelapse.getCurrentTime());
        }, false);
      }
      // Ouch.  A brand new bug in Chrome 15 (apparently) causes videos to never load
      // if they've been loaded recently and are being loaded again now.
      // It's pretty weird, but this disgusting code seems to work around the problem.
      panoVideo.setAttribute('src', topLevelVideo.src + "?time=" + (new Date().getTime()) + "1765");
      panoVideo.setAttribute('preload', 'auto');
      panoVideo.style.position = "absolute";
      panoVideo.style.top = topLevelVideo.geometry.top + "px";
      panoVideo.style.left = topLevelVideo.geometry.left + "px";
      panoVideo.style.width = topLevelVideo.geometry.width + "px";
      panoVideo.style.height = topLevelVideo.geometry.height + "px";
      panoVideo.load();
      return panoVideo;
    };

    // Load the context map
    var loadContextMap = function() {
      // Cache variables
      panoViewBox = timelapse.pixelCenterToPixelBoundingBoxView(timelapse.getPanoView()).bbox;
      contextMapScale = navigationMap_width / (panoViewBox.xmax - panoViewBox.xmin);

      // Initialize the map
      var scale = navigationMap_width / $("#" + videoDivID).width();
      var video = videoset.getCurrentActiveVideo();
      navigationMapGeometry.x = video.geometry.left * scale;
      navigationMapGeometry.y = video.geometry.top * scale;
      navigationMapGeometry.width = video.geometry.width * scale + 2;
      navigationMapGeometry.height = video.geometry.height * scale + 2;
    };
    this.loadContextMap = loadContextMap;

    // Set the mode of the visualizer
    var setMode = function(mode, isFitToWindow, noAnimation) {
      if (mode == "player") {
        navigationMap_layer_tag.show();
        $tagsNavigation.show();
        if (noAnimation == true) {
          $navigationMap_container.hide();
          $hideMapLabel.hide();
        } else {
          $navigationMap_container.stop(true, true).fadeOut(200);
          $hideMapLabel.stop(true, true).fadeOut(200);
        }
        if (panoVideo)
          panoVideo.pause();
      } else if (mode == "editor" || mode == "editor-annotator") {
        if (isFitToWindow) {
          //handleShowHideNavigationMap("hide");
        } else {
          navigationMap_layer_tag.show();
          $tagsNavigation.show();
          handleShowHideNavigationMap("show");
          navigationMap_circle.show();
          navigationMap_layer_navigation.draw();
        }
      }
    };
    this.setMode = setMode;

    // Update the map
    var setMap = function(bbox) {
      // Draw the bounding box on the small navigation map
      var contextMapPoint = computeContextMapPoint(bbox);
      var nowWidth_nav = Math.abs(contextMapPoint.pointNE.x - contextMapPoint.pointSW.x);
      var nowHeight_nav = Math.abs(contextMapPoint.pointNE.y - contextMapPoint.pointSW.y);
      navigationMap_box.setAttrs({
        x: contextMapPoint.pointNE.x,
        y: contextMapPoint.pointNE.y,
        width: nowWidth_nav,
        height: nowHeight_nav
      });
      navigationMap_circle.setAttrs({
        x: contextMapPoint.pointCenter.x,
        y: contextMapPoint.pointCenter.y,
        radius: contextMapPoint.radius
      });
      navigationMap_mask.setAttrs({
        points: [{
          "x": 0,
          "y": 0
        }, {
          "x": 0,
          "y": navigationMap_height
        }, {
          "x": navigationMap_width,
          "y": navigationMap_height
        }, {
          "x": navigationMap_width,
          "y": 0
        }, {
          "x": 0,
          "y": 0
        }, {
          "x": contextMapPoint.pointNE.x,
          "y": contextMapPoint.pointNE.y
        }, {
          "x": contextMapPoint.pointSW.x,
          "y": contextMapPoint.pointNE.y
        }, {
          "x": contextMapPoint.pointSW.x,
          "y": contextMapPoint.pointSW.y
        }, {
          "x": contextMapPoint.pointNE.x,
          "y": contextMapPoint.pointSW.y
        }, {
          "x": contextMapPoint.pointNE.x,
          "y": contextMapPoint.pointNE.y
        }, {
          "x": 0,
          "y": 0
        }]
      });
      navigationMap_layer_navigation.draw();
      navigationMap_layer_mask.draw();
    };
    this.setMap = setMap;

    // Add a time tag on the visualization area
    var addTimeTag = function(keyframes, index, isKeyframeFromLoad) {
      var keyframe = keyframes[index];
      var keyframe_last = keyframes[index - 1];
      var keyframe_next = keyframes[index + 1];
      var idHead = timeMachineDivId + "_snaplapse_keyframe_" + keyframe.id;
      var idHead_last;
      var idHead_next;
      if (keyframe_last != undefined)
        idHead_last = timeMachineDivId + "_snaplapse_keyframe_" + keyframe_last.id;
      if (keyframe_next != undefined)
        idHead_next = timeMachineDivId + "_snaplapse_keyframe_" + keyframe_next.id;
      // Get the color of tags
      var color_head = "rgba(" + defaultTagRGB + ",";
      var color_navigationFill = color_head + navigationMap_tag_fillOpacity + ")";
      var color_navigationStroke = color_head + navigationMap_tag_strokeOpacity + ")";
      var color_navigationStroke_line = color_head + navigationMap_line_strokeOpacity + ")";
      // Variables for tag transition line
      var pNow;
      var connection;
      // Add tagsNavigation div element
      var navigationMap_circle_x = navigationMap_circle.getX();
      var navigationMap_circle_y = navigationMap_circle.getY();
      var navigationMap_circle_radius = navigationMap_circle.getRadius();
      if (keyframe.timeTagNavigation) {
        navigationMap_circle_x = keyframe.timeTagNavigation.x;
        navigationMap_circle_y = keyframe.timeTagNavigation.y;
        navigationMap_circle_radius = keyframe.timeTagNavigation.r;
      } else if (isKeyframeFromLoad) {
        var contextMapPoint = computeContextMapPoint(keyframe.bounds);
        navigationMap_circle_x = contextMapPoint.pointCenter.x;
        navigationMap_circle_y = contextMapPoint.pointCenter.y;
        navigationMap_circle_radius = contextMapPoint.radius;
      }
      var tagInfoNavigation = {
        "id": idHead + "_timeTagNavigation",
        "position": "absolute",
        "backgroundColor": color_navigationFill,
        "top": navigationMap_circle_y - navigationMap_circle_radius - navigationMap_tag_strokeWidth / 2 + "px",
        "left": navigationMap_circle_x - navigationMap_circle_radius - navigationMap_tag_strokeWidth / 2 + "px",
        "height": navigationMap_circle_radius * 2 + "px",
        "width": navigationMap_circle_radius * 2 + "px",
        "className": "circleBase",
        "borderWidth": navigationMap_tag_strokeWidth + "px",
        "borderColor": color_navigationStroke,
        "borderStyle": "solid"
      };
      addTagOnCanvas(tagInfoNavigation, tagsNavigation);

      if (keyframe_last != undefined) {
        // Draw navigation_tag transition
        connection = deleteLine_out(navigationMap_layer_tag, idHead_last + "_timeTagNavigation");
        pNow = {
          "x": navigationMap_circle_x,
          "y": navigationMap_circle_y
        };
        addLine(navigationMap_layer_tag, keyframe_last.timeTagNavigation, pNow, navigationMap_line_strokeWidth, color_navigationStroke_line, idHead + "_timeTagNavigation", idHead_last + "_timeTagNavigation", keyframe_last, navigationMap_circle_radius);
        if (connection.tagEndId != undefined) {
          addLine(navigationMap_layer_tag, pNow, connection.pEnd, navigationMap_line_strokeWidth, connection.color, connection.tagEndId, idHead + "_timeTagNavigation", keyframe, navigationMap_circle_radius);
        }
      } else {
        // Insert a keyframe before the first keyframe
        if (keyframe_next != undefined) {
          // Draw navigation_tag transition
          pNow = {
            "x": navigationMap_circle_x,
            "y": navigationMap_circle_y
          };
          addLine(navigationMap_layer_tag, pNow, keyframe_next.timeTagNavigation, navigationMap_line_strokeWidth, color_navigationStroke_line, idHead_next + "_timeTagNavigation", idHead + "_timeTagNavigation", keyframe, navigationMap_circle_radius);
        }
      }
      // Redraw the layers
      navigationMap_layer_tag.draw();
      // Save tag
      keyframe.timeTagNavigation = {
        "x": navigationMap_circle_x,
        "y": navigationMap_circle_y,
        "r": navigationMap_circle_radius
      };
      return color_head;
    };
    this.addTimeTag = addTimeTag;

    // Delete a time tag
    var deleteTimeTag = function(keyframeId, keyframe_last) {
      // Delete tags
      var idHead = timeMachineDivId + "_snaplapse_keyframe_" + keyframeId;
      var tagNavigationId = idHead + "_timeTagNavigation";
      var $tagNavigation = $("#" + tagNavigationId);
      var circle_radius_navigation = $tagNavigation.width() / 2;
      $tagNavigation.remove();
      // Delete paths
      var connectNavigation = deleteLine_in_out(navigationMap_layer_tag, tagNavigationId);
      // Reconnect path
      if (connectNavigation.tagStartId != undefined && connectNavigation.tagEndId != undefined) {
        addLine(navigationMap_layer_tag, connectNavigation.pStart, connectNavigation.pEnd, navigationMap_line_strokeWidth, connectNavigation.color, connectNavigation.tagEndId, connectNavigation.tagStartId, keyframe_last, circle_radius_navigation);
      }
      // Redraw layers
      navigationMap_layer_tag.draw();
    };
    this.deleteTimeTag = deleteTimeTag;

    // Delete all time tags
    var deleteAllTags = function() {
      // Delete elements
      $tagsNavigation.children().remove();
      navigationMap_layer_tag.removeChildren();
      // Redraw layers
      navigationMap_layer_tag.draw();
    };
    this.deleteAllTags = deleteAllTags;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    createSnaplapseVisualizerElements();
    setMode("player", timelapse.isFullScreen(), true);
  };
  //end of org.gigapan.timelapse.Visualizer
})();
//end of (function() {
