(function(){
  /* ---------- Build playable Blob URLs (iOS Safari cannot play video/audio from data: URIs) ---------- */

  /* ---------- VIDEO ---------- */
  const video = document.getElementById('mainVideo');
  const introImage = document.getElementById('introImage');
  const introGoldButton = document.getElementById('introGoldButton');

  try{
    video.src = window.__ASSET_VIDEO_MP4__;
    video.load();
  }catch(e){ console.error('video blob error', e); }

  /* ---------- POST-VIDEO MUSIC ---------- */
  const postVideoAudio = document.getElementById('postVideoAudio');
  let audioShouldStart = false;
  try{
    if(postVideoAudio){
      postVideoAudio.src = window.__ASSET_MUSIC_MP3__;
      postVideoAudio.load();
    }
  }catch(e){ console.error('audio blob error', e); }

  /* ---------- MUSIC TOGGLE ---------- */
  const musicToggle = document.getElementById('musicToggle');
  const musicToggleIcon = document.getElementById('musicToggleIcon');
  let userPausedMusic = false;
  function updateMusicToggle(){ if(!postVideoAudio || !musicToggle) return; const playing=!postVideoAudio.paused&&!postVideoAudio.ended; musicToggleIcon.textContent='♫'; musicToggle.setAttribute('aria-label',playing?'إيقاف الموسيقى':'تشغيل الموسيقى'); musicToggle.title=playing?'إيقاف الموسيقى':'تشغيل الموسيقى'; }
  if(musicToggle&&postVideoAudio){
    musicToggle.addEventListener('click',(e)=>{
      e.stopPropagation();
      if(postVideoAudio.paused){
        userPausedMusic=false;
        audioShouldStart=true;
        postVideoAudio.play().catch(()=>{});
      }else{
        userPausedMusic=true;
        audioShouldStart=false;
        postVideoAudio.pause();
      }
      updateMusicToggle();
    });
    postVideoAudio.addEventListener('play',()=>{musicToggle.classList.add('show');updateMusicToggle();});
    postVideoAudio.addEventListener('pause',updateMusicToggle);
    postVideoAudio.addEventListener('ended',updateMusicToggle);
  }

  /* ---------- RSVP CONFIRMATION ---------- */
  const rsvpSubmit = document.getElementById('rsvpSubmit');
  const rsvpStatus = document.getElementById('rsvpStatus');

  if(rsvpSubmit){
    rsvpSubmit.addEventListener('click', async ()=>{
      const name = document.getElementById('rsvpName')?.value.trim();
      const attendance = document.querySelector('input[name="attendance"]:checked')?.value;
      const guests = document.getElementById('rsvpGuests')?.value || '0';

      if(!name){
        rsvpStatus.textContent = 'يرجى كتابة الاسم الكريم ♡';
        return;
      }
      if(!attendance){
        rsvpStatus.textContent = 'يرجى اختيار حالة الحضور ♡';
        return;
      }

      const messages = {
        yes: 'شكرًا لتأكيد حضوركم، ننتظركم بكل فرح ♡',
        maybe: 'شكرًا لكم، يسعدنا حضوركم متى ما تيسّر ♡',
        no: 'شكرًا لتواصلكم، وستبقى محبتكم حاضرة في فرحتنا ♡'
      };
      rsvpSubmit.disabled = true;
      rsvpStatus.textContent = 'جاري الإرسال...';
      try{
        await window.WeddingBackend.addRsvp({ name, attendance, guests });
        rsvpStatus.textContent = messages[attendance];
        rsvpStatus.setAttribute('data-guests', guests);
      }catch(e){
        rsvpStatus.textContent = 'تعذر الإرسال، حاولوا مرة أخرى';
      }finally{
        rsvpSubmit.disabled = false;
      }
    });
  }

  /* ---------- REVEAL SECOND IMAGE AFTER VIDEO ENDS ---------- */
  const heroReveal = document.getElementById('heroReveal');
  let revealed = false;
  let paperZoomStarted = false;
  video.addEventListener('timeupdate',()=>{
    // The uploaded video brings the paper back around 28–30s.
    // Start a very slow, gentle zoom so the paper becomes the visual gateway to the invitation.
    if(!paperZoomStarted && video.currentTime >= 28){
      paperZoomStarted = true;
      video.classList.add('paper-zoom');
    }
  });

  video.addEventListener('ended', ()=>{
    if(revealed) return;
    revealed = true;
    video.style.opacity = 0;
    heroReveal.classList.add('show');
    heroReveal.setAttribute('aria-hidden','false');

    // Show the post-video image first. Then reveal the invitation text blocks one after another.
    const revealContent = heroReveal.querySelector('.reveal-content');
    if(revealContent){
      revealContent.classList.remove('reveal-sequence-ready');
      setTimeout(()=>{
        if(!revealed) return;
        revealContent.classList.add('reveal-sequence-ready');
      }, 250);
    }

    // Start the new music immediately after the video finishes.
    userPausedMusic = false;
    audioShouldStart = true;
    if(musicToggle) musicToggle.classList.add('show');
    if(postVideoAudio && postVideoAudio.paused){
      postVideoAudio.play().catch(()=>{
        // Some browsers require another user interaction before audio playback.
        // A first touch/click/scroll after the video will retry automatically.
      });
    }

    // Show the scroll instruction only after the video has completely finished.
    const scrollHint = document.getElementById('scrollHint');
    if(scrollHint) scrollHint.classList.add('show');
  });

  // Fallback for browsers that block audio playback until another user gesture.
  function resumePostVideoAudio(){
    if(!audioShouldStart || userPausedMusic || !postVideoAudio) return;
    postVideoAudio.play().catch(()=>{});
  }
  ['click','touchstart','pointerdown'].forEach(evt=>{
    document.addEventListener(evt, resumePostVideoAudio, {passive:true});
  });


  /* Intro -> video: the gold circle blooms first, then the first video frame appears smoothly. */
  video.style.opacity = '0';
  let introLaunching = false;
  function launchInvitation(){
    if(introLaunching) return;
    introLaunching = true;
    introImage.classList.add('launching');

    // Give the gold circle a short luminous transition before revealing the video.
    setTimeout(()=>{
      introImage.classList.add('hide');
      video.currentTime = 0;
      video.style.opacity = '1';
      /* الموسيقى تبدأ بعد ثانية واحدة من بداية الفيديو */
      setTimeout(()=>{
        if(!postVideoAudio || userPausedMusic) return;
        audioShouldStart = true;
        postVideoAudio.currentTime = 0;
        postVideoAudio.play().catch(()=>{});
      }, 1000);
      video.play().catch(()=>{
        // If a browser blocks unmuted playback, retry muted; the user can then enable sound.
        video.muted = true;
        video.play().catch(()=>{});
      });
    }, 1100);
  }

  if(introGoldButton){
    introGoldButton.addEventListener('click', launchInvitation, {once:true});
  }

  /* ---------- COUNTDOWN ---------- */
  const target = new Date('2026-10-24T17:00:00');
  function updateCountdown(){
    const now = new Date();
    let diff = target - now;
    if(diff < 0) diff = 0;
    const d = Math.floor(diff/(1000*60*60*24));
    const h = Math.floor((diff/(1000*60*60))%24);
    const m = Math.floor((diff/(1000*60))%60);
    const s = Math.floor((diff/1000)%60);
    document.getElementById('cd-days').textContent = d;
    document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
    document.getElementById('cd-mins').textContent = String(m).padStart(2,'0');
    document.getElementById('cd-secs').textContent = String(s).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- WISHES ---------- */
  const wishList = document.getElementById('wishList');
  const wishEmpty = document.getElementById('wishEmpty');

  let wishCache = [];
  function renderWishes(arr){
    wishCache = arr;
    wishList.querySelectorAll('.wish-card').forEach(el=>el.remove());
    if(arr.length === 0){
      wishEmpty.style.display = 'block';
      return;
    }
    wishEmpty.style.display = 'none';
    /* الأحدث أولاً (الترتيب يأتي جاهزاً من الخادم) */
    arr.forEach(w=>{
      const card = document.createElement('div');
      card.className = 'wish-card';
      const nm = document.createElement('div');
      nm.className = 'wish-name';
      nm.textContent = w.name + ' ♡';
      const tx = document.createElement('div');
      tx.className = 'wish-text';
      tx.textContent = w.message;
      card.appendChild(nm);
      card.appendChild(tx);
      wishList.appendChild(card);
    });
  }

  /* جلب تهاني هذه الدعوة فقط، ويتم عند اقتراب القسم من الشاشة لتوفير القراءات */
  let wishesLoading = false, wishesLoaded = false;
  function loadWishes(){
    if(wishesLoading || wishesLoaded) return;
    wishesLoading = true;
    window.WeddingBackend.getWishes()
      .then(list=>{ wishesLoaded = true; renderWishes(list); })
      .catch(()=>{})
      .finally(()=>{ wishesLoading = false; });
  }
  const wishesWatch = document.getElementById('wishes-section');
  if('IntersectionObserver' in window && wishesWatch){
    const wio = new IntersectionObserver((entries, obs)=>{
      if(entries.some(e=>e.isIntersecting)){ loadWishes(); obs.disconnect(); }
    }, { rootMargin: '900px 0px' });
    wio.observe(wishesWatch);
  }else{
    loadWishes();
  }

  const wishBtn = document.getElementById('wishSubmit');
  wishBtn.addEventListener('click', async ()=>{
    const name = document.getElementById('wishName').value.trim();
    const message = document.getElementById('wishText').value.trim();
    const statusEl = document.getElementById('wishStatus');
    if(!name || !message){
      statusEl.textContent = 'الرجاء كتابة الاسم والرسالة';
      return;
    }
    wishBtn.disabled = true;
    statusEl.textContent = 'جاري الإرسال...';
    try{
      const w = await window.WeddingBackend.addWish({ name, message });
      renderWishes([w].concat(wishCache));
      statusEl.textContent = 'شكرًا لتهنئتكم الجميلة ♡';
      document.getElementById('wishName').value = '';
      document.getElementById('wishText').value = '';
    }catch(e){
      statusEl.textContent = 'تعذر الإرسال، حاولوا مرة أخرى';
    }finally{
      wishBtn.disabled = false;
    }
  });

  /* ---------- FLOATING HEARTS (wishes section) ---------- */
  const heartsLayer = document.getElementById('heartsLayer');
  const wishesSection = document.getElementById('wishes-section');
  let heartsActive = false;
  const hio = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{ heartsActive = entry.isIntersecting; });
  }, { threshold: 0.15 });
  hio.observe(wishesSection);

  function spawnHeart(){
    if(!heartsActive) return;
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = '♥';
    h.style.left = (10 + Math.random()*80) + '%';
    h.style.fontSize = (12 + Math.random()*10) + 'px';
    heartsLayer.appendChild(h);
    const dur = 4500 + Math.random()*2000;
    const drift = (Math.random()-0.5)*40;
    h.animate([
      { transform:'translate(0,0)', opacity:0 },
      { transform:'translate(' + (drift*0.5) + 'px,-40%)', opacity:0.5, offset:0.15 },
      { transform:'translate(' + drift + 'px,-320%)', opacity:0 }
    ], { duration: dur, easing:'ease-out' });
    setTimeout(()=>h.remove(), dur+100);
  }
  setInterval(spawnHeart, 2600);
})();
;
/* نجوم لؤلؤية + غبار لؤلؤي: تبدأ بعد الفيديو وتنزل مع الشاشة أثناء التمرير بحركة سلسة */
(function(){
  var video=document.getElementById('mainVideo'); if(!video) return;
  var canvas,ctx,W=0,H=0,dpr=1,stars=[],dust=[],running=false,last=0,t0=0,sy=0,prevSy=0,scrollV=0;
  var reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAR=[[-0.5267,-0.0188],[-0.5267,-0.0125],[-0.4824,0.0128],[-0.4698,0.0128],[-0.4002,0.0571],[-0.3622,0.0698],[-0.2166,0.152],[-0.1913,0.3926],[-0.185,0.3989],[-0.185,0.4495],[-0.1723,0.4938],[0.0745,0.2533],[0.3214,0.2976],[0.4036,0.3229],[0.4163,0.3166],[0.334,0.152],[0.334,0.1394],[0.2707,0.0255],[0.2707,-0.0062],[0.353,-0.1454],[0.3783,-0.2024],[0.41,-0.2467],[0.429,-0.2973],[0.2391,-0.272],[0.2328,-0.2657],[0.1948,-0.2657],[0.1885,-0.2593],[0.1505,-0.2593],[0.1441,-0.253],[0.0872,-0.253],[-0.1407,-0.4998],[-0.1533,-0.4998],[-0.2103,-0.1644],[-0.2229,-0.1517],[-0.4002,-0.0758],[-0.4381,-0.0505]];
  function rnd(a,b){return a+Math.random()*(b-a);}
  var S=128, starSprite, glowSprite, dustSprite;
  function path(c,sc,ox,oy){c.beginPath();for(var i=0;i<STAR.length;i++){var x=ox+STAR[i][0]*sc,y=oy+STAR[i][1]*sc;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}
  function buildSprites(){
    starSprite=document.createElement('canvas'); starSprite.width=starSprite.height=S;
    var c=starSprite.getContext('2d'), m=S/2, sc=S*0.86;
    path(c,sc,m,m);
    var g=c.createLinearGradient(m-sc*.5,m-sc*.5,m+sc*.5,m+sc*.5);
    g.addColorStop(0,'#ffffff'); g.addColorStop(.5,'#fdf8f2'); g.addColorStop(1,'#efe4d6');
    c.fillStyle=g; c.fill();
    c.save(); c.clip();
    var r1=c.createRadialGradient(m-sc*.15,m-sc*.18,0,m-sc*.15,m-sc*.18,sc*.5);
    r1.addColorStop(0,'rgba(255,230,240,.5)'); r1.addColorStop(1,'rgba(255,230,240,0)');
    c.fillStyle=r1; c.fillRect(0,0,S,S);
    var r2=c.createRadialGradient(m+sc*.2,m+sc*.2,0,m+sc*.2,m+sc*.2,sc*.45);
    r2.addColorStop(0,'rgba(220,240,244,.5)'); r2.addColorStop(1,'rgba(220,240,244,0)');
    c.fillStyle=r2; c.fillRect(0,0,S,S);
    var r3=c.createRadialGradient(m-sc*.08,m-sc*.1,0,m-sc*.08,m-sc*.1,sc*.22);
    r3.addColorStop(0,'rgba(255,255,255,.95)'); r3.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=r3; c.fillRect(0,0,S,S);
    c.restore();
    path(c,sc,m,m); c.lineJoin='round'; c.lineWidth=S*0.035;
    var gg=c.createLinearGradient(0,0,S,S);
    gg.addColorStop(0,'#f0cf7a'); gg.addColorStop(.5,'#d4a94c'); gg.addColorStop(1,'#b98a2f');
    c.strokeStyle=gg; c.stroke();

    /* توهج أبيض لؤلؤي */
    glowSprite=document.createElement('canvas'); glowSprite.width=glowSprite.height=S;
    var gc=glowSprite.getContext('2d'), rg=gc.createRadialGradient(m,m,0,m,m,m);
    rg.addColorStop(0,'rgba(255,255,255,.95)'); rg.addColorStop(.28,'rgba(255,252,250,.5)');
    rg.addColorStop(.6,'rgba(255,244,248,.16)'); rg.addColorStop(1,'rgba(255,244,248,0)');
    gc.fillStyle=rg; gc.fillRect(0,0,S,S);

    /* ذرة غبار لؤلؤية */
    dustSprite=document.createElement('canvas'); dustSprite.width=dustSprite.height=32;
    var dc=dustSprite.getContext('2d'), rd=dc.createRadialGradient(16,16,0,16,16,16);
    rd.addColorStop(0,'rgba(255,255,255,1)'); rd.addColorStop(.35,'rgba(255,250,248,.7)');
    rd.addColorStop(.7,'rgba(255,240,246,.2)'); rd.addColorStop(1,'rgba(255,240,246,0)');
    dc.fillStyle=rd; dc.fillRect(0,0,32,32);
  }
  /* كل الجسيمات في فضاء الشاشة: تبقى ظاهرة وتنزل مع المستخدم أينما كان */
  function makeStar(initial){
    var size=Math.random()<0.55?6:10;
    return {x:rnd(0,W), y:initial?rnd(-H*.1,H):-rnd(10,H*.35), size:size,
      vy:rnd(16,40)*(0.75+size/40), amp:rnd(6,22), ph:rnd(0,6.283), ws:rnd(0.25,0.7),
      rot:rnd(0,6.283), rs:rnd(-0.6,0.6), tw:rnd(0.6,2), tp:rnd(0,6.283),
      glow:rnd(0.3,1), base:rnd(0.65,1), par:rnd(0.04,0.14)};
  }
  function makeDust(initial){
    return {x:rnd(0,W), y:initial?rnd(-H*.1,H):-rnd(10,H*.3), size:rnd(2,5.5),
      vy:rnd(8,26), amp:rnd(4,16), ph:rnd(0,6.283), ws:rnd(0.2,0.6),
      tw:rnd(0.5,1.8), tp:rnd(0,6.283), a:rnd(0.35,0.9), par:rnd(0.03,0.1)};
  }
  function counts(){return {s:Math.min(26,Math.max(12,Math.round(W/16))), d:Math.min(48,Math.max(22,Math.round(W/9)))};}
  function resize(){
    var nW=window.innerWidth, nH=Math.max(window.innerHeight,Math.min(window.screen&&screen.height||0,1400));
    if(canvas.width && nW===W && Math.abs(nH-H)<260) return;   /* ignore URL-bar height changes: no reallocation, no jank */
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=nW; H=nH;
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var n=counts();
    while(stars.length<n.s) stars.push(makeStar(true)); if(stars.length>n.s) stars.length=n.s;
    while(dust.length<n.d) dust.push(makeDust(true)); if(dust.length>n.d) dust.length=n.d;
  }
  function edge(y){ /* ظهور واختفاء ناعمان عند أعلى وأسفل الشاشة */
    var f=40; if(y<f) return Math.max(0,(y+20)/(f+20)); if(y>H-f) return Math.max(0,(H+20-y)/(f+20)); return 1;
  }
  function frame(t){
    if(!running) return;
    var dt=Math.min(0.05,(t-last)/1000||0.016); last=t;
    sy=window.pageYOffset||0;
    var dv=(sy-prevSy)/Math.max(dt,0.001); prevSy=sy;
    scrollV+=(dv-scrollV)*Math.min(1,dt*6);            /* تنعيم سرعة التمرير */
    ctx.clearRect(0,0,W,H);
    var i,p,px,py,tw,gl,gs,e;
    for(i=0;i<dust.length;i++){
      p=dust[i]; p.y+=(p.vy - scrollV*p.par)*dt; p.ph+=p.ws*dt; p.tp+=p.tw*dt;
      if(p.y>H+20||p.y<-H*.5){dust[i]=makeDust(false);continue;}
      px=p.x+Math.sin(p.ph)*p.amp; py=p.y; e=edge(py); if(e<=0) continue;
      tw=0.5+0.5*Math.sin(p.tp);
      ctx.globalAlpha=p.a*(0.4+0.6*tw)*e;
      ctx.drawImage(dustSprite,px-p.size/2,py-p.size/2,p.size,p.size);
    }
    for(i=0;i<stars.length;i++){
      p=stars[i]; p.y+=(p.vy - scrollV*p.par)*dt; p.ph+=p.ws*dt; p.tp+=p.tw*dt; p.rot+=p.rs*dt;
      if(p.y>H+30||p.y<-H*.5){stars[i]=makeStar(false);continue;}
      px=p.x+Math.sin(p.ph)*p.amp; py=p.y; e=edge(py); if(e<=0) continue;
      tw=0.5+0.5*Math.sin(p.tp);
      gl=p.glow*(0.4+0.6*tw); gs=p.size*(2.4+p.glow*2.2);
      ctx.globalAlpha=Math.min(1,gl*0.85)*e;
      ctx.drawImage(glowSprite,px-gs/2,py-gs/2,gs,gs);
      ctx.save(); ctx.translate(px,py); ctx.rotate(p.rot);
      ctx.globalAlpha=p.base*(0.75+0.25*tw)*e;
      ctx.drawImage(starSprite,-p.size/2,-p.size/2,p.size,p.size);
      ctx.restore();
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(frame);
  }
  function start(){
    if(running||reduce) return;
    buildSprites();
    canvas=document.createElement('canvas');
    canvas.setAttribute('aria-hidden','true');
    canvas.style.cssText='position:fixed;top:0;left:0;pointer-events:none;z-index:50;';
    document.body.appendChild(canvas);
    ctx=canvas.getContext('2d');
    resize();
    stars.forEach(function(p){p.y=-rnd(0,H*.6);});     /* تدخل تدريجياً من الأعلى */
    dust.forEach(function(p){p.y=-rnd(0,H*.6);});
    prevSy=window.pageYOffset||0;
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',function(){last=performance.now();});
    running=true; last=performance.now(); requestAnimationFrame(frame);
  }
  video.addEventListener('ended',function(){setTimeout(start,400);});
})();
;
/* يضع الدائرة الذهبية فوق الواكس سيل تماماً مهما كان مقاس الشاشة (نفس حساب object-fit:cover) */
(function(){
  var NW=878,NH=1536,CX=445,CY=688,D=232;
  var box=document.getElementById('introImage'), btn=document.getElementById('introGoldButton');
  if(!box||!btn) return;
  function place(){
    var w=box.clientWidth,h=box.clientHeight; if(!w||!h) return;
    var s=Math.max(w/NW,h/NH), ox=(w-NW*s)/2, oy=(h-NH*s)/2, d=D*s;
    btn.style.left=(ox+CX*s)+'px'; btn.style.top=(oy+CY*s)+'px';
    btn.style.width=d+'px'; btn.style.height=d+'px';
  }
  place();
  window.addEventListener('resize',place);
  window.addEventListener('orientationchange',place);
  window.addEventListener('load',place);
})();
;
(function(){
  var root=document.getElementById('memCarousel'); if(!root) return;
  var vp=root.querySelector('.mem-viewport'), track=root.querySelector('.mem-track');
  var slides=[].slice.call(track.children), dots=[].slice.call(root.querySelectorAll('.mem-dot'));
  var prev=root.querySelector('.mem-prev'), next=root.querySelector('.mem-next');
  var n=slides.length, i=0, W=0, SW=0, GAP=14, down=false, sx=0, dx=0, pid=null;
  (window.MEMORY_PHOTOS||[]).forEach(function(src,k){
    if(!src||!slides[k]) return;
    var im=new Image(); im.src=src; im.alt='ذكرى '+(k+1); im.draggable=false; im.decoding='async';
    slides[k].insertBefore(im,slides[k].firstChild); slides[k].classList.add('has-img');
  });
  function layout(){W=vp.clientWidth;SW=slides[0].offsetWidth;}
  function pos(extra){return W/2-(i*(SW+GAP)+SW/2)+(extra||0);}
  function render(anim,extra){
    track.style.transition=anim?'transform .5s cubic-bezier(.22,.8,.28,1)':'none';
    track.style.transform='translate3d('+pos(extra)+'px,0,0)';
    slides.forEach(function(s,k){s.classList.toggle('active',k===i);});
    dots.forEach(function(d,k){d.classList.toggle('on',k===i);});
    prev.classList.toggle('off',i===0); next.classList.toggle('off',i===n-1);
  }
  function go(k){i=Math.max(0,Math.min(n-1,k));render(true,0);}
  vp.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse'&&e.button!==0) return;
    down=true; sx=e.clientX; dx=0; pid=e.pointerId;
    try{vp.setPointerCapture(pid);}catch(_){}
  });
  vp.addEventListener('pointermove',function(e){
    if(!down) return;
    dx=e.clientX-sx;
    var edge=(i===0&&dx>0)||(i===n-1&&dx<0);
    render(false,edge?dx*0.3:dx);
  });
  function end(){
    if(!down) return; down=false;
    var th=Math.min(70,SW*0.2);
    if(dx<-th) i=Math.min(n-1,i+1); else if(dx>th) i=Math.max(0,i-1);
    dx=0; render(true,0);
  }
  vp.addEventListener('pointerup',end); vp.addEventListener('pointercancel',end);
  prev.addEventListener('click',function(){go(i-1);}); next.addEventListener('click',function(){go(i+1);});
  dots.forEach(function(d,k){d.addEventListener('click',function(){go(k);});});
  root.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')go(i-1);if(e.key==='ArrowRight')go(i+1);});
  slides.forEach(function(s,k){s.addEventListener('click',function(){if(k!==i&&Math.abs(dx)<4)go(k);});});
  window.addEventListener('resize',function(){layout();render(false,0);});
  window.addEventListener('load',function(){layout();render(false,0);});
  layout(); render(false,0);
})();