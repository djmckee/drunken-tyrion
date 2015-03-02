// easyAnnotate JavaScript.

// define a 'constant' so we can easily select video, no matter what we choose to call it in final HTML implementation...
var VIDEO_SELECTOR = 'video';
var VIDEO_PLAYER_ELEMENT = document.getElementById('videoPlayer');

var VIDEO_CONTAINER = 'div#vid-overlay';
var ANNOTATION_PANE = '#vidAnnotation';
var ANNOTATIONS_ON_SCREEN_SELECTOR = 'div.annotation-on-screen';

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

var ANNOTATION_FORM_SELECTOR = '#addAnnotationForm';
var FORM_SAVE_BUTTON = 'a#saveAddForm';
var FORM_CANCEL_BUTTON = 'a#cancelAddForm';
var FORM_TEXT_FIELD = '#form-annotation-text';
var FORM_LENGTH_FIELD = '#form-annotation-length';
var FORM_LINK_FIELD = '#form-annotation-link';


var FORM_IMAGE_URL_FIELD = '#form-image-url';
var TEXT_TAB_LINK = '#textTab';
var IMAGE_TAB_LINK = '#imageTab';
var TEXT_TAB_CONTENT = '#textTabContent';
var IMAGE_TAB_CONTENT = '#imageTabContent';

var COLOUR_BUTTON = "#background-colour-button";
var TEXT_COLOUR_BUTTON = "#text-colour-button";
var DEFAULT_ANNOTATION_COLOUR = "rgba(89, 124, 86, 0.7)";
var DEFAULT_TEXT_COLOUR = "rgba(255, 255, 255, 1.0)";
var DEFAULT_VID_WIDTH = 400;
var LARGE_VID_WIDTH = 600;
var VID_WIDTH_TO_HEIGHT_MULTIPLIER = 0.55;

//Fun fact: 1.5 is the least metal number.
var ANTI_ROC_SOC_CONSTANT = 1.5;

//canvas variables
var canvas = document.getElementById('vid-canvas');
var ctx = canvas.getContext('2d');

//variable storing width of video currently
var vidWidth = DEFAULT_VID_WIDTH; //video starts at 400px wide

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

//z-index for annotation counter (newer annotations have pirority, counter)
var zIndex = 3000; //starts at 3000

//if we're skipping via the progress bar, we wanna add *all* possible annotations to screen during the next call of update...
var isSkipping = false;

//default tab is text
var tab = 1;

//default font size is 16
var fontSize = 16;

//  annotation object prototype.
function annotation(text, imageUrl, xPosition, yPosition, width, height, startTime, endTime, zIndex, backgroundColour, textColour, link) {
    this.textString = text;
    this.imageUrl = imageUrl;
    this.xPosition = xPosition;
    this.yPosition = yPosition;
    this.aWidth = width;
    this.aHeight = height;
    this.startTime = startTime;
    this.endTime = endTime;
    this.zIndex = zIndex;
    this.backgroundColour = backgroundColour;
    this.textColour = textColour;
    this.link = link;
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
    var newAnnotation = new annotation(name, null, 30, 30, 30, 30, 3, 5, 3000, DEFAULT_ANNOTATION_COLOUR, DEFAULT_TEXT_COLOUR, null);
    annotationsArray.push(newAnnotation);
    console.log(annotationsArray);

}

function addAnnotationToScreen(a) {
    //see if we should even be displaying annotations...
    if (!shouldDisplayAnnotations) {
        //we shouldn't be showing anything - give up and go home...
        return;
    }

    //get a unique id first...
    var id = uniqueIdForAnnotation(a);

    var annotationLink = '';

    if (a.link != null && a.link.length > 0) {
        annotationLink = a.link;
    }

    //create our annotation html...
    var annotationHtmlElement = '<div class="annotation-on-screen" data-easyannotation-annotation-href="' + annotationLink + '" title="' + annotationLink + '" id="' + id + '"></div>';

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

    width = (width * vidWidth / DEFAULT_VID_WIDTH);
    height = (height * vidWidth / DEFAULT_VID_WIDTH);
    var x = (a.xPosition * vidWidth / DEFAULT_VID_WIDTH);
    var y = (a.yPosition * vidWidth / DEFAULT_VID_WIDTH);

    //we don't want annotations to end up bigger than the player...
    var maxHeight = ((vidWidth * VID_WIDTH_TO_HEIGHT_MULTIPLIER) - y);
    var maxWidth = (vidWidth - x);

    //try the default colour...
    var annotationColour = DEFAULT_ANNOTATION_COLOUR;

    //if the annotation has a colour associated with it, use it instead...
    if (a.backgroundColour) {
        annotationColour = a.backgroundColour;
    }

    //see if there's a text colour...
    var textColour = DEFAULT_TEXT_COLOUR;

    if (textColour != null) {
        textColour = a.textColour;
    }

    //set height and width, and a high z-index so it shows over the video.
    $(annotationSelector).css({
        "width": width,
        "height": height,
        "position": "absolute",
        "padding": "5px",
        "overflow": "auto",
        "top": y,
        "left": x,
        "max-width": maxWidth,
        "max-height": maxHeight,
        "z-index": a.zIndex,
        "background-color": annotationColour,
        "color": textColour
    });

    //add the no-select class - selecting annotation text does not look pro
    $(annotationSelector).addClass('no-select');

    var annotationString = a.textString;

    console.log('annotation title: ' + annotationString);

    if (annotationString == null) {
        annotationString = "";
    }

    annotationString = '<p>' + annotationString + '</p>'

    $(annotationSelector).html(annotationString);

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


    //if we're skipping via the progress bar, we want to remove everything, add all possible annotations on screen
    //and then set the skip variable to no, and return.
    if (isSkipping) {
        //remove any annotations currently on screen - correct ones are gonna be re-drawn next...
        $(ANNOTATIONS_ON_SCREEN_SELECTOR).remove();

        //draw any annotations on screen that should be on at this second (regardless of wether or not it's their exact start time)
        putAllCurrentAnnotationsOnScreen();

        //set the skipping variable to false so that this doesn't happen every time!
        isSkipping = false;

        //and return, so as not to draw stuff twice...
        return;
    }

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
    });

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
function putAllCurrentAnnotationsOnScreen() {
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
    //we really don't want multiple adds to happen at once...
    //hide the button just incase...
    $(ADD_BUTTON_SELECTOR).fadeTo("fast", 0);

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

    //show the add annotation form...
    toggleAddAnnotationForm();


}

function saveAnnotationButtonClicked() {
    //not so freakin' basic.

    //get a title from our fanciful form.
    var title = $(FORM_TEXT_FIELD).val();

    //get the what the form links to
    var link = $(FORM_LINK_FIELD).val();

    if (link != null && link.length > 0) {
        if (isValidUrl(link) || link.length < 4) {
            // LINK IS VALID!
            console.log('valid link: ' + link);
        } else {
            //INVALID!
            //warn user, give up, go home.
            alert('Invalid link URL! Please check and try again...');
            return;
        }

    } else {
        link = null;
    }

    //get how long the annotation should run for
    var time = $(FORM_LENGTH_FIELD).val();

    //see if it's an image annotation?
    var imageUrl = $(FORM_IMAGE_URL_FIELD).val();

    //if there's something there, validate it...
    if (imageUrl != null && imageUrl.length > 0) {
        if (isValidUrl(imageUrl) || imageUrl.length < 4) {
            //it's valid
            //make title nothing... (1 blank char. to pass validation later on!)
            title = ' ';

        } else {
            //INVALID!
            //warn user, give up, go home.
            alert('Invalid image URL! Please check and try again...');
            return;
        }
    } else {
        imageUrl = null;
    }

    //and allow the adding of more annotations...
    $(ADD_BUTTON_SELECTOR).fadeTo("fast", 1);

    //close the form...
    toggleAddAnnotationForm();

    //and clear the old values to defaults so new annotations don't have set ones...
    $(FORM_TEXT_FIELD).val("");
    $(FORM_LINK_FIELD).val("");
    $(FORM_LENGTH_FIELD).val("2");

    //if the time entered isn't an integer set the time to 2 seconds
    if (time == null || isNaN(time)) {
        time = "2";
    }

    //get x and y and width + height that has been drawn previously by the user...
    var drawnX = rect.startX;
    var drawnY = rect.startY;
    var drawnWidth = rect.w;
    var drawnHeight = rect.h;

    //if the player's currently large, then the values need adjusting to fit the smaller player.
    if (isPlayerLarge) { //adjust the values to fit the smaller video size
        drawnX = (drawnX / ANTI_ROC_SOC_CONSTANT);
        drawnY = (drawnY / ANTI_ROC_SOC_CONSTANT);
        drawnWidth = (drawnWidth / ANTI_ROC_SOC_CONSTANT);
        drawnHeight = (drawnHeight / ANTI_ROC_SOC_CONSTANT);
    }

    //do some minimum checking, we don't want the drawn rect to be too ridiculously small so an annotation can't physically fit...
    if (drawnHeight < 20) {
        drawnHeight = 20;
    }

    if (drawnWidth < 30) {
        drawnWidth = 30;
    }

    //ensure that annotations can't be outside the video
    if (drawnX + drawnWidth > (DEFAULT_VID_WIDTH - 10)) {
        drawnX = 390 - drawnWidth;
    }

    if (drawnY + drawnHeight > ((DEFAULT_VID_WIDTH * VID_WIDTH_TO_HEIGHT_MULTIPLIER) - 10)) {
        drawnY = 210 - drawnHeight;
    }

    //get a background colour from the colour picker element...
    var backgroundColor = $(COLOUR_BUTTON).css("background-color");

    //try and get a text colour too...
    var textColour = $(TEXT_COLOUR_BUTTON).css("background-color");

    //check that there's a proper title, and if so, go ahead adding the annotation...
    if (title != null && title.length > 0) {
        //create a new annotation with the variables we've got
        var newAnnotation = new annotation(title, imageUrl, drawnX, drawnY, drawnWidth, drawnHeight, currentTime, (currentTime + parseInt(time)), zIndex, backgroundColor, textColour, link);

        //add the new annotation that we've created into the array...
        annotationsArray.push(newAnnotation);

        //let's save too!
        saveAnnotations();

        //and re-populate the list...
        populateAnnotationsList();

        //and increase zIndex
        zIndex = zIndex + 1;
    } else {
        //the user hasn't entered a title - show an error!
        alert("An annotation title is required - please enter one.");

    }
}

function cancelAnnotationFormButtonClicked() {
    //give up and go home.
    //close the form...
    toggleAddAnnotationForm();

    //and clear the old values to defaults so new annotations don't have set ones...
    $(FORM_TEXT_FIELD).val("");
    $(FORM_LINK_FIELD).val("");
    $(FORM_LENGTH_FIELD).val("2");

    //and allow the adding of more annotations...
    $(ADD_BUTTON_SELECTOR).fadeTo("fast", 1);
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

    if (secondsRemaining < 10) {
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

//the following function's regex was from http://stackoverflow.com/questions/2723140/validating-url-with-jquery-without-the-validate-plugin
function isValidUrl(url) {
    //ugly ugly regex checking provided by http://stackoverflow.com/questions/2723140/validating-url-with-jquery-without-the-validate-plugin
    if (/^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url)) {
        return true;
    } else {
        return false;
    }
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

        //assume it's a text annotation...
        var annotationTypeString = 'Text annotation';

        //check to see if it's a fancy image one?
        var imageElement = '';
        if (currentAnnotation.imageUrl != null) {
            //okay there's an image url... it's actually an image annotation...
            annotationTypeString = 'Image annotation';

            //create an image tag...
            imageElement = '<img style="width: 100%; height: auto; margin-top: 5px;" src="' + currentAnnotation.imageUrl + '"/>';
        }

        var linkText = '';
        var linkFormatted = '';
        console.log(currentAnnotation.link);
        if (currentAnnotation.link != null) {
            if (currentAnnotation.link.length > 35) {
                linkFormatted = currentAnnotation.link.substring(0, 32) + "...";
            }
            else {
                linkFormatted = currentAnnotation.link;
            }
            linkText = '<div class="annotationLink" title="' + currentAnnotation.link + '"><a href="' + currentAnnotation.link + '" target="_blank">' + linkFormatted + '</a></div>';
        }

        console.log(linkText);

        //formulate our new li HTML...
        var newListElement = '<li class="vidAnnotationListItem" style="background-color: ' + currentAnnotation.backgroundColour + ';" ><a class="removeAnnotation" href="#" data-easyannotation-annotation-id="' + i + '">X</a><div class="vidAnnotationType">' + annotationTypeString + '</div><div class="vidAnnotationTimes">' + formatSecondsToString(currentAnnotation.startTime) + ' - ' + formatSecondsToString(currentAnnotation.endTime) + '</div><div class="vidAnnotationContent" style="color: ' + currentAnnotation.textColour + ';">' + imageElement + currentAnnotation.textString + '</div>' + linkText + '</li>';
        //and add it to the end of the list...
        $("ul#vidAnnotationList").append(newListElement);
    }

    //if there are some annotations, remove the background image that claims there aren't!
    if (annotationsArray.length > 0) {
        //there's annotations - make it so...
        $(ANNOTATION_PANE).css({'background-image': "none"});

    } else {
        //there's no annotations - use the pretty placeholder...
        $(ANNOTATION_PANE).css({'background-image': "url('resources/noAnnotations.png')"});

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
        ctx.fillStyle = DEFAULT_ANNOTATION_COLOUR;

        //and fill it in...
        ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
    }
}

function toggleAddAnnotationForm() {
    if (isAnnotationFormVisible) { //form currently visible, let's hide that
        $(ANNOTATION_FORM_SELECTOR).hide();
        $('#vidTitle').css('margin-top', '14px');
        isAnnotationFormVisible = false; //since the form is now hidden
    }
    else { //form isn't visible, let's show it
        $(ANNOTATION_FORM_SELECTOR).show();
        $('#vidTitle').css('margin-top', '-200px');
        //give it a default colour...
        $(COLOUR_BUTTON).attr('value', DEFAULT_ANNOTATION_COLOUR);
        $(TEXT_COLOUR_BUTTON).attr('value', DEFAULT_TEXT_COLOUR);

        $(COLOUR_BUTTON).colorPicker(); // initialise colour picker
        $(TEXT_COLOUR_BUTTON).colorPicker();
        isAnnotationFormVisible = true; //since the form is now visible
    }
}

//  jQuery events.
$(document).ready(function () {
    //the DOM has loaded, so let's begin...
    console.log('ready');

    //set-up video (load in array of annotations...)
    setUp();

    //hide annotation form
    $(ANNOTATION_FORM_SELECTOR).hide();

    //hide image tab in annotation form
    $(IMAGE_TAB_CONTENT).hide();


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
        $(ANNOTATIONS_ON_SCREEN_SELECTOR).remove();

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

    $(FORM_SAVE_BUTTON).click(function () {
        //get saving...
        saveAnnotationButtonClicked();
    });

    $(FORM_CANCEL_BUTTON).click(function () {
        //get cancellin'...
        cancelAnnotationFormButtonClicked();
    });

    $(PLAY_PAUSE_SELECTOR).click(function () {
        playPauseClicked();
    });

    $(document).on('click', REMOVE_BUTTON_SELECTOR, function () {
        //get the index to remove from the button data attribute...
        var index = $(this).data('easyannotation-annotation-id');
        //call the remove function, passing in the index from within the remove button's data attribute...
        deleteAnnotationAtIndex(index);
    });

    $(document).on('click', ANNOTATIONS_ON_SCREEN_SELECTOR, function () {
        console.log('clicked annotation...');
        var href = $(this).data('easyannotation-annotation-href');
        if (href.length > 1) {
            //there's a link (maybes!)
            //check the video's not already paused...
            if (!VIDEO_PLAYER_ELEMENT.paused) {
                //pause the video and open it...
                $(PLAY_PAUSE_SELECTOR).trigger('click');
            }
            //now open the link (in a new tab)
            window.open(href, '_blank');
            //debugging: console.log(href);
        }
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
            $(ANNOTATIONS_ON_SCREEN_SELECTOR).remove();

        }
    });

    //tab work
    $(TEXT_TAB_LINK).click(function () {
        //show/hide relevant blocks
        $(TEXT_TAB_CONTENT).show();
        $(IMAGE_TAB_CONTENT).hide();

        //highlight the correct tab
        $(TEXT_TAB_LINK).addClass("selected");
        $(IMAGE_TAB_LINK).removeClass("selected");

        //so we can distinguish between the tabs (for input handling)
        tab = 1;
    });

    $(IMAGE_TAB_LINK).click(function () {
        //show/hide relevant blocks
        $(IMAGE_TAB_CONTENT).show();
        $(TEXT_TAB_CONTENT).hide();

        //highlight the correct tab
        $(IMAGE_TAB_LINK).addClass("selected");
        $(TEXT_TAB_LINK).removeClass("selected");

        //so we can distinguish between the tabs (for input handling)
        tab = 2;
    });

    //hidey-show
    $(HIDEY_SHOW_BUTTON).click(function () {
        if (isPlayerLarge) {
            //make it small...
            $(VIDEO_SELECTOR).animate({"width": (DEFAULT_VID_WIDTH + "px")}, function () {
                $(ANNOTATION_PANE).show();
            });

            //reset button text...
            $(this).text("Hide Annotation List");

            //set the boolean...
            isPlayerLarge = false;

            //set the video width to 400
            vidWidth = DEFAULT_VID_WIDTH;

            //and set the canvas size
            canvas.width = DEFAULT_VID_WIDTH;
            canvas.height = (DEFAULT_VID_WIDTH * VID_WIDTH_TO_HEIGHT_MULTIPLIER);

            var ROC_SOC_CONSTANT = 0.666;

            fontSize = fontSize * ROC_SOC_CONSTANT;

            //redraw the annotations so they fit the video
            $('.annotation-on-screen').each(function (i, obj) {
                var currentWidth = $(this).width();
                var currentHeight = $(this).height();
                var currentX = $(this).position().left;
                var currentY = $(this).position().top;

                var newWidth = currentWidth * ROC_SOC_CONSTANT;
                var newHeight = currentHeight * ROC_SOC_CONSTANT;
                var newX = currentX * ROC_SOC_CONSTANT;
                var newY = currentY * ROC_SOC_CONSTANT;

                $(this).animate({
                    width: newWidth + 'px',
                    height: newHeight + 'px',
                    left: newX + 'px',
                    top: newY + 'px'
                });

                console.log('Annotation style adjusted for smaller video size.');
            });

            //move annotation form
            $(ANNOTATION_FORM_SELECTOR).animate({"top": "330px"});

        } else {
            //go big or go home!
            $(VIDEO_SELECTOR).animate({"width": "600px"});
            $(ANNOTATION_PANE).hide();

            //change button text...
            $(this).text("Show Annotation List");

            //set the boolean...
            isPlayerLarge = true;

            //set the video width to 600
            vidWidth = LARGE_VID_WIDTH;

            //and set the canvas size
            canvas.width = LARGE_VID_WIDTH;
            canvas.height = (LARGE_VID_WIDTH * VID_WIDTH_TO_HEIGHT_MULTIPLIER);

            console.log(fontSize);

            fontSize = fontSize * ANTI_ROC_SOC_CONSTANT;

            //redraw the annotations so they fit the video
            $('.annotation-on-screen').each(function (i, obj) {
                var currentWidth = $(this).width();
                var currentHeight = $(this).height();
                var currentX = $(this).position().left;
                var currentY = $(this).position().top;

                var newWidth = currentWidth * ANTI_ROC_SOC_CONSTANT;
                var newHeight = currentHeight * ANTI_ROC_SOC_CONSTANT;
                var newX = currentX * ANTI_ROC_SOC_CONSTANT;
                var newY = currentY * ANTI_ROC_SOC_CONSTANT;

                $(this).animate({
                    width: newWidth + 'px',
                    height: newHeight + 'px',
                    left: newX + 'px',
                    top: newY + 'px'
                });

                $(this).css('font-size', fontSize + 'px');

                console.log(fontSize);
                console.log('Annotation style adjusted for larger video size.');
            });

            //move annotation form
            $(ANNOTATION_FORM_SELECTOR).animate({"top": "440px"});
        }
    });


    $(TOGGLE_ANNOTATIONS_BUTTON).click(function () {
        if (shouldDisplayAnnotations) {
            //if annotations are on - turn them off (and remove current ones)
            shouldDisplayAnnotations = false;

            //reset button text
            $(this).text("Turn on annotations");

            //and remove any current ones on screen...
            $(ANNOTATIONS_ON_SCREEN_SELECTOR).remove();

        } else {
            //if they're off - turn them on (and put any current annotations that need to be on the screen onto the screen).
            shouldDisplayAnnotations = true;

            //reset button text
            $(this).text("Turn off annotations");

            //put any current annotations on the screen!!!
            putAllCurrentAnnotationsOnScreen();
        }

    });

    //Bind clicks within the progress bar to an appropriate event...
    $(PROGRESS_BAR_SELECTOR).bind('click', function (ev) {
        //get the x offset of the progress bar within the page
        var offset = $(PROGRESS_BAR_SELECTOR).offset().left;

        //the click x value that we want (relative to the progress bar) is going to
        //be equal to the mouse click x, minus the offset of the progress bar within the page.
        var x = ev.clientX - offset;

        //x contains where the user clicked within the bar... let's turn this into something useful...
        //(not entirely sure about the 2 here - was a magic number that seemed to work well...)
        var selectedTime = ((x / VIDEO_PLAYER_ELEMENT.duration) / 2);
        console.log('selected time = ' + selectedTime);
        //check the chosen time is within bounds, then update the video's current play time...
        if (selectedTime >= 0 && selectedTime <= VIDEO_PLAYER_ELEMENT.duration) {
            //it's within bounds - use it!

            //let the update method know that we're skipping via the progress bar...
            isSkipping = true;

            //and re-set the video's current time, automagically calling update and all other relevant methods/callbacks with it...
            VIDEO_PLAYER_ELEMENT.currentTime = selectedTime;
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
    Mousetrap.bind('a', function () { /* toggle annotations... */
        $(TOGGLE_ANNOTATIONS_BUTTON).trigger('click');
    });


});
