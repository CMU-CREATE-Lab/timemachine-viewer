// Autogenerated by update_template_includes.rb Sun Oct 13 03:20:07 -0400 2013
var cached_ajax=cached_ajax||{};
cached_ajax['browser_not_supported_template.html']="<div id=\"browser_not_supported\" style=\"display: none;\">\n  <div class=\"warning\">Sorry, but it looks like your browser is not currently supported by our viewer.\n    <br><br>At this time, we support the desktop versions of\n    <a href=\"http://www.google.com/chrome\">Chrome</a>,\n    <a href=\"http://www.apple.com/safari/\">Safari</a>,\n    <a href=\"http://www.firefox.com\">Firefox</a> and\n    <a href=\"http://windows.microsoft.com/en-us/internet-explorer/download-ie\">Internet Explorer 9+<a>.\n  </div>\n</div>\n";
cached_ajax['player_template.html']="<div class=\"sideToolBar\">\n  <div class=\"pan\" title=\"Click to pan\"></div>\n  <div class=\"zoom\"></div>\n  <div class=\"tools\"></div>\n</div>\n\n<div class=\"instructions\">\n  <span class=\"zoomhelp\">\n    <p>\n      Zoom in and out to explore in greater detail. Click or use the mouse scroll wheel.\n    </p></span>\n  <span class=\"zoomallhelp\">\n    <p>\n      Click to view the whole scene.\n    </p></span>\n  <span class=\"speedhelp\">\n    <p>\n      Click to change playback speed and direction.\n    </p></span>\n  <span class=\"movehelp\">\n    <p>\n      Click and drag to explore.\n    </p></span>\n  <span class=\"loophelp\">\n    <p>\n      Click to loop playback.\n    </p></span>\n</div>\n\n<div class=\"spinnerOverlay\"></div>\n\n<div id=\"{REPLACE}\" class=\"tiledContentHolder\"></div>\n\n<div class=\"timelineSliderFiller\">\n  <div class=\"timeSliderColorBot_div_playerMode\">\n    &nbsp\n  </div>\n  <canvas width=\"818\" height=\"8\" class=\"timeSliderColorSelectorBot_canvas_editorMode\">\n    &nbsp\n  </canvas>\n  <div id=\"Tslider1\" class=\"timelineSlider\" title=\"Click to go to a different point in time\"></div>\n</div>\n\n<div class=\"controls\">\n  <div title=\"Play\" class=\"playbackButton\"></div>\n  <div class=\"repeatBtnContainer\"></div>\n  <div title=\"Stop time warp\" class=\"stopTimeWarp\" style=\"display: none;\"></div>\n  <div class=\"captureTime\" title=\"Capture time\">\n    <div class=\"currentCaptureTime\"></div>\n  </div>\n  <div class=\"videoTime\" title=\"Video time\">\n    <span class=\"currentTime\">00:00.00</span>/<span class=\"totalTime\">00:00.00</span>\n  </div>\n  <div class=\"toolbar\">\n    <div class=\"viewerModeBtnContainer\"></div>\n    <div class=\"fullScreenBtnContainer\"></div>\n    <div class=\"playerModeToolbar\"></div>\n    <div class=\"editorModeToolbar\"></div>\n    <div class=\"annotatorModeToolbar\"></div>\n    <ul class=\"sizeOptions\"></ul>\n    <ul class=\"playbackSpeedOptions\"></ul>\n    <ul class=\"viewerModeOptions\"></ul>\n    <div class=\"mask\" style=\"width:100%; height:14%; position: absolute; top: 0; right: 0;\">\n  </div>\n</div>\n\n<div class=\"carousel layerSlider\" style=\"display: none;\">\n  <a href=\"javascript:void(0);\" class=\"prev\"></a>\n  <div class=\"jCarouselLite\">\n    <ul class=\"layerChoices\"></ul>\n  </div>\n  <a href=\"javascript:void(0);\" class=\"next\"></a>\n</div>\n\n<div class=\"shareView\" title=\"Share Current View\">\n  <textarea class=\"shareurl\"></textarea>\n</div>\n\n<div id=\"user-options\" class=\"toolbar-icons\" style=\"display: none;\">\n  <a href=\"#\"><i class=\"icon-user\"></i></a>\n  <a href=\"#\"><i class=\"icon-star\"></i></a>\n  <a href=\"#\"><i class=\"icon-edit\"></i></a>\n  <a href=\"#\"><i class=\"icon-trash\"></i></a>\n  <a href=\"#\"><i class=\"icon-ban-circle\"></i></a>\n</div>";
cached_ajax['time_warp_composer.html']="<div class=\"snaplapse_keyframe_container\">\n  <div class=\"snaplapse_keyframe_list\"></div>\n</div>\n\n<form id=\"save_snaplapse_form\" method=\"post\" action=\"../timelapse/save_time_warp.php\" style=\"display:none\" onsubmit=\"return false;\">\n  <textarea id=\"save_snaplapse_form_json\" name=\"json\" rows=\"10\" cols=\"40\"></textarea>\n</form>\n\n<div class=\"createSubtitle_dialog\" title=\"Edit Subtitle\">\n  <p>\n    Maximum Character Limit: 120\n  </p>\n  <textarea class=\"subtitle_textarea\"></textarea>\n</div>\n\n<div class=\"loadTimewarpWindow\" title=\"Load a Tour\">\n  <button id=\"loadSnaplapseButton\">\n    Load\n  </button>\n  <div class=\"loadTimewarpWindow_txt\">\n    To load a tour, paste the link into the text box below and then click the Load button.\n  </div>\n  <textarea class=\"loadTimewarpWindow_JSON\"></textarea>\n</div>\n\n<div class=\"saveTimewarpWindow\" title=\"Share a Tour\">\n  <div class=\"saveTimewarpWindow_tourTitle\">Tour Title: <input type=\"text\" value=\"Untitled\" class=\"saveTimewarpWindow_tourTitleInput\" maxlength=\"30\"></div>\n  <h2 class=\"saveTimewarpWindow_title_share\">Save and Share</h1>\n <div class=\"saveTimewarpWindow_txt\">\n    Copy the link below and share it anywhere on the web. Everyone who visits it will see the tour you made.\n  </div>\n  <textarea class=\"saveTimewarpWindow_JSON\"></textarea>\n  <h2 class=\"saveTimewarpWindow_title_embed\">Embed</h1>\n <div class=\"saveTimewarpWindow_txt2\">\n    You can also copy the iframe code below and embed this tour or presentation on your own website or blog.\n  </div>\n  <textarea class=\"saveTimewarpWindow_JSON2\"></textarea>\n  <div class=\"saveTimewarpWindow_JSON2_sizesContainer\">\n  Video size: <select class=\"saveTimewarpWindow_JSON2_sizes\">\n    <option value=\"720,394\">720 x 394</option>\n    <option value=\"750,530\">750 x 530</option>\n    <option value=\"854,480\" selected=\"selected\">854 x 480</option>\n    <option value=\"1024,576\">1024 x 576</option>\n    <option value=\"1152,648\">1152 x 648</option>\n  </select>\n  </div>\n</div>\n";
cached_ajax['annotation_editor.html']="<div class=\"annotation_container\">\n  <div class=\"annotation_list\"></div>\n</div>\n\n<div class=\"loadAnnotatorWindow\" title=\"Load annotations\">\n  <button class=\"loadAnnotatorButton\" title=\"Load annotations\">\n    Load\n  </button>\n  <div class=\"loadAnnotatorWindow_txt\">\n    To load annotations, paste the code into the text box below and then click the Load button.\n  </div>\n  <textarea class=\"loadAnnotatorWindow_JSON\"></textarea>\n</div>\n\n<div class=\"saveAnnotatorWindow\" title=\"Save annotations\">\n  <div class=\"saveAnnotatorWindow_txt\">\n    To save these annotations, copy the code contained in the text box below and paste it into a new file in your favorite text editor.\n  </div>\n  <textarea class=\"saveAnnotatorWindow_JSON\"></textarea>\n</div>";
