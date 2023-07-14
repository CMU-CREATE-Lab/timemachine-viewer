/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Global object that is used to query frames for taking snapshots for images/gifs/videos.
 * Used by the CREATE Lab's thumbnail service API.
 *
 * Dependencies:
 *  None
 *
 * Copyright 2023 Carnegie Mellon University. All rights reserved.
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

var gFrameGrab = {};
window.gFrameGrab = gFrameGrab;

gFrameGrab.apiVersion = 2;

gFrameGrab.isLoaded = function() { return false; }

// update:  trigger a redraw for platform
// cancelAnimationFrames:  stop auto-updating and let us do it manually
gFrameGrab.init = function(update, cancelAnimationFrames, timelapse, isLoaded) {
  gFrameGrab._update = update;
  gFrameGrab._cancelAnimationFrames = cancelAnimationFrames;
  gFrameGrab._timelapse = timelapse;

  // If no isLoaded function is provided, fallback to default timelapse viewer version
  if (typeof(isLoaded) !== "function") {
    var isLoaded = function() {
      return (typeof(gFrameGrab._timelapse) == "object" && gFrameGrab._timelapse.didFirstTimeLoadAndPlayerReadyCallback());
    }
  }
  gFrameGrab.isLoaded = isLoaded;
}

gFrameGrab.setState = function(state) {
  gFrameGrab._timelapse.setNewView(state.bounds, true);
  gFrameGrab._timelapse.seek(state.seek_time);
}

gFrameGrab.captureFrame = function(state) {
  gFrameGrab._cancelAnimationFrames();
  gFrameGrab.setState(state);
  //var before_frameno = timelapse.frameno;
  gFrameGrab._update();

  return {
    complete: gFrameGrab._timelapse.lastFrameCompletelyDrawn,
    after_time: gFrameGrab._timelapse.getCurrentTime(),
    /*before_frameno: before_frameno,
    frameno: gEarthTime.timelapse.frameno,*/
    aux_info: {}
  }
}

// Capture as many frames as there are elements in the states array
// Use requestAnimationFrame for each frame, to signal to Chrome Headless Experimental Capture
// to capture and return to puppeteer.
// Note that some frames will be incomplete, which means we retry.  But the incomplete frames are
// still transmitted to puppeteer because we have no way to cancel them.  Instead, we return
// an array that describes each frame sent, and for complete frames, which frame # requested it corresponds to.
// Null elements of the return array indicate frames that were incomplete and should be discarded.

gFrameGrab.captureFrames = async function(states) {
  let capturedFrames = [];
  // Ask platform to stop requesting animation frames.  We should be the only thing requesting frames.
  gFrameGrab._cancelAnimationFrames();
  let frameno = 0;
  console.log(`captureFrames: Starting capture of ${states.length} frames`);
  let current_state_frame = null;
  while (frameno < states.length) {
    let state = states[frameno];
    if (frameno != current_state_frame) {
      gFrameGrab.setState(state);
      current_state_frame = frameno;
    }

    // Request and wait for animation frame, paint and record results
    await new Promise(resolve => {
      // Handles the animation frame we're requesting
      function update() {
        // Tell platform to paint
        console.log("Called from requestAnimationFrame, about to _update");
        gFrameGrab._update();
        console.log("Done with _update, checking if completely drawn");
        if (gFrameGrab._timelapse.lastFrameCompletelyDrawn) {
          console.log(`Successfully grabbed frame ${frameno}`);
          // Last frame was completely drawn, so declare success
          // Record frame number and advance to next frame
          capturedFrames.push(frameno);
          frameno++;
        } else {
          // Not yet complete, must try again.  Record "null" so the caller knows to ignore this frame.
          console.log(`Unsuccessful attempt for frame ${frameno}`);
          capturedFrames.push(null);
        }
        // Resolve promise to let loop advance to next capture
        resolve();
      }

      // Request the animation frame
      console.log("Requesting animation frame");
      window.requestAnimationFrame(update);
    });

  }
  console.log(`captureFrames: Captured ${states.length} complete frames in a total of ${capturedFrames.length} attempts`);
  console.log(capturedFrames);
  return capturedFrames;
}

gFrameGrab.getPlaybackTimeFromStringDate = function(date) {
  return gFrameGrab._timelapse.playbackTimeFromShareDate(date);
}

gFrameGrab.getEndPlaybackTime = function() {
  return gFrameGrab._timelapse.getDuration();
}
