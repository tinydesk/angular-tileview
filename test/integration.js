const name = index => 'Some name ' + index;

const createItems = count => _.range(count).map(i => ({
  name: name(i)
}));

const getRows = el => el.children().children().children();

const log = items => {
  _.range(items.length).forEach(i => console.log(items.eq(i).text()));
}

const transformRegex = /translate3d\(0px, (.*)px, 0px\)/;
const getTranslation = row => parseInt(row.css('transform').match(transformRegex)[1]);

const checkRows = (rows, spec, offset = 0) => {
  _.range(rows.length).forEach(i => {
    const r = rows.eq(i);
    const s = spec[i];
    const expectedTranslation = _.isNumber(s) ? s : s[0];
    expect(getTranslation(r)).toBe(expectedTranslation);

    _.range(Math.min(r.children().length, s[1] || 1000)).forEach(j => {
      const item = r.children().eq(j);
      expect(item.text()).toBe(name(j + expectedTranslation / 100 * 4));
      expect(item.css('display')).toBe('inline-block');
    });

    if (s[1] !== undefined) {
      _.range(s[1], r.children().length).forEach(j => {
        const item = r.children().eq(j);
        expect(item.css('display')).toBe('none');
      })
    }

  });
};

describe('Vertical mode', () => {

  let $compile, $rootScope, $timeout;

  const tileview = (items, opts) => {
    $rootScope.options = _.defaults(opts, {
      tileSize: {
        width: 100,
        height: 100
      },
      templateUrl: 'item.tpl.html',
      overflow: 0
    });
    $rootScope.items = items;
    const el = $compile('<div style="width: 400px; height: 400px"><td-tileview options="options" items="items"></td-tileview></div>')($rootScope);
    angular.element(document.body).append(el);
    $rootScope.$digest();
    return el.children();
  };

  beforeAll(() => {
    angular.module('td.tileview').run(['$templateCache', function ($templateCache) {
      $templateCache.put('item.tpl.html', '<p>{{ item.name }}</p>');
    }]);
  });

  beforeEach(module('td.tileview'));

  beforeEach(function () {
    module(function ($provide) {
      $provide.value('$window', {
        addEventListener: () => { },
        removeEventListener: () => { },
        requestAnimationFrame: fn => fn()
      });
    });
  });

  beforeEach(inject((_$compile_, _$rootScope_, _$timeout_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
  }));

  it('should render empty tile view', () => {
    const el = tileview();
    expect(el.children().hasClass('tile-view')).toBe(true);
    expect(el.children().children().hasClass('item-container')).toBe(true);
    expect(getRows(el).length).toBe(0);
  });

  describe('default options', () => {

    let scrollContainer, rows, items;

    const scroll = to => {
      scrollContainer[0].scrollTop = 300;
      scrollContainer.triggerHandler('scroll');
    };

    beforeEach(() => {
      const tv = tileview(createItems(25));
      rows = getRows(tv);
      scrollContainer = tv.children();
      items = rows.children();
    })

    it('should render correct number of rows', () => {
      expect(rows.length).toBe(4);
    });

    it('should render the correct number of items', () => {
      expect(rows.children().length).toBe(4 * 4);
    });

    it('should render the correct data', () => {
      checkRows(rows, [0, 100, 200, 300]);
    });

    it('should render the correct data after scrolling', () => {
      scroll(300);
      checkRows(rows, [400, 500, [600, 1], 300]);
    });

  });

  it('should render overflow rows', () => {
    const rows = getRows(tileview(createItems(25), { overflow: 2 }));
    expect(rows.length).toBe(8);
  });

});