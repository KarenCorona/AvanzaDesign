/* Componente de navegación de AvanzaDesign.
   Uso en cualquier página:
     <div id="site-header"></div>
     <script src="components/nav.js"></script>          (páginas en la raíz)
     <script src="../components/nav.js" data-base="../"></script>   (páginas en subcarpetas)
   Para agregar, quitar o renombrar un link del menú, edita SOLO el arreglo LINKS de abajo. */
(function () {
  var script = document.currentScript;
  var base = script.getAttribute('data-base') || '';
  var file = location.pathname.split('/').pop() || 'index.html';

  var LINKS = [
    { href: 'index.html', label: 'Inicio' },
    { href: 'index.html#servicios', label: 'Servicios' },
    { href: 'catalogo.html', label: 'Catálogo' },
    { href: 'misyvis.html', label: 'Misión y Visión' },
    { href: 'pegalo/index.html', label: 'Pegalo', cls: 'nav-pegalo' },
    { href: 'contacto.html', label: 'Contacto' }
  ];
  var BUTTONS = [
    { href: 'https://coronadigital.avanzadesign.com/', label: 'Corona Digital', alt: true,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/></svg>' },
    { href: 'https://www.promocionalesenlinea.com/AVANZADESIGN', label: 'Promocionales', title: 'Catálogo de Promocionales en línea',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>' }
  ];

  /* Compara sin ".html": en Hostinger las URLs son limpias (/catalogo en vez de /catalogo.html) */
  function norm(p) { p = p.replace(/\.html$/, ''); return p === 'index' ? '' : p; }
  function isActive(l) {
    if (l.href.indexOf('#') > -1) return false;
    return norm(l.href) === norm(file);
  }
  var items = LINKS.map(function (l) {
    var c = [l.cls, isActive(l) ? 'active' : ''].join(' ').trim();
    return '<li><a href="' + base + l.href + '"' + (c ? ' class="' + c + '"' : '') + '>' + l.label + '</a></li>';
  }).join('');
  items += BUTTONS.map(function (b) {
    return '<li class="nav-cta-item' + (b.alt ? ' nav-cta-alt-item' : '') + '"><a class="nav-cta' + (b.alt ? ' nav-cta-alt' : '') +
      '" href="' + b.href + '" target="_blank" rel="noopener"' + (b.title ? ' title="' + b.title + '"' : '') + '>' + b.icon + b.label + '</a></li>';
  }).join('');

  var html = '<header><div class="header-container">' +
    '<a href="' + base + 'index.html" aria-label="AvanzaDesign, ir al inicio"><img src="' + base + 'images/logo-avanza-header.svg" alt="AvanzaDesign Logo" class="logo"></a>' +
    '<div class="menu-toggle" role="button" tabindex="0" aria-label="Abrir menú" aria-expanded="false">☰</div>' +
    '<nav id="mobile-menu"><ul>' + items + '</ul></nav></div></header>';

  var mount = document.getElementById('site-header');
  mount.outerHTML = html;

  var header = document.querySelector('header');
  var menu = document.getElementById('mobile-menu');
  var toggle = header.querySelector('.menu-toggle');
  function flip() {
    var open = menu.classList.toggle('show');
    toggle.setAttribute('aria-expanded', open);
  }
  toggle.addEventListener('click', flip);
  toggle.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) { menu.classList.remove('show'); toggle.setAttribute('aria-expanded', 'false'); } });

  /* Publica la altura real del header (--header-h) para que menús laterales y anclas no queden tapados */
  function setH() { document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px'); }
  setH();
  window.addEventListener('load', setH);
  window.addEventListener('resize', setH);
  header.querySelector('img').addEventListener('load', setH);
})();
