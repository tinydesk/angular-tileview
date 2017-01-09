# angular-scroll-rtl

Provides an abstraction layer to compensate for browser differences in handling scrollLeft in RTL mode.

## Get Started

Install via bower:

```
bower install angular-scroll-rtl --save
```

Add dependency:

```javascript
angular.module('myApp', ['td.scroll']);
```

Make sure that `dist/angular-scroll-rtl.js` is included in your html file.

## Usage

The module will extend the `angular.element` prototype by adding an additional method:

### scrollLeft(value)

The behaviour is similar to the corresponding [jQuery method](https://api.jquery.com/scrollleft/). The difference is, that it will account for browser discrepancies that occur when the element's direction is set to right-to-left. In this case, it will always return the right-most position as 0, whereas the left-most position is the maximum scroll value. 

### direction(value)

When provided with no value, returns the currently effective direction setting for the element. When a value is present, the direction of the element will be set to the specified value. 
