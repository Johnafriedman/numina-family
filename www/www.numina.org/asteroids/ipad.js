let is_iPad = /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1;

const deviceType = () => {
  const ua = navigator.userAgent;
  return "tablet";
  //
  // if (/(tablet|ipad|iPad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || is_iPad)  {
  //   return "tablet";
  // }
  // else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
  //   return "mobile";
  // }
  // return "desktop";
};

if (deviceType()=="tablet") {
  $(function () {
    $('#left-controls, #right-controls').show();
    $('body > *').hide();
    $('body').css('margin', '0px').css('background', 'black').prepend($('#game-container').remove());
    $('#game-container').width(1024).css('margin-top', 26).show();
    $('#canvas').attr('width', 1020).attr('height', 660).css('background', 'white').css('margin', '0 1');

    $('head').prepend($('<meta/>').attr('name', 'viewport').attr('content', 'width=device-width; height=device-height; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;'));

    $('#left-controls, #right-controls').bind('touchstart touchmove touchend', function (e) {
      if (e.type != 'touchend') {
        for (k in KEY_STATUS) {
          KEY_STATUS[k] = false;
        }
      }
      var touches = e.type == 'touchend' ? e.originalEvent.changedTouches : e.originalEvent.touches
      for (var i = 0; i < touches.length; i++) {
        var ele = document.elementFromPoint(touches[i].pageX, touches[i].pageY);
        KEY_STATUS[ele.id] = (e.type != 'touchend');
      }
    });

    $(document).bind('touchstart', function (e) {
      window.gameStart = true;
    });

    $(document).bind('gesturestart gesturechange gestureend touchstart touchmove touchend', function (e) {
      e.preventDefault();
    });
  });
}

