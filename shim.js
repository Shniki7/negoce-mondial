/* Négoce Mondial — connexion à Firebase.
   Fournit au jeu la même interface que sur claude.ai (claude.use('db') / claude.use('user')),
   mais branchée sur Cloud Firestore et une connexion anonyme Firebase. */
(function(){
  "use strict";
  const cfg = window.FIREBASE_CONFIG;
  let ready;
  if (!cfg || !cfg.apiKey || String(cfg.apiKey).indexOf('COLLE') === 0 || typeof firebase === 'undefined'){
    ready = Promise.resolve(null);
  } else {
    firebase.initializeApp(cfg);
    const auth = firebase.auth(), fs = firebase.firestore();
    /* On attend que Firebase ait relu la session enregistrée sur cet appareil avant de créer
       une connexion anonyme : sinon chaque visite pourrait créer un nouveau joueur. */
    ready = auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {}).then(() => new Promise(resolve => {
      let asked = false;
      auth.onAuthStateChanged(u => {
        if (u){ resolve(u); return; }
        if (!asked){ asked = true; auth.signInAnonymously().catch(e => { console.error('Connexion anonyme refusée', e); resolve(null); }); }
      });
    })).then(u => u ? {u, fs} : null);
    /* Vraie identification : compte Google. Si le joueur jouait déjà en anonyme sur cet appareil,
       son identité est rattachée au compte Google : il garde ses parties en cours. */
    const MSG = {
      'auth/popup-blocked': "Ton navigateur a bloqué la fenêtre de connexion. Autorise les fenêtres pour ce site, puis réessaie.",
      'auth/popup-closed-by-user': "Connexion annulée.",
      'auth/cancelled-popup-request': "Connexion annulée.",
      'auth/operation-not-allowed': "La connexion Google n'est pas activée dans Firebase (Authentication → Méthode de connexion → Google).",
      'auth/unauthorized-domain': "Ce site n'est pas dans les domaines autorisés de Firebase (Authentication → Paramètres → Domaines autorisés).",
      'auth/web-storage-unsupported': "Ce navigateur bloque la connexion. Ouvre le jeu dans Chrome ou Safari.",
      'auth/network-request-failed': "Pas de connexion Internet. Réessaie."
    };
    window.NM_AUTH = {
      info(){ const u = auth.currentUser; return u ? {anonymous: u.isAnonymous, name: u.displayName || '', photo: u.photoURL || ''} : {anonymous: true, name: '', photo: ''}; },
      async google(){
        const prov = new firebase.auth.GoogleAuthProvider(); prov.setCustomParameters({prompt: 'select_account'});
        const u = auth.currentUser;
        try {
          if (u && u.isAnonymous) await u.linkWithPopup(prov); else await auth.signInWithPopup(prov);
        } catch(e){
          if ((e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use') && e.credential) await auth.signInWithCredential(e.credential);
          else throw e;
        }
        location.reload();
      },
      async signOut(){ await auth.signOut(); location.reload(); },
      explain(e){ const ua = navigator.userAgent || ''; if (/FBAN|FBAV|Instagram|WhatsApp|Line\/|wv\)/.test(ua)) return "La connexion Google ne marche pas dans le navigateur d'une appli. Ouvre le jeu dans Chrome ou Safari (menu ⋮ → Ouvrir dans le navigateur)."; return MSG[e && e.code] || ('Connexion impossible : ' + ((e && e.message) || 'erreur inconnue')); }
    };
  }
  /* Firestore refuse les tableaux imbriqués : chaque document est stocké en JSON,
     avec updatedAt à part pour pouvoir trier la liste des parties. */
  const enc = d => ({_j: JSON.stringify(d), updatedAt: Number(d && d.updatedAt) || 0});
  const dec = raw => { if (!raw) return undefined; try { return raw._j ? JSON.parse(raw._j) : raw; } catch(e){ return undefined; } };
  const wrap = s => { const d = s.exists ? dec(s.data()) : undefined; return {id: s.id, exists: s.exists && d !== undefined, data: () => d, metadata: {fromCache: s.metadata.fromCache, hasPendingWrites: s.metadata.hasPendingWrites}}; };
  const err = e => ({code: e && e.code === 'permission-denied' ? 'invalid_argument' : 'unavailable', message: e && e.message || String(e)});
  function makeDb(fs){
    return {
      doc(path){
        const ref = fs.doc(path);
        return {
          id: ref.id, path,
          get: async () => wrap(await ref.get()),
          set: d => ref.set(enc(d)).catch(e => { throw err(e); }),
          delete: () => ref.delete().catch(e => { throw err(e); }),
          acquire: async () => ({acquired: true}),
          onSnapshot: (next, onErr) => ref.onSnapshot(s => next(wrap(s)), e => onErr && onErr(err(e))),
          /* Modification atomique : relue et rejouée si quelqu'un a écrit entre-temps. */
          tx: fn => fs.runTransaction(async t => { const s = await t.get(ref); const out = fn(s.exists ? dec(s.data()) : undefined); if (out) t.set(ref, enc(out)); return out; }).catch(e => { throw err(e); })
        };
      },
      collection(path){
        let q = fs.collection(path);
        const api = {
          orderBy(f, dir){ q = q.orderBy(f, dir || 'asc'); return api; },
          limit(n){ q = q.limit(n); return api; },
          onSnapshot(next, onErr){ return q.onSnapshot(s => next({docs: s.docs.map(wrap).filter(x => x.exists), size: s.size, empty: s.empty}), e => onErr && onErr(err(e))); }
        };
        return api;
      }
    };
  }
  window.claude = {
    use: async name => {
      const r = await ready; if (!r) return null;
      if (name === 'db') return makeDb(r.fs);
      if (name === 'user') return {id: async () => r.u.uid, can: async () => true, name: async () => (r.u.displayName || '').split(' ')[0], isOwner: async () => false, canEdit: async () => true};
      return null;
    }
  };
})();
