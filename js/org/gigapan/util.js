//======================================================================================================================
// Class containing various (static) generic utility methods.
//
// Dependencies: None
//
// Authors:
// * Randy Sarget (randy.sargent@gmail.com)
// * Paul Dille (pdille@andrew.cmu.edu)
// * Chris Bartley (bartley@cmu.edu)
//======================================================================================================================

//======================================================================================================================
// VERIFY NAMESPACE
//======================================================================================================================
// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
if (!org)
   {
   org = {};
   }
else
   {
   if (typeof org != "object")
      {
      var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
      alert(orgExistsMessage);
      throw new Error(orgExistsMessage);
      }
   }

// Repeat the creation and type-checking for the next level
if (!org.gigapan)
   {
   org.gigapan = {};
   }
else
   {
   if (typeof org.gigapan != "object")
      {
      var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
      alert(orgGigapanExistsMessage);
      throw new Error(orgGigapanExistsMessage);
      }
   }
//======================================================================================================================

//======================================================================================================================
// CODE
//======================================================================================================================
(function()
   {
   var isChromeCached;
   var areLogging = true;
   var isChromeUserAgent = navigator.userAgent.match(/Chrome/) != null;
   var isSafariUserAgent = navigator.userAgent.match(/Safari/) != null  && !isChromeUserAgent;  // the Chrome user agent actually has the word "Safari" in it too!

   org.gigapan.Util = function()
      {
      };

   org.gigapan.Util.browserSupported = function()
      {
      //IE 9 specific check
      if ($.browser['msie'] && parseInt($.browser.version, 10) == 9)
         {
         return false;
         }
      var v = document.createElement('video');
      return !!(v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
      };

   org.gigapan.Util.isChrome = function()
      {
      return isChromeUserAgent;
      };

   org.gigapan.Util.isSafari = function()
      {
      return isSafariUserAgent;
      };

   org.gigapan.Util.isNumber = function(n)
      {
      // code taken from http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
      return !isNaN(parseFloat(n)) && isFinite(n);
      };

   org.gigapan.Util.log = function(str)
      {
      if (areLogging && typeof(console) !== 'undefined' && console != null)
         {
         var now = (new Date()).getTime();
         console.log(org.gigapan.Util.convertTimeToMinsSecsString(now) + ": " + str);
         }
      };

   org.gigapan.Util.convertTimeToMinsSecsString = function(t)
      {
      var mins = ("0" + Math.floor((t / 60000) % 60)).substr(-2);
      var secs = ("0" + ((t / 1000) % 60).toFixed(3)).substr(-6);
      return mins + ":" + secs;
      };

   org.gigapan.Util.error = function(str)
      {
      org.gigapan.Util.log('*ERROR: ' + str);
      };

   org.gigapan.Util.dumpObject = function(obj)
      {
      if (typeof obj != 'object')
         {
         return obj;
         }
      var ret = '{';
      for (var property in obj)
         {
         if (ret != '{')
            {
            ret += ',';
            }
         ret += property + ':' + obj[property];
         }
      ret += '}';
      return ret;
      };

   org.gigapan.Util.getCurrentTimeInSecs = function()
      {
      return .001 * (new Date()).getTime();
      };

   org.gigapan.Util.formatTime = function(theTime, willShowMillis)
      {
      var t = theTime.toFixed(3);
      var hours = Math.floor(t / 3600);
      var minutes = Math.floor(t / 60) - (hours * 60);
      var seconds = Math.floor(t - (hours * 3600) - (minutes * 60));
      var millis = Math.floor((t - Math.floor(t)).toFixed(2) * 100);

      var hoursStr = '' + hours;
      var minutesStr = '' + minutes;
      var secondsStr = '' + seconds;
      var millisStr = '' + millis;
      if (hours < 10)
         {
         hoursStr = "0" + hoursStr;
         }
      if (minutes < 10)
         {
         minutesStr = "0" + minutesStr;
         }
      if (seconds < 10)
         {
         secondsStr = "0" + secondsStr;
         }
      if (millis < 10)
         {
         millisStr = "0" + millisStr;
         }

      return hoursStr + ":" + minutesStr + ":" + secondsStr + (willShowMillis ? "." + millisStr : '');
      };

   org.gigapan.Util.isChrome = function()
      {
      if (isChromeCached != undefined)
         {
         return isChromeCached;
         }
      return isChromeCached = (navigator.userAgent.indexOf("Chrome") >= 0);
      };

   })();
