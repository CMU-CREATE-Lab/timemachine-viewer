// Copyright 2012 Carnegie Mellon University. All rights reserved.
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
// Author:
// Randy Sargent (randy.sargent@cs.cmu.edu)

var org;
org = org || {};
org.gigapan = org.gigapan || {};
org.gigapan.timelapse = org.gigapan.timelapse || {};

org.gigapan.timelapse.MercatorProjection = function(west, north, east, south, width, height) {
    var yScale = 1;
    var yOrigin = 0;
    function rawProjectLat(lat) {
	return Math.log((1+Math.sin(lat*Math.PI/180))/Math.cos(lat*Math.PI/180));
    }
    function rawUnprojectLat(y) {
	return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI;
    }
    function interpolate(x, fromLow, fromHigh, toLow, toHigh) {
	return (x - fromLow) / (fromHigh - fromLow) * (toHigh - toLow) + toLow;
    }
    this.latlngToPoint = function(latlng) {
	var x = interpolate(latlng.lng, west, east, 0, width);
	var y = interpolate(rawProjectLat(latlng.lat), rawProjectLat(north), rawProjectLat(south), 0, height);
        return {"x":x, "y":y};
    }
    this.pointToLatlng = function(point) {
	var lng = interpolate(point.x, 0, width, west, east);
	var lat = rawUnprojectLat(interpolate(point.y, 0, height, rawProjectLat(north), rawProjectLat(south)));
        return {"lat":lat, "lng":lng};
    }
}

   