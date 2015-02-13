// easyAnnotate JavaScript.

//  global variables
var currentTime;

//  annotation object prototype.
function annotation(text, imageUrl, xPosition, yPosition, width, height) {
    this.text = text;
    this.imageUrl = imageUrl;
    this.xPosition = xPosition;
    this.yPosition = yPosition;
    this.width = width;
    this.height = height;
}

//  the update method, to be called every time the running time of the video changes by a whole second
function update(){
  console.log('update called.');
}

//  jQuery events.
$(document).ready(function(){
  //the DOM has loaded, so let's begin...
  console.log('ready');

  //super super handy reference for video tag info... http://www.w3schools.com/tags/ref_av_dom.asp

  // define a 'contant' so we can easily select video, no matter what we choose to call it in final HTML implimentation...
  var VIDEO_SELECTOR = "video"

  $(VIDEO_SELECTOR).bind("play", function() {
    console.log('started playing.');
  });

  $(VIDEO_SELECTOR).bind("pause", function() {
    console.log('playback paused.');
  });

  $(VIDEO_SELECTOR).bind("ended", function() {
    console.log('finished playing.');
  });

  $(VIDEO_SELECTOR).bind("timeupdate", function() {
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
