var timelapseMetadata;
var timelapseMetadataJSON;
var gigapanId;
var datasetIndex;
var gigapanDatasetsJSON;
var browserSupported;
var timelapseDurationInSeconds = 0.0;
var timeStepInSecs = 0.0;
var timelapseCurrentTimeInSeconds = 0.0;
var timelapse = null;
var playerSize = 1;
var playerLayer = 0;
var hasLayers = false;

org.gigapan.timelapse.VideosetStats.isEnabled = false;

function createTimelineSlider()
   {
   timelapseDurationInSeconds = (timelapse.getNumFrames() -1 ) / timelapse.getFps();
   timeStepInSecs = 1 / timelapse.getFps();
   $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds,true));
   $("#totalTime").text(org.gigapan.Util.formatTime(timelapseDurationInSeconds,true));

   $("#timelineSlider")['slider']({
                                     animate: true,
                                     value: 0,
                                     min: 0.0,
                                     max: timelapseDurationInSeconds,
                                     range: "min",
                                     step: timeStepInSecs,
                                     slide: function(e, ui)
                                        {
                                        timelapseCurrentTimeInSeconds = ui.value;
                                        $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds,true));
                                        timelapse.seek(ui.value);
                                        }
                                  });
   }

function createZoomSlider()
   {
   $("#slider-vertical").slider({
                                   orientation: "vertical",
                                   min: 0,
                                   max: 1,
                                   step: .01,
                                   slide: function(e, ui)
                                      {
                                      timelapse.setScaleFromSlider(ui.value);
                                      }
                                });
   
  }

function createPlaybackSpeedSlider()
   {
   $('#speed').selectToUISlider({
                                   labels: 4
                                }).hide();
   }

function setupTimelineSliderHandlers() {
   $('.ui-slider-handle').bind("mouseover", function() {
      this.style.cursor = 'url("../timelapse/css/cursors/openhand.cur") 10 10, move';
      $('.ui-slider-handle').bind("mouseup", function() {
         this.style.cursor = 'url("../timelapse/css/cursors/openhand.cur") 10 10, move';
      });
   });

   $('#timelineSlider .ui-slider-handle').bind("mouseover", function() {
      $(this).attr("title", "Drag to go to a different point in time");            
   });

   $('.ui-slider').bind("slide", function() {
      this.style.cursor = 'url("../timelapse/css/cursors/closedhand.cur") 10 10, move';
      $('.ui-slider-handle').bind("mousemove", function() {
         this.style.cursor = 'url("../timelapse/css/cursors/closedhand.cur") 10 10, move';
      });
   });

   $('.ui-slider').bind("slidestop", function() {
      $('.ui-slider-handle').bind("mousemove", function() {
         this.style.cursor = 'url("../timelapse/css/cursors/openhand.cur") 10 10, move';
      });
   });

   $('.ui-slider').bind("mouseover", function() {
      this.style.cursor = 'pointer';
   });

   $('#filler .ui-slider').bind("mouseover", function() {
      $(this).attr("title", "Click to go to a different point in time");
   });

}


function setupZoomSliderHandlers() {
   $("#slider-vertical")['slider']("option", "value", timelapse.viewScaleToZoomSlider(timelapse.getDefaultScale()));
   $("#slider-vertical .ui-slider-handle").attr("title", "Drag to zoom");
}

function isCurrentTimeAtOrPastDuration()
   {
   // fix the numbers, but subtract 0 from each to convert back to float since toFixed gives a string
   var num1Fixed = timelapseCurrentTimeInSeconds.toFixed(3) - 0;
   var num2Fixed = timelapseDurationInSeconds.toFixed(3) - 0;
   return num1Fixed >= num2Fixed;
   }

function setupUIHandlers() {
   var intervalId;

   $("li#sizeoptions").hide();
   $("li#layerOptions").hide();
   $("span#indicator").hide();

   $("#subbutton").hide();
   $("#status").hide();

   $("a#size").click(function() {
      $("li#sizeoptions").fadeIn(100);
   });

   $("a#layer").click(function() {
      $("li#layerOptions").fadeIn(100);
   });

   $("li#sizeoptions a").click(function() {
   	 $("li#sizeoptions").hide();
   	 $("li#sizeoptions a").removeClass('current');
   	 $(this).addClass('current');
   });

   $("li#layerOptions a").click(function() {
   	 $("li#layerOptions").hide();
   	 $("li#layerOptions a").removeClass('current');
   	 $(this).addClass('current');
   });
   
   $(document).click(function(event) {
      if ($(event.target).closest('a#size').get(0) == null) {
			   $('li#sizeoptions').hide();
	    }
      if ($(event.target).closest('a#layer').get(0) == null) {
			   $('li#layerOptions').hide();
	    }	    
   });

   $("#help").toggle(function () {
		    if ($("#slider-vertical")['slider']("option", "disabled")) return;
		    $('li#sizeoptions').hide(); //might be already opened
		    $("#instructions").fadeIn(100);
		    $(this).addClass('on');
		    if ($('#mainbutton').attr("class") == "pause") {
				   timelapse.pause();
				   $('#mainbutton').attr("class", "pause_disabled");
		    } else {
				   $('#mainbutton').attr("class", "play_disabled");
		    }
		    $("#timelineSlider")['slider']("option", "disabled", true);
	    },function (){
			   if ($("#slider-vertical")['slider']("option", "disabled")) return;
			   $("#instructions").fadeOut(50);
			   $(this).removeClass('on');
			   if ($('#mainbutton').attr("class") == "pause_disabled") {
				    timelapse.play();
				   $('#mainbutton').attr("class", "pause");
			   } else {
				    $('#mainbutton').attr("class", "play");
			   }
			   $("#timelineSlider")['slider']("option", "disabled", false);
	    }
   );

   $('#mainbutton.play, #mainbutton.pause').bind("click", function() {
      if (!$("#slider-vertical")['slider']("option", "disabled")) {
         if ($(this).attr("class") == "play") {
            $(this).attr("title", "Pause");
            $(this).attr("class", "pause");
            if (isCurrentTimeAtOrPastDuration()) {
               $("#timelineSlider")['slider']("option", "value", 0);
               timelapse.seek(0);
            }
            timelapse.play();
         } else if ($(this).attr("class") == "pause") {
            $(this).attr("class", "play");
            $(this).attr("title", "Play");
            timelapse.pause();
         }
      }
      return false;
   });

   $("#home").mousemove(function() {
      $(this).attr("title", "Home");
      this.style.cursor = 'pointer';
   }).click(function() {
      if ($("#slider-vertical")['slider']("option", "disabled") == true) return;
      timelapse.warpTo(timelapse.homeView());
      $("#slider-vertical")['slider']("option", "value", timelapse.viewScaleToZoomSlider(timelapse.getDefaultScale()));
   });

   $("#left").mousedown(function() {
      intervalId = setInterval(function() { movePos("left"); },500);
   }).click(function() {
      movePos("left");
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);      
   }).mousemove(function() {
      $(this).attr("title", "Move Left");
      this.style.cursor = 'pointer';
   });

   $("#right").mousedown(function() {
      intervalId = setInterval(function() { movePos("right"); },500);
   }).click(function() {
      movePos("right");
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);      
   }).mousemove(function() {
      $(this).attr("title", "Move Right");
      this.style.cursor = 'pointer';
   });

   $("#up").mousedown(function() {
      intervalId = setInterval(function() { movePos("up"); },500);
   }).click(function() {
      movePos("up");
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);      
   }).mousemove(function() {
      $(this).attr("title", "Move Up");
      this.style.cursor = 'pointer';
   });

   $("#down").mousedown(function() {
      intervalId = setInterval(function() { movePos("down"); },500);
   }).click(function() {
      movePos("down");
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);      
   }).mousemove(function() {
      $(this).attr("title", "Move Down");
      this.style.cursor = 'pointer';
   });

   $("#zoom_in").mousedown(function() {
      if ($("#slider-vertical")['slider']("option", "disabled") == true) return;
      intervalId = setInterval(zoomIn, 50);
   }).click(function() {
      if ($("#slider-vertical")['slider']("option", "disabled") == true) return;
      zoomIn();
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);
   }).mousemove(function() {
      //$(this).attr("title", "Zoom In");
      this.style.cursor = 'pointer';
   });

   $("#zoom_out").mousedown(function() {
      if ($("#slider-vertical")['slider']("option", "disabled") == true) return;
      intervalId = setInterval(zoomOut, 50);
   }).click(function() {
      if ($("#slider-vertical")['slider']("option", "disabled") == true) return;
      zoomOut();
   }).mouseup(function() {
      clearInterval(intervalId);
   }).mouseout(function() {
      clearInterval(intervalId);
   }).mousemove(function() {
      this.style.cursor = 'pointer';
   });

	$('#timelapse').bind("mouseover", function() {
      this.style.cursor = 'url("../timelapse/css/cursors/openhand.cur") 10 10, move';
	});

  $('#handle_speed').bind("mouseup", function() {
      $(this).removeClass("ui-state-focus");
      $(this).removeClass("ui-state-hover");
  }).bind("mouseleave", function() {
      $(this).removeClass("ui-state-focus");
      $(this).removeClass("ui-state-hover");
  });

}

function zoomIn() {
   var val = Math.min($("#slider-vertical")['slider']("option", "value") + .01, 1);
   //alert($("#slider-vertical")['slider']("option", "value"));
   $("#slider-vertical")['slider']("option", "value", val);
   //alert($("#slider-vertical")['slider']("option", "value"));
   timelapse.setScaleFromSlider(val);
}

function zoomOut() {
   var val = Math.max($("#slider-vertical")['slider']("option", "value") - .01, 0);
   //alert($("#slider-vertical")['slider']("option", "value"));
   $("#slider-vertical")['slider']("option", "value", val);
   //alert($("#slider-vertical")['slider']("option", "value"));
   timelapse.setScaleFromSlider(val);
}

function movePos(dir) {
   timelapse.movePos(dir);
}

function setupKeyboardHandlers() {
   $(this)['keydown'](timelapse.handleKeydownEvent);
   $(this)['keyup'](timelapse.handleKeyupEvent);
 
   if (!document.activeElement) {
      document.addEventListener("focus",_dom_trackActiveElement,true);
      document.addEventListener("blur",_dom_trackActiveElementLost,true);
   }
}
 
function _dom_trackActiveElement(evt) {
    if (evt && evt.target) {
        document.activeElement = evt.target == document ? null : evt.target;
    }
}
 
function _dom_trackActiveElementLost(evt) {
    document.activeElement = null;
}

function setupMouseHandlers() {
   $("#timelapse").mousewheel(timelapse.handleMousescrollEvent);
}

function handlePluginVideoTagOverride() {
   if (browserSupported && $("#1").is("EMBED")) {
      $("#player").hide();
      $("#time_warp_composer").hide();
      $("#html5_overridden_message").show();
   }
}

function switchSize(index)
   {
   org.gigapan.Util.log("switchSize("+index+")");
   playerSize = index;
   var newIndex = playerLayer * 2 + playerSize;
   validateAndSetDatasetIndex(newIndex);
   loadGigapanJSON();

   if (index == 0) {
      $("#playerSizeText").text('Small');
   } else if (index == 1) {
      $("#playerSizeText").text('Large');     
   }
}

function switchLayer(index)
   {
   org.gigapan.Util.log("switchLayer("+index+")");
   playerLayer = index;
   var newIndex = playerLayer * 2 + playerSize;
   validateAndSetDatasetIndex(newIndex);
   loadGigapanJSON();

   if (index == 0) {
      $("#playerLayerText").text('0304 (C)');
   } else if (index == 1) {
      $("#playerLayerText").text('0304 (G)');     
   } else if (index == 2) {
      $("#playerLayerText").text('0193 (C)');
   } else if (index == 3) {
      $("#playerLayerText").text('0171 (C)');                  
   }
}

function setViewportSize(newWidth, newHeight)
   {
   var bounds = timelapse.getBoundingBoxForCurrentView();
   $("#timelapse_container").width(newWidth);
   $("#timelapse_container").height(newHeight);
   $("#timelapse").width(newWidth);
   $("#timelapse").height(newHeight);
   $("#controls").width(newWidth);
   $("#timelineSlider").width(newWidth-8);
  
   var pos = $("#controls").offset();
   var newPos = pos + 100;
   var width = $("#controls").width();
   $("#controls").css( { "top":newPos + "px" } );
   var extraHeight = 0;
   var extraWidth = 0;
   //large video
   if (newWidth == 816) {
      $("#layerDiv").css( {"top": "620px", "left": "766px"} );
      $("#content").css( {"padding": "0px 0px 0px 305px"} );
      $("#filler").css( {"top": "442px"} ); 
      $("#controls").css( {"top": "450px"} );
      $("#firstHeading").css( {"top": "600px"} );
      $("#snaplapse-annotation-description").css( {"left": "283px"} );
      extraHeight = 18;
      extraWidth = 3;
   } else {
      $("#layerDiv").css( {"top": "460px", "left": "462px"} );
      $("#timelineSlider").css( {"top": "auto"} );
      $("#filler").css( {"top": "auto"} );
      $("#controls").css( {"top": "auto"} );
      $("#content").css( {"padding": "0px 0px 0px 0px"} );
      $("#firstHeading").css( {"top": "450px"} );
      $("#snaplapse-annotation-description").css( {"left": "-22px"} );
      extraHeight = -2;
      extraWidth = 2;
   }

   $("#filler").css( {"width": (newWidth + 4) + "px"} );
   $("#instructions").css( {"width": (newWidth+extraWidth) + "px"} );
   $("#instructions").css( {"height": (newHeight-extraHeight) + "px"} );

   if ($('#spinnerOverlay').length != 0)
      {
      $('#spinnerOverlay').css("top", newHeight / 2 - $("#spinner").height() / 2 + "px");
      $('#spinnerOverlay').css("left", newWidth / 2 - $("#spinner").width() / 2 + "px");
      }
   timelapse.updateDimensions();
   timelapse.warpToBoundingBox(bounds);
   }

function loadTimelapse(gigapanUrl, gigapanJSON)
   {
   $("#timelapse").empty();
      
   // Create the timelapse
   if (timelapse == null)
      {
      timelapse = new org.gigapan.timelapse.Timelapse(gigapanUrl, 'timelapse', gigapanJSON, 'videoset_stats_container');

      timelapse.addTimeChangeListener(function(t)
                                         {
                                         timelapseCurrentTimeInSeconds = t;
                                         if (timelapseCurrentTimeInSeconds.toFixed(3) < 0)
                                            {
                                            timelapseCurrentTimeInSeconds = 0;
                                            $('#mainbutton').attr("class", "play");
                                            $('#mainbutton').attr("title", "Play");
                                            }
                                         if (isCurrentTimeAtOrPastDuration())
                                            {
                                            timelapseCurrentTimeInSeconds = timelapseDurationInSeconds;
                                            $('#mainbutton').attr("class", "play");
                                            $('#mainbutton').attr("title", "Play");
                                            }
                                         $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds,true));
                                         $("#timelineSlider")['slider']("option", "value", timelapseCurrentTimeInSeconds);
                                         });

      timelapse.addTargetViewChangeListener(function(view)
                                               {
                                               $("#slider-vertical")['slider']("option", "value", timelapse.viewScaleToZoomSlider(view.scale));
                                               });

      timelapse.getVideoset().addEventListener('videoset-pause',
                                               function()
                                                  {
                                                  // the videoset might cause playback to pause, such as when it decides
                                                  // it's hit the end (even though the current time might not be >= duration),
                                                  // so we need to make sure the play button is updated
                                                  $('#mainbutton').attr("class", "play");
                                                  $('#mainbutton').attr("title", "Play");
                                                  });
      setupKeyboardHandlers();
      setupMouseHandlers();
      createTimelineSlider();
      createZoomSlider();
      createPlaybackSpeedSlider();
      setupTimelineSliderHandlers();
      setupZoomSliderHandlers();
      setupUIHandlers();
      initializeSnaplapseUI();
      handlePluginVideoTagOverride();
      }
   else
      {
      org.gigapan.Util.log("Timelapse already loaded, so update it with new JSON.  gigapanUrl = ["+gigapanUrl+"] and JSON = ["+JSON.stringify(gigapanJSON)+"]");
      timelapse.changeDataset(gigapanUrl, gigapanJSON);
      }

   setViewportSize(gigapanJSON['video_width'] - gigapanJSON['tile_width'], gigapanJSON['video_height'] - gigapanJSON['tile_height']);
   }

function validateAndSetDatasetIndex(newDatasetIndex)
   {
   // make sure the datasetIndex is a valid number, and within the range of datasets for this gigapan.
   if (!org.gigapan.Util.isNumber(newDatasetIndex))
      {
      datasetIndex = 0;
      }
   else
      {
      datasetIndex = Math.max(0, Math.min(newDatasetIndex, gigapanDatasetsJSON['datasets'].length - 1));
      }
   }

function getTileHostUrlPrefix()
   {
   // get the tile host URL prefixes from the JSON, or use a default if undefined
   var prefixes = ["http://g7.gigapan.org/alpha/timelapses/"];
   if (typeof gigapanDatasetsJSON['tile-host-url-prefixes'] != 'undefined' &&
       $.isArray(gigapanDatasetsJSON['tile-host-url-prefixes']) &&
       gigapanDatasetsJSON['tile-host-url-prefixes'].length > 0)
      {
      prefixes = gigapanDatasetsJSON['tile-host-url-prefixes'];
      }

   // now pick one at random
   return prefixes[Math.floor(Math.random() * prefixes.length)];
   }

function loadGigapanJSON()
   {
   // fetch the datasetId and then construct the URL used to get the JSON for the desired dataset
   var datasetId = gigapanDatasetsJSON['datasets'][datasetIndex]['id'];
   var tileHostUrlPrefix = getTileHostUrlPrefix() + datasetId + '/';
   var gigapanJSONHostUrlPrefix = (typeof gigapanDatasetsJSON['dataset-json-host-url-prefix'] != 'undefined') ? gigapanDatasetsJSON['dataset-json-host-url-prefix'] + datasetId + '/' : tileHostUrlPrefix;
   var jsonUrl = gigapanJSONHostUrlPrefix + 'r.json';

   org.gigapan.Util.log("Attempting to fetch gigapan JSON from URL [" + jsonUrl + "]...");
   $.ajax({
             dataType:'json',
             url: jsonUrl,
             success: function(gigapanJSON)
                {
                if (gigapanJSON && gigapanJSON['tile_height'])
                   {
                   org.gigapan.Util.log("Loaded this JSON: [" + JSON.stringify(gigapanJSON) + "]");
                   loadTimelapse(tileHostUrlPrefix, gigapanJSON);
                   }
                else
                   {
                   org.gigapan.Util.error("Failed to load gigapan json from URL [" + jsonUrl + "]");
                   }
                },
             error: function()
                {
                org.gigapan.Util.error("Error loading gigapan json from URL [" + jsonUrl + "]");
                }
          });
   }

$(document).ready(function()
                     {
                     $("#browser_not_supported").hide();
                     $("#html5_overridden_message").hide();
		     $("#flash_video_player").hide();
                     browserSupported = org.gigapan.Util.browserSupported();

                     if (!browserSupported) {
                        $("#player").hide();
                        $("#time_warp_composer").hide();
                        $("#browser_not_supported").show();
                        $("#firstHeading").css( {"top": "450px"} );
			$("#flash_video_player").show();
                        $("#flash_video_player").css( {"visibility": "hidden"} );
                        setupSnaplapseLinks();
                        initFlashViewer();
                        return;
                     }
                     
                     timelapseMetadata = $("#timelapse_metadata").text();
                     org.gigapan.Util.log("timelapseMetadata=["+timelapseMetadata+"]");
                     timelapseMetadataJSON = JSON.parse($("#timelapse_metadata").text());
                     gigapanId = timelapseMetadataJSON['id'] || "brassica-15m-halfsize-g10-bf0-l15";
                     datasetIndex = timelapseMetadataJSON['dataset'] || "1";
                     hasLayers = timelapseMetadataJSON['has_layers'] || false;
		     if (hasLayers) $("#layerDiv").show();
		     org.gigapan.Util.log("id=["+gigapanId+"]");
                     org.gigapan.Util.log("datasetIndex=["+datasetIndex+"]");
                     gigapanDatasetsJSON = null;

                     var jsonUrl = "../timelapses/" + gigapanId + '.json'; 
                     
                     org.gigapan.Util.log("Attempting to fetch gigapan datasets JSON from URL [" + jsonUrl + "]...");
                     $.ajax({
                               dataType:'json',
                               url: jsonUrl,
                               success: function(json)
                                  {
                                  gigapanDatasetsJSON = json;
                                  if (gigapanDatasetsJSON && gigapanDatasetsJSON['base-id'] == gigapanId && gigapanDatasetsJSON['datasets'] && gigapanDatasetsJSON['datasets'].length > 0)
                                     {
                                     org.gigapan.Util.log("Loaded this JSON: [" + JSON.stringify(gigapanDatasetsJSON) + "]");

                                     // make sure the datasetIndex is a valid number, and within the range of datasets for this gigapan.
                                     validateAndSetDatasetIndex(datasetIndex);

                                     // set document title
                                     document.title = "GigaPan Time Machine: " + gigapanDatasetsJSON['name'];

                                     // now populate the Viewer Size popup menu with the various datasets
                                     for (var i = 0; i < gigapanDatasetsJSON['datasets'].length; i++)
                                        {
                                        var selected = (i == datasetIndex) ? 'selected="selected"' : '';
                                        $("#viewer_size").append('<option value="' + i + '" ' + selected + '>' + gigapanDatasetsJSON['datasets'][i]['name'] + '</option>');
                                        }

                                     // finally, load the gigapan
                                     loadGigapanJSON();
                                     }
                                  else
                                     {
                                     org.gigapan.Util.error("Failed to load gigapan datasets json from URL [" + jsonUrl + "]");
                                     }
                                  },
                               error: function()
                                  {
                                  org.gigapan.Util.error("Error loading gigapan datasets json from URL [" + jsonUrl + "]");
                                  }
                            });
                     });

