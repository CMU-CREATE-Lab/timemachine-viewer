/*
 Class for managing annotations in a time machine

 Dependencies:
 * org.gigapan.timelapse.Timelapse
 * org.gigapan.timelapse.Videoset
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
if (!org.gigapan.timelapse.Videoset) {
  var noVideosetMsg = "The org.gigapan.timelapse.Videoset library is required by org.gigapan.timelapse.Annotator";
  alert(noVideosetMsg);
  throw new Error(noVideosetMsg);
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
    var thisObj = this;
    var $annotatorDivObj = $("#"+annotatorDivId);
    var videoDiv = document.getElementById(timelapse.getVideoDivId());
    var viewerDivId = timelapse.getViewerDivId();
    var videoset = timelapse.getVideoset();
    var annotationCounter = 0;
    var annotationStage;
    var annotationLayer;
    var annotationList = [];
    var wasDragEnd = false;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
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
      //TODO: optimize?
      var doStageRedraw = false;
      if (annotationStage) {
        for (var i = 0; i < annotationList.length; i++) {
          var annotationObj = annotationList[i].kineticObj;
          var videoStretchRatio = timelapse.getVideoStretchRatio();
          annotationObj.setAttrs(timelapse.convertTimeMachineToViewport({x:annotationList[i].xPos*videoStretchRatio, y:annotationList[i].yPos*videoStretchRatio}));

          if (annotationList[i].type == "video" || annotationList[i].type == "image") {
            $("#"+annotationList[i].id + "_" + annotationList[i].type).css({left:annotationObj.attrs.x,top:annotationObj.attrs.y});
          }

          var currentTime = videoset.getCurrentTime();
          var annotationMedia;
          if (timelapse.getCurrentZoom() >= annotationList[i].minZoom && (annotationList[i].startTime <= currentTime && annotationList[i].endTime >= currentTime)) {
            if (!annotationObj.attrs.visible) {
              annotationObj.show();
              if (annotationList[i].wasMediaElmVisible) annotationList[i].mediaElm.show();
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
        if (doStageRedraw) annotationLayer.draw();
      }
    };
    this.updateAnnotationPositions = _updateAnnotationPositions;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    function createAnnotation (id, xPos, yPos, minZoom, startTime, endTime, kineticObj, type) {
      return {id: id,
              xPos: xPos,
              yPos: yPos,
              minZoom: minZoom,
              startTime: startTime,
              endTime: endTime,
              kineticObj: kineticObj,
              type: type};
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

    function handleAnnotationSelectionChange() {
      var selectedItems = $(" .annotation_list > .ui-selected");
      var numSelected = selectedItems.size();
      if (numSelected == 1) {
        var annotationListId = selectedItems.get(0).id;
        var annotation = getAnnotationByListId(annotationListId);
        var videoStretchRatio = timelapse.getVideoStretchRatio();
        if (annotation) timelapse.setNewView({center:{x:annotation.xPos*videoStretchRatio,y:annotation.yPos*videoStretchRatio},zoom:annotation.minZoom},true);
      }
    }

    function clearAnnotationSelection() {
      var annotations = $(" .annotation_list > div");
      for (var i = 0; i < annotations.size(); i++) {
        $(annotations[i]).removeClass().addClass("annotation_list_item");
      }
    }

    function addAnnotation(id, xPos, yPos, minZoom, startTime, endTime, kineticObj, type) {
      $(".saveAnnotatorButton, .clearAnnotatorButton").addClass("ui-state-default").removeClass("ui-state-active ui-state-disabled").prop('disabled', false);

      var newAnnot = createAnnotation(id, xPos, yPos, minZoom, startTime, endTime, kineticObj, type);
      annotationList.push(newAnnot);
      var annotListItem = document.createElement("div");
      annotListItem.id = kineticObj.attrs.id+"_item";
      var $annotListItem = $(annotListItem);

      var content = '<div class="removeAnnotation ui-state-default ui-corner-all button" style="float:right; display:none"><span class="ui-icon ui-icon-circle-close" title="Remove annotation"></span></div>' +
                    '<table>' +
                    '<tr><td>Marker Src: </td><td><input type="text" id="'+annotListItem.id+"_marker_src"+'" size="23" value="'+$(kineticObj.getImage()).attr("src")+'"></td></tr>' +
                    '<tr><td>Type:</td><td><input type="radio" name="'+annotListItem.id+"_"+'annotationType" value="audio"> Audio ' +
                    '<input type="radio" name="'+annotListItem.id+"_"+'annotationType" value="image"> Image ' +
                    '<input type="radio" name="'+annotListItem.id+"_"+'annotationType" value="video"> Video ' +
                    '<input type="radio" name="'+annotListItem.id+"_"+'annotationType" value="javascript"> JavaScript</td></tr>' +
                    '<tr><td>Src: </td><td><input type="text" id="'+annotListItem.id+"_type_src"+'" size="37"></td></tr>' +
                    '<tr style="display:none"><td valign="top">Code: </td><td><textarea id="'+annotListItem.id+"_javascript_code"+'" rows="8" cols="29"></textarea></td></tr>' +
                    '<tr><td>Min Zoom: </td><td><input type="text" id="'+annotListItem.id+"_minZoom"+'" size="2" value="'+minZoom+'"></td></tr>' +
                    '<tr><td>Start Time: </td><td><input type="text" id="'+annotListItem.id+"_startTime"+'" size="2" value="'+startTime+'"> ' +
                    'End Time: <input type="text" id="'+annotListItem.id+"_endTime"+'" size="2" value="'+endTime+'"></td></tr>' +
                    '</table>';

      clearAnnotationSelection();
      $annotListItem.html(content).addClass("annotation_list_item ui-selected");
      $(".annotation_list").append(annotListItem);

      $annotListItem.on('mouseover', function() {
        $(this).find(".removeAnnotation").show();
      });

      $annotListItem.on('mouseout', function() {
        $(this).find(".removeAnnotation").hide();
      });

      $("#" + annotListItem.id + " .ui-state-default").hover(
        function(){ $(this).addClass('ui-state-hover'); },
        function(){ $(this).removeClass('ui-state-hover'); }
      );

      $("#" + annotListItem.id + " .removeAnnotation").on('click', function() {
        removeAnnotation($(this).parent().get(0).id);
      });

      $("#" + annotListItem.id + "_marker_src").change(function() {
        var annotationListId = this.id.split("_marker_src")[0];
        var annotation = getAnnotationByListId(annotationListId);

        var annotationImg = new Image();

        annotationImg.onload = function() {
          annotation.kineticObj.setAttrs({width:annotationImg.width,height:annotationImg.height,offset:{x: annotationImg.width/2, y: annotationImg.height/2}});
          annotation.kineticObj.setImage(annotationImg);
        };

        annotationImg.src = this.value;
      });

      $("#" + annotListItem.id + " input[name='"+annotListItem.id+"_"+"annotationType']").change(function() {
        var annotationListId = $(this).parents("div").attr("id");
        var annotation = getAnnotationByListId(annotationListId);
        annotation.type = this.value;
        if (annotation.mediaElm) {
          annotation.mediaElm.remove();
          annotation.mediaElm = null;
        }

        $("#" + annotListItem.id + "_type_src").val("");
        $("#" + annotListItem.id + "_javascript_code").val("");
        annotation.type_src = "";

        if (this.value == "javascript") {
          $("#" + annotListItem.id + "_javascript_code").closest('tr').show();
          $("#" + annotListItem.id + "_type_src").closest('tr').hide();
        } else {
          $("#" + annotListItem.id + "_type_src").closest('tr').show();
          $("#" + annotListItem.id + "_javascript_code").closest('tr').hide();
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
          annotation.minZoom = Math.min(0,parseFloat($(this).val()));
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

      $('input:radio[name="'+annotListItem.id+"_annotationType"+'"][value="'+type+'"]').prop('checked', true);
    }

    function removeAnnotation(annotationListId) {
      for (var i = 0; i < annotationList.length; i++) {
        if (annotationListId == annotationList[i]['id']) {
          annotationList[i].kineticObj.destroy();
          $("#"+annotationListId).remove();
          if (annotationList[i].mediaElm) {
            annotationList[i].mediaElm.remove();
            annotationList[i].mediaElm = null;
          }
          annotationList.splice(i,1);
          annotationLayer.draw();
          break;
        }
      }

      if (annotationList.length == 0) {
        $(".saveAnnotatorButton, .clearAnnotatorButton").removeClass("ui-state-default").addClass("ui-state-active ui-state-disabled").prop('disabled', true);
      }
    }

    var showLoadAnnotatorWindow = function() {
      $("#" + annotatorDivId + " .loadAnnotatorWindow").dialog("open");
      $("#" + annotatorDivId + " .loadAnnotatorWindow_JSON").val("");
    };

    var showSaveAnnotatorWindow = function() {
      $("#" + annotatorDivId + " .saveAnnotatorWindow").dialog("open");
      $("#" + annotatorDivId + " .saveAnnotatorWindow_JSON").val("");
      saveAnnotator();
    };

    function getAnnotationsAsJSON() {
      var annotatorJSON = {};
      annotatorJSON['annotator'] = {};
      annotatorJSON['annotator']['annotations'] = [];

      for (var i = 0; i < annotationList.length; i++) {
        var annotation = {};
        annotation["id"] = annotationList[i].id;
        var markSrc = $("#"+annotationList[i].id+"_marker_src").val();
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
      $("#" + annotatorDivId + " .saveAnnotatorWindow_JSON").val(getAnnotationsAsJSON()).focus().select().click(function() { $(this).focus().select(); });
    }

    function clearAnnotations() {
      annotationCounter = 0;
      for (var i = 0; i < annotationList.length; i++) {
        annotationList[i].kineticObj.destroy();
        $("#"+annotationList[i].id).remove();
        if (annotationList[i].mediaElm) {
          annotationList[i].mediaElm.remove();
          annotationList[i].mediaElm = null;
        }
      }
      annotationLayer.draw();
      annotationList = [];

      if (annotationList.length == 0) {
        $(".saveAnnotatorButton, .clearAnnotatorButton").removeClass("ui-state-default").addClass("ui-state-active ui-state-disabled").prop('disabled', true);
      }
    }

    function loadAnnotationsFromJSON(json) {
      try {
        var obj = JSON.parse(json);

        if (typeof obj['annotator'] != 'undefined' && typeof obj['annotator']['annotations'] != 'undefined') {
          UTIL.log("Found [" + obj['annotator']['annotations'].length + "] annotations in the json:\n\n" + json);
          for (var i = 0; i < obj['annotator']['annotations'].length; i++) {
            var annotation = obj['annotator']['annotations'][i];
            if (typeof annotation['id'] != 'undefined' &&
                typeof annotation['marker-src'] != 'undefined' &&
                typeof annotation['type'] != 'undefined' &&
                typeof annotation['type-src'] != 'undefined' &&
                typeof annotation['x-pos'] != 'undefined' &&
                typeof annotation['y-pos'] != 'undefined' &&
                typeof annotation['min-zoom'] != 'undefined' &&
                typeof annotation['start-time'] != 'undefined' &&
                typeof annotation['end-time'] != 'undefined') {

              addAnnotationFromLoad(annotation['id'], annotation['x-pos'], annotation['y-pos'], annotation['marker-src'], annotation['type'],annotation['type-src'],annotation['min-zoom'], annotation['start-time'],annotation['end-time']);

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

    function addAnnotationFromLoad(id,xPos,yPos,markerSrc,type,typeSrc,minZoom,startTime,endTime) {
      var kineticImage = addKineticObj(xPos,yPos,markerSrc,true);
      addAnnotation(kineticImage.attrs.id+"_item", xPos, yPos, minZoom, startTime, endTime, kineticImage, type);
      annotationList[annotationList.length-1].type_src = typeSrc;

      if (type == "javascript") {
        $("#" + kineticImage.attrs.id + "_item_javascript_code").closest('tr').show();
        $("#" + kineticImage.attrs.id + "_item_type_src").closest('tr').hide();
        $("#"+kineticImage.attrs.id+"_item_javascript_code").val(typeSrc);
      } else {
        $("#"+kineticImage.attrs.id+"_item_type_src").val(typeSrc);
      }
    }

    function selectSelectableElement(selectableContainer, elementsToSelect) {
      // add unselecting class to all elements in the styleboard canvas except the ones to select
      $(".ui-selected", selectableContainer).not(elementsToSelect).removeClass("ui-selected").addClass("ui-unselecting");

      // add ui-selecting class to the elements to select
      $(elementsToSelect).not(".ui-selected").addClass("ui-selecting");

      // refresh the selection or the next call will result in an undefined error
      selectableContainer.selectable('refresh');

      // trigger the mouse stop event (this will select all .ui-selecting elements, and deselect all .ui-unselecting elements)
      selectableContainer.data("ui-selectable")._mouseStop(null);
    }

    function addKineticObj(xPos,yPos,markerSrc,fromLoad) {
        annotationCounter++;
        var kineticImage;
        var annotationImg = new Image();

        kineticImage = new Kinetic.Image({
          id: "annotation_"+annotationCounter,
          x: xPos,
          y: yPos,
          draggable: true,
          image: annotationImg
        });

        annotationImg.onload = function() {
          kineticImage.setImage(annotationImg);
          kineticImage.on("dragstart", function(e){
            // Hackity-hack:
            // If we are not holding down the defined drag key when we begin dragging, then don't let the user
            // drag the marker. Would be nice to have a dragging event here, but apparently this is not possible
            // with kineticjs
            if (!e.altKey) this.setDraggable(false);
          });

          kineticImage.on("dragend", function(e){
            this.setDraggable(true); // Re-enable marker dragging. See hack message above.

            if (!e.altKey) return;

            var annotation = getAnnotationByListId(this.attrs.id+"_item");
            var videoStretchRatio = timelapse.getVideoStretchRatio();
            var timeMachinePos = timelapse.convertViewportToTimeMachine({x:e.pageX, y:e.pageY});
            annotation.xPos = timeMachinePos.x/videoStretchRatio;
            annotation.yPos = timeMachinePos.y/videoStretchRatio;
            this.setAttrs({x:annotation.xPos, y:annotation.yPos});

            // Hackity-hack... kineticjs draggable workaround
            _updateAnnotationPositions();
            wasDragEnd = true;
          });

          kineticImage.on('mouseover', function() {
            videoDiv.style.cursor = "pointer";
          });

          kineticImage.on('mouseout', function() {
            videoDiv.style.cursor = 'url("css/cursors/openhand.png") 10 10, move';
          });

          kineticImage.on('click', function(e) {
            if (e.shiftKey) return;

            // Hackity-hack... kineticjs draggable workaround
            // Click event is fired after the dragend and we don't want this
            // Will be fixed in kineticjs 4.3.4
            // https://github.com/ericdrowell/KineticJS/issues/274#issuecomment-14029926
            if (wasDragEnd) {
              wasDragEnd = false;
              return;
            }

            var annotationListItem = $("#"+this.attrs.id+"_item");

            // Hackity-hack: text field for the type src doesn't trigger the change event
            // when we click a marker, or anywhere on the viewport for that matter,
            // so we manually trigger the blur event, which triggers the change event.
            $("#" + annotationListItem.get(0).id + "_type_src").blur();
            $("#" + annotationListItem.get(0).id + "_javascript_code").blur();

            if (e.altKey) {
              // Hackity-hack: needed if only one annotation is in place so that when we click it, the selectable
              // refresh event is actually fired.
              $(annotationListItem).removeClass("ui-selected");
              selectSelectableElement($(".annotation_list"), annotationListItem);
              return;
            }

            var annotation = getAnnotationByListId(annotationListItem.get(0).id);

            if (!annotation.type_src) return;

            if (annotation.type == "audio") {
              var audioTag = document.getElementById(annotation.id+"_audio");
              if (!audioTag) {
                audioTag = document.createElement('audio');
                annotation.mediaElm = $(audioTag);
                audioTag.id = annotation.id+"_audio";
                audioTag.src = annotation.type_src;
                document.body.appendChild(audioTag);
              } else {
                if (audioTag.src != annotation.type_src) audioTag.src = annotation.type_src;
              }

              if (audioTag.paused) {
                audioTag.play();
              } else {
                audioTag.pause();
                audioTag.currentTime = 0;
              }
            } else if (annotation.type == "image") {
              var imageTag = document.getElementById(annotation.id+"_image");
              var jqueryImageTag = $(imageTag);
              if (imageTag) {
                if (imageTag.src != annotation.type_src) imageTag.src = annotation.type_src;

                if (jqueryImageTag.filter(':visible').length > 0) {
                  jqueryImageTag.hide();
                  annotation.wasMediaElmVisible = true;
                } else {
                  jqueryImageTag.show();
                  annotation.wasMediaElmVisible = false;
                }
              } else {
                imageTag = document.createElement('img');
                annotation.mediaElm = $(imageTag);
                imageTag.id = annotation.id+"_image";
                imageTag.src = annotation.type_src;
                $(imageTag).css({"max-width":"480px","max-height":"320px"});
                imageTag.style.position = "absolute";
                imageTag.style.zIndex = "10";
                $("#"+viewerDivId).prepend(imageTag);
              }
              imageTag.style.top = this.attrs.y + "px";
              imageTag.style.left = this.attrs.x + "px";
            } else if (annotation.type == "video") {
              var videoTag = document.getElementById(annotation.id+"_video");
              var jqueryVideoTag = $(videoTag);
              if (videoTag) {
                if (videoTag.src != annotation.type_src) videoTag.src = annotation.type_src;

                if (jqueryVideoTag.filter(':visible').length > 0) {
                  videoTag.pause();
                  jqueryVideoTag.hide();
                  annotation.wasMediaElmVisible = true;
                } else {
                 jqueryVideoTag.show();
                 annotation.wasMediaElmVisible = false;
                }
              } else {
                videoTag = document.createElement('video');
                annotation.mediaElm = $(videoTag);
                videoTag.id = annotation.id+"_video";
                videoTag.src = annotation.type_src;
                videoTag.setAttribute('controls', true);
                $(videoTag).css({"max-width":"480px","max-height":"320px"});
                videoTag.style.position = "absolute";
                videoTag.style.zIndex = "10";
                $("#"+viewerDivId).prepend(videoTag);
              }
              videoTag.style.top = this.attrs.y + "px";
              videoTag.style.left = this.attrs.x + "px";
            } else if (annotation.type == "javascript") {
              // TODO: OMG, possible security hole
              eval(annotation.type_src);
            } else {
              UTIL.log("Annotation click event: No type selected");
            }
          });

          // Set the offset for the image to display it in center
          kineticImage.setAttrs({offset:{x: annotationImg.width/2 , y: annotationImg.height/2}});

          annotationLayer.add(kineticImage);
          if (!fromLoad) {
            var timeMachinePosition = timelapse.convertViewportToTimeMachine({x:xPos, y:yPos});
            var currentTime = videoset.getCurrentTime();
            var videoStretchRatio = timelapse.getVideoStretchRatio();
            addAnnotation(kineticImage.attrs.id+"_item", timeMachinePosition.x/videoStretchRatio, timeMachinePosition.y/videoStretchRatio, timelapse.getCurrentZoom(), Math.max(currentTime - 1,0).toFixed(2), Math.min(currentTime + 1,timelapse.getDuration()).toFixed(2), kineticImage, null);
          }
          annotationLayer.draw();
        };

        annotationImg.src = (markerSrc) ? markerSrc : "images/map-pointer.png";
        return kineticImage;
    }

    function setupAnnotationLayer() {
      var viewportWidth = timelapse.getViewportWidth();
      var viewportHeight = timelapse.getViewportHeight();

      $(".saveAnnotatorButton, .clearAnnotatorButton").prop('disabled', true);

      $("#" + annotatorDivId + " .clearAnnotatorButton").on("click", function(e){
        if (confirm("Remove all annotations?")) clearAnnotations();
      });

      $("#" + annotatorDivId + " .loadAnnotationWindow").on("click", function(e){
        showLoadAnnotatorWindow();
      });

      $("#" + annotatorDivId + " .saveAnnotatorButton").on("click", function(e){
        showSaveAnnotatorWindow();
      });

      // Load window
      $("#" + annotatorDivId + " .loadAnnotatorWindow").dialog({
        resizable : false,
        autoOpen : false,
        width : 400,
        height : 700,
        create : function(event, ui) {
          $(this).parents(".ui-dialog").css({
            'border' : '1px solid #000'
          });
        }
      }).parent().appendTo($("#" + annotatorDivId));
      $("#" + annotatorDivId + " .loadAnnotatorButton").button({
        text : true
      }).click(function() {
        _loadAnnotations($("#" + annotatorDivId + " .loadAnnotatorWindow_JSON").val());
      });

      // Save window
      $("#" + annotatorDivId + " .saveAnnotatorWindow").dialog({
        resizable : false,
        autoOpen : false,
        width : 400,
        height : 700,
        create : function(event, ui) {
          $(this).parents(".ui-dialog").css({
            'border' : '1px solid #000'
          });
        }
      }).parent().appendTo($("#" + annotatorDivId));

      $("#" + annotatorDivId + " .annotation_list").selectable({
        selected: function() {
          handleAnnotationSelectionChange();
        },
        cancel: ':input,textarea,.button,label'
      });

      annotationStage = new Kinetic.Stage({
          container: timelapse.getVideoDivId(),
          width: viewportWidth,
          height: viewportHeight
      });

      annotationLayer = new Kinetic.Layer();
      annotationStage.add(annotationLayer);

      $("#" + timelapse.getViewerDivId()).on("mousedown", function(e) {
        if (!e.shiftKey) return;
        addKineticObj(e.pageX,e.pageY);
      });

      // Hackity-hack: manually move the kineticjs canvas to be before the video canvas layer
      // TODO: Change this behavior
      $(".kineticjs-content").prependTo("#player1_timelapse").css("position","absolute");
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor code
    //
    org.gigapan.Util.ajax("html","annotation_editor.html",function(html){
      $annotatorDivObj.html(html);
      setupAnnotationLayer();
    });

	};
  //end of org.gigapan.timelapse.Annotator
})();
//end of (function() {