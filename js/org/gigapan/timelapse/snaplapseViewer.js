var snaplapse = null;
var saveSnaplapseWindow = null;
var loadSnaplapseWindow = null;
var cachedSnaplapses = {};

function handleSnaplapseFrameSelectionChange()
   {
   if (snaplapse.isPlaying())
      {
      $("#deleteKeyframeButton").attr("disabled", "disabled");
      return;
      }

   var selectedItems = $("#snaplapse_keyframe_list > .ui-selected");
   var numSelected = selectedItems.size();

   $("#deleteKeyframeButton").removeAttr("disabled");

   if (numSelected == 1)
      {
      var id = selectedItems.get(0).id;
      var index = id.substring("snaplapse_keyframe_".length);
      var frame = snaplapse.getKeyframe(index);

      displaySnaplapseFrameAnnotation(frame);
      }
   else
      {
      // either 0 or more than 1
      displaySnaplapseFrameAnnotation(null);

      if (numSelected == 0)
         {
         $("#deleteKeyframeButton").attr("disabled", "disabled");
         }
      }
   }

function displaySnaplapseFrameAnnotation(frame)
   {
   $("#snaplapse-annotation-title").hide();
   $("#snaplapse-annotation-description").hide();

   if (frame)
      {
      if (isTextNonEmpty(frame['title']))
         {
         $("#snaplapse-annotation-title").html(frame['title']).show();
         }
      if (isTextNonEmpty(frame['description']))
         {
         $("#snaplapse-annotation-description").html(frame['description']).show();
         }
      }
   }

function newSnaplapse(json)
   {
   snaplapse = new org.gigapan.timelapse.Snaplapse(timelapse);
   snaplapse.addEventListener('play', function()
      {
      $("#newSnaplapseButton").attr("disabled", "disabled");
      $("#recordKeyframeButton").attr("disabled", "disabled");
      $("#loadSnaplapseButton").attr("disabled", "disabled");
      $("#saveSnaplapseButton").attr("disabled", "disabled");
      $("#playStopSnaplapseButton").text("Stop Time Warp");
      $("#deleteKeyframeButton").attr("disabled", "disabled");

      $("#timelineSlider")['slider']("option", "disabled", true);
      $("#slider-vertical")['slider']("option", "disabled", true);
      $('#playBackSpeedSlider').hide();
      $('#mainbutton.play').hide();
      $('#mainbutton.pause').hide();
      $('#mainbutton.stop').show();

      $("#zoom_in").css("opacity",".35");
      $("#zoom_out").css("opacity",".35");
      $("#home").css("opacity",".35");

      $("#snaplapse_keyframe_list")['selectable']("option", "disabled", true);

      var keyframes = $("#snaplapse_keyframe_list > div");
      for (var i = 0; i < keyframes.size(); i++)
         {
         var frame = keyframes[i];
         $(frame).removeClass().addClass("snaplapse_keyframe_list_item");
         }
      });

   snaplapse.addEventListener('stop', function()
      {
      $("#newSnaplapseButton").removeAttr("disabled");
      $("#recordKeyframeButton").removeAttr("disabled");
      $("#loadSnaplapseButton").removeAttr("disabled");
      $("#saveSnaplapseButton").removeAttr("disabled");
      $("#playStopSnaplapseButton").text("Play Time Warp");

      $("#timelineSlider")['slider']("option", "disabled", false);
      $("#slider-vertical")['slider']("option", "disabled", false);
      $('#playBackSpeedSlider').show();
      $('#mainbutton.stop').hide();
      $('#mainbutton.pause').attr("class", "play");
      $('#mainbutton.play').attr("title", "Play");
      $('#mainbutton.play').show();

      $("#zoom_in").css("opacity","1");
      $("#zoom_out").css("opacity","1");
      $("#home").css("opacity","1");

      $("#snaplapse_keyframe_list")['selectable']("option", "disabled", false);
      timelapse.seek(0);
      timelapse.warpTo(timelapse.homeView());
      var keyframes = $("#snaplapse_keyframe_list > div");
      for (var i = 0; i < keyframes.size(); i++)
         {
         var frame = keyframes[i];
         $(frame).removeClass().addClass("snaplapse_keyframe_list_item");
         }
      });

   snaplapse.addEventListener('keyframe-added', function(frame, insertionIndex)
      {
      toggleSnaplapseButtons();
      addSnaplapseKeyframeListItem(frame, insertionIndex);
      });

   snaplapse.addEventListener('keyframe-interval-change', function(index, frame)
      {
      org.gigapan.Util.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ keyframe-interval-change: [" + index + "|" + frame['title'] + "|" + frame['description'] + "]");

      // render the keyframe as selected to show that it's being played
      var keyframeElements = $("#snaplapse_keyframe_list > div");
      $(keyframeElements[index]).addClass("snaplapse_keyframe_list_item ui-selected");

      displaySnaplapseFrameAnnotation(frame);
      });

   $("#recordKeyframeButton").removeAttr("disabled");
   $("#playStopSnaplapseButton").attr("disabled", "disabled");
   $("#saveSnaplapseButton").attr("disabled", "disabled");
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
      $("#playStopSnaplapseButton").removeAttr("disabled");
      $("#saveSnaplapseButton").removeAttr("disabled");
      }
   else
      {
      $("#playStopSnaplapseButton").attr("disabled", "disabled");
      $("#saveSnaplapseButton").attr("disabled", "disabled");
      $("#deleteKeyframeButton").attr("disabled", "disabled");
      }
   }

function isTextNonEmpty(text)
   {
   return (typeof text != 'undefined' && text.length > 0);
   }

function addSnaplapseKeyframeListItem(frame, insertionIndex)
   {
   var keyframeListItem = document.createElement("div");
   keyframeListItem.id = "snaplapse_keyframe_" + insertionIndex;
   $("#snaplapse_keyframe_list").append(keyframeListItem);

   var togglableClass = keyframeListItem.id + "_togglable";
   var titleId = keyframeListItem.id + "_title";
   var descriptionId = keyframeListItem.id + "_description";
   var saveButtonId = keyframeListItem.id + "_save_button";
   var showTextAnnotationAreaButtonId = keyframeListItem.id + "_show_text_annotation_area_button";
   var hasTextAnnotationIndicatorId = keyframeListItem.id + "_has_text_annotation";

   var hasTextAnnotation = function(title, description)
      {
      return isTextNonEmpty(title) || isTextNonEmpty(description);
      };

   var content = '<table border="0" cellpadding="1" cellspacing="0">' +
                 '   <tr>' +
                 '      <td style="width:10px;"><span id="' + showTextAnnotationAreaButtonId + '" class="ui-icon ui-icon-triangle-1-e"></span></td>' +
                 '      <td style="width:90px;">Keyframe ' + (insertionIndex + 1) + ': </td>' +
                 '      <td style="width:5px;"></td>' +
                 '      <td style="width:305px;">' + frame['time'] + '</td>' +
                 '      <td style="width:90px;" align="right"><div ' + (!hasTextAnnotation(frame['title'], frame['description']) ? 'style="display:none"' : '') + ' id="' + hasTextAnnotationIndicatorId + '" class="ui-icon ui-icon-comment"></div></td>' +
                 '   </tr>' +
                 '   <tr class="' + togglableClass + '" style="display:none">' +
                 '      <td style="width:10px;"></td>' +
                 '      <td style="width:90px;" align="right"><label for="' + titleId + '">Title:</label></td>' +
                 '      <td style="width:5px;"></td>' +
                 '      <td style="width:305px;"><input type="text" id="' + titleId + '" value="' + frame['title'] + '" style="width:290px;"></td>' +
                 '      <td style="width:90px;">&nbsp;</td>' +
                 '   </tr>' +
                 '   <tr class="' + togglableClass + '" style="display:none" valign="top">' +
                 '      <td style="width:10px;"></td>' +
                 '      <td style="width:90px;" align="right"><label for="' + descriptionId + '">Description:</label></td>' +
                 '      <td style="width:5px;"></td>' +
                 '      <td style="width:305px;"><textarea id="' + descriptionId + '" rows="5" style="width:290px;">' + frame['description'] + '</textarea></td>' +
                 '      <td style="width:90px;" valign="bottom"><button type="button" id="' + saveButtonId + '">Save</button></td>' +
                 '   </tr>' +
                 '</table>';

   $("#" + keyframeListItem.id).html(content).addClass("snaplapse_keyframe_list_item");
   $("#" + keyframeListItem.id)['dblclick'](function()
                                               {
                                               timelapse.seek(frame['time']);
                                               timelapse.warpToBoundingBox(frame['bounds']);
                                               });

   var saveTextAnnotion = function()
      {
      var title = $("#" + titleId).val();
      var description = $("#" + descriptionId).val();
      snaplapse.setTextAnnotationForKeyframe(insertionIndex, title, description);
      if (hasTextAnnotation(title, description))
         {
         $("#" + hasTextAnnotationIndicatorId).show();
         }
      else
         {
         $("#" + hasTextAnnotationIndicatorId).hide();
         }
      displaySnaplapseFrameAnnotation(snaplapse.getKeyframe(insertionIndex));
      };

   $("#" + showTextAnnotationAreaButtonId).click(saveTextAnnotion).click(function()
                                                                            {
                                                                            if ($("." + togglableClass).is(':visible'))
                                                                               {
                                                                               $("." + togglableClass).hide();
                                                                               $("#" + showTextAnnotationAreaButtonId).removeClass("ui-icon-triangle-1-s");
                                                                               $("#" + showTextAnnotationAreaButtonId).addClass("ui-icon-triangle-1-e");
                                                                               }
                                                                            else
                                                                               {
                                                                               $("." + togglableClass).show();
                                                                               $("#" + showTextAnnotationAreaButtonId).removeClass("ui-icon-triangle-1-e");
                                                                               $("#" + showTextAnnotationAreaButtonId).addClass("ui-icon-triangle-1-s");
                                                                               }
                                                                            });
   $("#" + saveButtonId).click(saveTextAnnotion);
   }

function refreshKeyframesUI()
   {
   toggleSnaplapseButtons();

   var keyframes = snaplapse.getKeyframes();

   $("#snaplapse_keyframe_list").empty();
   for (var i = 0; i < keyframes.length; i++)
      {
      addSnaplapseKeyframeListItem(keyframes[i], i);
      }
   }

function recordKeyframe()
   {
   if (snaplapse)
      {
      var success = snaplapse.recordKeyframe();
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
                                   linkSpan.replaceWith('<a class="time_warp_link" href="#timelapse_viewer_anchor" onclick="playCachedSnaplapse(\'' + snaplapseJsonUrl + '\');">' + originalContent + '</a>');
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
         loadSnaplapseWindow.close();
         }
      else
         {
         alert("ERROR: Invalid time warp file.");
         }
      }
   }

function sortDescendingById(a, b)
   {
   var valOne = parseInt(a.id.substring("snaplapse_keyframe_".length));
   var valTwo = parseInt(b.id.substring("snaplapse_keyframe_".length));
   return ((valOne > valTwo) ? -1 : ((valOne < valTwo) ? 1 : 0));
   }

function deleteSelectedKeyframes()
   {
   var selectedItems = $("#snaplapse_keyframe_list > .ui-selected");
   var numSelected = selectedItems.size();

   var selectedItemsSortedDescending = selectedItems.sort(sortDescendingById);

   for (var i = 0; i < numSelected; i++)
      {
      var id = selectedItemsSortedDescending.get(i).id;
      var index = id.substring("snaplapse_keyframe_".length);

      if (snaplapse.deleteKeyframeAtIndex(index))
         {
         refreshKeyframesUI();
         toggleSnaplapseButtons();
         handleSnaplapseFrameSelectionChange();
         }
      }

   //check if we have any invalid time positions now
   //and delete one of them.
   for (var j = 1; j < snaplapse.getNumKeyframes(); j++)
      {
      if (snaplapse.getKeyframe(j)['time'] == snaplapse.getKeyframe(j - 1)['time'])
         {
         alert("ERROR: Invalid time position detected\n\n" +
               "The time position of a keyframe cannot\n" +
               "be the same as the previous keyframe.\n" +
               "One of these invalid keyframes has been\n" +
               "removed.");
         if (snaplapse.deleteKeyframeAtIndex(j))
            {
            refreshKeyframesUI();
            toggleSnaplapseButtons();
            handleSnaplapseFrameSelectionChange();
            j -= 1; //go back one since we removed an item
            }
         }
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
