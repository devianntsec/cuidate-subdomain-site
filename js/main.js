(function(){
  var ls = {
    get: function(k){ try { return JSON.parse(localStorage.getItem(k)) || []; } catch(e){ return []; } },
    set: function(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  };
  function norm(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }

  /* 1. Navegación: resalta la sección visible */
  var links=[].slice.call(document.querySelectorAll('.links a'));
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){links.forEach(function(a){var on=a.getAttribute('href')==='#'+e.target.id;a.classList.toggle('active',on);if(on)a.scrollIntoView({block:'nearest',inline:'center'})})}
  })},{rootMargin:'-30% 0px -60% 0px'});
  document.querySelectorAll('.sec').forEach(function(s){io.observe(s)});

  /* 2. Checklist con progreso guardado en el navegador */
  var KEY='rv-checklist-v1';
  var secs=[].slice.call(document.querySelectorAll('.sec')).filter(function(s){return s.querySelector('.chk')});
  secs.forEach(function(s){var p=document.createElement('div');p.className='prog';p.innerHTML='<span></span><i><b></b></i>';s.querySelector('.sec-head').after(p)});
  function prog(){secs.forEach(function(s){var all=s.querySelectorAll('.chk').length,d=s.querySelectorAll('.chk.done').length;
    s.querySelector('.prog span').textContent=d+' de '+all+(d===all?' · listo':' hechos');s.querySelector('.prog b').style.width=(100*d/all)+'%'})}
  var saved=ls.get(KEY);
  var checks=[].slice.call(document.querySelectorAll('.chk'));
  checks.forEach(function(li,i){
    if(saved.indexOf(i)>=0) setDone(li,true);
    function toggle(){ setDone(li, !li.classList.contains('done')); ls.set(KEY, checks.reduce(function(a,c,j){return c.classList.contains('done')?a.concat(j):a},[])); prog(); }
    li.addEventListener('click',function(e){if(e.target.tagName!=='A')toggle()});
    li.querySelector('.box').addEventListener('keydown',function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle()}});
  });
  function setDone(li,d){li.classList.toggle('done',d);li.querySelector('.box').setAttribute('aria-checked',d)}
  prog();

  /* 3. Quiz personal vs. sensible */
  document.querySelectorAll('[data-quiz]').forEach(function(q){
    var items=[].slice.call(q.querySelectorAll('.qi')), score=q.querySelector('.quiz-score');
    items.forEach(function(it){
      it.querySelectorAll('button').forEach(function(b){
        b.addEventListener('click',function(){
          if(it.dataset.done) return;
          it.dataset.done='1';
          var ok=b.dataset.v===it.dataset.ans;
          it.classList.add(ok?'ok':'no');
          it.querySelectorAll('button').forEach(function(x){x.disabled=true;x.classList.toggle('pick',x===b)});
          it.querySelectorAll('button').forEach(function(x){ if(x.dataset.v===it.dataset.ans) x.classList.add('right'); });
          it.querySelector('.qw').hidden=false;
          it.querySelector('.qw').insertAdjacentHTML('afterbegin', ok?'<b>Correcto. </b>':'<b>Casi. </b>');
          var done=q.querySelectorAll('.qi[data-done]').length;
          if(done===items.length){
            var right=q.querySelectorAll('.qi.ok').length;
            score.textContent='Resultado: '+right+' de '+items.length+' correctas.';
          }
        });
      });
    });
  });

  /* 4. Tabs para las tarjetas de la sección 3 */
  document.querySelectorAll('.tabs-src').forEach(function(grid,gi){
    var cards=[].slice.call(grid.children);
    var bar=document.createElement('div'); bar.className='tabs'; bar.setAttribute('role','tablist');
    cards.forEach(function(c,i){
      var b=document.createElement('button'); b.type='button'; b.setAttribute('role','tab');
      b.id='tab-'+gi+'-'+i; b.textContent=c.querySelector('h3').textContent;
      b.addEventListener('click',function(){ show(i) });
      b.addEventListener('keydown',function(e){
        if(e.key==='ArrowRight'||e.key==='ArrowLeft'){ var n=(i+(e.key==='ArrowRight'?1:-1)+cards.length)%cards.length; bar.children[n].focus(); show(n); }
      });
      bar.appendChild(b);
    });
    grid.before(bar);
    function show(n){
      cards.forEach(function(c,i){ c.hidden=i!==n; c.setAttribute('role','tabpanel'); });
      [].forEach.call(bar.children,function(b,i){ b.setAttribute('aria-selected',i===n); b.tabIndex=i===n?0:-1; b.classList.toggle('on',i===n); });
    }
    show(0);
  });

  /* 5. Línea de tiempo: primeros 4 hechos y botón para ver el resto */
  document.querySelectorAll('.timeline').forEach(function(tl){
    var rows=[].slice.call(tl.querySelectorAll('.tl')); if(rows.length<=5) return;
    var rest=rows.slice(4); rest.forEach(function(r){r.hidden=true});
    var btn=document.createElement('button'); btn.type='button'; btn.className='more';
    btn.textContent='Ver los otros '+rest.length+' casos';
    btn.addEventListener('click',function(){ var open=rest[0].hidden; rest.forEach(function(r){r.hidden=!open}); btn.textContent=open?'Ocultar':'Ver los otros '+rest.length+' casos'; });
    tl.after(btn);
  });

  /* 6. Buscador de herramientas (sección 7) */
  var s7=document.getElementById('s7');
  if(s7){
    var key=s7.querySelector('.key');
    var box=document.createElement('div'); box.className='finder';
    box.innerHTML='<label for="finder-q">Busca una herramienta o un problema</label><input id="finder-q" type="search" placeholder="ej: clave, huella, términos, Chile" autocomplete="off"><p class="finder-msg" aria-live="polite"></p>';
    key.after(box);
    var input=box.querySelector('input'), msg=box.querySelector('.finder-msg');
    var folds=[].slice.call(s7.querySelectorAll('details.fold'));
    input.addEventListener('input',function(){
      var q=norm(input.value.trim()), shown=0;
      folds.forEach(function(f){
        var pairs=[].slice.call(f.querySelectorAll('.pair')), any=0;
        pairs.forEach(function(p){ var hit=!q||norm(p.textContent).indexOf(q)>=0; p.hidden=!hit; if(hit) any++; });
        var titleHit=!q||norm(f.querySelector('summary').textContent).indexOf(q)>=0;
        f.hidden=!(any||titleHit); if(!f.hidden){ shown++; if(q) f.open=true; }
        if(titleHit&&!any&&!f.hidden) pairs.forEach(function(p){p.hidden=false});
      });
      msg.textContent=q?(shown?'Resultados en '+shown+' categoría(s).':'Sin resultados. Prueba con otra palabra.'):'';
    });
  }

  /* 7. Pasos de "Si ya te filtraron" como una secuencia */
  document.querySelectorAll('.steps').forEach(function(st){
    var ol=st.querySelector('ol'); if(!ol) return;
    var items=[].slice.call(ol.children), i=0;
    var wrap=document.createElement('div'); wrap.className='stepper';
    var bar=document.createElement('div'); bar.className='dots';
    items.forEach(function(_,j){ var d=document.createElement('span'); d.className='dot'; d.setAttribute('aria-hidden','true'); bar.appendChild(d); });
    var nav=document.createElement('div'); nav.className='snav';
    nav.innerHTML='<button type="button" class="prev">Anterior</button><span class="cnt"></span><button type="button" class="next">Siguiente</button>';
    ol.before(wrap); wrap.appendChild(bar); wrap.appendChild(ol); wrap.appendChild(nav);
    ol.classList.add('stepper-ol');
    items.forEach(function(li,j){ li.setAttribute('data-n', String(j+1).padStart(2,'0')); });
    var prev=nav.querySelector('.prev'), next=nav.querySelector('.next'), cnt=nav.querySelector('.cnt');
    function go(n){
      i=Math.max(0,Math.min(items.length-1,n));
      items.forEach(function(li,j){ li.hidden=j!==i; });
      [].forEach.call(bar.children,function(d,j){ d.classList.toggle('on',j<=i); });
      cnt.textContent='Paso '+(i+1)+' de '+items.length;
      prev.disabled=i===0; next.textContent=i===items.length-1?'Listo':'Siguiente';
      next.onclick=function(){ if(i===items.length-1){ go(0); } else go(i+1); };
    }
    prev.addEventListener('click',function(){ go(i-1) });
    go(0);
  });
})();
