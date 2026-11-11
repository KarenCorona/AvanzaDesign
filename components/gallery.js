/* Galerías con "Ver más": muestra data-initial fotos y revela otro tanto cada vez.
   Uso: <div class="gallery" data-initial="10"> ... .gallery-item ... </div>  */
(function () {
  document.querySelectorAll('.gallery[data-initial]').forEach(function (g) {
    var step = parseInt(g.getAttribute('data-initial'), 10) || 12;
    var items = [].slice.call(g.querySelectorAll('.gallery-item'));
    if (items.length <= step) return;
    var shown = step;
    items.forEach(function (it, i) { if (i >= shown) it.hidden = true; });
    var wrap = document.createElement('div'); wrap.className = 'gallery-more-wrap';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'gallery-more';
    function label() { btn.textContent = 'Ver más trabajos (' + (items.length - shown) + ')'; }
    label();
    btn.addEventListener('click', function () {
      var next = Math.min(items.length, shown + step);
      for (var i = shown; i < next; i++) items[i].hidden = false;
      shown = next;
      if (shown >= items.length) wrap.remove(); else label();
    });
    wrap.appendChild(btn);
    g.parentNode.insertBefore(wrap, g.nextSibling);
  });
})();
