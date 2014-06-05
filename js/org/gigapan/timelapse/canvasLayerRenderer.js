// @license
// Redistribution and use in source and binary forms ...

// This is a class that manages canvas layers
//
// Dependencies:
// * jQuery (http://jquery.com/)
//
// Copyright 2013 Carnegie Mellon University. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
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
// Paul Dille (pdille@cmucreatelab.org)
//

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
if (!window['$']) {
  var nojQueryMsg = "The jQuery library is required by org.gigapan.timelapse.CanvasLayerRenderer";
  alert(nojQueryMsg);
  throw new Error(nojQueryMsg);
}

//
// CODE
//
(function() {
  org.gigapan.timelapse.CanvasLayerRenderer = function(stageName, baseLayerId) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //
    var thisRenderer = this;
    var stage;
    var layers = [];
    var baseLayer = $("#" + baseLayerId);
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

    function inCircleHitArea(mouseX, mouseY, element) {
      var elementAttributes = element.attrs;
      var radius = elementAttributes.shape.width / 2;
      var elemXPosPlusRadius = elementAttributes.x + radius;
      var elemYPosPlusRadius = elementAttributes.y + radius;
      // Distance formula: sqrt((x1-x2)^2+(y1-y2)^2)
      // Use only multiplication for better performance.
      return ((mouseX - elemXPosPlusRadius) * (mouseX - elemXPosPlusRadius) + (mouseY - elemYPosPlusRadius) * (mouseY - elemYPosPlusRadius) < radius*radius)
      //var distance = Math.sqrt(Math.pow(mouseX - (element.attrs.x + radius), 2) + Math.pow(mouseY - (element.attrs.y + radius), 2));
      //return distance <= radius;
    }

    function inRectangleHitArea(mouseX, mouseY, element) {
      var elementAttributes = element.attrs;
      var shape = elementAttributes.shape;
      return (mouseY > elementAttributes.y && mouseY < elementAttributes.y + shape.height && mouseX > elementAttributes.x && mouseX < elementAttributes.x + shape.width);
    }

    function inHitArea(mouseX, mouseY, element) {
      var type = element.attrs.shape.type;
      if (type == "circle") {
        return inCircleHitArea(mouseX, mouseY, element);
      } else if (type == "rectangle") {
        return inRectangleHitArea(mouseX, mouseY, element);
      }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.numLayers = function() {
      return layers.length;
    };

    this.getLayers = function() {
      return layers;
    };

    this.getLayer = function(layerName) {
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].name == layerName)
          return layers[i];
      }
      return null;
    };

    this.drawAllLayers = function() {
      for (var i = 0; i < layers.length; i++) {
        layers[i].draw();
      }
    };

    this.resizeLayers = function() {
      var stageWidth = stage.width();
      var stageHeight = stage.height();
      for (var i = 0; i < layers.length; i++) {
        layers[i].setWidth(stageWidth);
        layers[i].setHeight(stageHeight);
        layers[i].draw();
      }
    };

    this.addEvents = function(type) {
      stage.on(type, function(event) {
        var offset = $(this).offset();
        var mouseX = event.pageX - offset.left;
        var mouseY = event.pageY - offset.top;
        for (var i = 0; i < layers.length; i++) {
          var elements = layers[i].elements;
          for (var j = 0; j < elements.length; j++) {
            var element = layers[i].elements[j];

            if (element.attrs.visible && Object.keys(element.events).length > 0 && inHitArea(mouseX, mouseY, element)) {
              if (!previousActiveElement) {
                previousActiveElement = element;
              }

              if (type == "mousemove") {
                var types = ["mouseover", "mouseenter"];
                for (var jj = 0; jj < types.length; jj++) {
                  var type3 = types[jj];
                  if (!element.events[type3]) continue;
                  for (var jjj = 0; jjj < element.events[type3].length; jjj++) {
                    if (didMouseOver) break;
                    if (didMouseEnter) break;
                    if (type3 == "mouseover") didMouseOver = true;
                    if (type3 == "mouseenter") didMouseEnter = true;
                    element.events[type3][jjj].call(element);
                  }
                }
              }
              if (!element.events[type]) continue;
              for (var k = 0; k < element.events[type].length; k++) {
                element.events[type][k].call(element);
              }
              return;
            }
          }

          if (previousActiveElement && type == "mousemove") {
            var types = ["mouseout", "mouseleave"];
            for (var kk = 0; kk < types.length; kk++) {
              var type2 = types[kk];
              if (!previousActiveElement.events[type2]) continue;
              for (var kkk = 0; kkk < previousActiveElement.events[type2].length; kkk++) {
                if (didMouseOver) didMouseOver = false;
                if (didMouseEnter) didMouseEnter = false;
                previousActiveElement.events[type2][kkk].call(previousActiveElement);
              }
            }
            previousActiveElement = null;
          }
        }
      });
    };

    this.Shape = function(data) {
      if (typeof data === "undefined") return null;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////
      //
      // Shape constructor code
      //
      this.type = data.type;
      this.color = data.color;
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
        }
      }
    };

    this.Layer = function(layerName, position) {
      if (typeof layerName === "undefined") return null;

      var thisLayer = this;

      this.Element = function(attributes) {
        if (typeof attributes === "undefined") return null;

        var thisElement = this;
        thisElement.events = {};

        this.on = function(eventType, listener) {
          if (typeof availableEvents[eventType] === "undefined") {
            if (typeof availableEvents["mousemove"] === "undefined" && eventType == "mouseover" || eventType == "mouseenter") {
              availableEvents["mousemove"] = true;
              thisRenderer.addEvents("mousemove");
              if (typeof thisElement.events["mousemove"] === "undefined") {
                thisElement.events["mousemove"] = [];
                thisElement.events["mousemove"].push(function() {});
              }
            }

            availableEvents[eventType] = true;
            thisRenderer.addEvents(eventType);
          }
          if (typeof thisElement.events[eventType] === "undefined") {
            thisElement.events[eventType] = [];
          }
          thisElement.events[eventType].push(listener);
        };

        this.attrs = attributes;
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
        thisLayer.rePosition(0);
      };

      this.rePosition = function(position) {
        thisLayer.canvas.insertAfter(stage.children().eq(position-1));
      };

      this.rePositionElement = function(index, newPos) {
        var elements = thisLayer.elements;
        elements[index].attrs.x = newPos.x;
        elements[index].attrs.y = newPos.y;
      };

      // Draw all elements in a layer
      this.draw = function() {
        var ctx = thisLayer.ctx;
        ctx.clearRect(0, 0, thisLayer.width, thisLayer.height);
        var numElements = thisLayer.elements.length;
        var elements = thisLayer.elements;
        for (var i = 0; i < numElements; i++) {
          var shape = elements[i].attrs.shape;
          if (elements[i].attrs.visible && elements[i].attrs.x+shape.width >= 0 && elements[i].attrs.x <= thisLayer.width && elements[i].attrs.y+shape.height >= 0 && elements[i].attrs.y <= thisLayer.height) {
            ctx.drawImage(shapeCanvas, shape.position, 0, shape.width, shape.height, elements[i].attrs.x, elements[i].attrs.y, shape.width, shape.height);
          }
        }
      };

      this.addElement = function(data) {
        data.visible = (typeof data.visible !== 'undefined') ? data.visible : true;
        thisLayer.elements.push(data);
        return thisLayer.elements.length-1;
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

        this.addElement = function(data) {
          data.visible = thisGroup.visible;
          thisGroup.elementIndicies.push(thisLayer.addElement(data));
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
      if (typeof position === 'undefined')
        position = layers.length;

      this.name = layerName;
      this.elements = [];
      this.groups = [];
      this.width = baseLayer.width();
      this.height = baseLayer.height();

      var newCanvas = $('<canvas/>',{'id':layerName}).css({'background-color': "transparent", 'position': "absolute"}).prop({width: thisLayer.width, height: thisLayer.height});
      this.ctx = newCanvas.get(0).getContext("2d");
      this.canvas = newCanvas;
      layers.splice(position, 0, this);
      if (position === 0) {
        $(newCanvas).prependTo(stage);
      } else {
        $(newCanvas).insertAfter(stage.children().eq(position-1));
      }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Renderer constructor code
    //
    if (typeof stageName === "undefined" || typeof baseLayerId === "undefined") return null;
    stage = $('<div/>',{'id' : stageName}).css({width: "100%", height: "100%", position: "absolute", top: "0px", display: "inline-block", "pointer-events": "auto", "z-index": 1});
    $("#" + baseLayerId).prepend(stage);
    // Resize all the layers when the browser window changes size
    $(window).resize(function() {
      thisRenderer.resizeLayers();
    });

  };
})();
