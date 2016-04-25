# angular-tileview

A tile view that uses virtualisation to efficiently display large numbers of cells.

## Get Started

Install via bower:

```
bower install angular-tileview --save
```

Add dependency:

```javascript
angular.module('myApp', ['td.tileview']);
```

Add component to template:

```html
<td-tileview items="myItems" options="myOptions"></td-tileview>
```

## Demo

See this [codepen](http://codepen.io/widmoser/pen/KzBjqw).

## Parameters

### items

Type: `Array` (required)

The data that should be displayed. Each item is associated with one cell in the tileview. The cell will be bound to the data of the corresponding item. There is no restriction on the shape of the items in the array. Any data can be used. Note that though it seems that each item has it's own cell, the component only creates enough dom elements to view all visible items at once and reuses those elements when the user scrolls.

### options

Type: `Object`

The component supports the following options:

#### templateUrl

Type: `String` (required)

Path to a template that is used to render a cell. The template might reference the `item` property which will always points to the item that is displayed in that cell. Note that it is possible to change this property later on, but it must be always the same for all cells.

#### tileSize

Type: `Object` (required)

An object that has two numeric properties `width` and `height` which define the exact size of each cell. Note that it is possible to change this property later on, but it must be always the same for all cells.

#### alignHorizontal

Type: `boolean`. Default: `false`

If set to true, line breaks will be disabled and the items will be aligned in one large row with a horizontal scroll-bar if necessary.

#### onScrollEnd

Type: `function`

A callback that is invoked when the user scrolls to the end of the data. The expression can be optionally triggered in advance by setting the option `scrollEndOffset`.

#### scrollEndOffset

Type: `number`. Default: `0`

The row, counted from the end, that triggers the `scrollEnd` expression.

#### overflow

Type: `number`. Default: `2`

The number of excess rows that are added to the DOM. 
