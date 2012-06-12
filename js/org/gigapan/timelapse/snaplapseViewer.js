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
// Chris Bartley (bartley@cmu.edu)
// Paul Dille (pdille@andrew.cmu.edu)
// Randy Sargent (randy.sargent@cs.cmu.edu)

var saveSnaplapseWindow = null;
var loadSnaplapseWindow = null;
var cachedSnaplapses = {};
var currentlyDisplayedVideoId = 1;
var KEYFRAME_THUMBNAIL_WIDTH = 100;
var KEYFRAME_THUMBNAIL_HEIGHT = 56; // should really be 56.25


// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
if (!org) {
  org = {};
} else {
  if (typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if (typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse) {
  org.gigapan.timelapse = {};
} else {
  if (typeof org.gigapan.timelapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse.snaplapse) {
  org.gigapan.timelapse.snaplapse = {};
} else {
  if (typeof org.gigapan.timelapse.snaplapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse.snaplapse namespace: org.gigapan.timelapse.snaplapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}


//
// CODE
//

var activeSnaplapse;

//accessed by load_snaplapse popup window
function doLoadSnaplapse(json) {
  activeSnaplapse.loadSnaplapse(json);
}

(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.snaplapse.SnaplapseViewer = function(snaplapse,timelapse) {
		var thisObj = this;
		var composerDivId = snaplapse.getComposerDivId();
		var timelapseViewerDivId = timelapse.getViewerDivId();
		
		var initializeSnaplapseUI = function() {
			// hide the annotation bubble
			hideAnnotationBubble();

			// add an event listener to the videoset so we can keep track of which video is currently visible, so that we can
			// create the keyframe thumbnails
			timelapse.getVideoset().addEventListener('video-made-visible', function(videoId){currentlyDisplayedVideoId = videoId;});

			// add mouseover actions to all of the buttons
			$('.button').hover(
				function() {
					$(this).addClass('ui-state-hover');
				},
				function() {
					$(this).removeClass('ui-state-hover');
				}
			);

			// hide the snaplapse Stop button
			$("#"+timelapseViewerDivId+' .stopTimeWarp').hide();

			// configure the keyframe list's selectable handlers
			$("#"+composerDivId+" .snaplapse_keyframe_list")['selectable']({
				selected: function() {
					handleSnaplapseFrameSelectionChange(false);
				},
				unselected: function() {
					handleSnaplapseFrameSelectionChange(false);
				},
				stop: function() {
					handleSnaplapseFrameSelectionChange(true);
				},
				cancel: ':input,textarea,.button,label'
			});

			// add mouse event handlers to the New Snaplapse button
			addMouseEventHandlersToButton('#'+composerDivId+' #newSnaplapseButton',
				function() {
					newSnaplapse(null);
					$('#'+composerDivId+" .snaplapse_composer_controls").show();
				});

			// add mouse event handlers to the Load Snaplapse button
			addMouseEventHandlersToButton('#'+composerDivId+' #loadSnaplapseButton',
				function() {
					activeSnaplapse = thisObj;
					showLoadSnaplapseWindow();
			});

			// add mouse event handlers to the Play/Stop Snaplapse button
			addMouseEventHandlersToButton('#'+composerDivId+' #playStopSnaplapseButton',
				function() {
					playStopSnaplapse();
				});

			// add mouse event handlers to the Record Keyframe button
			addMouseEventHandlersToButton('#'+composerDivId+' #recordKeyframeButton',
				function() {
					recordKeyframe();
				});

			// add mouse event handlers to the Record Keyframe button
			addMouseEventHandlersToButton('#'+composerDivId+' #deleteKeyframeButton',
				function() {
					deleteSelectedKeyframes();
				});

			// add mouse event handlers to the Record Keyframe button
			addMouseEventHandlersToButton('#'+composerDivId+' #saveSnaplapseButton',
				function() {
					saveSnaplapse();
					//showSaveSnaplapseWindow();
				});

			// add mouse event handlers to the Play/Stop button in the viewer
			$("#"+timelapseViewerDivId+' .stopTimeWarp').click(function() {
				playStopSnaplapse();
				return false;
			});

			// finally, set up the snaplapse links
			setupSnaplapseLinks();
		}

		var addMouseEventHandlersToButton = function(buttonId, actionFunction) {
			$(buttonId).mousecapture({
				"down": function() {
					if (isButtonEnabled(buttonId)) {
						jQuery(this).addClass('ui-state-active');
					}
				},
				"up": function() {
					if (isButtonEnabled(buttonId)) {
						jQuery(this).removeClass('ui-state-active');
					}
				}
			}).click(
				function() {
					if (isButtonEnabled(buttonId)) {
						if ($.isFunction(actionFunction)) {
							actionFunction();
						}
					}
				}
			).disableSelection();
		}

		var handleSnaplapseFrameSelectionChange = function(willWarp) {
			if (snaplapse.isPlaying()) {
				setButtonEnabled("#"+composerDivId+" #deleteKeyframeButton", false);
				return;
			}

			var selectedItems = $("#"+composerDivId+" .snaplapse_keyframe_list > .ui-selected");
			var numSelected = selectedItems.size();

			setButtonEnabled("#"+composerDivId+" #deleteKeyframeButton", true);

			if (numSelected == 1) {
				var id = selectedItems.get(0).id;
				//TODO
				var keyframeId = composerDivId + "_" + id.substring("snaplapse_keyframe_".length);
				var frame = snaplapse.getKeyframeById(keyframeId);

				displaySnaplapseFrameAnnotation(frame);

				if (typeof willWarp != 'undefined' && willWarp) {
					timelapse.seek(frame['time']);
					timelapse.warpToBoundingBox(frame['bounds']);
				}
			} else {
				// either 0 or more than 1
				displaySnaplapseFrameAnnotation(null);

				if (numSelected == 0) {
					setButtonEnabled("#"+composerDivId+" #deleteKeyframeButton", false);
				}
			}
		}

		var displaySnaplapseFrameAnnotation = function(frame) {
			if (frame) {
				if (frame['is-description-visible']) {
					if (isTextNonEmpty(frame['description'])) {
						$("#"+timelapseViewerDivId+" .snaplapse-annotation-description > p").text(frame['description']);  // this must use .text() and not .html() to prevent cross-site scripting
						$("#"+timelapseViewerDivId+" .snaplapse-annotation-description").show();
					} else {
						hideAnnotationBubble();
					}
				}
			} else {
				hideAnnotationBubble();
			}
		}

		var isButtonEnabled = function(idOrClass) {
			return $(idOrClass).hasClass("ui-state-default");
		}

		var setButtonEnabled = function(idOrClass, isEnabled) {
			if (isEnabled) {
				jQuery(idOrClass).addClass("ui-state-default");
				jQuery(idOrClass).removeClass("ui-state-active");
				jQuery(idOrClass).removeClass("ui-state-disabled");
			} else {
				jQuery(idOrClass).removeClass("ui-state-default");
				jQuery(idOrClass).addClass("ui-state-active");
				jQuery(idOrClass).addClass("ui-state-disabled");
			}
		}

		var clearKeyframeSelection = function() {
			var keyframes = $("#"+composerDivId+" .snaplapse_keyframe_list > div");
			for (var i = 0; i < keyframes.size(); i++) {
				$(keyframes[i]).removeClass().addClass("snaplapse_keyframe_list_item");
			}
		}

		var newSnaplapse = function(json) {
			//snaplapse = new org.gigapan.timelapse.Snaplapse(timelapse);

			snaplapse.addEventListener('play',
				function() {
					setButtonEnabled("#"+composerDivId+" #newSnaplapseButton", false);
					setButtonEnabled("#"+composerDivId+" #recordKeyframeButton", false);
					setButtonEnabled("#"+composerDivId+" #loadSnaplapseButton", false);
					setButtonEnabled("#"+composerDivId+" #saveSnaplapseButton", false);
					$("#"+composerDivId+" #playStopSnaplapseButton > span").removeClass("ui-icon-play");
					$("#"+composerDivId+" #playStopSnaplapseButton > span").addClass("ui-icon-stop");
					$("#"+composerDivId+" #playStopSnaplapseButton").attr("title", "Stop time warp");

					setButtonEnabled("#"+composerDivId+" #deleteKeyframeButton", false);

					$("#"+timelapseViewerDivId+" .timelineSlider")['slider']("option", "disabled", true);
					$("#"+timelapseViewerDivId+" .zoomSlider")['slider']("option", "disabled", true);

					$("#"+timelapseViewerDivId+' .help').removeClass("enabled").addClass("disabled");
					$("#"+timelapseViewerDivId+" .instructions").fadeOut(50);
					$("#"+timelapseViewerDivId+" .instructions").removeClass('on');
					if ($("#"+timelapseViewerDivId+' .playbackButton').hasClass("pause_disabled")) {
						$("#"+timelapseViewerDivId+' .playbackButton').removeClass('pause_disabled').addClass("pause");
					} else {
						$("#"+timelapseViewerDivId+' .playbackButton').removeClass('play_disabled').addClass("play");
					}

					$("#"+timelapseViewerDivId+' .playbackButton').hide();
					$("#"+timelapseViewerDivId+' .stopTimeWarp').show();

					$("#"+timelapseViewerDivId+" .zoomin").css("opacity", ".35");
					$("#"+timelapseViewerDivId+" .zoomout").css("opacity", ".35");
					$("#"+timelapseViewerDivId+" .zoomall").css("opacity", ".35");

					$("#"+composerDivId+" .snaplapse_keyframe_list")['selectable']("option", "disabled", true);
					clearKeyframeSelection();
					var keyframes = $("#"+composerDivId+" .snaplapse_keyframe_list > div");
					$(keyframes[0]).addClass("snaplapse_keyframe_list_item ui-selected");
				});

			snaplapse.addEventListener('stop',
				function() {
					setButtonEnabled("#"+composerDivId+" #newSnaplapseButton", true);
					setButtonEnabled("#"+composerDivId+" #recordKeyframeButton", true);
					setButtonEnabled("#"+composerDivId+" #loadSnaplapseButton", true);
					setButtonEnabled("#"+composerDivId+" #saveSnaplapseButton", true);
					$("#"+composerDivId+" #playStopSnaplapseButton > span").removeClass("ui-icon-stop");
					$("#"+composerDivId+" #playStopSnaplapseButton > span").addClass("ui-icon-play");
					$("#"+composerDivId+" #playStopSnaplapseButton").attr("title", "Play time warp");

					$("#"+timelapseViewerDivId+" .timelineSlider")['slider']("option", "disabled", false);
					$("#"+timelapseViewerDivId+" .zoomSlider")['slider']("option", "disabled", false);
					$("#"+timelapseViewerDivId+' .stopTimeWarp').hide();
					$("#"+timelapseViewerDivId+' .playbackButton').removeClass("pause").addClass("play");
					$("#"+timelapseViewerDivId+' .playbackButton').attr("title", "Play");
					$("#"+timelapseViewerDivId+' .playbackButton').show();

					$("#"+timelapseViewerDivId+" .zoomin").css("opacity", "1");
					$("#"+timelapseViewerDivId+" .zoomout").css("opacity", "1");
					$("#"+timelapseViewerDivId+" .zoomall").css("opacity", "1");
					$("#"+timelapseViewerDivId+' .help').removeClass("disabled").addClass("enabled");

					hideAnnotationBubble();

					$("#"+composerDivId+" .snaplapse_keyframe_list")['selectable']("option", "disabled", false);
					var keyframes = $("#"+composerDivId+" .snaplapse_keyframe_list > div");
					for (var i = 0; i < keyframes.size(); i++) {
						var frame = keyframes[i];
						$(frame).removeClass().addClass("snaplapse_keyframe_list_item");
					}
				});

			snaplapse.addEventListener('keyframe-added',
				function(keyframe, insertionIndex) {
					addSnaplapseKeyframeListItem(keyframe, insertionIndex, true);
					toggleSnaplapseButtons();
				});

			snaplapse.addEventListener('keyframe-loaded',
				function(keyframe, insertionIndex) {
					addSnaplapseKeyframeListItem(keyframe, insertionIndex, false);
					toggleSnaplapseButtons();
				});
			snaplapse.addEventListener('keyframe-modified',
				function(keyframe) {
					$("#"+composerDivId + "_snaplapse_keyframe_" + keyframe['id'] + "_timestamp").text(org.gigapan.Util.formatTime(keyframe['time'], true));
					setKeyframeThumbail(keyframe);
				});

			snaplapse.addEventListener('keyframe-interval-change',
				function(keyframe) {
					org.gigapan.Util.log("##################### snaplapse keyframe-interval-change: " + JSON.stringify(keyframe));

					// render the keyframe as selected to show that it's being played
					$("#"+composerDivId + "_snaplapse_keyframe_" + keyframe['id']).addClass("snaplapse_keyframe_list_item ui-selected");
					displaySnaplapseFrameAnnotation(keyframe);
				});

			// TODO: add videoset listener which listens for the stall event so we can disable the recordKeyframeButton (if not already disabled due to playback)

			setButtonEnabled("#"+composerDivId+" #recordKeyframeButton", true);
			setButtonEnabled("#"+composerDivId+" #playStopSnaplapseButton", false);
			setButtonEnabled("#"+composerDivId+" #saveSnaplapseButton", false);
			setButtonEnabled("#"+composerDivId+" #deleteKeyframeButton", false);
			$("#"+composerDivId+" .snaplapse_keyframe_list").empty();
			if (saveSnaplapseWindow) {
				saveSnaplapseWindow.close();
			}

			if (typeof json != 'undefined' && json != null) {
				return snaplapse.loadFromJSON(json);
			}

			return true;
		}
		this.loadNewSnaplapse = newSnaplapse;

		var setKeyframeThumbail = function(keyframe) {
			try {
				// find max video id
				var activeVideosMap = timelapse.getVideoset().getActiveVideos();
				var videoIdPrefix = null;
				var maxVideoId = -1;
				for (var id in activeVideosMap) {
					videoIdPrefix = id.substring(0,id.lastIndexOf('_')+1);
					maxVideoId = Math.max(maxVideoId, id.substring(id.lastIndexOf('_')+1));
				}
				// now that we know the max video id, count backwards until we find a ready video, or we run out of videos to check
				var videoElement = null;
				var videoId = videoIdPrefix+maxVideoId;
				do {
					videoElement = activeVideosMap[videoId];
					videoId = videoId - 1;
				} while (videoElement != null && (typeof videoElement.ready == 'undefined' || !videoElement.ready));

				if (videoElement != null) {
					var vid = $(videoElement);
					var scale = KEYFRAME_THUMBNAIL_WIDTH / $("#"+timelapse.getVideoDivId()).width();
					var vWidth = vid.width();
					var vHeight = vid.height();
					var vTopLeftX = vid.position()['left'];
					var vTopLeftY = vid.position()['top'];
					var theCanvas = $("#"+composerDivId + "_snaplapse_keyframe_" + keyframe['id'] + "_thumbnail").get(0);
					var ctx = theCanvas.getContext("2d");
					ctx.clearRect(0, 0, KEYFRAME_THUMBNAIL_WIDTH, KEYFRAME_THUMBNAIL_HEIGHT);
					ctx.drawImage(vid.get(0), 0, 0, timelapse.getVideoWidth(), timelapse.getVideoHeight(), vTopLeftX * scale, vTopLeftY * scale, vWidth * scale, vHeight * scale);
				} else {
					org.gigapan.Util.log("setKeyframeThumbail(): failed to find a good video");
				}
			} catch(e) {
				org.gigapan.Util.log("Exception while trying to create thumbnail: " + e + "  Video: " + theCanvas);
			}
		}
		
		var toggleSnaplapseButtons = function(text) {
			var numKeyframes = snaplapse.getNumKeyframes();
			if (numKeyframes > 1) {
				setButtonEnabled("#"+composerDivId+" #playStopSnaplapseButton", true);
				setButtonEnabled("#"+composerDivId+" #saveSnaplapseButton", true);
			} else {
				setButtonEnabled("#"+composerDivId+" #playStopSnaplapseButton", false);
				setButtonEnabled("#"+composerDivId+" #saveSnaplapseButton", false);
				setButtonEnabled("#"+composerDivId+" #deleteKeyframeButton", false);
			}

			setButtonEnabled("#"+composerDivId+" .snaplapse_keyframe_list_item_play_button", false);
			var keyframes = $("#"+composerDivId+" .snaplapse_keyframe_list_item");
			for (var i = 0; i < keyframes.length - 1; i++) {
				var buttonId = "#" + keyframes[i].id + " .snaplapse_keyframe_list_item_play_button";
				setButtonEnabled(buttonId, true);
			}
		}

		var isTextNonEmpty = function(text) {
			return (typeof text != 'undefined' && text.length > 0);
		}

		var hideAnnotationBubble = function() {
			$("#"+timelapseViewerDivId+" .snaplapse-annotation-description").hide();
		}

		var addSnaplapseKeyframeListItem = function(frame, insertionIndex, shouldDrawThumbnail) {
			var keyframeId = frame['id'];
			var keyframeListItem = document.createElement("div");
			keyframeListItem.id = composerDivId + "_snaplapse_keyframe_" + keyframeId;

			var keyframeListItems = $("#"+composerDivId+" .snaplapse_keyframe_list_item").get();
			if (insertionIndex < keyframeListItems.length) {
				$("#" + keyframeListItems[insertionIndex - 1]['id']).after(keyframeListItem);
			} else {
				$("#"+composerDivId+" .snaplapse_keyframe_list").append(keyframeListItem);
			}

			var thumbnailId = keyframeListItem.id + "_thumbnail";
			var timestampId = keyframeListItem.id + "_timestamp";
			var descriptionVisibleCheckboxId = keyframeListItem.id + "_description_visible";
			var descriptionId = keyframeListItem.id + "_description";
			var durationId = keyframeListItem.id + "_duration";
			var buttonContainerId = keyframeListItem.id + "_buttons";
			var updateButtonId = keyframeListItem.id + "_update";
			var duplicateButtonId = keyframeListItem.id + "_duplicate";
			var playFromHereButtonId = keyframeListItem.id + "_play";
			var duration = typeof frame['duration'] != 'undefined' && frame['duration'] != null ? frame['duration'] : '';
			var isDescriptionVisible = typeof frame['is-description-visible'] == 'undefined' ? true : frame['is-description-visible'];
			var content = '<table border="0" cellspacing="0" cellpadding="0" class="snaplapse_keyframe_list_item_table">' +
										'   <tr valign="top">' +
										'      <td>' +
										'         <div id="' + timestampId + '" class="snaplapse_keyframe_list_item_timestamp">' + org.gigapan.Util.formatTime(frame['time'], true) + '</div>' +
										'         <canvas id="' + thumbnailId + '" width="' + KEYFRAME_THUMBNAIL_WIDTH + '" height="' + KEYFRAME_THUMBNAIL_HEIGHT + '" class="snaplapse_keyframe_list_item_thumbnail"></canvas>' +
										'      </td>' +
										'      <td rowspan="2" class="snaplapse_keyframe_list_item_cell_padding">&nbsp;</td>' +
										'      <td style="text-align:left;">' +
										'         <div class="snaplapse_keyframe_list_item_description_label" style="text-align:left;"><input id="' + descriptionVisibleCheckboxId + '" type="checkbox" ' + (isDescriptionVisible ? 'checked="checked"' : '') + '><label for="' + descriptionVisibleCheckboxId + '">Description:</label></div>' +
										'         <div><textarea id="' + descriptionId + '" class="snaplapse_keyframe_list_item_description" onfocusout="hideAnnotationBubble();">' + frame['description'] + '</textarea></div>' +
										'      </td>' +
										'      <td rowspan="2" class="snaplapse_keyframe_list_item_cell_padding">&nbsp;</td>' +
										'   </tr>' +
										'   <tr valign="top">' +
										'      <td style="text-align:left;">' +
										'         <div id="' + buttonContainerId + '" class="button-container keyframe-button-container">' +
										'            <div id="' + updateButtonId + '" class="ui-state-default ui-corner-all button" title="Update this keyframe to current view">' +
										'               <span class="ui-icon ui-icon-refresh"></span>' +
										'            </div>' +
										'            <div id="' + duplicateButtonId + '" style="margin-left:2px;" class="ui-state-default ui-corner-all button" title="Duplicate this keyframe">' +
										'               <span class="ui-icon ui-icon-copy"></span>' +
										'            </div>' +
										'            <div id="' + playFromHereButtonId + '" style="margin-left:24px" class="snaplapse_keyframe_list_item_play_button ui-state-active ui-state-disabled ui-corner-all button" title="Play warp starting at this keyframe">' +
										'               <span class="ui-icon ui-icon-play"></span>' +
										'            </div>' +
										'         </div>' +
										'      </td>' +
										'      <td style="text-align:right;">' +
										'         <span class="snaplapse_keyframe_list_item_duration_label">Duration:</span>' +
										'         <input type="text" id="' + durationId + '" class="snaplapse_keyframe_list_item_duration" value="' + duration + '">' +
										'         <span class="snaplapse_keyframe_list_item_duration_label">seconds</span>' +
										'      </td>' +
										'   </tr>' +
										'</table>';
			//alert(keyframeListItem.id);
			$("#" + keyframeListItem.id).html(content).addClass("snaplapse_keyframe_list_item");
			$("#" + keyframeListItem.id)['mouseover'](function() {
				if (!snaplapse.isPlaying()) {
					$("#" + buttonContainerId).show();
				}
			});

			$("#" + keyframeListItem.id)['mouseout'](function() {
				$("#" + buttonContainerId).hide();
			});

			// toggle the description field enabled/disabled
			$("#" + descriptionVisibleCheckboxId)['change'](function() {
				if (this.checked) {
					$("#" + descriptionId).removeAttr("disabled");
					$("#" + descriptionId).removeClass("textarea_disabled");
				} else {
					$("#" + descriptionId).attr("disabled", "disabled");
					$("#" + descriptionId).addClass("textarea_disabled");
				}
				var description = $("#" + descriptionId).val();
				snaplapse.setTextAnnotationForKeyframe(keyframeId, description, this.checked);
			});

			// display the text annotation when you focus on the description field.
			$("#" + descriptionId)['focus'](function() {
				displaySnaplapseFrameAnnotation(snaplapse.getKeyframeById(keyframeId));
			});

			// save the text annotation on keyup, so that we don't need a save button
			$("#" + descriptionId)['keyup'](function() {
				var description = $("#" + descriptionId).val();
				snaplapse.setTextAnnotationForKeyframe(keyframeId, description, $("#" + descriptionVisibleCheckboxId).get(0)['checked']);
				displaySnaplapseFrameAnnotation(snaplapse.getKeyframeById(keyframeId));
			});

			// save the text annotation on keyup, so that we don't need a save button
			if (!isDescriptionVisible) {
				$("#" + descriptionId).addClass("textarea_disabled");
				$("#" + descriptionId).attr("disabled", "disabled");
			}

			// validate the duration on keyup, reformat it on change
			$("#" + durationId)['keyup'](function() {
				validateAndSanitizeDuration(durationId);
			});

			$("#" + durationId)['change'](function() {
				// validate and sanitize, and get the cleaned duration.
				var newDuration = validateAndSanitizeDuration(durationId);

				// update both the view and the model with the new duration
				var durationField = $("#" + durationId);
				durationField.val(newDuration);
				durationField.removeClass('validation-fault');

				snaplapse.setDurationForKeyframe(keyframeId, newDuration);
			});

			// add mouse event handlers to the Record Keyframe button
			addMouseEventHandlersToButton('#' + updateButtonId,
				function() {
					snaplapse.updateTimeAndPositionForKeyframe(keyframeId);
				});

			// add mouse event handlers to the Record Keyframe button
			addMouseEventHandlersToButton('#' + duplicateButtonId,
				function() {
					snaplapse.duplicateKeyframe(keyframeId);
				});

			// add mouse event handlers to the Record Keyframe button
			addMouseEventHandlersToButton('#' + playFromHereButtonId,
				function() {
					if (snaplapse.isPlaying()) {
						snaplapse.stop();
					}
					$(".keyframe-button-container").hide();
					snaplapse.play(keyframeId);
				});

			// remove selection from all other items, then select this item
			$(".ui-selected").removeClass("ui-selected");
			$("#" + keyframeListItem.id).addClass("ui-selected");
			handleSnaplapseFrameSelectionChange(false);

			// grab the current video frame and store it as the thumbnail in the canvas
			if (shouldDrawThumbnail) {
				setKeyframeThumbail(frame);
			}
		}

		var validateAndSanitizeDuration = function(durationId) {
			var durationField = $("#" + durationId);
			var durationStr = durationField.val().trim();

			durationField.removeClass('validation-fault');
			if (durationStr.length > 0) {
				var num = parseFloat(durationStr);

				if (!isNaN(num) && (num >= 0)) {
					durationField.removeClass('validation-fault');
					return num.toFixed(1);
				} else {
					durationField.addClass('validation-fault');
				}
			}

			return '';
		}

		var recordKeyframe = function() {
			if (snaplapse) {
				// If there's a keyframe already selected, then we'll append after that one.  Otherwise, just append to the end.
				var selectedItems = $("#"+composerDivId+" .snaplapse_keyframe_list > .ui-selected");
				var numSelected = selectedItems.size();

				if (numSelected == 1) {
					var id = selectedItems.get(0).id;
					var keyframeId = composerDivId + "_" + id.substring("snaplapse_keyframe_".length);
					snaplapse.recordKeyframe(keyframeId);
				} else {
					snaplapse.recordKeyframe();
				}
			}
		}

		var playCachedSnaplapse = function(snaplapseId) {
			org.gigapan.Util.log("playCachedSnaplapse(" + snaplapseId + ")");
			var s = cachedSnaplapses[snaplapseId];
			if (typeof s != 'undefined' && s) {
				if (snaplapse && snaplapse.isPlaying()) {
					snaplapse.stop();
				}

				if (newSnaplapse(JSON.stringify(s))) {
					playStopSnaplapse();
				} else {
					alert("ERROR: Invalid time warp file.");
				}
			}
		}

		var cacheSnaplapse = function(snaplapseJsonUrl, callback) {
			$.ajax({
				dataType:'json',
				url: snaplapseJsonUrl,
				success: function(snaplapseJSON) {
					if (snaplapseJSON) {
						//org.gigapan.Util.log("Loaded this snaplapse JSON: [" + JSON.stringify(snaplapseJSON) + "]");
						cachedSnaplapses[snaplapseJsonUrl] = snaplapseJSON;
						if (callback && typeof callback == 'function') {
							callback();
						}
					} else {
						org.gigapan.Util.error("Failed to load snaplapse json from URL [" + snaplapseJsonUrl + "]");
					}
				},
				error: function() {
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

		var setupSnaplapseLinks = function() {
			$(".snaplapse_link").each(function(index, elmt) {
				var linkSpan = $(elmt);
				var labelSpan = linkSpan.children().first();
				var filenameSpan = labelSpan.next();
				var snaplapseJsonUrl = filenameSpan.children('a').first().get(0).href;
				filenameSpan.detach();
				var originalContent = labelSpan.html();

				org.gigapan.Util.log("setupSnaplapseLinks(): [" + index + "]" + labelSpan.text() + "|" + snaplapseJsonUrl + "|" + originalContent);

				if (!browserSupported) {
					linkSpan.replaceWith('<a class="time_warp_link" href="#" onclick="loadVideoSnaplapse(\'' + filenameSpan.text() + '\');return false;">' + originalContent + '</a>');
				} else {
					cacheSnaplapse(snaplapseJsonUrl, function() {
						linkSpan.replaceWith('<a class="time_warp_link" href="#" onclick="playCachedSnaplapse(\'' + snaplapseJsonUrl + '\');return false;">' + originalContent + '</a>');
					});
				}
			});
		}

		var playStopSnaplapse = function() {
			if (snaplapse.isPlaying()) {
				snaplapse.stop();
			} else {
				$(".keyframe-button-container").hide();
				snaplapse.play();
			}
		}

/*		var saveSnaplapse = function() {
			if (snaplapse && (snaplapse.getNumKeyframes() > 1)) {
				// prompt the user for a filename for their snaplapse
				var filename = prompt("Filename for your time warp:", "untitled.warp");

				// filename is null if the user hit Cancel
				if (filename != null) {
					// trim it
					filename = $.trim(filename);

					// if it's empty, give it a default name
					if (filename.length == 0) {
						filename = "untitled";
					}

					// add a .warp extension if necessary
					var lowerCaseFilename = filename.toLowerCase();
					if (!/.warp$/.test(lowerCaseFilename)) {
						filename += ".warp";
					}
					
					// submit the hidden form so that we can bounce it back to the user with an attachment content-disposition
					$("#save_snaplapse_form_json").val(snaplapse.getAsJSON());
					$("#save_snaplapse_form_filename").val(filename);
					showSaveSnaplapseWindow();
					//$("#save_snaplapse_form").get(0).submit();
				}
			} else {
				alert("ERROR: No time warp to save--please create a time warp and add at least two keyframes to it.")
			}
		}*/
		
		var saveSnaplapse = function() {
			if (snaplapse && (snaplapse.getNumKeyframes() > 1)) {
				$("#save_snaplapse_form_json").val(snaplapse.getAsJSON());
				showSaveSnaplapseWindow();
			} else {
				alert("ERROR: No time warp to save--please create a time warp and add at least two keyframes to it.")
			}
		}		
		
                var getSnaplapseJSON = function() {
                  return snaplapse.getAsJSON();    
                }

                var showLoadSnaplapseWindow = function() {
                  loadSnaplapseWindow = popup('load_snaplapse.html', 'loadSnaplapseWindow');
		}

                var showSaveSnaplapseWindow = function() {
                  saveSnaplapseWindow = popup('save_snaplapse.html', 'saveSnaplapseWindow');
                }

		var _loadSnaplapse = function(json) {
			if (loadSnaplapseWindow) {
				if (newSnaplapse(json)) {
					$('#'+composerDivId+" .snaplapse_composer_controls").show();
					loadSnaplapseWindow.close();
					clearKeyframeSelection();
					hideAnnotationBubble();
				} else {
					alert("ERROR: Invalid time warp file.");
				}
			}
		}
                this.loadSnaplapse = _loadSnaplapse;

		var deleteSelectedKeyframes = function() {
			var selectedItems = $("#"+composerDivId+" .snaplapse_keyframe_list > .ui-selected");
			var numSelected = selectedItems.size();

			if (numSelected > 0) {
				var selectedKeyframeElements = selectedItems.get();
				for (var i = 0; i < numSelected; i++) {
					var keyframeElement = selectedKeyframeElements[i];
					var id = keyframeElement['id'];
					var keyframeId = composerDivId + "_" + id.substring("snaplapse_keyframe_".length);

					snaplapse.deleteKeyframeById(keyframeId);
					$("#" + id).detach();
				}

				toggleSnaplapseButtons();
				handleSnaplapseFrameSelectionChange(false);
			}

			$("#"+composerDivId+" #deleteKeyframeButton").attr("disabled", "disabled");
		}

		// Code from:
		//    http://javascript-array.com/scripts/window_open/
		//    http://www.webdeveloper.com/forum/showthread.php?t=15735
		var popup = function(url, windowName) {
			// get dimensions of parent window so we can center the new window within the parent
			var parentWidth = $(window).width();
			var parentHeight = $(window).height();
			var parentX = (document.all) ? window.screenLeft : window['screenX'];
			var parentY = (document.all) ? window.screenTop : window['screenY'];

			var width = 500;
			var height = 580;
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
			if (window.focus) {
				newWindow.focus()
			}
			return newWindow;
		}
		
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    initializeSnaplapseUI();
  };
})();

