(function (global) {
    'use strict';

    var touchable = (function () {
        var div = document.createElement('div');

        return !div.ontouchstart && typeof div.ontouchstart === 'object' &&
            !div.ontouchend && typeof div.ontouchend === 'object';
    }());

    var SilkTouch = function (element) {
        var events = {};

        var add = function (eventName, handler) {
            element.addEventListener(eventName, handler, false);
            return handler;
        };

        var remove = function (eventName, handler) {
            element.removeEventListener(eventName, handler, false);
        };

        this.on = function (handler) {
            var sx, sy;

            if (touchable) {
                events.touchstart = add('touchstart', function (evt) {
                    sx = evt.changedTouches[0].pageX;
                    sy = evt.changedTouches[0].pageY;
                });
                events.touchend = add('touchend', function (evt) {
                    var ex, ey;

                    evt.preventDefault();
                    ex = evt.changedTouches[0].pageX;
                    ey = evt.changedTouches[0].pageY;
                    if (Math.abs(ex - sx) > 10 || Math.abs(ey - sy) > 10) {
                        return;
                    }
                    handler.call(this, evt);
                });
                events.click = add('click', function (evt) {
                    evt.preventDefault();
                });
            } else {
                events.click = add('click', handler);
            }
        };

        this.off = function () {
            if (touchable) {
                remove('touchstart', events.touchstart);
                remove('touchend', events.touchend);
                remove('click', events.click);
            } else {
                remove('click', element, events.click);
            }
            events = {};
        };
    };

    global.SilkTouch = global.SilkTouch || SilkTouch;

}(this));

