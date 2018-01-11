// @license
// Redistribution and use in source and binary forms ...

// Class containing various (static) generic utility methods.
//
// Dependencies: None
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
// Randy Sargent (randy.sargent@cs.cmu.edu)

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
//

//
// CODE
//
(function() {
  var navigatorUserAgent = navigator.userAgent;
  var isMSIEUserAgent = navigatorUserAgent.match(/MSIE|Trident|Edge/) != null;
  var matchIEPre11VersionString = navigatorUserAgent.match(/MSIE\s([\d]+)/);
  var isIEEdgeUserAgent = !!(isMSIEUserAgent && navigatorUserAgent.match(/Edge\/([\d]+)/))
  var isIE9UserAgent = !!(isMSIEUserAgent && matchIEPre11VersionString && parseInt(matchIEPre11VersionString[1]) == 9);
  // The Edge (IE 12+) user agent actually has the word "Chrome" in it.
  var isChromeUserAgent = navigatorUserAgent.match(/Chrome/) != null && !isMSIEUserAgent;
  var isMac = navigatorUserAgent.match(/Macintosh/) != null;
  var matchChromeVersionString = navigatorUserAgent.match(/Chrome\/([0-9.]+)/);
  // The Chrome and Edge (IE 12+) user agents actually have the word "Safari" in it.
  var isSafariUserAgent = navigatorUserAgent.match(/Safari/) != null && !isChromeUserAgent && !isMSIEUserAgent;
  var isFirefoxUserAgent = navigatorUserAgent.match(/Firefox/) != null;
  var isOperaLegacyUserAgent = typeof (window.opera) !== "undefined";
  var isOperaUserAgent = navigatorUserAgent.match(/OPR/) != null;
  var isSilkUserAgent = navigatorUserAgent.match(/Silk/) != null;
  var isMobileIEEdgeUserAgent = navigatorUserAgent.match(/EdgA/) != null;
  var isChromeOS = navigatorUserAgent.match(/CrOS/) != null;
  var isSamsungInternetUserAgent = navigatorUserAgent.match(/SamsungBrowser/) != null;
  var isMobileDevice = !isChromeOS && (navigatorUserAgent.match(/Android/i) || navigatorUserAgent.match(/webOS/i) || navigatorUserAgent.match(/iPhone/i) || navigatorUserAgent.match(/iPad/i) || navigatorUserAgent.match(/iPod/i) || navigatorUserAgent.match(/BlackBerry/i) || navigatorUserAgent.match(/Windows Phone/i) || navigatorUserAgent.match(/Mobile/i)) != null;
  var isIOSDevice = navigatorUserAgent.match(/iPad|iPhone|iPod/) != null;
  var matchIOSVersionString = navigatorUserAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  // iOS 10 is the first version to support auto play of videos.
  // That said, I've confirmed that v9.3.5 does autoplay, but devices running that version just don't have the hardware power for a good user experience.
  var isSupportedIOSVersion = isIOSDevice && parseInt(matchIOSVersionString[1]) >= 10;
  // Chrome 53 is the first version to support autoplay of videos on mobile.
  // Chrome 54 added background playback of media, which shouldn't be relevant to our needs but it might be.
  var isSupportedChromeMobileVersion = isChromeUserAgent && parseInt(matchChromeVersionString[1]) >= 54;
  var matchAndroidVersionString = navigatorUserAgent.match(/Android (\d+(?:\.\d+){1,2})/);
  // There's no good way to detect Android devices that have powerful gpus/cpus so look at screen resolution and then combine that with Android version check further below.
  var minAndroidResolutionInPixelsForCanvasOnOldDevices = 600*1024;
  var currentDeviceResolutionInPixels = window.screen.width * window.screen.height;
  var isSupportedFirefoxMobileAndroid = matchAndroidVersionString && parseInt(matchAndroidVersionString[1]) > 4;

  var mediaType = null;
  // Force Safari on mobile to use canvas: Strange jitter/zoom with video tag
  // Force Firefox on mobile to use video tag: Throws an "exception component is not available" error when drawing a video to canvas
  var viewerType = ((isSafariUserAgent && !isMobileDevice) || (isFirefoxUserAgent && isMobileDevice) || (isChromeOS && parseInt(matchChromeVersionString[1]) < 54) || (matchAndroidVersionString && parseInt(matchAndroidVersionString[1]) < 6 && currentDeviceResolutionInPixels > minAndroidResolutionInPixelsForCanvasOnOldDevices)) ? "video" : "canvas";
  var rootAppURL = computeRootAppURL();
  var supportedMediaTypes = [];
  var scrollBarWidth = null;
  var doDraw = true;

  //0 == none
  //1 == errors only
  //2 == verbose (everything)
  var loggingLevel = 1;

  org.gigapan.Util = function() {
  };

  org.gigapan.Util.setLoggingLevel = function(newLevel) {
    if (newLevel < 0 || newLevel > 2)
      newLevel = 1;
    loggingLevel = newLevel;
  };

  org.gigapan.Util.isMobileSupported = function() {
    //// The following mobile browsers do not currently support autoplay of videos
    // Opera Mobile
    // Samsung Internet
    //// The following mobile browsers are failing to display the video, though autoplay is supported
    // Microsoft Edge Mobile
    // Firefox Mobile on Android <= 4.4
    return isMobileDevice && (isSupportedIOSVersion || (isSupportedChromeMobileVersion && !isOperaUserAgent && !isMobileIEEdgeUserAgent && !isSamsungInternetUserAgent) || (isFirefoxUserAgent && isSupportedFirefoxMobileAndroid));
  };

  org.gigapan.Util.isTouchDevice = function() {
    try{
      document.createEvent("TouchEvent");
      return true;
    }catch(e){
      return false;
    }
  };

  org.gigapan.Util.getScrollBarWidth = function() {
    if (scrollBarWidth == null) {
      var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body');
      var widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
      $outer.remove();
      scrollBarWidth = 100 - widthWithScroll;
      // Default scrollbar width for Macs which report 0 if no mouse is plugged in in combination with specific system settings.
      if (scrollBarWidth == 0)
        scrollBarWidth = 17;
    }
    return scrollBarWidth;
  };

  org.gigapan.Util.getParentURL = function() {
    var parentUrl = "";
    if (window.top === window.self) {
      // no iframe
      parentUrl = window.location.href.split("#")[0];
    } else {
      // inside iframe
      parentUrl = document.referrer.split("#")[0];
    }
    return parentUrl;
  };

  org.gigapan.Util.browserSupported = function(forcedMediaType) {
    var v = document.createElement('video');

    // Restrictions on which mobile devices work
    if (isMobileDevice && !org.gigapan.Util.isMobileSupported())
      return false;
    // Check if the video tag is supported
    if (!!!v.canPlayType)
      return false;
    // See what video formats are actually supported
    //if (!mediaType) {
      org.gigapan.Util.setMediaType(forcedMediaType);
    //}
    // We may support the video tag, but perhaps we do not support the formats that our viewer uses
    if (supportedMediaTypes.length == 0)
      return false;
    // If a format is being forced via the viewer settings, check that the browser actually supports it
    if (forcedMediaType && supportedMediaTypes.indexOf(forcedMediaType) < 0)
      return false;
    // The viewer is supported by the browser
    return true;
  };

  org.gigapan.Util.isChrome = function() {
    return isChromeUserAgent;
  };

  org.gigapan.Util.isSafari = function() {
    return isSafariUserAgent;
  };

  org.gigapan.Util.isIE = function() {
    return isMSIEUserAgent;
  };

  org.gigapan.Util.isFirefox = function() {
    return isFirefoxUserAgent;
  };

  org.gigapan.Util.isIE9 = function() {
    return isIE9UserAgent;
  };

  org.gigapan.Util.isIEEdge = function() {
    return isIEEdgeUserAgent;
  };

  org.gigapan.Util.isOperaLegacy = function() {
    return isOperaLegacyUserAgent;
  };

  org.gigapan.Util.isOpera = function() {
    return isOperaUserAgent;
  };

  org.gigapan.Util.isMobileDevice = function() {
    return isMobileDevice;
  };

  org.gigapan.Util.isMac = function() {
    return isMac;
  };

  org.gigapan.Util.isWebGLSupported = function() {
    try{
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('experimental-webgl'));
    } catch(e) {
      return false;
    }
  };

  org.gigapan.Util.getGPURenderer = function() {
    var canvas;
    var gl;
    var debugInfo;
    var vendor;
    var renderer;

    try {
      canvas = document.createElement('canvas');
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
    }

    if (gl) {
      debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (renderer) {
        renderer = renderer.replace("(TM)", "").replace(/\s+/g,' ');
      }
    }

    return renderer;
  };

  org.gigapan.Util.getMediaType = function() {
    return mediaType;
  };

  org.gigapan.Util.setMediaType = function(newType) {
    var v = document.createElement('video');
    if (!mediaType) { // If this is the first time we are setting the media type, check what formats are supported.
      if (!!v.canPlayType('video/webm; codecs="vp8"').replace(/no/, '')) {
        supportedMediaTypes.push(".webm");
      }
      if (!!v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, '')) {
        supportedMediaTypes.push(".mp4");
      }
      if (newType) // If a video format is being forced via the viewer settings, use it.
        mediaType = newType;
      else // If the browser supports both types, default to webm. Note that there might be no supported types and thus mediaType will be set to undefined.
        mediaType = supportedMediaTypes[0];
    } else { // Else set to the format passed in.
      mediaType = newType;
    }
  };

  org.gigapan.Util.getViewerType = function() {
    return viewerType;
  };

  org.gigapan.Util.setViewerType = function(type) {
    if (type != "canvas" && type != "webgl" && type != "video")
      return;
    viewerType = type;
  };

  org.gigapan.Util.playbackRateSupported = function() {
    var video = document.createElement("video");
    return !!video.playbackRate;
  };

  org.gigapan.Util.fullScreenAPISupported = function() {
    // Older webkits do not support fullscreen across iframes.
    if (document.webkitCancelFullScreen && !document.webkitExitFullscreen) {
      return (self === top)
    }
    return !!(document.documentElement.requestFullscreen || document.documentElement.msRequestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullScreen);
  }

  org.gigapan.Util.isNumber = function(n) {
    // Code taken from http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
    // Added check to ensure that the value being checked is defined
    return ( typeof (n) !== 'undefined') && !isNaN(parseFloat(n)) && isFinite(n);
  };

  org.gigapan.Util.log = function(str, logType) {
    if ( typeof (console) == 'undefined' || console == null)
      return;
    var now = (new Date()).getTime();
    if (loggingLevel >= 2 || (loggingLevel == 1 && logType && logType == 1)) {
      console.log(org.gigapan.Util.convertTimeToMinsSecsString(now) + ": " + str);
    }
  };

  org.gigapan.Util.error = function(str) {
    org.gigapan.Util.log('*ERROR: ' + str, 1);
  };

  org.gigapan.Util.convertTimeToMinsSecsString = function(t) {
    var mins = ("0" + Math.floor((t / 60000) % 60)).substr(-2);
    var secs = ("0" + ((t / 1000) % 60).toFixed(3)).substr(-6);
    return mins + ":" + secs;
  };

  org.gigapan.Util.dumpObject = function(obj) {
    if ( typeof obj != 'object') {
      return obj;
    }
    var ret = '{';
    for (var property in obj) {
      if (ret != '{') {
        ret += ',';
      }
      ret += property + ':' + obj[property];
    }
    ret += '}';
    return ret;
  };

  org.gigapan.Util.getCurrentTimeInSecs = function() {
    return 0.001 * (new Date()).getTime();
  };

  org.gigapan.Util.formatTime = function(theTime, willShowMillis, willShowHours) {
    var t = parseFloat(theTime.toFixed(3));
    var hours = Math.floor(t / 3600);
    var minutes = Math.floor(t / 60) - (hours * 60);
    var seconds = Math.floor(t - (hours * 3600) - (minutes * 60));
    var millis = Math.floor(parseFloat((t - Math.floor(t)).toFixed(2)) * 100);

    var hoursStr = '' + hours;
    var minutesStr = '' + minutes;
    var secondsStr = '' + seconds;
    var millisStr = '' + millis;
    if (hours < 10) {
      hoursStr = "0" + hoursStr;
    }
    if (minutes < 10) {
      minutesStr = "0" + minutesStr;
    }
    if (seconds < 10) {
      secondsStr = "0" + secondsStr;
    }
    if (millis < 10) {
      millisStr = "0" + millisStr;
    }

    return ( willShowHours ? hoursStr + ':' : '') + minutesStr + ":" + secondsStr + ( willShowMillis ? "." + millisStr : '');
  };

  // Wrapper for ajax calls
  org.gigapan.Util.ajax = function(dataType, rootPath, path, callback) {
    var ajaxUrl = rootPath + path;
    var doNormalAjax = false;

    // Check that there is a global cache object
    if ( typeof (cached_ajax) !== "undefined") {
      if ( typeof (cached_ajax[ajaxUrl]) === "undefined") {
        // If the key does not include the absolute dataset URL,
        // perhaps it is relative and in the form of "./foo.bar"
        ajaxUrl = "./" + path;
        if ( typeof (cached_ajax[ajaxUrl]) === "undefined") {
          // Lastly, remove rootPath from path and try again.
          ajaxUrl = path.substr(path.indexOf(rootPath) + 1);
          if ( typeof (cached_ajax[ajaxUrl]) === "undefined") {
            doNormalAjax = true;
          }
        }
      }

      if (!doNormalAjax) {
        callback(cached_ajax[ajaxUrl]);
        return;
      }
    }

    // Nothing cached, so do an actual request
    ajaxUrl = rootPath + path;
    $.ajax({
      dataType: dataType,
      url: ajaxUrl,
      success: function(data) {
        if (data)
          callback(data);
      },
      error: function() {
        org.gigapan.Util.error("Error loading file from path [" + ajaxUrl + "]");
        return;
      }
    });
  };

  org.gigapan.Util.htmlForTextWithEmbeddedNewlines = function(text) {
    if (text === undefined)
      return;
    var htmls = [];
    var lines = text.split(/\n/);
    var className = "";
    for (var i = 0; i < lines.length; i++) {
      if (i == 0)
        className = "captureTimeMain";
      else
        className = "captureTimeSub" + i;
      htmls.push(jQuery(document.createElement('div')).html("<div class=\"" + className + "\">" + lines[i]).html() + "</div>");
    }
    return htmls.join("");
  };

  org.gigapan.Util.unpackVars = function(str) {
    var vars = {};
    if (str) {
      var keyvals = str.split('&');
      for (var i = 0; i < keyvals.length; i++) {
        var keyval = keyvals[i].split('=');
        vars[keyval[0]] = keyval[1];
      }
    }
    return vars;
  };

  // Note: Hash string may contain potentially unsafe user-inputted data.
  // Caution must be taken when working with it.
  org.gigapan.Util.getUnsafeHashString = function() {
    var unsafeHashSource = "";
    var unsafeHashIframe = "";
    unsafeHashSource = window.location.hash;
    try {
      unsafeHashIframe = window.top.location.hash;
      if (unsafeHashSource)
        unsafeHashIframe = unsafeHashIframe.slice(1);
    } catch(e) {
      // Most likely we are dealing with different domains and cannot access window.top
    }
    if (unsafeHashIframe) {
      return unsafeHashSource + "&" + unsafeHashIframe;
    } else {
      return unsafeHashSource;
    }
  }

  // Note: Hash variables may contain potentially unsafe user-inputted data.
  // Caution must be taken when working with these values.
  org.gigapan.Util.getUnsafeHashVars = function() {
    var unsafeHashString = org.gigapan.Util.getUnsafeHashString();
    if (unsafeHashString.length > 1)
      unsafeHashString = unsafeHashString.slice(1);
    return org.gigapan.Util.unpackVars(unsafeHashString);
  };

  // Select an element in jQuery selectable
  org.gigapan.Util.selectSelectableElements = function($selectableContainer, $elementsToSelect, autoScroll) {
    if ($selectableContainer.length == 0)
      return;
    // Add unselecting class to all elements in the styleboard canvas except the ones to select
    $(".ui-selected", $selectableContainer).not($elementsToSelect).removeClass("ui-selected").addClass("ui-unselecting");
    // Add ui-selecting class to the elements to select
    $elementsToSelect.not(".ui-selected").addClass("ui-selecting");
    // Refresh the selectable to prevent errors
    $selectableContainer.selectable('refresh');
    // Trigger the mouse stop event (this will select all .ui-selecting elements, and deselect all .ui-unselecting elements)
    $selectableContainer.data("uiSelectable")._mouseStop(null);
    // Scroll to the position
    if (autoScroll == true) {
      var $selectableContainerParent = $selectableContainer.parent();
      $selectableContainerParent.scrollLeft(Math.round($elementsToSelect.position().left - $selectableContainerParent.width() / 3));
    }
  };

  org.gigapan.Util.getSharedDataType = function() {
    var unsafe_matchURL = org.gigapan.Util.getUnsafeHashString().match(/#(.+)/);
    if (unsafe_matchURL) {
      var unsafe_sharedVars = org.gigapan.Util.unpackVars(unsafe_matchURL[1]);
      if (unsafe_sharedVars.tour) {
        return "tour";
      } else if (unsafe_sharedVars.presentation) {
        return "presentation";
      } else {
        return null;
      }
    } else {
      return null;
    }
  };

  // Select an element in jQuery sortable
  org.gigapan.Util.selectSortableElements = function($sortableContainer, $elementsToSelect, autoScroll, scrollStartCallback) {
    if ($sortableContainer.length == 0)
      return;
    // Add unselecting class to all elements in the styleboard canvas except the ones to select
    var $unselectedItems = $(".ui-selected", $sortableContainer).not($elementsToSelect).removeClass("ui-selected");
    for (var i = 0; i < $unselectedItems.length; i++)
      org.gigapan.Util.changeBackgroundColorOpacity($unselectedItems[i], 0);
    // Add ui-selecting class to the elements to select
    var $selectedItems = $elementsToSelect.not(".ui-selected").addClass("ui-selected");
    for (var i = 0; i < $selectedItems.length; i++)
      org.gigapan.Util.changeBackgroundColorOpacity($selectedItems[i], 0.15);
    // Refresh the selectable to prevent errors
    $sortableContainer.sortable('refresh');
    // Scroll to the position
    if (autoScroll) {
      var $keyframeContainer = $sortableContainer.parent();
      var containerOffset = $keyframeContainer.offset();
      var containerWidth = $keyframeContainer.width();
      var elementOffset = $elementsToSelect.offset();
      var elementWidth = $elementsToSelect.width();
      var keyframeContainerLeftMargin = parseInt($sortableContainer.css("margin-left"));
      var distanceBetweenElementAndLeftEdge = elementOffset.left + elementWidth - containerOffset.left - keyframeContainerLeftMargin;
      var distanceBetweenElementAndRightEdge = containerWidth - elementOffset.left + containerOffset.left;
      var scrollLeftPx;
      var scrollDuration = (autoScroll == "noAnimation") ? 0 : 500;
      if (distanceBetweenElementAndRightEdge < elementWidth * 2.52) {
        scrollLeftPx = $keyframeContainer.scrollLeft() + (elementWidth * 2.52 - distanceBetweenElementAndRightEdge);
      } else if (distanceBetweenElementAndLeftEdge < elementWidth * 2.52) {
        scrollLeftPx = $keyframeContainer.scrollLeft() - (elementWidth * 2.52 - distanceBetweenElementAndLeftEdge);
      }
      if (scrollLeftPx) {
        $keyframeContainer.stop(true, true).animate({
          scrollLeft: scrollLeftPx
        }, {
          duration: scrollDuration,
          complete: function() {
            if (scrollStartCallback)
              scrollStartCallback();
          }
        });
      } else {
        if (scrollStartCallback) {
          scrollStartCallback();
        }
      }
    }
  };

  org.gigapan.Util.changeBackgroundColorOpacity = function(element, opacity) {
    var $element = $(element);
    // Get the original color
    var tagColor = element.style.backgroundColor;
    var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
    // Restore the original color
    var colorStr = "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + "," + opacity + ")";
    if ($element.hasClass("snaplapse_keyframe_list_item"))
      $element.find(".keyframe_table").css("background-color", colorStr);
  };

  org.gigapan.Util.getRootAppURL = function() {
    return rootAppURL;
  };

  org.gigapan.Util.addGoogleAnalyticEvent = function(category, action, label) {
    var settings, isGoogleAnalyticEventTrackingEnabled;
    if ( typeof timelapse != "undefined") {
      settings = timelapse.getSettings();
      if ( typeof settings != "undefined")
        isGoogleAnalyticEventTrackingEnabled = ( typeof (settings["isGoogleAnalyticEventTrackingEnabled"]) == "undefined") ? false : settings["isGoogleAnalyticEventTrackingEnabled"];
    }
    if ( typeof (ga) != "undefined" && isGoogleAnalyticEventTrackingEnabled)
      ga('send', 'event', category, action, label);
  };

  // Compute the actual style for an element as defined inline or in a stylesheet.
  // This is useful because jQuery will return a value no matter what, even if it uses
  // default browser values. With this function, we see whether the user actually defined
  // the style manually.
  org.gigapan.Util.getElementStyle = function(selector, style, sheet) {
    var sheets = typeof sheet !== 'undefined' ? [sheet] : document.styleSheets;
    for (var i = 0, l = sheets.length; i < l; i++) {
        var sheet = sheets[i];
        // cssRules respects same-origin policy, as per
        // https://code.google.com/p/chromium/issues/detail?id=49001#c10.
        try {
          // In Chrome, if the stylesheet originates from a different domain,
          // sheet.cssRules simply won't exist. I believe the same is true for IE, but
          // I haven't tested it.
          //
          // In Firefox, if stylesheet originates from a different domain, trying
          // to access sheet.cssRules will throw a SecurityError. Hence, we must use
          // try/catch to detect this condition in Firefox.
          if (!sheet.cssRules)
            continue;
        } catch(e) {
          // Rethrow exception if it's not a SecurityError. Note that SecurityError
          // exception is specific to Firefox.
          if (e.name !== 'SecurityError')
            throw e;
          continue;
        }
        for (var j = 0, k = sheet.cssRules.length; j < k; j++) {
          var rule = sheet.cssRules[j];
          if (rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1) {
            if (!rule.style[style])
              break;
            return rule.style[style];
          }
        }
    }
    var $selector = $(selector);
    if ($selector.length > 0) {
      var styleValue = $selector[0].style[style];
      return styleValue ? styleValue : null;
    }
    return null;
  }

  // Convert relative paths to absolute ones.
  org.gigapan.Util.relativeToAbsolutePath = function(url) {
    var loc = location.href;
    loc = loc.substring(0, loc.lastIndexOf('/'));
    while (/^\.*\//.test(url)) {
      var numToChop = (url.substr(0,2) == "./") ? 2 : 3;
      // We are of the form ../ and need to backtrack a level.
      if (numToChop == 3)
        loc = loc.substring(0, loc.lastIndexOf('/'));
      url = url.substring(numToChop);
    }
    return loc + '/' + url;
  }

  // Compute the root URL for where all the Time Machine files exist.
  // Note: Need to be run when loading a Time Machine file or the returned
  // path will not useful. For example, if we call this after everything is loaded
  // and the last include is of say external Google Maps, then we get an
  // external path and not one that points to the Time Machine source directory.
  function computeRootAppURL() {
    var jsFiles = $("script");
    var pathOfCurrentScript = $(jsFiles[jsFiles.length - 1]).attr("src");
    var isAbsoluteURL = pathOfCurrentScript.indexOf('://');
    if (isAbsoluteURL > 0) {
      // Include is an absolute URL "http(s)://..."
      var absoluteURLIndex = pathOfCurrentScript.indexOf('/', pathOfCurrentScript.indexOf('://') + 3);
      var absoluteURLName = pathOfCurrentScript.substring(0, absoluteURLIndex) + '/';
      var absoluteURLFolderIndex = pathOfCurrentScript.indexOf('/', pathOfCurrentScript.indexOf(absoluteURLName) + absoluteURLName.length);
      if (absoluteURLFolderIndex < 0) {
        return absoluteURLName;
      } else {
        return pathOfCurrentScript.substring(0, absoluteURLFolderIndex) + "/";
      }
    } else {
      // Include is a relative URL
      var relativeURL = pathOfCurrentScript.substr(0, pathOfCurrentScript.indexOf('/js/'));
      if (relativeURL !== "") relativeURL += "/"
      return relativeURL;
    }
  }

  org.gigapan.Util.gdocToJSON = function(gdocUrl, callback) {
    var ROOT_GDOC_URL = "https://docs-proxy.cmucreatelab.org/spreadsheets/d";
    var gdocId = gdocUrl.split("/d/")[1].split("/")[0];
    var gdocTabId = gdocUrl.split("#gid=")[1] || "0";
    $.ajax({
      url: ROOT_GDOC_URL + "/" + gdocId + "/export?format=tsv&id=" + gdocId + "&gid=" + gdocTabId,
      success: function(csvData) {
        callback(csvData);
      }
    });
  }

  org.gigapan.Util.setDrawState = function(newDoDraw) {
    doDraw = newDoDraw;
    if (timelapse && !doDraw) {
      var videoset = timelapse.getVideoset();
      var canvasContext = videoset.getCanvasContext();
      var canvas = videoset.getCanvas();
      if (canvas && canvasContext) {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        $(timelapse.getVideoDiv()).find("video").remove();
      }
      timelapse.hideSpinner(timelapse.getViewerDivId());
    }
  }

  org.gigapan.Util.doDraw = function() {
    return doDraw;
  }

  // Add horizontal scroll touch support to a jQuery HTML element.
  org.gigapan.Util.touchHorizontalScroll = function($elem) {
    var scrollStartPos = 0;
    $elem.on("touchstart", function(e) {
      scrollStartPos = this.scrollLeft + e.originalEvent.touches[0].pageX;
      e.preventDefault();
    }).on("touchmove", function(e) {
      this.scrollLeft = scrollStartPos - e.originalEvent.touches[0].pageX;
      e.preventDefault();
    });
  }

  // Add vertical scroll touch support to an HTML element
  org.gigapan.Util.verticalTouchScroll = function($elem){
    var el = $elem[0];
    var scrollStartPos = 0;
    el.addEventListener("touchstart", function(e) {
      scrollStartPos = this.scrollTop + e.touches[0].pageY;
      e.preventDefault();
    }, false);
    el.addEventListener("touchmove", function(e) {
      this.scrollTop = scrollStartPos - e.touches[0].pageY;
      e.preventDefault();
    }, false);
  }
})();
