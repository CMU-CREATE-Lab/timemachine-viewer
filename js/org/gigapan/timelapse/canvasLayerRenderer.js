/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * A class that manages canvas layers for Time Machine
 *
 * Shapes (circles and rectangles) or shapefiles in the form of geoJSON are supported.
 *
 * Dependencies:
 *  jQuery (http://jquery.com/)
 *  org.gigapan.timelapse.Timelapse
 *
 * Copyright 2013 Carnegie Mellon University. All rights reserved.
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
 *  Paul Dille (pdille@cmucreatelab.org)
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
  if (typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}
// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if (typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}
// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse) {
  org.gigapan.timelapse = {};
} else {
  if (typeof org.gigapan.timelapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

//
// DEPENDECIES
//
if (!window['$']) {
  var nojQueryMsg = "The jQuery library is required by org.gigapan.timelapse.CanvasLayerRenderer";
  alert(nojQueryMsg);
  throw new Error(nojQueryMsg);
}
if (!org.gigapan.timelapse.Timelapse) {
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.CanvasLayerRenderer";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  org.gigapan.timelapse.CanvasLayerRenderer = function(options) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //
    var timelapse;
    var thisRenderer = this;
    var stage;
    var layers = {};
    // Offscreen canvas that holds shapes being drawn
    var shapeCanvas = document.createElement('canvas');
    // Cannot have a canvas less than 1x1
    shapeCanvas.width = 1;
    shapeCanvas.height = 1;
    var shapeCanvasCtx = shapeCanvas.getContext('2d');
    var shapes = [];
    var availableEvents = {};
    var previousActiveElement = null;
    var didMouseEnter = false;
    var didMouseOver = false;
    var numLayers = 0;
    var timelapseViewNotChanging = true;
    var currentScale;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    function addCircleToShapeCanvas(shape) {
      var radius = shape.width / 2;
      shapeCanvasCtx.fillStyle = shape.color;
      shapeCanvasCtx.beginPath();
      shapeCanvasCtx.arc(shape.position + radius, radius, radius, 0, 2 * Math.PI);
      shapeCanvasCtx.closePath();
      shapeCanvasCtx.fill();
    }

    function addRectangleToShapeCanvas(shape) {
      shapeCanvasCtx.fillStyle = shape.color;
      shapeCanvasCtx.fillRect(shape.position, 0, shape.width, shape.height);
    }

    function addImageToShapeCanvas(shape) {
      var img = new Image();
      img.onload = function() {
        shapeCanvasCtx.drawImage(this, shape.position, 0, shape.width, shape.height);
      };
      img.src = shape.src;
    }

    function inCircleHitArea(mouseX, mouseY, element) {
      var elementAttributes = element.attrs;
      var radius = (elementAttributes.shape.width / currentScale) / 2;
      var elemXPosPlusRadius = elementAttributes.worldX + radius;
      var elemYPosPlusRadius = elementAttributes.worldY + radius;
      // Distance formula: sqrt((x1-x2)^2+(y1-y2)^2)
      // Use only multiplication for better performance.
      return ((mouseX - elemXPosPlusRadius) * (mouseX - elemXPosPlusRadius) + (mouseY - elemYPosPlusRadius) * (mouseY - elemYPosPlusRadius) < radius*radius);
    }

    function inRectangleHitArea(mouseX, mouseY, element) {
      var elementAttributes = element.attrs;
      var shape = elementAttributes.shape;
      return (mouseY > elementAttributes.worldY && mouseY < elementAttributes.worldY + (shape.height / currentScale) && mouseX > elementAttributes.worldX && mouseX < elementAttributes.worldX + (shape.width / currentScale));
    }

    function inHitArea(mouseX, mouseY, element) {
      var type = element.attrs.shape.type;
      var mouseInWorldCoords = timelapse.convertViewportToTimeMachine({x: mouseX, y: mouseY});
      if (type == "circle") {
        return inCircleHitArea(mouseInWorldCoords.x, mouseInWorldCoords.y, element);
      } else if (type == "rectangle" || "image") {
        return inRectangleHitArea(mouseInWorldCoords.x, mouseInWorldCoords.y, element);
      }
    }

    function addEvents(type) {
      stage.on(type, function(event) {
        var types;
        var offset = $(this).offset();
        var mouseX = event.pageX - offset.left;
        var mouseY = event.pageY - offset.top;
        for (var layerName in layers) {
          var elements = layers[layerName].elements;
          for (var j = 0; j < elements.length; j++) {
            var element = layers[layerName].elements[j];
            if (element.attrs.visible && Object.keys(element.events).length > 0 && inHitArea(mouseX, mouseY, element)) {
              if (!previousActiveElement) {
                previousActiveElement = element;
              }
              if (type == "mousemove") {
                types = ["mouseover", "mouseenter"];
                for (var jj = 0; jj < types.length; jj++) {
                  var type3 = types[jj];
                  if (!element.events[type3]) continue;
                  for (var jjj = 0; jjj < element.events[type3].length; jjj++) {
                    if (didMouseOver || didMouseEnter) break;
                    if (type3 == "mouseover") didMouseOver = true;
                    if (type3 == "mouseenter") didMouseEnter = true;
                    element.events[type3][jjj].call(element, {worldX: element.attrs.worldX, worldY: element.attrs.worldY});
                  }
                }
              }
              if (!element.events[type]) continue;
              for (var k = 0; k < element.events[type].length; k++) {
                element.events[type][k].call(element, {worldX: element.attrs.worldX, worldY: element.attrs.worldY});
              }
              return;
            }
          }
          if (previousActiveElement && type == "mousemove") {
            if (inHitArea(mouseX, mouseY, previousActiveElement)) continue;
            types = ["mouseout", "mouseleave", "mouseover", "mouseenter"];
            for (var kk = 0; kk < types.length; kk++) {
              var type2 = types[kk];
              if (!previousActiveElement.events[type2]) continue;
              for (var kkk = 0; kkk < previousActiveElement.events[type2].length; kkk++) {
                if (didMouseOver) didMouseOver = false;
                if (didMouseEnter) didMouseEnter = false;
                if (kk < 2)
                  previousActiveElement.events[type2][kkk].call(previousActiveElement, {worldX: previousActiveElement.attrs.worldX, worldY: previousActiveElement.attrs.worldY});
              }
            }
            previousActiveElement = null;
          }
        }
      });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
    })();

    this.addToLegend = function(legend_entry) {
      var legend_html = "";
      var $legend = $("#" + timelapse.getViewerDivId() + " #vector-layers");
      if ($legend.length === 0) {
        $legend = $('<div id=vector-layers>');
        $legend.appendTo($("#" + timelapse.getViewerDivId()));
        $legend.on('click', 'input', function() {
          var layerId = this.id.replace("show-layer-", "");
          if ($(this).is(':checked')) {
            layers[layerId].show();
          } else {
            layers[layerId].hide();
          }
        });
      }
      legend_html += '<input type="checkbox" id="show-layer-' + legend_entry.id + '" checked>';
      legend_html += '<label for="show-layer-' + legend_entry.id + '" id="layer' + legend_entry.id + '-label" class="vector-layers-label" style="color:' + legend_entry.color + '">' + legend_entry.title + '</label><br/>';
      $(legend_html).appendTo($legend);
    };

    this.resetTimelapseViewNotChanging = function() {
      timelapseViewNotChanging = true;
    };

    this.numLayers = function() {
      return numLayers;
    };

    this.getLayers = function() {
      return layers;
    };

    this.getLayer = function(layerName) {
      return layers[layerName];
    };

    this.drawLayers = function() {
      for (var layerName in layers) {
        layers[layerName].draw();
      }
    };

    this.resizeLayers = function() {
      var stageWidth = stage.width();
      var stageHeight = stage.height();
      for (var layerName in layers) {
        layers[layerName].setWidth(stageWidth);
        layers[layerName].setHeight(stageHeight);
        layers[layerName].draw();
      }
    };

    this.Shape = function(data) {
      if (typeof data === "undefined") return null;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////
      //
      // Shape constructor code
      //
      this.type = data.type;
      this.color = data.color;
      this.src = data.src;
      this.width = (typeof data.radius !== 'undefined') ? data.radius * 2 : data.width;
      this.height = (typeof data.radius !== 'undefined') ? data.radius * 2 : data.height;

      var position = 0;
      for (var i = 0; i < shapes.length; i++) {
        position += shapes[i].width;
      }

      this.position = position;
      this.displayListIndex = shapes.length;
      shapes.push(this);

      shapeCanvas.width += this.width;
      shapeCanvas.height = (this.height > shapeCanvas.height) ? this.height : shapeCanvas.height;

      // Resizing the offscreen shape canvas above clears it out, so we need to redraw all our shapes again
      for (var j = 0; j < shapes.length; j++) {
        if (shapes[j].type == "circle") {
          addCircleToShapeCanvas(shapes[j]);
        } else if (shapes[j].type == "rectangle") {
          addRectangleToShapeCanvas(shapes[j]);
        } else if (shapes[j].type == "image") {
          addImageToShapeCanvas(shapes[j]);
        } else {
          console.log("ERROR: Shape type '" + shapes[j].type + "' not supported. Only types 'circle, rectangle, image' allowed.");
        }
      }
    };

    this.Layer = function(layerName, attributes) {
      if (typeof layerName === "undefined") return null;

      this.visible = true;
      var thisLayer = this;
      attributes = attributes || {};

      this.Element = function(attributes) {
        if (typeof attributes === "undefined") return null;

        var thisElement = this;
        thisElement.events = {};

        this.on = function(eventType, listener) {
          if (typeof availableEvents[eventType] === "undefined") {
            // If we need to do a mouse event, we need to use mousemove to track where we are to trigger these events.
            if (typeof availableEvents.mousemove === "undefined" && (eventType == "mouseover" || eventType == "mouseenter" || eventType == "mouseout" || eventType == "mouseleave")) {
              availableEvents.mousemove = true;
              addEvents("mousemove");
              if (typeof thisElement.events.mousemove === "undefined") {
                thisElement.events.mousemove = [];
                thisElement.events.mousemove.push(function() {});
              }
            }
            availableEvents[eventType] = true;
            addEvents(eventType);
          }
          if (typeof thisElement.events[eventType] === "undefined") {
            thisElement.events[eventType] = [];
          }
          thisElement.events[eventType].push(listener);
        };

        this.attrs = attributes;
      };

      this.show = function() {
        this.visible = true;
        this.draw();
      };

      this.hide = function() {
        this.visible = false;
        var context = this.ctx;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, this.width, this.height);
      };

      this.setWidth = function(width) {
        this.width = width;
        this.canvas.prop({width: width});
      };

      this.setHeight = function(height) {
        this.height = height;
        this.canvas.prop({height: height});
      };

      this.moveToTop = function() {
        thisLayer.setPosition(numLayers - 1);
      };

      this.setPosition = function(position) {
        position = Math.min(numLayers - 1, (Math.max(0, position)));
        var canvasToInsert = thisLayer.canvas;
        var canvasNeighbor = stage.children().eq(position);
        if (canvasToInsert.index() > position) {
          canvasNeighbor.before(canvasToInsert);
        } else {
          canvasNeighbor.after(canvasToInsert);
        }
      };

      this.setElementPosition = function(index, newPos) {
        var elements = thisLayer.elements;
        elements[index].attrs.worldX = newPos.x;
        elements[index].attrs.worldY = newPos.y;
      };

      // Draw all elements in a layer
      this.draw = function(currentView) {
        if (!this.visible) return;
        var context = thisLayer.ctx;
        // Default alpha for a canvas is 1
        if (thisLayer.alphaLevel < 1)
          context.globalAlpha = thisLayer.alphaLevel;

        // Clear transformation from last update by setting to identity matrix.
        //context.clearRect(0, 0, thisLayer.width, thisLayer.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, thisLayer.width, thisLayer.height);

        // Scale and translate for current view.
        if (!currentView)
          currentView = timelapse.getView();
        context.translate(thisLayer.width * 0.5, thisLayer.height * 0.5);
        context.scale(currentView.scale, currentView.scale);
        context.translate(-currentView.x, -currentView.y);

        var elements = thisLayer.elements;
        var numElements = elements.length;

        //var bb = timelapse.getBoundingBoxForCurrentView();

        for (var i = 0; i < numElements; i++) {
          var shape = elements[i].attrs.shape;
          //if (elements[i].attrs.visible && elements[i].attrs.worldX + shape.width > bb.xmin && elements[i].attrs.worldX + shape.width < bb.xmax && elements[i].attrs.worldY + shape.height > bb.ymin && elements[i].attrs.worldY + shape.height < bb.ymax) {
          if (elements[i].attrs.visible) {
            context.drawImage(shapeCanvas, shape.position, 0, shape.width, shape.height, elements[i].attrs.worldX, elements[i].attrs.worldY, shape.width / currentView.scale, shape.height / currentView.scale);
          }
        }
      };

      this.addElement = function(element) {
        element.attrs.visible = (typeof element.attrs.visible !== 'undefined') ? element.attrs.visible : true;
        thisLayer.elements.push(element);
        return thisLayer.elements.length - 1;
      };

      this.hideAllGroups = function() {
        var groups = thisLayer.groups;
        for (var i = 0; i < groups.length; i++) {
          groups[i].hide();
        }
      };

      this.Group = function(properties) {
        if (typeof properties === "undefined") return null;

        var thisGroup = this;
        this.elementIndicies = [];
        this.name = properties.name;
        this.visible = (typeof properties.visible !== 'undefined') ? properties.visible : true;

        this.hide = function() {
          var elementIndicies = thisGroup.elementIndicies;
          for (var i = 0; i < elementIndicies.length; i++) {
            thisLayer.elements[elementIndicies[i]].attrs.visible = false;
          }
        };

        this.show = function() {
          var elementIndicies = thisGroup.elementIndicies;
          for (var i = 0; i < elementIndicies.length; i++) {
            thisLayer.elements[elementIndicies[i]].attrs.visible = true;
          }
        };

        // Draw specific group elements of a layer.
        this.draw = function() {
          // TODO
          console.log("Group.draw() - Unimplemented");
        };

        this.addElement = function(element) {
          element.attrs.visible = thisGroup.visible;
          thisGroup.elementIndicies.push(thisLayer.addElement(element));
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //
        // Group constructor code
        //
        thisLayer.groups.push(this);
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////
      //
      // Layer constructor code
      //

      this.name = layerName;
      this.elements = [];
      this.groups = [];
      this.width = stage.width();
      this.height = stage.height();
      this.position = (typeof attributes.position === 'undefined' || attributes.position === null) ? numLayers : attributes.position;
      this.position = Math.min(numLayers, (Math.max(0, this.position)));
      this.alphaLevel = attributes.alphaLevel || 1;
      var newCanvas = $('<canvas/>',{'id' : layerName}).css({'background-color': "transparent", 'position': "absolute"}).prop({width: thisLayer.width, height: thisLayer.height});
      this.ctx = newCanvas[0].getContext("2d");
      this.canvas = newCanvas;
      layers[this.name] = this;
      if (this.position === 0) {
        $(newCanvas).prependTo(stage);
      } else {
        $(newCanvas).insertAfter(stage.children().eq(this.position - 1));
      }
      numLayers++;
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Renderer constructor code
    //
    timelapse = options.timelapse;
    if (typeof timelapse === "undefined") return null;
    stage = $("#" + timelapse.getDataPanesContainerId());
    // Handle draw while timelapse is playing
    if (typeof(options.updateHandler) === "function")
      timelapse.addVideoDrawListener(options.updateHandler);
    // Handle draw while timelapse is paused and not panning/zooming but time slider is manually being scrubbed
    //timelapse.addTargetViewChangeListener(function() { timelapseViewNotChanging = false; });
    //timelapse.addViewEndChangeListener(function() { timelapseViewNotChanging = true; });
    timelapse.addZoomChangeListener(function() { currentScale = timelapse.getView().scale; });
    currentScale = timelapse.getView().scale;
    //var idleAnimation = function() {
    //  if (timelapse && timelapse.isPaused() && timelapseViewNotChanging) {
    //    options.updateHandler();
    //  }
    //  window.requestAnimFrame(idleAnimation);
    //};
    //window.requestAnimFrame(idleAnimation);
    // Resize all the layers when the browser window changes size
    $(window).resize(function() {
      thisRenderer.resizeLayers();
    });
  };
})();
