// @license
// Redistribution and use in source and binary forms ...

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
// Paul Dille (pdille@andrew.cmu.edu)

var playlistPath = "../flash/playlists/INSERTNAME/INSERTNAME-512x288_playlist.xml";

function initFlashViewer() {
  //Get the name of the dataset from the url
  //Might be better to do this from json but we do not
  //have direct access if we are loading the flash viewer
  var tmpArray = document.location.href.split("/");
  var datasetName = tmpArray[tmpArray.length - 1];
  playlistPath = playlistPath.replace(/INSERTNAME/g, datasetName);

  jwplayer("container").setup({
    flashplayer: "../flash/player.swf",
    height: 512,
    width: 288,
    skin: "../flash/beelden.zip",
    allowscriptaccess: "always",
    autostart: "true",
    plugins: "captions-2",
    "captions.back": false,
    dock: true,
    "playlistfile": playlistPath
  });

  //We need autostart set to true for when we change
  //the flash player size and switch playlists. This
  //allows for the same video to start playing again.
  //However, we do not want a video to be playing
  //in the hidden player when the page first loads,
  //so we need to stop it.
  jwplayer().stop();
}

function loadVideoSnaplapse(wikiSnaplapseFileName) {
  //make the flash play visible
  //$("#flash_video_player").show();
  $("#flash_video_player").css({
    "visibility": "visible"
  });

  //make sure any warnings are hidden
  $("#browser_not_supported").hide();
  $("#html5_overridden_message").hide();

  //reload the playlist
  //this fixes an issue with IE where the video does not display (but subtiles/audio do)
  //when unhiding the video player
  jwplayer().load(playlistPath);

  //remove the wiki specific url encoding
  var removedWords = eval("/Media:|.warp/ig");
  var snaplapseFileName = wikiSnaplapseFileName.replace(removedWords, "");

  //grab the snaplapse #
  //this number - 1 corresponds to its index in the playlist
  var tmpArray = snaplapseFileName.split("_");
  var playlistIndex = parseInt(tmpArray[tmpArray.length - 1]);

  //if we could not grab the proper index, just default to the first video in the playlist
  if (isNaN(playlistIndex)) {
    org.gigapan.Util.error("Error reading in playlist index number from .warp file.");
    playlistIndex = 0;
  }

  //jump to this point in the playlist and start playing
  jwplayer().playlistItem((playlistIndex - 1));
}

function resizeFlashPlayer(size) {
  if (size == "small") {
    $("#container").css({
      "width": "512px"
    });
    $("#container").css({
      "height": "288px"
    });
    $("#flash_video_controls").css({
      "left": "395px"
    });
    $("#flash_video_controls").css({
      "top": "400px"
    });
    $("#content").css({
      "padding": "0px 0px 0px 0px"
    });
    $("#firstHeading").css({
      "top": "450px"
    });
    $("#snaplapse-annotation-description").css({
      "left": "-22px"
    });
    newPlaylistPath = playlistPath.replace("816x468", "512x288");
  } else if (size == "large") {
    $("#container").css({
      "width": "816px"
    });
    $("#container").css({
      "height": "468px"
    });
    $("#flash_video_controls").css({
      "left": "701px"
    });
    $("#flash_video_controls").css({
      "top": "580px"
    });
    $("#content").css({
      "padding": "0px 0px 0px 305px"
    });
    $("#firstHeading").css({
      "top": "600px"
    });
    $("#snaplapse-annotation-description").css({
      "left": "283px"
    });
    newPlaylistPath = playlistPath.replace("512x288", "816x468");
  }

  var seekTime = jwplayer().getPosition();
  playlistPath = newPlaylistPath;
  jwplayer().load(playlistPath);
  var t = setTimeout(doSeekDelay, 200, seekTime);
}

function doSeekDelay(seekTime) {
  //player is not in a state for seeking, wait 100 ms before trying to seek
  if (jwplayer().getState() != "PLAYING") {
    var t = setTimeout(doSeekDelay, 100, seekTime);
  } else {
    jwplayer().seek(seekTime);
  }
}
