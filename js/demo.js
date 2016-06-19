/*global velvet, silktouch */
(function (global) {
    'use strict';

    var forEach = Array.prototype.forEach;

    if (global.ie === '9') {
        forEach.call(document.getElementsByClassName('not-supported'), function (span) {
            span.style.display = 'inline';
        });
    } else if (~navigator.userAgent.indexOf('Android 4.0')) {
        forEach.call(document.getElementsByClassName('anim-box'), function (box) {
            box.style.overflowY = 'hidden';
        });
    }

    var examples = {};
    var options = function (element) {
        var showElement = function () { element.parentElement.parentElement.getElementsByClassName('play')[0].style.display = ''; };
        return { duration: 2000, easing: 'ease', oncancel: showElement, onfinish: showElement };
    };
    var styles = {
        translateX: function (element) { return velvet(element).weave({ translateX: 200 }, options(element)).cancel(); },
        translateY: function (element) { return velvet(element).weave({ translateY: 200 }, options(element)).cancel(); },
        translateZ: function (element) { return velvet(element).weave({ translateZ: 99 }, options(element)).cancel(); },
        scale: function (element) { return velvet(element).weave({ scale: 10 }, options(element)).cancel(); },
        scaleX: function (element) { return velvet(element).weave({ scaleX: 10 }, options(element)).cancel(); },
        scaleY: function (element) { return velvet(element).weave({ scaleY: 10 }, options(element)).cancel(); },
        scaleZ: function (element) { return velvet(element).style({ scaleZ: 1, rotateY: 60 }).weave({ scaleZ: 11.6 }, options(element)).cancel(); },
        rotate: function (element) { return velvet(element).weave({ rotate: 180 }, options(element)).cancel(); },
        rotateX: function (element) { return velvet(element).weave({ rotateX: 180 }, options(element)).cancel(); },
        rotateY: function (element) { return velvet(element).weave({ rotateY: 180 }, options(element)).cancel(); },
        rotateZ: function (element) { return velvet(element).weave({ rotateZ: 180 }, options(element)).cancel(); },
        skewX: function (element) { return velvet(element).weave({ skewX: 75 }, options(element)).cancel(); },
        skewY: function (element) { return velvet(element).weave({ skewY: 75 }, options(element)).cancel(); },
        opacity: function (element) { return velvet(element).weave({ opacity: 0 }, options(element)).cancel(); },
        scroll: function (element) {
            return velvet().weave([0], [element.scrollHeight - element.clientHeight], options(element), function (d) {
                element.scrollTop = d[0];
            }).cancel();
        },
        color: function (element) {
            return velvet().weave([255, 0, 0], [0, 255, 255], options(element), function (d) {
                d[0] |= 0;
                d[1] |= 0;
                d[2] |= 0;
                element.style.backgroundColor = 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
            }).cancel();
        }
    };

    window.addEventListener('load', function () {
        Object.keys(styles).forEach(function (id) {
            examples[id] = styles[id](document.getElementById(id));
        });

        silktouch.on('play', '.play', function () {
            examples[this.getAttribute('data-example-id')].play();
            this.parentElement.getElementsByClassName('play')[0].style.display = 'none';
        });

        silktouch.on('pause', '.pause', function () {
            examples[this.getAttribute('data-example-id')].pause();
            this.parentElement.getElementsByClassName('play')[0].style.display = '';
        });

        silktouch.on('cancel', '.cancel', function () {
            examples[this.getAttribute('data-example-id')].cancel();
        });

        silktouch.on('finish', '.finish', function () {
            examples[this.getAttribute('data-example-id')].finish();
        });

        silktouch.on('reverse', '.reverse', function () {
            var w = examples[this.getAttribute('data-example-id')];

            if (w.direction() > 0) {
                this.style.backgroundColor = '#7f7';
            } else {
                this.style.backgroundColor = '';
            }
            w.reverse();
            this.parentElement.getElementsByClassName('play')[0].style.display = 'none';
        });
    });

}(this));

