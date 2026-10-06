/* Firebase Firestore backend: التهاني + تأكيد الحضور
   البنية:  invitations/{invitationId}/wishes/{auto-id}
            invitations/{invitationId}/rsvps/{deviceId}
   كل دعوة لها مجموعاتها المستقلة، ولا يلزم أي فهرس مركّب (composite index). */
(function(){
  var FB_VERSION = '10.12.2';
  var BASE = 'https://www.gstatic.com/firebasejs/' + FB_VERSION + '/';
  var cfg = window.FIREBASE_CONFIG || {};
  var configured = !!(cfg.apiKey && cfg.projectId && cfg.appId);

  function resolveInvitationId(){
    var ok = /^[A-Za-z0-9_-]{3,60}$/;
    try{
      var q = new URLSearchParams(window.location.search).get('inv');
      if(q && ok.test(q)) return q;
    }catch(e){}
    var d = window.INVITATION_ID;
    return (d && ok.test(d)) ? d : 'default';
  }
  var INV = resolveInvitationId();

  /* تحميل Firebase عند الحاجة فقط (لا يؤثر على سرعة فتح الدعوة) */
  var sdk = null;
  function load(){
    if(sdk) return sdk;
    sdk = Promise.all([import(BASE + 'firebase-app.js'), import(BASE + 'firebase-firestore.js')])
      .then(function(m){
        var app = m[0].initializeApp(cfg);
        return { fs: m[1], db: m[1].getFirestore(app) };
      })
      .catch(function(e){ sdk = null; throw e; });
    return sdk;
  }

  /* ---------- بديل محلي عند عدم ضبط Firebase (للمعاينة فقط) ---------- */
  function lsGet(k){ try{ var v=JSON.parse(localStorage.getItem(k)); return Array.isArray(v)?v:[]; }catch(e){ return []; } }
  function lsSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  function clean(s, max){ return String(s == null ? '' : s).trim().slice(0, max); }
  function toInt(v, min, max){ var n = parseInt(v, 10); if(isNaN(n)) n = min; return Math.max(min, Math.min(max, n)); }

  /* ---------- التهاني ---------- */
  function getWishes(){
    if(!configured) return Promise.resolve(lsGet('wishes_' + INV).slice().reverse());
    return load().then(function(o){
      var fs = o.fs;
      var q = fs.query(fs.collection(o.db, 'invitations', INV, 'wishes'), fs.orderBy('createdAt', 'desc'), fs.limit(100));
      return fs.getDocs(q).then(function(snap){
        var out = [];
        snap.forEach(function(d){
          var x = d.data();
          out.push({ name: x.name, message: x.message });
        });
        return out;
      });
    });
  }

  function addWish(w){
    var name = clean(w.name, 60), message = clean(w.message, 500);
    if(!name || !message) return Promise.reject(new Error('empty'));
    var item = { name: name, message: message };
    if(!configured){
      var a = lsGet('wishes_' + INV); a.push(item); lsSet('wishes_' + INV, a);
      return Promise.resolve(item);
    }
    return load().then(function(o){
      var fs = o.fs;
      return fs.addDoc(fs.collection(o.db, 'invitations', INV, 'wishes'), {
        invitationId: INV, name: name, message: message, createdAt: fs.serverTimestamp()
      });
    }).then(function(){ return item; });
  }

  /* ---------- تأكيد الحضور ---------- */
  /* معرّف المستند = معرّف عشوائي خاص بجهاز الضيف، فإذا غيّر رأيه يتحدّث تأكيده نفسه بدل تكرار الاسم */
  function deviceId(){
    var key = 'rsvp_id_' + INV, id = null;
    try{ id = localStorage.getItem(key); }catch(e){}
    if(!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)){
      if(window.crypto && crypto.randomUUID){ id = crypto.randomUUID(); }
      else{ id = ''; for(var i=0;i<32;i++) id += Math.floor(Math.random()*16).toString(16); }
      try{ localStorage.setItem(key, id); }catch(e){}
    }
    return id;
  }

  function addRsvp(r){
    var name = clean(r.name, 60);
    var status = { yes: 'attending', maybe: 'maybe', no: 'declined' }[r.attendance];
    if(!name || !status) return Promise.reject(new Error('invalid'));
    var companions = status === 'declined' ? 0 : toInt(r.guests, 0, 20);
    var attendees = status === 'declined' ? 0 : companions + 1;
    if(!configured){
      lsSet('rsvp_' + INV, [{ name: name, status: status, companions: companions, attendees: attendees }]);
      return Promise.resolve(true);
    }
    return load().then(function(o){
      var fs = o.fs;
      return fs.setDoc(fs.doc(o.db, 'invitations', INV, 'rsvps', deviceId()), {
        invitationId: INV, name: name, status: status,
        companions: companions, attendees: attendees, createdAt: fs.serverTimestamp()
      });
    }).then(function(){ return true; });
  }

  window.WeddingBackend = { invitationId: INV, configured: configured, getWishes: getWishes, addWish: addWish, addRsvp: addRsvp };
})();
