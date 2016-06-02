// service of module
declare const angular: any;

(() => {
  'use strict';

  const mod = angular.module('td.tileview', []);

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
   * The tile directive will automatically resize when the window is resized. If the size changed for some other reasons, a manual resize 
   * can be triggered, by broadcasting the `td.tileview.resize` event. There are two other events, that indicate the beginning and ending 
   * of a scrolling movement. These events can be used to implement custom performance optimisations, because not every DOM change needs to
   * be done while scrolling. The events are: `td.tileview.scrollStart` and `td.tileview.scrollEnd`. In order to detect when scrolling ends 
   * a debounce delay is used. It can be configured with the `afterScrollDelay` options property.
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
   * - **onScrollEnd** - {function} - A callback that is invoked when the user scrolls to the end of the data.
   * - **scrollEndOffset** - {number} - Some features that rely on the `scrollEnd` callback need to be informed in advance. 
   * This property specifies an offset in rows to trigger the scroll end event before actually hitting the bottom of the data. **Default**: 0
   * - **overflow** - {number} - Number of rows that are rendered additionally to the visible rows to make the scrolling experience more fluent. **Default**: 2
   * - **debounce** - {number} - Debounce for the scroll event. A value of `0` is interpreted as no debounce. **Default**: 0.
   * - **afterScrollDelay** - {number} - Time to wait in order to decide whether a scroll movement has finished. **Default**: 100.
   */
  mod.directive('tdTileview', ['$compile', '$templateCache', '$timeout', '$window', ($compile, $templateCache, $timeout, $window) => {
    return {
      restrict: 'E',
      scope: {
        items: '=',
        options: '='
      },
      template: $templateCache.get('tileview.tpl.html'),
      link: (scope, elem, attrs) => {
        scope.elem = elem;
        scope.tileStyle = {};
        scope.tileStyle.marginRight = "4px";
        scope.tileStyle.marginBottom = "4px";
        scope.tileStyle.float = "left";

        const container = elem.children();
        const itemContainer = container.children().eq(0);

        let linkFunction;

        let heightStart = 0;
        let heightEnd = 0;

        let startRow = 0, endRow;
        let renderedStartRow = -1, renderedEndRow = -1;

        let itemsPerRow;
        let rowCount;
        let cachedRowCount;

        let virtualRows = [];

        scope.$watch('options', options => {
          options.scrollEndOffset = def(options.scrollEndOffset, 0);
          options.overflow = def(options.overflow, 2);
          options.debounce = def(options.debounce, 0);
          options.afterScrollDelay = def(options.afterScrollDelay, 100);
        });
        scope.$watchGroup(['options.tileSize.width', 'options.tileSize.height'], ([width, height]) => {
          layout();
          forEachElement((el, i) => {
            el.css('width', width + 'px');
            el.css('height', height + 'px');
          });
        });
        scope.$watch('options.templateUrl', templateUrl => {
          const template = $templateCache.get(templateUrl);
          if (template !== undefined) {
            linkFunction = $compile(template);
            removeAll();
            layout();
          } else {
            console.error('Template url not found: ' + templateUrl);
          }
        });
        var sizeDimension, orthogonalDimension;
        scope.$watch('options.alignHorizontal', (alignHorizontal) => {
          if (alignHorizontal) {
            sizeDimension = 'width';
            orthogonalDimension = 'height';
            elem.children().addClass('horizontal');
          } else {
            sizeDimension = 'height';
            orthogonalDimension = 'width';
            elem.children().removeClass('horizontal');
          }
          layout();
        });
        scope.$watchCollection('items', () => {
          lastScrollPosition = Number.NEGATIVE_INFINITY;
          layout();
        });
        scope.$watch('options.overflow', layout);
        scope.$on('td.tileview.resize', resize);

        angular.element($window).on('resize', onResize);

        scope.$on('$destroy', function () {
          angular.element($window).off('resize', onResize);
          removeAll();
        });

        function removeElement(el) {
          if (el.scope() !== undefined) {
            el.scope().$destroy();
          }
          el.remove();
        }

        function removeAll() {
          forEachElement(removeElement);
          forEachRow(removeRow);
        }

        function forEachElement(fn) {
          forEachRow(row => {
            for (let i = 0; i < row.children().length; ++i) {
              fn(row.children().eq(i), i);
            }
          });
        }

        function forEachRow(fn) {
          const numOfElements = visibleRowCount();
          for (let i = 0; i < numOfElements; ++i) {
            fn(itemContainer.children().eq(i), i);
          }
        }

        function visibleRowCount() {
          return itemContainer.children().length;
        }

        function itemElementCount() {
          return visibleRowCount() * itemsPerRow;
        }

        let lastScrollPosition = Number.NEGATIVE_INFINITY;
        function updateVisibleRows() {
          function clamp(value, min, max) {
            return Math.max(Math.min(value, max), min);
          }

          const rect = container[0].getBoundingClientRect();
          const itemSize = scope.options.tileSize[sizeDimension];

          const maxScrollPosition = rowCount * itemSize - rect[sizeDimension];

          const scrollDimension = scope.options.alignHorizontal ? 'scrollLeft' : 'scrollTop';
          const scrollPosition = container[0][scrollDimension];

          const scrollEndThreshold = maxScrollPosition - scope.options.scrollEndOffset * itemSize;
          if (scrollPosition >= scrollEndThreshold && !(lastScrollPosition >= scrollEndThreshold) && scope.options.onScrollEnd !== undefined) {
            scope.options.onScrollEnd();
          }

          startRow = clamp(Math.floor(scrollPosition / itemSize) - scope.options.overflow, 0, rowCount - cachedRowCount);
          endRow = startRow + cachedRowCount;
          lastScrollPosition = scrollPosition;
        }

        function updateItem(elem, index, digest) {
          const item = scope.items[index];
          if (item !== undefined) {
            if (elem.css('display') === 'none') {
              elem.css('display', 'inline-block');
            }
            const itemScope = elem.scope();
            itemScope.item = item;
            itemScope.$index = index;
            if (digest === true) {
              itemScope.$digest();
            }
          } else {
            elem.css('display', 'none');
          }
        }

        function updateRow(el, rowIndex, digest) {
          for (let i = 0; i < el.children().length; ++i) {
            updateItem(el.children().eq(i), rowIndex * itemsPerRow + i, digest);
          }
          const translate = scope.options.alignHorizontal ? 'translateX' : 'translateY';
          el.css('transform', translate + '(' + Math.max(rowIndex * scope.options.tileSize[sizeDimension], 0) + 'px)')
        }

        function addRow() {
          const row = angular.element('<div></div>');
          row.css('position', 'absolute');
          itemContainer.append(row);
          return row;
        }
        
        function removeRow() {
          itemContainer.children().eq(-1).remove();
        }

        function addElementToRow(row) {
          linkFunction(scope.$parent.$new(), function (clonedElement) {
            clonedElement.css({
              width: scope.options.tileSize.width + 'px',
              height: scope.options.tileSize.height + 'px',
              display: 'inline-block',
              'vertical-align': 'top'
            });
            row.append(clonedElement);
          });
        }

        function fillRow(row) {
          const currentRowLength = row.children().length;
          if (currentRowLength < itemsPerRow) {
            for (let i = currentRowLength; i < itemsPerRow; ++i) {
              addElementToRow(row);
            }
          } else if (currentRowLength > itemsPerRow) {
            for (let i = currentRowLength; i > itemsPerRow; --i) {
              removeElementFromRow(row);
            }
          }
        }

        function removeElementFromRow(row) {
          removeElement(row.children().eq(-1));
        }

        function createElements(numRows) {
          updateVisibleRows();
          const currentRowCount = itemContainer.children().length;
          
          if (currentRowCount < numRows) {
            for (let i = currentRowCount; i < numRows; ++i) {
              addRow();
            }
          } else if (currentRowCount > numRows) {
            for (let i = currentRowCount; i > numRows; --i) {
              removeRow();
            }
          }
          
          forEachRow(fillRow);

          virtualRows = [];
          const startIndex = startRow * itemsPerRow;
          forEachRow((el, i) => {
            virtualRows.push(el);
            updateRow(el, startRow + i, false);
          });
        }

        function resize(withDigest) {
          const newComponentSize = container[0].getBoundingClientRect();
          if (newComponentSize.width !== componentWidth || newComponentSize.height !== componentHeight) {
            layout();
            if (withDigest === true) {
              forEachElement(el => el.scope().$digest());
            }
          }
        }

        function onResize() {
          resize(true);
        }

        let componentWidth = 0, componentHeight = 0;
        function layout() {
          if (linkFunction !== undefined && scope.items !== undefined && sizeDimension !== undefined) {
            const rect = container[0].getBoundingClientRect();
            componentWidth = rect.width;
            componentHeight = rect.height;
            const itemWidth = scope.options.tileSize.width;
            const width = container[0].getBoundingClientRect().width;
            const size = rect[sizeDimension];

            itemsPerRow = (scope.options.alignHorizontal) ? 1 : Math.floor(width / itemWidth);
            rowCount = Math.ceil(scope.items.length / itemsPerRow);
            cachedRowCount = Math.ceil(size / scope.options.tileSize[sizeDimension]) + scope.options.overflow * 2;

            createElements(cachedRowCount);

            itemContainer.css(sizeDimension, rowCount * scope.options.tileSize[sizeDimension] + 'px');
            itemContainer.css(orthogonalDimension, '100%');
            //setPlaceholder();
          }
        }

        function update() {
          animationFrameRequested = false;

          if (startRow !== renderedStartRow || endRow !== renderedEndRow) {
            if (startRow > renderedEndRow || endRow < renderedStartRow) {
              virtualRows.forEach((el, i) => updateRow(el, startRow + i, true));
              //forEachRow((el, i) => updateRow(el, startRow + i, true));
            } else {
              const intersectionStart = Math.max(startRow, renderedStartRow);
              const intersectionEnd = Math.min(endRow, renderedEndRow);
              if (endRow > intersectionEnd) {
                // scrolling downwards
                for (let i = intersectionEnd; i < endRow; ++i) {
                  const e = virtualRows.shift();
                  updateRow(e, i, true);
                  virtualRows.push(e);
                }
              } else if (startRow < intersectionStart) {
                // scrolling upwards
                for (let i = intersectionStart - 1; i >= startRow; --i) {
                  const e = virtualRows.pop();
                  updateRow(e, i, true);
                  virtualRows.unshift(e);
                }
              }
            }

            renderedStartRow = startRow;
            renderedEndRow = endRow;
          }
        }

        function detectScrollStartEnd() {
          if (scope.options.afterScrollDelay !== undefined) {
            if (scrollEndTimeout !== undefined) {
              $timeout.cancel(scrollEndTimeout);
            } else {
              scope.$parent.$broadcast('td.tileview.scrollStart');
            }
            scrollEndTimeout = $timeout(() => {
              // scrolling ends:
              scrollEndTimeout = undefined;
              scope.$parent.$broadcast('td.tileview.scrollEnd');
            }, scope.options.afterScrollDelay, true);
          }
        }

        let debounceTimeout, scrollEndTimeout;
        let animationFrameRequested = false;
        function onScroll() {
          detectScrollStartEnd();
          updateVisibleRows();
          if (scope.options.debounce !== undefined && scope.options.debounce > 0) {
            if (debounceTimeout === undefined) {
              debounceTimeout = $timeout(function () {
                debounceTimeout = undefined;
                update();
              }, scope.options.debounce, false);
            }
          } else {
            if (!animationFrameRequested) {
              animationFrameRequested = true;
              requestAnimationFrame(update);
            }
          }
        }

        container.on('scroll', onScroll);
      }
    };
  }]);

  // Helper functions:
  function def(value, defaultValue) {
    return (value !== undefined) ? value : defaultValue;
  }

})();