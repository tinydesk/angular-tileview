describe('Vertical mode', () => {

  let $compile, $rootScope;

  const tileview = opts => {
    $rootScope.options = opts || {
      tileSize: {
        width: 128,
        height: 128
      },
      templateUrl: 'item.tpl.html'
    };
    const el = $compile('<td-tileview options="options"></td-tileview>')($rootScope);
    $rootScope.$digest();
    return el;
  }


  beforeAll(() => {
    angular.module('td.tileview').run(['$templateCache', function ($templateCache) {
      $templateCache.put('item.tpl.html', '<p>{{ item.name }}</p>');
    }]);
  });

  beforeEach(module('td.tileview'));

  beforeEach(inject((_$compile_, _$rootScope_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('should render empty tile view', () => {
    const el = tileview();
    expect(el.children().hasClass('tile-view')).toBe(true);
    expect(el.children().children().hasClass('item-container')).toBe(true);
  });

});