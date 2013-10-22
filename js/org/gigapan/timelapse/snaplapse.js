// @license
// Redistribution and use in source and binary forms ...

// Class for managing a snaplapse.
//
// Dependencies:
// * org.gigapan.Util
// * org.gigapan.timelapse.Timelapse
// * Math.uuid (http://www.broofa.com/blog/?p=151)
//
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
//
// VERIFY NAMESPACE
//

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

if (!org.gigapan.Util) {
  var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Snaplapse";
  alert(noUtilMsg);
  throw new Error(noUtilMsg);
}
if (!org.gigapan.timelapse.Timelapse) {
  var noVideosetMsg = "The org.gigapan.timelapse.Videoset library is required by org.gigapan.timelapse.Snaplapse";
  alert(noVideosetMsg);
  throw new Error(noVideosetMsg);
}
if (!Math.uuid) {
  var noMathUUID = "The Math.uuid library is required by org.gigapan.timelapse.Snaplapse";
  alert(noMathUUID);
  throw new Error(noMathUUID);
}

//
// CODE
//

(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.Snaplapse = function(composerDivId, timelapse, settings) {

    var viewer;
    var eventListeners = {};
    var keyframes = [];
    var keyframesById = {};
    var keyframeIntervals = [];
    var currentKeyframeInterval = null;
    var isCurrentlyPlaying = false;
    var warpStartingTime = null;
    var timeCounterIntervalHandle = null;
    var thisObj = this;
    var $composerDivObj = $("#" + composerDivId);
    var viewerDivId = timelapse.getViewerDivId();
    var captureTimes = timelapse.getCaptureTimes();

    var loadJSON;
    var loadKeyframesLength;
    var waitFor_timeout;
    var waitForSeek_timeout;
    var waitForStart = false;
    var waitForEnd = true;
    var currentWaitDuration = {
      start: 0,
      end: 0
    };
    var currentWaitForExtraStart = false;
    var extraWaitForStartDuration = 0;
    var startingPlaybackRate = 1;

    var TOUR_SHARING_VERSION = 3;

    var _clearSnaplapse = function() {

      if (thisObj.isPlaying) {
        thisObj.stop();
      }

      if (keyframes.length > 0) {
        $("#" + viewerDivId + " .tourLoadOverlay").hide();
        if ($("#" + viewerDivId + " .snaplapseTourPlayBack").children().length > 1) {
          $("#" + viewerDivId + " .snaplapseTourPlayBack").empty();
        }
        $("#" + viewerDivId + " .snaplapseTourPlayBack").hide();

        if ($("#" + viewerDivId + "_customTimeline").is(':hidden')) {
          viewer.showViewerUI();
        }
        $("#" + viewerDivId + " .tourLoadOverlay").remove();
        $("#" + viewerDivId).append('<div class="tourLoadOverlay"><div class="tourLoadOverlayTitleContainer"><div class="tourLoadOverlayTitle"></div></div><img class="tourLoadOverlayPlay" title="Click to start the tour" src="images/tour_play_outline.png"></div></div>');
        viewer.initializeTourOverlyUI();
      }

      keyframes.length = 0;
      keyframesById = {};
      keyframeIntervals.length = 0;
      currentKeyframeInterval = null;
      warpStartingTime = null;
      timeCounterIntervalHandle = null;
      if (timelapse.getVisualizer())
        timelapse.getVisualizer().deleteAllTags();

    };
    this.clearSnaplapse = _clearSnaplapse;

    this.getComposerDivId = function() {
      return composerDivId;
    };

    // This is used for pausing the video at the beginning or end
    var resetWaitFlags = function() {
      clearTimeout(waitFor_timeout);
      clearTimeout(waitForSeek_timeout);
      waitForStart = false;
      waitForEnd = true;
    };

    // Hide the transition area for the last key frame on the UI
    var hideLastKeyframeTransition = function() {
      var $keyframeItems = $("#" + composerDivId + " .snaplapse_keyframe_list > .ui-selectee");
      var numItems = $keyframeItems.size();
      // Unhide the transition options
      var $keyframeItems_show = $keyframeItems.eq(numItems - 2);
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

    // Every time user updates a parameter, try to build the interval
    // TODO: change the function of buildPreviousFlag to buildCurrentAndPreviousFlag
    var tryBuildKeyframeInterval_refreshKeyframeParas = function(keyframeId, buildPreviousFlag) {
      var idx;
      var isFirstKeyframe = false;
      for (var i = 0; i < keyframes.length; i++) {
        if (keyframeId == keyframes[i]['id']) {
          idx = i;
          break;
        }
      }
      var keyframeInterval, keyframeToBuild;
      if (buildPreviousFlag) {
        if (idx == 1) {
          isFirstKeyframe = true;
        }
        keyframeToBuild = keyframes[idx - 1];
        if ( typeof (keyframeToBuild) != "undefined" && keyframeToBuild != null && typeof (keyframes[idx]) != "undefined" && keyframes[idx] != null) {
          keyframeInterval = new org.gigapan.timelapse.KeyframeInterval(keyframeToBuild, keyframes[idx], null, timelapse.getDuration(), composerDivId, keyframeToBuild['buildConstraint'], isFirstKeyframe, timelapse, settings);
        }
      } else {
        if (idx == 0) {
          isFirstKeyframe = true;
        }
        keyframeToBuild = keyframes[idx];
        if ( typeof (keyframeToBuild) != "undefined" && keyframeToBuild != null && typeof (keyframes[idx + 1]) != "undefined" && keyframes[idx + 1] != null) {
          keyframeInterval = new org.gigapan.timelapse.KeyframeInterval(keyframeToBuild, keyframes[idx + 1], null, timelapse.getDuration(), composerDivId, keyframeToBuild['buildConstraint'], isFirstKeyframe, timelapse, settings);
        }
      }
    };

    this.setSpeedForKeyframe = function(keyframeId, speed) {
      if (keyframeId && keyframesById[keyframeId]) {
        keyframesById[keyframeId]['speed'] = speed;
      }
      tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);
      return keyframesById[keyframeId];
    };

    this.setBuildConstraintForKeyframe = function(keyframeId, buildConstraint) {
      if (keyframeId && keyframesById[keyframeId]) {
        keyframesById[keyframeId]['buildConstraint'] = buildConstraint;
      }
      tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);
      return keyframesById[keyframeId];
    };

    this.setLoopTimesForKeyframe = function(keyframeId, loopTimes) {
      if (keyframeId && keyframesById[keyframeId]) {
        keyframesById[keyframeId]['loopTimes'] = loopTimes;
      }
      tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);
      return keyframesById[keyframeId];
    };

    this.setLoopDwellTimeForKeyframe = function(keyframeId, startDwell, endDwell) {
      if (keyframeId && keyframesById[keyframeId]) {
        if (startDwell)
          keyframesById[keyframeId]['waitStart'] = startDwell;
        if (endDwell)
          keyframesById[keyframeId]['waitEnd'] = endDwell;
      }
      tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);
    };

    this.setTextAnnotationForKeyframe = function(keyframeId, description, isDescriptionVisible) {
      if (keyframeId && keyframesById[keyframeId]) {
        if (description != undefined) {
          keyframesById[keyframeId]['unsafe_string_description'] = description;
        }
        keyframesById[keyframeId]['is-description-visible'] = isDescriptionVisible;
        return true;
      }
      return false;
    };

    var sanitizeDuration = function(rawDuration) {
      if ( typeof rawDuration != 'undefined' && rawDuration != null) {
        var rawDurationStr = rawDuration + '';
        if (rawDurationStr.length > 0) {
          var num = parseFloat(rawDurationStr);
          if (!isNaN(num) && (num >= 0)) {
            return num.toFixed(1) - 0;
          }
        }
      }
      return null;
    };

    this.setDurationForKeyframe = function(keyframeId, duration) {
      if (keyframeId && keyframesById[keyframeId]) {
        keyframesById[keyframeId]['duration'] = sanitizeDuration(duration);
      }
      tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);
      return keyframesById[keyframeId];
    };

    this.resetDurationBlockForKeyframe = function(keyframeId) {
      if (keyframeId && keyframesById[keyframeId]) {
        keyframesById[keyframeId]['buildConstraint'] = "duration";
        keyframesById[keyframeId]['waitStart'] = 0.5;
        keyframesById[keyframeId]['waitEnd'] = 0.5;
        keyframesById[keyframeId]['speed'] = null;
        keyframesById[keyframeId]['loopTimes'] = 0;
        if (settings["enableCustomUI"])
          keyframesById[keyframeId]['duration'] = 2;
        else
          keyframesById[keyframeId]['duration'] = null;
      }
      tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);
      return keyframesById[keyframeId];
    };

    this.resetSpeedBlockForKeyframe = function(keyframeId) {
      if (keyframeId && keyframesById[keyframeId]) {
        keyframesById[keyframeId]['buildConstraint'] = "speed";
        keyframesById[keyframeId]['waitStart'] = 0.5;
        keyframesById[keyframeId]['waitEnd'] = 0.5;
        keyframesById[keyframeId]['duration'] = null;
        keyframesById[keyframeId]['speed'] = 100;
        if (settings["enableCustomUI"])
          keyframesById[keyframeId]['loopTimes'] = 2;
        else
          keyframesById[keyframeId]['loopTimes'] = 0;
      }
      tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);
      return keyframesById[keyframeId];
    };

    this.updateTimeAndPositionForKeyframe = function(keyframeId) {
      if (keyframeId && keyframesById[keyframeId]) {
        var bounds = timelapse.getBoundingBoxForCurrentView();
        var keyframe = keyframesById[keyframeId];
        keyframe['time'] = org.gigapan.timelapse.Snaplapse.normalizeTime(timelapse.getCurrentTime());
        keyframe['captureTime'] = timelapse.getCurrentCaptureTime();
        keyframe['bounds'] = {};
        keyframe['bounds'].xmin = bounds.xmin;
        keyframe['bounds'].ymin = bounds.ymin;
        keyframe['bounds'].xmax = bounds.xmax;
        keyframe['bounds'].ymax = bounds.ymax;

        var index = keyframes.length;
        for (var j = 0; j < keyframes.length; j++) {
          if (keyframeId == keyframes[j]['id']) {
            index = j;
            break;
          }
        }

        // Build current keyframe
        resetKeyframe(keyframe);
        tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);

        // Build previous keyframe
        if (keyframes[index - 1]) {
          resetKeyframe(keyframes[index - 1]);
          tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId, true);
        }

        if (timelapse.getVisualizer()) {
          timelapse.getVisualizer().deleteTimeTag(keyframeId, keyframes[index - 1]);
          timelapse.getVisualizer().addTimeTag(keyframes, index);
        }
        var tagColor = timelapse.getTagColor();
        var color_head = "rgba(" + tagColor[0] + "," + tagColor[1] + "," + tagColor[2] + ",";

        // Events should be fired at the end of this function
        var listeners = eventListeners['keyframe-modified'];
        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            try {
              listeners[i](cloneFrame(keyframe));
            } catch(e) {
              UTIL.error(e.name + " while calling snaplapse 'keyframe-modified' event listener: " + e.message, e);
            }
          }
        }

        return color_head;
      }
    };

    this.deleteKeyframeById = function(keyframeId) {
      if (keyframeId && keyframesById[keyframeId]) {
        var indexToDelete = -1;
        for (var i = 0; i < keyframes.length; i++) {
          if (keyframeId == keyframes[i]['id']) {
            indexToDelete = i;
            break;
          }
        }
        keyframes.splice(indexToDelete, 1);
        delete keyframesById[keyframeId];

        if (keyframes[indexToDelete - 1]) {
          var previousKeyframe = keyframes[indexToDelete - 1];
          if (previousKeyframe['buildConstraint'] == "duration")
            previousKeyframe['speed'] = null;
          else if (previousKeyframe['buildConstraint'] == "speed")
            previousKeyframe['duration'] = null;
          tryBuildKeyframeInterval_refreshKeyframeParas(previousKeyframe['id']);
        }
        hideLastKeyframeTransition();
        if (timelapse.getVisualizer())
          timelapse.getVisualizer().deleteTimeTag(keyframeId, keyframes[indexToDelete - 1]);
        return true;
      }
      return false;
    };

    timelapse.getVideoset().addEventListener('stall-status-change', function(isStalled) {
      if (isCurrentlyPlaying) {
        if (isStalled) {
          UTIL.log("videoset stall-status-change listener: pausing time warp time counter interval");
          pauseTimeCounterInterval();
        } else {
          UTIL.log("videoset stall-status-change listener: resuming time warp time counter interval");
          stopTimeCounterInterval();
          resumeTimeCounterInterval();
        }
      }
    });

    this.getAsUrlString = function() {
      try {
        var encoder = new org.gigapan.timelapse.UrlEncoder();
        // Version
        encoder.write_uint(TOUR_SHARING_VERSION);
        // Number of keyframes
        encoder.write_uint(keyframes.length);
        var projection = timelapse.getProjection();
        for (var i = 0; i < keyframes.length; i++) {
          // Number of loops
          var loopTimes;
          var buildConstraint = keyframes[i]['buildConstraint'];
          if (buildConstraint == "speed") {
            // Use the trick to save the build constraint to speed
            loopTimes = keyframes[i]['loopTimes'] ? keyframes[i]['loopTimes'] + 1 : 1;
          } else if (buildConstraint == "duration") {
            // Use the trick to save the build constraint to duration
            loopTimes = 0;
          }
          encoder.write_uint(loopTimes);
          // Duration OR speed
          if (buildConstraint == "duration") {
            var duration = ( typeof keyframes[i]['duration'] == 'undefined') ? 0 : keyframes[i]['duration'];
            encoder.write_udecimal(duration, 2);
          } else if (buildConstraint == "speed") {
            var speed = ( typeof keyframes[i]['speed'] == 'undefined') ? 100 : keyframes[i]['speed'];
            encoder.write_uint(speed);
          }
          // Frame Number
          encoder.write_uint(Math.floor(keyframes[i]['time'] * timelapse.getFps()));
          // Lat/Lng center view
          var viewCenter = timelapse.computeViewFit(keyframes[i]['bounds']);
          var latLng = projection.pointToLatlng({
            x: viewCenter.x,
            y: viewCenter.y
          });
          var zoom = timelapse.scaleToZoom(viewCenter.scale);
          encoder.write_lat(latLng.lat);
          encoder.write_lon(latLng.lng);
          encoder.write_udecimal(zoom, 2);
          // Keyframe description
          encoder.write_string(keyframes[i]['unsafe_string_description']);
        }
        // Tour title
        var title = $("#" + composerDivId + " .saveTimewarpWindow_tourTitleInput").val();
        encoder.write_string(title);
        // Checksum
        encoder.write_uint(1);
        return encoder.encoded;
      } catch(e) {
        UTIL.error("Error saving snaplapse as URL: " + e.message, e);
      }
    };

    // Variables storing the return value of encoder.read_unsafe_string() must follow the convention
    // of being appended with "unsafe_string_" to ensure awareness that they may contain
    // potentially unsafe user inputted data.
    // It is then up to developer judgment to consider how these strings will be used.
    this.urlStringToJSON = function(urlString) {
      try {
        var encoder = new org.gigapan.timelapse.UrlEncoder(urlString);
        var projection = timelapse.getProjection();
        // Decode version
        var version = encoder.read_uint();
        // Decode number of keyframes
        var numKeyFrames = encoder.read_uint();
        var snaplapseJSON = {};
        var tmJSON = timelapse.getTmJSON();
        snaplapseJSON['snaplapse'] = {};
        if (tmJSON['name']) {
          snaplapseJSON['snaplapse']['dataset-name'] = tmJSON['name'];
        }
        if (tmJSON['projection-bounds']) {
          snaplapseJSON['snaplapse']['projection'] = timelapse.getProjectionType();
          snaplapseJSON['snaplapse']['projection-bounds'] = tmJSON['projection-bounds'];
        }
        snaplapseJSON['snaplapse']['pixel-bounds'] = {
          xmin: 0,
          ymin: 0,
          xmax: timelapse.getPanoWidth(),
          ymax: timelapse.getPanoHeight()
        };
        snaplapseJSON['snaplapse']['source-duration'] = timelapse.getDuration();
        var fps = timelapse.getFps();
        snaplapseJSON['snaplapse']['fps'] = fps;
        var keyframes = [];

        for (var i = 0; i < numKeyFrames; i++) {
          var frame = {};
          frame["id"] = Math.uuid(20);
          // Decode number of loops
          // For version 3, if numLoops == -1, it means the constraint is duration
          var numLoops = encoder.read_uint() - 1;
          if (version <= 2)
            frame["buildConstraint"] = (numLoops == 0) ? "duration" : "speed";
          else
            frame["buildConstraint"] = (numLoops < 0) ? "duration" : "speed";
          frame["loopTimes"] = numLoops;
          // Decode duration OR speed
          if (frame["buildConstraint"] == "duration") {
            frame["duration"] = encoder.read_udecimal(2);
            frame["speed"] = null;
          } else if (frame["buildConstraint"] == "speed") {
            frame["speed"] = encoder.read_uint();
            frame["duration"] = null;
          }
          frame["waitStart"] = 0.5;
          frame["waitEnd"] = 0.5;
          // Decode frame number
          var frameNumber = encoder.read_uint();
          frame["time"] = frameNumber / fps;
          frame["captureTime"] = captureTimes[frameNumber];
          // Decode center
          var pointCenter = projection.latlngToPoint({
            lat: encoder.read_lat(),
            lng: encoder.read_lon()
          });
          // Decode zoom
          var zoom = encoder.read_udecimal(2);
          var centerView = {
            "x": pointCenter.x,
            "y": pointCenter.y,
            "scale": timelapse.zoomToScale(zoom)
          };
          var bbox = timelapse.computeBoundingBox(centerView);
          frame["bounds"] = {};
          frame["bounds"]["xmin"] = bbox.xmin;
          frame["bounds"]["ymin"] = bbox.ymin;
          frame["bounds"]["xmax"] = bbox.xmax;
          frame["bounds"]["ymax"] = bbox.ymax;
          // Decode keyframe subtitle
          frame["unsafe_string_description"] = encoder.read_unsafe_string();
          frame["is-description-visible"] = frame["unsafe_string_description"] ? true : false;
          keyframes.push(frame);
        }
        var checksum;
        if (version >= 2) {
          // Decode tour title
          snaplapseJSON['snaplapse']['unsafe_string_title'] = encoder.read_unsafe_string();
          // Decode checksum
          checksum = encoder.read_uint();
        } else if (version == 1) {
          // Decode checksum
          checksum = encoder.read_uint();
        }
        if (checksum != 1)
          throw new Error("Invalid checksum found in tour URL. The tour is either invalid or corrupted.");
        snaplapseJSON['snaplapse']['keyframes'] = keyframes;
        return JSON.stringify(snaplapseJSON, null, 3);
      } catch(e) {
        UTIL.error("Error converting snaplapse URL to JSON: " + e.message, e);
      }
    };

    this.getAsJSON = function() {
      var snaplapseJSON = {};
      var tmJSON = timelapse.getTmJSON();
      snaplapseJSON['snaplapse'] = {};
      if (tmJSON['name']) {
        snaplapseJSON['snaplapse']['dataset-name'] = tmJSON['name'];
      }
      if (tmJSON['projection-bounds']) {
        snaplapseJSON['snaplapse']['projection'] = timelapse.getProjectionType();
        snaplapseJSON['snaplapse']['projection-bounds'] = tmJSON['projection-bounds'];
      }
      snaplapseJSON['snaplapse']['pixel-bounds'] = {
        xmin: 0,
        ymin: 0,
        xmax: timelapse.getPanoWidth(),
        ymax: timelapse.getPanoHeight()
      };
      snaplapseJSON['snaplapse']['source-duration'] = timelapse.getDuration();
      snaplapseJSON['snaplapse']['fps'] = timelapse.getFps();
      snaplapseJSON['snaplapse']['keyframes'] = keyframes;
      for (var i = 0; i < keyframes.length; i++) {
        delete snaplapseJSON['snaplapse']['keyframes'][i]["timeTagBot"];
        delete snaplapseJSON['snaplapse']['keyframes'][i]["timeTagRight"];
        delete snaplapseJSON['snaplapse']['keyframes'][i]["timeTagTimewarp"];
        delete snaplapseJSON['snaplapse']['keyframes'][i]["timeTagNavigation"];
      }
      return JSON.stringify(snaplapseJSON, null, 3);
    };

    // The function loads a keyframe everytime it get called
    // e.g. loadFromJSON(json, 0), loadFromJSON(undefined, 1), loadFromJSON(undefined, 2)...
    this.loadFromJSON = function(json, loadIndex) {
      try {
        if (json != undefined) {
          $(document.body).append('<div class="loadingOverlay"></div>');
          $(document.body).css("cursor", "wait");
          loadJSON = JSON.parse(json);
          _clearSnaplapse();
          var tourTitle = loadJSON['snaplapse']['unsafe_string_title'] ? loadJSON['snaplapse']['unsafe_string_title'] : "Untitled";
          // Add the tour title to the save dialogue
          $("#" + composerDivId + " .saveTimewarpWindow_tourTitleInput").val(tourTitle);
          // Add the tour title to be used during tour playback
          $("#" + viewerDivId + " .tourLoadOverlayTitle").text("Tour: " + tourTitle);
        }
        if ( typeof (loadJSON['snaplapse']) != 'undefined' && typeof (loadJSON['snaplapse']['keyframes']) != 'undefined') {
          UTIL.log("Found [" + loadJSON['snaplapse']['keyframes'].length + "] keyframes in the json:\n\n" + json);
          var keyframe = loadJSON['snaplapse']['keyframes'][loadIndex];
          if (json != undefined)
            loadKeyframesLength = loadJSON['snaplapse']['keyframes'].length;
          if ( typeof keyframe['time'] != 'undefined' && typeof keyframe['bounds'] != 'undefined' && typeof keyframe['bounds']['xmin'] != 'undefined' && typeof keyframe['bounds']['ymin'] != 'undefined' && typeof keyframe['bounds']['xmax'] != 'undefined' && typeof keyframe['bounds']['ymax'] != 'undefined') {
            // NOTE: if is-description-visible is undefined, then we define it as *true* in order to maintain
            // backward compatibility with older time warps which don't have this property.
            this.recordKeyframe(null, keyframe['time'], keyframe['bounds'], keyframe['unsafe_string_description'], ( typeof keyframe['is-description-visible'] == 'undefined') ? true : keyframe['is-description-visible'], keyframe['duration'], true, keyframe['buildConstraint'], keyframe['speed'], keyframe['loopTimes'], keyframe['waitStart'], keyframe['waitEnd'], loadKeyframesLength);
          } else {
            UTIL.error("Ignoring invalid keyframe during snaplapse load.");
          }
        } else {
          UTIL.error("Invalid snaplapse file.");
          $(".loadingOverlay").remove();
          $(document.body).css("cursor", "default");
          return false;
        }
      } catch(e) {
        UTIL.error("Invalid snaplapse file.\n\n" + e.name + " while parsing snaplapse JSON: " + e.message, e);
        $(".loadingOverlay").remove();
        $(document.body).css("cursor", "default");
        return false;
      }
      return true;
    };

    this.duplicateKeyframe = function(idOfSourceKeyframe) {
      var keyframeCopy = this.getKeyframeById(idOfSourceKeyframe);
      this.recordKeyframe(idOfSourceKeyframe, keyframeCopy['time'], keyframeCopy['bounds'], keyframeCopy['unsafe_string_description'], keyframeCopy['is-description-visible'], keyframeCopy['duration'], false, keyframeCopy['buildConstraint'], keyframeCopy['speed'], keyframeCopy['loopTimes'], keyframeCopy['waitStart'], keyframeCopy['waitEnd'], undefined);
    };

    this.recordKeyframe = function(idOfKeyframeToAppendAfter, time, bounds, description, isDescriptionVisible, duration, isFromLoad, buildConstraint, speed, loopTimes, waitStart, waitEnd, loadKeyframesLength) {
      if ( typeof bounds == 'undefined') {
        bounds = timelapse.getBoundingBoxForCurrentView();
      }
      var isKeyframeFromLoad = ( typeof isFromLoad == 'undefined') ? false : isFromLoad;

      // Create the new keyframe
      var keyframeId = Math.uuid(20);
      var keyframe = {};
      keyframe['id'] = keyframeId;
      keyframe['buildConstraint'] = ( typeof buildConstraint == 'undefined') ? "speed" : buildConstraint;
      keyframe['loopTimes'] = loopTimes;
      keyframe['speed'] = speed;
      keyframe['waitStart'] = waitStart;
      keyframe['waitEnd'] = waitEnd;
      keyframe['time'] = org.gigapan.timelapse.Snaplapse.normalizeTime(( typeof time == 'undefined') ? timelapse.getCurrentTime() : time);
      var frameNumber = Math.floor(keyframe['time'] * timelapse.getFps());
      keyframe['captureTime'] = captureTimes[frameNumber];
      keyframe['bounds'] = {};
      keyframe['bounds'].xmin = bounds.xmin;
      keyframe['bounds'].ymin = bounds.ymin;
      keyframe['bounds'].xmax = bounds.xmax;
      keyframe['bounds'].ymax = bounds.ymax;
      keyframe['duration'] = sanitizeDuration(duration);
      keyframe['unsafe_string_description'] = ( typeof description == 'undefined') ? '' : description;
      keyframe['is-description-visible'] = ( typeof isDescriptionVisible == 'undefined') ? false : isDescriptionVisible;

      // Determine where the new keyframe will be inserted
      var insertionIndex = keyframes.length;
      if ( typeof idOfKeyframeToAppendAfter != 'undefined' && idOfKeyframeToAppendAfter != null) {
        for (var j = 0; j < keyframes.length; j++) {
          if (idOfKeyframeToAppendAfter == keyframes[j]['id']) {
            insertionIndex = j + 1;
            break;
          }
        }
      }
      keyframes.splice(insertionIndex, 0, null);
      keyframes[insertionIndex] = keyframe;
      keyframesById[keyframeId] = keyframe;

      // We build the keyframe and compute all parameters

      // Builds the current keyframe interval
      if (!isKeyframeFromLoad)
        resetKeyframe(keyframe);
      tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId);

      // Builds the previous keyframe interval
      if (keyframes[insertionIndex - 1]) {
        if (!isKeyframeFromLoad)
          resetKeyframe(keyframes[insertionIndex - 1]);
        tryBuildKeyframeInterval_refreshKeyframeParas(keyframeId, true);
      }

      if (!isKeyframeFromLoad) {
        if (timelapse.getVisualizer())
          timelapse.getVisualizer().addTimeTag(keyframes, insertionIndex);
      }

      // Events should be fired at the end of this function
      var eventType = isKeyframeFromLoad ? 'keyframe-loaded' : 'keyframe-added';
      var listeners = eventListeners[eventType];
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](cloneFrame(keyframe), insertionIndex, keyframes, loadKeyframesLength);
          } catch(e) {
            UTIL.error(e.name + " while calling snaplapse '" + eventType + "' event listener: " + e.message, e);
          }
        }
      }
    };

    var resetKeyframe = function(keyframe) {
      if (keyframe['buildConstraint'] == "duration") {
        keyframe['speed'] = null;
        keyframe['loopTimes'] = 0;
      } else if (keyframe['buildConstraint'] == "speed") {
        keyframe['duration'] = null;
      }
    };

    this.getKeyframes = function() {
      var keyframesClone = [];
      for (var i = 0; i < keyframes.length; i++) {
        keyframesClone[i] = cloneFrame(keyframes[i]);
      }
      return keyframesClone;
    };

    var buildKeyframeIntervals = function(startingKeyframeIndex) {
      UTIL.log("buildKeyframeIntervals()");
      var intervals = [];
      for (var k = startingKeyframeIndex + 1; k < keyframes.length; k++) {
        var previousKeyframeInterval = (intervals.length > 0) ? intervals[intervals.length - 1] : null;
        var isFirstKeyframe = false;
        if (k == startingKeyframeIndex + 1) {
          isFirstKeyframe = true;
        }
        var keyframeInterval = new org.gigapan.timelapse.KeyframeInterval(keyframes[k - 1], keyframes[k], previousKeyframeInterval, timelapse.getDuration(), composerDivId, undefined, isFirstKeyframe, timelapse, settings);
        intervals[intervals.length] = keyframeInterval;
        UTIL.log("   buildKeyframeIntervals(): created keyframe interval (" + (intervals.length - 1) + "): between time [" + keyframes[k - 1]['time'] + "] and [" + keyframes[k]['time'] + "]: " + keyframeInterval);
      }
      return intervals;
    };

    this.play = function(startingKeyframeId) {
      UTIL.log("play(): playing time warp!");
      if (keyframes.length > 1) {
        if (!isCurrentlyPlaying) {
          // Make sure playback is stopped
          timelapse.pause();

          // Find the starting keyframe
          var startingKeyframeIndex = 0;
          for (var j = 0; j < keyframes.length; j++) {
            if (keyframes[j]['id'] == startingKeyframeId) {
              startingKeyframeIndex = j;
              break;
            }
          }

          startingPlaybackRate = timelapse.getPlaybackRate();
          timelapse.warpToBoundingBox(keyframes[startingKeyframeIndex].bounds);
          timelapse.seek(keyframes[startingKeyframeIndex].time);

          // This is a hack to wait for seeking
          waitForSeek_timeout = setTimeout(function() {
            isCurrentlyPlaying = true;
            // Compute the keyframe intervals
            keyframeIntervals = buildKeyframeIntervals(startingKeyframeIndex);

            // Initialize the current keyframe interval
            warpStartingTime = new Date().getTime();
            setCurrentKeyframeInterval(keyframeIntervals[0]);

            // Start playback
            UTIL.log("play(): starting time warp playback");
            timelapse.play();

            // Set an interval which calls the timeCounterHandler.  This is much more reliable than adding
            // a listener to the timelapse because the video element doesn't actually fire time change events
            // for every time change.
            startTimeCounterInterval();

            var listeners = eventListeners['play'];
            if (listeners) {
              for (var i = 0; i < listeners.length; i++) {
                try {
                  listeners[i]();
                } catch(e) {
                  UTIL.error(e.name + " while calling snaplapse 'play' event listener: " + e.message, e);
                }
              }
            }
          }, 500);
        }
      }
    };

    var _stop = function(willJumpToLastKeyframe) {
      if (isCurrentlyPlaying) {

        resetWaitFlags();
        currentKeyframeInterval = null;

        // Stop playback
        // TODO: Always keep playing after a tour finishes OR return to the previous player state?
        timelapse.handlePlayPause();
        timelapse.pause();

        isCurrentlyPlaying = false;

        // Clear the time counter interval
        stopTimeCounterInterval();

        if ( typeof willJumpToLastKeyframe != 'undefined' && willJumpToLastKeyframe) {
          timelapse.warpToBoundingBox(keyframes[keyframes.length - 1]['bounds']);
          timelapse.seek(keyframes[keyframes.length - 1]['time']);
        }

        // The rate changes as a warp plays so reset to the default rate once we stop playback
        timelapse.setPlaybackRate(startingPlaybackRate);

        var listeners = eventListeners['stop'];
        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            try {
              listeners[i]();
            } catch(e) {
              UTIL.error(e.name + " while calling snaplapse 'stop' event listener: " + e.message, e);
            }
          }
        }
      }
    };
    this.stop = _stop;

    this.getKeyframeById = function(keyframeId) {
      if (keyframeId) {
        var keyframe = keyframesById[keyframeId];
        if (keyframe) {
          return cloneFrame(keyframe);
        }
      }
      return null;
    };

    this.getNumKeyframes = function() {
      return keyframes.length;
    };

    this.isPlaying = function() {
      return isCurrentlyPlaying;
    };

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

    this.getSnaplapseViewer = function() {
      return viewer;
    };

    var cloneFrame = function(frame) {
      return $.extend({}, frame);
    };

    var setCurrentKeyframeInterval = function(newKeyframeInterval) {
      UTIL.log("setCurrentKeyframeInterval(" + newKeyframeInterval + ")");

      currentKeyframeInterval = newKeyframeInterval;

      if (currentKeyframeInterval != null) {
        var rate = currentKeyframeInterval.getPlaybackRate();
        timelapse.setPlaybackRate(rate);

        // When we set the current keyframe interval,
        // ask if we need to do an extra pausing at the beginning of playing the timewarp
        currentWaitForExtraStart = currentKeyframeInterval.getWaitForExtraStartFlag();
        if (currentWaitForExtraStart) {
          // If yes, get the duration
          extraWaitForStartDuration = currentKeyframeInterval.getExtraWaitForStartDuration();
          waitForStart = false;
          waitForEnd = false;
        }
        currentWaitDuration = currentKeyframeInterval.getWaitDuration();
        var currentFrame = currentKeyframeInterval.getStartingFrame();
        if (currentFrame) {
          UTIL.selectSelectableElements($("#" + composerDivId + " .snaplapse_keyframe_list"), $("#" + composerDivId + "_snaplapse_keyframe_" + currentFrame.id));
        }

        var keyframeStartingTime = currentKeyframeInterval.getStartingTime();

        if (keyframeStartingTime) {
          timelapse.seek(keyframeStartingTime);
          // Make sure we're on track
          // Update the warp starting time since we just corrected with a seek
          updateWarpStartingTime(keyframeStartingTime);
        }
      }

      // Notify listeners
      var listeners = eventListeners['keyframe-interval-change'];
      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          try {
            listeners[i](cloneFrame( currentKeyframeInterval ? currentKeyframeInterval.getStartingFrame() : keyframes[keyframes.length - 1]));
          } catch(e) {
            UTIL.error(e.name + " while calling snaplapse 'keyframe-interval-change' event listener: " + e.message, e);
          }
        }
      }
    };

    var startTimeCounterInterval = function() {
      // Record starting timestamp
      warpStartingTime = new Date().getTime();
      createTimeCounterInterval();
    };

    var stopTimeCounterInterval = function() {
      clearInterval(timeCounterIntervalHandle);
    };

    var resumeTimeCounterInterval = function() {
      // Update the starting timestamp since we're resuming from a stall
      // TODO use (warpStartingTime + stalledTime) instead of timelapse.getCurrentTime()
      // updateWarpStartingTime(timelapse.getCurrentTime());
      if (isCurrentlyPlaying)
        createTimeCounterInterval();
    };

    var pauseTimeCounterInterval = function() {
      stopTimeCounterInterval();
    };

    var createTimeCounterInterval = function() {
      timeCounterIntervalHandle = setInterval(function() {
        timeCounterHandler();
      }, 20);
    };

    var updateWarpStartingTime = function(videoTime) {
      if (currentKeyframeInterval.getActualDuration() > 0) {
        var elapsedVideoTimePercentage = Math.abs(videoTime - currentKeyframeInterval.getStartingTime()) / currentKeyframeInterval.getActualDuration();
        var oldWarpStartingTime = warpStartingTime;
        warpStartingTime = new Date().getTime() - (currentKeyframeInterval.getDesiredDurationInMillis() * elapsedVideoTimePercentage + currentKeyframeInterval.getStartingRunningDurationInMillis());
        UTIL.log("updateWarpStartingTime(): adjusted warp starting time by [" + (warpStartingTime - oldWarpStartingTime) + "] millis (videoTime=" + videoTime + ")");
      }
    };

    var timeCounterHandler = function() {
      var currentTime = timelapse.getCurrentTime();
      var videoDuration = timelapse.getDuration();

      // If we need to do an extra pausing at the beginning of playing the timewarp
      if (currentWaitForExtraStart) {
        // Set the flag to false to prevent pausing again
        currentWaitForExtraStart = false;
        clearTimeout(waitFor_timeout);
        waitFor_timeout = timelapse.waitFor(extraWaitForStartDuration, function() {
          waitForEnd = true;
          waitForStart = false;
        });
      }

      // When the video time is at the end, we pause the video for a user specified duration and loop it
      // waitForEnd is initially set to true
      if (currentTime >= videoDuration && waitForEnd == true) {
        // We are going to pause the video, so we set the "pausing at the end" flag to false to prevent pausing again
        waitForEnd = false;
        // Calculate the overshooting time
        var desync = currentTime - videoDuration;
        // Pause at the end
        clearTimeout(waitFor_timeout);
        var waitTime = currentWaitDuration.end + desync;
        waitFor_timeout = timelapse.waitFor(waitTime, function() {
          // Now we are going to pause at the beginning when we loop the video
          // so we set the "pausing at the beginning" flag to true
          // TODO: Bug where if a keyframe is at the end and we set a duration, then it seeks back to the beginning before it waits at that keyframe
          waitForStart = true;
          if (waitTime > 0)
            timelapse.seek(0);
          timelapse.play();
        });
      }

      // When the video time is at the beginning when we looped, we want to pause for a user specified duration
      if (waitForStart == true) {
        // We are going to pause the video, so we set the "pausing at the beginning" flag to false to prevent pausing again
        waitForStart = false;
        clearTimeout(waitFor_timeout);
        waitFor_timeout = timelapse.waitFor(currentWaitDuration.start, function() {
          // Reset the "pausing at the end" flag after pausing
          waitForEnd = true;
        });
      }

      // Compute how much time (in millis) has already elapsed
      var elapsedTimeInMillis = new Date().getTime() - warpStartingTime;

      //UTIL.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> timeCounterHandler(" + elapsedTimeInMillis + ")");

      // Update the current keyframe interval based on the elapsed time
      var foundMatchingInterval = false;
      do {
        if (!currentKeyframeInterval) {
          break;
        }
        var containsElapsedTime = currentKeyframeInterval.containsElapsedTime(elapsedTimeInMillis);
        if (containsElapsedTime) {
          foundMatchingInterval = true;
        } else {
          setCurrentKeyframeInterval(currentKeyframeInterval.getNextKeyframeInterval());
        }
      } while (!foundMatchingInterval && currentKeyframeInterval != null);

      if (currentKeyframeInterval) {
        // Compute the frame for the current time
        var frameBounds = currentKeyframeInterval.computeFrameBoundsForElapsedTime(elapsedTimeInMillis);
        if (frameBounds) {
          // Warp to the correct view
          timelapse.warpToBoundingBox(frameBounds);
        } else {
          UTIL.error("Failed to compute time warp frame for time [" + elapsedTimeInMillis + "]");
          _stop(true);
        }
      } else {
        _stop(true);
        UTIL.selectSelectableElements($("#" + composerDivId + " .snaplapse_keyframe_list"), $("#" + composerDivId + "_snaplapse_keyframe_" + keyframes[keyframes.length - 1].id));
      }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //

    org.gigapan.Util.ajax("html", "", "time_warp_composer.html", function(html) {
      $composerDivObj.html(html);
      viewer = new org.gigapan.timelapse.snaplapse.SnaplapseViewer(thisObj, timelapse, settings);
    });

  };

  org.gigapan.timelapse.Snaplapse.normalizeTime = function(t) {
    return parseFloat(t.toFixed(6));
  };

  org.gigapan.timelapse.KeyframeInterval = function(startingFrame, endingFrame, previousKeyframeInterval, videoDuration, composerDivId, constraintParaName, isFirstKeyframe, timelapse, settings) {
    var nextKeyframeInterval = null;
    var playbackRate = null;
    var itemIdHead = composerDivId + "_snaplapse_keyframe_" + startingFrame.id;
    var desiredSpeed = startingFrame['speed'] == null ? 100 : startingFrame['speed'];
    var timeDirection = (startingFrame['time'] <= endingFrame['time']) ? 1 : -1;
    var waitDuration = {
      start: 0,
      end: 0
    };
    var waitForExtraStart = false;
    var extraWaitForStartDuration = 0;
    var loopTimes = startingFrame['loopTimes'];
    var playbackTime_withoutLooping;
    var playbackTime_eachLoop;
    var actualDuration;
    var desiredDuration;
    var defaultLoopDwellTime = 0.5;
    var disableTourLooping = ( typeof settings['disableTourLooping'] == "undefined") ? false : settings['disableTourLooping'];
    var defaultLoopTimes = 2;

    // Determine loop dwell time and validate loop times
    // Loop dwell time is the time that users want to pause the video at the begining or end while looping
    if (constraintParaName) {
      // Updating mode:
      if (constraintParaName == "speed") {
        // looping is allowed in speed mode
        if (disableTourLooping)
          loopTimes = 0;
        if (loopTimes == null)
          loopTimes = defaultLoopTimes;
        else if (loopTimes < 0)
          loopTimes = 0;
        // Set loop dwell time
        if (loopTimes > 0) {
          waitDuration = {
            start: startingFrame['waitStart'] == null ? defaultLoopDwellTime : startingFrame['waitStart'],
            end: startingFrame['waitEnd'] == null ? defaultLoopDwellTime : startingFrame['waitEnd']
          };
        }
        startingFrame['waitStart'] = waitDuration.start;
        startingFrame['waitEnd'] = waitDuration.end;
      } else if (constraintParaName == "duration") {
        // In duration mode, looping is not allowed.
        loopTimes = 0;
        startingFrame['waitStart'] = 0;
        startingFrame['waitEnd'] = 0;
      }
    } else {
      // Playing mode:
      waitDuration = {
        start: startingFrame['waitStart'],
        end: startingFrame['waitEnd']
      };
    }

    // Determine extra loop dwell time at the beginning
    if (isFirstKeyframe == true) {
      if (startingFrame['time'] == 0) {
        waitForExtraStart = true;
        // extraWaitForStartDuration is used when users want to pause the keyframe starting at the begining of the video
        // This is an exception for the loop dwelling math
        // If the first keyframe starts at source time zero, we still need to pause it (using waitForExtraStart flag)
        // we compute the duration in KeyframeInterval class and use it in snaplapse
        extraWaitForStartDuration = startingFrame['waitStart'];
      }
    }

    // Main function
    if (constraintParaName) {
      /////////////////////////////////////////////
      // Updating mode: update parameters and UI
      // this mode is for adding, deleting, and refreshing keyframes

      // Compute the duration of source time
      actualDuration = Math.abs(parseFloat(Math.abs(endingFrame['time'] - startingFrame['time'])));
      // Compute the duration of playback time (include looping)
      desiredDuration = startingFrame['duration'] == null ? actualDuration : startingFrame['duration'];

      // Compute parameters according to different constraints
      if (constraintParaName == "speed") {
        // The primary constraint is speed
        // This means we want to fix the speed and compute other parameters
        // In speed mode, if speed is zero, loop times must be zero
        if (desiredSpeed == 0)
          loopTimes = 0;
        // If the actual duration is zero, loop times and speed cannot be zero
        if (actualDuration == 0) {
          if (loopTimes <= 0 && !disableTourLooping)
            loopTimes = 1;
          if (desiredSpeed == 0 && !disableTourLooping)
            desiredSpeed = 100;
          if (disableTourLooping)
            desiredSpeed = 0;
        }
        // Compute other parameters
        playbackRate = desiredSpeed / 100;
        playbackTime_withoutLooping = actualDuration / playbackRate;
        playbackTime_eachLoop = videoDuration / playbackRate + waitDuration.start + waitDuration.end;
        if (timeDirection == 1) {
          // This means that the time goes forward
          desiredDuration = extraWaitForStartDuration + loopTimes * playbackTime_eachLoop + playbackTime_withoutLooping;
        } else {
          // This means that the time goes backward
          if (loopTimes > 0)
            desiredDuration = extraWaitForStartDuration + loopTimes * playbackTime_eachLoop - playbackTime_withoutLooping;
          else
            desiredDuration = playbackTime_withoutLooping;
        }
        if (isNaN(desiredDuration) || desiredSpeed == 0)
          desiredDuration = 0;
      } else if (constraintParaName == "duration") {
        // The primary constraint is duration
        // This means we want to fix the duration and compute other parameters
        if (actualDuration != 0) {
          if (desiredSpeed != 0) {
            if (desiredDuration > actualDuration * 1000) {
              // Set a threshold for the largest duration
              // so we don't get extremely low speeds like 0.000001%
              desiredDuration = actualDuration * 1000;
            } else if (desiredDuration < actualDuration / 100) {
              // Set a threshold for the smallest duration
              // so we don't get extremely high speeds like 9999999%
              desiredDuration = actualDuration / 100;
            }
            playbackRate = actualDuration / desiredDuration;
            desiredSpeed = playbackRate * 100;
          }
        } else {
          desiredSpeed = 0;
        }
      }
      // Update the UI and keyframe parameters
      startingFrame['speed'] = desiredSpeed;
      $("#" + itemIdHead + "_speed").val(desiredSpeed.toFixed(2));
      startingFrame['loopTimes'] = loopTimes;
      $("#" + itemIdHead + "_loopTimes").val(loopTimes);
      startingFrame['duration'] = desiredDuration;
      $("#" + itemIdHead + "_duration").val(desiredDuration.toFixed(2));
    } else {
      /////////////////////////////////////////////
      // Playing mode: playing the timewarp
      // this mode is for playing the timewarp
      if (timeDirection == -1 && loopTimes > 0) {
        timeDirection = 1;
      }
      var startingFrameTimes = startingFrame['time'];
      var endingFrameTimes = endingFrame['time'] + loopTimes * (videoDuration + waitDuration.start + waitDuration.end) + extraWaitForStartDuration;
      actualDuration = parseFloat(Math.abs(endingFrameTimes - startingFrameTimes).toFixed(6));
      desiredDuration = startingFrame['duration'] == null ? actualDuration : startingFrame['duration'];

      var desiredDurationInMillis = desiredDuration * 1000;
      var startingRunningDurationInMillis = 0;
      var endingRunningDurationInMillis = desiredDurationInMillis;

      if (previousKeyframeInterval != null) {
        previousKeyframeInterval.setNextKeyframeInterval(this);
        var previousRunningDurationInMillis = previousKeyframeInterval.getEndingRunningDurationInMillis();
        endingRunningDurationInMillis += previousRunningDurationInMillis;
        startingRunningDurationInMillis = previousRunningDurationInMillis;
      }
      if (desiredDuration == 0 || actualDuration == 0) {
        playbackRate = 0;
      } else {
        playbackRate = timeDirection * desiredSpeed / 100;
      }
    }

    this.getWaitDuration = function() {
      return waitDuration;
    };

    this.getWaitForExtraStartFlag = function() {
      return waitForExtraStart;
    };

    this.getExtraWaitForStartDuration = function() {
      return extraWaitForStartDuration;
    };

    this.getPreviousKeyframeInterval = function() {
      return previousKeyframeInterval;
    };

    this.getStartingFrame = function() {
      return startingFrame;
    };

    this.getStartingTime = function() {
      return startingFrameTimes;
    };

    this.getEndingTime = function() {
      return endingFrameTimes;
    };

    this.getActualDuration = function() {
      return actualDuration;
    };

    this.getDesiredDurationInMillis = function() {
      return desiredDurationInMillis;
    };

    this.getNextKeyframeInterval = function() {
      return nextKeyframeInterval;
    };

    this.setNextKeyframeInterval = function(theNextKeyframeInterval) {
      nextKeyframeInterval = theNextKeyframeInterval;
    };

    this.getPlaybackRate = function() {
      return playbackRate;
    };

    this.getStartingRunningDurationInMillis = function() {
      return startingRunningDurationInMillis;
    };

    this.getEndingRunningDurationInMillis = function() {
      return endingRunningDurationInMillis;
    };

    this.containsElapsedTime = function(millis) {
      return startingRunningDurationInMillis <= millis && millis <= endingRunningDurationInMillis;
    };

    this.computeFrameBoundsForElapsedTime = function(elapsedMillis) {
      if (this.containsElapsedTime(elapsedMillis)) {
        var timeRatio = (elapsedMillis - startingRunningDurationInMillis) / desiredDurationInMillis;
        var bounds = timelapse.computeMotion(startingFrame['bounds'], endingFrame['bounds'], timeRatio);
        return bounds;
      }
      return null;
    };

    this.toString = function() {
      return 'KeyframeInterval' + '[startTime=' + startingFrame['time'] + ',endTime=' + endingFrame['time'] + ',actualDuration=' + actualDuration + ',desiredDuration=' + desiredDuration + ',playbackRate=' + playbackRate + ',timeDirection=' + timeDirection + ',startingRunningDurationInMillis=' + startingRunningDurationInMillis + ',endingRunningDurationInMillis=' + endingRunningDurationInMillis + ']';
    };
  };
})();
