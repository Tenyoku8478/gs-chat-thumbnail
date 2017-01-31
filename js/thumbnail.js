function triggerCallbacks(callbacks, thumbnail) {
  for(let i=0; i<callbacks.length; i+=1) {
    callbacks[i](thumbnail); // callback, is likly attaching thumbnail to webpage
  }
  callbacks.length = 0;
}

function getThumbnailFromUser(userId) {
  return new Promise((resolve, reject) => {
    $.get(url='/user/'+userId+'/', success=(data) => {
      const json = $(data).find('script:contains(thumbnail)').text();
      if(!json) resolve(null);
      const thumbnail = JSON.parse(json).feeds[0].subList[0].user.thumbnail;
      resolve(thumbnail);
    });
  });
}

function getThumbnailFromOnline(userId) {
  return new Promise((resolve, reject) => {
    $.get(url='/site/online/', success=(data) => {
      let thumbnail = $(data).find('.user_icon[href="user/'+userId+'/"]').css('background-image');
      if(!thumbnail) resolve(null);
      thumbnail = thumbnail.substring(4, thumbnail.length-1);
      resolve(thumbnail);
    });
  });
}

function cacheThumbnail(name, thumbnail) {
  return new Promise((resolve, reject) => {
    var list = {};
    list[name] = thumbnail;
    chrome.storage.local.set(list, resolve);
  });
}

const queues = {}
function getThumbnailUrl(userId, callback) {
  // use queue to buffer requests for the same user
  let userIdQueue = queues[userId];
  if(!userIdQueue) userIdQueue = queues[userId] = [];
  userIdQueue.push(callback);

  // not first call: wait for the first call trigger callbacks
  if(userIdQueue.length > 1) return;

  const name = 'thumbnail/'+userId;
  // try to get the thumbnail in storage
  chrome.storage.local.get(name, (obj) => {
    const thumbnail = obj[name];
    if(thumbnail) triggerCallbacks(userIdQueue, thumbnail);
    else {
      getThumbnailFromUser(userId)
        .then((thumbnail) => {
          if(!thumbnail) return getThumbnailFromOnline(userId);
          else return thumbnail;
        })
        .then((thumbnail) => {
          if(!thumbnail) return 'http://gameschool.cc/images/user.jpg';
          else return thumbnail;
        })
        .then((thumbnail) => cacheThumbnail(name, thumbnail))
        .then((thumbnail) => triggerCallbacks(userIdQueue, thumbnail))
    }
  });
}

function attachThumbnail() {
  // select not thumbnailed messages
  $('.msgrow:has(.userID):not(.thumbnailed):not(.thumbnailing)').each(function() {
    const $this = $(this);
    // lock the item to prevent duplicate attach
    $this.addClass('thumbnailing');
    // get user id from .userID
    const userId = $this.find('.userID').attr('data-id');
    getThumbnailUrl(userId, (thumbnail) => {
      // callback: add img tag to message
      $this.find('.info').after('<img src="'+thumbnail+'" />');
      $this.removeClass('thumbnailing').addClass('thumbnailed');
    });
  });
}
