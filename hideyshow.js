$(document).ready(function(){
  $("#showVA").hide();

  $("#hideVA").click(function(){
    $("#hideVA").hide();
    $("#showVA").show();
    $('video').animate({"width" : "600px"});
    $('#vidAnnotation').hide();
  });

  $("#showVA").click(function(){
    $("#showVA").hide();
    $("#hideVA").show();
    $('video').animate({"width" : "400px"}, function(){
      $("#vidAnnotation").show();
    });
  });
});
