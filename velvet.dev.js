/**
 * @preserve velvet.js (c) KNOWLEDGECODE | MIT
 */
(function (global) {
    'use strict';

    var cubic_bezier = (function () {
        var module = {};
// << It will inject `bezier-easing` here with `npm run build` command.
// >>
        return module.exports;
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

    var webAnimations = (function () {
        var div = document.createElement('div');
        return 'animate' in Element.prototype && !!(div.animate([]).play) && !!(div.animate([]).effect);
    }());

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
                    queue.splice(0, count);
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

    var format = function (f, isArrayType) {
        var v = (arguments.length ? f + '' : '').split('%s'), len = v.length - 1;
        if (isArrayType) {
            return function (argv) {
                var i = 0, r = v[0];
                while (i < len) {
                    r += argv[i] + v[++i];
                }
                return r;
            };
        }
        return function () {
            var i = 0, r = v[0];
            while (i < len) {
                r += arguments[i] + v[++i];
            }
            return r;
        };
    };

    var TRANSFORM_KEY = 'translateX_translateY_translateZ_scale_scaleX_scaleY_scaleZ_rotate_rotateX_rotateY_rotateZ_skewX_skewY_perspective'.split('_');
    var TRANSFORM_UNIT = 'px_px_px_____deg_deg_deg_deg_deg_deg_px'.split('_');
    var TRANSFORM_VAL = [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]; // default value

    var TRANSFORM_MAP = (function () {
        var m = {}, template = format('%s(%s%s)');

        forEach(TRANSFORM_KEY, function (key, i) {
            m[key] = template(key, '%s', TRANSFORM_UNIT[i]);
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

    var IDLE = 'idle', RUNNING = 'running', PAUSED = 'paused', FINISHED = 'finished', INVALID = 'invalid';

    var Weaver = function (weavers, options) {
        this._weavers = weavers;
        this._options = options;
        this._playState = RUNNING;
    };

    Weaver.prototype._reset = function () {
        if (this._playState !== IDLE && this._playState !== INVALID) {
            forEach(this._weavers, function (w) {
                w.cancel();
            });
            this._playState = IDLE;
        }
        return this;
    };

    Weaver.prototype._unravel = function () {
        this._weavers = undefined;
        this._options = undefined;
        this._playState = INVALID;
    };

    /**
     * play
     * @returns {Object} weaver object
     */
    Weaver.prototype.play = function () {
        if (this._playState !== RUNNING && this._playState !== INVALID) {
            forEach(this._weavers, function (w) {
                w.play();
            });
            this._playState = RUNNING;
        }
        return this;
    };

    /**
     * cancel
     * @returns {Object} weaver object
     */
    Weaver.prototype.cancel = function () {
        var playState = this._playState;

        if (playState !== IDLE && playState !== INVALID) {
            this._reset();
            if (playState !== FINISHED) {
                this._options.oncancel();
            }
        }
        return this;
    };

    /**
     * pause
     * @returns {Object} weaver object
     */
    Weaver.prototype.pause = function () {
        if (this._playState === RUNNING) {
            forEach(this._weavers, function (w) {
                w.pause();
            });
            this._playState = PAUSED;
        }
        return this;
    };

    /**
     * finish
     * @returns {Object} weaver object
     */
    Weaver.prototype.finish = function () {
        var playState = this._playState;

        if (playState !== FINISHED && playState !== INVALID) {
            forEach(this._weavers, function (w) {
                w.finish();
            });
            this._playState = FINISHED;
            if (playState !== IDLE) {
                frame(this._options.onfinish);
            }
        }
        return this;
    };

    /**
     * reverse
     * @returns {Object} weaver object
     */
    Weaver.prototype.reverse = function () {
        if (this._playState !== INVALID) {
            forEach(this._weavers, function (w) {
                w.reverse();
            });
            this._playState = RUNNING;
        }
        return this;
    };

    /**
     * direction
     * @returns {number} playback direction (1 or -1)
     */
    Weaver.prototype.direction = function () {
        var direction = this._weavers[0].playbackRate || 0;
        return direction > 0 ? 1 : direction < 0 ? -1 : 0;
    };

    /**
     * progress
     * @returns {number} playback progress (0 to 1)
     */
    Weaver.prototype.progress = function () {
        return this._options.progress();
    };

    var Animation = function (options, cb) {
        var progress = 0, b = bezier[options.easing],
            total = options.duration + options.delay,
            duration = options.duration || 1, delay = options.delay;

        var fn = function (time) {
            var p;

            if (this._reverse) {
                this._reverse = false;
                this.startTime = time;
            }
            if (this.playState !== RUNNING) {
                return;
            }
            p = this._offset + this.playbackRate * (time - this.startTime);
            this.currentTime = p > total ? total : p < 0 ? 0 : p;

            if (p > delay && p < total) {
                progress = b((p - delay) / duration);
                cb(progress);
            }
            if (p >= 0 && p <= total) {
                frame(fn);
                return;
            }
            this.playState = FINISHED;
            this.onfinish();
            options.onfinish();
        }.bind(this);

        this.currentTime = 0;
        this.effect = { getComputedTiming: function () { return { progress: progress }; } };
        this.oncancel = function () {
            this._offset = this.currentTime;
            progress = 0;
            cb(progress);
        }.bind(this);
        this.onfinish = function () {
            this._offset = this.currentTime;
            progress = this.playbackRate > 0 ? 1 : 0;
            cb(progress);
        }.bind(this);
        this.playState = RUNNING;
        this.playbackRate = 1;
        this.startTime = 0;
        this._offset = 0;
        this._options = options;
        this._reverse = false;
        this._run = function () {
            frame(function (time) {
                this.startTime = time;
                fn(time);
            }.bind(this));
        }.bind(this);

        this._run();
    };

    Animation.prototype.cancel = function () {
        this.currentTime = 0;
        this.playState = IDLE;
        this.oncancel();
    };

    Animation.prototype.finish = function () {
        this.currentTime = this.playbackRate > 0 ? this._options.duration + this._options.delay : 0;
        this.playState = FINISHED;
        this.onfinish();
    };

    Animation.prototype.pause = function () {
        this._offset = this.currentTime;
        this.playState = PAUSED;
    };

    Animation.prototype.play = function () {
        if (this.playState === IDLE || this.playState === FINISHED) {
            this._offset = this.playbackRate > 0 ? 0 : this._options.duration + this._options.delay;
        }
        this.playState = RUNNING;
        this._run();
    };

    Animation.prototype.reverse = function () {
        // Reverse the current playback direction
        this.playbackRate *= -1;

        if (this.playState === RUNNING) {
            this._offset = this.currentTime;
            this._reverse = true;
        } else {
            if (this.playState === IDLE || this.playState === FINISHED) {
                this._offset = this.playbackRate > 0 ? 0 : this._options.duration + this._options.delay;
            }
            this.playState = RUNNING;
            this._run();
        }
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
        var diff = map(to, function (val, i) {
                return val - from[i];
            }),
            vals = new Array(diff.length),
            animation,
            weaver,
            delay = options.delay || 0,
            duration = options.duration || 0,
            easing = options.easing || 'linear';

        animation = new Animation({
            delay: delay,
            duration: duration,
            easing: easing,
            onfinish: function () {
                weaver.finish.bind(weaver)();
            }
        }, function (progress) {
            cb(map(diff, function (val, i) {
                return from[i] + val * progress;
            }, vals));
        });

        weaver = new Weaver([animation], {
            duration: duration,
            easing: easing,
            progress: function () {
                return animation.effect.getComputedTiming().progress;
            },
            oncancel: options.oncancel || function () {},
            onfinish: options.onfinish || function () {}
        });

        return weaver;
    };

    var textile = new Textile();

    var sortStyles = function (styles, transforms, opacity, css) {
        forEach(Object.keys(styles), function (key) {
            if (key in TRANSFORM_MAP) {
                transforms[key] = styles[key];
            } else if (key in OPACITY_MAP) {
                opacity[key] = styles[key];
            } else if (css) {
                css[key] = styles[key];
            }
        });
    };

    var mergeKeys = function (styles1, styles2) {
        var keys = Object.keys(styles1);

        forEach(Object.keys(styles2), function (key) {
            if (!~keys.indexOf(key)) {
                keys[keys.length] = key;
            }
        });
        return keys;
    };

    var getFunctions = function (keys, functionMap) {
        var functions = '';

        forEach(keys, function (key) {
            functions += ' ' + functionMap[key];
        });
        return functions.trim();
    };

    var cacheStyle = function (keys, styles1, styles2) {
        var cache = {};

        forEach(keys, function (key) {
            cache[key] = key in styles1 ? styles1[key] : styles2[key];
        });
        return cache;
    };

    var Velvet = function (elements) {
        // target elements
        this._elements = typeof elements.length === 'number' ? elements : [elements];
        // a weaver object
        this._weaver = undefined;
        // current transforms
        this._transforms = {};
        // a current opacity
        this._opacity = {};
        // current transform keys
        this._transformKeys = undefined;
        // a current opacity key
        this._opacityKeys = undefined;
        // current style values
        this._values = undefined;
    };

    Velvet.prototype._mergeTransformKeys = function (styles) {
        var keys = mergeKeys(this._transforms, styles);
        this._transformKeys = keys;
        return keys;
    };

    Velvet.prototype._mergeOpacityKeys = function (styles) {
        var keys = mergeKeys(this._opacity, styles);
        this._opacityKeys = keys;
        return keys;
    };

    Velvet.prototype._getTransformFunctions = function (keys) {
        var functions = getFunctions(keys, TRANSFORM_MAP);

        // Force GPU enabled if needed.
        if (!webAnimations && t3d && functions) {
            functions += ' translateZ(0)';
        }
        return functions;
    };

    Velvet.prototype._getOpacityFunctions = function (keys) {
        return getFunctions(keys, OPACITY_MAP);
    };

    Velvet.prototype._generateValues = function (transformKeys, transforms, opacityKeys, opacity) {
        var f = function (keys, styles, def) {
                return map(keys, function (key) {
                    return key in styles ? styles[key] : def[key];
                });
            }, values = [
                f(transformKeys, this._transforms, TRANSFORM_DEF).concat(f(opacityKeys, this._opacity, OPACITY_DEF)),
                f(transformKeys, transforms, this._transforms).concat(f(opacityKeys, opacity, this._opacity))
            ];

        this._values = values;
        return values;
    };

    Velvet.prototype._cacheTransform = function (keys, styles) {
        this._transforms = cacheStyle(keys, styles, this._transforms);
    };

    Velvet.prototype._cacheOpacity = function (keys, styles) {
        this._opacity = cacheStyle(keys, styles, this._opacity);
    };

    Velvet.prototype._pin = function () {
        var transforms = {}, opacity = {}, progress, from, to, values,
            transformKeys = this._transformKeys, opacityKeys = this._opacityKeys, transformValue, opacityValue;

        if (this._weaver) {
            if (this._weaver._playState !== IDLE && this._weaver._playState !== INVALID) {
                if (this._weaver._playState === RUNNING) {
                    this._weaver.pause();
                }

                progress = this._weaver.progress();
                from = this._values[0];
                to = this._values[1];
                values = map(from, function (val, i) {
                    return val + (to[i] - val) * progress;
                });

                forEach(transformKeys, function (key, i) {
                    transforms[key] = values[i];
                });
                if (opacityKeys.length) {
                    opacity.opacity = values[values.length - 1];
                }
                // Save the transforms and the opacity
                this._cacheTransform(transformKeys, transforms);
                this._cacheOpacity(opacityKeys, opacity);

                if (webAnimations) {
                    transformValue = format(this._getTransformFunctions(transformKeys), true)(values);
                    opacityValue = format(this._getOpacityFunctions(opacityKeys))(values[values.length - 1]);

                    forEach(this._elements, function (element) {
                        var style = element.style;

                        style[transform] = transformValue;
                        style.opacity = opacityValue;
                    });
                    this._weaver._reset();
                }
            }
            this._weaver._unravel();
            this._weaver = undefined;
        }
    };

    /**
     * weave
     * @param {Object} styles - CSS Styles (transforms and an opacity only)
     * @param {Object} options - animation options
     * @returns {Object} weaver object
     */
    Velvet.prototype.weave = function (styles, options) {
        var transforms = {}, opacity = {}, transformKeys, opacityKeys, transformFunctions, opacityFunctions, values,
            from = {}, to = {}, weavers = [], template1, template2, len, styleKey, cb = function () {};

        this._pin();

        // Sort the styles into transforms, an opacity, and others.
        sortStyles(styles, transforms, opacity);

        // Output integrated keys.
        transformKeys = this._mergeTransformKeys(transforms);
        opacityKeys = this._mergeOpacityKeys(opacity);

        // Generate a style string.
        transformFunctions = this._getTransformFunctions(transformKeys);
        opacityFunctions = this._getOpacityFunctions(opacityKeys);

        // Generate an array of corresponding values to the style string.
        values = this._generateValues(transformKeys, transforms, opacityKeys, opacity);

        if (webAnimations) {
            if (transformFunctions) {
                template1 = format(transformFunctions, true);
                from[transform] = template1(values[0]);
                to[transform] = template1(values[1]);
            }
            if (opacityFunctions) {
                template2 = format(opacityFunctions);
                len = values[1].length - 1;
                from.opacity = template2(values[0][len]);
                to.opacity = template2(values[1][len]);
            }

            forEach(this._elements, function (element, i) {
                weavers[i] = element.animate([ from, to ], {
                    delay: options.delay || 0,
                    duration: options.duration || 0,
                    easing: options.easing || 'linear',
                    fill: 'forwards'
                });
            });
            if (weavers.length) {
                this._weaver = new Weaver(weavers, {
                    duration: options.duration || 0,
                    easing: options.easing || 'linear',
                    progress: function () {
                        return weavers[weavers.length - 1].effect.getComputedTiming().progress || 0;
                    },
                    oncancel: function () {
                        if (options.oncancel) {
                            options.oncancel.bind(this._weaver)();
                        }
                    }.bind(this),
                    onfinish: function () {
                        if (options.onfinish) {
                            options.onfinish.bind(this._weaver)();
                        }
                    }.bind(this)
                });
                weavers[weavers.length - 1].onfinish = function () {
                    if (this._weaver._playState !== FINISHED) {
                        this._weaver._playState = FINISHED;
                        if (options.onfinish) {
                            options.onfinish.bind(this._weaver)();
                        }
                    }
                }.bind(this);
            }
        } else {
            if (transformFunctions && opacityFunctions) {
                template1 = format(transformFunctions, true);
                template2 = format(opacityFunctions);
                len = values[0].length - 1;
                cb = function (d) {
                    var val1 = template1(d), val2 = template2(d[len]);
                    forEach(this._elements, function (element) {
                        var style = element.style;
                        style[transform] = val1;
                        style.opacity = val2;
                    });
                }.bind(this);
            } else if (transformFunctions || opacityFunctions) {
                template1 = format(transformFunctions || opacityFunctions, true);
                styleKey = transformFunctions ? transform : 'opacity';
                cb = function (d) {
                    var val1 = template1(d);
                    forEach(this._elements, function (element) {
                        element.style[styleKey] = val1;
                    });
                }.bind(this);
            }

            this._weaver = textile.weave(values[0], values[1], {
                delay: options.delay || 0,
                duration: options.duration || 0,
                easing: options.easing || 'linear',
                oncancel: function () {
                    if (options.oncancel) {
                        options.oncancel.bind(this._weaver)();
                    }
                }.bind(this),
                onfinish: function () {
                    if (options.onfinish) {
                        options.onfinish.bind(this._weaver)();
                    }
                }.bind(this)
            }, cb);
        }
        return this._weaver;
    };

    /**
     * style
     * @param {Object} styles - CSS Styles
     * @returns {Object} velvet instance
     */
    Velvet.prototype.style = function (styles) {
        /* NOTE: This method will not take care of Vendor Prefix except "transform" property for now. */

        var transforms = {}, opacity = {}, css = {},
            transformKeys, opacityKeys, values, transformValue, opacityValue, keys;

        this._pin();

        // Sort the styles into transforms, an opacity, and others.
        sortStyles(styles, transforms, opacity, css);

        // Output integrated keys.
        transformKeys = this._mergeTransformKeys(transforms);
        opacityKeys = this._mergeOpacityKeys(opacity);

        values = this._generateValues(transformKeys, transforms, opacityKeys, opacity)[1];
        transformValue = format(this._getTransformFunctions(transformKeys), true)(values);
        opacityValue = format(this._getOpacityFunctions(opacityKeys))(values[values.length - 1]);

        keys = Object.keys(css);
        forEach(this._elements, function (element) {
            var style = element.style;

            forEach(keys, function (key) {
                style[key] = css[key];
            });
            style[transform] = transformValue;
            style.opacity = opacityValue;
        });

        // Save the transforms and the opacity
        this._cacheTransform(transformKeys, transforms);
        this._cacheOpacity(opacityKeys, opacity);

        return this;
    };

    /**
     * unravel
     * @returns {void}
     * @description This method will destruct the velvet object. Once if it is called, the object will become unusable.
     */
    Velvet.prototype.unravel = function () {
        this._pin();
        this._elements = [];
        this._transforms = {};
        this._opacity = {};
        this._transformKeys = undefined;
        this._opacityKeys = undefined;
        this._values = undefined;
    };

    /**
     * velvet
     * @param {Object|Array.<Object>|NodeList} elements - a target element, an array of elements or a node list
     * @returns {Object} velvet or textile instance
     */
    var velvet = function (elements) {
        return elements ? new Velvet(elements) : textile;
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
// [[ This area will be removed with `npm run build` command.
    velvet.test = {
        resolvePrefix: resolvePrefix,
        webAnimations: webAnimations,
        frame: frame,
        transform: transform,
        t3d: t3d,
        map: map,
        forEach: forEach,
        format: format
    };
// ]]
}(this));
