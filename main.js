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

  console.log(currentAnnotations);
}

//  jQuery events.
$(document).ready(function(){
  //the DOM has loaded, so let's begin...
  console.log('ready');

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
