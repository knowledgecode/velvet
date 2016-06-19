/*global velvet, silktouch */
(function (global) {
    'use strict';

    var onload;

    if (global.ie === '9') {
        onload = function () {
            var cube = document.getElementById('cube');
            var w = velvet(cube).weave({
                rotate: 360
            }, {
                duration: 1000, easing: 'ease-in-out', onfinish: function () { this.reverse(); }
            });

            var pause = false;

            silktouch.on('cube', '#cube', function () {
                if (pause) {
                    w.play();
                } else {
                    w.pause();
                }
                pause = !pause;
            });
        };
    } else if (global.ie === '10' || global.ie === '11') {
        onload = function () {
            var cube1 = velvet(document.getElementById('cube1'));
            var cube2 = velvet(document.getElementById('cube2'));
            var cube3 = velvet(document.getElementById('cube3'));
            var cube4 = velvet(document.getElementById('cube4'));
            var cube5 = velvet(document.getElementById('cube5'));
            var cube6 = velvet(document.getElementById('cube6'));
            var options = {
                duration: 2500,
                easing: 'linear',
                onfinish: function () { this.play(); }
            };

            var w1 = cube1.style({
                rotateX: 0, rotateY: 90, rotateZ: 0, transformOrigin: '50% 50% -60px', backfaceVisibility: 'hidden'
            }).weave({
                rotateX: 360, rotateY: 450, rotateZ: 0
            }, options);

            var w2 = cube2.style({
                rotateX: 0, rotateY: 0, rotateZ: 0, transformOrigin: '50% 50% -60px', backfaceVisibility: 'hidden'
            }).weave({
                rotateX: 360, rotateY: 360, rotateZ: 0
            }, options);

            var w3 = cube3.style({
                rotateX: 90, rotateY: 0, rotateZ: 0, transformOrigin: '50% 50% -60px', backfaceVisibility: 'hidden'
            }).weave({
                rotateX: 450, rotateY: 0, rotateZ: -360
            }, options);

            var w4 = cube4.style({
                rotateX: -90, rotateY: 0, rotateZ: 0, translateZ: 0, transformOrigin: '50% 50% -60px', backfaceVisibility: 'hidden'
            }).weave({
                rotateX: 270, rotateY: 0, rotateZ: 360
            }, options);

            var w5 = cube5.style({
                rotateX: 0, rotateY: 180, rotateZ: 0, transformOrigin: '50% 50% -60px', backfaceVisibility: 'hidden'
            }).weave({
                rotateX: 360, rotateY: 540, rotateZ: 0
            }, options);

            var w6 = cube6.style({
                rotateX: 0, rotateY: 270, rotateZ: 0, transformOrigin: '50% 50% -60px', backfaceVisibility: 'hidden'
            }).weave({
                rotateX: 360, rotateY: 630, rotateZ: 0
            }, options);

            var pause = false;

            silktouch.on('cube', '#cube', function () {
                if (pause) {
                    w1.play();
                    w2.play();
                    w3.play();
                    w4.play();
                    w5.play();
                    w6.play();
                } else {
                    w1.pause();
                    w2.pause();
                    w3.pause();
                    w4.pause();
                    w5.pause();
                    w6.pause();
                }
                pause = !pause;
            });
        };
    } else {
        onload = function () {
            var cube = document.getElementById('cube');
            var w = velvet(cube).weave({
                rotateX: 1400, rotateY: -1000, rotateZ: 600
            }, {
                duration: 10000, easing: 'ease-in-out', onfinish: function () { this.reverse(); }
            });

            var pause = false;

            silktouch.on('cube', '#cube', function () {
                if (pause) {
                    w.play();
                } else {
                    w.pause();
                }
                pause = !pause;
            });
        };
    }

    window.addEventListener('DOMContentLoaded', onload);

}(this));

