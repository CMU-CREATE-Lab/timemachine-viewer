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
      org.gigapan.Util = function()
         {
         };

      org.gigapan.Util.log = function(str)
         {
            var now = (new Date()).getTime();
            var mins = ("0" + Math.floor((now / 60000) % 60)).substr(-2);
            var secs = ("0" + ((now / 1000) % 60).toFixed(3)).substr(-6);
            console.log(mins + ":" + secs + ": " + str);
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
   })();
