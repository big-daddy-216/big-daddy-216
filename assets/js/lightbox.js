/* Tap/click any photo in Live & Loud or The Band to open it full-size. */
(function(){
  if (window.__bdLB) return; window.__bdLB = 1;
  var ov, im;
  function close(){ if(!ov) return; ov.classList.remove('open'); document.documentElement.style.overflow=''; im.removeAttribute('src'); }
  function open(src, alt){ if(!ov) return; im.src=src; im.alt=alt||''; ov.classList.add('open'); document.documentElement.style.overflow='hidden'; }
  function wire(){
    ov = document.getElementById('bd-lightbox');
    if(!ov){ return requestAnimationFrame(wire); }
    im = ov.querySelector('img');
    ov.addEventListener('click', close);
  }
  wire();
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
  document.addEventListener('click', function(e){
    var t = e.target;
    if (t && t.tagName === 'IMG') {
      var s = t.getAttribute('src') || '';
      if (/assets\/(photos|posters)\//.test(s)) { open(t.currentSrc || t.src, t.alt); }
    }
  });
})();
