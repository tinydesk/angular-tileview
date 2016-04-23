// service of module
declare var angular: any;

(function()
{
	'use strict';
	
	var mod = angular.module('td.tileview', []);
	mod.directive('tdTileview', ['$compile', '$templateCache', TileView]);

	/**
	 * @ngdoc directive
	 * @name td.tileview.directive:tdTileview
	 * @restrict E
	 *
	 * @description
	 *
	 * The tile directive provides a tile-based view on a list of data. The tiles can be arranged in a grid or they can be
	 * horizontally stacked.
	 *
	 * @param {Array=} items The items that are to be displayed in the tile view 
	 * @param {object=} options An options object defining options that are relevant specifically for the tile ui such as
	 * tile sizes for example. It consists of the following properties:
	 *
	 * - **templateUrl** - {string} - Path to the template that should be used to render tiles. The template will implicitly have
	 * access to the tile directive's scope plus an `item` object. Note that the template is responsible for maintaining the
	 * selection state by calling the appropriate methods on the selection object.
	 * - **tileSize** - {object} - The current tile size represented as an object with the following properties:
	 *   - **width** - {int} - The width of the tile.
	 *   - **height** - {int} - The height of the tile.
	 * Can be dynamically adjusted.
	 * - **alignHorizontal** - {boolean} - Whether to show the tiles in a grid with a vertical scrollbar or horizontally
	 * stacked.
	 */
	function TileView($compile, $templateCache)
	{
		return {
			restrict: 'E',
			scope: {
				items: '=',
				options: '='
			},
			templateUrl: 'tileview.tpl.html',
			link: function(scope, elem, attrs)
			{
				scope.elem = elem;
				scope.tileStyle = {};
				scope.tileStyle.marginRight = "4px";
				scope.tileStyle.marginBottom = "4px";
				scope.tileStyle.float = "left";

				var container = elem.children();

				var placeholderStart = container.children().eq(0);
				var itemContainer = container.children().eq(1);
				var placeholderEnd = container.children().eq(2);

				var linkFunction = $compile($templateCache.get(scope.options.templateUrl));
				var itemElements;

				var overflow = 2;
				var heightStart = 0;
				var heightEnd = 0;

				var startRow, endRow;
				
				var itemsPerRow;
				var rowCount;
				var cachedRowCount;

				scope.$watch('items', function(items: any[]) {
          var itemHeight = scope.options.tileSize.height;
          var itemWidth = scope.options.tileSize.width;
          var rect = elem[0].getBoundingClientRect();

          itemsPerRow = Math.floor(rect.width / itemWidth);
          rowCount = Math.ceil(items.length / itemsPerRow);
          cachedRowCount = Math.ceil(rect.height / itemHeight) + overflow;

          startRow = 0;
          endRow = cachedRowCount;
          if (itemElements === undefined) {
            itemElements = [];
            // create item elements:
            items.slice(startRow*itemsPerRow, endRow*itemsPerRow).forEach(function(item) {
              var itemScope = scope.$new();
              itemScope.item = item;
              linkFunction(itemScope, function(clonedElement) {
                clonedElement.css('height', itemHeight + 'px');
                clonedElement.css('width', itemWidth + 'px');
                itemElements.push(clonedElement);
                itemContainer.append(clonedElement);
              });
            });
          }

          heightEnd = (rowCount - endRow) * itemHeight;
          placeholderStart.css('height', '0px');
          placeholderEnd.css('height', heightEnd + 'px');
				});

				function onScroll() {
					function clamp(value, min, max) {
						return Math.max(Math.min(value, max), min);
					}

					var rect = elem[0].getBoundingClientRect();
					var itemHeight = scope.options.tileSize.height;
					var scrollPosition = clamp(container[0].scrollTop, 0, scope.items.length * itemHeight - rect.height);

					function updateItem(elem, item) {
            if (item !== undefined) {
              if (elem.css('visibility') === 'hidden') {
                elem.css('visibility', 'visible');
              }
              var itemScope = elem.scope();
              itemScope.item = item;
              itemScope.$digest();
            } else {
              elem.css('visibility', 'hidden');
            }
					}

					var oldStartRow = startRow;
					var oldEndRow = endRow;

					startRow = clamp(Math.floor(scrollPosition / itemHeight), 0, rowCount - cachedRowCount);
					endRow = startRow + cachedRowCount;

					heightStart = startRow * itemHeight;
					heightEnd = (rowCount - endRow) * itemHeight;
					placeholderStart.css('height', heightStart + 'px');
					placeholderEnd.css('height', heightEnd + 'px');

					var i;
					if (startRow > oldEndRow || endRow < oldStartRow) {
						for (i = 0; i < itemContainer.children().length; ++i) {
							var item = itemContainer.children().eq(i);
							updateItem(item, scope.items[startRow * itemsPerRow + i]);
						}
					} else {
						var intersectionStart = Math.max(startRow, oldStartRow);
						var intersectionEnd = Math.min(endRow, oldEndRow);

						var itemElement;
						var reusedElements;
						if (endRow > intersectionEnd) {
							for (i = intersectionEnd*itemsPerRow; i < endRow*itemsPerRow; ++i) {
								itemElement = itemContainer.children().eq(0).detach();
								updateItem(itemElement, scope.items[i]);
								itemContainer.append(itemElement);
							}
						} else if (startRow < intersectionStart) {
							for (i = intersectionStart*itemsPerRow - 1; i >= startRow*itemsPerRow; --i) {
								itemElement = itemContainer.children().eq(-1).detach();
								updateItem(itemElement, scope.items[i]);
								itemContainer.prepend(itemElement);
							}
						}
					}
				}

				container.on('scroll', onScroll);
			}
		};
	}
})();