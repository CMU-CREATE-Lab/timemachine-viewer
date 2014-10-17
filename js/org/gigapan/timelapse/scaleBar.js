// @license
// Redistribution and use in source and binary forms ...

/*
 Class for managing the scale bar for the timelapse.

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
 */"use strict";

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
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.ScaleBar";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.ScaleBar = function(scaleBarOptions, timelapse) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //
    var scaleBarDivId = ( typeof (scaleBarOptions["scaleBarDiv"]) == "undefined") ? "scaleBar2013" : scaleBarOptions["scaleBarDiv"];
    var enableVideoQualitySelector = ( typeof (scaleBarOptions["enableVideoQualitySelector"]) == "undefined") ? false : scaleBarOptions["enableVideoQualitySelector"];
    var barLength;
    var datasetType = timelapse.getDatasetType();
    var useTouchFriendlyUI = timelapse.useTouchFriendlyUI();
    var scaleBarGeometryLandsat = {
      "x": 9,
      "y": useTouchFriendlyUI ? 106 : 77,
      "position": "left",
      "barLength": useTouchFriendlyUI ? 155 : 113
    };
    var scaleBarGeometryMODIS = {
      "x": 9,
      "y": useTouchFriendlyUI ? 154 : 127,
      "position": "left",
      "barLength": 135
    };
    var videoDivId = timelapse.getVideoDivId();
    var viewerDivId = timelapse.getViewerDivId();
    var videoDivHeight;
    var videoDivWidth;
    var metricUnitArray = [16000, 8000, 4000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];
    var englishUnitArray = [8000, 4000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.4735, 0.3788, 0.1894, 0.0947, 0.0947, 0.0379, 0.0189];
    var nowMetricUnitIndex = 1;
    var nowEnglishUnitIndex = 1;
    var videoQualityHeight;
    var videoQualityWidth;
    var videoDivRatio;
    var videoDivBorderWidth;
    var videoQualityRatio;
    var distancePerPixel = {
      "km": undefined,
      "mi": undefined
    };
    var radianPerDegree = Math.PI / 180;
    var earthRadius = {
      "km": 6371,
      "mi": 3959
    };
    var c1 = radianPerDegree * earthRadius.km;
    var c2 = radianPerDegree * earthRadius.mi;

    // Variables for DOM elements
    var metricUnit_txt_DOM;
    var englishUnit_txt_DOM;
    var scaleBar_canvas;
    var ctx_scaleBar_canvas;
    var videoQualitySelector;
    var metersPerPixel_text;
    var ratioBarTop;
    var ratioBarBot;
    var ratioBarRight;
    var ratioBarLeft;
    var $videoQualityContainer;
    var scaleBarContainer;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    // Draw the scale bar
    var drawScaleBar = function(scaleBarSetting) {
      //set text
      metricUnit_txt_DOM.textContent = scaleBarSetting["topTxt"];
      englishUnit_txt_DOM.textContent = scaleBarSetting["bottomTxt"];
      // Clear canvas
      ctx_scaleBar_canvas.clearRect(0, 0, scaleBar_canvas.width, scaleBar_canvas.height);
      var startX = [scaleBarSetting["centerBar_startX"], scaleBarSetting["leftBar_startX"], scaleBarSetting["rightTopBar_startX"], scaleBarSetting["rightBottomBar_startX"]];
      var startY = [scaleBarSetting["centerBar_startY"], scaleBarSetting["leftBar_startY"], scaleBarSetting["rightTopBar_startY"], scaleBarSetting["rightBottomBar_startY"]];
      var endX = [scaleBarSetting["centerBar_endX"], scaleBarSetting["leftBar_endX"], scaleBarSetting["rightTopBar_endX"], scaleBarSetting["rightBottomBar_endX"]];
      var endY = [scaleBarSetting["centerBar_endY"], scaleBarSetting["leftBar_endY"], scaleBarSetting["rightTopBar_endY"], scaleBarSetting["rightBottomBar_endY"]];
      drawLine(ctx_scaleBar_canvas, startX, startY, endX, endY, scaleBarSetting["strokeWidth"], "#ffffff");
    };

    // Draw a line on the scale bar
    var drawLine = function(context, startX, startY, endX, endY, lineW, lineColor) {
      // Draw border
      context.beginPath();
      context.moveTo(startX[0] - 1, startY[0]);
      context.lineTo(endX[0] + 1, endY[0]);
      context.moveTo(startX[1], startY[1] - 1);
      context.lineTo(endX[1], endY[1] + 1);
      context.moveTo(startX[2], startY[2] + 1);
      context.lineTo(endX[2], endY[2] - 1);
      context.moveTo(startX[3], startY[3] - 1);
      context.lineTo(endX[3], endY[3] + 1);
      context.lineWidth = lineW + 1;
      context.strokeStyle = "#656565";
      context.stroke();

      // Draw bar
      context.beginPath();
      for (var i = 0; i < startX.length; i++) {
        context.moveTo(startX[i], startY[i]);
        context.lineTo(endX[i], endY[i]);
      }
      context.lineWidth = lineW;
      context.strokeStyle = lineColor;
      context.stroke();
    };

    // Find the proper scale
    var findScale = function(unitType, barUnit, distance, barLength) {
      var barUnitTxt, unitArray, nowUnitIndex;
      if (unitType == "metric") {
        barUnitTxt = "km";
        unitArray = metricUnitArray;
        nowUnitIndex = nowMetricUnitIndex;
      } else if (unitType == "english") {
        barUnitTxt = "mi";
        unitArray = englishUnitArray;
        nowUnitIndex = nowEnglishUnitIndex;
      }
      // Update the metric unit scale
      var barX = Math.round(barUnit / distance);
      while (barX < (barLength / 2)) {
        if (nowUnitIndex > 0) {
          nowUnitIndex -= 1;
          barX = unitArray[nowUnitIndex] / distance;
        } else
          break;
      }
      while (barX > barLength) {
        if (nowUnitIndex < unitArray.length) {
          nowUnitIndex += 1;
          barX = unitArray[nowUnitIndex] / distance;
        } else
          break;
      }
      // Update
      var newBarUnit = unitArray[nowUnitIndex];
      if (unitArray[nowUnitIndex] < 1) {
        if (unitType == "metric") {
          barUnitTxt = "m";
          newBarUnit = Math.round(newBarUnit * 1000);
        } else if (unitType == "english") {
          barUnitTxt = "ft";
          newBarUnit = Math.round(newBarUnit * 5280);
        }
      }
      if (unitType == "metric") {
        nowMetricUnitIndex = nowUnitIndex;
      } else if (unitType == "english") {
        nowEnglishUnitIndex = nowUnitIndex;
      }
      return {
        "barX": barX,
        "barUnit": newBarUnit,
        "barUnitTxt": barUnitTxt
      };
    };

    // Display the video quality
    var displayVideoQuality = function() {
      var metersPerPixel = Math.round(distancePerPixel.km * 1000 * 100) / 100;
      var metersPerPixel_currentResolution;
      if (videoQualityRatio > videoDivRatio) {
        metersPerPixel_currentResolution = Math.round(((metersPerPixel * videoDivWidth) / videoQualityWidth) * 100) / 100;
      } else {
        metersPerPixel_currentResolution = Math.round(((metersPerPixel * videoDivHeight) / videoQualityHeight) * 100) / 100;
      }
      $(metersPerPixel_text).val(metersPerPixel_currentResolution);
    };

    // Attach events to the video quality selector
    var addVideoQualitySelectorEvents = function() {
      videoQualitySelector.addEventListener("change", function() {
        var quality = videoQualitySelector.options[videoQualitySelector.selectedIndex].value;
        if (quality != "default") {
          quality = quality.split("x");
          videoQualityWidth = parseInt(quality[0]);
          videoQualityHeight = parseInt(quality[1]);
        } else {
          videoQualityHeight = videoDivHeight;
          videoQualityWidth = videoDivWidth;
        }
        displayVideoQuality();
        setVideoRatioBar();
      });
      metersPerPixel_text.addEventListener("keydown", function(event) {
        if (event.keyCode == 13) {
          metersPerPixel_text.blur();
        }
      }, false);
      metersPerPixel_text.addEventListener("blur", function() {
        var $metersPerPixel_text = $(metersPerPixel_text);
        var targetDistance_km = $metersPerPixel_text.val() / 1000;
        if (!isNaN(targetDistance_km) && targetDistance_km != 0) {
          var currentDistance_km = distancePerPixel.km;
          var currentView = timelapse.getView();
          var targetView = $.extend({}, currentView);
          if (videoQualityRatio > videoDivRatio) {
            targetView.scale = currentView.scale * (currentDistance_km / targetDistance_km) * (videoDivWidth / videoQualityWidth);
          } else {
            targetView.scale = currentView.scale * (currentDistance_km / targetDistance_km) * (videoDivHeight / videoQualityHeight);
          }
          timelapse.setTargetView(targetView);
        }
      }, false);
    };

    // Add options
    var addOptions = function(value, text, title, select_DOM) {
      var option = document.createElement("option");
      option.value = value;
      option.text = text;
      option.title = title;
      select_DOM.add(option, null);
    };

    // Create elements for video quality
    var createVideoQualityElements = function() {
      // Create ratio bars
      ratioBarTop = document.createElement("div");
      ratioBarBot = document.createElement("div");
      ratioBarRight = document.createElement("div");
      ratioBarLeft = document.createElement("div");
      $(ratioBarTop).addClass("ratioBarTop");
      $(ratioBarBot).addClass("ratioBarBot");
      $(ratioBarRight).addClass("ratioBarRight");
      $(ratioBarLeft).addClass("ratioBarLeft");
      $("#" + videoDivId).append(ratioBarTop, ratioBarBot, ratioBarRight, ratioBarLeft);
      // Create video quality selector
      var content = '';
      content += '<div class="videoQualityContainer">';
      content += '    <div class="videoQuality_text_static">Resolution for :</div>';
      content += '    <select class="videoQualitySelector"></select>';
      content += '    <input class="metersPerPixel_text" type="text">';
      content += '    <div class="metersPerPixel_text_static">Meters per pixel :</div>';
      content += '</div>';
      $videoQualityContainer = $(content);
      $("#" + viewerDivId).append($videoQualityContainer);
      videoQualitySelector = $("#" + viewerDivId + " .videoQualitySelector").get(0);
      metersPerPixel_text = $("#" + viewerDivId + " .metersPerPixel_text").get(0);
      // Add video quality options
      addOptions("default", "This Window", "The Viewport Size", videoQualitySelector);
      addOptions("15360x8640", "15360 x 8640", "16K", videoQualitySelector);
      addOptions("11520x6480", "11520 x 6480", "12K", videoQualitySelector);
      addOptions("7860x4320", "7860 x 4320", "8K", videoQualitySelector);
      addOptions("5760x3240", "5760 x 3240", "Exploratorium (museum in San Francisco) Hyperwall", videoQualitySelector);
      addOptions("5760x2160", "5760 x 2160", "12MP, CMU GHC 4303 hyperwall operating at theoretical limit of displays", videoQualitySelector);
      addOptions("3840x2160", "3840 x 2160", "4K", videoQualitySelector);
      addOptions("4080x1536", "4080 x 1536", "6MP, CMU GHC 4303 hyperwall as configured", videoQualitySelector);
      addOptions("2880x1800", "2880 x 1800", "5MP, Macbook 15-inch with retina display", videoQualitySelector);
      addOptions("2560x1600", "2560 x 1600", "4MP, Nexus 10 tablet, some 30-inch monitors (e.g. Dell U3011)", videoQualitySelector);
      addOptions("2048x1536", "2048 x 1536", "3MP, iPad with retina display", videoQualitySelector);
      addOptions("1920x1200", "1920 x 1200", "2MP, Macbook 17-inch, some ~24-inch monitors (most in CREATE lab)", videoQualitySelector);
      addOptions("1920x1080", "1920 x 1080", "2MP, 1080p, many 22-28 inch monitors", videoQualitySelector);
      addOptions("1440x900", "1440 x 900", "1MP, Macbook 15-inch without retina display", videoQualitySelector);
      addOptions("1280x720", "1280 x 720", "1MP, 720p", videoQualitySelector);
      addOptions("1024x768", "1084 x 768", "<1MP, Old iPad without retina display", videoQualitySelector);
      addOptions("854x480", "854 x 480", "480p", videoQualitySelector);
      addOptions("640x360", "640 x 360", "360p", videoQualitySelector);
      addOptions("427x240", "427 x 240", "240p", videoQualitySelector);
      // Attach events to the video quality selector
      addVideoQualitySelectorEvents();
    };

    // Create elements for scale bar
    var createScaleBarElements = function() {
      var scaleBarGeometry;
      if (datasetType == "landsat")
        scaleBarGeometry = scaleBarGeometryLandsat;
      else if (datasetType == "modis")
        scaleBarGeometry = scaleBarGeometryMODIS;
      // Set bar length
      barLength = scaleBarGeometry.barLength;
      // Create elements
      scaleBarContainer = document.createElement("div");
      var scaleBarTop_txt_DOM = document.createElement("div");
      scaleBar_canvas = document.createElement("canvas");
      scaleBar_canvas.width = barLength + 20;
      scaleBar_canvas.height = 50;
      var scaleBarBot_txt_DOM = document.createElement("div");
      // Add class for css
      var $scaleBarContainer = $(scaleBarContainer);
      $scaleBarContainer.addClass("scaleBarContainer");
      $(scaleBarTop_txt_DOM).addClass("scaleBarTop_txt");
      $(scaleBar_canvas).addClass("scaleBar_canvas");
      $(scaleBarBot_txt_DOM).addClass("scaleBarBot_txt");
      // Set id
      scaleBarContainer.id = scaleBarDivId + "_scaleBarContainer";
      scaleBarTop_txt_DOM.id = scaleBarDivId + "_scaleBarTop_txt";
      scaleBar_canvas.id = scaleBarDivId + "_scaleBar_canvas";
      scaleBarBot_txt_DOM.id = scaleBarDivId + "_scaleBarBot_txt";
      // Set text
      scaleBarTop_txt_DOM.textContent = "8000 km";
      scaleBarBot_txt_DOM.textContent = "4000 mi";
      // Append elements
      $scaleBarContainer.append(scaleBarTop_txt_DOM, scaleBar_canvas, scaleBarBot_txt_DOM);
      $("#" + videoDivId).append(scaleBarContainer);
      // Set position
      $scaleBarContainer.css("bottom", scaleBarGeometry.y + "px");
      $scaleBarContainer.css(scaleBarGeometry.position, scaleBarGeometry.x + "px");
      // Cache elements
      metricUnit_txt_DOM = document.getElementById(scaleBarDivId + "_scaleBarTop_txt");
      englishUnit_txt_DOM = document.getElementById(scaleBarDivId + "_scaleBarBot_txt");
      ctx_scaleBar_canvas = scaleBar_canvas.getContext('2d');
      var $videoDiv = $("#" + videoDivId);
      videoDivHeight = $videoDiv.height();
      videoDivWidth = $videoDiv.width();
      videoDivRatio = Math.round((videoDivWidth / videoDivHeight) * 100) / 100;
      videoQualityHeight = videoDivHeight;
      videoQualityWidth = videoDivWidth;
      videoDivBorderWidth = parseInt($videoDiv.css("border-left-width"));
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    // Compute the video ratio bar
    var setVideoRatioBar = function() {
      if (videoQualityHeight != videoDivHeight && videoQualityWidth != videoDivWidth) {
        videoQualityRatio = Math.round((videoQualityWidth / videoQualityHeight) * 100) / 100;
        if (videoQualityRatio > videoDivRatio) {
          // Add top and bottom bars
          var barHeight = Math.round((videoDivHeight - (videoDivWidth / videoQualityRatio)) / 2);
          ratioBarTop.style.height = barHeight + "px";
          ratioBarBot.style.height = barHeight + "px";
          // Set the bars
          $(ratioBarTop).show();
          $(ratioBarBot).show();
          $(ratioBarRight).hide();
          $(ratioBarLeft).hide();
        } else if (videoQualityRatio < videoDivRatio) {
          // Add left and right bars
          var barWidth = Math.round((videoDivWidth - (videoDivHeight * videoQualityRatio)) / 2);
          ratioBarLeft.style.width = barWidth + "px";
          ratioBarRight.style.width = barWidth + "px";
          // Set the bars
          $(ratioBarTop).hide();
          $(ratioBarBot).hide();
          $(ratioBarRight).show();
          $(ratioBarLeft).show();
        } else {
          // Disable the bars
          $(ratioBarTop).hide();
          $(ratioBarBot).hide();
          $(ratioBarRight).hide();
          $(ratioBarLeft).hide();
        }
      } else {
        // Disable the bars
        $(ratioBarTop).hide();
        $(ratioBarBot).hide();
        $(ratioBarRight).hide();
        $(ratioBarLeft).hide();
      }
    };
    this.setVideoRatioBar = setVideoRatioBar;

    var setScaleBar = function(view, latlngCenter) {
      var latlngNearCenter = timelapse.getProjection().pointToLatlng({
        "x": (view.x + 1 / view.scale),
        "y": view.y,
        "scale": view.scale
      });
      // Compute the distance per pixel in longitude degree
      var degreePerPixel = Math.abs(latlngCenter.lng - latlngNearCenter.lng);
      var v1 = degreePerPixel * Math.cos(latlngCenter.lat * radianPerDegree);
      distancePerPixel.km = c1 * v1;
      distancePerPixel.mi = c2 * v1;
      // Find the new proper scale
      var metricUnitArray = metricUnit_txt_DOM.textContent.split(" ");
      var englishUnitArray = englishUnit_txt_DOM.textContent.split(" ");
      var barUnit = {
        "metric": parseInt(metricUnitArray[0]),
        "english": parseInt(englishUnitArray[0])
      };
      var barUnitTxt = {
        "metric": metricUnitArray[1],
        "english": englishUnitArray[1]
      };
      // Convert to km and mile
      if (barUnitTxt.metric == "m") {
        // 1 km = 1000 m
        barUnit.metric /= 1000;
        barUnit.metric = Math.round(barUnit.metric * 10000) / 10000;
      }
      if (barUnitTxt.english == "ft") {
        // 1 mile = 5280 feet
        barUnit.english /= 5280;
        barUnit.english = Math.round(barUnit.english * 10000) / 10000;
      }
      // Find scale
      var newScale_metric = findScale("metric", barUnit.metric, distancePerPixel.km, barLength);
      var newScale_english = findScale("english", barUnit.english, distancePerPixel.mi, barLength);
      // Draw the scale bar
      var min_X = 15;
      var min_Y = 13;
      var max_Y = 37;
      var center_Y = 25;
      var scaleBarSetting = {
        "topTxt": newScale_metric.barUnit + " " + newScale_metric.barUnitTxt,
        "bottomTxt": newScale_english.barUnit + " " + newScale_english.barUnitTxt,
        "centerBar_startX": min_X,
        "centerBar_startY": center_Y,
        "centerBar_endX": min_X + barLength,
        "centerBar_endY": center_Y,
        "leftBar_startX": min_X,
        "leftBar_startY": min_Y,
        "leftBar_endX": min_X,
        "leftBar_endY": max_Y,
        "rightTopBar_startX": min_X + Math.round(newScale_metric.barX),
        "rightTopBar_startY": center_Y,
        "rightTopBar_endX": min_X + Math.round(newScale_metric.barX),
        "rightTopBar_endY": min_Y,
        "rightBottomBar_startX": min_X + Math.round(newScale_english.barX),
        "rightBottomBar_startY": center_Y,
        "rightBottomBar_endX": min_X + Math.round(newScale_english.barX),
        "rightBottomBar_endY": max_Y,
        "strokeWidth": 2
      };
      drawScaleBar(scaleBarSetting);
      if (enableVideoQualitySelector == true)
        displayVideoQuality();
    };
    this.setScaleBar = setScaleBar;

    var updateCachedVideoSize = function() {
      var oldVideoDivHeight = videoDivHeight;
      var oldVideoDivWidth = videoDivWidth;
      var $videoDiv = $("#" + videoDivId);
      videoDivHeight = $videoDiv.height();
      videoDivWidth = $videoDiv.width();
      videoDivRatio = Math.round((videoDivWidth / videoDivHeight) * 100) / 100;
      if (videoQualityHeight == oldVideoDivHeight && videoQualityWidth == oldVideoDivWidth) {
        videoQualityHeight = videoDivHeight;
        videoQualityWidth = videoDivWidth;
      }
      setVideoRatioBar();
    };
    this.updateCachedVideoSize = updateCachedVideoSize;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    createScaleBarElements();
    if (enableVideoQualitySelector == true && UTIL.getUnsafeHashVars().presentation == undefined)
      createVideoQualityElements();
  };
  //end of org.gigapan.timelapse.ScaleBar
})();
//end of (function() {
