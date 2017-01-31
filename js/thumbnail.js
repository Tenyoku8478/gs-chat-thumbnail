var queues = {}
function getThumbnailUrl(userId, callback) {
  // use queue to buffer requests for same user
  var userIdQueue = queues[userId];
  if(!userIdQueue) queues[userId] = userIdQueue = [];
  userIdQueue.push(callback);
  if(userIdQueue.length == 1) { // if this is the only element in queue, get thumbnail
    var name = 'thumbnail/'+userId;
    chrome.storage.local.get(name, function(obj) { // try to get the thumbnail in storage
      var thumbnail = obj[name];
      if(!thumbnail) { // if thumbnail is not cached in storage
        $.get(
          url='/user/'+userId+'/',
          success = function(data, state, jqXHR) {
            var json = $(data).find('script:contains(thumbnail)').text();
            if(json) { // if has status on profile page
              var obj = JSON.parse(json);
              thumbnail = obj.feeds[0].subList[0].user.thumbnail;
              var list = {};
              list[name] = thumbnail;
              chrome.storage.local.set(list, // save to storage, and then call all callbacks in the queue
                function() {
                  for(var i=0; i<userIdQueue.length; i+=1) {
                    userIdQueue[i](thumbnail); // callback, is likly attaching thumbnail to webpage
                  }
                  queues[userId] = [];
                }
              );
            }
            else { // if not, get thumbnail from online page
              $.get(
                url='/site/online/',
                success = function(data, state, jqXHR) {
                  thumbnail = $(data).find('.user_icon[href="user/'+userId+'/"]').css('background-image');
                  if(thumbnail) {
                    thumbnail = thumbnail.substring(4, thumbnail.length-1);
                    var list = {};
                    list[name] = thumbnail;
                    chrome.storage.local.set(list,
                      function() {
                        for(var i=0; i<userIdQueue.length; i+=1) {
                          userIdQueue[i](thumbnail);
                        }
                        queues[userId] = [];
                      }
                    );
                  } // else I have no idea where I can get the thumbnail QAQ
                }
              );
            }
          }
        );
      }
      else {
        for(var i=0; i<userIdQueue.length; i+=1) {
          userIdQueue[i](thumbnail);
        }
        queues[userId] = [];
      }
    });
  }
}
function attachThumbnail() {
  // select not thumbnailed messages
  $('.msgrow:has(.userID):not(.thumbnailed):not(.thumbnailing)').each(function() {
    var $this = $(this);
    $this.addClass('thumbnailing'); // lock to prevent duplicate attach
    var userId = $this.find('.userID').attr('data-id'); // get user id from .userID
    getThumbnailUrl(userId, function(thumbnail) {
      // callback: add img tag to message
      $this.find('.info').after('<img src="'+thumbnail+'" />');
      $this.removeClass('thumbnailing').addClass('thumbnailed');
    });
  });
}
