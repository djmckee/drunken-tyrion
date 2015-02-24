$(document).ready(function(){
  $("#showVA").hide();

  $("#hideVA").click(function(){
    $("#vidAnnotation").hide();
    $("#hideVA").hide();
    $("#showVA").show();
    $('video').css('width','600px');
  });

  $("#showVA").click(function(){
    $("#vidAnnotation").show();
    $("#showVA").hide();
    $("#hideVA").show();
    $('video').css('width','400px');
  });
});
