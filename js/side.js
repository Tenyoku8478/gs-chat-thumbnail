var interval = null;
if($('.chatroom').length > 0) {
  initThumbnail();
  interval = setInterval(attachThumbnail, 500);
}
$('.chatroom_icon').click(() => {
  initThumbnail();
  interval = setInterval(attachThumbnail, 500);
});
$('.ic_btn#close').click(() => {
  clearInterval(interval);
  interval = null;
});
