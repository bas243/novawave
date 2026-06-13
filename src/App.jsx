/**
 * NOVAWAVE — Main Website (Mobile + Desktop)
 * Replace VITE_ vars with your Supabase credentials in .env
 */
let SUPABASE_URL = "";
let SUPABASE_KEY = "";
try { SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""; SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; } catch {}

import { useState, useEffect, useRef } from "react";

const store = {
  get: async (k) => { try { if (window.storage) return (await window.storage.get(k))?.value ?? null; } catch {} return localStorage.getItem(k); },
  set: async (k, v) => { try { if (window.storage) { await window.storage.set(k, v); return; } } catch {} localStorage.setItem(k, v); },
  del: async (k) => { try { if (window.storage) { await window.storage.delete(k); return; } } catch {} localStorage.removeItem(k); },
};

const hashPw = async (pw) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw + ":novawave_salt_2024"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const sb = (url, key) => ({
  from: (t) => ({
    select: async (cols = "*", f = "") => {
      const r = await fetch(`${url}/rest/v1/${t}?select=${cols}${f}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      if (!r.ok) throw new Error(await r.text()); return r.json();
    },
    insert: async (body) => {
      const r = await fetch(`${url}/rest/v1/${t}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text()); return r.json();
    },
    update: async (body, f = "") => {
      const r = await fetch(`${url}/rest/v1/${t}?${f}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return r.ok;
    },
    delete: async (f = "") => { const r = await fetch(`${url}/rest/v1/${t}?${f}`, { method: "DELETE", headers: { apikey: key, Authorization: `Bearer ${key}` } }); return r.ok; },
  }),
  storage: { upload: async (bucket, path, file) => { const r = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": file.type || "audio/mpeg" }, body: file }); if (!r.ok) throw new Error("Upload failed"); return `${url}/storage/v1/object/public/${bucket}/${path}`; } },
});

const fT  = s  => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
const fN  = n  => n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${(n/1e3).toFixed(1)}K`:`${n}`;
const uid = () => `${Date.now()}${Math.random().toString(36).slice(2,6)}`;
const HUES   = ["#a855f7","#3b82f6","#f59e0b","#ec4899","#10b981","#8b5cf6","#f97316","#06b6d4","#ef4444","#e879f9","#6366f1","#14b8a6"];
const GENRES = ["Electronic","Chill","Ambient","Indie","Hip-Hop","Dream Pop","Soul","Folk","Rock","J-Pop","Bass","Alt","Pop","R&B","Lo-Fi","Experimental"];

/* ════════════════════════════════════════════
   CSS
════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --bg:#07071a;
  --s1:#0e0e28;
  --s2:#161632;
  --s3:#1f1f46;
  --br:rgba(168,85,247,.13);
  --br2:rgba(168,85,247,.28);
  --ac:#c084fc;
  --ac-dk:#9333ea;
  --ac2:#22d3ee;
  --ac-bg:rgba(192,132,252,.14);
  --ac2-bg:rgba(34,211,238,.12);
  --tx:#f0eeff;
  --t2:#a89ec4;
  --t3:#5e587a;
  --dng:#f43f5e;
  --ok:#34d399;
  --warn:#fbbf24;
}

html,body{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
button{cursor:pointer;font-family:inherit;border:none;background:none;color:inherit;-webkit-tap-highlight-color:transparent}
input,select,textarea{font-family:inherit;color:var(--tx)}
input:focus,select:focus,textarea:focus{outline:none}
*::-webkit-scrollbar{width:4px}
*::-webkit-scrollbar-track{background:transparent}
*::-webkit-scrollbar-thumb{background:var(--s3);border-radius:2px}

@keyframes pulse{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:.45;transform:scaleY(.28)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}

/* ── AUTH ───────────────────────────────────── */
.auth-bg{height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:var(--bg)}
.orbs{position:absolute;inset:0;pointer-events:none}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.22;animation:float 9s ease-in-out infinite}
.o1{width:440px;height:440px;background:#7c3aed;top:-120px;left:-90px}
.o2{width:320px;height:320px;background:#0891b2;bottom:-70px;right:16%;animation-delay:2.8s}
.o3{width:260px;height:260px;background:#db2777;top:28%;right:-60px;animation-delay:5s}
.auth-card{width:min(420px,94vw);padding:clamp(24px,5vw,40px);z-index:1;background:rgba(14,14,40,.94);border:1px solid var(--br2);border-radius:24px;backdrop-filter:blur(24px);animation:popIn .5s ease both}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:5px}
.logo-icon{font-size:24px;color:var(--ac)}
.logo-text{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;letter-spacing:.12em}
.auth-tag{color:var(--t3);font-size:12px;margin-bottom:24px;font-style:italic}
.atabs{display:flex;gap:3px;background:var(--s2);padding:4px;border-radius:13px;margin-bottom:16px}
.atab{flex:1;padding:10px;border-radius:9px;font-size:14px;font-weight:600;transition:all .2s;color:var(--t2)}
.atab.on{background:var(--ac);color:#fff;box-shadow:0 2px 12px rgba(192,132,252,.35)}
.ai{width:100%;padding:13px 15px;margin-bottom:11px;background:var(--s2);border:1.5px solid var(--br);border-radius:12px;font-size:15px;transition:border-color .2s}
.ai:focus{border-color:var(--ac);background:var(--s1)}
.aerr{color:var(--dng);font-size:13px;margin-bottom:11px;padding:10px 13px;background:rgba(244,63,94,.09);border-radius:10px;border:1px solid rgba(244,63,94,.25)}
.abtn{width:100%;padding:14px;border-radius:13px;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;font-weight:700;font-size:15px;letter-spacing:.02em;transition:transform .15s,opacity .15s,box-shadow .2s;margin-bottom:12px;box-shadow:0 4px 20px rgba(192,132,252,.3);display:flex;align-items:center;justify-content:center;gap:8px}
.abtn:hover{opacity:.92;transform:translateY(-1px);box-shadow:0 6px 24px rgba(192,132,252,.4)}
.abtn:disabled{opacity:.45;pointer-events:none}
.spin-sm{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
.avatar-pick{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.av-btn{font-size:24px;padding:6px 8px;border-radius:10px;background:var(--s2);border:2px solid transparent;transition:all .2s;line-height:1}
.av-btn.sel{border-color:var(--ac);background:var(--ac-bg);transform:scale(1.1)}

/* ── APP SHELL ─────────────────────────────── */
.app{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.app-body{display:flex;flex:1;overflow:hidden;min-height:0}

/* ── SIDEBAR (desktop only) ──────────────────*/
.sb{width:220px;flex-shrink:0;background:var(--s1);border-right:1px solid var(--br);display:flex;flex-direction:column;overflow:hidden}
.sb-logo{display:flex;align-items:center;gap:9px;padding:18px 18px 14px;cursor:pointer}
.sb-logo .logo-icon{font-size:20px}
.sb-logo .logo-text{font-size:14px;letter-spacing:.1em}
.sb-nav{padding:0 8px;margin-bottom:4px}
.ni{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border-radius:12px;color:var(--t2);font-size:14px;font-weight:500;transition:all .2s;text-align:left}
.ni:hover{background:var(--s2);color:var(--tx)}
.ni.on{background:var(--ac-bg);color:var(--ac);border:1px solid var(--br2)}
.ni.on .nic{color:var(--ac)}
.nic{font-size:18px;width:22px;text-align:center;flex-shrink:0}
.ni-badge{font-size:9px;background:var(--dng);color:#fff;padding:2px 7px;border-radius:8px;font-weight:700;margin-left:auto}
.sb-pls{flex:1;overflow-y:auto;padding:0 8px}
.spt{display:flex;justify-content:space-between;align-items:center;padding:8px 12px 4px;color:var(--t3);font-size:10px;letter-spacing:.12em;font-weight:700;text-transform:uppercase}
.sb-add{width:20px;height:20px;border-radius:50%;background:var(--ac-bg);color:var(--ac);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;transition:all .2s;border:1px solid var(--br2)}
.sb-add:hover{background:var(--ac);color:#fff}
.sp-i{display:flex;align-items:center;gap:9px;width:100%;padding:8px 12px;border-radius:10px;color:var(--t2);font-size:13px;transition:all .18s;text-align:left;overflow:hidden}
.sp-i:hover{background:var(--s2);color:var(--tx)}
.sp-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.sb-user{display:flex;align-items:center;gap:9px;padding:12px 14px;margin:8px 8px 6px;background:var(--s2);border-radius:12px;cursor:pointer;transition:background .2s;flex-shrink:0;border:1px solid var(--br)}
.sb-user:hover{background:var(--s3);border-color:var(--br2)}
.sb-emo{font-size:22px}
.sb-ui{flex:1;overflow:hidden}
.sb-un{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;white-space:nowrap}
.admin-badge{font-size:9px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:2px 7px;border-radius:6px;font-weight:700;letter-spacing:.04em}
.sb-st{font-size:10px;color:var(--ac2);display:flex;align-items:center;gap:4px;margin-top:2px}
.sb-st::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--ac2);display:inline-block;animation:shimmer 2s ease infinite}

/* ── MAIN ──────────────────────────────────── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{padding:12px 20px;background:var(--s1);border-bottom:1px solid var(--br);flex-shrink:0;display:flex;gap:10px;align-items:center}
.sw{display:flex;align-items:center;gap:9px;background:var(--s2);border:1.5px solid var(--br);border-radius:13px;padding:9px 14px;flex:1;transition:all .2s}
.sw:focus-within{border-color:var(--ac);background:var(--s1);box-shadow:0 0 0 3px var(--ac-bg)}
.si-ic{color:var(--t3);font-size:16px}
.si{flex:1;background:none;border:none;font-size:15px;color:var(--tx)}
.si::placeholder{color:var(--t3)}
.sc{color:var(--t3);font-size:14px;padding:2px 4px;border-radius:6px}
.sc:hover{color:var(--tx);background:var(--s3)}
.content{flex:1;overflow-y:auto;overflow-x:hidden}
.vc{padding:20px 22px 90px;animation:fadeUp .3s ease both}
.vtitle{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:4px}
.vsub{color:var(--t2);margin-bottom:20px;font-size:14px}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;margin-top:6px}
.stitle{font-family:'Syne',sans-serif;font-size:15px;font-weight:700}
.slink{color:var(--ac);font-size:13px;font-weight:600;padding:4px 8px;border-radius:8px;transition:background .15s}
.slink:hover{background:var(--ac-bg)}
.scnt{color:var(--t3);font-size:12px}
.empty{color:var(--t3);font-size:13px;font-style:italic;padding:14px 0;text-align:center}

/* ── HOME ──────────────────────────────────── */
.hgreet{margin-bottom:22px}
.hgreet h1{font-family:'Syne',sans-serif;font-size:clamp(22px,5vw,28px);font-weight:800;margin-bottom:5px;line-height:1.2}
.gtx{background:linear-gradient(90deg,var(--ac),var(--ac2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hsub{color:var(--t2);font-size:14px}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px}
.fc{border-radius:18px;padding:16px;cursor:pointer;border:1.5px solid var(--br);position:relative;overflow:hidden;transition:transform .2s,border-color .25s,box-shadow .25s}
.fc:hover{transform:translateY(-4px);border-color:var(--br2);box-shadow:0 8px 32px rgba(0,0,0,.4)}
.fart{width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;margin-bottom:12px;font-family:'Syne',sans-serif}
.fgen{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--ac2);display:block;margin-bottom:3px;font-weight:600}
.ftit{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;margin-bottom:2px}
.fart2{color:var(--t2);font-size:12px;margin-bottom:8px}
.fsts{display:flex;gap:10px;font-size:11px;color:var(--t3)}
.fplay{position:absolute;right:13px;bottom:13px;width:36px;height:36px;border-radius:50%;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:14px;opacity:0;transform:scale(.75);transition:opacity .2s,transform .2s;box-shadow:0 2px 10px rgba(0,0,0,.3)}
.fc:hover .fplay{opacity:1;transform:scale(1)}
.gps{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}
.gp{padding:7px 15px;border-radius:20px;font-size:13px;font-weight:500;background:var(--s2);border:1.5px solid var(--br);color:var(--t2);cursor:pointer;transition:all .2s}
.gp:hover{border-color:var(--ac);color:var(--ac);background:var(--ac-bg)}
.gp.on{background:var(--ac);color:#fff;border-color:var(--ac);font-weight:600;box-shadow:0 2px 12px rgba(192,132,252,.3)}

/* ── SONG ROW ─────────────────────────────── */
.sl{display:flex;flex-direction:column;gap:3px;margin-bottom:22px}
.sr{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:12px;cursor:pointer;position:relative;transition:background .18s}
.sr:hover{background:var(--s2)}
.sr.act{background:var(--ac-bg);border:1.5px solid var(--br2)}
.srl{display:flex;align-items:center;gap:11px;flex:1;min-width:0}
.srr{display:flex;align-items:center;gap:7px;flex-shrink:0}
.snw{width:22px;text-align:center;flex-shrink:0}
.snum{color:var(--t3);font-size:12px;font-weight:500}
.scov{width:40px;height:40px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;font-family:'Syne',sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.si2{flex:1;min-width:0}
.stit{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sart{display:block;font-size:12px;color:var(--t2)}
.subby{color:var(--ac2);font-size:11px}
.mbadge{font-size:10px;color:var(--ac2);background:var(--ac2-bg);padding:3px 7px;border-radius:7px;font-weight:600;border:1px solid rgba(34,211,238,.2)}
.ib{font-size:16px;color:var(--t3);padding:5px 6px;transition:color .18s;border-radius:8px;line-height:1;min-height:32px;display:flex;align-items:center;justify-content:center}
.ib:hover{color:var(--tx);background:var(--s3)}
.ib.lk{color:var(--dng)}
.sdur{color:var(--t3);font-size:12px;width:36px;text-align:right;font-weight:500}
.wm{display:flex;align-items:flex-end;gap:2px;height:18px}
.wm span{width:3px;background:var(--ac);border-radius:2px}
.wm span:nth-child(1){height:55%;animation:pulse .9s ease infinite 0s}
.wm span:nth-child(2){height:100%;animation:pulse .9s ease infinite .2s}
.wm span:nth-child(3){height:70%;animation:pulse .9s ease infinite .1s}
.wm span:nth-child(4){height:40%;animation:pulse .9s ease infinite .3s}
.plm{position:absolute;right:40px;top:44px;z-index:50;background:var(--s2);border:1.5px solid var(--br2);border-radius:14px;padding:8px;min-width:180px;box-shadow:0 16px 40px rgba(0,0,0,.6);animation:popIn .2s ease both}
.plmt{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);padding:4px 10px 8px;font-weight:700}
.plmi{display:block;width:100%;text-align:left;padding:9px 11px;border-radius:9px;font-size:13px;color:var(--t2);transition:all .18s;font-weight:500}
.plmi:hover{background:var(--s3);color:var(--tx)}
.plmc{display:block;width:100%;text-align:center;padding:8px;border-top:1px solid var(--br);margin-top:4px;font-size:12px;color:var(--t3)}
.plmc:hover{color:var(--tx)}

/* ── DISCOVER ─────────────────────────────── */
.dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.dc{cursor:pointer;border-radius:14px;overflow:hidden;border:1.5px solid var(--br);transition:transform .2s,border-color .2s,box-shadow .2s}
.dc:hover{transform:translateY(-5px);border-color:var(--br2);box-shadow:0 10px 28px rgba(0,0,0,.4)}
.dart{height:130px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.dlet{font-family:'Syne',sans-serif;font-size:44px;font-weight:800;color:rgba(255,255,255,.45)}
.dplay{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:24px;opacity:0;transition:opacity .2s}
.dc:hover .dplay{opacity:1}
.dinfo{padding:11px;background:var(--s2)}
.dtit{font-size:13px;font-weight:700;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dart2{font-size:11px;color:var(--t2);margin-bottom:7px}
.dmeta{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--t3)}
.dgt{background:var(--ac-bg);padding:3px 8px;border-radius:6px;color:var(--ac);font-size:10px;font-weight:600;border:1px solid var(--br2)}

/* ── LIBRARY ──────────────────────────────── */
.lsec{margin-bottom:28px}
.pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:11px;margin-bottom:8px}
.pc{cursor:pointer;padding:16px;background:var(--s2);border-radius:14px;border:1.5px solid var(--br);text-align:center;transition:all .22s}
.pc:hover{background:var(--s3);border-color:var(--br2);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.part{font-size:34px;margin-bottom:9px}
.pname{font-size:13px;font-weight:700;margin-bottom:3px}
.pcnt{font-size:11px;color:var(--t3)}
.bk{color:var(--ac);font-size:13px;margin-bottom:16px;padding:6px 0;display:inline-flex;align-items:center;gap:5px;font-weight:600}
.bk:hover{text-decoration:underline}
.plhdr{display:flex;gap:20px;align-items:flex-end;margin-bottom:24px}
.plart-lg{font-size:64px;width:110px;height:110px;background:var(--s2);border-radius:16px;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--br);flex-shrink:0}
.plhi{flex:1}
.pltype{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--ac2);font-weight:700}
.plhn{font-family:'Syne',sans-serif;font-size:clamp(20px,4vw,28px);font-weight:800;margin:5px 0}
.plhm{color:var(--t2);font-size:13px;margin-bottom:14px}
.pall{padding:10px 22px;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;border-radius:22px;font-weight:700;font-size:14px;transition:all .2s;box-shadow:0 3px 14px rgba(192,132,252,.35)}
.pall:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 5px 18px rgba(192,132,252,.45)}

/* ── PROFILE ──────────────────────────────── */
.prfhdr{display:flex;gap:20px;align-items:center;margin-bottom:26px;background:var(--s1);border:1.5px solid var(--br);border-radius:20px;padding:22px}
.prfemo{font-size:56px}
.prfname{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.prfbio{color:var(--t2);font-size:13px;margin-bottom:12px}
.stats{display:flex;gap:20px;flex-wrap:wrap}
.st{text-align:center}
.stv{display:block;font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--ac)}
.stl{font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.sml{display:flex;flex-direction:column;gap:7px;margin-bottom:24px}
.smi{display:flex;align-items:flex-start;gap:11px;padding:12px;background:var(--s2);border-radius:12px;border:1.5px solid var(--br);cursor:pointer;transition:all .2s}
.smi:hover{border-color:var(--br2);background:var(--s3)}
.smd{width:9px;height:9px;border-radius:50%;flex-shrink:0;margin-top:4px}
.smt{font-size:14px;margin-bottom:3px;font-weight:500}
.smm{font-size:11px;color:var(--t3)}
.lout{padding:10px 18px;border:1.5px solid rgba(244,63,94,.35);color:var(--dng);border-radius:10px;font-size:14px;font-weight:600;transition:all .2s;margin-top:16px}
.lout:hover{background:rgba(244,63,94,.12)}

/* ── SUBMIT ───────────────────────────────── */
.submit-form{background:var(--s2);border:1.5px solid var(--br);border-radius:18px;padding:22px;margin-bottom:22px}
.submit-form h3{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:16px}
.drop-zone{border:2px dashed var(--br2);border-radius:14px;padding:32px 20px;text-align:center;cursor:pointer;transition:all .22s;position:relative;background:var(--s3)}
.drop-zone:hover,.drop-zone.drag{border-color:var(--ac);background:var(--ac-bg)}
.dz-icon{font-size:38px;margin-bottom:10px;display:block}
.dz-sub{color:var(--t2);font-size:13px}
.sf-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.sf-field{display:flex;flex-direction:column;gap:5px}
.sf-label{font-size:10px;font-weight:700;color:var(--ac2);text-transform:uppercase;letter-spacing:.08em}
.sf-inp{padding:10px 12px;background:var(--bg);border:1.5px solid var(--br);border-radius:10px;font-size:14px;color:var(--tx);transition:border-color .2s}
.sf-inp:focus{border-color:var(--ac);background:var(--s1)}
.sf-sel{padding:10px 12px;background:var(--bg);border:1.5px solid var(--br);border-radius:10px;font-size:14px;color:var(--tx);cursor:pointer}
.sf-sel:focus{border-color:var(--ac)}
.hue-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:5px}
.hue-dot{width:24px;height:24px;border-radius:50%;cursor:pointer;transition:transform .18s;border:2.5px solid transparent}
.hue-dot:hover{transform:scale(1.25)}
.hue-dot.sel{border-color:#fff;transform:scale(1.18);box-shadow:0 0 8px rgba(255,255,255,.4)}
.submit-btn{width:100%;margin-top:16px;padding:13px;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;border-radius:13px;font-weight:700;font-size:15px;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 3px 16px rgba(192,132,252,.3)}
.submit-btn:hover{opacity:.92;transform:translateY(-1px)}
.submit-btn:disabled{opacity:.45;pointer-events:none}
.submissions-list{display:flex;flex-direction:column;gap:9px}
.sub-item{display:flex;align-items:center;gap:12px;padding:13px 15px;background:var(--s2);border:1.5px solid var(--br);border-radius:13px;transition:border-color .2s}
.sub-item:hover{border-color:var(--br2)}
.sub-art{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;font-family:'Syne',sans-serif;flex-shrink:0}
.sub-info{flex:1;min-width:0}
.sub-title{font-size:14px;font-weight:700}
.sub-artist{font-size:12px;color:var(--t2)}
.sub-note{font-size:11px;color:var(--t3);margin-top:3px;font-style:italic}
.sub-status{font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;flex-shrink:0;letter-spacing:.03em}
.sub-status.pending{background:rgba(251,191,36,.14);color:var(--warn);border:1px solid rgba(251,191,36,.3)}
.sub-status.approved{background:rgba(52,211,153,.13);color:var(--ok);border:1px solid rgba(52,211,153,.28)}
.sub-status.rejected{background:rgba(244,63,94,.1);color:var(--dng);border:1px solid rgba(244,63,94,.25)}

/* ── ADMIN REVIEW ─────────────────────────── */
.admin-section{background:rgba(251,191,36,.04);border:1.5px solid rgba(251,191,36,.18);border-radius:18px;padding:22px;margin-bottom:24px}
.admin-section-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;margin-bottom:18px;color:var(--warn);display:flex;align-items:center;gap:8px}
.pending-card{background:var(--s2);border:1.5px solid var(--br);border-radius:14px;padding:15px;margin-bottom:11px;transition:border-color .2s}
.pending-card:hover{border-color:var(--br2)}
.pc-top{display:flex;align-items:center;gap:11px;margin-bottom:12px}
.pc-art{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;font-family:'Syne',sans-serif;flex-shrink:0}
.pc-info{flex:1;min-width:0}
.pc-title{font-size:14px;font-weight:700}
.pc-meta{font-size:12px;color:var(--t2)}
.pc-by{font-size:11px;color:var(--ac2);margin-top:2px;font-weight:600}
.pc-actions{display:flex;gap:7px;align-items:center}
.pc-play{width:32px;height:32px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .18s;border:1px solid var(--br)}
.pc-play:hover,.pc-play.on{background:var(--ac);color:#fff;border-color:var(--ac)}
.approve-btn{padding:8px 14px;background:rgba(52,211,153,.13);color:var(--ok);border:1.5px solid rgba(52,211,153,.3);border-radius:9px;font-size:12px;font-weight:700;transition:all .2s}
.approve-btn:hover{background:rgba(52,211,153,.24)}
.reject-btn{padding:8px 14px;background:rgba(244,63,94,.1);color:var(--dng);border:1.5px solid rgba(244,63,94,.26);border-radius:9px;font-size:12px;font-weight:700;transition:all .2s}
.reject-btn:hover{background:rgba(244,63,94,.2)}
.note-inp{flex:1;padding:8px 11px;background:var(--bg);border:1.5px solid var(--br);border-radius:9px;font-size:13px;color:var(--tx);transition:border-color .2s}
.note-inp:focus{border-color:var(--ac)}

/* ── CHAT PANEL ───────────────────────────── */
.cp{background:var(--s1);border-left:1px solid var(--br);display:flex;flex-direction:column;overflow:hidden;transition:width .3s ease;flex-shrink:0}
.cphdr{display:flex;align-items:center;justify-content:space-between;padding:14px 15px 11px;border-bottom:1px solid var(--br);flex-shrink:0}
.cphdr h3{font-family:'Syne',sans-serif;font-size:14px;font-weight:800}
.cpbtn{padding:5px 9px;background:var(--s2);border-radius:8px;color:var(--t2);font-size:13px;transition:all .18s;border:1px solid var(--br)}
.cpbtn:hover{color:var(--tx);border-color:var(--br2)}
.lb{display:flex;align-items:center;gap:5px}
.lbd{width:6px;height:6px;border-radius:50%;background:var(--ac);animation:pulse 1.5s ease infinite}
.lbt{font-size:10px;color:var(--ac);font-weight:600}
.fl{flex:1;overflow-y:auto;padding:6px}
.fi{display:flex;align-items:center;gap:10px;padding:9px;border-radius:10px;cursor:pointer;transition:background .18s}
.fi:hover{background:var(--s2)}
.femo{font-size:22px}
.fii{flex:1;min-width:0}
.fin{font-size:13px;font-weight:600;display:block}
.fls{font-size:10px;color:var(--ac2);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw{flex:1;display:flex;flex-direction:column;overflow:hidden}
.cwhdr{display:flex;align-items:center;gap:9px;padding:11px 13px;border-bottom:1px solid var(--br);flex-shrink:0}
.bsm{font-size:17px;color:var(--ac);padding:2px 4px}
.cfn{font-size:14px;font-weight:700}
.ma{flex:1;overflow-y:auto;padding:10px 10px 5px;display:flex;flex-direction:column;gap:7px}
.msg{display:flex;flex-direction:column}
.msg.me{align-items:flex-end}
.msg.them{align-items:flex-start}
.mbx{max-width:88%;padding:9px 13px;border-radius:14px;font-size:13px;line-height:1.45;font-weight:500}
.me .mbx{background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;border-radius:14px 14px 4px 14px;box-shadow:0 2px 10px rgba(192,132,252,.28)}
.them .mbx{background:var(--s3);border-radius:14px 14px 14px 4px}
.mt{font-size:9px;color:var(--t3);margin-top:3px;padding:0 3px}
.cnp{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--ac-bg);border-top:1px solid var(--br);font-size:11px;color:var(--ac);flex-shrink:0;font-weight:600}
.cnpd{width:6px;height:6px;border-radius:50%;flex-shrink:0;animation:pulse 1.5s ease infinite}
.cir{display:flex;gap:7px;padding:9px 11px;border-top:1px solid var(--br);flex-shrink:0}
.ci{flex:1;padding:9px 12px;background:var(--s2);border:1.5px solid var(--br);border-radius:11px;font-size:14px;color:var(--tx);transition:all .2s}
.ci:focus{border-color:var(--ac);background:var(--s1)}
.csb{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;box-shadow:0 2px 10px rgba(192,132,252,.3)}
.csb:hover{opacity:.88}

/* ── DESKTOP PLAYER ───────────────────────── */
.pb{height:72px;flex-shrink:0;display:flex;align-items:center;gap:14px;padding:0 22px;background:rgba(7,7,26,.97);border-top:1.5px solid var(--br);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.psi{display:flex;align-items:center;gap:11px;width:230px;cursor:pointer;flex-shrink:0}
.pa{width:44px;height:44px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;font-family:'Syne',sans-serif;position:relative;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.3)}
.paw{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;gap:2px;padding:5px;background:rgba(0,0,0,.42)}
.paw span{width:3px;background:#fff;border-radius:2px}
.paw span:nth-child(1){height:55%;animation:pulse .9s ease infinite 0s}
.paw span:nth-child(2){height:85%;animation:pulse .9s ease infinite .15s}
.paw span:nth-child(3){height:45%;animation:pulse .9s ease infinite .3s}
.pst{flex:1;min-width:0}
.ptit{display:block;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.part2{display:block;font-size:11px;color:var(--t2)}
.plk{font-size:18px;color:var(--t3);transition:color .18s;padding:3px;min-height:32px;display:flex;align-items:center}
.plk.lk{color:var(--dng)}
.plk:hover{color:var(--tx)}
.pc2{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.pctrl{display:flex;align-items:center;gap:7px}
.cb{font-size:17px;color:var(--t2);padding:6px;border-radius:8px;transition:all .18s;min-height:34px;display:flex;align-items:center;justify-content:center}
.cb:hover{color:var(--tx);background:var(--s3)}
.cb.on{color:var(--ac)}
.cbm{font-size:18px}
.cbp{width:38px;height:38px;border-radius:50%;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:15px;transition:transform .18s,opacity .18s;flex-shrink:0;box-shadow:0 2px 10px rgba(255,255,255,.2)}
.cbp:hover{opacity:.88;transform:scale(1.07)}
.pr{display:flex;align-items:center;gap:9px;width:100%;max-width:440px}
.tl{font-size:10px;color:var(--t3);width:30px;flex-shrink:0;font-weight:500}
.tl:last-child{text-align:right}
.pt{flex:1;height:5px;background:var(--s3);border-radius:3px;cursor:pointer;position:relative;transition:height .15s}
.pt:hover{height:7px}
.pf{height:100%;border-radius:3px;pointer-events:none}
.pm-dot{position:absolute;top:50%;transform:translate(-50%,-50%);width:7px;height:7px;border-radius:50%;background:var(--ac2);border:1.5px solid rgba(255,255,255,.5);pointer-events:none}
.prgt{display:flex;align-items:center;gap:9px;width:190px;justify-content:flex-end;flex-shrink:0}
.vol-ic{font-size:14px;color:var(--t2)}
.vol-sl{width:74px;height:4px;accent-color:var(--ac);cursor:pointer}
.pe{flex:1;display:flex;align-items:center;justify-content:center;gap:14px;color:var(--t3)}
.pe-btn{padding:9px 18px;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;border-radius:10px;font-size:14px;font-weight:700;transition:opacity .18s;box-shadow:0 2px 12px rgba(192,132,252,.28)}
.pe-btn:hover{opacity:.9}

/* ── NP MODAL ─────────────────────────────── */
.mo{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.76);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);animation:fadeUp .2s ease both}
.npm{width:min(560px,96vw);max-height:90vh;background:var(--s1);border:1.5px solid var(--br2);border-radius:24px;padding:28px;position:relative;overflow-y:auto;animation:popIn .3s ease both;box-shadow:0 30px 70px rgba(0,0,0,.65)}
.mc{position:absolute;top:14px;right:14px;font-size:18px;color:var(--t3);padding:7px;border-radius:9px;transition:all .18s}
.mc:hover{color:var(--tx);background:var(--s3)}
.np-art{width:100%;height:190px;border-radius:16px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:18px;box-shadow:0 8px 30px rgba(0,0,0,.4)}
.np-let{font-family:'Syne',sans-serif;font-size:76px;font-weight:900;color:rgba(255,255,255,.32)}
.np-wv{position:absolute;bottom:14px;display:flex;align-items:flex-end;gap:3px}
.np-wv span{width:5px;background:#fff;border-radius:3px;opacity:.8}
.np-wv span:nth-child(1){height:18px;animation:pulse .7s ease infinite 0s}
.np-wv span:nth-child(2){height:34px;animation:pulse .7s ease infinite .1s}
.np-wv span:nth-child(3){height:26px;animation:pulse .7s ease infinite .2s}
.np-wv span:nth-child(4){height:40px;animation:pulse .7s ease infinite .05s}
.np-wv span:nth-child(5){height:22px;animation:pulse .7s ease infinite .25s}
.np-tit{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:3px}
.np-art2{color:var(--t2);margin-bottom:3px;font-size:14px;font-weight:500}
.np-meta{font-size:12px;color:var(--ac2);margin-bottom:3px;font-weight:600}
.np-sts{font-size:12px;color:var(--t3);margin-bottom:18px}
.np-pb{width:100%;height:7px;background:var(--s3);border-radius:4px;cursor:pointer;position:relative;transition:height .15s;margin-top:7px}
.np-pb:hover{height:9px;margin-top:6px}
.np-ts{display:flex;justify-content:space-between;font-size:11px;color:var(--t3);font-weight:500}
.np-pf{height:100%;border-radius:4px;pointer-events:none}
.smdot{position:absolute;top:50%;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:50%;border:2.5px solid rgba(255,255,255,.55);cursor:pointer;z-index:1;transition:transform .18s}
.smdot:hover{transform:translate(-50%,-50%) scale(1.55)}
.smhdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;margin-top:18px}
.smhdr h3{font-size:15px;font-weight:800;font-family:'Syne',sans-serif}
.amb{font-size:13px;color:var(--ac);background:var(--ac-bg);padding:7px 13px;border-radius:10px;transition:all .18s;font-weight:600;border:1px solid var(--br2)}
.amb:hover{background:rgba(192,132,252,.22)}
.nir{display:flex;gap:8px;margin-bottom:12px}
.ni2{flex:1;padding:10px 13px;background:var(--s2);border:1.5px solid var(--br);border-radius:11px;font-size:14px;color:var(--tx)}
.ni2:focus{border-color:var(--ac)}
.ns{padding:10px 16px;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;border-radius:11px;font-size:14px;font-weight:700;box-shadow:0 2px 10px rgba(192,132,252,.3)}
.mlist{display:flex;flex-direction:column;gap:8px}
.memp{font-size:13px;color:var(--t3);font-style:italic}
.mi{display:flex;align-items:flex-start;gap:11px;padding:12px;background:var(--s2);border-radius:13px;cursor:pointer;transition:background .18s;border:1.5px solid var(--br)}
.mi:hover{background:var(--s3);border-color:var(--br2)}
.midk{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px}
.mitop{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px}
.miu{font-size:12px;font-weight:700;color:var(--ac)}
.mitm{font-size:11px;color:var(--ac2);font-weight:600}
.mitx{font-size:13px;line-height:1.45;font-weight:500}
.cpm{background:var(--s1);border:1.5px solid var(--br2);border-radius:20px;padding:24px;width:min(360px,94vw);animation:popIn .3s ease both;box-shadow:0 20px 50px rgba(0,0,0,.6)}
.cpm h3{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:16px}
.mi3{width:100%;padding:12px 14px;background:var(--s2);border:1.5px solid var(--br);border-radius:12px;font-size:15px;margin-bottom:16px;color:var(--tx)}
.mi3:focus{border-color:var(--ac)}
.ma2{display:flex;gap:10px;justify-content:flex-end}
.mcan{padding:9px 18px;background:var(--s2);border-radius:10px;font-size:14px;color:var(--t2);border:1px solid var(--br)}
.mcan:hover{color:var(--tx)}
.mcon{padding:9px 18px;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 2px 10px rgba(192,132,252,.28)}
.mcon:hover{opacity:.9}

/* ── SETUP SCREEN ─────────────────────────── */
.setup-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden}
.setup-card{width:min(480px,94vw);padding:clamp(24px,5vw,40px);background:rgba(14,14,40,.94);border:1.5px solid var(--br2);border-radius:24px;backdrop-filter:blur(24px);z-index:1;animation:popIn .5s ease both}
.setup-card h2{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:8px}
.setup-card p{color:var(--t2);font-size:13px;margin-bottom:22px;line-height:1.6}
.setup-inp{width:100%;padding:13px 15px;margin-bottom:12px;background:var(--s2);border:1.5px solid var(--br);border-radius:12px;font-size:15px;color:var(--tx);transition:all .2s}
.setup-inp:focus{border-color:var(--ac);background:var(--s1)}
.setup-btn{width:100%;padding:14px;border-radius:13px;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;font-weight:700;font-size:15px;transition:opacity .18s;margin-top:4px;box-shadow:0 4px 20px rgba(192,132,252,.3)}
.setup-btn:hover{opacity:.9}

/* ═══════════════════════════════════════════
   MOBILE BOTTOM NAV
═══════════════════════════════════════════ */
.mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:62px;background:rgba(7,7,26,.98);border-top:1.5px solid var(--br2);z-index:100;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
.mnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--t3);padding:6px 2px;transition:color .2s;-webkit-tap-highlight-color:transparent;position:relative}
.mnav-item.on{color:var(--ac)}
.mnav-item.on .mnav-ic{filter:drop-shadow(0 0 6px var(--ac))}
.mnav-ic{font-size:22px;line-height:1;transition:transform .2s}
.mnav-item.on .mnav-ic{transform:scale(1.1)}
.mnav-lb{font-size:10px;font-weight:600;letter-spacing:.02em}
.mnav-dot{position:absolute;top:6px;right:calc(50% - 16px);width:7px;height:7px;background:var(--dng);border-radius:50%;border:1.5px solid var(--bg)}

/* MOBILE MINI PLAYER */
.mobile-player{display:none;position:fixed;bottom:62px;left:0;right:0;height:66px;background:rgba(10,10,30,.98);border-top:1.5px solid var(--br2);z-index:99;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);align-items:center;gap:13px;padding:0 16px;cursor:pointer}
.mp-art{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;font-family:'Syne',sans-serif;flex-shrink:0;position:relative;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.4)}
.mp-text{flex:1;min-width:0}
.mp-title{display:block;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mp-artist{display:block;font-size:12px;color:var(--t2)}
.mp-controls{display:flex;align-items:center;gap:4px;flex-shrink:0}
.mp-play{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--ac),var(--ac-dk));color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 12px rgba(192,132,252,.35)}
.mp-skip{font-size:20px;color:var(--t2);padding:6px;min-width:34px;display:flex;align-items:center;justify-content:center}
.mp-bar{position:absolute;bottom:0;left:0;right:0;height:3px;background:var(--s3)}
.mp-bar-fill{height:100%;border-radius:2px;transition:width .1s linear}

/* ═══════════════════════════════════════════
   RESPONSIVE BREAKPOINTS
═══════════════════════════════════════════ */
@media (max-width: 768px) {
  /* Show mobile UI */
  .mobile-nav   { display: flex; }
  .mobile-player{ display: flex; }

  /* Hide desktop UI */
  .sb { display: none; }
  .cp { display: none; }
  .pb { display: none; }

  /* Layout adjustment */
  .app { padding-bottom: 0; }
  .content { padding-bottom: 0; }
  .vc { padding: 16px 14px 148px; }

  /* Topbar */
  .topbar { padding: 10px 14px; }

  /* Grids */
  .fg  { grid-template-columns: 1fr 1fr; gap: 10px; }
  .dg  { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .pg  { grid-template-columns: repeat(2, 1fr); gap: 10px; }

  /* Heading */
  .hgreet h1 { font-size: 22px; }
  .vtitle    { font-size: 20px; }
  .plhn      { font-size: 22px; }

  /* Playlist header stacks on mobile */
  .plhdr { flex-direction: column; align-items: flex-start; gap: 14px; }
  .plart-lg { width: 90px; height: 90px; font-size: 50px; }

  /* Profile stacks */
  .prfhdr { flex-direction: column; text-align: center; padding: 18px; }
  .stats  { justify-content: center; gap: 16px; }
  .prfname{ justify-content: center; }

  /* Submit form single column */
  .sf-row { grid-template-columns: 1fr; }

  /* Song rows bigger tap targets */
  .sr   { padding: 11px 10px; }
  .scov { width: 42px; height: 42px; }
  .ib   { padding: 7px 8px; font-size: 17px; }
  .sdur { display: none; }

  /* Modal full-screen on mobile */
  .mo  { align-items: flex-end; padding: 0; }
  .npm { width: 100%; max-height: 92vh; border-radius: 24px 24px 0 0; padding: 24px 20px; }

  /* Playlist menu */
  .plm { right: 8px; min-width: 160px; }

  /* Featured card — hide 3rd on small screens */
  .fg .fc:nth-child(3) { display: none; }
  .fg { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 480px) {
  .vc  { padding: 14px 12px 148px; }
  .fg  { grid-template-columns: 1fr; }
  .fg .fc:nth-child(3) { display: flex; }
  .dg  { grid-template-columns: repeat(2, 1fr); }
  .pg  { grid-template-columns: repeat(2, 1fr); }
  .hgreet h1 { font-size: 20px; }
  .feat-cards { gap: 8px; }
  .auth-card { padding: 22px 18px; }
  .cpm { border-radius: 20px 20px 0 0; padding: 22px 18px; }
}
`;

export default function App() {
  const [cfg, setCfg]       = useState({ url: SUPABASE_URL, key: SUPABASE_KEY });
  const [cfgForm, setCfgForm] = useState({ url: "", key: "" });
  const [ready, setReady]   = useState(!!(SUPABASE_URL && SUPABASE_KEY));
  const API = useRef(null);

  const [user, setUser]     = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [af, setAf]         = useState({ username: "", email: "", password: "", avatar: "🎵" });
  const [aerr, setAerr]     = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [songs, setSongs]   = useState([]);
  const [loading, setLoading] = useState(false);

  const [mySubs, setMySubs] = useState([]);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [subFile, setSubFile]   = useState(null);
  const [subForm, setSubForm]   = useState({ title: "", artist: "", album: "", genre: "Unknown", year: new Date().getFullYear(), hue: HUES[0] });
  const [subBusy, setSubBusy]   = useState(false);
  const [subMsg, setSubMsg]     = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [adminNotes, setAdminNotes] = useState({});
  const [previewId, setPreviewId]   = useState(null);

  const audioRef = useRef(new Audio());
  const [song, setSong]       = useState(null);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg]       = useState(0);
  const [dur, setDur]         = useState(0);
  const [vol, setVol]         = useState(0.8);
  const [shuffled, setShuffled] = useState(false);
  const [looped, setLooped]     = useState(false);

  const [playlists, setPlaylists]   = useState([{ id: "p1", name: "Favourites", songs: [], cover: "❤️" }]);
  const [selPl, setSelPl]           = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);

  const [soundmarks, setSoundmarks] = useState([]);
  const [showNote, setShowNote]     = useState(false);
  const [noteText, setNoteText]     = useState("");

  const [view, setView]             = useState("home");
  const [discoverGenre, setDiscoverGenre] = useState(null);
  const [query, setQuery]           = useState("");
  const [showNP, setShowNP]         = useState(false);
  const [chatOpen, setChatOpen]     = useState(true);
  const [openChat, setOpenChat]     = useState(null);
  const [chatIn, setChatIn]         = useState("");
  const [msgs, setMsgs]             = useState({});
  const [plMenu, setPlMenu]         = useState(null);
  const [showCPL, setShowCPL]       = useState(false);
  const [cplName, setCplName]       = useState("");
  const chatEndRef  = useRef(null);
  const fileRef     = useRef(null);
  const subFileRef  = useRef(null);

  /* ── init ── */
  useEffect(() => {
    (async () => {
      const sc = await store.get("nw_cfg");
      if (sc) { const c = JSON.parse(sc); setCfg(c); API.current = sb(c.url, c.key); setReady(true); }
      else if (SUPABASE_URL && SUPABASE_KEY) { API.current = sb(SUPABASE_URL, SUPABASE_KEY); setReady(true); }
      const su = await store.get("nw_user");   if (su) setUser(JSON.parse(su));
      const sl = await store.get("nw_liked");  if (sl) setLikedSongs(JSON.parse(sl));
      const sp = await store.get("nw_pls");    if (sp) setPlaylists(JSON.parse(sp));
    })();
    const ae = audioRef.current;
    ae.ontimeupdate    = () => setProg(ae.currentTime || 0);
    ae.ondurationchange= () => setDur(ae.duration || 0);
    ae.onended         = () => { if (!looped) nextSong(); };
    return () => ae.pause();
  }, []);

  useEffect(() => { if (ready && user) { loadSongs(); loadMySubs(); if (user.is_admin) loadPending(); } }, [ready, user]);
  useEffect(() => { if (user) store.set("nw_user", JSON.stringify(user)); }, [user]);
  useEffect(() => { store.set("nw_liked", JSON.stringify(likedSongs)); }, [likedSongs]);
  useEffect(() => { store.set("nw_pls",   JSON.stringify(playlists));  }, [playlists]);
  useEffect(() => { audioRef.current.volume = vol; }, [vol]);
  useEffect(() => { audioRef.current.loop   = looped; }, [looped]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, openChat]);
  useEffect(() => {
    const h = e => { if (plMenu && !e.target.closest(".plm") && !e.target.closest(".ib")) setPlMenu(null); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [plMenu]);

  /* ── data ── */
  const loadSongs = async () => {
    if (!API.current) return; setLoading(true);
    try { const d = await API.current.from("songs").select("*", "&is_approved=eq.true&order=created_at.desc"); setSongs(d || []); } catch {}
    setLoading(false);
  };
  const loadMySubs = async () => {
    if (!API.current || !user) return;
    try {
      const pending  = await API.current.from("songs").select("*", `&submitted_by=eq.${encodeURIComponent(user.username)}&is_approved=eq.false`);
      const approved = await API.current.from("songs").select("*", `&submitted_by=eq.${encodeURIComponent(user.username)}&is_approved=eq.true`);
      setMySubs([...(pending||[]).map(s=>({...s,status:"pending"})), ...(approved||[]).map(s=>({...s,status:"approved"}))]);
    } catch {}
  };
  const loadPending = async () => {
    if (!API.current) return;
    try { const d = await API.current.from("songs").select("*","&is_approved=eq.false&order=created_at.asc"); setPendingSubs(d||[]); } catch {}
  };

  const saveConfig = async () => {
    if (!cfgForm.url || !cfgForm.key) return;
    const c = { url: cfgForm.url.replace(/\/$/, ""), key: cfgForm.key };
    await store.set("nw_cfg", JSON.stringify(c));
    setCfg(c); API.current = sb(c.url, c.key); setReady(true);
  };

  /* ── auth ── */
  const doAuth = async () => {
    setAuthBusy(true); setAerr("");
    try {
      const hash = await hashPw(af.password);
      if (authMode === "login") {
        const res = await API.current.from("profiles").select("*", `&username=eq.${encodeURIComponent(af.username)}&password_hash=eq.${hash}`);
        if (!res?.length) throw new Error("Wrong username or password.");
        setUser(res[0]);
      } else {
        if (!af.username.trim() || af.username.length < 3) throw new Error("Username needs at least 3 characters.");
        const ex = await API.current.from("profiles").select("id", `&username=eq.${encodeURIComponent(af.username)}`);
        if (ex?.length) throw new Error("Username already taken — try another.");
        const [nu] = await API.current.from("profiles").insert({ id: uid(), username: af.username.trim(), password_hash: hash, email: af.email, avatar: af.avatar, bio: "New to the groove", is_admin: false });
        setUser(nu);
      }
    } catch (e) { setAerr(e.message); }
    setAuthBusy(false);
  };

  /* ── player ── */
  const playSong = async (s) => {
    audioRef.current.pause();
    if (s.audio_url) { audioRef.current.src = s.audio_url; try { await audioRef.current.play(); setPlaying(true); } catch { setPlaying(false); } }
    setSong(s); setProg(0);
    if (API.current && s.id && !s.id.startsWith("d")) {
      API.current.from("songs").update({ plays: (s.plays||0)+1 }, `id=eq.${s.id}`).catch(()=>{});
      setSongs(p => p.map(x => x.id === s.id ? { ...x, plays: (x.plays||0)+1 } : x));
    }
  };
  const togglePlay = () => { if (playing) { audioRef.current.pause(); setPlaying(false); } else { audioRef.current.play().then(()=>setPlaying(true)).catch(()=>{}); } };
  const seek = pct => { if (dur) { const t=dur*pct/100; audioRef.current.currentTime=t; setProg(t); } };
  const nextSong = () => { const i=songs.findIndex(s=>s.id===song?.id); playSong(shuffled?songs[Math.floor(Math.random()*songs.length)]:songs[(i+1)%songs.length]); };
  const prevSong = () => { if (prog>3){audioRef.current.currentTime=0;setProg(0);return;} const i=songs.findIndex(s=>s.id===song?.id); playSong(songs[(i-1+songs.length)%songs.length]); };
  const toggleLike = id => setLikedSongs(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  /* ── submission ── */
  const handleSubFile = async (file) => {
    if (!file?.type.startsWith("audio/")) return;
    setSubFile(file);
    const base = file.name.replace(/\.[^.]+$/,"").replace(/_/g," ");
    const dash = base.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dash) setSubForm(p=>({...p,artist:dash[1].trim(),title:dash[2].trim()}));
    else setSubForm(p=>({...p,title:base.trim()}));
    const a=new Audio(URL.createObjectURL(file));
    a.onloadedmetadata=()=>setSubForm(p=>({...p,duration:Math.floor(a.duration)}));
  };
  const submitSong = async () => {
    if (!subFile||!subForm.title||!subForm.artist) return setSubMsg("Please add a file, title and artist.");
    setSubBusy(true); setSubMsg("");
    try {
      const fn = `${uid()}_${subFile.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
      const audioUrl = await API.current.storage.upload("submissions", fn, subFile);
      await API.current.from("songs").insert({ title:subForm.title, artist:subForm.artist, album:subForm.album||"", genre:subForm.genre, year:Number(subForm.year), audio_url:audioUrl, hue:subForm.hue, duration:subForm.duration||0, is_approved:false, submitted_by:user.username, plays:0, likes:0 });
      setSubFile(null); setSubForm({title:"",artist:"",album:"",genre:"Unknown",year:new Date().getFullYear(),hue:HUES[0]});
      await loadMySubs(); setSubMsg("✓ Submitted! Waiting for admin approval.");
    } catch (e) { setSubMsg("Upload failed: "+e.message); }
    setSubBusy(false);
  };

  /* ── admin ── */
  const approveSub = async (s) => { await API.current.from("songs").update({is_approved:true,admin_note:adminNotes[s.id]||""},`id=eq.${s.id}`); setPendingSubs(p=>p.filter(x=>x.id!==s.id)); await loadSongs(); };
  const rejectSub  = async (s) => { await API.current.from("songs").update({admin_note:adminNotes[s.id]||"Not approved."},`id=eq.${s.id}`); setPendingSubs(p=>p.filter(x=>x.id!==s.id)); };
  const deleteSub  = async (s) => { await API.current.from("songs").delete(`id=eq.${s.id}`); setPendingSubs(p=>p.filter(x=>x.id!==s.id)); };

  /* ── soundmarks ── */
  const addSoundmark = async () => {
    if (!noteText.trim()||!song) return;
    const sm={id:uid(),song_id:song.id,username:user.username,avatar:user.avatar,ts_sec:Math.floor(prog),note:noteText};
    setSoundmarks(p=>[...p,sm]);
    if (API.current) API.current.from("soundmarks").insert(sm).catch(()=>{});
    setNoteText(""); setShowNote(false);
  };

  /* ── chat ── */
  const sendMsg = toId => {
    if (!chatIn.trim()) return;
    const m={id:uid(),from:user.username,text:chatIn.trim(),time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})};
    setMsgs(p=>({...p,[toId]:[...(p[toId]||[]),m]})); setChatIn("");
    const r=["that hits different 🎵","omg yes 🔥","we need a playlist for this","sending you a soundmark rn 📍","main character energy ✨"];
    setTimeout(()=>setMsgs(p=>({...p,[toId]:[...(p[toId]||[]),{id:uid(),from:toId,text:r[Math.floor(Math.random()*r.length)],time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}]})),1300+Math.random()*2400);
  };

  /* ── helpers ── */
  const userPls    = playlists;
  const songMarks  = soundmarks.filter(sm=>sm.song_id===song?.id);
  const progPct    = dur>0?(prog/dur)*100:0;
  const searchRes  = query.trim()?songs.filter(s=>s.title?.toLowerCase().includes(query.toLowerCase())||s.artist?.toLowerCase().includes(query.toLowerCase())||s.genre?.toLowerCase().includes(query.toLowerCase())):[];
  const addToPl    = (plId,sId) => setPlaylists(p=>p.map(pl=>pl.id===plId&&!pl.songs.includes(sId)?{...pl,songs:[...pl.songs,sId]}:pl));
  const createPl   = () => { if (!cplName.trim()) return; const e=["🎵","🎶","🎸","🎹","🔥","🌊","✨","🌙"]; setPlaylists(p=>[...p,{id:uid(),name:cplName,songs:[],cover:e[Math.floor(Math.random()*e.length)]}]); setCplName(""); setShowCPL(false); };

  /* ══════════════════════════════════════════
     SONG ROW
  ══════════════════════════════════════════ */
  const SongRow = ({ s, idx }) => {
    const isAct = song?.id === s.id;
    const isLk  = likedSongs.includes(s.id);
    const mc    = songMarks.filter(sm=>sm.song_id===s.id).length;
    return (
      <div className={`sr${isAct?" act":""}`} onClick={()=>playSong(s)}>
        <div className="srl">
          <div className="snw">{isAct&&playing?<div className="wm"><span/><span/><span/><span/></div>:<span className="snum">{idx+1}</span>}</div>
          <div className="scov" style={{background:`linear-gradient(135deg,${s.hue}77,${s.hue}33)`}}>{(s.title||"?")[0]}</div>
          <div className="si2">
            <span className="stit">{s.title}</span>
            <span className="sart">{s.artist}{s.submitted_by?<span className="subby"> · {s.submitted_by}</span>:null}</span>
          </div>
        </div>
        <div className="srr">
          {mc>0&&<span className="mbadge">📍{mc}</span>}
          <button className={`ib${isLk?" lk":""}`} onClick={e=>{e.stopPropagation();toggleLike(s.id);}}>{isLk?"♥":"♡"}</button>
          <button className="ib" onClick={e=>{e.stopPropagation();setPlMenu(m=>m===s.id?null:s.id);}}>⊕</button>
          <span className="sdur">{s.duration?fT(s.duration):"--:--"}</span>
        </div>
        {plMenu===s.id&&(
          <div className="plm" onClick={e=>e.stopPropagation()}>
            <p className="plmt">Add to playlist</p>
            {userPls.map(pl=><button key={pl.id} className="plmi" onClick={()=>{addToPl(pl.id,s.id);setPlMenu(null);}}>{pl.cover} {pl.name}</button>)}
            <button className="plmi" onClick={()=>{setShowCPL(true);setPlMenu(null);}}>+ New playlist</button>
            <button className="plmc" onClick={()=>setPlMenu(null)}>✕ close</button>
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════
     VIEWS
  ══════════════════════════════════════════ */
  const renderHome = () => {
    const featured = songs.slice(0,3);
    const trending = [...songs].sort((a,b)=>(b.plays||0)-(a.plays||0)).slice(0,8);
    const genres   = [...new Set(songs.map(s=>s.genre).filter(Boolean))].slice(0,9);
    const h = new Date().getHours();
    return (
      <div className="vc">
        <div className="hgreet">
          <h1>Good <span className="gtx">{h<12?"morning":h<17?"afternoon":"evening"}</span>, {user.username} {user.is_admin?"⭐":"✦"}</h1>
          <p className="hsub">{loading?"Loading music…":`${songs.length} songs on the platform`}</p>
        </div>
        {featured.length>0&&(<>
          <div className="sh"><h2 className="stitle">Featured</h2></div>
          <div className="fg">
            {featured.map(s=>(
              <div key={s.id} className="fc" style={{background:`linear-gradient(135deg,${s.hue}44,${s.hue}18,transparent)`}} onClick={()=>playSong(s)}>
                <div className="fart">{(s.title||"?")[0]}</div>
                <span className="fgen">{s.genre}</span>
                <p className="ftit">{s.title}</p>
                <p className="fart2">{s.artist}</p>
                <div className="fsts"><span>▶ {fN(s.plays||0)}</span></div>
                <div className="fplay">▶</div>
              </div>
            ))}
          </div>
        </>)}
        {songs.length===0&&!loading&&<div className="empty" style={{padding:"40px 0"}}><p style={{fontSize:40,marginBottom:12}}>🎵</p><p>No songs yet — check back soon!</p></div>}
        {trending.length>0&&(<>
          <div className="sh"><h2 className="stitle">Trending</h2><button className="slink" onClick={()=>setView("discover")}>See all →</button></div>
          <div className="sl">{trending.map((s,i)=><SongRow key={s.id} s={s} idx={i}/>)}</div>
        </>)}
        {genres.length>0&&(<>
          <div className="sh"><h2 className="stitle">Genres</h2></div>
          <div className="gps">{genres.map(g=><button key={g} className="gp" onClick={()=>{setDiscoverGenre(g);setView("discover");}}>{g}</button>)}</div>
        </>)}
      </div>
    );
  };

  const renderDiscover = () => {
    const genres  = [...new Set(songs.map(s=>s.genre).filter(Boolean))];
    const filtered= discoverGenre?songs.filter(s=>s.genre===discoverGenre):songs;
    return (
      <div className="vc">
        <h2 className="vtitle">Discover</h2>
        <p className="vsub">{songs.length} tracks on the platform</p>
        <div className="gps" style={{marginBottom:18}}>
          <button className={`gp${!discoverGenre?" on":""}`} onClick={()=>setDiscoverGenre(null)}>All</button>
          {genres.map(g=><button key={g} className={`gp${discoverGenre===g?" on":""}`} onClick={()=>setDiscoverGenre(g)}>{g}</button>)}
        </div>
        <div className="dg">
          {filtered.map(s=>(
            <div key={s.id} className="dc" onClick={()=>playSong(s)}>
              <div className="dart" style={{background:`linear-gradient(135deg,${s.hue},${s.hue}99)`}}>
                <span className="dlet">{(s.title||"?")[0]}</span>
                <div className="dplay">▶</div>
              </div>
              <div className="dinfo">
                <p className="dtit">{s.title}</p>
                <p className="dart2">{s.artist}</p>
                <div className="dmeta"><span className="dgt">{s.genre||"Music"}</span><span>{s.duration?fT(s.duration):"--:--"}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLibrary = () => {
    const liked=songs.filter(s=>likedSongs.includes(s.id));
    return (
      <div className="vc">
        <h2 className="vtitle">Your Library</h2>
        <div className="lsec">
          <div className="sh"><h3 className="stitle">Playlists</h3><button className="slink" onClick={()=>setShowCPL(true)}>+ Create</button></div>
          <div className="pg">
            {userPls.map(pl=>(
              <div key={pl.id} className="pc" onClick={()=>{setSelPl(pl);setView("playlist");}}>
                <div className="part">{pl.cover}</div><p className="pname">{pl.name}</p><p className="pcnt">{pl.songs.length} tracks</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lsec">
          <div className="sh"><h3 className="stitle">Liked Songs</h3><span className="scnt">{liked.length} tracks</span></div>
          <div className="sl">{liked.length===0&&<p className="empty">Heart a track to save it here.</p>}{liked.map((s,i)=><SongRow key={s.id} s={s} idx={i}/>)}</div>
        </div>
      </div>
    );
  };

  const renderPlaylist = () => {
    if (!selPl) return renderLibrary();
    const ps=songs.filter(s=>selPl.songs.includes(s.id));
    return (
      <div className="vc">
        <button className="bk" onClick={()=>setView("library")}>← Library</button>
        <div className="plhdr">
          <div className="plart-lg">{selPl.cover}</div>
          <div className="plhi">
            <span className="pltype">Playlist</span>
            <h2 className="plhn">{selPl.name}</h2>
            <p className="plhm">{ps.length} tracks</p>
            <button className="pall" onClick={()=>ps.length>0&&playSong(ps[0])}>▶ Play All</button>
          </div>
        </div>
        <div className="sl">{ps.length===0&&<p className="empty">No songs yet — add from Discover!</p>}{ps.map((s,i)=><SongRow key={s.id} s={s} idx={i}/>)}</div>
      </div>
    );
  };

  const renderSubmit = () => (
    <div className="vc">
      <h2 className="vtitle">Submit Your Music</h2>
      <p className="vsub">Upload a track for admin review — if approved it appears on the platform with your name.</p>
      <div className="submit-form">
        <h3>Upload a Track</h3>
        <div className={`drop-zone${isDragging?" drag":""}`}
          onDrop={e=>{e.preventDefault();setIsDragging(false);handleSubFile(e.dataTransfer.files[0]);}}
          onDragOver={e=>{e.preventDefault();setIsDragging(true);}}
          onDragLeave={()=>setIsDragging(false)}
          onClick={()=>subFileRef.current?.click()}>
          <input ref={subFileRef} type="file" accept="audio/*" style={{display:"none"}} onChange={e=>handleSubFile(e.target.files[0])}/>
          <span className="dz-icon">{subFile?"🎵":"☁️"}</span>
          <p style={{fontWeight:700,marginBottom:4,fontSize:15}}>{subFile?subFile.name:"Drag & drop or tap to pick a file"}</p>
          <p className="dz-sub">{subFile?"Tap to change file":"MP3, WAV, FLAC supported"}</p>
        </div>
        <div className="sf-row">
          <div className="sf-field"><label className="sf-label">Song Title *</label><input className="sf-inp" value={subForm.title} onChange={e=>setSubForm(p=>({...p,title:e.target.value}))} placeholder="Title"/></div>
          <div className="sf-field"><label className="sf-label">Artist *</label><input className="sf-inp" value={subForm.artist} onChange={e=>setSubForm(p=>({...p,artist:e.target.value}))} placeholder="Artist name"/></div>
          <div className="sf-field"><label className="sf-label">Album</label><input className="sf-inp" value={subForm.album} onChange={e=>setSubForm(p=>({...p,album:e.target.value}))} placeholder="Optional"/></div>
          <div className="sf-field"><label className="sf-label">Genre</label><select className="sf-sel" value={subForm.genre} onChange={e=>setSubForm(p=>({...p,genre:e.target.value}))}>{GENRES.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
          <div className="sf-field"><label className="sf-label">Year</label><input className="sf-inp" type="number" value={subForm.year} onChange={e=>setSubForm(p=>({...p,year:e.target.value}))}/></div>
          <div className="sf-field"><label className="sf-label">Card Color</label><div className="hue-row">{HUES.map(h=><div key={h} className={`hue-dot${subForm.hue===h?" sel":""}`} style={{background:h}} onClick={()=>setSubForm(p=>({...p,hue:h}))}/>)}</div></div>
        </div>
        {subMsg&&<p style={{fontSize:13,marginTop:12,color:subMsg.startsWith("✓")?"var(--ok)":"var(--dng)",fontWeight:600}}>{subMsg}</p>}
        <button className="submit-btn" onClick={submitSong} disabled={subBusy||!subFile}>
          {subBusy?<><div style={{width:16,height:16,border:"2.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>Uploading…</>:"Submit for Review →"}
        </button>
      </div>
      <div className="sh"><h3 className="stitle">My Submissions</h3><button className="slink" onClick={loadMySubs}>Refresh</button></div>
      <div className="submissions-list">
        {mySubs.length===0&&<p className="empty">No submissions yet.</p>}
        {mySubs.map(s=>(
          <div key={s.id} className="sub-item">
            <div className="sub-art" style={{background:`linear-gradient(135deg,${s.hue}77,${s.hue}33)`}}>{(s.title||"?")[0]}</div>
            <div className="sub-info"><p className="sub-title">{s.title}</p><p className="sub-artist">{s.artist}</p>{s.admin_note&&<p className="sub-note">Admin: {s.admin_note}</p>}</div>
            <span className={`sub-status ${s.is_approved?"approved":s.status||"pending"}`}>{s.is_approved?"✓ Live":"⏳ Pending"}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="vc">
      <h2 className="vtitle">⭐ Admin — Submissions</h2>
      <p className="vsub">Preview, approve or reject user-submitted tracks.</p>
      <div className="admin-section">
        <p className="admin-section-title">⏳ Pending ({pendingSubs.length})</p>
        {pendingSubs.length===0&&<p className="empty">No pending submissions — all caught up!</p>}
        {pendingSubs.map(s=>(
          <div key={s.id} className="pending-card">
            <div className="pc-top">
              <div className="pc-art" style={{background:`linear-gradient(135deg,${s.hue},${s.hue}77)`}}>{(s.title||"?")[0]}</div>
              <div className="pc-info"><p className="pc-title">{s.title}</p><p className="pc-meta">{s.artist} · {s.genre} · {s.year}</p><p className="pc-by">by <strong>{s.submitted_by}</strong></p></div>
              <div className="pc-actions"><button className={`pc-play${previewId===s.id?" on":""}`} onClick={()=>{if(previewId===s.id){audioRef.current.pause();setPreviewId(null);}else{audioRef.current.pause();audioRef.current.src=s.audio_url;audioRef.current.play().catch(()=>{});setPreviewId(s.id);}}}>{previewId===s.id?"⏸":"▶"}</button></div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <input className="note-inp" placeholder="Note to user (optional)…" value={adminNotes[s.id]||""} onChange={e=>setAdminNotes(p=>({...p,[s.id]:e.target.value}))}/>
              <button className="approve-btn" onClick={()=>approveSub(s)}>✓ Approve</button>
              <button className="reject-btn"  onClick={()=>rejectSub(s)}>✕ Reject</button>
              <button style={{fontSize:15,color:"var(--t3)",padding:"6px 8px"}} onClick={()=>deleteSub(s)}>🗑</button>
            </div>
          </div>
        ))}
        <button className="slink" style={{marginTop:8,display:"block"}} onClick={loadPending}>↻ Refresh</button>
      </div>
      <div className="sh"><h3 className="stitle">All Approved Songs ({songs.length})</h3></div>
      <div className="sl">{songs.map((s,i)=><SongRow key={s.id} s={s} idx={i}/>)}</div>
    </div>
  );

  const renderProfile = () => {
    const myMarks=soundmarks.filter(sm=>sm.username===user.username);
    return (
      <div className="vc">
        <div className="prfhdr">
          <div className="prfemo">{user.avatar}</div>
          <div>
            <p className="prfname">{user.username}{user.is_admin&&<span className="admin-badge">⭐ ADMIN</span>}</p>
            <p className="prfbio">{user.bio}</p>
            <div className="stats">
              <div className="st"><span className="stv">{likedSongs.length}</span><span className="stl">Liked</span></div>
              <div className="st"><span className="stv">{myMarks.length}</span><span className="stl">Notes</span></div>
              <div className="st"><span className="stv">{mySubs.length}</span><span className="stl">Submitted</span></div>
            </div>
          </div>
        </div>
        <div className="sh"><h3 className="stitle">My Soundmarks 📍</h3></div>
        <div className="sml">
          {myMarks.length===0&&<p className="empty">No soundmarks yet — click 📍 while listening!</p>}
          {myMarks.map(sm=>{const s=songs.find(x=>x.id===sm.song_id);return(
            <div key={sm.id} className="smi" onClick={()=>s&&playSong(s)}>
              <div className="smd" style={{background:s?.hue||"var(--ac)"}}/>
              <div><p className="smt">{sm.note}</p><p className="smm">{s?.title} · at {fT(sm.ts_sec)}</p></div>
            </div>
          );})}
        </div>
        <button className="lout" onClick={()=>{audioRef.current.pause();setUser(null);store.del("nw_user");}}>Sign Out</button>
      </div>
    );
  };

  const renderNPModal = () => {
    if (!song) return null;
    return (
      <div className="mo" onClick={()=>setShowNP(false)}>
        <div className="npm" onClick={e=>e.stopPropagation()}>
          <button className="mc" onClick={()=>setShowNP(false)}>✕</button>
          <div className="np-art" style={{background:`linear-gradient(135deg,${song.hue},${song.hue}77)`}}>
            <span className="np-let">{(song.title||"?")[0]}</span>
            {playing&&<div className="np-wv"><span/><span/><span/><span/><span/></div>}
          </div>
          <p className="np-tit">{song.title}</p>
          <p className="np-art2">{song.artist}{song.album?` · ${song.album}`:""}</p>
          <p className="np-meta">{song.genre}{song.year?` · ${song.year}`:""}{song.submitted_by?` · by ${song.submitted_by}`:""}</p>
          <p className="np-sts">▶ {fN(song.plays||0)} plays · ♥ {fN(song.likes||0)}</p>
          <div style={{marginBottom:18}}>
            <div className="np-ts"><span>{fT(Math.floor(prog))}</span><span>{fT(Math.floor(dur||song.duration||0))}</span></div>
            <div className="np-pb" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();seek((e.clientX-r.left)/r.width*100);}}>
              <div className="np-pf" style={{width:`${progPct}%`,background:song.hue}}/>
              {dur>0&&songMarks.map(sm=><div key={sm.id} className="smdot" style={{left:`${(sm.ts_sec/dur)*100}%`,background:song.hue}} onClick={e=>{e.stopPropagation();audioRef.current.currentTime=sm.ts_sec;setProg(sm.ts_sec);}}/>)}
            </div>
          </div>
          <div className="smhdr">
            <h3>Soundmarks 📍</h3>
            <button className="amb" onClick={()=>setShowNote(!showNote)}>+ Note at {fT(Math.floor(prog))}</button>
          </div>
          {showNote&&(<div className="nir"><input className="ni2" placeholder="What's on your mind at this moment?" value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSoundmark()} autoFocus/><button className="ns" onClick={addSoundmark}>Post</button></div>)}
          <div className="mlist">
            {songMarks.length===0&&<p className="memp">No soundmarks yet — be the first!</p>}
            {[...songMarks].sort((a,b)=>a.ts_sec-b.ts_sec).map(sm=>(
              <div key={sm.id} className="mi" onClick={()=>{audioRef.current.currentTime=sm.ts_sec;setProg(sm.ts_sec);}}>
                <div className="midk" style={{background:song.hue}}/>
                <div style={{flex:1}}>
                  <div className="mitop"><span className="miu">{sm.avatar} {sm.username}</span><span className="mitm">at {fT(sm.ts_sec)}</span></div>
                  <p className="mitx">{sm.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ── SETUP ── */
  if (!ready) return (
    <>
      <style>{CSS}</style>
      <div className="setup-screen">
        <div className="orbs"><div className="orb o1"/><div className="orb o2"/><div className="orb o3"/></div>
        <div className="setup-card">
          <div className="auth-logo" style={{marginBottom:14}}><span className="logo-icon">◎</span><span className="logo-text">NOVAWAVE</span></div>
          <h2>Connect Your Music Server</h2>
          <p>Enter your Supabase credentials once to get started. In your real deployment, set these as environment variables in <strong>.env</strong> so users never see this screen.</p>
          <input className="setup-inp" placeholder="https://yourproject.supabase.co" value={cfgForm.url} onChange={e=>setCfgForm(p=>({...p,url:e.target.value}))}/>
          <input className="setup-inp" placeholder="Supabase Anon / Public Key" value={cfgForm.key} onChange={e=>setCfgForm(p=>({...p,key:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveConfig()}/>
          <button className="setup-btn" onClick={saveConfig}>Connect & Launch →</button>
        </div>
      </div>
    </>
  );

  /* ── AUTH ── */
  if (!user) return (
    <>
      <style>{CSS}</style>
      <div className="auth-bg">
        <div className="orbs"><div className="orb o1"/><div className="orb o2"/><div className="orb o3"/></div>
        <div className="auth-card">
          <div className="auth-logo"><span className="logo-icon">◎</span><span className="logo-text">NOVAWAVE</span></div>
          <p className="auth-tag">music · notes · moments</p>
          <div className="atabs">
            <button className={`atab${authMode==="login"?" on":""}`} onClick={()=>setAuthMode("login")}>Sign In</button>
            <button className={`atab${authMode==="signup"?" on":""}`} onClick={()=>setAuthMode("signup")}>Sign Up</button>
          </div>
          <input className="ai" placeholder="Username" value={af.username} onChange={e=>setAf(p=>({...p,username:e.target.value}))}/>
          {authMode==="signup"&&<input className="ai" placeholder="Email (optional)" value={af.email} onChange={e=>setAf(p=>({...p,email:e.target.value}))}/>}
          <input className="ai" type="password" placeholder="Password" value={af.password} onChange={e=>setAf(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doAuth()}/>
          {authMode==="signup"&&(
            <div style={{marginBottom:12}}>
              <p style={{fontSize:11,color:"var(--t3)",marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em"}}>Pick an Avatar</p>
              <div className="avatar-pick">
                {["🎵","🎶","🌌","🎹","🌊","🔥","✨","🎸","🌙","🎺","🥁","🎻"].map(e=>(
                  <button key={e} className={`av-btn${af.avatar===e?" sel":""}`} onClick={()=>setAf(p=>({...p,avatar:e}))}>{e}</button>
                ))}
              </div>
            </div>
          )}
          {aerr&&<p className="aerr">{aerr}</p>}
          <button className="abtn" onClick={doAuth} disabled={authBusy}>
            {authBusy?<><div className="spin-sm"/>{authMode==="login"?"Signing in…":"Creating account…"}</>:authMode==="login"?"Enter the Wave ▶":"Join NovaWave ✦"}
          </button>
        </div>
      </div>
    </>
  );

  /* ── MAIN APP ── */
  const navItems = [
    {id:"home",    ic:"⌂",  lb:"Home"},
    {id:"discover",ic:"✦",  lb:"Discover"},
    {id:"library", ic:"▤",  lb:"Library"},
    {id:"submit",  ic:"↑",  lb:"Submit"},
    ...(user.is_admin?[{id:"admin",ic:"⭐",lb:"Admin",badge:pendingSubs.length}]:[]),
    {id:"profile", ic:"◉",  lb:"Profile"},
  ];

  const renderView = () => {
    if (query.trim()) return (
      <div className="vc"><h2 className="vtitle">Results for "{query}"</h2>
        {searchRes.length===0?<p className="empty">No matches found.</p>:<div className="sl">{searchRes.map((s,i)=><SongRow key={s.id} s={s} idx={i}/>)}</div>}
      </div>
    );
    switch(view){
      case"home":    return renderHome();
      case"discover":return renderDiscover();
      case"library": return renderLibrary();
      case"playlist":return renderPlaylist();
      case"submit":  return renderSubmit();
      case"admin":   return user.is_admin?renderAdmin():renderHome();
      case"profile": return renderProfile();
      default:       return renderHome();
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="app-body">

          {/* ── SIDEBAR (desktop) ── */}
          <aside className="sb">
            <div className="sb-logo" onClick={()=>{setView("home");setQuery("");}}>
              <span className="logo-icon">◎</span><span className="logo-text">NOVAWAVE</span>
            </div>
            <nav className="sb-nav">
              {navItems.map(it=>(
                <button key={it.id} className={`ni${view===it.id&&!query?" on":""}`} onClick={()=>{setView(it.id);setQuery("");}}>
                  <span className="nic">{it.ic}</span><span>{it.lb}</span>
                  {it.badge>0&&<span className="ni-badge">{it.badge}</span>}
                </button>
              ))}
            </nav>
            <div className="sb-pls">
              <div className="spt"><span>Playlists</span><button className="sb-add" onClick={()=>setShowCPL(true)}>+</button></div>
              {userPls.map(pl=><button key={pl.id} className="sp-i" onClick={()=>{setSelPl(pl);setView("playlist");setQuery("");}}><span>{pl.cover}</span><span className="sp-n">{pl.name}</span></button>)}
            </div>
            <div className="sb-user" onClick={()=>{setView("profile");setQuery("");}}>
              <span className="sb-emo">{user.avatar}</span>
              <div className="sb-ui">
                <span className="sb-un">{user.username}{user.is_admin&&<span className="admin-badge">⭐</span>}</span>
                <span className="sb-st">Online</span>
              </div>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <div className="main">
            <div className="topbar">
              <div className="sw">
                <span className="si-ic">⌕</span>
                <input className="si" placeholder="Search songs, artists, genres…" value={query} onChange={e=>setQuery(e.target.value)}/>
                {query&&<button className="sc" onClick={()=>setQuery("")}>✕</button>}
              </div>
            </div>
            <div className="content">{renderView()}</div>
          </div>

          {/* ── CHAT (desktop) ── */}
          <aside className="cp" style={{width:chatOpen?270:0}}>
            {chatOpen&&(
              <>
                <div className="cphdr">
                  <h3>Friends</h3>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {song&&playing&&<div className="lb"><div className="lbd"/><span className="lbt">Live</span></div>}
                    <button className="cpbtn" onClick={()=>setChatOpen(false)}>✕</button>
                  </div>
                </div>
                {!openChat?(
                  <div className="fl">
                    <p style={{padding:"10px 12px",color:"var(--t3)",fontSize:12}}>Invite friends to join NovaWave!</p>
                    {song&&<div style={{margin:"8px 6px 0"}}>
                      <p style={{fontSize:9,textTransform:"uppercase",letterSpacing:".1em",color:"var(--t3)",marginBottom:7,fontWeight:700}}>Now Playing</p>
                      <div style={{display:"flex",alignItems:"center",gap:9,padding:10,background:"var(--s2)",borderRadius:10,border:"1.5px solid var(--br)"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:song.hue,flexShrink:0,animation:"pulse 1.5s ease infinite"}}/>
                        <div><p style={{fontSize:12,fontWeight:700}}>{song.title}</p><p style={{fontSize:10,color:"var(--t3)"}}>{song.artist}</p></div>
                      </div>
                    </div>}
                  </div>
                ):(
                  <div className="cw">
                    <div className="cwhdr"><button className="bsm" onClick={()=>setOpenChat(null)}>←</button><span className="cfn">{openChat}</span></div>
                    <div className="ma">
                      {(msgs[openChat]||[]).map(m=><div key={m.id} className={`msg${m.from===user.username?" me":" them"}`}><div className="mbx">{m.text}</div><span className="mt">{m.time}</span></div>)}
                      <div ref={chatEndRef}/>
                    </div>
                    {song&&<div className="cnp"><div className="cnpd" style={{background:song.hue}}/><span>♪ {song.title}</span></div>}
                    <div className="cir">
                      <input className="ci" placeholder="Message…" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg(openChat)}/>
                      <button className="csb" onClick={()=>sendMsg(openChat)}>↑</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>

        {/* ── DESKTOP PLAYER ── */}
        <div className="pb">
          {song?(
            <>
              <div className="psi" onClick={()=>setShowNP(true)}>
                <div className="pa" style={{background:`linear-gradient(135deg,${song.hue},${song.hue}77)`}}>
                  {(song.title||"?")[0]}
                  {playing&&<div className="paw"><span/><span/><span/></div>}
                </div>
                <div className="pst"><span className="ptit">{song.title}</span><span className="part2">{song.artist}</span></div>
                <button className={`plk${likedSongs.includes(song.id)?" lk":""}`} onClick={e=>{e.stopPropagation();toggleLike(song.id);}}>{likedSongs.includes(song.id)?"♥":"♡"}</button>
              </div>
              <div className="pc2">
                <div className="pctrl">
                  <button className={`cb${shuffled?" on":""}`} onClick={()=>setShuffled(!shuffled)}>⇄</button>
                  <button className="cb cbm" onClick={prevSong}>⏮</button>
                  <button className="cbp" onClick={togglePlay}>{playing?"⏸":"▶"}</button>
                  <button className="cb cbm" onClick={nextSong}>⏭</button>
                  <button className={`cb${looped?" on":""}`} onClick={()=>setLooped(!looped)}>↻</button>
                </div>
                <div className="pr">
                  <span className="tl">{fT(Math.floor(prog))}</span>
                  <div className="pt" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();seek((e.clientX-r.left)/r.width*100);}}>
                    <div className="pf" style={{width:`${progPct}%`,background:song.hue}}/>
                    {dur>0&&songMarks.map(sm=><div key={sm.id} className="pm-dot" style={{left:`${(sm.ts_sec/dur)*100}%`}}/>)}
                  </div>
                  <span className="tl">{fT(Math.floor(dur||song.duration||0))}</span>
                </div>
              </div>
              <div className="prgt">
                <button className="cb" style={{fontSize:15}} onClick={()=>setShowNP(true)}>📍</button>
                <span className="vol-ic">🔊</span>
                <input type="range" className="vol-sl" min="0" max="1" step="0.01" value={vol} onChange={e=>setVol(parseFloat(e.target.value))}/>
                {!chatOpen&&<button className="cpbtn" onClick={()=>setChatOpen(true)}>💬</button>}
              </div>
            </>
          ):(
            <div className="pe">
              <span style={{fontSize:14}}>No track playing</span>
              {songs.length>0&&<button className="pe-btn" onClick={()=>playSong(songs[0])}>▶ Play something</button>}
              {!chatOpen&&<button className="cpbtn" style={{marginLeft:"auto"}} onClick={()=>setChatOpen(true)}>💬</button>}
            </div>
          )}
        </div>

        {/* ── MOBILE MINI PLAYER ── */}
        <div className="mobile-player" onClick={()=>song&&setShowNP(true)}>
          {song?(
            <>
              <div className="mp-art" style={{background:`linear-gradient(135deg,${song.hue},${song.hue}77)`}}>
                {(song.title||"?")[0]}
                {playing&&<div className="paw"><span/><span/><span/></div>}
              </div>
              <div className="mp-text">
                <span className="mp-title">{song.title}</span>
                <span className="mp-artist">{song.artist}</span>
              </div>
              <div className="mp-controls" onClick={e=>e.stopPropagation()}>
                <button className="mp-skip" onClick={prevSong}>⏮</button>
                <button className="mp-play" onClick={togglePlay}>{playing?"⏸":"▶"}</button>
                <button className="mp-skip" onClick={nextSong}>⏭</button>
              </div>
              <div className="mp-bar"><div className="mp-bar-fill" style={{width:`${progPct}%`,background:song.hue}}/></div>
            </>
          ):(
            <p style={{flex:1,textAlign:"center",color:"var(--t3)",fontSize:14,fontWeight:500}}>Tap a song to start playing</p>
          )}
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="mobile-nav">
          {navItems.map(it=>(
            <button key={it.id} className={`mnav-item${view===it.id&&!query?" on":""}`} onClick={()=>{setView(it.id);setQuery("");}}>
              <span className="mnav-ic">{it.ic}</span>
              <span className="mnav-lb">{it.lb}</span>
              {it.badge>0&&<span className="mnav-dot"/>}
            </button>
          ))}
        </nav>

        {/* ── MODALS ── */}
        {showNP&&renderNPModal()}
        {showCPL&&(
          <div className="mo" onClick={()=>setShowCPL(false)}>
            <div className="cpm" onClick={e=>e.stopPropagation()}>
              <h3>New Playlist</h3>
              <input className="mi3" placeholder="Give it a name…" value={cplName} onChange={e=>setCplName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createPl()} autoFocus/>
              <div className="ma2"><button className="mcan" onClick={()=>setShowCPL(false)}>Cancel</button><button className="mcon" onClick={createPl}>Create ✦</button></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
