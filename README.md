# Velvet
A JavaScript library for DOM animations as smooth as Velvet, which was inspired by [Velocity](http://julian.com/research/velocity/) and [jQuery Transit](http://ricostacruz.com/jquery.transit/).

## TL;DR
See [demo](https://knowledgecode.github.io/velvet/) page.

## Features
- **Animations with JavaScript**  
It's a sort of manipulator to easily manipulate an element's transform property with JavaScript. You can freely **_play_**, **_pause_** and **_reverse_** the animation.

- **Web Animations API**  
It preferentially uses [Web Animations API](https://w3c.github.io/web-animations/), specifically `element.animate()` if supported.

## Policy
- **Speedster**  
It pursues speed than *Swiss Army knife*.

- **Minimalist**  
It keeps it as simple and small as possible (2.6kb (minified and gzipped) for now).

## Installation
*npm:*
```shell
$ npm install velvetjs
```

*Bower:*
```shell
$ bower install velvetjs
```

## Usage
*CommonJS:*
```javascript
var velvet = require('velvetjs');
var div = velvet(document.getElementById('div'));
div.weave({ translateX: 100 }, { durarion: 400 });
```

*AMD:*
```javascript
require(['path/to/velvet'], function (velvet) {
    var div = velvet(document.getElementById('div'));
    div.weave({ translateX: 100 }, { durarion: 400 });
});
```

*directly:*
```html
<script src="/path/to/velvet.min.js"></script>
<script>
    var div = velvet(document.getElementById('div'));
    div.weave({ translateX: 100 }, { durarion: 400 });
</script>
```

## API
### *velvet([element])*
- **element**: A target element (optional)

The `velvet` function returns a `Velvet` object or a `Textile` object. If call this with a parameter, it returns a `Velvet` object. If omit the parameter, it returns a `Textile` object.  
```javascript
var v = velvet(document.getElementById(('div'));    // Returns a Velvet object
var t = velvet();   // Returns a Textile object
```

### Velvet object
#### *v.weave(styles, options)*
- **styles**: CSS Styles (transforms and opacity only)  
- **options**: Animation options

The `weave` method creates an animation. The details of arguments are as follows:
```javascript
var w = v.weave({
    translateX: 100,    // (px)
    translateY: 200,    // (px)
    translateZ: 300,    // (px) Not supported in IE9
    scale: 1.5,     // Equivalent to { scaleX: 1.5, scaleY: 1.5 }
    scaleX: 2,
    scaleY: 2,
    scaleZ: 2,      // Not supported in IE9
    rotate: 30,     // (deg) Equivalent to { rotateZ: 30 }
    rotateX: 45,    // (deg) Not supported in IE9
    rotateY: 60,    // (deg) Not supported in IE9
    rotateZ: 30,    // (deg) Not supported in IE9
    skewX: 45,      // (deg)
    skewY: 45,      // (deg)
    perspective: 400,   // (px)
    opacity: 0.5
}, {
    delay: 1000,    // (ms)
    durarion: 400,  // (ms)
    easing: 'ease', // Any of 'linear', 'ease', 'ease-in', 'ease-out' and 'ease-in-out'
    oncancel: function () {
        // This is called when the animation is canceled.
    },
    onfinish: function () {
        // This is called when the animation is finished.
    }
});
```
**NOTE:** *Don't append unit for these parameters. 100px -> 100*  

This method returns a `Weaver` object and the animation will automatically start.

#### *v.style(styles)*
- **styles**: CSS Styles

The `style` method set styles to the element. Since the above `weave` method ignores the preset `transform` and `opacity` property, you need to set the styles if want to make started the animation from status different from default (position, size, etc.).
```javascript
// fade-in
v.style({
    translateX: 100,
    opacity: 0
}).weave({
    opacity: 1  // The opacity will transition from 0 to 1
}, {
    duration: 400
});
```

You may also set other properties with this method.
```javascript
v.style({
    position: 'absolute',
    left: '10px',   // In this case you need to append unit. 10 -> 10px
    top: '20px'
});
```
**NOTE:** *Since this method will not take care of Vendor Prefix, for instance, you will need to set them like this:*  
```javascript
v.style({
    '-webkit-transform-origin': 'left top'
    '-moz-transform-origin': 'left top'
    '-ms-transform-origin': 'left top'
    'transform-origin': 'left top'
});
```

### Textile object
#### *t.weave(from, to, options, cb)*
- **from**: An array of start values
- **to**: An array of end values
- **options**: Animation options
- **cb**: A callback function called per frame

The `weave` method creates an animation other than `transform` and `opacity`. This is an example of scrolling a window:
```javascript
var w = t.weave([0], [200], {
    delay: 1000,    // (ms)
    duration: 400,  // (ms)
    easing: 'ease', // Any of 'linear', 'ease', 'ease-in', 'ease-out' and 'ease-in-out'
    oncancel: function () {
        // This is called when the animation is canceled.
    },
    onfinish: function () {
        // This is called when the animation is finished.
    }
}, function (values) {
    // The scroll position will transition from 0px to 200px.
    window.scrollTo(0, values[0]);
});
```
It returns a `Weaver` object in the same way as `v.weave` method.

### Weaver object
#### *w.pause()*
The `pause` method pauses the animation.
#### *w.play()*
The `play` method resumes the paused animation, or replays the stopped animation.
#### *w.finish()*
The `finish` method goes to the end position of the animation, and stops.
#### *w.cancel()*
The `cancel` method goes back to the start position of the animation, and stops.
#### *w.reverse()*
The `reverse` method reverses the current play direction, and starts to play the animation.
```javascript
v.weave({
    translateX: 100
}, {
    durarion: 400,
    onfinish: function () {
        this.reverse(); // The animation will be endlessly repeated.
    }
});
```
#### *w.direction()*
The `direction` method returns current play direction. (1: forward direction, -1: backward direction)

## Tips
### *Position Property*
For better performance, set `absolute` or `fixed` to the element's `position` property.
```CSS
#element {
    position: "absolute";
}
```
### *Combo Animations with Promise*
In order to create Combo Animations use Promise like this:
```javascript
var div = velvet(document.getElementById(('div'));

Promise.resolve().then(function () {
    return new Promise(resolve) {
        div.weave({
            translateX: 100     // The translateX will transition from 0 to 100.
        }, {
            duration: 400,
            onfinish: resolve
        });
    };
}).then(function () {
    return new Promise(resolve) {
        div.weave({
            translateY: 100     // The translateY will transition from 0 to 100.
        }, {                    // The X will remain at the same position (100px).
            duration: 400,
            onfinish: resolve
        });
    };
}).then(function () {
    return new Promise(resolve) {
        div.weave({
            translateX: 0,
            translateY: 0       // These will transition from 100 to 0.
        }, {
            duration: 400,
            onfinish: resolve
        });
    };
});
```

## TODO
- Proper test
- Multiple elements control
- Customizing cubic bezier
- Vendor Prefix support for `style` method

## Supported browser
Chrome, Firefox, Safari, Opera, Android Browser 4.0+, iOS Safari, Edge and IE9+

## Lisence
MIT

