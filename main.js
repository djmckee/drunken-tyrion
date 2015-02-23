// easyAnnotate JavaScript.

// define a 'constant' so we can easily select video, no matter what we choose to call it in final HTML implementation...
var VIDEO_SELECTOR = 'video'

//  global variables
//  number of whole seconds that the video's been playing for.
var currentTime = 0;
//  an array that holds annotation objects.
var annotationsArray = [];

//  annotation object prototype.
function annotation(text, imageUrl, xPosition, yPosition, width, height, startTime, endTime) {
    this.text = text;
    this.imageUrl = imageUrl;
    this.xPosition = xPosition;
    this.yPosition = yPosition;
    this.width = width;
    this.height = height;
    this.startTime = startTime;
    this.endTime = endTime;
}

function testAnnotation(){
  var newAnnotation = new annotation('Annotation', null, 30, 30, 30, 30, 3, 5);
  annotationsArray.push(newAnnotation);
  console.log(annotationsArray);

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

  // and get annotations that need to be removed (i.e. have an end time of the current second)
  var oldAnnotations = $.grep(annotationsArray, function(e) {
    return (currentTime == e.endTime);
  })

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

});
