var snaplapse = null;
var saveSnaplapseWindow = null;
var loadSnaplapseWindow = null;
var cachedSnaplapses = {};
var currentlyDisplayedVideoId = 1;

function initializeSnaplapseUI()
   {
   // add an event listener to the videoset so we can keep track of which video is currently visible, so that we can
   // create the keyframe thumbnails
   timelapse.getVideoset().addEventListener('video-made-visible',
                                            function(videoId)
                                               {
                                               currentlyDisplayedVideoId = videoId;
                                               });

   // add mouseover actions to all of the buttons
   $('.button').hover(
         function()
            {
            $(this).addClass('ui-state-hover');
            },
         function()
            {
            $(this).removeClass('ui-state-hover');
            }
   );

   // hide the snaplapse Stop button
   $('#mainbutton.stop').hide();

   // configure the keyframe list's selectable handlers
   $("#snaplapse_keyframe_list")['selectable']({
                                                  selected: function()
                                                     {
                                                     handleSnaplapseFrameSelectionChange(false);
                                                     },
                                                  unselected: function()
                                                     {
                                                     handleSnaplapseFrameSelectionChange(false);
                                                     },
                                                  stop: function()
                                                     {
                                                     handleSnaplapseFrameSelectionChange(true);
                                                     },
                                                  cancel: ':input,textarea'
                                               });

   // add mouse event handlers to the New Snaplapse button
   addMouseEventHandlersToButton('#newSnaplapseButton',
                                 function()
                                    {
                                    newSnaplapse(null);
                                    $(".snaplapse_composer_controls").show();
                                    });

   // add mouse event handlers to the Load Snaplapse button
   addMouseEventHandlersToButton('#loadSnaplapseButton',
                                 function()
                                    {
                                    showLoadSnaplapseWindow();
                                    });

   // add mouse event handlers to the Play/Stop Snaplapse button
   addMouseEventHandlersToButton('#playStopSnaplapseButton',
                                 function()
                                    {
                                    playStopSnaplapse();
                                    });

   // add mouse event handlers to the Record Keyframe button
   addMouseEventHandlersToButton('#recordKeyframeButton',
                                 function()
                                    {
                                    recordKeyframe();
                                    });

   // add mouse event handlers to the Record Keyframe button
   addMouseEventHandlersToButton('#deleteKeyframeButton',
                                 function()
                                    {
                                    deleteSelectedKeyframes();
                                    });

   // add mouse event handlers to the Record Keyframe button
   addMouseEventHandlersToButton('#saveSnaplapseButton',
                                 function()
                                    {
                                    saveSnaplapse();
                                    });

   // add mouse event handlers to the Play/Stop button in the viewer
   $('#mainbutton.stop').click(function()
                                  {
                                  playStopSnaplapse();
                                  return false;
                                  });

   // finally, set up the snaplapse links
   setupSnaplapseLinks();
   }

function addMouseEventHandlersToButton(buttonId, actionFunction)
   {
   $(buttonId).mousecapture({
                               "down": function()
                                  {
                                  if (isButtonEnabled(buttonId))
                                     {
                                     jQuery(this).addClass('ui-state-active');
                                     }
                                  },
                               "up": function()
                                  {
                                  if (isButtonEnabled(buttonId))
                                     {
                                     jQuery(this).removeClass('ui-state-active');
                                     }
                                  }
                            }).click(
         function()
            {
            if (isButtonEnabled(buttonId))
               {
               if ($.isFunction(actionFunction))
                  {
                  actionFunction();
                  }
               }
            }
   ).disableSelection();
   }

function handleSnaplapseFrameSelectionChange(willWarp)
   {
   if (snaplapse.isPlaying())
      {
      setButtonEnabled("#deleteKeyframeButton", false);
      return;
      }

   var selectedItems = $("#snaplapse_keyframe_list > .ui-selected");
   var numSelected = selectedItems.size();

   setButtonEnabled("#deleteKeyframeButton", true);

   if (numSelected == 1)
      {
      var id = selectedItems.get(0).id;
      var keyframeId = id.substring("snaplapse_keyframe_".length);
      var frame = snaplapse.getKeyframeById(keyframeId);

      displaySnaplapseFrameAnnotation(frame);

      if (typeof willWarp != 'undefined' && willWarp)
         {
         timelapse.seek(frame['time']);
         timelapse.warpToBoundingBox(frame['bounds']);
         }
      }
   else
      {
      // either 0 or more than 1
      displaySnaplapseFrameAnnotation(null);

      if (numSelected == 0)
         {
         setButtonEnabled("#deleteKeyframeButton", false);
         }
      }
   }

function displaySnaplapseFrameAnnotation(frame)
   {
   $("#snaplapse-annotation-description").hide();

   if (frame)
      {
      if (isTextNonEmpty(frame['description']))
         {
         $("#snaplapse-annotation-description").html(frame['description']).show();
         }
      }
   }

function isButtonEnabled(idOrClass)
   {
   return $(idOrClass).hasClass("ui-state-default");
   }

function setButtonEnabled(idOrClass, isEnabled)
   {
   if (isEnabled)
      {
      jQuery(idOrClass).addClass("ui-state-default");
      jQuery(idOrClass).removeClass("ui-state-active");
      jQuery(idOrClass).removeClass("ui-state-disabled");
      }
   else
      {
      jQuery(idOrClass).removeClass("ui-state-default");
      jQuery(idOrClass).addClass("ui-state-active");
      jQuery(idOrClass).addClass("ui-state-disabled");
      }
   }

function newSnaplapse(json)
   {
   snaplapse = new org.gigapan.timelapse.Snaplapse(timelapse);

   snaplapse.addEventListener('play',
                              function()
                                 {
                                 setButtonEnabled("#newSnaplapseButton", false);
                                 setButtonEnabled("#recordKeyframeButton", false);
                                 setButtonEnabled("#loadSnaplapseButton", false);
                                 setButtonEnabled("#saveSnaplapseButton", false);
                                 $("#playStopSnaplapseButton > span").removeClass("ui-icon-play");
                                 $("#playStopSnaplapseButton > span").addClass("ui-icon-stop");
                                 $("#playStopSnaplapseButton").attr("title", "Stop time warp");

                                 setButtonEnabled("#deleteKeyframeButton", false);

                                 $("#timelineSlider")['slider']("option", "disabled", true);
                                 $("#slider-vertical")['slider']("option", "disabled", true);
                                 $('#playBackSpeedSlider').hide();
                                 $('#mainbutton.play').hide();
                                 $('#mainbutton.pause').hide();
                                 $('#mainbutton.stop').show();

                                 $("#zoom_in").css("opacity", ".35");
                                 $("#zoom_out").css("opacity", ".35");
                                 $("#home").css("opacity", ".35");

                                 $("#snaplapse_keyframe_list")['selectable']("option", "disabled", true);
                                 var keyframes = $("#snaplapse_keyframe_list > div");
                                 for (var i = 0; i < keyframes.size(); i++)
                                    {
                                    var frame = keyframes[i];
                                    $(frame).removeClass().addClass("snaplapse_keyframe_list_item");
                                    }
                                 });

   snaplapse.addEventListener('stop',
                              function()
                                 {
                                 setButtonEnabled("#newSnaplapseButton", true);
                                 setButtonEnabled("#recordKeyframeButton", true);
                                 setButtonEnabled("#loadSnaplapseButton", true);
                                 setButtonEnabled("#saveSnaplapseButton", true);
                                 $("#playStopSnaplapseButton > span").removeClass("ui-icon-stop");
                                 $("#playStopSnaplapseButton > span").addClass("ui-icon-play");
                                 $("#playStopSnaplapseButton").attr("title", "Play time warp");

                                 $("#timelineSlider")['slider']("option", "disabled", false);
                                 $("#slider-vertical")['slider']("option", "disabled", false);
                                 $('#playBackSpeedSlider').show();
                                 $('#mainbutton.stop').hide();
                                 $('#mainbutton.pause').attr("class", "play");
                                 $('#mainbutton.play').attr("title", "Play");
                                 $('#mainbutton.play').show();

                                 $("#zoom_in").css("opacity", "1");
                                 $("#zoom_out").css("opacity", "1");
                                 $("#home").css("opacity", "1");

                                 $("#snaplapse_keyframe_list")['selectable']("option", "disabled", false);
                                 var keyframes = $("#snaplapse_keyframe_list > div");
                                 for (var i = 0; i < keyframes.size(); i++)
                                    {
                                    var frame = keyframes[i];
                                    $(frame).removeClass().addClass("snaplapse_keyframe_list_item");
                                    }
                                 });

   snaplapse.addEventListener('keyframe-added',
                              function(frame, insertionIndex)
                                 {
                                 toggleSnaplapseButtons();
                                 addSnaplapseKeyframeListItem(frame, insertionIndex);
                                 });

   snaplapse.addEventListener('keyframe-interval-change',
                              function(index, frame)
                                 {
                                 org.gigapan.Util.log("snaplapse keyframe-interval-change index=[" + index + "]");

                                 // render the keyframe as selected to show that it's being played
                                 var keyframeElements = $("#snaplapse_keyframe_list > div");
                                 $(keyframeElements[index]).addClass("snaplapse_keyframe_list_item ui-selected");

                                 displaySnaplapseFrameAnnotation(frame);
                                 });

   setButtonEnabled("#recordKeyframeButton", true);
   setButtonEnabled("#playStopSnaplapseButton", false);
   setButtonEnabled("#saveSnaplapseButton", false);
   setButtonEnabled("#deleteKeyframeButton", false);
   $("#snaplapse_keyframe_list").empty();
   if (saveSnaplapseWindow)
      {
      saveSnaplapseWindow.close();
      }

   if (typeof json != 'undefined' && json != null)
      {
      return snaplapse.loadFromJSON(json);
      }

   return true;
   }

function toggleSnaplapseButtons()
   {
   var numKeyframes = snaplapse.getNumKeyframes();
   if (numKeyframes > 1)
      {
      setButtonEnabled("#playStopSnaplapseButton", true);
      setButtonEnabled("#saveSnaplapseButton", true);
      }
   else
      {
      setButtonEnabled("#playStopSnaplapseButton", false);
      setButtonEnabled("#saveSnaplapseButton", false);
      setButtonEnabled("#deleteKeyframeButton", false);
      }
   }

function isTextNonEmpty(text)
   {
   return (typeof text != 'undefined' && text.length > 0);
   }

function addSnaplapseKeyframeListItem(frame, insertionIndex)
   {
   var keyframeId = frame['id'];
   var keyframeListItem = document.createElement("div");
   keyframeListItem.id = "snaplapse_keyframe_" + keyframeId;

   var keyframeListItems = $(".snaplapse_keyframe_list_item").get();
   if (insertionIndex < keyframeListItems.length)
      {
      $("#" + keyframeListItems[insertionIndex - 1]['id']).after(keyframeListItem);
      }
   else
      {
      $("#snaplapse_keyframe_list").append(keyframeListItem);
      }

   var thumbnailId = keyframeListItem.id + "_thumbnail";
   var timestampId = keyframeListItem.id + "_timestamp";
   var descriptionId = keyframeListItem.id + "_description";
   var durationId = keyframeListItem.id + "_duration";
   var duration = typeof frame['duration'] != 'undefined' && frame['duration'] != null ? frame['duration'] : '';
   var content = '<table border="0" cellspacing="0" cellpadding="0" class="snaplapse_keyframe_list_item_table">' +
                 '   <tr valign="top">' +
                 '      <td rowspan="2">' +
                 '         <div id="' + timestampId + '" class="snaplapse_keyframe_list_item_timestamp">' + org.gigapan.Util.formatTime(frame['time'], true) + '</div>' +
                 '         <canvas id="' + thumbnailId + '" width="100" height="56" class="snaplapse_keyframe_list_item_thumbnail"></canvas>' +
                 '      </td>' +
                 '      <td rowspan="2" class="snaplapse_keyframe_list_item_cell_padding">&nbsp;</td>' +
                 '      <td style="text-align:left;">' +
                 '         <div class="snaplapse_keyframe_list_item_description_label" style="text-align:left;">Description:</div>' +
                 '         <div><textarea id="' + descriptionId + '" class="snaplapse_keyframe_list_item_description">' + frame['description'] + '</textarea></div>' +
                 '      </td>' +
                 '      <td rowspan="2" class="snaplapse_keyframe_list_item_cell_padding">&nbsp;</td>' +
                 '   </tr>' +
                 '   <tr valign="top">' +
                 '      <td style="text-align:left;">' +
                 '         <span class="snaplapse_keyframe_list_item_duration_label">Duration:</span>' +
                 '         <input type="text" id="' + durationId + '" class="snaplapse_keyframe_list_item_duration" value="' + duration + '">' +
                 '         <span class="snaplapse_keyframe_list_item_duration_label">seconds</span>' +
                 '      </td>' +
                 '   </tr>' +
                 '</table>';

   $("#" + keyframeListItem.id).html(content).addClass("snaplapse_keyframe_list_item");

   // save the text annotation on keyup, so that we don't need a save button
   $("#" + descriptionId)['keyup'](function()
                                      {
                                      var description = $("#" + descriptionId).val();
                                      snaplapse.setTextAnnotationForKeyframe(keyframeId, description);
                                      displaySnaplapseFrameAnnotation(snaplapse.getKeyframeById(keyframeId));
                                      });

   // validate the duration on keyup, reformat it on change
   $("#" + durationId)['keyup'](function()
                                   {
                                   validateAndSanitizeDuration(durationId);
                                   });
   $("#" + durationId)['change'](function()
                                    {
                                    // validate and sanitize, and get the cleaned duration.
                                    var newDuration = validateAndSanitizeDuration(durationId);

                                    // update both the view and the model with the new duration
                                    var durationField = $("#" + durationId);
                                    durationField.val(newDuration);
                                    durationField.removeClass('validation-fault');

                                    snaplapse.setDurationForKeyframe(keyframeId, newDuration);
                                    });

   // remove selection from all other items, then select this item
   $(".ui-selected").removeClass("ui-selected");
   $("#" + keyframeListItem.id).addClass("ui-selected");
   handleSnaplapseFrameSelectionChange(false);

   // TODO: grab the current video frame and store it as the thumbnail in the canvas
   }

function validateAndSanitizeDuration(durationId)
   {
   var durationField = $("#" + durationId);
   var durationStr = durationField.val().trim();

   durationField.removeClass('validation-fault');
   if (durationStr.length > 0)
      {
      var num = parseFloat(durationStr);

      if (!isNaN(num) && (num >= 0))
         {
         durationField.removeClass('validation-fault');
         return num.toFixed(3);
         }
      else
         {
         durationField.addClass('validation-fault');
         }
      }

   return '';
   }

function recordKeyframe()
   {
   if (snaplapse)
      {
      // If there's a keyframe already selected, then we'll append after that one.  Otherwise, just append to the end.
      var selectedItems = $("#snaplapse_keyframe_list > .ui-selected");
      var numSelected = selectedItems.size();

      var success = false;
      if (numSelected == 1)
         {
         var id = selectedItems.get(0).id;
         var keyframeId = id.substring("snaplapse_keyframe_".length);
         success = snaplapse.recordKeyframe(keyframeId);
         }
      else
         {
         success = snaplapse.recordKeyframe();
         }

      if (!success)
         {
         alert("ERROR: Invalid time position\n\n" +
               "The time position of a keyframe cannot\n" +
               "be the same as the previous keyframe.");
         }
      }
   }

function playCachedSnaplapse(snaplapseId)
   {
   org.gigapan.Util.log("playCachedSnaplapse(" + snaplapseId + ")");
   var s = cachedSnaplapses[snaplapseId];
   if (typeof s != 'undefined' && s)
      {
      if (snaplapse && snaplapse.isPlaying())
         {
         snaplapse.stop();
         }

      if (newSnaplapse(JSON.stringify(s)))
         {
         playStopSnaplapse();
         }
      else
         {
         alert("ERROR: Invalid time warp file.");
         }
      }
   }

function cacheSnaplapse(snaplapseJsonUrl, callback)
   {
   $.ajax({
             dataType:'json',
             url: snaplapseJsonUrl,
             success: function(snaplapseJSON)
                {
                if (snaplapseJSON)
                   {
                   //org.gigapan.Util.log("Loaded this snaplapse JSON: [" + JSON.stringify(snaplapseJSON) + "]");
                   cachedSnaplapses[snaplapseJsonUrl] = snaplapseJSON;
                   if (callback && typeof callback == 'function')
                      {
                      callback();
                      }
                   }
                else
                   {
                   org.gigapan.Util.error("Failed to load snaplapse json from URL [" + snaplapseJsonUrl + "]");
                   }
                },
             error: function()
                {
                org.gigapan.Util.error("Error loading snaplapse json from URL [" + snaplapseJsonUrl + "]");
                }
          });
   return false;
   }

// This function finds all the links to snaplapses generated by the Template:SnaplapseLinkAJAX wiki template, fetches
// the referenced snaplapse JSON via AJAX (and caches it), and creates a link to play the snaplapse.  This code assumes
// that the wiki template Template:SnaplapseLinkAJAX converts this wiki code...
//
//    {{SnaplapseLinkAJAX|filename=Brassica_1.warp|label=cotyledon development}}
//
// ...to this HTML...
//
//    <span class="snaplapse_link">
//       <span class="snaplapse_label">cotyledon development</span>
//       <span class="snaplapse_filename" style="display:none"><a href="/images/8/8d/Brassica_1.warp" class="internal" title="Brassica 1.warp">Media:Brassica_1.warp</a></span>
//    </span>
//
// This code will take the above HTML and modify it to be simply:
//
//    <a href="#timelapse_viewer_anchor" onclick="playCachedSnaplapse('http://lauwers.ece.cmu.edu/images/8/8d/Brassica_1.warp');">cotyledon development</a>
//
function setupSnaplapseLinks()
   {
   $(".snaplapse_link").each(function(index, elmt)
                                {
                                var linkSpan = $(elmt);
                                var labelSpan = linkSpan.children().first();
                                var filenameSpan = labelSpan.next();
                                var snaplapseJsonUrl = filenameSpan.children('a').first().get(0).href;
                                filenameSpan.detach();
                                var originalContent = labelSpan.html();

                                org.gigapan.Util.log("setupSnaplapseLinks(): [" + index + "]" + labelSpan.text() + "|" + snaplapseJsonUrl + "|" + originalContent);
                                cacheSnaplapse(snaplapseJsonUrl, function()
                                   {
                                   linkSpan.replaceWith('<a class="time_warp_link" href="#" onclick="playCachedSnaplapse(\'' + snaplapseJsonUrl + '\');return false;">' + originalContent + '</a>');
                                   });

                                });
   }

function playStopSnaplapse()
   {
   if (snaplapse.isPlaying())
      {
      snaplapse.stop();
      }
   else
      {
      snaplapse.play();
      }
   }

function saveSnaplapse()
   {
   if (snaplapse && (snaplapse.getNumKeyframes() > 1))
      {
      // prompt the user for a filename for their snaplapse
      var filename = prompt("Filename for your time warp:", "untitled.warp");

      // filename is null if the user hit Cancel
      if (filename != null)
         {
         // trim it
         filename = $.trim(filename);

         // if it's empty, give it a default name
         if (filename.length == 0)
            {
            filename = "untitled";
            }

         // add a .warp extension if necessary
         var lowerCaseFilename = filename.toLowerCase();
         if (!/.warp$/.test(lowerCaseFilename))
            {
            filename += ".warp";
            }

         // submit the hidden form so that we can bounce it back to the user with an attachment content-disposition
         $("#save_snaplapse_form_json").val(snaplapse.getAsJSON());
         $("#save_snaplapse_form_filename").val(filename);
         $("#save_snaplapse_form").get(0).submit();
         }
      }
   else
      {
      alert("ERROR: No time warp to save--please create a time warp and add at least two keyframes to it.")
      }
   }

function getSnaplapseJSON()
   {
   return snaplapse.getAsJSON();
   }

function showLoadSnaplapseWindow()
   {
   loadSnaplapseWindow = popup('../timelapse/load_snaplapse.html', 'loadSnaplapseWindow');
   }

function loadSnaplapse(json)
   {
   if (loadSnaplapseWindow)
      {
      if (newSnaplapse(json))
         {
         $(".snaplapse_composer_controls").show();
         loadSnaplapseWindow.close();
         }
      else
         {
         alert("ERROR: Invalid time warp file.");
         }
      }
   }

function deleteSelectedKeyframes()
   {
   var selectedItems = $("#snaplapse_keyframe_list > .ui-selected");
   var numSelected = selectedItems.size();

   if (numSelected > 0)
      {
      var selectedKeyframeElements = selectedItems.get();
      for (var i = 0; i < numSelected; i++)
         {
         var keyframeElement = selectedKeyframeElements[i];
         var id = keyframeElement['id'];
         var keyframeId = id.substring("snaplapse_keyframe_".length);

         snaplapse.deleteKeyframeById(keyframeId);
         $("#" + id).detach();
         }

      toggleSnaplapseButtons();
      handleSnaplapseFrameSelectionChange(false);
      }

   $("#deleteKeyframeButton").attr("disabled", "disabled");
   }

// Code from:
//    http://javascript-array.com/scripts/window_open/
//    http://www.webdeveloper.com/forum/showthread.php?t=15735
function popup(url, windowName)
   {
   // get dimensions of parent window so we can center the new window within the parent
   var parentWidth = $(window).width();
   var parentHeight = $(window).height();
   var parentX = (document.all) ? window.screenLeft : window['screenX'];
   var parentY = (document.all) ? window.screenTop : window['screenY'];

   var width = 500;
   var height = 545;
   var left = parentX + (parentWidth - width) / 2;
   var top = parentY + (parentHeight - height) / 2;
   var params = 'width=' + width + ', height=' + height;
   params += ', top=' + top + ', left=' + left;
   params += ', directories=no';
   params += ', location=no';
   params += ', menubar=no';
   params += ', resizable=yes';
   params += ', scrollbars=auto';
   params += ', status=no';
   params += ', toolbar=no';
   var newWindow = window.open(url, windowName, params);
   if (window.focus)
      {
      newWindow.focus()
      }
   return newWindow;
   }
