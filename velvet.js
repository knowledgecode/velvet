/**
 * @preserve velvet.js (c) KNOWLEDGECODE | MIT
 */
(function (global) {
    'use strict';

    var webAnimations = (function () {
        return !!document.createElement('div').animate;
    }());

    var cubic_bezier = (function () {
        /**
         * @preserve
         * https://github.com/gre/bezier-easing
         * BezierEasing - use bezier curve for transition easing function
         * by Gaëtan Renaudeau 2014 - 2015 – MIT License
         */

        // These values are established by empiricism with tests (tradeoff: performance VS precision)
        var NEWTON_ITERATIONS = 4;
        var NEWTON_MIN_SLOPE = 0.001;
        var SUBDIVISION_PRECISION = 0.0000001;
        var SUBDIVISION_MAX_ITERATIONS = 10;

        var kSplineTableSize = 11;
        var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

        var float32ArraySupported = typeof Float32Array === 'function';

        var A = function (aA1, aA2) {
            return 1.0 - 3.0 * aA2 + 3.0 * aA1;
        };
        var B = function (aA1, aA2) {
            return 3.0 * aA2 - 6.0 * aA1;
        };
        var C = function (aA1) {
            return 3.0 * aA1;
        };

        // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
        var calcBezier = function (aT, aA1, aA2) {
            return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
        };

        // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
        var getSlope = function (aT, aA1, aA2) {
            return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
        };

        var binarySubdivide = function (aX, aA, aB, mX1, mX2) {
            var currentX, currentT, i = 0;
            do {
                currentT = aA + (aB - aA) * 0.5;
                currentX = calcBezier(currentT, mX1, mX2) - aX;
                if (currentX > 0.0) {
                    aB = currentT;
                } else {
                    aA = currentT;
                }
            } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
            return currentT;
        };

        var newtonRaphsonIterate = function (aX, aGuessT, mX1, mX2) {
            for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
                var currentSlope = getSlope(aGuessT, mX1, mX2);
                if (currentSlope === 0.0) {
                    return aGuessT;
                }
                var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
                aGuessT -= currentX / currentSlope;
            }
            return aGuessT;
        };

        return function (mX1, mY1, mX2, mY2) {
            if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
                throw new Error('bezier x values must be in [0, 1] range');
            }

            /*global Float32Array */
            // Precompute samples table
            var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
            if (mX1 !== mY1 || mX2 !== mY2) {
                for (var i = 0; i < kSplineTableSize; ++i) {
                    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
                }
            }

            var getTForX = function (aX) {
                var intervalStart = 0.0;
                var currentSample = 1;
                var lastSample = kSplineTableSize - 1;

                for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
                    intervalStart += kSampleStepSize;
                }
                --currentSample;

                // Interpolate to provide an initial guess for t
                var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
                var guessForT = intervalStart + dist * kSampleStepSize;

                var initialSlope = getSlope(guessForT, mX1, mX2);
                if (initialSlope >= NEWTON_MIN_SLOPE) {
                    return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
                } else if (initialSlope === 0.0) {
                    return guessForT;
                }
                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
            };

            return function BezierEasing (x) {
                if (mX1 === mY1 && mX2 === mY2) {
                    return x; // linear
                }
                // Because JavaScript number are imprecise, we should guarantee the extremes are right.
                if (x === 0) {
                    return 0;
                }
                if (x === 1) {
                    return 1;
                }
                return calcBezier(getTForX(x), mY1, mY2);
            };
        };
    }());

    var bezier = {
        'ease': cubic_bezier(0.25, 0.1, 0.25, 1),
        'linear': cubic_bezier(0, 0, 1, 1),
        'ease-in': cubic_bezier(0.42, 0, 1, 1),
        'ease-out': cubic_bezier(0, 0, 0.58, 1),
        'ease-in-out': cubic_bezier(0.42, 0, 0.58, 1)
    };

    var resolvePrefix = function (target, name) {
        var prefix = ['webkit', 'moz', 'ms', 'o'], name2 = name, i, len;

        for (i = 0, len = prefix.length; !(name2 in target) && i < len; i++) {
            name2 = prefix[i] + name[0].toUpperCase() + name.slice(1);
        }
        return i < len ? name2 : '';
    };

    var frame = (function () {
        var queue = [], timerId = 0, lastTime = 0, fps = 1000 / 60,
            timer = function () {
                var t = Date.now(), d = t - lastTime, delay = Math.max(fps - d, 0);

                lastTime = t + delay;
                timerId = setTimeout(function () {
                    var timestamp = t + delay, i, count = queue.length;

                    if (!count) {
                        timerId = 0;
                        return;
                    }
                    for (i = 0; i < count; i++) {
                        queue[i](timestamp);
                    }
                    queue = queue.splice(count);
                    timer();
                }, delay);
                return timerId;
            };

        return global[resolvePrefix(global, 'requestAnimationFrame')] || function (callback) {
            queue[queue.length] = callback;
            return timerId || timer();
        };
    }());

    var transform = (function () {
        return resolvePrefix(document.createElement('div').style, 'transform');
    }());

    var t3d = (function () {
        var div = document.createElement('div');

        div.style[transform] = 'translateZ(0)';
        return !!div.style[transform];
    }());

    var map = function (array, f, array2) {
        array2 = array2 || new Array(array.length);
        for (var i = 0, len = array.length; i < len; i++) {
            array2[i] = f(array[i], i);
        }
        return array2;
    };

    var forEach = function (array, f) {
        for (var i = 0, len = array.length; i < len; i++) {
            f(array[i], i);
        }
    };

    var format = function (v, argv) {
        var i = 0, argc = argv.length, len = v.length - 1, r = v[0];

        while (i < len) {
            r += (i < argc ? argv[i] : '%s') + v[++i];
        }
        return r;
    };

    var Weaver = function (weaver) {
        this._weaver = weaver;
    };

    /**
     * play
     * @returns {Object} weaver object
     */
    Weaver.prototype.play = function () {
        this._weaver.play();
        return this;
    };

    /**
     * pause
     * @returns {Object} weaver object
     */
    Weaver.prototype.pause = function () {
        this._weaver.pause();
        return this;
    };

    /**
     * finish
     * @returns {Object} weaver object
     */
    Weaver.prototype.finish = function () {
        this._weaver.finish();
        return this;
    };

    /**
     * cancel
     * @returns {Object} weaver object
     */
    Weaver.prototype.cancel = function () {
        this._weaver.cancel();
        return this;
    };

    /**
     * reverse
     * @returns {Object} weaver object
     */
    Weaver.prototype.reverse = function () {
        this._weaver.reverse();
        return this;
    };

    /**
     * direction
     * @returns {number} playback direction (1 or -1)
     */
    Weaver.prototype.direction = function () {
        var direction = this._weaver.playbackRate || this._weaver.direction || 0;
        return direction > 0 ? 1 : direction < 0 ? -1 : 0;
    };

    var Textile = function () {
    };

    /**
     * weave
     * @param {Array.<number>} from - start values
     * @param {Array.<number>} to - end value
     * @param {Object} options - animation options
     * @param {function} cb - callback function
     * @returns {Object} weaver object
     */
    Textile.prototype.weave = function (from, to, options, cb) {
        var IDLE = 0, RUNNING = 2, PAUSED = 3, FINISHED = 4,
            b = bezier[options.easing || 'linear'],
            duration = options.duration || 1,
            diff = map(to, function (val, i) {
                return val - from[i];
            }),
            vals = new Array(diff.length),
            fn,
            weaver,
            w,
            elapsed = 0,
            reverse = false,
            run = function (delay) {
                frame(function (progress) {
                    weaver.startTime = progress - elapsed + (delay || 0);
                    fn(progress);
                });
            };

        weaver = {
            startTime: 0,
            playState: RUNNING,
            direction: 1,
            cancel: function () {
                // Clear the elapsed time
                elapsed = 0;

                if (this.playState === RUNNING) {
                    this.playState = IDLE;
                } else {
                    this.playState = IDLE;
                    run();
                }
            },
            pause: function () {
                if (this.playState === RUNNING) {
                    this.playState = PAUSED;
                }
            },
            play: function () {
                if (this.playState !== RUNNING) {
                    this.playState = RUNNING;
                    run();
                }
            },
            finish: function () {
                // Clear the elapsed time
                elapsed = 0;

                if (this.playState === RUNNING) {
                    this.playState = FINISHED;
                } else {
                    this.playState = FINISHED;
                    run();
                }
            },
            reverse: function () {
                if (!reverse) {
                    // Reverse the current playback direction
                    this.direction = ~this.direction + 1;
                }
                reverse = true;
                if (this.playState === RUNNING || this.playState === PAUSED) {
                    // Reverse the elapsed time
                    elapsed = duration - elapsed;
                }
                if (this.playState !== RUNNING) {
                    run();
                }
            },
            oncancel: options.oncancel,
            onfinish: options.onfinish
        };

        w = new Weaver(weaver);

        fn = function (progress) {
            var r;

            if (reverse) {
                reverse = !reverse;
                weaver.playState = RUNNING;
                weaver.startTime = progress - elapsed - (options.delay || 0);
            }

            progress -= weaver.startTime;

            if (weaver.playState === RUNNING) {
                elapsed = progress;
                if (progress < duration) {
                    if (progress >= 0) {
                        r = b((weaver.direction > 0 ? progress : duration - progress) / duration);
                        cb(map(diff, function (val, i) {
                            return from[i] + val * r;
                        }, vals));
                    }
                    frame(fn);
                    return;
                }
                weaver.playState = FINISHED;
            }
            if (weaver.playState === PAUSED) {
                return;
            }
            if (weaver.playState === IDLE) {
                cb(from);
                if (weaver.oncancel) {
                    weaver.oncancel.bind(w)();
                }
                return;
            }
            cb(!~weaver.direction ? from : to);
            // Clear the elapsed time
            elapsed = 0;
            if (weaver.onfinish) {
                weaver.onfinish.bind(w)();
            }
        };
        run(options.delay);
        return w;
    };

    var TRANSFORM_KEY = 'translateX_translateY_translateZ_scale_scaleX_scaleY_scaleZ_rotate_rotateX_rotateY_rotateZ_skewX_skewY_perspective'.split('_');
    var TRANSFORM_UNIT = 'px_px_px_____deg_deg_deg_deg_deg_deg_px'.split('_');
    var TRANSFORM_VAL = [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]; // default value

    var TRANSFORM_MAP = (function () {
        var m = {}, template = '%s(%s%s)'.split('%s');

        forEach(TRANSFORM_KEY, function (key, i) {
            m[key] = format(template, [key, '%s', TRANSFORM_UNIT[i]]);
        });
        return m;
    }());

    var TRANSFORM_DEF = (function () {
        var m = {};

        forEach(TRANSFORM_KEY, function (key, i) {
            m[key] = TRANSFORM_VAL[i];
        });
        return m;
    }());

    var OPACITY_MAP = {
        opacity: '%s'
    };

    var OPACITY_DEF = {
        opacity: 1
    };

    var mergeKeys = function (styles1, styles2) {
        var keys = Object.keys(styles1).slice();

        // Append new styles that were not exist the last time
        forEach(Object.keys(styles2), function (key) {
            if (!~keys.indexOf(key)) {
                keys[keys.length] = key;
            }
        });
        return keys;
    };

    var sortStyles = function (styles, transforms, opacity, css) {
        forEach(Object.keys(styles), function (key) {
            if (key in TRANSFORM_MAP) {
                transforms[key] = styles[key];
            } else if (key in OPACITY_MAP) {
                opacity[key] = styles[key];
            } else {
                css[key] = styles[key];
            }
        });
    };

    var getFunctions = function (keys, m) {
        var functions = '';

        forEach(keys, function (key) {
            functions += ' ' + m[key];
        });
        return functions.trim().split('%s');
    };

    var getValues = function (keys, styles, def) {
        return map(keys, function (key) {
            return key in styles ? styles[key] : def[key];
        });
    };

    var generateCache = function (keys, styles, def) {
        var cache = {};

        forEach(keys, function (key) {
            cache[key] = key in styles ? styles[key] : def[key];
        });
        return cache;
    };

    var Velvet = function (element) {
        // target element
        this.element = element;
        // last transform
        this.transforms = {};
        // last opacity
        this.opacity = {};
    };

    Velvet.prototype = new Textile();
    Velvet.prototype.constructor = Velvet;

    var textile = new Textile();

    /**
     * weave
     * @param {Object} styles - CSS Styles (transforms and opacity only)
     * @param {Object} options - animation options
     * @returns {Object} weaver object
     */
    Velvet.prototype.weave = function (styles, options) {
        var transforms = {}, opacity = {}, transformKeys, opacityKeys, transformFunctions, opacityFunctions,
            from = {}, to = {}, fromValues = [], toValues = [],
            weaver, w;

        sortStyles(styles, transforms, opacity, {});

        transformKeys = mergeKeys(this.transforms, transforms);
        opacityKeys = mergeKeys(this.opacity, opacity);

        transformFunctions = getFunctions(transformKeys, TRANSFORM_MAP);

        // Enable GPU if supported
        if (transformFunctions.length && t3d) {
            transformFunctions[transformFunctions.length - 1] += ' translateZ(0)';
        }
        opacityFunctions = getFunctions(opacityKeys, OPACITY_MAP);

        if (webAnimations) {
            if (transformFunctions.length) {
                from[transform] = format(transformFunctions, getValues(transformKeys, this.transforms, TRANSFORM_DEF));
                to[transform] = format(transformFunctions, getValues(transformKeys, transforms, this.transforms));
            }
            if (opacityFunctions.length) {
                from.opacity = format(opacityFunctions, getValues(opacityKeys, this.opacity, OPACITY_DEF));
                to.opacity = format(opacityFunctions, getValues(opacityKeys, opacity, this.opacity));
            }

            weaver = this.element.animate([ from, to ], {
                delay: options.delay || 0,
                duration: options.duration || 0,
                easing: options.easing || 'linear',
                fill: 'both'
            });

            w = new Weaver(weaver);

            weaver.oncancel = function () {
                if (options.oncancel) {
                    options.oncancel.bind(w)();
                }
            };

            weaver.onfinish = function () {
                // Save the transforms and the opacity
                this.transforms = generateCache(transformKeys, transforms, this.transforms);
                this.opacity = generateCache(opacityKeys, opacity, this.opacity);
                if (options.onfinish) {
                    options.onfinish.bind(w)();
                }
            }.bind(this);

        } else {
            if (transformFunctions) {
                fromValues = getValues(transformKeys, this.transforms, TRANSFORM_DEF);
                toValues = getValues(transformKeys, transforms, this.transforms);
            }
            if (opacityFunctions) {
                fromValues = fromValues.concat(getValues(opacityKeys, this.opacity, OPACITY_DEF));
                toValues = toValues.concat(getValues(opacityKeys, opacity, this.opacity));
            }

            w = textile.weave(fromValues, toValues, {
                delay: options.delay,
                duration: options.duration,
                easing: options.easing,
                oncancel: function () {
                    if (options.oncancel) {
                        options.oncancel.bind(w)();
                    }
                },
                onfinish: function () {
                    // Save the transforms and the opacity
                    this.transforms = generateCache(transformKeys, transforms, this.transforms);
                    this.opacity = generateCache(opacityKeys, opacity, this.opacity);
                    if (options.onfinish) {
                        options.onfinish.bind(w)();
                    }
                }.bind(this)
            }, function (d) {
                var style = this.element.style;

                if (transformFunctions.length) {
                    style[transform] = format(transformFunctions, d);
                }
                if (opacityFunctions.length) {
                    style.opacity = format(opacityFunctions, [d[d.length - 1]]);
                }
            }.bind(this));
        }

        return w;
    };

    /**
     * style
     * @param {Object} styles - CSS Styles
     * @returns {Object} velvet instance
     */
    Velvet.prototype.style = function (styles) {
        /* NOTE: This method will not take care of Vendor Prefix except "transform" property. */

        var transforms = {}, opacity = {}, css = {},
            transformKeys, opacityKeys, transformFunctions, opacityFunctions,
            style = this.element.style;

        sortStyles(styles, transforms, opacity, css);

        transformKeys = mergeKeys(this.transforms, transforms);
        opacityKeys = mergeKeys(this.opacity, opacity);

        transformFunctions = getFunctions(transformKeys, TRANSFORM_MAP);
        opacityFunctions = getFunctions(opacityKeys, OPACITY_MAP);

        forEach(Object.keys(css), function (key) {
            style[key] = css[key];
        });
        if (transformFunctions.length) {
            style[transform] = format(transformFunctions, getValues(transformKeys, transforms, this.transforms));
        }
        if (opacityFunctions.length) {
            style.opacity = format(opacityFunctions, getValues(opacityKeys, opacity, this.opacity));
        }

        this.transforms = generateCache(transformKeys, transforms, this.transforms);
        this.opacity = generateCache(opacityKeys, opacity, this.opacity);

        return this;
    };

    /**
     * velvet
     * @param {Object} element - target element
     * @returns {Object} velvet or textile instance
     */
    var velvet = function (element) {
        return element ? new Velvet(element) : textile;
    };

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = velvet;
    } else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return velvet;
        });
    } else {
        global.velvet = velvet;
    }

}(this));

