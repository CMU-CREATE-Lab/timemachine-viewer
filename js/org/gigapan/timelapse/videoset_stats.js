// @license
// Redistribution and use in source and binary forms ...

// Class for calculating and rendering videoset stats.
//
// Dependencies:
// * org.gigapan.Util
// * jQuery (http://jquery.com/)
// * jQuery UI (http://jqueryui.com/)
// * videoset_stats.css
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

if (!org.gigapan.Util) {
  var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.VideosetStats";
  alert(noUtilMsg);
  throw new Error(noUtilMsg);
}
if (!window['$']) {
  var nojQueryMsg = "The jQuery library is required by org.gigapan.timelapse.VideosetStats";
  alert(nojQueryMsg);
  throw new Error(nojQueryMsg);
}

//
// CODE
//

(function() {
  var jQuery = window['$'];
  var UTIL = org.gigapan.Util;

  org.gigapan.timelapse.VideosetStats = function(videoset, containerDivName) {
    if (org.gigapan.timelapse.VideosetStats.isEnabled) {
      var stats = [];
      var numVideosAdded = 0;
      var numVideosMadeVisibleOrDeleted = 0;
      var numVideosGarbageCollected = 0;
      var cumulativeAverageOfTimeBetweenAddedAndComplete = 0;
      var cumulativeAverageOfTimeBetweenDeleteAndGC = 0;

      var containerDivNameWithHash = "#" + containerDivName;

      // make sure it's empty first
      jQuery(containerDivNameWithHash).empty();

      jQuery(containerDivNameWithHash).append('<div id="videoset_stats">' + '   <table border="0" cellpadding="3" cellspacing="0">' + '      <tr id="__videoset_stats_header">' + '         <th>Video</th>' + '         <th>Added</th>' + '         <th>Metadata</th>' + '         <th>Visible</th>' + '         <th>Replaced By</th>' + '         <th>Deleted</th>' + '         <th>GC\'d</th>' + '      </tr>' + '   </table>' + '</div>');

      jQuery(containerDivNameWithHash).append('<div id="videoset_stats_summary">' + '   <table border="0" cellpadding="3" cellspacing="0">' + '      <tr>' + '         <td style="text-align:right">Num Videos Added:</td>' + '         <td style="text-align:right; padding-left:5px" id="__videoset_stats_summary_num_videos_added">0</td>' + '      </tr>' + '      <tr>' + '         <td style="text-align:right">Num Videos Made Visible/Deleted:</td>' + '         <td style="text-align:right; padding-left:5px" id="__videoset_stats_summary_num_videos_complete">0</td>' + '      </tr>' + '      <tr>' + '         <td style="text-align:right">Num Videos Garbage Collected:</td>' + '         <td style="text-align:right; padding-left:5px" id="__videoset_stats_summary_num_videos_gc">0</td>' + '      </tr>' + '      <tr>' + '         <td style="text-align:right">Avg. Time (ms) Between Added and Visible/Deleted:</td>' + '         <td style="text-align:right; padding-left:5px" id="__videoset_stats_summary_avg_time_between_added_and_complete">n/a</td>' + '      </tr>' + '      <tr>' + '         <td style="text-align:right">Avg. Time (ms) Between Deleted and GC:</td>' + '         <td style="text-align:right; padding-left:5px" id="__videoset_stats_summary_avg_time_between_delete_and_gc">n/a</td>' + '      </tr>' + '   </table>' + '</div>');

      var handleVideoAdded = function(id, t) {
        numVideosAdded++;
        stats[id] = {};
        stats[id]['video-added'] = t;

        jQuery("#__videoset_stats_summary_num_videos_added").html(numVideosAdded);
        jQuery("#__videoset_stats_header").after('<tr id="__videoset_stats_video_' + id + '">' + '   <td>' + id + '</td>' + '   <td id="__videoset_stats_video_' + id + '_added">' + org.gigapan.Util.convertTimeToMinsSecsString(t) + '</td>' + '   <td id="__videoset_stats_video_' + id + '_metadata">&nbsp;</td>' + '   <td id="__videoset_stats_video_' + id + '_visible">&nbsp;</td>' + '   <td id="__videoset_stats_video_' + id + '_replaced_by">&nbsp;</td>' + '   <td id="__videoset_stats_video_' + id + '_deleted">&nbsp;</td>' + '   <td id="__videoset_stats_video_' + id + '_gc">&nbsp;</td>' + '</tr>');
        //UTIL.log("######## VIDEO(" + id + ") ADDED AT TIME [" + org.gigapan.Util.convertTimeToMinsSecsString(t) + "]");
      };

      var handleVideoLoadedMetadataHelper = function(id, t, cssClass) {
        stats[id]['video-loaded-metadata'] = t;

        var elapsed = t - stats[id]['video-added'];
        jQuery("#__videoset_stats_video_" + id + "_metadata").html(org.gigapan.Util.convertTimeToMinsSecsString(elapsed));
        if (cssClass) {
          jQuery("#__videoset_stats_video_" + id + "_metadata").addClass(cssClass);
        }
      };

      var handleVideoLoadedMetadata = function(id, t) {
        handleVideoLoadedMetadataHelper(id, t, null);

        //UTIL.log("######## VIDEO(" + id + ") LOADED METADATA AT TIME [" + org.gigapan.Util.convertTimeToMinsSecsString(t) + "]");
      };

      var handleVideoMadeVisibleHelper = function(id, t, cssClass) {
        numVideosMadeVisibleOrDeleted++;
        stats[id]['video-made-visible'] = t;

        var elapsed = t - stats[id]['video-added'];
        cumulativeAverageOfTimeBetweenAddedAndComplete = updateCumulativeAverage(elapsed, cumulativeAverageOfTimeBetweenAddedAndComplete, numVideosMadeVisibleOrDeleted);
        jQuery("#__videoset_stats_summary_num_videos_complete").html(numVideosMadeVisibleOrDeleted);
        jQuery("#__videoset_stats_summary_avg_time_between_added_and_complete").html(cumulativeAverageOfTimeBetweenAddedAndComplete.toFixed(0));
        jQuery("#__videoset_stats_video_" + id + "_visible").html(org.gigapan.Util.convertTimeToMinsSecsString(elapsed));
        if (cssClass) {
          jQuery("#__videoset_stats_video_" + id + "_visible").addClass(cssClass);
        }
      };

      var handleVideoMadeVisible = function(id, t) {
        handleVideoMadeVisibleHelper(id, t);

        //UTIL.log("######## VIDEO(" + id + ") MADE VISIBLE AT TIME [" + org.gigapan.Util.convertTimeToMinsSecsString(t) + "]");
      };

      var handleVideoDeleted = function(id, t, idOfVideoWhichCausedDelete) {
        stats[id]['video-deleted'] = t;
        stats[id]['replaced-by'] = idOfVideoWhichCausedDelete;

        jQuery("#__videoset_stats_video_" + id + "_deleted").html(org.gigapan.Util.convertTimeToMinsSecsString(t));
        jQuery("#__videoset_stats_video_" + id + "_replaced_by").html(idOfVideoWhichCausedDelete);

        // If this video didn't load metadata or was made visible before it was replaced, then
        // we update this video's stats to use the made-visible time of the replacing video.
        if ( typeof stats[id]['video-loaded-metadata'] == 'undefined') {
          handleVideoLoadedMetadataHelper(id, stats[idOfVideoWhichCausedDelete]['video-made-visible'], 'stats_cascaded_from_another_video');
        }
        if ( typeof stats[id]['video-made-visible'] == 'undefined') {
          handleVideoMadeVisibleHelper(id, stats[idOfVideoWhichCausedDelete]['video-made-visible'], 'stats_cascaded_from_another_video');
        }

        //UTIL.log("######## VIDEO(" + id + ") DELETED AT TIME [" + org.gigapan.Util.convertTimeToMinsSecsString(t) + "] BY VIDEO(" + idOfVideoWhichCausedDelete + ")");
      };

      var handleVideoGarbageCollected = function(id, t) {
        numVideosGarbageCollected++;
        stats[id]['video-garbage-collected'] = t;

        var elapsed = t - stats[id]['video-deleted'];

        cumulativeAverageOfTimeBetweenDeleteAndGC = updateCumulativeAverage(elapsed, cumulativeAverageOfTimeBetweenDeleteAndGC, numVideosGarbageCollected);
        jQuery("#__videoset_stats_summary_num_videos_gc").html(numVideosGarbageCollected);
        jQuery("#__videoset_stats_summary_avg_time_between_delete_and_gc").html(cumulativeAverageOfTimeBetweenDeleteAndGC.toFixed(0));
        jQuery("#__videoset_stats_video_" + id + "_gc").html(org.gigapan.Util.convertTimeToMinsSecsString(elapsed));

        //UTIL.log("######## VIDEO(" + id + ") GARBAGE COLLECTED AT TIME [" + org.gigapan.Util.convertTimeToMinsSecsString(t) + "]");
      };

      var updateCumulativeAverage = function(newValue, existingAverage, numValuesIncludingNew) {
        return (newValue + (numValuesIncludingNew - 1) * existingAverage) / numValuesIncludingNew;
      };

      videoset.addEventListener('video-added', handleVideoAdded);
      videoset.addEventListener('video-loaded-metadata', handleVideoLoadedMetadata);
      videoset.addEventListener('video-made-visible', handleVideoMadeVisible);
      videoset.addEventListener('video-deleted', handleVideoDeleted);
      videoset.addEventListener('video-garbage-collected', handleVideoGarbageCollected);
    }
  };
})();
