// easyAnnotate JavaScript.

// define a 'constant' so we can easily select video, no matter what we choose to call it in final HTML implementation...
var VIDEO_SELECTOR = 'video';
var VIDEO_CONTAINER = 'div#vid-overlay'
// and a 'constant' to select our add button...
var ADD_BUTTON_SELECTOR = 'a#addAnnotation';
var PLAY_PAUSE_SELECTOR = 'button#playPauseButton';

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
  $(annotationSelector).css({"width": a.aWidth, "height": a.aHeight});

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
  console.log('Starting to add annotation...');
  //okay, first pause the video...
  $(VIDEO_SELECTOR).trigger('pause');

  //basic basic basic.
  var title = prompt("Please enter your annotation text:", "");
  //literally at fkn pumpkin spice levels.
  if (title != null) {
    var newAnnotation = new annotation(title, null, 0, 0, 180, 45, currentTime, (currentTime + 2));
    annotationsArray.push(newAnnotation);

    //let's save too!
    saveAnnotations();
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
    //if it's under a minute, just return it...
    return "0:0" + numberOfSeconds.toString();
  }


  if(numberOfSeconds < 60){
    //if it's under a minute, just return it...
    return "0:" + numberOfSeconds.toString();
  }

  var wholeMinutes = Math.floor(numberOfSeconds / 60);
  var secondsRemaining = numberOfSeconds - (wholeMinutes * 60);

  return wholeMinutes + ":" + secondsRemaining;

}

//  jQuery events.
$(document).ready(function(){
  //the DOM has loaded, so let's begin...
  console.log('ready');

  //set-up video (load in array of annotations...)
  setUp();

  //super super handy reference for video tag info... http://www.w3schools.com/tags/ref_av_dom.asp

  $(VIDEO_SELECTOR).bind("play", function() {
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
  });

  $(VIDEO_SELECTOR).bind('timeupdate', function() {
    //  the current video play time, in whole seconds (rounded down)
    newTime = Math.floor(this.currentTime);
    // okay, we only care about updating if the time is different (in whole seconds)
    // otherwise, the user's getting absolutely hammered with the DOM redrawing etc.
    if(newTime != currentTime){
      // a whole second has passed (or many seconds if they video's been skipped)
      console.log('seconds changed: ' + newTime);

      //update current time to new time.
      currentTime = newTime;

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

});
