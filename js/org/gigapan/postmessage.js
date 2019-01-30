/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Class for sending and receiving postMessages.
 * Based off the library by Daniel Park (http://metaweb.com, http://postmessage.freebaseapps.com)
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
 *
 */

"use strict";

(function(window) {
  // Send postMessages.
  window.pm = function(options) {
    pm.send(options);
  };

  // Bind a handler to a postMessage response.
  window.pm.bind = function(type, fn) {
     pm.bind(type, fn);
  };

  // Unbind postMessage handlers
  window.pm.unbind = function(type, fn) {
    pm.unbind(type, fn);
  };

  var pm = {
    // The origin domain.
    _origin: null,

    // Internal storage (keep track of listeners, etc).
    data: function(key, value) {
      if (value === undefined) {
        return pm._data[key];
      }
      pm._data[key] = value;
      return value;
    },

    _data: {},

    // Send postMessages.
    send: function(options) {
      if (!options) {
        console.warn("Need to specify at least 3 options (origin, target, type).");
        return;
      }
      if (options.origin) {
        if (!pm._origin) {
          pm._origin = options.origin;
        }
      } else {
        console.warn("postMessage origin must be specified.");
        return;
      }
      var target = options.target;
      if (!target) {
        console.warn("postMessage target window required.");
        return;
      }
      if (!options.type) {
        console.warn("postMessage message type required.");
        return;
      }
      var msg = {data: options.data, type: options.type};
      if ("postMessage" in target) {
        // Send the postMessage.
        try {
          target.postMessage(JSON.stringify(msg), options.origin);
        } catch (ex) {
          console.warn("postMessage failed with " + ex.name + ":", ex.message);
        }
      } else {
        console.warn("postMessage not supported");
      }
    },

    // Listen to incoming postMessages.
    bind: function(type, fn) {
      if (!pm.data("listening.postMessage")) {
        if (window.addEventListener) {
          window.addEventListener("message", pm._dispatch, false);
        }
        // Make sure we create only one receiving postMessage listener.
        pm.data("listening.postMessage", true);
      }
      // Keep track of listeners and their handlers.
      var listeners = pm.data("listeners.postMessage");
      if (!listeners) {
        listeners = {};
        pm.data("listeners.postMessage", listeners);
      }
      var fns = listeners[type];
      if (!fns) {
        fns = [];
        listeners[type] = fns;
      }
      fns.push({fn: fn, origin: pm._origin});
    },

    // Unbind postMessage listeners.
    unbind: function(type, fn) {
      var listeners = pm.data("listeners.postMessage");
      if (listeners) {
        if (type) {
          if (fn) {
            // Remove specific listener
            var fns = listeners[type];
            if (fns) {
              var newListeners = [];
              for (var i = 0, len = fns.length; i < len; i++) {
                var obj = fns[i];
                if (obj.fn !== fn) {
                  newListeners.push(obj);
                }
              }
              listeners[type] = newListeners;
            }
          } else {
            // Remove all listeners by type
            delete listeners[type];
          }
        } else {
          // Unbind all listeners of all types
          for (var i in listeners) {
            delete listeners[i];
          }
        }
      }
    },

    // Run the handler, if one exists, based on the type defined in the postMessage.
    _dispatch: function(e) {
      var msg = {};
      try {
        msg = JSON.parse(e.data);
      } catch (ex) {
        console.warn("postMessage data parsing failed: ", ex);
        return;
      }
      if (!msg.type) {
        console.warn("postMessage message type required.");
        return;
      }
      var listeners = pm.data("listeners.postMessage") || {};
      var fns = listeners[msg.type] || [];
      for (var i = 0, len = fns.length; i < len; i++) {
        var obj = fns[i];
        if (obj.origin && obj.origin !== '*' && e.origin !== obj.origin) {
          console.warn("postMessage message origin mismatch: ", e.origin, obj.origin);
          continue;
        }
        // Run handler
        try {
          obj.fn(msg.data);
        } catch (ex) {
          throw ex;
        }
      }
    }
  };
 })(this);
