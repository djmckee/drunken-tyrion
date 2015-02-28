// easyAnnotate JavaScript.

// define a 'constant' so we can easily select video, no matter what we choose to call it in final HTML implementation...
var VIDEO_SELECTOR = 'video';
var VIDEO_PLAYER_ELEMENT = document.getElementById('videoPlayer');

var VIDEO_CONTAINER = 'div#vid-overlay';
var ANNOTATION_PANE = '#vidAnnotation'

// and a 'constant' to select our add button...
var ADD_BUTTON_SELECTOR = 'a#addAnnotation';
var REMOVE_BUTTON_SELECTOR = 'a.removeAnnotation';

var PLAY_PAUSE_SELECTOR = 'a#playPauseButton';
var PROGRESS_BAR_SELECTOR = 'progress#progress';

var INFORMATION_TEXT_SELECTOR = 'div#informationalText';

var VOLUME_DOWN_SELECTOR = 'a#volume-down';
var VOLUME_UP_SELECTOR = 'a#volume-up';

var HIDEY_SHOW_BUTTON = 'a#hidey-showy';
var CLEAR_ALL_BUTTON = 'a#delete-everything-button';

var TOGGLE_ANNOTATIONS_BUTTON = 'a#toggle-annotations-button';

var RUNNING_TIME = 'span#play-time';

//canvas variables
var canvas = document.getElementById('vid-canvas');
var ctx = canvas.getContext('2d');

//variable storing width of video currently
var vidWidth = 400; //video starts at 400px wide

//rect is a dictionary which will contain an x, y, width and height.
var rect = {};

//booleans to tell the canvas whether or not it is currently drawing boxes, and wether or not it is allowed to.
var dragging = false;
var canDraw = false;

//  global variables
//  number of whole seconds that the video's been playing for.
var currentTime = 0;
//  an array that holds annotation objects.
var annotationsArray = [];

//is the player large at the moment? (starts off small...)
var isPlayerLarge = false;

//is the annotation button visible (no by default)
var isAnnotationFormVisible = false;

//should we even bother displaying annotations!? :o
var shouldDisplayAnnotations = true;

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
function uniqueIdForAnnotation(a) {
    //concatenate our huge string of annotation stuff...
    var stringToMakeUnique = (String(a.startTime)) + (String(a.endTime)) + (String(a.xPosition)) + (String(a.yPosition)) + (a.text);

    //make a hash using the crypto-js MD5 library
    var hash = CryptoJS.MD5(stringToMakeUnique);

    //make sure it's in string form, then return it
    return hash.toString();

}

function testAnnotation(name) {
    var newAnnotation = new annotation(name, null, 30, 30, 30, 30, 3, 5);
    annotationsArray.push(newAnnotation);
    console.log(annotationsArray);

}

function addAnnotationToScreen(a) {
    //see if we should even be displaying annotations...
    if (!shouldDisplayAnnotations){
      //we shouldn't be showing anything - give up and go home...
      return;
    }

    //get a unique id first...
    var id = uniqueIdForAnnotation(a);

    //create our annotation html...
    var annotationHtmlElement = '<div class="annotation-on-screen" id="' + id + '"></div>';

    //work out the current annotation's selector so we can select and set attributes in jQuery
    var annotationSelector = 'div#' + id;

    //add it to the DOM so we can begin to add style etc...
    $(VIDEO_CONTAINER).append(annotationHtmlElement);

    console.log('attempting to add:' + annotationHtmlElement);

    var height = a.aHeight;
    //perform a 'lil bounds checking, we don't want stupidly small annotations...
    if (height < 20) {
        height = 20;
    }

    var width = a.aWidth;
    //perform a 'lil bounds checking, we don't want stupidly small annotations...
    if (width < 30) {
        width = 30;
    }

    //set height and width, and a high z-index so it shows over the video.
    $(annotationSelector).css({
        "width": (width * vidWidth / 400),
        "height": (height * vidWidth / 400),
        "position": "relative",
        "top": (a.yPosition * vidWidth / 400),
        "left": (a.xPosition * vidWidth / 400)
    });

    var annotationString = a.textString;

    console.log('annotation title: ' + annotationString);

    if (annotationString == null) {
        annotationString = "";
    }

    $(annotationSelector).text(annotationString);

    //if there's an image, add it...
    if (a.imageUrl != null) {
        //create an image tag...
        var imageElement = '<img src="' + a.imageUrl + '"/>';

        //add blank image into the annotation...
        $(annotationSelector).append(imageElement);

        var imageSelector = annotationSelector + ' img';

        //do a 'lil styling
        $(imageSelector).css({"width": "100%", "height": "auto"});

    }

}

function removeAnnotationFromScreen(a) {
    //get a unique id first...
    var id = uniqueIdForAnnotation(a);

    //work out the current annotation's selector so we can select and remove it from screen
    var annotationSelector = 'div#' + id;

    //remove...
    $(annotationSelector).remove();
}

//  the update method, to be called every time the running time of the video changes by a whole second
function update() {
    console.log('update called.');
    //update running time...
    $(RUNNING_TIME).text(formatSecondsToString(currentTime));

    // we want annotations that have a start time greater than or equal to the current playback time,
    // but also an end time less than the current time.

    // some funky jquery to search through the array.
    var currentAnnotations = $.grep(annotationsArray, function (e) {
        return (currentTime >= e.startTime && currentTime < e.endTime);
    });

    // these things might also be useful to know I guess...

    // get annotations that need to be added (i.e. have a start time of the current second)
    var newAnnotations = $.grep(annotationsArray, function (e) {
        return (currentTime == e.startTime);
    });

    if (newAnnotations != null) {
        if (newAnnotations.length > 0) {
            //there's animations to load!
            console.log('have new annotations to load');

            for (var i = 0; i < newAnnotations.length; i++) {
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
    var oldAnnotations = $.grep(annotationsArray, function (e) {
        return (currentTime == e.endTime);
    })

    if (oldAnnotations != null) {
        if (oldAnnotations.length > 0) {
            //there's animations to remove!
            console.log('have old annotations to remove');

            for (var i = 0; i < oldAnnotations.length; i++) {
                //work out its unique ID, then remove it from the document (taking it off screen)
                console.log('need to remove something.');
                removeAnnotationFromScreen(oldAnnotations[i]);

            }

        }
    }


    console.log(currentAnnotations);
}

//a function to add ANY annotations that should be on screen at the current time to the screen -
//regardless of wether their current start time is *now*...
//be careful when calling this - with great power comes great responsibility, etc.
function putAllCurrentAnnotationsOnScreen(){
    //find everything that should potentially be on screen...

    // some funky jquery to search through the array.
    var currentAnnotations = $.grep(annotationsArray, function (e) {
        return (currentTime >= e.startTime && currentTime < e.endTime);
    });

    if (currentAnnotations != null) {
        if (currentAnnotations.length > 0) {
            //there's animations to load!
            console.log('have new annotations to load');

            for (var i = 0; i < currentAnnotations.length; i++) {
                //make a new annotation div, set it's id tag to the unique ID for this particular annotation
                //add all of the releveant attributes from the annotation, then add it to the video player...
                console.log('need to add something.');
                var newAnnotation = currentAnnotations[i];
                console.log(newAnnotation);
                addAnnotationToScreen(newAnnotation);
            }
        }
    }


}

// perform some basic setup tasks such as loading in the existing array of annotations from local storage...
function setUp() {
    //data-easyannotation-file-id is the attribute that holds our local storage file id, get it...
    var localStorageId = $(VIDEO_SELECTOR).data('easyannotation-file-id');

    //check there's actually something to load in first...
    if (localStorage.getItem(localStorageId)) {
        //go ahead and load...
        //load in from local storage...
        var localData = JSON.parse(localStorage.getItem(localStorageId));

        //if the array is null, then set our array of annotations to a blank array (so we're not having null pointer issues)
        //otherwise, set it to the parsed array we've retrived from local storage (stored in localData currently...)
        if (localData == null) {
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
    annotationsArray.sort(function (a, b) {
        return a.startTime - b.startTime;
    });

    //populate the annotations list...
    populateAnnotationsList();

    initCanvas();

}

// a convenience save function... we'll wanna call this after every edit, etc.
function saveAnnotations() {
    //firstly, let's convert the array to a JSON string...
    var jsonArray = JSON.stringify(annotationsArray);

    //now, get the relevant local storage ID from the html data attribute...
    var localStorageId = $(VIDEO_SELECTOR).data('easyannotation-file-id');

    //save the converted data into the local storage of the browser, with the proper ID...
    localStorage.setItem(localStorageId, jsonArray);

}

//clear the contents of existing local storage items (probably just for testing purposes but you never know...)
function clearStoredAnnotations() {
    //clear all local storage items associated with this page.
    window.localStorage.clear();

    //also, clear the current annotations array, setting it to a blank array object.
    annotationsArray = [];

    //confirm on the console, since this'll probably be used for debugging/testing
    console.log('Local storage cleared.');

}

function addAnnotationClicked() {
    //allow drawing to start and bring up an info dialog...
    canDraw = true;

    console.log('Starting to add annotation...');

    //okay, first pause the video...
    $(VIDEO_SELECTOR).trigger('pause');

    //tell the user...
    $(INFORMATION_TEXT_SELECTOR).text("Begin drawing over the video...");
}

function newAnnotationDrawingComplete() {
    //clear the canvas...
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //the user isn't allowed to draw anymore...
    canDraw = false;

    //reset informational text...
    $(INFORMATION_TEXT_SELECTOR).text("");

    //basic basic basic.
    var title = prompt("Please enter your annotation text:", "");
    //asks how long the annotation should run for
    var time = prompt("Please enter how long you want the annotation to stay on screen:", "");
    //literally at fkn pumpkin spice levels.
    //if the time entered isn't an integer set the time to 2 seconds
    if (time == null || isNaN(time)) {
        time = "2";
    }

    //get x and y and width + height that has been drawn previously by the user...
    if (isPlayerLarge == true){ //adjust the values to fit the smaller video size
      var drawnX = (rect.startX / 1.5);
      var drawnY = (rect.startY / 1.5);
      var drawnWidth = (rect.w / 1.5);
      var drawnHeight = (rect.h / 1.5);
    }
    else{ //the values will fit the smaller video size perfectly
      var drawnX = rect.startX;
      var drawnY = rect.startY;
      var drawnWidth = rect.w;
      var drawnHeight = rect.h;
    }

    //do some minimum checking, we don't want the drawn rect to be too ridiculously small so an annotation can't physically fit...
    if (drawnHeight < 20) {
        drawnHeight = 20;
    }

    if (drawnWidth < 30) {
        drawnWidth = 30;
    }

    //ensure that annotations can't be outside the video
    if(drawnX + drawnWidth > 390){
      drawnX = 390 - drawnWidth;
    }

    if(drawnY + drawnHeight > 210){
      drawnY = 210 - drawnHeight;
    }

    if (title != null && title.length > 0) {
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
    if (VIDEO_PLAYER_ELEMENT.paused || VIDEO_PLAYER_ELEMENT.ended) {
        VIDEO_PLAYER_ELEMENT.play();
        $(PLAY_PAUSE_SELECTOR).html('<i class="fa fa-pause"></i>');
    }
    else {
        VIDEO_PLAYER_ELEMENT.pause();
        $(PLAY_PAUSE_SELECTOR).html('<i class="fa fa-play"></i>');

    }
}

function formatSecondsToString(numberOfSeconds) {
    var wholeMinutes = Math.floor(numberOfSeconds / 60);
    var secondsRemaining = numberOfSeconds - (wholeMinutes * 60);

    if (secondsRemaining < 10){
      //if it's under 10 seconds, make it "0:01" not "0:1"
      secondsRemaining = "0" + String(secondsRemaining);
    }

    if (numberOfSeconds < 10) {
        //if it's under 10 seconds, just return it...
        return "0:0" + String(numberOfSeconds);
    }


    if (numberOfSeconds < 60) {
        //if it's under a minute, just return it...
        return "0:" + String(numberOfSeconds);
    }

    return String(wholeMinutes) + ":" + String(secondsRemaining);

}

function updateProgressBar() {
    var bar = document.getElementById('progress');
    var percent = Math.floor((100 / VIDEO_PLAYER_ELEMENT.duration) * (VIDEO_PLAYER_ELEMENT.currentTime));
    bar.value = percent;
    bar.innerHTML = percent + "%";
}

function populateAnnotationsList() {
    //sort the array so earlier annotations come first...
    annotationsArray.sort(function (a, b) {
        return a.startTime - b.startTime;
    });

    //clear any existing annotations in the list...
    $("li.vidAnnotationListItem").each(function (index) {
        //remove it!
        this.remove();
    });

    //loop through the array, adding a new li element in the appropriate list for each one...
    for (var i = 0; i < annotationsArray.length; i++) {
        //get the current list item...
        var currentAnnotation = annotationsArray[i];
        //formulate our new li HTML...
        var newListElement = '<li class="vidAnnotationListItem"><a class="removeAnnotation" href="#" data-annotation-id="' + i + '">X</a><div class="vidAnnotationType">Text annotation</div><div class="vidAnnotationTimes">' + formatSecondsToString(currentAnnotation.startTime) + ' - ' + formatSecondsToString(currentAnnotation.endTime) + '</div><div class="vidAnnotationContent">' + currentAnnotation.textString + '</div></li>';
        //and add it to the end of the list...
        $("ul#vidAnnotationList").append(newListElement);
    }

}

function deleteAnnotationAtIndex(index) {
    //if the annotation happens to be on screen, try to remove it first...
    var annotation = annotationsArray[index];

    //remove swiftly and mercilessly (if we can)
    removeAnnotationFromScreen(annotation);

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
    if (canDraw) {
        rect.startX = getMousePos(canvas, e).x;
        rect.startY = getMousePos(canvas, e).y;
        console.log(rect);
        dragging = true;
    }
}

function mouseUpCanvas() {
    //if we're not supposed to be creating annotations at the moment, don't allow it - just give up...
    if (!canDraw) {
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCanvas();
    }
}


function drawCanvas() {
    if (canDraw) {
        //set the fill colour
        ctx.fillStyle = "rgba(89, 124, 86, 0.85)";

        //and fill it in...
        ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
    }
}

//  jQuery events.
$(document).ready(function () {
    //the DOM has loaded, so let's begin...
    console.log('ready');

    //set-up video (load in array of annotations...)
    setUp();

    //hide annotation form
    $('#addAnnotationForm').hide();

    //super super handy reference for video tag info... http://www.w3schools.com/tags/ref_av_dom.asp

    $(VIDEO_SELECTOR).bind('play', function () {
        console.log('started playing.');
        // NOTE: This is also called on resume from a pause, it's not unique to the video's first play.
        // call update manually - there could be annotations that need to be shown at 0 secs!
        update();

        $(PLAY_PAUSE_SELECTOR).html('<i class="fa fa-pause"></i>');
    });

    $(VIDEO_SELECTOR).bind('pause', function () {
        console.log('playback paused.');
        $(PLAY_PAUSE_SELECTOR).html('<i class="fa fa-play"></i>');

    });

    $(VIDEO_SELECTOR).bind('ended', function () {
        console.log('finished playing.');
        // reset current time variable (but do not call update!)
        currentTime = 0;
        document.getElementById('progress').value = 0;
        $(PLAY_PAUSE_SELECTOR).html('<i class="fa fa-play"></i>');

        //remove any currently on screen annotations instantly
        $('div.annotation-on-screen').remove();

    });

    $(VIDEO_SELECTOR).bind('timeupdate', function () {
        //update the progress bar no matter what...
        updateProgressBar();


        //  the current video play time, in whole seconds (rounded down)
        var newTime = Math.floor(this.currentTime);
        // okay, we only care about updating if the time is different (in whole seconds)
        // otherwise, the user's getting absolutely hammered with the DOM redrawing etc.
        if (newTime != currentTime) {
            // a whole second has passed (or many seconds if they video's been skipped)
            console.log('seconds changed: ' + newTime);

            //update current time to new time.
            currentTime = newTime;
            update();
        }
    });

    //when the add button's clicked, we wanna use the add function...
    $(ADD_BUTTON_SELECTOR).click(function () {
        //get adding...
        addAnnotationClicked();
    });

    $(PLAY_PAUSE_SELECTOR).click(function () {
        playPauseClicked();
    });

    $(document).on('click', REMOVE_BUTTON_SELECTOR, function () {
        //get the index to remove from the button data attribute...
        var index = $(this).data('annotation-id');
        //call the remove function, passing in the index from within the remove button's data attribute...
        deleteAnnotationAtIndex(index);
    });

    $(VOLUME_UP_SELECTOR).click(function () {
        //check max volume...
        if (VIDEO_PLAYER_ELEMENT.volume == 1) {
            //can't increase...
            return;
        }

        VIDEO_PLAYER_ELEMENT.volume += 0.1;
    });

    $(VOLUME_DOWN_SELECTOR).click(function () {
        //check for min volume...
        if (VIDEO_PLAYER_ELEMENT.volume == 0) {
            //can't go any lower...
            return;
        }

        VIDEO_PLAYER_ELEMENT.volume -= 0.1;
    });

    $(CLEAR_ALL_BUTTON).click(function () {
        //check first before deleting literally everything ever!!!
        var shouldDelete = confirm('This will delete ALL annotations for every video in easyAnnotate. Do you wish to continue?');
        // :o
        if (shouldDelete) {
            //Delete our beautiful content mercilessly.
            clearStoredAnnotations();

            //save a blank list into local storage...
            saveAnnotations();

            //and redraw the blank list...
            populateAnnotationsList();

            //also - remove any currently on screen annotations instantly
            $('div.annotation-on-screen').remove();

        }
    });

    //add annotation
    $('#annotationButton').click(function (){
      if(isAnnotationFormVisible){ //form currently visible, let's hide that
        $('#addAnnotationForm').hide();
        $('#vidTitle').css('margin-top','14px');
        isAnnotationFormVisible = false //since the form is now hidden
      }
      else{ //form isn't visible, let's show it
        $('#addAnnotationForm').show();
        $('#vidTitle').css('margin-top','-150px');
        isAnnotationFormVisible = true; //since the form is now visible
      }
    });

    //hidey-show
    $(HIDEY_SHOW_BUTTON).click(function () {
        if (isPlayerLarge) {
            //make it small...
            $(VIDEO_SELECTOR).animate({"width": "400px"}, function () {
                $(ANNOTATION_PANE).show();
            });

            //reset button text...
            $(this).text("Hide Annotation List");

            //set the boolean...
            isPlayerLarge = false;

            //set the video width to 400
            vidWidth = 400;

            //and set the canvas size
            canvas.width = 400;
            canvas.height = 220;

            //redraw the annotations so they fit the video
            $('.annotation-on-screen').each(function(i, obj) {
                var currentWidth = $(this).width();
                var currentHeight = $(this).height();
                var currentX = $(this).position().left;
                var currentY = $(this).position().top;

                var newWidth = currentWidth * 0.666;
                var newHeight = currentHeight * 0.666;
                var newX = currentX * 0.666;
                var newY = currentY * 0.666;

                $(this).animate({
                  width: newWidth + 'px',
                  height: newHeight + 'px',
                  left: newX + 'px',
                  top: newY + 'px'
                })

                console.log('Annotation style adjusted for smaller video size.');
            });

            //move annotation form
            $("#addAnnotationForm").animate({"top": "330px"});

        } else {
            //go big or go home!
            $(VIDEO_SELECTOR).animate({"width": "600px"});
            $(ANNOTATION_PANE).hide();

            //change button text...
            $(this).text("Show Annotation List");

            //set the boolean...
            isPlayerLarge = true;

            //set the video width to 600
            vidWidth = 600;

            //and set the canvas size
            canvas.width = 600;
            canvas.height = 330;

            //redraw the annotations so they fit the video
            $('.annotation-on-screen').each(function(i, obj) {
                var currentWidth = $(this).width();
                var currentHeight = $(this).height();
                var currentX = $(this).position().left;
                var currentY = $(this).position().top;

                var newWidth = currentWidth * 1.5;
                var newHeight = currentHeight * 1.5;
                var newX = currentX * 1.5;
                var newY = currentY * 1.5;

                $(this).animate({
                  width: newWidth + 'px',
                  height: newHeight + 'px',
                  left: newX + 'px',
                  top: newY + 'px'
                })

                console.log('Annotation style adjusted for larger video size.');
            });

            //move annotation form
            $("#addAnnotationForm").animate({"top": "440px"});
        }
    });


    $(TOGGLE_ANNOTATIONS_BUTTON).click(function () {
        if (shouldDisplayAnnotations){
          //if annotations are on - turn them off (and remove current ones)
          shouldDisplayAnnotations = false;

          //reset button text
          $(this).text("Turn on annotations");

          //and remove any current ones on screen...
          $('div.annotation-on-screen').remove();

        } else {
          //if they're off - turn them on (and put any current annotations that need to be on the screen onto the screen).
          shouldDisplayAnnotations = true;

          //reset button text
          $(this).text("Turn off annotations");

          //put any current annotations on the screen!!!
          putAllCurrentAnnotationsOnScreen();
        }

    });

    //Bind some keyboard shortcuts... (thanks Mousetrap for making this pleasant!)
    Mousetrap.bind('space', function () { /*play/pause the video by simulating a play/pause click with jQuery */
        $(PLAY_PAUSE_SELECTOR).trigger('click');
    });
    Mousetrap.bind('up', function () { /* volume up... */
        $(VOLUME_UP_SELECTOR).trigger('click');
    });
    Mousetrap.bind('down', function () { /* volume down... */
        $(VOLUME_DOWN_SELECTOR).trigger('click');
    });
    Mousetrap.bind('n', function () { /* make new annotation... */
        addAnnotationClicked();
    });
    Mousetrap.bind('h', function () { /* hide/show annotation list... */
        $(HIDEY_SHOW_BUTTON).trigger('click');
    });


});
