// easyAnnotate JavaScript.

// define a 'constant' so we can easily select video, no matter what we choose to call it in final HTML implementation...
var VIDEO_SELECTOR = 'video';
var VIDEO_CONTAINER = 'div#vid-overlay';
// and a 'constant' to select our add button...
var ADD_BUTTON_SELECTOR = 'a#addAnnotation';
var REMOVE_BUTTON_SELECTOR = 'a.removeAnnotation';

var PLAY_PAUSE_SELECTOR = 'button#playPauseButton';
var PROGRESS_BAR_SELECTOR = 'progress#progress';

var INFORMATION_TEXT_SELECTOR = "div#informationalText";

//canvas variables
var canvas = document.getElementById('vid-canvas');
var ctx = canvas.getContext('2d');
var rect = {};
var dragging = false;
var canDraw = false;

//  global variables
//  number of whole seconds that the video's been playing for.
var currentTime = 0;
//  an array that holds annotation objects.
var annotationsArray = [];

//  annotation object prototype.
function annotation(text, imageUrl, xPosition, yPosition, width, height, startTime, endTime) {
    this.textString = text;
    this.imageUrl = imageUrl;
    this.xPosition = xPosition;
    this.yPosition = yPosition;
    this.aWidth = width;
    this.aHeight = height;
    this.startTime = startTime;
    this.endTime = endTime;
}

//create an md5 hash consisting of the annotation's start time, end time, x, y, and text....
function uniqueIdForAnnotation(a){
  //concatenate our huge string of annotation stuff...
  var stringToMakeUnique = (String(a.startTime)) + (String(a.endTime)) + (String(a.xPosition))  + (String(a.yPosition)) + (a.text);

  //make a hash using the crypto-js MD5 library
  var hash = CryptoJS.MD5(stringToMakeUnique);

  //make sure it's in string form, then return it
  return hash.toString();
}

function testAnnotation(name){
  var newAnnotation = new annotation(name, null, 30, 30, 30, 30, 3, 5);
  annotationsArray.push(newAnnotation);
  console.log(annotationsArray);

}

function addAnnotationToScreen(a){
  //get a unique id first...
  var id = uniqueIdForAnnotation(a);

  //create our annotation html...
  var annotationHtmlElement = '<div class="annotation-on-screen" id="' + id + '"></div>';

  //work out the current annotation's selector so we can select and set attributes in jQuery
  var annotationSelector = 'div#' + id;

  //add it to the DOM so we can begin to add style etc...
  $(VIDEO_CONTAINER).append(annotationHtmlElement);

  console.log('attempting to add:' + annotationHtmlElement);

  //set height and width, and a high z-index so it shows over the video.
  $(annotationSelector).css({"width": a.aWidth, "height": a.aHeight, "position": "relative", "top": a.yPosition, "left": a.xPosition});

  var annotationString = a.textString;

  console.log('annotation title: ' + annotationString);

  if (annotationString == null){
    annotationString = "";
  }

  $(annotationSelector).text(annotationString);

  //if there's an image, add it...
  if (a.imageUrl != null){
    //create an image tag...
    var imageElement = '<img src="' + a.imageUrl +  '"/>';

    //add blank image into the annotation...
    $(annotationSelector).append(imageElement);

    var imageSelector = annotationSelector + ' img';

    //do a 'lil styling
    $(imageSelector).css({"width": "100%", "height": "auto"});

  }

}

function removeAnnotationFromScreen(a){
  //get a unique id first...
  var id = uniqueIdForAnnotation(a);

  //work out the current annotation's selector so we can select and remove it from screen
  var annotationSelector = 'div#' + id;

  //remove...
  $(annotationSelector).remove();
}

//  the update method, to be called every time the running time of the video changes by a whole second
function update(){
  console.log('update called.');
  // we want annotations that have a start time greater than or equal to the current playback time,
  // but also an end time less than the current time.

  // some funky jquery to search through the array.
  var currentAnnotations = $.grep(annotationsArray, function(e) {
    return (currentTime >= e.startTime  && currentTime < e.endTime);
  });

  // these things might also be useful to know I guess...

  // get annotations that need to be added (i.e. have a start time of the current second)
  var newAnnotations = $.grep(annotationsArray, function(e) {
    return (currentTime == e.startTime);
  });

  if (newAnnotations != null){
    if (newAnnotations.length > 0){
      //there's animations to load!
      console.log('have new annotations to load');

      for (var i = 0; i < newAnnotations.length; i++){
        //make a new annotation div, set it's id tag to the unique ID for this particular annotation
        //add all of the releveant attributes from the annotation, then add it to the video player...
        console.log('need to add something.');
        var newAnnotation = newAnnotations[i];
        console.log(newAnnotation);
        addAnnotationToScreen(newAnnotation);
      }
    }
  }

  // and get annotations that need to be removed (i.e. have an end time of the current second)
  var oldAnnotations = $.grep(annotationsArray, function(e) {
    return (currentTime == e.endTime);
  })

  if (oldAnnotations != null){
    if (oldAnnotations.length > 0){
      //there's animations to remove!
      console.log('have old annotations to remove');

      for (var i = 0; i < oldAnnotations.length; i++){
        //work out its unique ID, then remove it from the document (taking it off screen)
        console.log('need to remove something.');
        removeAnnotationFromScreen(oldAnnotations[i]);

      }

    }
  }


  console.log(currentAnnotations);
}

// perform some basic setup tasks such as loading in the existing array of annotations from local storage...
function setUp(){
  //data-easyannotation-file-id is the attribute that holds our local storage file id, get it...
  var localStorageId = $(VIDEO_SELECTOR).data('easyannotation-file-id');

  //check there's actually something to load in first...
  if (localStorage.getItem(localStorageId)){
    //go ahead and load...
    //load in from local storage...
    var localData = JSON.parse(localStorage.getItem(localStorageId));

    //if the array is null, then set our array of annotations to a blank array (so we're not having null pointer issues)
    //otherwise, set it to the parsed array we've retrived from local storage (stored in localData currently...)
    if (localData == null){
      // there's no saved data to load in, use a blank array...
      annotationsArray = [];
    } else {
      // there's actually data to load in :o
      // let's load it...
      annotationsArray = localData;
    }
  } else {
    //no saved data :'(
    //let's make annotationsArray a blank array object then...
    annotationsArray = [];
  }

  // Daniel's madness :O
  // Remove the default browser controls
  $(VIDEO_SELECTOR).controls = false;

  //sort the array so earlier annotations come first...
  annotationsArray.sort(function(a, b) {
    return a.startTime - b.startTime;
  });

  //populate the annotations list...
  populateAnnotationsList();

  initCanvas();

}

// a convenience save function... we'll wanna call this after every edit, etc.
function saveAnnotations(){
  //firstly, let's convert the array to a JSON string...
  var jsonArray = JSON.stringify(annotationsArray);

  //now, get the relevant local storage ID from the html data attribute...
  var localStorageId = $(VIDEO_SELECTOR).data('easyannotation-file-id');

  //save the converted data into the local storage of the browser, with the proper ID...
  localStorage.setItem(localStorageId, jsonArray);

}

//clear the contents of existing local storage items (probably just for testing purposes but you never know...)
function clearStoredAnnotations(){
  //clear all local storage items associated with this page.
  window.localStorage.clear();

  //also, clear the current annotations array, setting it to a blank array object.
  annotationsArray = [];

  //confirm on the console, since this'll probably be used for debugging/testing
  console.log('Local storage cleared.');

}

function addAnnotationClicked(){
  //allow drawing to start and bring up an info dialog...
  canDraw = true;

  //tell the user...
  $(INFORMATION_TEXT_SELECTOR).text("Begin drawing over the video...");
}

function newAnnotationDrawingComplete(){
  //clear the canvas...
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //the user isn't allowed to draw anymore...
  canDraw = false;

  //reset informational text...
  $(INFORMATION_TEXT_SELECTOR).text("");

  console.log('Starting to add annotation...');
  //okay, first pause the video...
  $(VIDEO_SELECTOR).trigger('pause');

  //basic basic basic.
  var title = prompt("Please enter your annotation text:", "");
  //asks how long the annotation should run for
  var time = prompt("Please enter how long you want the annotation to stay on screen:", "");
  //literally at fkn pumpkin spice levels.
  //if the time entered isn't an integer set the time to 2 seconds
  if ( time == null || isNaN(time)) {
    time = "2";
  }

  //get x and y and width + height that has been drawn previously by the user...
  var drawnX = rect.startX;
  var drawnY = rect.startY;
  var drawnWidth = rect.w;
  var drawnHeight = rect.h;

  //do some minimum checking, we don't want the drawn rect to be too ridiculously small so an annotation can't physically fit...
  if (drawnWidth < 20){
    drawnWidth = 20;
  }

  if (drawnWidth < 40){
    drawnWidth = 40;
  }

  if (title != null) {
    var newAnnotation = new annotation(title, null, drawnX, drawnY, drawnWidth, drawnHeight, currentTime, (currentTime + parseInt(time)));
    annotationsArray.push(newAnnotation);

    //let's save too!
    saveAnnotations();

    //and re-populate the list...
    populateAnnotationsList();

  }
}

// **Control Stuff**

function playPauseClicked() {
    if(document.getElementById('videoPlayer').paused || document.getElementById('videoPlayer').ended) {
        document.getElementById('videoPlayer').play();
        $(PLAY_PAUSE_SELECTOR).text("Pause");
    }
    else {
        document.getElementById('videoPlayer').pause();
        $(PLAY_PAUSE_SELECTOR).text("Play");

    }
}

function formatSecondsToString(numberOfSeconds){
  if(numberOfSeconds < 10){
    //if it's under 10 seconds, just return it...
    return "0:0" + String(numberOfSeconds);
  }


  if(numberOfSeconds < 60){
    //if it's under a minute, just return it...
    return "0:" + String(numberOfSeconds);
  }

  var wholeMinutes = Math.floor(numberOfSeconds / 60);
  var secondsRemaining = numberOfSeconds - (wholeMinutes * 60);

  return String(wholeMinutes) + ":" + String(secondsRemaining);

}

function updateProgressBar() {
    var bar = $(PROGRESS_BAR_SELECTOR);
    var percent = Math.floor( (100/document.getElementById('videoPlayer').duration) * (document.getElementById('videoPlayer').currentTime) );
    bar.value = percent;
    bar.innerHTML = percent + "%";
}

function populateAnnotationsList(){
  //sort the array so earlier annotations come first...
  annotationsArray.sort(function(a, b) {
    return a.startTime - b.startTime;
  });

  //clear any existing annotations in the list...
  $("li.vidAnnotationListItem").each(function(index) {
    //remove it!
    this.remove();
  });

  //loop through the array, adding a new li element in the appropriate list for each one...
  for (var i = 0; i < annotationsArray.length; i++){
    //get the current list item...
    var currentAnnotation = annotationsArray[i];
    //formulate our new li HTML...
    var newListElement = '<li class="vidAnnotationListItem"><a class="removeAnnotation" href="#" data-annotation-id="' + i + '">X</a><div class="vidAnnotationType">Text annotation</div><div class="vidAnnotationTimes">' + formatSecondsToString(currentAnnotation.startTime) + ' - ' + formatSecondsToString(currentAnnotation.endTime) + '</div><div class="vidAnnotationContent">' + currentAnnotation.textString + '</div></li>';
    //and add it to the end of the list...
    $("ul#vidAnnotationList").append(newListElement);
  }

}

function deleteAnnotationAtIndex(index){
  //remove 1 item, at the current index, from the annotations array...
  annotationsArray.splice(index, 1);

  //redraw the list...
  populateAnnotationsList();

  //we've modified the array so save it...
  saveAnnotations();
}

//crude mouse fix from http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

//canvas drawing stuff...
//(quite a lot of this canvas stuff is shamefully stolen from http://atomicrobotdesign.com/blog/javascript/draw-a-rectangle-using-the-mouse-on-the-canvas-in-less-than-40-lines-of-javascript/)
function initCanvas() {
  canvas.addEventListener('mousedown', mouseDownCanvas, false);
  canvas.addEventListener('mouseup', mouseUpCanvas, false);
  canvas.addEventListener('mousemove', mouseMoveCanvas, false);
}

function mouseDownCanvas(e) {
  //the user wants to begin drawing, if they're allowed, then begin
  if (canDraw){
    rect.startX = getMousePos(canvas, e).x;
    rect.startY = getMousePos(canvas, e).y;
    console.log(rect);
    dragging = true;
  }
}

function mouseUpCanvas() {
  //if we're not supposed to be creating annotations at the moment, don't allow it - just give up...
  if (!canDraw){
    return;
  }

  dragging = false;

  //drawing complete!!!!!1
  newAnnotationDrawingComplete();
}

function mouseMoveCanvas(e) {
  if (dragging && canDraw) {
    console.log('pageX: ' + e.pageX + ' pageY: ' + e.pageY);

    rect.w = getMousePos(canvas, e).x - rect.startX;
    rect.h = getMousePos(canvas, e).y - rect.startY;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawCanvas();
  }
}


function drawCanvas() {
  if (canDraw){
    //set the fill colour
    ctx.fillStyle="#FF0000";

    //and fill it in...
    ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
  }
}

//  jQuery events.
$(document).ready(function(){
  //the DOM has loaded, so let's begin...
  console.log('ready');

  //set-up video (load in array of annotations...)
  setUp();

  //super super handy reference for video tag info... http://www.w3schools.com/tags/ref_av_dom.asp

  $(VIDEO_SELECTOR).bind('play', function() {
    console.log('started playing.');
    // NOTE: This is also called on resume from a pause, it's not unique to the video's first play.
    // call update manually - there could be annotations that need to be shown at 0 secs!
    update();
  });

  $(VIDEO_SELECTOR).bind('pause', function() {
    console.log('playback paused.');
    $(PLAY_PAUSE_SELECTOR).text("Play");

  });

  $(VIDEO_SELECTOR).bind('ended', function() {
    console.log('finished playing.');
    // reset current time variable (but do not call update!)
    currentTime = 0;
    $(PROGRESS_BAR_SELECTOR).value = 0;
  });

  $(VIDEO_SELECTOR).bind('timeupdate', function() {
    //  the current video play time, in whole seconds (rounded down)
    var newTime = Math.floor(this.currentTime);
    // okay, we only care about updating if the time is different (in whole seconds)
    // otherwise, the user's getting absolutely hammered with the DOM redrawing etc.
    if(newTime != currentTime){
      // a whole second has passed (or many seconds if they video's been skipped)
      console.log('seconds changed: ' + newTime);

      //update current time to new time.
      currentTime = newTime;

      updateProgressBar();

      update();
    }
  });

  //when the add button's clicked, we wanna use the add function...
  $(ADD_BUTTON_SELECTOR).click(function() {
    //get adding...
    addAnnotationClicked();
  });

  $(PLAY_PAUSE_SELECTOR).click(function() {
    playPauseClicked();
  });

  $(document).on('click', REMOVE_BUTTON_SELECTOR, function() {
    //get the index to remove from the button data attribute...
    var index = $(this).data('annotation-id');
    //call the remove function, passing in the index from within the remove button's data attribute...
    deleteAnnotationAtIndex(index);
  });

  //hidey-show
  $("#showVA").hide();

  $("#hideVA").click(function(){
    $("#hideVA").hide();
    $("#showVA").show();
    $(VIDEO_SELECTOR).animate({"width" : "600px"});
    $('#vidAnnotation').hide();
  });

  $("#showVA").click(function(){
    $("#showVA").hide();
    $("#hideVA").show();
    $(VIDEO_SELECTOR).animate({"width" : "400px"}, function(){
      $("#vidAnnotation").show();
    });
  });

});
