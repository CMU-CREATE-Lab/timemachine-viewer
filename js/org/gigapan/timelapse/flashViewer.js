var playlistPath = "../flash/playlists/INSERTNAME/INSERTNAME-512x288_playlist.xml";

function initFlashViewer() {
   //Get the name of the dataset from the url
   //Might be better to do this from json but we do not
   //have direct access if we are loading the flash viewer
   var tmpArray = document.location.href.split('/');
   var datasetName = tmpArray[tmpArray.length-1]; 
   playlistPath = playlistPath.replace(/INSERTNAME/g,datasetName);

   jwplayer("container").setup({
      flashplayer: "../flash/player.swf",
      height: 288,
      width: 512,
      skin: '../flash/beelden.zip',
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
   $("#flash_video_player").show();
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
   var playlistIndex = tmpArray[tmpArray.length - 1];

   //jump to this point in the playlist and start playing
   //org.gigapan.Util.log("STATE BEFORE LOAD: " + jwplayer().getState());
   jwplayer().playlistItem(playlistIndex-1);
   //org.gigapan.Util.log("STATE BEFORE LOAD: " + jwplayer().getState());
}

function resizeFlashPlayer(size) {
   if (size == "small") {
	$("#container").css( {"width": "512px"} );
	$("#container").css( {"height": "288px"} );
	$("#flash_video_controls").css( {"left": "400px"} );
	$("#flash_video_controls").css( {"top": "395px"} );
	$("#content").css( {"padding": "0px 0px 0px 0px"} );
	$("#firstHeading").css( {"top": "450px"} );
	$("#snaplapse-annotation-description").css( {"left": "-22px"} );
	newPlaylistPath = playlistPath.replace("816x468", "512x288");
   } else if (size == "large") {
	$("#container").css( {"width": "816px"} );
	$("#container").css( {"height": "468px"} );
	$("#flash_video_controls").css( {"left": "706px"} );
	$("#flash_video_controls").css( {"top": "575px"} );
	$("#content").css( {"padding": "0px 0px 0px 305px"} );
	$("#firstHeading").css( {"top": "600px"} );
	$("#snaplapse-annotation-description").css( {"left": "283px"} );
	newPlaylistPath = playlistPath.replace("512x288", "816x468");
   }
   var seekTime = jwplayer().getPosition();
   //org.gigapan.Util.log("STATE BEFORE LOAD: " + jwplayer().getState());
   //org.gigapan.Util.log("playlist: " + playlistPath);
   playlistPath = newPlaylistPath;
   //org.gigapan.Util.log("playlist: " + playlistPath);
   //org.gigapan.Util.log("fileName: " + jwplayer().getPlaylistItem()['file']);
   jwplayer().load(playlistPath);
   //org.gigapan.Util.log("STATE AFTER LOAD: " + jwplayer().getState());
   var t=setTimeout(doSeekDelay,200,seekTime);
}

function doSeekDelay(seekTime) {
   if (jwplayer().getState() != "PLAYING") {
	//org.gigapan.Util.log("player is not in a state for seeking, wait 100 ms before trying to seek");
	var t=setTimeout(doSeekDelay,100,seekTime);
   } else {
	//org.gigapan.Util.log("STATE BEFORE SEEKING: " + jwplayer().getState());
	//org.gigapan.Util.log("seeking");
	jwplayer().seek(seekTime);
	//org.gigapan.Util.log("fileName: " + jwplayer().getPlaylistItem()['file']);
   }
}
