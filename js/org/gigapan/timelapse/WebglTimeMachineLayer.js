/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Dependencies:
 *  org.gigapan.timelapse.Timelapse
 *
 * Copyright 2016 Carnegie Mellon University. All rights reserved.
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

// Pass EITHER
// 1. options.rootUrl: Root URL of directory for tiles
// OR
// 2. options.tileRootUrl: URL of directory containing tm.json (parent of tileRootUrl)
//    and various metadata (numFrames, fps, nLevels, video_width, video_height, width, height, optionally colormap, etc;  see index.html for examples)
//
// In option 1, metadata will be loaded from options.rootUrl/tm.json

function WebglTimeMachineLayer(glb, canvasLayer, options) {
  var that = this;
  this.glb = glb;
  this.gl = glb.gl;
  this._canvasLayer = canvasLayer;
  this._timelapse = this._canvasLayer.timelapse;
  $.extend(this, options);
  this._renumberDensely = false;
  this._ready = false;
  this._UTIL = org.gigapan.Util;

  if (options.colormap) {
    this._waitingForColormap = true;
    this._colormap = this._createTexture();
    this.image = new Image();
    this.image.crossOrigin = "anonymous";
    this.image.onload = this._handleLoadedColormap.bind(this);
    this.image.addEventListener('error', function(event) { console.log('ERROR:  cannot load colormap ' + that.image.src); });
    this.image.src = this.colormap;
  }

  if (this.rootUrl && !this.tileRootUrl) {
    this._waitingForMetadata = true;
    // Request metadata asynchronously from tm.json
    var tmPath = this.rootUrl + '/tm.json';
    tmPath = tmPath.replace(/([^:]\/)\/+/g, "$1");
    if (cached_ajax[tmPath]) {
      this.loadTm(cached_ajax[tmPath])
    } else {
      $.ajax({
        url: tmPath,
        dataType: 'json',
        success: this.loadTm.bind(this)
      });
    }
  } else if (!this.rootUrl && this.tileRootUrl) {
    // Assume we've been given all the metadata
    this.video_width = this.video_width || 1424;
    this.video_height = this.video_height || 800;
    console.assert(this.width && this.height && this.numFrames);
    this.loadMetadata();
  }
}

// Load metadata from tm.json
WebglTimeMachineLayer.prototype.loadTm = function(tm) {
  this._timelapse.setTmJSON(tm);
  var datasets = tm.datasets;
  var dataset;
  for (var i = 0; i < datasets.length; i++) {
    if (datasets[i].name == '600p') {
      dataset = datasets[i];
      break;
    }
  }
  if (!dataset) dataset = datasets[0];
  this._renumberDensely = !!dataset.renumberDensely;
  this.tileRootUrl = this.rootUrl + '/' + dataset.id;
  this.tileRootUrl = this.tileRootUrl.replace(/([^:]\/)\/+/g, "$1");
  var rPath = this.tileRootUrl + '/r.json';
  rPath = rPath.replace(/([^:]\/)\/+/g, "$1");
  if (cached_ajax[rPath]) {
    this.loadR(cached_ajax[rPath]);
  } else {
    $.ajax({
      url: rPath,
      dataType: 'json',
      success: this.loadR.bind(this)
    });
  }
};

// Load metadata from r.json
WebglTimeMachineLayer.prototype.loadR = function(r) {
  this._timelapse.setDatasetJSON(r);
  this.nlevels = r.nlevels;
  this.numFrames = r.frames;
  this.fps = r.fps;
  this.video_height = r.video_height;
  this.video_width = r.video_width;
  this.width = r.width;
  this.height = r.height;
  this.loadMetadata();
};

WebglTimeMachineLayer.prototype.loadMetadata = function() {
  this.mediaType = this.mediaType || '.mp4';
  this.defaultUrl = this.defaultUrl || this._UTIL.relUrlToAbsUrl(this.tileRootUrl + '/default' + this.mediaType);
  this.fps = this.fps || 10;

  var that = this;

  function createTile(ti, bounds) {
    var url;
    if (that._renumberDensely) {
      url = that.tileRootUrl + '/' + ti.l + '/' + ti.c + '/' + ti.r + that.mediaType;
    } else {
      url = that.tileRootUrl + '/' + ti.l + '/' + (ti.r * 4) + '/' + (ti.c * 4) + that.mediaType;
    }
    var tile = new WebglVideoTile(that.glb, ti, bounds, url, that.defaultUrl, that.numFrames, that.fps, that.greenScreen, that);
    return tile;
  }

  this._tileView = new TileView({
    panoWidth: this.width,
    panoHeight: this.height,
    tileWidth: this.video_width,
    tileHeight: this.video_height,
    createTile: createTile,
    deleteTile: function(tile) {},
    updateTile: WebglVideoTile.update,
    timelapse: this._canvasLayer.timelapse,
    projection: this.projection,
    maxLevelOverride: this.maxLevelOverride
  });

  this.destroy = function() {
    this._tileView._destroy();
  };

  this._waitingForMetadata = false;
  if (this.metadataLoadedCallback) {
    this.metadataLoadedCallback(this);
  }
  this._updateReady();
};

WebglTimeMachineLayer.prototype._createTexture = function() {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
};

WebglTimeMachineLayer.prototype._handleLoadedColormap = function() {
  var gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, this._colormap);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
  gl.bindTexture(gl.TEXTURE_2D, null);
  this._waitingForColormap = false;

  this._updateReady();
};

WebglTimeMachineLayer.prototype._updateReady = function() {
  this._ready = !(this._waitingForColormap || this._waitingForMetadata);
};

WebglTimeMachineLayer.prototype.resetDimensions = function(json) {
  this._tileView.resetDimensions(json);
};

WebglTimeMachineLayer.prototype.getWidth = function() {
  return this._tileView.getWidth();
};

WebglTimeMachineLayer.prototype.getHeight = function() {
  return this._tileView.getHeight();
};

WebglTimeMachineLayer.prototype.draw = function(view, tileViewVisibility) {
  if (!this._ready) return;
  var width = this._canvasLayer.canvas.width / this._canvasLayer.resolutionScale;
  var height = this._canvasLayer.canvas.height / this._canvasLayer.resolutionScale;

  var transform = new Float32Array([2/width,0,0,0, 0,-2/height,0,0, 0,0,0,0, -1,1,0,1]);
  this._UTIL.translateMatrix(transform, width*0.5, height*0.5);
  this._UTIL.scaleMatrix(transform, view.scale, view.scale);
  this._UTIL.translateMatrix(transform, -view.x, -view.y);

  // TODO: Refactor how tile views are initialized and drawn
  if (tileViewVisibility.videoTile) {
    // TODO: this needs further tweaking...
    if (this._timelapse.isMovingToWaypoint()) {
      // Moving to waypoint;  reduce level of detail
      this._tileView.levelThreshold = -1.5;
    } else {
      // Not moving to waypoint;  increase level of detail
      this._tileView.levelThreshold = 0;
    }
    if (typeof(EARTH_TIMELAPSE_CONFIG) != "undefined" && EARTH_TIMELAPSE_CONFIG.videoLevelThresholdModifier) {
      this._tileView.levelThreshold += EARTH_TIMELAPSE_CONFIG.videoLevelThresholdModifier;
    }
    this._tileView.setView(view, width, height, this._canvasLayer.resolutionScale);
    this._tileView.update(transform);
  }
};

WebglTimeMachineLayer.prototype.getTileView = function() {
  return this._tileView;
};

WebglTimeMachineLayer.prototype.getTiles = function() {
  return this._tileView._tiles;
};

WebglTimeMachineLayer.prototype.abortLoading = function() {
  this._tileView._abort();
};
