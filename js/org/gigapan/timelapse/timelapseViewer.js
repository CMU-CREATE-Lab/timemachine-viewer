var timelapseMetadata = $("#timelapse_metadata").text();
org.gigapan.Util.log("timelapseMetadata=["+timelapseMetadata+"]");
var timelapseMetadataJSON = JSON.parse($("#timelapse_metadata").text());
var gigapanId = timelapseMetadataJSON['id'] || "brassica-15m-halfsize-g10-bf0-l15";
var datasetIndex = timelapseMetadataJSON['dataset'] || "0";
org.gigapan.Util.log("id=["+gigapanId+"]");
org.gigapan.Util.log("datasetIndex=["+datasetIndex+"]");
var gigapanDatasetsJSON = null;

// Test whether this is being served from timelapse.gigapan.org.  If so, then fetch the JSON from there too.
// If not, then assume it's being served from localhost and fetch the JSON from the local machine (since we're
// not using JSONP on timelapse.gigapan.org (but we probably should!)).
var urlMatchPattern = /^http:\/\/timelapse.gigapan.org\//;
var isRemoteUrl = window.location.href.match(urlMatchPattern) != null;

var timelapseDurationInSeconds = 0.0;
var timeStepInSecs = 0.0;
var timelapseCurrentTimeInSeconds = 0.0;
var timelapse = null;

function createTimelineSlider()
   {
   timelapseDurationInSeconds = timelapse.getNumFrames() / timelapse.getFps();
   timeStepInSecs = 1 / timelapse.getFps();
   $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds));
   $("#totalTime").text(org.gigapan.Util.formatTime(timelapseDurationInSeconds));

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
                                        $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds));
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
      this.style.cursor = 'url("../timelapse/css/cursors/openhand.png"),move';
      $('.ui-slider-handle').bind("mouseup", function() {
         this.style.cursor = 'url("../timelapse/css/cursors/openhand.png"),move';
      });
   });

   $('#timelineSlider .ui-slider-handle').bind("mouseover", function() {
      $(this).attr("title", "Drag to go to a different point in time");            
   });

   $('.ui-slider').bind("slide", function() {
      $('.ui-slider-handle').bind("mousemove", function() {
         this.style.cursor = 'url("../timelapse/css/cursors/closedhand.png"),move';
      });
   });

   $('.ui-slider').bind("slidestop", function() {
      $('.ui-slider-handle').bind("mousemove", function() {
         this.style.cursor = 'url("../timelapse/css/cursors/openhand.png"),move';
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

function setupUIHandlers() {
   var intervalId;

$('#mainbutton.play, #mainbutton.pause').bind("click", function()
   {
   if (!$("#slider-vertical")['slider']("option", "disabled"))
      {
      if ($(this).attr("class") == "play")
         {
         $(this).attr("title", "Pause");
         $(this).attr("class", "pause");
         if (timelapseCurrentTimeInSeconds.toFixed(3) >= timelapseDurationInSeconds.toFixed(3))
            {
            $("#timelineSlider")['slider']("option", "value", 0);
            timelapse.seek(0);
            }
         timelapse.play();
         }
      else if ($(this).attr("class") == "pause")
         {
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
      this.style.cursor = 'url("../timelapse/css/cursors/openhand.png"),move';
   }).bind("click", function() {     
      $('#handle_speed').removeClass("ui-state-focus");
      $('#handle_speed').removeClass("ui-state-hover");
   }).bind("mousedown", function() {   
      $('#handle_speed').removeClass("ui-state-focus");  
      $('#handle_speed').removeClass("ui-state-hover");
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
}

function setupMouseHandlers() {
   $("#timelapse").mousewheel(timelapse.handleMousescrollEvent);
}

function switchDataset(index)
   {
   org.gigapan.Util.log("switchDataset("+index+")");
   validateAndSetDatasetIndex(index);
   loadGigapanJSON();

   if (index == 0) {
      $("#playerSizeText").text('Small');
   } else if (index == 1) {
      $("#playerSizeText").text('Large');     
   }
}

function setViewportSize(newWidth, newHeight)
   {
   //var newHeight = newWidth * 0.5625;  // 0.5625 is the aspect ratio of the default 800x450 viewer
   var bounds = timelapse.getBoundingBoxForCurrentView();
   $("#timelapse_container").width(newWidth);
   $("#timelapse_container").height(newHeight);
   $("#timelapse").width(newWidth);
   $("#timelapse").height(newHeight);
   //$("#time_slider_container").width(newWidth);
   //$("#misc_controls_container").width(newWidth);
   $("#controls").width(newWidth);
   $("#timelineSlider").width(newWidth-8);
  
   var pos = $("#controls").offset();
   var newPos = pos + 100;
   var width = $("#controls").width();
   $("#controls").css( { "top":newPos + "px" } );
   var extraHeight = 0;
   var extraWidth = 0;
   if (newWidth == 816) {
      $("#content").css( {"padding": "0px 0px 0px 305px"} );
      //$("#timelineSlider").css( {"top": "441px"} );
      $("#filler").css( {"top": "442px"} ); 
      $("#controls").css( {"top": "450px"} );
      extraHeight = 18;
      extraWidth = 3;
   } else {
      $("#timelineSlider").css( {"top": "auto"} );
      $("#filler").css( {"top": "auto"} );
      $("#controls").css( {"top": "auto"} );
      $("#content").css( {"padding": "0px 0px 0px 0px"} );
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
                                         else if (timelapseCurrentTimeInSeconds.toFixed(3) >= timelapseDurationInSeconds.toFixed(3))
                                            {
                                            timelapseCurrentTimeInSeconds = timelapseDurationInSeconds;
                                            $('#mainbutton').attr("class", "play");
                                            $('#mainbutton').attr("title", "Play");
                                            }
                                         $("#currentTime").text(org.gigapan.Util.formatTime(timelapseCurrentTimeInSeconds));
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

function loadGigapanJSON()
   {
   // fetch the datasetId and then construct the URL used to get the JSON for the desired dataset
   var datasetId = gigapanDatasetsJSON['datasets'][datasetIndex]['id'];
   var jsonUrl = (isRemoteUrl ? "../alpha/timelapses/" : "../timelapses/") + datasetId + '/r.json';

   org.gigapan.Util.log("Attempting to fetch gigapan JSON from URL [" + jsonUrl + "]...");
   $.ajax({
             dataType:'json',
             url: jsonUrl,
             success: function(gigapanJSON)
                {
                if (gigapanJSON && gigapanJSON['tile_height'])
                   {
                   org.gigapan.Util.log("Loaded this JSON: [" + JSON.stringify(gigapanJSON) + "]");
                   var gigapanUrl = "http://timelapse.gigapan.org/alpha/timelapses/" + datasetId + "/";
                   loadTimelapse(gigapanUrl, gigapanJSON);
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
                     var browserSupported = org.gigapan.Util.browserSupported();
                     
                     if (!browserSupported)
                        {
                        $("#timelapse_viewer").hide();
                        $("#time_warp_composer").hide();
                        $("#browser_not_supported").show();
                        //window.location = "../timelapse/browsernotsupported.html";
                        }

                     var jsonUrl = (isRemoteUrl ? "../alpha/timelapses/" : "../timelapses/") + gigapanId + '.json';

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
                                     document.title = "GigaPan Timelapse Explorer: " + gigapanDatasetsJSON['name'];

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

