# angular-tileview

A tile view that uses virtualisation to efficiently display large numbers of cells.

## Get Started

**Example:**
```html
<td-tileview items="myItems" options="myOptions"></td-tileview>
```

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
