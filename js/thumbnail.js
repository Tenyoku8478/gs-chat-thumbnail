var queues = {}
function getThumbnailUrl(userId, callback) {
    var userIdQueue = queues[userId];
    if(!userIdQueue) queues[userId] = userIdQueue = [];
    userIdQueue.push(callback);
    if(userIdQueue.length == 1) {
        var name = 'thumbnail/'+userId;
        chrome.storage.local.get(name, function(obj) {
            var thumbnail = obj[name];
            if(!thumbnail) {
                $.get(
                    url='/user/'+userId+'/',
                    success = function(data, state, jqXHR) {
                        var json = $(data).find('script:contains(thumbnail)').text();
                        if(json) {
                            var obj = JSON.parse(json);
                            thumbnail = obj.feeds[0].subList[0].user.thumbnail;
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
                        }
                        else {
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
                                    }
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
    $('.msgrow:has(.userID):not(.thumbnailed):not(.thumbnailing)').each(function() {
        var $this = $(this);
        $this.addClass('thumbnailing');
        var userId = $this.find('.userID').attr('data-id');
        getThumbnailUrl(userId, function(thumbnail) {
            $this.find('.info').after('<img src="'+thumbnail+'" />');
            $this.removeClass('thumbnailing').addClass('thumbnailed');
        });
    });
}
