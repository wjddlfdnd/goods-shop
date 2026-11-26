/* @ds-bundle: {"format":4,"namespace":"GoodsShop","components":[{"name":"Button"},{"name":"IconButton"},{"name":"Icon"},{"name":"TextField"},{"name":"SelectField"},{"name":"Checkbox"},{"name":"Radio"},{"name":"QuantityStepper"},{"name":"Chip"},{"name":"CategoryTabs"},{"name":"SectionHeader"},{"name":"MobileHeader"},{"name":"DesktopHeader"},{"name":"ProductCard"},{"name":"Label"},{"name":"CountBadge"},{"name":"OrderSummary"},{"name":"StickyBar"},{"name":"EmptyState"},{"name":"Dialog"},{"name":"Annotation"},{"name":"Notice"},{"name":"InfoPill"},{"name":"Carousel"},{"name":"SearchField"},{"name":"SortButton"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    return out;
  }

  /* ---------- Icon: 24 viewBox, 선 아이콘, stroke 1.8 ---------- */
  var PATHS = {
    search: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', { d: 'M20 20l-3.5-3.5' }]],
    user: [['circle', { cx: 12, cy: 8, r: 4 }], ['path', { d: 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6' }]],
    cart: [['path', { d: 'M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 8H6' }], ['circle', { cx: 9, cy: 20, r: 1.5 }], ['circle', { cx: 18, cy: 20, r: 1.5 }]],
    back: [['path', { d: 'M15 5l-7 7 7 7' }]],
    close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
    check: [['path', { d: 'M5 12.5l4.5 4.5L19 7.5' }]],
    plus: [['path', { d: 'M5 12h14M12 5v14' }]],
    minus: [['path', { d: 'M5 12h14' }]],
    'chevron-right': [['path', { d: 'M9 5l7 7-7 7' }]],
    'chevron-down': [['path', { d: 'M6 9l6 6 6-6' }]],
    sort: [['path', { d: 'M4 7h9M4 12h6M4 17h3' }], ['path', { d: 'M17 5v14M14 16l3 3 3-3' }]]
  };
  function Icon(props) {
    var parts = PATHS[props.name] || PATHS.close;
    var size = props.size || 22;
    return h('svg', {
      className: cx('gs-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      'aria-hidden': props.title ? undefined : 'true', role: props.title ? 'img' : undefined, focusable: 'false'
    }, props.title ? h('title', null, props.title) : null, parts.map(function (p, i) { return h(p[0], Object.assign({ key: i }, p[1])); }));
  }

  /* ---------- Button ---------- */
  function Button(props) {
    var variant = props.variant || 'secondary';
    var size = (props.size || 'M').toLowerCase();
    var className = cx('gs-btn', 'gs-btn--' + variant, 'gs-btn--' + size, props.full && 'gs-btn--full', props.className);
    var rest = omit(props, ['variant', 'size', 'full', 'icon', 'href', 'className', 'children', 'disabled', 'type']);
    var kids = [props.icon ? h(Icon, { key: 'i', name: props.icon, size: 20 }) : null, h('span', { key: 't' }, props.children)];
    if (props.href) {
      return h('a', Object.assign(rest, {
        className: className, href: props.disabled ? undefined : props.href,
        'aria-disabled': props.disabled ? 'true' : undefined, role: props.disabled ? 'link' : undefined
      }), kids);
    }
    return h('button', Object.assign(rest, { className: className, type: props.type || 'button', disabled: !!props.disabled }), kids);
  }

  /* ---------- CountBadge ---------- */
  function CountBadge(props) {
    if (props.count == null || props.count <= 0) return null;
    var text = props.count > 99 ? '99+' : String(props.count);
    return h('span', { className: cx('gs-badge', props.className), 'aria-hidden': props.decorative ? 'true' : undefined }, text);
  }

  /* ---------- IconButton ---------- */
  function IconButton(props) {
    var label = props.label + (props.badge > 0 ? ', ' + props.badge + '개' : '');
    var kids = [h(Icon, { key: 'i', name: props.icon }), props.badge > 0 ? h(CountBadge, { key: 'b', count: props.badge, decorative: true }) : null];
    var rest = omit(props, ['icon', 'label', 'badge', 'href', 'className']);
    var common = Object.assign(rest, { className: cx('gs-icon-btn', props.className), 'aria-label': label });
    if (props.href) return h('a', Object.assign(common, { href: props.href }), kids);
    return h('button', Object.assign(common, { type: 'button' }), kids);
  }

  /* ---------- Label ---------- */
  var LABEL_TEXT = { 'new': 'NEW', best: 'BEST', soldout: '품절', stopped: '판매 중지' };
  function Label(props) {
    var kind = props.kind || 'new';
    return h('span', { className: cx('gs-label', 'gs-label--' + kind, props.className) }, props.children || LABEL_TEXT[kind]);
  }

  /* ---------- Fields ---------- */
  function fieldIds(props) {
    var id = props.id || ('gs-' + String(props.label || 'field').replace(/\s+/g, '-'));
    return { id: id, hint: id + '-hint', error: id + '-error' };
  }
  function fieldFoot(props, ids) {
    return [
      props.error ? h('span', { key: 'e', id: ids.error, className: 'gs-field__error' }, props.error) : null,
      props.hint && !props.error ? h('span', { key: 'h', id: ids.hint, className: 'gs-field__hint' }, props.hint) : null
    ];
  }
  function describedBy(props, ids) {
    return props.error ? ids.error : (props.hint ? ids.hint : undefined);
  }
  function TextField(props) {
    var ids = fieldIds(props);
    var rest = omit(props, ['label', 'hint', 'error', 'invalid', 'className', 'id', 'value', 'type', 'trailing', 'clearable', 'clearLabel', 'onClear']);
    var trailing = props.trailing || (props.clearable ? h(IconButton, { icon: 'close', label: props.clearLabel || '입력 지우기', onClick: props.onClear }) : null);
    var input = h('input', Object.assign(rest, {
      id: ids.id, type: props.type || 'text', className: cx('gs-input', trailing && 'gs-input--trailing'),
      'aria-invalid': (props.error || props.invalid) ? 'true' : undefined, 'aria-describedby': describedBy(props, ids) || props.describedBy
    }, props.value != null ? (props.onChange ? { value: props.value } : { defaultValue: props.value }) : {}));
    var control = trailing ? h('div', { className: 'gs-input-wrap' }, input, h('span', { className: 'gs-input-wrap__trailing' }, trailing)) : input;
    return h('div', { className: cx('gs-field', props.className) },
      h('label', { className: 'gs-field__label', htmlFor: ids.id }, props.label), control, fieldFoot(props, ids));
  }
  function SelectField(props) {
    var ids = fieldIds(props);
    var opts = (props.options || []).map(function (o, i) {
      if (typeof o === 'string') o = { label: o };
      return h('option', { key: i, value: o.value != null ? o.value : o.label, disabled: !!o.disabled }, o.label);
    });
    if (props.placeholder) opts.unshift(h('option', { key: 'p', value: '' }, props.placeholder));
    var rest = omit(props, ['label', 'hint', 'error', 'className', 'id', 'options', 'placeholder', 'value']);
    var sel = h('select', Object.assign(rest, {
      id: ids.id, className: 'gs-select',
      'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': describedBy(props, ids)
    }, props.value != null ? (props.onChange ? { value: props.value } : { defaultValue: props.value }) : { defaultValue: '' }), opts);
    return h('div', { className: cx('gs-field', props.className) },
      h('label', { className: 'gs-field__label', htmlFor: ids.id }, props.label),
      h('div', { className: 'gs-select-wrap' }, sel, h(Icon, { name: 'chevron-right' })),
      fieldFoot(props, ids));
  }

  /* ---------- Checkbox / Radio ---------- */
  function choice(type) {
    return function (props) {
      var rest = omit(props, ['label', 'className', 'checked', 'children']);
      var ctl = props.onChange ? { checked: !!props.checked } : { defaultChecked: !!props.checked };
      return h('label', { className: cx('gs-check', props.disabled && 'gs-check--disabled', props.className) },
        h('input', Object.assign(rest, { type: type }, ctl)), h('span', null, props.label || props.children));
    };
  }
  var Checkbox = choice('checkbox');
  var Radio = choice('radio');

  /* ---------- QuantityStepper ---------- */
  function QuantityStepper(props) {
    var min = props.min != null ? props.min : 1;
    var max = props.max != null ? props.max : Infinity;
    var st = React.useState(props.value != null ? props.value : min);
    var value = props.onChange && props.value != null ? props.value : st[0];
    function set(v) { v = Math.max(min, Math.min(max, v)); st[1](v); if (props.onChange) props.onChange(v); }
    return h('div', { className: cx('gs-step', props.className), role: 'group', 'aria-label': props.label || '수량' },
      h('button', { type: 'button', className: 'gs-step__btn', 'aria-label': '수량 줄이기', disabled: props.disabled || value <= min, onClick: function () { set(value - 1); } }, h(Icon, { name: 'minus', size: 18 })),
      h('span', { className: 'gs-step__num', 'aria-live': 'polite' }, value),
      h('button', { type: 'button', className: 'gs-step__btn', 'aria-label': '수량 늘리기', disabled: props.disabled || value >= max, onClick: function () { set(value + 1); } }, h(Icon, { name: 'plus', size: 18 })));
  }

  /* ---------- Chip ---------- */
  function Chip(props) {
    var rest = omit(props, ['selected', 'className', 'children']);
    return h('button', Object.assign(rest, { type: 'button', className: cx('gs-chip', props.className), 'aria-pressed': props.selected ? 'true' : 'false' }),
      h('span', { className: 'gs-chip__box' }, props.children));
  }

  /* ---------- CategoryTabs ---------- */
  function CategoryTabs(props) {
    var items = props.items || [];
    return h('nav', { className: cx('gs-tabs', props.flush && 'gs-tabs--flush', props.className), 'aria-label': props.label || '카테고리' },
      items.map(function (it, i) {
        if (typeof it === 'string') it = { label: it };
        var current = props.current != null ? (props.current === i || props.current === it.label) : i === 0;
        var href = it.href || (typeof props.href === 'function' ? props.href(it, i) : props.href) || '#';
        return h('a', { key: i, href: href, className: 'gs-tab', 'aria-current': current ? 'page' : undefined }, it.label);
      }));
  }

  /* ---------- SectionHeader ---------- */
  function SectionHeader(props) {
    var Tag = props.as || 'h2';
    return h('div', { className: cx('gs-section-head', props.desktop && 'gs-section-head--desktop', props.className) },
      h(Tag, null, props.title),
      props.linkText ? h('a', { className: 'gs-link', href: props.href || '#' }, h('span', null, props.linkText + ' →')) : null);
  }

  /* ---------- Headers ---------- */
  function headerIcons(props, login) {
    var l = props.links || {};
    return [
      h(IconButton, { key: 's', icon: 'search', label: '검색', href: l.search || '#' }),
      h(IconButton, { key: 'u', icon: 'user', label: login || '계정', href: l.account || l.login || '#' }),
      h(IconButton, { key: 'c', icon: 'cart', label: '장바구니', href: l.cart || '#', badge: props.cartCount })
    ];
  }
  function MobileHeader(props) {
    var l = props.links || {};
    var left = props.back
      ? [h(IconButton, { key: 'b', icon: 'back', label: '뒤로', href: typeof props.back === 'string' ? props.back : (l.back || '#') }),
         h(props.titleAs || 'h1', { key: 't', className: 'gs-header__title' }, props.title)]
      : [h(props.titleAs || 'h1', { key: 't', className: props.title ? 'gs-header__title' : 'gs-header__title', style: props.title ? undefined : { flex: 1 } },
          props.title ? props.title : h('a', { className: 'gs-logo', href: l.home || '#' }, 'FANDOM PICK'))];
    var right = props.icons === false ? [] : (props.back ? [h(IconButton, { key: 'c', icon: 'cart', label: '장바구니', href: l.cart || '#', badge: props.cartCount })] : headerIcons(props));
    return h('header', { className: cx('gs-header', props.back && 'gs-header--back', props.className) }, left, right);
  }
  function DesktopHeader(props) {
    var l = props.links || {};
    return h('header', { className: cx('gs-dheader', props.className) },
      h('div', { className: 'gs-dheader__in' },
        h('a', { className: 'gs-logo', href: l.home || '#' }, 'FANDOM PICK'),
        h(CategoryTabs, { items: props.categories || [], current: props.current, href: props.categoryHref, flush: true }),
        h('div', { className: 'gs-dheader__actions' }, headerIcons(props, props.loginLabel || '로그인'))));
  }

  /* ---------- ProductCard ---------- */
  function ProductCard(props) {
    var rank = props.rank != null ? (props.rank < 10 ? '0' + props.rank : String(props.rank)) : null;
    return h('a', { className: cx('gs-card', props.className), href: props.href || '#' },
      h('div', { className: 'gs-card__img', role: 'img', 'aria-label': props.imageLabel || props.name || '[상품 이미지]' }, props.image || props.imageLabel || '[상품 이미지]'),
      h('div', { className: 'gs-card__meta' },
        rank ? h('span', { className: 'gs-card__rank' }, rank) : null,
        props.label ? h(Label, { kind: props.label }) : null,
        h('span', { className: 'gs-card__name' }, props.name || '[상품명]'),
        h('span', { className: 'gs-card__price' }, props.price != null ? props.price : '[가격]원')));
  }

  /* ---------- StickyBar ---------- */
  function StickyBar(props) {
    return h('div', { className: cx('gs-sticky', props.className), style: props.static ? { position: 'static' } : undefined }, props.children);
  }

  /* ---------- OrderSummary ---------- */
  function OrderSummary(props) {
    var rows = props.rows || [];
    return h('dl', { className: cx('gs-summary', props.className) },
      rows.map(function (r, i) { return h('div', { key: i, className: 'gs-summary__row' }, h('dt', null, r.label), h('dd', null, r.value)); }),
      props.total ? h('div', { className: 'gs-summary__row gs-summary__total' }, h('dt', null, props.total.label || '결제 예정 금액'), h('dd', null, props.total.value != null ? props.total.value : props.total)) : null);
  }

  /* ---------- EmptyState ---------- */
  function EmptyState(props) {
    return h('div', { className: cx('gs-empty', props.className) },
      h('p', { className: 'gs-empty__title' }, props.title),
      props.text ? h('p', { className: 'gs-empty__text' }, props.text) : null,
      props.actionText ? h(Button, { variant: props.actionVariant || 'dark', href: props.href, onClick: props.onAction }, props.actionText) : null);
  }

  /* ---------- Dialog (정적 예시) ---------- */
  function Dialog(props) {
    var tid = (props.id || 'gs-dialog') + '-title';
    return h('div', { className: cx('gs-dialog', props.className), role: props.alert ? 'alertdialog' : 'dialog', 'aria-labelledby': tid },
      h('h2', { className: 'gs-dialog__title', id: tid }, props.title),
      props.text ? h('p', { className: 'gs-dialog__text' }, props.text) : null,
      props.children,
      props.actions ? h('div', { className: 'gs-dialog__actions' }, props.actions) : null);
  }

  /* ---------- Annotation (와이어프레임 점선 주석) ---------- */
  function Annotation(props) {
    return h('aside', { className: cx('gs-note', props.className), style: props.flush ? { marginTop: 0 } : undefined },
      props.title ? h('b', { className: 'gs-note__title' }, props.title) : null, props.children);
  }

  /* ---------- v2.1: Notice, InfoPill, Carousel ---------- */
  function Notice(props) {
    return h('p', { className: cx('gs-notice', props.className), role: props.live ? 'status' : undefined }, props.children);
  }
  function InfoPill(props) {
    return h('span', { className: cx('gs-pill', props.className) }, props.children);
  }
  function Carousel(props) {
    var n = props.count || 1, cur = props.current || 0, label = props.label || '이미지';
    var dots = [];
    for (var i = 0; i < n; i++) dots.push(h('i', { key: i, 'aria-current': i === cur ? 'true' : undefined }));
    return h('section', { className: cx('gs-carousel', props.rounded && 'gs-carousel--rounded', props.className), 'aria-roledescription': 'carousel', 'aria-label': label },
      h('div', { className: 'gs-carousel__slide', role: 'group', 'aria-roledescription': 'slide', 'aria-label': (cur + 1) + ' / ' + n,
        style: props.ratio ? { aspectRatio: props.ratio } : undefined }, props.children || props.placeholder || '[상품 이미지]'),
      n > 1 ? h('div', { className: cx('gs-dots', 'gs-carousel__dots', props.onDark ? null : 'gs-dots--on-light'), 'aria-hidden': 'true' }, dots) : null,
      n > 1 ? h('span', { className: 'gs-sr' }, label + ' ' + (cur + 1) + ' / ' + n) : null);
  }

  /* ---------- v2.2: SearchField, SortButton ---------- */
  function SearchField(props) {
    var id = props.id || 'gs-search';
    var errId = id + '-error';
    var rest = omit(props, ['id', 'label', 'value', 'placeholder', 'clearLabel', 'onClear', 'className', 'size', 'error']);
    var input = h('input', Object.assign(rest, { id: id, type: 'search', enterKeyHint: 'search', className: 'gs-search__input', placeholder: props.placeholder || '검색어를 입력하세요',
      'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': props.error ? errId : undefined },
      props.value != null ? (props.onChange ? { value: props.value } : { defaultValue: props.value }) : {}));
    var box = h('div', { className: cx('gs-search', props.size === 'L' && 'gs-search--l', props.error && 'gs-search--error', props.className) },
      h('label', { className: 'gs-sr', htmlFor: id }, props.label || '검색어'),
      h('span', { className: 'gs-search__icon', 'aria-hidden': 'true' }, h(Icon, { name: 'search', size: 20 })),
      input,
      props.value ? h(IconButton, { icon: 'close', label: props.clearLabel || '검색어 지우기', onClick: props.onClear, className: 'gs-search__clear' }) : null);
    if (!props.error) return box;
    return h('div', { className: 'gs-field' }, box, h('p', { id: errId, className: 'gs-field__error gs-search__error', role: 'alert' }, props.error));
  }
  function SortButton(props) {
    var rest = omit(props, ['label', 'className', 'prefix']);
    return h('button', Object.assign({ type: 'button', 'aria-haspopup': 'listbox' }, rest, {
      className: cx('gs-sort', props.className), 'aria-label': (props.prefix || '정렬') + ': ' + (props.label || '최신순') }),
      h(Icon, { name: 'sort', size: 20 }), h('span', { 'aria-hidden': 'true' }, props.label || '최신순'));
  }

  window.GoodsShop = Object.assign(window.GoodsShop || {}, {
    Button: Button, IconButton: IconButton, Icon: Icon, TextField: TextField, SelectField: SelectField,
    Checkbox: Checkbox, Radio: Radio, QuantityStepper: QuantityStepper, Chip: Chip, CategoryTabs: CategoryTabs,
    SectionHeader: SectionHeader, MobileHeader: MobileHeader, DesktopHeader: DesktopHeader, ProductCard: ProductCard,
    Label: Label, CountBadge: CountBadge, OrderSummary: OrderSummary, StickyBar: StickyBar, EmptyState: EmptyState,
    Dialog: Dialog, Annotation: Annotation, Notice: Notice, InfoPill: InfoPill, Carousel: Carousel, SearchField: SearchField, SortButton: SortButton
  });
})();
