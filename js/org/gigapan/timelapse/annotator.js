// @license
// Redistribution and use in source and binary forms ...

/*
 Class for managing annotations in a time machine

 Dependencies:
 * org.gigapan.timelapse.Timelapse
 * jQuery (http://jquery.com/)
 * KineticJS (http://kineticjs.com/)

 Copyright 2013 Carnegie Mellon University. All rights reserved.

 Redistribution and use in source and binary forms, with or without modification, are
 permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this list of
 conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright notice, this list
 of conditions and the following disclaimer in the documentation and/or other materials
 provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
 WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 The views and conclusions contained in the software and documentation are those of the
 authors and should not be interpreted as representing official policies, either expressed
 or implied, of Carnegie Mellon University.

 Authors:
 Paul Dille (pdille@andrew.cmu.edu)
*/

"use strict";

//
// VERIFY NAMESPACE
//

// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
if (!org) {
  org = {};
} else {
  if ( typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if ( typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse) {
  org.gigapan.timelapse = {};
} else {
  if ( typeof org.gigapan.timelapse != "object") {
    var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
    alert(orgGigapanTimelapseExistsMessage);
    throw new Error(orgGigapanTimelapseExistsMessage);
  }
}

//
// DEPENDECIES
//
if (!org.gigapan.timelapse.Timelapse) {
  var noTimelapseMsg = "The org.gigapan.timelapse.Timelapse library is required by org.gigapan.timelapse.Annotator";
  alert(noTimelapseMsg);
  throw new Error(noTimelapseMsg);
}
if (!window['$']) {
  var nojQueryMsg = "The jQuery library is required by org.gigapan.timelapse.Annotator";
  alert(nojQueryMsg);
  throw new Error(nojQueryMsg);
}

//
// CODE
//
(function() {
  var UTIL = org.gigapan.Util;
  org.gigapan.timelapse.Annotator = function(annotatorDivId, timelapse) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Class variables
    //
    var $annotatorDivObj = $("#" + annotatorDivId);
    var videoDivId = timelapse.getVideoDivId();
    var videoDiv = document.getElementById(videoDivId);
    var viewerDivId = timelapse.getViewerDivId();
    var dataPanesId = timelapse.getDataPanesId();
    var annotationCounter = 0;
    var annotationStage;
    var annotationLayer;
    var annotationList = [];

    var canAddAnnotation = false;
    var canMoveAnnotation = false;
    var tagColorDefault = [0, 0, 0];

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    var setCanAddAnnotation = function(status) {
      canAddAnnotation = status;
    };
    this.setCanAddAnnotation = setCanAddAnnotation;

    var setCanMoveAnnotation = function(status) {
      canMoveAnnotation = status;
    };
    this.setCanMoveAnnotation = setCanMoveAnnotation;

    var getCanMoveAnnotation = function() {
      return canMoveAnnotation;
    };
    this.getCanMoveAnnotation = getCanMoveAnnotation;

    var _getAnnotationStage = function() {
      return annotationStage;
    };
    this.getAnnotationStage = _getAnnotationStage;

    var _getAnnotationLayer = function() {
      return annotationLayer;
    };
    this.getAnnotationLayer = _getAnnotationLayer;

    var _getAnnotationList = function() {
      return annotationList;
    };
    this.getAnnotationList = _getAnnotationList;

    var _loadAnnotations = function(json) {
      if (json) {
        $("#" + annotatorDivId + " .loadAnnotatorWindow").dialog("close");
        clearAnnotations();
        loadAnnotationsFromJSON(json);
        _updateAnnotationPositions();
      } else {
        alert("ERROR: Invalid annotations file");
      }
    };
    this.loadAnnotations = _loadAnnotations;

    var _updateAnnotationPositions = function() {
      // TODO: optimize/cleanup?
      var doStageRedraw = false;
      if (annotationStage) {
        for (var i = 0; i < annotationList.length; i++) {
          var annotationObj = annotationList[i].kineticObj;
          annotationObj.setAttrs(timelapse.convertTimeMachineToViewport({
            x: annotationList[i].xPos,
            y: annotationList[i].yPos
          }));

          if (annotationList[i].type == "video" || annotationList[i].type == "image") {
            $("#" + annotationList[i].id + "_" + annotationList[i].type).css({
              left: annotationObj.attrs.x,
              top: annotationObj.attrs.y
            });
          }

          var currentTime = timelapse.getCurrentTime();
          if (timelapse.getCurrentZoom() >= annotationList[i].minZoom && (annotationList[i].startTime <= currentTime && annotationList[i].endTime >= currentTime)) {
            if (!annotationObj.attrs.visible) {
              annotationObj.show();
              if (annotationList[i].wasMediaElmVisible)
                annotationList[i].mediaElm.show();
            }
          } else {
            if (annotationObj.attrs.visible) {
              annotationObj.hide();
              if (annotationList[i].type == "audio" || annotationList[i].type == "video") {
                if (annotationList[i].mediaElm) {
                  annotationList[i].mediaElm.get(0).pause();
                  annotationList[i].mediaElm.get(0).currentTime = 0;
                  if (annotationList[i].mediaElm.filter(':visible').length > 0) {
                    annotationList[i].wasMediaElmVisible = true;
                    annotationList[i].mediaElm.hide();
                  } else {
                    annotationList[i].wasMediaElmVisible = false;
                  }
                }
              } else if (annotationList[i].type == "image") {
                if (annotationList[i].mediaElm) {
                  if (annotationList[i].mediaElm.filter(':visible').length > 0) {
                    annotationList[i].wasMediaElmVisible = true;
                    annotationList[i].mediaElm.hide();
                  } else {
                    annotationList[i].wasMediaElmVisible = false;
                  }
                }
              }
            }
          }
          doStageRedraw = true;
        }
        if (doStageRedraw)
          annotationLayer.draw();
      }
    };
    this.updateAnnotationPositions = _updateAnnotationPositions;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    var hideLastAnnotationItemBorder = function() {
      var $annotationItems = $("#" + annotatorDivId + " .annotation_list > .ui-selectee");
      var numItems = $annotationItems.size();
      // Hide the right border
      var $annotationItems_hide = $annotationItems.eq(numItems - 1);
      if (Math.round($annotationItems_hide.position().left + $annotationItems_hide.width()) >= $("#" + annotatorDivId + " .annotation_container").width()) {
        $annotationItems_hide.css("border-right", "solid 0px black");
        // Unhide the right border
        var $annotationItems_show = $annotationItems.eq(numItems - 2);
        if ($annotationItems_show)
          $annotationItems_show.css("border-right", "solid 1px black");
      }
    };

    function createAnnotation(id, xPos, yPos, minZoom, startTime, endTime, kineticObj, type) {
      return {
        id: id,
        xPos: xPos,
        yPos: yPos,
        minZoom: minZoom,
        startTime: startTime,
        endTime: endTime,
        kineticObj: kineticObj,
        type: type
      };
    }

    function getAnnotationByListId(annotationListId) {
      var annotation = null;
      for (var i = 0; i < annotationList.length; i++) {
        if (annotationListId == annotationList[i]['id']) {
          annotation = annotationList[i];
          break;
        }
      }
      return annotation;
    }

    function handleAnnotationSelectionChange(willWarpAndSeek) {
      var selectedItems = $(" .annotation_list > .ui-selected");
      var numSelected = selectedItems.size();
      if (numSelected == 1) {
        if (selectedItems.get(0).triggerWarpAndSeek == false) {
          // Reset the flag
          selectedItems.get(0).triggerWarpAndSeek = undefined;
          // Do not warp and seek
          return;
        }
        var annotationListId = selectedItems.get(0).id;
        var annotation = getAnnotationByListId(annotationListId);
        if (annotation && willWarpAndSeek != false) {
          timelapse.setNewView({
            center: {
              x: annotation.xPos,
              y: annotation.yPos
            },
            zoom: annotation.minZoom
          }, true);
          timelapse.seek(annotation.startTime);
        }
      }
    }

    function addAnnotation(id, xPos, yPos, minZoom, startTime, endTime, kineticObj, type) {
      var newAnnot = createAnnotation(id, xPos, yPos, minZoom, startTime, endTime, kineticObj, type);
      annotationList.push(newAnnot);
      var annotListItem = document.createElement("div");
      annotListItem.id = kineticObj.attrs.id + "_item";
      var $annotListItem = $(annotListItem);

      var content = '';
      content += '<div class="removeAnnotation ui-state-default ui-corner-all button" style="float:right; display:none"><span class="ui-icon ui-icon-circle-close" title="Remove annotation"></span></div>';
      content += '<table style="vertical-align:middle;">';
      content += '	<tr><td>Marker Src: </td><td><input type="text" id="' + annotListItem.id + "_marker_src" + '" size="23" value="' + $(kineticObj.getImage()).attr("src") + '"></td></tr>';
      content += '	<tr><td>Min Zoom: </td><td><input type="text" id="' + annotListItem.id + "_minZoom" + '" size="2" value="' + minZoom + '"></td></tr>';
      content += '	<tr><td>Start Time: </td><td><input type="text" id="' + annotListItem.id + "_startTime" + '" size="2" value="' + startTime + '"> ' + 'End Time: <input type="text" id="' + annotListItem.id + "_endTime" + '" size="2" value="' + endTime + '"></td></tr>';
      content += '	<tr><td>Type:</td><td><input type="radio" name="' + annotListItem.id + "_" + 'annotationType" value="audio"> Audio ' + '<input type="radio" name="' + annotListItem.id + "_" + 'annotationType" value="image"> Image ' + '<input type="radio" name="' + annotListItem.id + "_" + 'annotationType" value="video"> Video ' + '<input type="radio" name="' + annotListItem.id + "_" + 'annotationType" value="javascript"> JavaScript</td></tr>';
      content += '	<tr><td>Src: </td><td><input type="text" id="' + annotListItem.id + "_type_src" + '" size="37"></td></tr>';
      content += '	<tr style="display:none"><td valign="top">Code: </td><td><textarea id="' + annotListItem.id + "_javascript_code" + '" rows="8" cols="29"></textarea></td></tr>';
      content += '</table>';

      $annotListItem.html(content).addClass("annotation_list_item");
      $("#" + annotatorDivId + " .annotation_list").append(annotListItem);

      $("#" + annotListItem.id + " .ui-state-default").hover(function() {
        $(this).addClass('ui-state-hover');
      }, function() {
        $(this).removeClass('ui-state-hover');
      });

      $("#" + annotListItem.id + " .removeAnnotation").on('click', function() {
        removeAnnotation($(this).parent().get(0).id);
      });

      $("#" + annotListItem.id + "_marker_src").change(function() {
        var annotationListId = this.id.split("_marker_src")[0];
        var annotation = getAnnotationByListId(annotationListId);

        var annotationImg = new Image();

        annotationImg.onload = function() {
          annotation.kineticObj.setAttrs({
            width: annotationImg.width,
            height: annotationImg.height,
            offset: {
              x: annotationImg.width / 2,
              y: annotationImg.height / 2
            }
          });
          annotation.kineticObj.setImage(annotationImg);
        };

        annotationImg.src = this.value;
      });

      $("#" + annotListItem.id + " input[name='" + annotListItem.id + "_" + "annotationType']").change(function() {
        var annotationListId = $(this).parents("div").attr("id");
        var annotation = getAnnotationByListId(annotationListId);
        annotation.type = this.value;
        if (annotation.mediaElm) {
          annotation.mediaElm.remove();
          annotation.mediaElm = null;
        }

        var $mediaSrcElem = $("#" + annotListItem.id + "_type_src");
        var $javascriptCodeElem = $("#" + annotListItem.id + "_javascript_code");

        $mediaSrcElem.val("");
        $javascriptCodeElem.val("");
        annotation.type_src = "";

        if (this.value == "javascript") {
          $javascriptCodeElem.closest('tr').show();
          $mediaSrcElem.closest('tr').hide();
        } else {
          $javascriptCodeElem.closest('tr').hide();
          $mediaSrcElem.closest('tr').show();
        }
      });

      $("#" + annotListItem.id + "_type_src").change(function() {
        var annotationListId = this.id.split("_type_src")[0];
        var annotation = getAnnotationByListId(annotationListId);
        annotation.type_src = this.value;
      });

      $("#" + annotListItem.id + "_javascript_code").change(function() {
        var annotationListId = this.id.split("_javascript_code")[0];
        var annotation = getAnnotationByListId(annotationListId);
        annotation.type_src = this.value;
      });

      $("#" + annotListItem.id + "_minZoom").keyup(function() {
        if (org.gigapan.Util.isNumber($(this).val())) {
          var annotationListId = this.id.split("_minZoom")[0];
          var annotation = getAnnotationByListId(annotationListId);
          annotation.minZoom = Math.min(0, parseFloat($(this).val()));
        }
      });

      $("#" + annotListItem.id + "_startTime").keyup(function() {
        if (org.gigapan.Util.isNumber($(this).val())) {
          var annotationListId = this.id.split("_startTime")[0];
          var annotation = getAnnotationByListId(annotationListId);
          annotation.startTime = parseFloat($(this).val());
        }
      });

      $("#" + annotListItem.id + "_endTime").keyup(function() {
        if (org.gigapan.Util.isNumber($(this).val())) {
          var annotationListId = this.id.split("_endTime")[0];
          var annotation = getAnnotationByListId(annotationListId);
          annotation.endTime = parseFloat($(this).val());
        }
      });

      $('input:radio[name="' + annotListItem.id + "_annotationType" + '"][value="' + type + '"]').prop('checked', true);

      // Override the color of keyframe items
      annotListItem.style.backgroundColor = "rgba(" + tagColorDefault[0] + "," + tagColorDefault[1] + "," + tagColorDefault[2] + ",0)";

      // Delect the item
      $annotListItem.get(0).triggerWarpAndSeek = false;
      UTIL.selectSelectableElements($("#" + annotatorDivId + " .annotation_list"), $annotListItem);
      // Hide the last annotation item's right border
      hideLastAnnotationItemBorder();
      timelapse.handleAnnotatorModeToolbarChange();
      // The reason to hide and show the elements is the workaround for a webkit refresh bug
      $("#" + annotatorDivId + " .annotation_container").hide().show(0);
    }

    var deleteSelectedAnnotations = function() {
      var selectedItems = $("#" + annotatorDivId + " .annotation_list > .ui-selected");
      var numSelected = selectedItems.size();

      if (numSelected > 0) {
        var selectedAnnotationElements = selectedItems.get();
        for (var i = 0; i < numSelected; i++) {
          var annotationElement = selectedAnnotationElements[i];
          var id = annotationElement['id'];
          removeAnnotation(id);
          // The reason to hide and show the elements is the workaround for a webkit refresh bug
          $("#" + annotatorDivId + " .annotation_container").hide().show(0);
        }
      }
    };
    this.deleteSelectedAnnotations = deleteSelectedAnnotations;

    function removeAnnotation(annotationListId) {
      for (var i = 0; i < annotationList.length; i++) {
        if (annotationListId == annotationList[i]['id']) {
          annotationList[i].kineticObj.destroy();
          $("#" + annotationListId).remove();
          if (annotationList[i].mediaElm) {
            annotationList[i].mediaElm.remove();
            annotationList[i].mediaElm = null;
          }
          annotationList.splice(i, 1);
          annotationLayer.draw();
          break;
        }
      }
    }

    var showLoadAnnotatorWindow = function() {
      $("#" + annotatorDivId + " .loadAnnotatorWindow").dialog("open");
      $("#" + annotatorDivId + " .loadAnnotatorWindow_JSON").val("");
    };
    this.showLoadAnnotatorWindow = showLoadAnnotatorWindow;

    var showSaveAnnotatorWindow = function() {
      $("#" + annotatorDivId + " .saveAnnotatorWindow").dialog("open");
      $("#" + annotatorDivId + " .saveAnnotatorWindow_JSON").val("");
      saveAnnotator();
    };
    this.showSaveAnnotatorWindow = showSaveAnnotatorWindow;

    function getAnnotationsAsJSON() {
      var annotatorJSON = {};
      annotatorJSON['annotator'] = {};
      annotatorJSON['annotator']['annotations'] = [];

      for (var i = 0; i < annotationList.length; i++) {
        var annotation = {};
        annotation["id"] = annotationList[i].id;
        var markSrc = $("#" + annotationList[i].id + "_marker_src").val();
        annotation["marker-src"] = markSrc ? markSrc : "";
        annotation["type"] = annotationList[i].type ? annotationList[i].type : "";
        annotation["type-src"] = annotationList[i].type_src ? annotationList[i].type_src : "";
        annotation["x-pos"] = parseFloat((annotationList[i].xPos).toFixed(3));
        annotation["y-pos"] = parseFloat((annotationList[i].yPos).toFixed(3));
        annotation["min-zoom"] = annotationList[i].minZoom;
        annotation["start-time"] = annotationList[i].startTime;
        annotation["end-time"] = annotationList[i].endTime;
        annotatorJSON['annotator']['annotations'].push(annotation);
      }
      return JSON.stringify(annotatorJSON, null, 3);
    }

    function saveAnnotator() {
      $("#" + annotatorDivId + " .saveAnnotatorWindow_JSON").val(getAnnotationsAsJSON()).focus().select().click(function() {
        $(this).focus().select();
      });
    }

    var clearAnnotations = function() {
      annotationCounter = 0;
      for (var i = 0; i < annotationList.length; i++) {
        annotationList[i].kineticObj.destroy();
        $("#" + annotationList[i].id).remove();
        if (annotationList[i].mediaElm) {
          annotationList[i].mediaElm.remove();
          annotationList[i].mediaElm = null;
        }
      }
      annotationLayer.draw();
      annotationList = [];
    };
    this.clearAnnotations = clearAnnotations;

    function loadAnnotationsFromJSON(json) {
      try {
        var obj = JSON.parse(json);

        if ( typeof obj['annotator'] != 'undefined' && typeof obj['annotator']['annotations'] != 'undefined') {
          UTIL.log("Found [" + obj['annotator']['annotations'].length + "] annotations in the json:\n\n" + json);
          for (var i = 0; i < obj['annotator']['annotations'].length; i++) {
            var annotation = obj['annotator']['annotations'][i];
            if ( typeof annotation['id'] != 'undefined' && typeof annotation['marker-src'] != 'undefined' && typeof annotation['type'] != 'undefined' && typeof annotation['type-src'] != 'undefined' && typeof annotation['x-pos'] != 'undefined' && typeof annotation['y-pos'] != 'undefined' && typeof annotation['min-zoom'] != 'undefined' && typeof annotation['start-time'] != 'undefined' && typeof annotation['end-time'] != 'undefined') {

              addAnnotationFromLoad(annotation['id'], annotation['x-pos'], annotation['y-pos'], annotation['marker-src'], annotation['type'], annotation['type-src'], annotation['min-zoom'], annotation['start-time'], annotation['end-time']);

            } else {
              UTIL.error("Ignoring invalid annotation during annotator load.");
            }
          }
        } else {
          UTIL.error("ERROR: Invalid annotation file.");
          return false;
        }
      } catch(e) {
        alert("ERROR: Invalid annotation file.");
        UTIL.error("Invalid annotator file.\n\n" + e.name + " while parsing annotator JSON: " + e.message, e);
        return false;
      }
      return true;
    }

    function addAnnotationFromLoad(id, xPos, yPos, markerSrc, type, typeSrc, minZoom, startTime, endTime) {
      var kineticImage = addKineticObj(xPos, yPos, markerSrc, true);
      addAnnotation(kineticImage.attrs.id + "_item", xPos, yPos, minZoom, startTime, endTime, kineticImage, type);
      annotationList[annotationList.length - 1].type_src = typeSrc;

      var $mediaSrcElem = $("#" + kineticImage.attrs.id + "_item_type_src");
      var $javascriptCodeElem = $("#" + kineticImage.attrs.id + "_item_javascript_code");

      if (type == "javascript") {
        $javascriptCodeElem.closest('tr').show();
        $javascriptCodeElem.val(typeSrc);
        $mediaSrcElem.closest('tr').hide();
      } else {
        $mediaSrcElem.val(typeSrc);
      }
    }

    function addKineticObj(xPos, yPos, markerSrc, fromLoad) {
      annotationCounter++;
      var kineticImage;
      var annotationImg = new Image();

      kineticImage = new Kinetic.Image({
        id: "annotation_" + annotationCounter,
        x: xPos,
        y: yPos,
        draggable: true,
        image: annotationImg
      });

      annotationImg.onload = function() {
        kineticImage.setImage(annotationImg);
        kineticImage.on("dragstart", function(e) {
          // Hackity-hack:
          // If we are not holding down the defined drag key when we begin dragging, then don't let the user
          // drag the marker. Would be nice to have a dragging event here, but apparently this is not possible
          // with kineticjs
          if (!e.altKey && !canMoveAnnotation)
            this.setDraggable(false);
        });

        kineticImage.on("dragend", function(e) {
          // Re-enable marker dragging. See hack message above.
          this.setDraggable(true);

          if (!e.altKey && !canMoveAnnotation)
            return;

          var annotation = getAnnotationByListId(this.attrs.id + "_item");
          var videoDivOffset = $("#" + viewerDivId + " .tiledContentHolder").offset();
          var timeMachinePos = timelapse.convertViewportToTimeMachine({
            x: e.pageX - videoDivOffset.left,
            y: e.pageY - videoDivOffset.top
          });
          annotation.xPos = timeMachinePos.x;
          annotation.yPos = timeMachinePos.y;
          this.setAttrs({
            x: annotation.xPos,
            y: annotation.yPos
          });

          _updateAnnotationPositions();
        });

        kineticImage.on('mouseover', function() {
          $(videoDiv).removeClass("openHand closedHand").css("cursor", "pointer");
        });

        kineticImage.on('mouseout', function() {
          $(videoDiv).css("cursor", "").addClass("openHand");
        });

        kineticImage.on('click', function(e) {
          if (e.metaKey || e.ctrlKey)
            return;

          var $annotationListItem = $("#" + this.attrs.id + "_item");

          // Hackity-hack: text field for the type src doesn't trigger the change event
          // when we click a marker, or anywhere on the viewport for that matter,
          // so we manually trigger the blur event, which triggers the change event.
          $("#" + $annotationListItem.get(0).id + "_type_src").blur();
          $("#" + $annotationListItem.get(0).id + "_javascript_code").blur();

          // Hackity-hack: needed if only one annotation is in place so that when we click it, the selectable
          // refresh event is actually fired.
          $annotationListItem.removeClass("ui-selected");
          $annotationListItem.get(0).willWarpAndSeek = false;
          UTIL.selectSelectableElements($("#" + annotatorDivId + " .annotation_list"), $annotationListItem);

          var annotation = getAnnotationByListId($annotationListItem.get(0).id);

          if (!annotation.type_src)
            return;

          if (annotation.type == "audio") {
            var audioTag = document.getElementById(annotation.id + "_audio");
            if (!audioTag) {
              audioTag = document.createElement('audio');
              annotation.mediaElm = $(audioTag);
              audioTag.id = annotation.id + "_audio";
              audioTag.src = annotation.type_src;
              document.body.appendChild(audioTag);
            } else {
              if (audioTag.src != annotation.type_src)
                audioTag.src = annotation.type_src;
            }

            if (audioTag.paused) {
              audioTag.play();
            } else {
              audioTag.pause();
              audioTag.currentTime = 0;
            }
          } else if (annotation.type == "image") {
            var imageTag = document.getElementById(annotation.id + "_image");
            var jqueryImageTag = $(imageTag);
            if (imageTag) {
              if (imageTag.src != annotation.type_src)
                imageTag.src = annotation.type_src;

              if (jqueryImageTag.filter(':visible').length > 0) {
                jqueryImageTag.fadeOut(300);
                annotation.wasMediaElmVisible = true;
              } else {
                jqueryImageTag.fadeIn(300);
                annotation.wasMediaElmVisible = false;
              }
            } else {
              imageTag = document.createElement('img');
              annotation.mediaElm = $(imageTag);
              imageTag.id = annotation.id + "_image";
              imageTag.src = annotation.type_src;
              imageTag.style.display = "none";
              $(imageTag).css({
                "max-width": "480px",
                "max-height": "320px"
              });
              imageTag.style.position = "absolute";
              imageTag.style.zIndex = "20";
              $("#" + viewerDivId).prepend($(imageTag).fadeIn(1000));
            }
            imageTag.style.top = this.attrs.y + "px";
            imageTag.style.left = this.attrs.x + "px";
          } else if (annotation.type == "video") {
            var videoTag = document.getElementById(annotation.id + "_video");
            var jqueryVideoTag = $(videoTag);
            if (videoTag) {
              if (videoTag.src != annotation.type_src)
                videoTag.src = annotation.type_src;
              if (jqueryVideoTag.filter(':visible').length > 0) {
                videoTag.pause();
                jqueryVideoTag.fadeOut(300);
                annotation.wasMediaElmVisible = true;
              } else {
                jqueryVideoTag.fadeIn(300);
                annotation.wasMediaElmVisible = false;
              }
            } else {
              videoTag = document.createElement('video');
              annotation.mediaElm = $(videoTag);
              videoTag.id = annotation.id + "_video";
              videoTag.src = annotation.type_src;
              videoTag.style.display = "none";
              videoTag.setAttribute('controls', true);
              $(videoTag).css({
                "max-width": "480px",
                "max-height": "320px"
              });
              videoTag.style.position = "absolute";
              videoTag.style.zIndex = "20";
              $("#" + viewerDivId).prepend($(videoTag).fadeIn(1000));
            }
            videoTag.style.top = this.attrs.y + "px";
            videoTag.style.left = this.attrs.x + "px";
          } else if (annotation.type == "javascript") {
            // TODO: Possible security hole
            eval(annotation.type_src);
          } else {
            UTIL.log("Annotation click event: No type selected");
          }
        });

        // Set the offset for the image to display it in center
        kineticImage.setAttrs({
          offset: {
            x: annotationImg.width / 2,
            y: annotationImg.height / 2
          }
        });

        annotationLayer.add(kineticImage);
        if (!fromLoad) {
          var timeMachinePosition = timelapse.convertViewportToTimeMachine({
            x: xPos,
            y: yPos
          });
          var currentTime = timelapse.getCurrentTime();
          addAnnotation(kineticImage.attrs.id + "_item", timeMachinePosition.x, timeMachinePosition.y, timelapse.getCurrentZoom(), Math.max(currentTime - 1, 0).toFixed(2), Math.min(currentTime + 1, timelapse.getDuration()).toFixed(2), kineticImage, null);
        }
        annotationLayer.draw();
      };

      annotationImg.src = (markerSrc) ? markerSrc : "images/map-pointer.png";
      return kineticImage;
    }

    function setupAnnotationLayer() {
      var viewportWidth = timelapse.getViewportWidth();
      var viewportHeight = timelapse.getViewportHeight();

      // Load window
      $("#" + annotatorDivId + " .loadAnnotatorWindow").dialog({
        resizable: false,
        autoOpen: false,
        width: 400,
        height: 700,
        create: function() {
          $(this).parents(".ui-dialog").css({
            'border': '1px solid #000'
          });
        }
      }).parent().appendTo($("#" + annotatorDivId));
      $("#" + annotatorDivId + " .loadAnnotatorButton").button({
        text: true
      }).click(function() {
        _loadAnnotations($("#" + annotatorDivId + " .loadAnnotatorWindow_JSON").val());
      });

      // Save window
      $("#" + annotatorDivId + " .saveAnnotatorWindow").dialog({
        resizable: false,
        autoOpen: false,
        width: 400,
        height: 700,
        create: function() {
          $(this).parents(".ui-dialog").css({
            'border': '1px solid #000'
          });
        }
      }).parent().appendTo($("#" + annotatorDivId));

      $("#" + annotatorDivId + " .annotation_list").selectable({
        selected: function(event, ui) {
          if ($(ui.selected).hasClass("annotation_list_item")) {
            // Get the original color
            var tagColor = ui.selected.style.backgroundColor;
            var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
            // Change the selected color
            $(ui.selected).css("background-color", "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",0.15)");
          }
        },
        selecting: function(event, ui) {
          if ($(ui.selecting).hasClass("annotation_list_item")) {
            // Get the original color
            var tagColor = ui.selecting.style.backgroundColor;
            var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
            // Change the selected color
            $(ui.selecting).css("background-color", "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",0.1)");
          }
        },
        unselected: function(event, ui) {
          // Get the original color
          var tagColor = ui.unselected.style.backgroundColor;
          var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
          // Restore the original color
          if ($(ui.unselected).hasClass("annotation_list_item"))
            $(ui.unselected).css("background-color", "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",0)");
        },
        unselecting: function(event, ui) {
          // Get the original color
          var tagColor = ui.unselecting.style.backgroundColor;
          var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
          // Restore the original color
          if ($(ui.unselecting).hasClass("annotation_list_item"))
            $(ui.unselecting).css("background-color", "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + ",0)");
        },
        stop: function(event) {
          var elem = $(event.target).children(".ui-selected").get(0);
          if (!elem) return;
          var willWarpAndSeek = elem.willWarpAndSeek;
          handleAnnotationSelectionChange(willWarpAndSeek);
          elem.willWarpAndSeek = undefined;
        },
        cancel: ':input,textarea,.button,label'
      });

      annotationStage = new Kinetic.Stage({
        container: dataPanesId,
        width: viewportWidth,
        height: viewportHeight
      });
      annotationLayer = new Kinetic.Layer();
      annotationStage.add(annotationLayer);
      var annotationStage_DOM = annotationStage.getContent();
      annotationStage_DOM.id = "annotationStage";
      var $tiledContentHolder = $("#" + viewerDivId + " .tiledContentHolder");
      var $playerOffset = $tiledContentHolder.offset();

      $("#" + viewerDivId + " #annotationStage").on("mousedown", function(e) {
        if (!e.metaKey && !e.ctrlKey && !canAddAnnotation)
          return;
        if (canAddAnnotation) {
          $("#" + viewerDivId + " .addAnnotationCheckbox").prop("checked", false).button("refresh").change();
        }
        addKineticObj(e.pageX - $playerOffset.left, e.pageY - $playerOffset.top);
      });

      $("#" + annotatorDivId).hide();

      var newTop = $("#" + viewerDivId + " .timelineSliderFiller").outerHeight() + $("#" + viewerDivId + " .controls").outerHeight() + $tiledContentHolder.outerHeight() + $playerOffset.top - 1;
      var newLeft = $playerOffset.left;
      var newWidth = $tiledContentHolder.outerWidth() - 2;
      $("#" + annotatorDivId + " .annotation_container").css("position", "absolute").css("top", newTop + "px").css("left", newLeft + "px").css("width", newWidth + "px");
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    org.gigapan.Util.ajax("html", "", "annotation_editor.html", function(html) {
      $annotatorDivObj.html(html);
      setupAnnotationLayer();
    });

  };
  //end of org.gigapan.timelapse.Annotator
})();
//end of (function() {
