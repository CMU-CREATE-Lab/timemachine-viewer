/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Class for managing a timelapse.
 *
 * Dependencies:
 *  None
 *
 * Copyright 2014 Carnegie Mellon University. All rights reserved.
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
 *  Randy Sargent (randy.sargent@cs.cmu.edu)
 *
 */

"use strict";

//
// VERIFY NAMESPACE
//

// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
org = org || {};
org.gigapan = org.gigapan || {};
org.gigapan.timelapse = org.gigapan.timelapse || {};
org.gigapan.timelapse.parabolicMotion = org.gigapan.timelapse.parabolicMotion || {};

org.gigapan.timelapse.parabolicMotion.Point3 = function(xInit, yInit, zInit) {
  var Point3 = org.gigapan.timelapse.parabolicMotion.Point3;
  this.x = xInit;
  this.y = yInit;
  this.z = zInit;
  this.eval = function(u) {
    return new Point3(this.x.eval(u), this.y.eval(u), this.z.eval(u));
  };
  this.toString = function() {
    return '(' + this.x + ',' + this.y + ',' + this.z + ')';
  };
  this.subtract = function(rhs) {
    return new Point3(this.x - rhs.x, this.y - rhs.y, this.z - rhs.z);
  };
  this.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  };
};

org.gigapan.timelapse.parabolicMotion.Point3.interpolate = function(a, b, frac) {
  function interpolate(a, b, frac) {
    return (b - a) * frac + a;
  }
  return new org.gigapan.timelapse.parabolicMotion.Point3(interpolate(a.x, b.x, frac),
                                   interpolate(a.y, b.y, frac),
                                   interpolate(a.z, b.z, frac));
};

// y = ax + b
org.gigapan.timelapse.parabolicMotion.Line2 = function(aInit, bInit) {
  this.a = aInit;
  this.b = bInit;

  this.eval = function(x) {
    return this.a * x + this.b;
  };

  this.toString = function() {
    return '(' + this.a + 'x+' + this.b + ')';
  };
};

org.gigapan.timelapse.parabolicMotion.Line2.fromIntercepts = function(x1, y1, x2, y2) {
  var a = (y1 - y2) / (x1 - x2);
  var b = y1 - a * x1;
  return new org.gigapan.timelapse.parabolicMotion.Line2(a, b);
};

org.gigapan.timelapse.parabolicMotion.Line2.fromIntercepts = function(x1, y1, x2, y2) {
  var a = (y1 - y2) / (x1 - x2);
  var b = y1 - a * x1;
  return new org.gigapan.timelapse.parabolicMotion.Line2(a, b);
};

// Simplified parabola y = ax^2 + c
// Vertex is at (0, c)
// Intersects (+-1, c + a)
org.gigapan.timelapse.parabolicMotion.Parabola2 = function(aInit, cInit) {
  this.a = aInit;
  this.c = cInit;

  this.eval = function(x) {
    return this.a * x * x + this.c;
  };

  this.toString = function() {
    return '(' + this.a + '(x^2)+' + this.c + ')';
  };
};

org.gigapan.timelapse.parabolicMotion.hypot = function(a, b) {
  return Math.sqrt(a * a + b * b);
};

// Compute path from a to b and return as an array of parabolicMotion.Point3
// a: Start of path (parabolicMotion.Point3)
// b: End of path (parabolicMotion.Point3)
org.gigapan.timelapse.parabolicMotion.computeParabolicPath = function(a, b) {
  var parabolicMotion = org.gigapan.timelapse.parabolicMotion, Point3 = parabolicMotion.Point3, Line2 = parabolicMotion.Line2, Parabola2 = parabolicMotion.Parabola2;

  // First, compute a "context point" from which both a and b are visible
  var xydist = parabolicMotion.hypot(a.x - b.x, a.y - b.y);
  var zdist = Math.abs(a.z - b.z);
  var ctx_height = 0.5 * (xydist - zdist);
  var path = [];

  if (ctx_height > 0) {
    // Zoom out from a to the context point (parabola vertex) and then zoom in to b
    var ctx_z = ctx_height + Math.max(a.z, b.z);
    var ctx = Point3.interpolate(a, b, (ctx_z - a.z) / xydist);
    ctx.z = ctx_z;
    var p1 = new Point3(Line2.fromIntercepts(-1, a.x, 0, ctx.x),
                        Line2.fromIntercepts(-1, a.y, 0, ctx.y),
                        new Parabola2(a.z - ctx.z, ctx.z));
    var p2 = new Point3(Line2.fromIntercepts(0, ctx.x, 1, b.x),
                        Line2.fromIntercepts(0, ctx.y, 1, b.y),
                        new Parabola2(b.z - ctx.z, ctx.z));

    for (var u = -10; u < 0; u++) {
      path.push(p1.eval(u * 0.1));
    }
    for (var u = 0; u <= 10; u++) {
      path.push(p2.eval(u * 0.1));
    }
    return path;
  } else if (2 * xydist > zdist + 1e-10) {
    // No context point, but can follow parabolic zoom in or out without vertex
    if (a.z < b.z) {
      // This code only works for zooming in;  convert zooming out to zooming in
      return parabolicMotion.computeParabolicPath(b, a).reverse();
    }
    var c = (xydist * xydist) / (2.0 * xydist - zdist);
    var p = new Point3(Line2.fromIntercepts(c - xydist, a.x, c, b.x),
                       Line2.fromIntercepts(c - xydist, a.y, c, b.y),
                       new Parabola2(-1.0 / c, c + b.z));

    for (var u = 0; u <= 10; u++) {
      path.push(p.eval(c - xydist + xydist * u * 0.1));
    }
    return path;
  } else {
    // Zoom is much larger than translation;  go in a straight line
    return [a, b];
  }
};

// Compute "zoom length" of segment from p1 to p1 + frac * p2 - p1
// Zoom length is path length scaled inversely with z,
// since apparent motion on screen also varies inversely with z
org.gigapan.timelapse.parabolicMotion.fractionalZoomLength = function(p1, p2, frac) {
  var length = p1.subtract(p2).length();
  var dz = p2.z - p1.z;
  if (Math.abs(dz) < 1e-10) {
    return frac * length / p1.z;
  } else {
    return length / dz * (Math.log(dz * frac + p1.z) - Math.log(p1.z));
  }
};

// Compute "zoom length" of segment from p1 to p2.
// Zoom length is path length scaled inversely with z,
// since apparent motion on screen also varies inversely with z
org.gigapan.timelapse.parabolicMotion.zoomLength = function(p1, p2) {
  return org.gigapan.timelapse.parabolicMotion.fractionalZoomLength(p1, p2, 1);
};

// Compute point that's dist zoom distance from p1 along the path to p2.
org.gigapan.timelapse.parabolicMotion.zoomInterpolate = function(p1, p2, dist) {
  var length = p1.subtract(p2).length();
  var dz = p2.z - p1.z;
  var frac;
  if (Math.abs(dz) < 1e-10) {
    frac = dist / length * p1.z;
  } else {
    frac = (Math.exp(dz * dist / length + Math.log(p1.z)) - p1.z) / dz;
  }
  return org.gigapan.timelapse.parabolicMotion.Point3.interpolate(p1, p2, frac);
};

// TODO(rsargent): move the 0.4 scale into computeParabolicPath?
org.gigapan.timelapse.parabolicMotion.viewToPixelPoint = function(viewportWidth, viewportHeight, view) {
  var sizeInPixels = 0.5 * (viewportWidth + viewportHeight);
  return new org.gigapan.timelapse.parabolicMotion.Point3(view.x, view.y, 0.4 * sizeInPixels / view.scale);
};

org.gigapan.timelapse.parabolicMotion.pixelPointToView = function(viewportWidth, viewportHeight, pt) {
  var sizeInPixels = 0.5 * (viewportWidth + viewportHeight);
  return {x: pt.x, y: pt.y, scale: 0.4 * sizeInPixels / pt.z};
};

org.gigapan.timelapse.parabolicMotion.MotionController = function(settings) {
  var parabolicMotion = org.gigapan.timelapse.parabolicMotion;
  this.animationFPS = settings.animationFPS || 30;
  this.animateCallback = settings.animateCallback;
  this.onCompleteCallback = settings.onCompleteCallback;
  this.moveAlongPath = function(path) {
    this.path = path;
    this.pathProgress = 0;
    this.pathSpeed = settings.pathSpeed || 1.5; // screen fraction per second
    this.animateLastTime = new Date().getTime();
    //console.log('MotionController.moveAlongPath(' + path.map(function(x) {return x.toString()}).join(',') + ')');
    this._animate();
    this._enableAnimation();
  };
  this._animate = function() {
    // TODO: measure deltaTime instead of assuming we're called at the requested intervals
    var deltaTime = 1.0 / this.animationFPS; // seconds
    this.pathProgress += deltaTime * this.pathSpeed;
    while (this.path.length >= 2 && this.pathProgress > parabolicMotion.zoomLength(this.path[0], this.path[1])) {
      this.pathProgress -= parabolicMotion.zoomLength(this.path[0], this.path[1]);
      this.path.shift();
    }
    if (this.path.length == 0) {
      this._disableAnimation();
    }
    else if (this.path.length == 1) {
      this.animateCallback(this.path.shift());
      this._disableAnimation();
      this.onCompleteCallback();
    } else {
      this.animateCallback(parabolicMotion.zoomInterpolate(this.path[0], this.path[1], this.pathProgress));
    }
  };
  this._enableAnimation = function() {
    var self = this;
    if (!this._animationInterval) {
      this._animationInterval = setInterval(function() { self._animate(); }, 1000.0 / this.animationFPS);
    }
  };
  this._disableAnimation = function() {
    if (this._animationInterval) {
      clearInterval(this._animationInterval);
      this._animationInterval = null;
    }
  };
};
