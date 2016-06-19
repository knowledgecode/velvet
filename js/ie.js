(function (global) {
    'use strict';

    global.ie = (function () {
        var ua = navigator.userAgent.toLowerCase();

        if (~ua.indexOf('compatible; msie 9.')) {
            return '9';
        } else if (~ua.indexOf('compatible; msie 10.')) {
            return '10';
        } else if (~ua.indexOf('trident/7.0;')) {
            return '11';
        }
        return '';
    }());

}(this));

