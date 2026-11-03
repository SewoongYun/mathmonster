/* 책 개념 지도 — 라우팅: #/ (서재) · #/book/<책id> (목차 지도) · #/book/<책id>/<프로그램id> (프로그램 보기) */
(function(){
  var BOOKS = window.BOOKS || [];
  var app = document.getElementById('app');
  var $ = function(id){ return document.getElementById(id); };
  var shown = null;      // 지금 화면에 그려진 책 id ('' = 서재)
  var concept = null;    // 개념 찾기에서 고른 개념

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function url(path){ return path.split('/').map(encodeURIComponent).join('/'); }
  function bookById(id){ for(var i=0;i<BOOKS.length;i++) if(BOOKS[i].id===id) return BOOKS[i]; return null; }
  function programsOf(book){
    var out=[];
    book.chapters.forEach(function(ch){ (ch.programs||[]).forEach(function(p){ out.push({p:p, ch:ch}); }); });
    return out;
  }
  function conceptsOf(book){
    var seen={}, out=[];
    programsOf(book).forEach(function(x){ (x.p.concepts||[]).forEach(function(c){ if(!seen[c]){ seen[c]=1; out.push(c); } }); });
    return out;
  }
  function typeClass(t){ return t==='카드뉴스'?'t-card':(t==='단계 활동'||t==='읽기 자료')?'t-step':'t-lab'; }

  /* ---------- 서재 ---------- */
  function renderLibrary(){
    shown=''; concept=null;
    document.title='책 개념 지도';
    var cards=BOOKS.map(function(b){
      var n=programsOf(b).length, chs=b.chapters.filter(function(c){return (c.programs||[]).length}).length;
      return '<a class="bcard" href="#/book/'+esc(b.id)+'">'+
        '<img src="'+url(b.dir+'/'+b.cover)+'" alt="『'+esc(b.title)+'』 표지">'+
        '<div><div class="t">'+esc(b.title)+'</div><div class="a">'+esc(b.author)+(b.translator?' 지음 · '+esc(b.translator)+' 옮김':'')+'</div>'+
        '<div class="c"><span class="pill red">프로그램 '+n+'개</span><span class="pill">'+b.chapters.length+'장 중 '+chs+'장 연결</span></div></div></a>';
    }).join('');
    app.innerHTML=
      '<header class="lib-head"><p class="kicker">독서 × 수학 수업</p><h1>책으로 여는 개념 지도</h1>'+
      '<p>책을 고르면 목차를 따라 장마다 연결된 개념 프로그램을 바로 열어 볼 수 있다.</p></header>'+
      '<section class="shelf" aria-label="책 목록">'+cards+
      '<div class="addcard"><b>새 책 추가하기</b><span><code>books/</code> 폴더에 책 폴더를 만들고, <code>data/books.js</code>에 목차와 프로그램을 적는다.</span><span>자세한 방법은 README.md</span></div>'+
      '</section>';
    window.scrollTo(0,0);
  }

  /* ---------- 책 지도 ---------- */
  function renderBook(book){
    shown=book.id; concept=null;
    document.title=book.title+' · 책 개념 지도';
    // 오른쪽 열부터 장을 차례로 채우고, 높이가 절반을 넘으면 나머지는 왼쪽 열로
    var w=book.chapters.map(function(c){ return 1+1.2*(c.programs||[]).length+0.03*(c.sections||[]).join('').length; });
    var total=w.reduce(function(a,b){return a+b},0), acc=0, right=[], left=[];
    book.chapters.forEach(function(c,i){ if(acc<total/2){ right.push(c); acc+=w[i]; } else left.push(c); });

    var all=programsOf(book), concepts=conceptsOf(book);
    var linked=book.chapters.filter(function(c){return (c.programs||[]).length}).length;

    app.innerHTML=
      '<nav class="topbar"><a class="btn" href="#/">← 서재</a><span class="crumb">목차를 따라 프로그램을 골라 보자</span></nav>'+
      (concepts.length?'<div class="finder" role="group" aria-label="개념으로 찾기"><span class="k">개념으로 찾기</span>'+
        concepts.map(function(c){ return '<button class="chip" data-c="'+esc(c)+'" aria-pressed="false">'+esc(c)+'</button>'; }).join('')+'</div>':'')+
      '<section class="map" id="map">'+
        '<svg class="links" id="links" aria-hidden="true"></svg>'+
        '<div class="col left">'+left.map(bubble).join('')+'</div>'+
        '<div class="center">'+
          '<img class="cover" id="cover" src="'+url(book.dir+'/'+book.cover)+'" alt="『'+esc(book.title)+'』 표지">'+
          '<div><h1>'+esc(book.title)+'</h1><p class="who">'+esc(book.author)+(book.translator?' 지음 · '+esc(book.translator)+' 옮김':'')+'</p></div>'+
          (book.intro?'<p class="intro">'+esc(book.intro)+'</p>':'')+
          '<div class="stat"><span class="pill red">프로그램 '+all.length+'개</span><span class="pill">'+book.chapters.length+'장 중 '+linked+'장</span></div>'+
        '</div>'+
        '<div class="col right">'+right.map(bubble).join('')+'</div>'+
      '</section>';

    app.querySelectorAll('.prog').forEach(function(b){
      b.addEventListener('click',function(){ location.hash='#/book/'+book.id+'/'+b.getAttribute('data-p'); });
    });
    app.querySelectorAll('.chip').forEach(function(b){
      b.addEventListener('click',function(){
        concept = concept===b.getAttribute('data-c') ? null : b.getAttribute('data-c');
        applyConcept(book);
      });
    });
    var img=$('cover'); if(img && !img.complete) img.addEventListener('load',drawLinks);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(drawLinks);
    drawLinks();
    window.scrollTo(0,0);
  }
  // 소제목 한 줄: 시작 쪽 + 소제목들
  function secs(ch){
    var s=ch.sections||[];
    if(!s.length && !ch.page) return '';
    return '<p class="secs">'+(ch.page?'<span class="num">p.'+ch.page+'</span>':'')+s.map(esc).join('<i> · </i>')+'</p>';
  }
  function bubble(ch){
    var ps=ch.programs||[];
    if(!ps.length){
      return '<div class="bubble empty" data-ch="'+ch.no+'"><div class="bhead"><span class="bno">'+ch.no+'장</span><h2 class="btitle">'+esc(ch.title)+'</h2><span class="soon">준비 중</span></div>'+secs(ch)+'</div>';
    }
    return '<div class="bubble" data-ch="'+ch.no+'"><div class="bhead"><span class="bno">'+ch.no+'장</span><h2 class="btitle">'+esc(ch.title)+'</h2></div>'+secs(ch)+
      '<ul class="plist">'+ps.map(function(p){
        var meta=[p.session,p.pages].filter(Boolean).join(' · ');
        return '<li><button class="prog" data-p="'+esc(p.id)+'" data-cs="'+esc((p.concepts||[]).join('|'))+'">'+
          '<span class="pt">'+esc(p.title)+(p.type?'<span class="type '+typeClass(p.type)+'">'+esc(p.type)+'</span>':'')+'</span>'+
          (p.summary?'<span class="ps">'+esc(p.summary)+'</span>':'')+
          (meta?'<span class="pm">'+esc(meta)+'</span>':'')+
          '<span class="go" aria-hidden="true">→</span></button></li>';
      }).join('')+'</ul></div>';
  }
  function applyConcept(){
    app.querySelectorAll('.chip').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-c')===concept?'true':'false'); });
    app.querySelectorAll('.bubble').forEach(function(bu){
      var any=false;
      bu.querySelectorAll('.prog').forEach(function(p){
        var hit=!!concept && p.getAttribute('data-cs').split('|').indexOf(concept)>-1;
        p.classList.toggle('hit',hit);
        p.classList.toggle('dim',!!concept && !hit);
        if(hit) any=true;
      });
      bu.classList.toggle('dim',!!concept && !any);
    });
    drawLinks();
  }

  // 표지 가장자리에서 각 장 말풍선까지 점선 잇기 (넓은 화면에서만)
  function drawLinks(){
    var map=$('map'), svg=$('links'), cover=$('cover');
    if(!map||!svg||!cover) return;
    if(getComputedStyle(svg).display==='none'){ svg.innerHTML=''; return; }
    var mr=map.getBoundingClientRect(), cr=cover.getBoundingClientRect(), s='';
    ['right','left'].forEach(function(side){
      var bs=Array.prototype.slice.call(map.querySelectorAll('.col.'+side+' .bubble'));
      bs.forEach(function(b,i){
        var br=b.getBoundingClientRect();
        var t=bs.length===1?0.5:i/(bs.length-1);
        var x1=(side==='right'?cr.right:cr.left)-mr.left;
        var y1=cr.top-mr.top+cr.height*(0.15+0.7*t);
        var x2=(side==='right'?br.left:br.right)-mr.left;
        var y2=br.top-mr.top+Math.min(br.height/2,30);
        var dx=(x2-x1)*0.55;
        var cls=(b.classList.contains('empty')?'':' on')+(b.classList.contains('dim')?' dim':'');
        s+='<path class="link'+cls+'" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' C'+(x1+dx).toFixed(1)+' '+y1.toFixed(1)+' '+(x2-dx).toFixed(1)+' '+y2.toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1)+'"/>';
        s+='<circle class="knot'+cls+'" cx="'+x1.toFixed(1)+'" cy="'+y1.toFixed(1)+'" r="3"/>';
      });
    });
    svg.innerHTML=s;
  }
  var raf=0;
  window.addEventListener('resize',function(){ cancelAnimationFrame(raf); raf=requestAnimationFrame(drawLinks); });

  /* ---------- 프로그램 보기 ---------- */
  var viewer=$('viewer'), frame=$('vFrame'), current=null;
  function openProgram(book, pid){
    var all=programsOf(book), k=-1;
    for(var i=0;i<all.length;i++) if(all[i].p.id===pid) k=i;
    if(k<0){ closeViewer(); return; }
    var x=all[k], src=url(book.dir+'/'+x.p.file);
    $('vCh').textContent=x.ch.no+'장';
    $('vTitle').textContent=x.p.title;
    $('vOpen').href=src;
    if(frame.getAttribute('src')!==src) frame.setAttribute('src',src);
    var prev=all[k-1], next=all[k+1];
    $('vPrev').disabled=!prev; $('vNext').disabled=!next;
    $('vPrev').onclick=function(){ if(prev) location.hash='#/book/'+book.id+'/'+prev.p.id; };
    $('vNext').onclick=function(){ if(next) location.hash='#/book/'+book.id+'/'+next.p.id; };
    $('vPrev').title=prev?'이전: '+prev.p.title:''; $('vNext').title=next?'다음: '+next.p.title:'';
    document.title=x.p.title+' · '+book.title;
    if(viewer.hidden){ viewer.hidden=false; document.body.classList.add('locked'); $('vClose').focus(); }
    current=book;
  }
  function closeViewer(){
    if(viewer.hidden) return;
    viewer.hidden=true; frame.removeAttribute('src'); document.body.classList.remove('locked');
    if(current) document.title=current.title+' · 책 개념 지도';
    current=null;
    drawLinks();
  }
  $('vClose').addEventListener('click',function(){ location.hash = shown ? '#/book/'+shown : '#/'; });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && !viewer.hidden) $('vClose').click(); });

  /* ---------- 라우터 ---------- */
  function route(){
    var parts=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);
    var book = parts[0]==='book' ? bookById(parts[1]) : null;
    // 책이 하나뿐이어도 서재를 거치게 둔다 (나중에 책이 늘어날 것을 대비)
    if(!book){ if(shown!=='') renderLibrary(); closeViewer(); return; }
    if(shown!==book.id) renderBook(book);
    if(parts[2]) openProgram(book, parts[2]); else closeViewer();
  }
  window.addEventListener('hashchange',route);
  route();
})();
