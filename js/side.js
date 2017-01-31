var interval = null;
if($('.chatroom').length > 0) {
  interval = setInterval(attachThumbnail, 500);
}
$('.chatroom_icon').click(function (){
  interval = setInterval(attachThumbnail, 500);
});
$('.ic_btn#close').click(function (){
  clearInterval(interval);
  interval = null;
});
