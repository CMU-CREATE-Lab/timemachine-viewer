// Autogenerated by update_template_includes.rb Wed Mar 27 12:52:11 -0400 2019
var cached_ajax=cached_ajax||{};
cached_ajax['templates/browser_not_supported_template.html']="<div id=\"browser_not_supported\">\n  <div class=\"warning\">Sorry, but it looks like your browser is not currently supported by our viewer.\n    <br><br>At this time, we support recent desktop and mobile versions of\n    <a href=\"http://www.google.com/chrome\">Chrome</a>,\n    <a href=\"http://www.apple.com/safari/\">Safari</a>,\n    <a href=\"http://www.firefox.com\">Firefox</a> and\n    <a href=\"http://windows.microsoft.com/en-us/internet-explorer/download-ie\">Internet Explorer / Microsoft Edge</a>.\n  </div>\n</div>\n";
cached_ajax['templates/player_template.html']="<div class=\"player\">\n  <div class=\"sideToolBar\">\n    <div class=\"pan\" title=\"Click to pan\"></div>\n    <div class=\"zoom\"></div>\n  </div>\n\n  <div class=\"instructions\">\n    <span class=\"zoomhelp\">\n      <p>\n        Zoom in and out to explore in greater detail. Click or use the mouse scroll wheel.\n      </p></span>\n    <span class=\"zoomallhelp\">\n      <p>\n        Click to view the whole scene.\n      </p></span>\n    <span class=\"speedhelp\">\n      <p>\n        Click to toggle playback speed.\n      </p></span>\n    <span class=\"movehelp\">\n      <p>\n        Click and drag to explore.\n      </p></span>\n  </div>\n\n  <div class=\"spinnerOverlay\"></div>\n\n  <div id=\"{REPLACE}\" class=\"tiledContentHolder\"></div>\n\n  <div class=\"captureTime\" title=\"Capture time\">\n    <div class=\"currentCaptureTime\"></div>\n  </div>\n\n  <div class=\"controls\">\n    <div class=\"timelineSliderFiller\">\n      <div id=\"Tslider1\" class=\"timelineSlider\"></div>\n    </div>\n    <div class=\"timelineSelectorFiller\">\n      <div id=\"Tselector1\" class=\"timelineSelector\"></div>\n    </div>\n    <div title=\"Play\" class=\"playbackButton\"></div>\n    <div class=\"videoTime\" title=\"Video time\">\n      <span class=\"currentTime\">00:00.00</span>/<span class=\"totalTime\">00:00.00</span>\n    </div>\n    <input type=\"checkbox\" class=\"helpPlayerCheckbox\"/>\n    <label class=\"helpPlayerLabel\" title=\"Show instructions\">Help</label>\n    <button class=\"toggleSpeed\" id=\"fastSpeed\" title=\"Toggle playback speed\">\n      Fast\n    </button>\n    <button class=\"toggleSpeed\" id=\"mediumSpeed\" title=\"Toggle playback speed\">\n      Medium\n    </button>\n    <button class=\"toggleSpeed\" id=\"slowSpeed\" title=\"Toggle playback speed\">\n      Slow\n    </button>\n    <button class=\"share customButton\" title=\"Share current view\">\n      Share\n    </button>\n    <button class=\"tool customButton\" title=\"Tools\">\n      Tools\n    </button>\n  </div>\n\n  <div class=\"toolDialog\" title=\"Tools\">\n    <div class=\"toolDialogContent\">\n      <div class=\"customCheckboxContainer\" data-mode=\"editor\">\n        <label class=\"customCheckboxLabelBold\">\n          <input type=\"checkbox\" class=\"customCheckbox\" value=\"editor\"/>\n          Toggle tour and slideshow editor\n        </label>\n        <p>\n          The tour and slideshow editor enables telling and sharing interesting stories by creating custom guided tours and interactive slideshows, travelling through space and time. For more information, refer to the <a href=\"http://wiki.gigapan.org/creating-time-machines/embedding-time-machine\" target=\"_blank\">tutorial</a>.\n        </p>\n      </div>\n      <div class=\"customCheckboxContainer\" data-mode=\"annotator\">\n        <label class=\"customCheckboxLabelBold\">\n          <input type=\"checkbox\" class=\"customCheckbox\" value=\"annotator\">\n          Toggle annotator\n        </label>\n        <p>\n          The annotator enables creating customized annotations on the viewer.\n        </p>\n      </div>\n      <div class=\"customCheckboxContainer\" data-mode=\"change-detection\">\n        <label class=\"customCheckboxLabelBold\">\n          <input type=\"checkbox\" class=\"customCheckbox\" value=\"change-detection\">\n          Toggle change detection tool\n        </label>\n        <p>\n          The change detection tool computes the number of moving pixels in an area in the video.\n        </p>\n        <p class=\"changeDetectionControl\">\n          <a href=\"javascript:void(0)\" class=\"apply-change-detect\">Click here to detect</a> changes in the selected region.\n          <br>\n          Center the box to a <a href=\"javascript:void(0)\" class=\"reset-large-change-detect\">large</a>,&nbsp;<a href=\"javascript:void(0)\" class=\"reset-medium-change-detect\">medium</a>, or&nbsp;<a href=\"javascript:void(0)\" class=\"reset-small-change-detect\">small</a> size\n        </p>\n      </div>\n    </div>\n  </div>\n\n  <span class=\"thumbnail-preview-copy-text-button-tooltip\">\n    <p></p>\n  </span>\n\n  <ul class=\"thumbnail-playback-rate-menu customDropdownMenu\">\n    <li data-rate=\"0.25\" data-title=\"Slow\">Slow</li>\n    <li data-rate=\"0.5\" data-title=\"Medium\">Medium</li>\n    <li data-rate=\"1\" data-title=\"Fast\">Fast</li>\n    <li data-rate=\"0\" data-title=\"Custom\">Custom</li>\n  </ul>\n\n  <div class=\"shareView\">\n    <div class=\"ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix ui-draggable-handle\">\n      <span id=\"ui-id-5\" class=\"ui-dialog-title\">Share a View</span>\n      <button type=\"button\" class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close\" role=\"button\" title=\"Close\">\n        <span class=\"ui-button-icon-primary ui-icon ui-icon-closethick\"></span>\n        <span class=\"ui-button-text\">Close</span>\n      </button>\n    </div>\n    <div class=\"accordion\">\n      <h3>Share as link</h3>\n      <div id=\"share-link-container\">\n        <table class=\"share-link\">\n          <tr>\n            <td><input type=\"text\" class=\"shareurl\"></td>\n            <td><div class=\"shareurl-copy-text-button customDialogButton\">Copy</div></td>\n          </tr>\n          <tr class=\"presentation-mode-share-input\">\n            <td>Start from current waypoint</td>\n            <td><input type=\"checkbox\" class=\"waypoint-index\"></td>\n          </tr>\n          <tr class=\"presentation-mode-share-input\">\n            <td>Share only current view</td>\n            <td><input type=\"checkbox\" class=\"waypoint-only\"></td>\n          </tr>\n        </table>\n      </div>\n      <h3>Share as image or video</h3>\n      <div class=\"share-thumbnail\">\n        <table class=\"share-thumbnail-tool\">\n          <tr colspans=\"3\">\n            <td>Output dimensions</td>\n            <td><input id=\"thumbnail-width\" type=\"number\" min=\"64\" value=\"1280\">&nbsp;x&nbsp;<input id=\"thumbnail-height\" type=\"number\" min=\"64\" value=\"720\"><span title=\"Swap width and height\" class=\"thumbnail-swap-selection-dimensions\"></span></td>\n          </tr>\n          <tr>\n            <td>Starting time:</td>\n            <td><input class=\"startingTimeSpinner\" name=\"spinner\" value=\"\"><span title=\"Set to current time from timeline\" class=\"thumbnail-set-start-time-from-timeline thumbnail-set-current-time\"></span></td>\n          </tr>\n          <tr>\n            <td>Ending time:</td>\n            <td><input class=\"endingTimeSpinner\" name=\"spinner\" value=\"\"><span title=\"Set to current time from timeline\" class=\"thumbnail-set-end-time-from-timeline thumbnail-set-current-time\"></span></td>\n          </tr>\n          <tr>\n            <td>Type:</td>\n            <td>\n              <div class=\"customDialogButton thumbnail-type-image selected\">Image</div>\n              <div class=\"customDialogButton thumbnail-type-video\">Video</div>\n            </td>\n          </tr>\n          <tr>\n            <td>Playback rate:</td>\n            <td><div class=\"thumbnail-playback-rate customDropdownButton\" data-rate=\"0.5\">Medium</div></td>\n          </tr>\n          <tr>\n            <td>FPS:</td>\n            <td><div id=\"thumbnail-fps-overlay\"><input class=\"thumbnail-fps\" type=\"number\" step=\"1\" min=\"1\" max=\"60\" value=\"30\"></div></td>\n          </tr>\n          <tr>\n            <td>Delay at start (sec):</td>\n            <td><input class=\"thumbnail-start-delay\" type=\"number\" step=\"0.1\" min=\"0\" value=\"0\"></td>\n          </tr>\n          <tr>\n            <td>Delay at end (sec):</td>\n            <td><input class=\"thumbnail-end-delay\" type=\"number\" step=\"0.1\" min=\"0\" value=\"0\"></td>\n          </tr>\n          <tr>\n            <td>Embed time</td>\n            <td><input type=\"checkbox\" class=\"embed-capture-time\" checked></td>\n          </tr>\n          <tr class=\"thumbnail-processing-time-warning-container\">\n            <td colspan=\"2\"><div class=\"thumbnail-processing-time-warning\"></div></td>\n          </tr>\n          <tr>\n            <td colspan=\"2\"><div class=\"generate-thumbnail customDialogButton customHighlightDialogButton\">Generate Image</div></td>\n          </tr>\n        </table>\n        <table class=\"thumbnail-preview-copy-text-container\">\n          <tr valign=\"top\">\n            <td><div class=\"thumbnail-preview-copy-data-button customDialogButton\">Copy Image</div></td>\n            <td><div class=\"thumbnail-preview-copy-text-button customDialogButton\">Copy As Link</div></td>\n            <td><div class=\"thumbnail-preview-copy-download-button customDialogButton\">Download</div></td>\n          </tr>\n          <tr class=\"social-media\">\n\n          </tr>\n          <tr valign=\"top\">\n            <td colspan=\"3\">\n              Preview:\n              <div class=\"thumbnail-preview-container always-selectable\">\n                <br/><a class=\"thumbnail-preview-link\" href=\"\"></a>\n              </div>\n            </td>\n          </tr>\n        </table>\n      </div>\n    </div>\n  </div>\n</div>\n";
cached_ajax['templates/mobile_player_template.html']="<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, user-scalable=no\">\n\n<div class=\"player\">\n\n  <div class=\"spinnerOverlay\"></div>\n\n  <div class=\"etMobileTopNav\">\n    <div class=\"etMobileSearchBoxContainer\">\n      <input class=\"etMobileSearchBox\" placeholder=\"Search for a location...\">\n      <span class=\"etMobileSearchBoxIcon\"></span>\n      <span class=\"etMobileSearchBoxClear\"></span>\n    </div>\n    <div class=\"etMobileTimelineContainer\">\n      <div class=\"etMobileTimeline\"></div>\n    </div>\n  </div>\n\n  <div title=\"Play\" class=\"etMobilePlaybackButton play\"></div>\n\n\n  <div id=\"{REPLACE}\" class=\"tiledContentHolder\"></div>\n\n  <div class=\"etMobileWaypointDrawerContainer\">\n    <div class=\"etMobileWaypointDrawerContainerHeader\">\n      <div class=\"etMobileWaypointDrawerContainerDragIndicator\"></div>\n      <div class=\"etDrawerContainerTitle\"></div>\n    </div>\n    <div class=\"etDrawerProductAboutHeading\">\n      <span class=\"etDrawerLearnMoreExit\"></span>\n      About the project\n    </div>\n    <div class=\"etDrawerProductAboutDescription\">\n      <div class=\"etDrawerProductAboutDescriptionContent\"></div>\n      <span class=\"etDrawerProductAboutDescriptionMoreButton\"></span>\n    </div>\n    <div class=\"etDrawerProductLearnMoreContainer\">\n      <div class=\"etDrawerProductLearnMoreContent\"></div>\n    </div>\n    <div class=\"etDrawerProductHighlightsHeading\"></div>\n  </div>\n\n</div>\n";
cached_ajax['templates/time_warp_composer.html']="<div class=\"toolbar\">\n  <div class=\"editorModeToolbar\"></div>\n  <button class=\"toggleMode\" title=\"Toggle between tour and slideshow editor\">Change Mode</button>\n  <ul class=\"editorModeOptions\"></ul>\n</div>\n\n<div class=\"snaplapse_keyframe_container\">\n  <div class=\"snaplapse_keyframe_list\"></div>\n</div>\n\n<div class=\"createSubtitle_dialog\" title=\"Edit Title and Subtitle\">\n  <table class=\"createSubtitle_dialog_table\">\n    <tr>\n      <td>\n        <div class=\"keyframe_title_container\">Keyframe Title:&nbsp;\n          <input type=\"text\" value=\"\" class=\"keyframe_title_input\" maxlength=\"20\">\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td>\n        <div class=\"createSubtitle_dialog_txt\">\n          Add a caption to this keyframe.\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td><textarea class=\"subtitle_textarea\"></textarea></td>\n    </tr>\n  </table>\n</div>\n\n<div class=\"loadTimewarpWindow\" title=\"Load a Tour or Slideshow\">\n  <table class=\"loadTimewarpWindowTable\">\n    <tr>\n      <td><div id=\"loadSnaplapseButton\" class=\"customDialogButton\">Load</div></td>\n      <td>\n        <div class=\"loadTimewarpWindow_txt\">\n          Paste the share link into the text box below and then click the Load button.\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td colspan=\"2\"><textarea class=\"loadTimewarpWindow_JSON\"></textarea></td>\n    </tr>\n  </table>\n</div>\n\n<div class=\"saveTimewarpWindow\" title=\"Share a Tour or Slideshow\">\n  <table class=\"saveTimewarpWindowTable\">\n    <tr>\n      <td>Title:&nbsp;<input type=\"text\" value=\"Untitled\" class=\"saveTimewarpWindow_tourTitleInput\" maxlength=\"30\"></td>\n    </tr>\n    <tr>\n      <td><h3 class=\"saveTimewarpWindow_title_share\">Save and Share</h3></td>\n    </tr>\n    <tr>\n      <td>\n        <div class=\"saveTimewarpWindow_txt\">\n          Copy the link below and share it on the web. Everyone who visits it will see the tour or slideshow you made.\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td><textarea class=\"saveTimewarpWindow_JSON\"></textarea></td>\n    </tr>\n    <tr>\n      <td><h3 class=\"saveTimewarpWindow_title_embed\">Embed</h3></td>\n    </tr>\n    <tr>\n      <td>\n        <div class=\"saveTimewarpWindow_txt2\">\n          You can also copy the iframe code below and embed this tour or slideshow on your own website or blog.\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td><textarea class=\"saveTimewarpWindow_JSON2\"></textarea></td>\n    </tr>\n    <tr>\n      <td>\n        Video Size:&nbsp;\n        <select class=\"saveTimewarpWindow_JSON2_sizes\">\n          <option value=\"720,394\">720 x 394</option>\n          <option value=\"750,530\">750 x 530</option>\n          <option value=\"854,480\" selected=\"selected\">854 x 480</option>\n          <option value=\"1024,576\">1024 x 576</option>\n          <option value=\"1152,648\">1152 x 648</option>\n        </select>\n      </td>\n    </tr>\n  </table>\n</div>\n\n<span class=\"keyframeSubtitleBoxForHovering\">\n  <p></p>\n</span>";
cached_ajax['templates/annotation_editor.html']="<div class=\"annotator\">\n  <div class=\"toolbar\">\n    <div class=\"annotator-title\">Create customized annotations</div>\n    <div class=\"annotatorModeToolbar\"></div>\n  </div>\n  <div class=\"annotation_container\">\n    <div class=\"annotation_list\"></div>\n  </div>\n  <div class=\"loadAnnotatorWindow\" title=\"Load annotations\">\n    <button class=\"loadAnnotatorButton\" title=\"Load annotations\">\n      Load\n    </button>\n    <div class=\"loadAnnotatorWindow_txt\">\n      To load annotations, paste the code into the text box below and then click the Load button.\n    </div>\n    <textarea class=\"loadAnnotatorWindow_JSON\"></textarea>\n  </div>\n\n  <div class=\"saveAnnotatorWindow\" title=\"Save annotations\">\n    <div class=\"saveAnnotatorWindow_txt\">\n      To save these annotations, copy the code contained in the text box below and paste it into a new file in your favorite text editor.\n    </div>\n    <textarea class=\"saveAnnotatorWindow_JSON\"></textarea>\n  </div>\n</div>\n";
