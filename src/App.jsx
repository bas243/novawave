/**
 * NOVAWAVE — Main Website
 * ────────────────────────────────────────────────
 * For real deployment replace the two lines below
 * with your actual Supabase credentials (or use
 * .env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
 */
let SUPABASE_URL = "";
let SUPABASE_KEY = "";
try {
  SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
  SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
} catch {}

import { useState, useEffect, useRef } from "react";

/* ─── storage shim (works in artifact + real browser) ─── */
const store = {
  get: async (k) => {
    try { if (window.storage) return (await window.storage.get(k))?.value ?? null; } catch {}
    return localStorage.getItem(k);
  },
  set: async (k, v) => {
    try { if (window.storage) { await window.storage.set(k, v); return; } } catch {}
    localStorage.setItem(k, v);
  },
  del: async (k) => {
    try { if (window.storage) { await window.storage.delete(k); return; } } catch {}
    localStorage.removeItem(k);
  },
};

/* ─── password hashing ─── */
const hashPw = async (pw) => {
  const data = new TextEncoder().encode(pw + ":novawave_salt_2024");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

/* ─── Supabase API helpers ─── */
const sb = (url, key) => ({
  from: (table) => ({
    select: async (q = "*", filters = "") => {
      const r = await fetch(`${url}/rest/v1/${table}?select=${q}${filters}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    insert: async (body) => {
      const r = await fetch(`${url}/rest/v1/${table}`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    update: async (body, filters = "") => {
      const r = await fetch(`${url}/rest/v1/${table}?${filters}`, {
        method: "PATCH",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.ok;
    },
    delete: async (filters = "") => {
      const r = await fetch(`${url}/rest/v1/${table}?${filters}`, {
        method: "DELETE",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      return r.ok;
    },
  }),
  storage: {
    upload: async (bucket, path, file) => {
      const r = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": file.type || "audio/mpeg" },
        body: file,
      });
      if (!r.ok) throw new Error("Upload failed");
      return `${url}/storage/v1/object/public/${bucket}/${path}`;
    },
  },
});

/* ─── utils ─── */
const fT = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fN = n => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`;
const uid = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
const HUES = ["#7c3aed","#2563eb","#d97706","#db2777","#059669","#8b5cf6","#ea580c","#0891b2","#dc2626","#ec4899","#6d28d9","#0f766e"];
const GENRES = ["Electronic","Chill","Ambient","Indie","Hip-Hop","Dream Pop","Soul","Folk","Rock","J-Pop","Bass","Alt","Pop","R&B","Lo-Fi","Experimental"];

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#07071a;--s1:#0d0d26;--s2:#141438;--s3:#1c1c4a;--br:rgba(148,120,255,.1);--br2:rgba(148,120,255,.22);--ac:#9b6dff;--ac2:#38d9f5;--tx:#edeeff;--t2:#9e9bc0;--t3:#565378;--dng:#ff4466;--ok:#22c55e}
html,body{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.5}
button{cursor:pointer;font-family:inherit;border:none;background:none;color:inherit}
input,select,textarea{font-family:inherit;color:var(--tx)}
input:focus,select:focus,textarea:focus{outline:none}
*::-webkit-scrollbar{width:4px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:var(--s3);border-radius:2px}
@keyframes pulse{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:.5;transform:scaleY(.3)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fadeUp{animation:fadeUp .3s ease both}

/* AUTH */
.auth-bg{height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:var(--bg)}
.orbs{position:absolute;inset:0;pointer-events:none}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.26;animation:float 9s ease-in-out infinite}
.o1{width:420px;height:420px;background:#7c3aed;top:-110px;left:-80px}
.o2{width:300px;height:300px;background:#0891b2;bottom:-60px;right:18%;animation-delay:2.8s}
.o3{width:240px;height:240px;background:#db2777;top:30%;right:-50px;animation-delay:5s}
.auth-card{width:420px;padding:40px;z-index:1;background:rgba(13,13,38,.92);border:1px solid var(--br2);border-radius:24px;backdrop-filter:blur(24px);animation:popIn .5s ease both}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:5px}
.logo-icon{font-size:24px;color:var(--ac)}
.logo-text{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;letter-spacing:.12em}
.auth-tag{color:var(--t3);font-size:12px;margin-bottom:24px;font-style:italic}
.atabs{display:flex;gap:3px;background:var(--s2);padding:4px;border-radius:12px;margin-bottom:16px}
.atab{flex:1;padding:8px;border-radius:9px;font-size:13px;font-weight:500;transition:all .2s;color:var(--t2)}
.atab.on{background:var(--ac);color:#fff}
.ai{width:100%;padding:12px 14px;margin-bottom:10px;background:var(--s2);border:1px solid var(--br);border-radius:11px;font-size:14px;transition:border-color .2s}
.ai:focus{border-color:var(--ac)}
.aerr{color:var(--dng);font-size:12px;margin-bottom:10px;padding:8px 12px;background:rgba(255,68,102,.08);border-radius:8px;border:1px solid rgba(255,68,102,.2)}
.abtn{width:100%;padding:13px;border-radius:12px;background:linear-gradient(135deg,var(--ac),#5b21b6);color:#fff;font-weight:600;font-size:15px;transition:transform .15s,opacity .15s;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px}
.abtn:hover{opacity:.9;transform:translateY(-1px)}
.abtn:disabled{opacity:.5;pointer-events:none}
.spin-sm{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}

/* APP SHELL */
.app{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.app-body{display:flex;flex:1;overflow:hidden;min-height:0}

/* SIDEBAR */
.sb{width:220px;flex-shrink:0;background:var(--s1);border-right:1px solid var(--br);display:flex;flex-direction:column;overflow:hidden}
.sb-logo{display:flex;align-items:center;gap:9px;padding:18px 18px 12px;cursor:pointer}
.sb-logo .logo-icon{font-size:19px}
.sb-logo .logo-text{font-size:14px;letter-spacing:.1em}
.sb-nav{padding:0 8px;margin-bottom:4px}
.ni{display:flex;align-items:center;gap:11px;width:100%;padding:9px 12px;border-radius:10px;color:var(--t2);font-size:14px;font-weight:500;transition:all .18s;text-align:left}
.ni:hover{background:var(--s2);color:var(--tx)}
.ni.on{background:var(--s2);color:var(--tx)}
.ni.on .nic{color:var(--ac)}
.nic{font-size:16px;width:20px;text-align:center;flex-shrink:0}
.ni-badge{font-size:9px;background:var(--dng);color:#fff;padding:1px 6px;border-radius:8px;font-weight:700}
.sb-pls{flex:1;overflow-y:auto;padding:0 8px}
.spt{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;color:var(--t3);font-size:10px;letter-spacing:.1em;font-weight:600;text-transform:uppercase}
.sb-add{width:19px;height:19px;border-radius:50%;background:var(--s3);color:var(--t2);display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .15s}
.sb-add:hover{background:var(--ac);color:#fff}
.sp-i{display:flex;align-items:center;gap:9px;width:100%;padding:7px 12px;border-radius:8px;color:var(--t2);font-size:13px;transition:all .15s;text-align:left;overflow:hidden}
.sp-i:hover{background:var(--s2);color:var(--tx)}
.sp-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.sb-user{display:flex;align-items:center;gap:9px;padding:11px 14px;margin:8px 8px 6px;background:var(--s2);border-radius:12px;cursor:pointer;transition:background .15s;flex-shrink:0}
.sb-user:hover{background:var(--s3)}
.sb-emo{font-size:20px}
.sb-ui{flex:1;overflow:hidden}
.sb-un{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;white-space:nowrap}
.admin-badge{font-size:9px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:1px 6px;border-radius:6px;font-weight:700;letter-spacing:.04em}
.sb-st{font-size:10px;color:var(--ac2);display:flex;align-items:center;gap:4px}
.sb-st::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--ac2);display:inline-block}

/* TOPBAR */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{padding:12px 22px;background:var(--s1);border-bottom:1px solid var(--br);flex-shrink:0;display:flex;gap:10px;align-items:center}
.sw{display:flex;align-items:center;gap:9px;background:var(--s2);border:1px solid var(--br);border-radius:12px;padding:8px 13px;flex:1;transition:border-color .2s}
.sw:focus-within{border-color:var(--ac)}
.si-ic{color:var(--t3);font-size:15px}
.si{flex:1;background:none;border:none;font-size:14px;color:var(--tx)}
.si::placeholder{color:var(--t3)}
.sc{color:var(--t3);font-size:13px}
.content{flex:1;overflow-y:auto;overflow-x:hidden}
.vc{padding:22px 26px 100px;animation:fadeUp .3s ease both}
.vtitle{font-family:'Syne',sans-serif;font-size:24px;font-weight:700;margin-bottom:4px}
.vsub{color:var(--t2);margin-bottom:20px;font-size:14px}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.stitle{font-family:'Syne',sans-serif;font-size:15px;font-weight:600}
.slink{color:var(--ac);font-size:12px;font-weight:500}
.slink:hover{text-decoration:underline}
.scnt{color:var(--t3);font-size:12px}
.empty{color:var(--t3);font-size:13px;font-style:italic;padding:12px 0}

/* HOME */
.hgreet{margin-bottom:24px}
.hgreet h1{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;margin-bottom:5px;line-height:1.25}
.gtx{background:linear-gradient(90deg,var(--ac),var(--ac2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hsub{color:var(--t2);font-size:14px}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
.fc{border-radius:16px;padding:16px;cursor:pointer;border:1px solid var(--br);position:relative;overflow:hidden;transition:transform .2s,border-color .2s}
.fc:hover{transform:translateY(-3px);border-color:var(--br2)}
.fart{width:46px;height:46px;border-radius:10px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;margin-bottom:11px;font-family:'Syne',sans-serif}
.fgen{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);display:block;margin-bottom:3px}
.ftit{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;margin-bottom:2px}
.fart2{color:var(--t2);font-size:12px;margin-bottom:7px}
.fsts{display:flex;gap:10px;font-size:11px;color:var(--t3)}
.fplay{position:absolute;right:12px;bottom:12px;width:32px;height:32px;border-radius:50%;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:12px;opacity:0;transform:scale(.75);transition:opacity .2s,transform .2s}
.fc:hover .fplay{opacity:1;transform:scale(1)}
.gps{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:22px}
.gp{padding:6px 14px;border-radius:18px;font-size:13px;font-weight:500;background:var(--s2);border:1px solid var(--br);color:var(--t2);cursor:pointer;transition:all .18s}
.gp:hover{border-color:var(--ac);color:var(--tx)}
.gp.on{background:var(--ac);color:#fff;border-color:var(--ac)}

/* SONG ROW */
.sl{display:flex;flex-direction:column;gap:2px;margin-bottom:22px}
.sr{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;border-radius:10px;cursor:pointer;position:relative;transition:background .15s}
.sr:hover{background:var(--s2)}
.sr.act{background:var(--s2);border:1px solid var(--br2)}
.srl{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.srr{display:flex;align-items:center;gap:6px;flex-shrink:0}
.snw{width:20px;text-align:center;flex-shrink:0}
.snum{color:var(--t3);font-size:12px}
.scov{width:36px;height:36px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;font-family:'Syne',sans-serif}
.si2{flex:1;min-width:0}
.stit{display:block;font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sart{display:block;font-size:11px;color:var(--t2)}
.subby{font-size:10px;color:var(--ac2)}
.mbadge{font-size:10px;color:var(--ac2);background:rgba(56,217,245,.1);padding:2px 6px;border-radius:6px}
.ib{font-size:15px;color:var(--t3);padding:3px 4px;transition:color .15s;border-radius:6px;line-height:1}
.ib:hover{color:var(--tx)}
.ib.lk{color:var(--dng)}
.sdur{color:var(--t3);font-size:12px;width:32px;text-align:right}
.wm{display:flex;align-items:flex-end;gap:2px;height:16px}
.wm span{width:3px;background:var(--ac);border-radius:2px}
.wm span:nth-child(1){height:55%;animation:pulse .9s ease infinite 0s}
.wm span:nth-child(2){height:100%;animation:pulse .9s ease infinite .2s}
.wm span:nth-child(3){height:70%;animation:pulse .9s ease infinite .1s}
.wm span:nth-child(4){height:40%;animation:pulse .9s ease infinite .3s}
.plm{position:absolute;right:36px;top:42px;z-index:50;background:var(--s2);border:1px solid var(--br2);border-radius:14px;padding:8px;min-width:175px;box-shadow:0 16px 36px rgba(0,0,0,.55);animation:popIn .2s ease both}
.plmt{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);padding:4px 10px 7px}
.plmi{display:block;width:100%;text-align:left;padding:8px 10px;border-radius:8px;font-size:13px;color:var(--t2);transition:all .15s}
.plmi:hover{background:var(--s3);color:var(--tx)}
.plmc{display:block;width:100%;text-align:center;padding:7px;border-top:1px solid var(--br);margin-top:4px;font-size:12px;color:var(--t3)}
.plmc:hover{color:var(--tx)}

/* DISCOVER */
.dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:11px}
.dc{cursor:pointer;border-radius:13px;overflow:hidden;border:1px solid var(--br);transition:transform .2s,border-color .2s}
.dc:hover{transform:translateY(-4px);border-color:var(--br2)}
.dart{height:130px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.dlet{font-family:'Syne',sans-serif;font-size:42px;font-weight:800;color:rgba(255,255,255,.5)}
.dplay{position:absolute;inset:0;background:rgba(0,0,0,.38);display:flex;align-items:center;justify-content:center;font-size:20px;opacity:0;transition:opacity .2s}
.dc:hover .dplay{opacity:1}
.dinfo{padding:10px;background:var(--s2)}
.dtit{font-size:13px;font-weight:600;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dart2{font-size:11px;color:var(--t2);margin-bottom:6px}
.dmeta{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--t3)}
.dgt{background:var(--s3);padding:2px 7px;border-radius:5px;color:var(--ac);font-size:10px}

/* LIBRARY */
.lsec{margin-bottom:28px}
.pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:11px;margin-bottom:8px}
.pc{cursor:pointer;padding:15px;background:var(--s2);border-radius:13px;border:1px solid var(--br);text-align:center;transition:all .2s}
.pc:hover{background:var(--s3);border-color:var(--br2);transform:translateY(-2px)}
.part{font-size:32px;margin-bottom:8px}
.pname{font-size:13px;font-weight:600;margin-bottom:3px}
.pcnt{font-size:11px;color:var(--t3)}
.bk{color:var(--t2);font-size:13px;margin-bottom:16px;padding:4px 0;display:inline-flex;align-items:center;gap:4px}
.bk:hover{color:var(--tx)}
.plhdr{display:flex;gap:20px;align-items:flex-end;margin-bottom:24px}
.plart-lg{font-size:60px;width:108px;height:108px;background:var(--s2);border-radius:14px;display:flex;align-items:center;justify-content:center;border:1px solid var(--br);flex-shrink:0}
.plhi{flex:1}
.pltype{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3)}
.plhn{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;margin:5px 0}
.plhm{color:var(--t2);font-size:13px;margin-bottom:13px}
.pall{padding:9px 20px;background:var(--ac);color:#fff;border-radius:20px;font-weight:600;font-size:14px;transition:opacity .15s}
.pall:hover{opacity:.85}

/* SUBMIT */
.submit-form{background:var(--s2);border:1px solid var(--br);border-radius:16px;padding:20px;margin-bottom:20px}
.submit-form h3{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:14px}
.drop-zone{border:2px dashed var(--br2);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all .2s;position:relative;background:var(--s3)}
.drop-zone:hover,.drop-zone.dragging{border-color:var(--ac);background:rgba(155,109,255,.08)}
.dz-icon{font-size:36px;margin-bottom:10px;display:block}
.dz-sub{color:var(--t2);font-size:13px}
.sf-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.sf-field{display:flex;flex-direction:column;gap:5px}
.sf-label{font-size:10px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.06em}
.sf-inp{padding:9px 11px;background:var(--bg);border:1px solid var(--br);border-radius:9px;font-size:13px;color:var(--tx);transition:border-color .2s}
.sf-inp:focus{border-color:var(--ac)}
.sf-sel{padding:9px 11px;background:var(--bg);border:1px solid var(--br);border-radius:9px;font-size:13px;color:var(--tx);cursor:pointer}
.sf-sel:focus{border-color:var(--ac)}
.hue-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.hue-dot{width:22px;height:22px;border-radius:50%;cursor:pointer;transition:transform .15s;border:2px solid transparent}
.hue-dot:hover{transform:scale(1.2)}
.hue-dot.sel{border-color:#fff;transform:scale(1.15)}
.submit-btn{width:100%;margin-top:14px;padding:11px;background:linear-gradient(135deg,var(--ac),#5b21b6);color:#fff;border-radius:11px;font-weight:600;font-size:14px;transition:opacity .15s;display:flex;align-items:center;justify-content:center;gap:8px}
.submit-btn:hover{opacity:.9}
.submit-btn:disabled{opacity:.5;pointer-events:none}
.submissions-list{display:flex;flex-direction:column;gap:9px}
.sub-item{display:flex;align-items:center;gap:12px;padding:13px;background:var(--s2);border:1px solid var(--br);border-radius:12px}
.sub-art{width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;font-family:'Syne',sans-serif;flex-shrink:0}
.sub-info{flex:1;min-width:0}
.sub-title{font-size:14px;font-weight:600}
.sub-artist{font-size:12px;color:var(--t2)}
.sub-status{font-size:11px;font-weight:700;padding:3px 9px;border-radius:7px;flex-shrink:0}
.sub-status.pending{background:rgba(251,191,36,.12);color:#fbbf24}
.sub-status.approved{background:rgba(34,197,94,.12);color:var(--ok)}
.sub-status.rejected{background:rgba(255,68,102,.12);color:var(--dng)}
.sub-note{font-size:11px;color:var(--t3);margin-top:3px}

/* PROFILE */
.prfhdr{display:flex;gap:20px;align-items:center;margin-bottom:26px;background:var(--s1);border:1px solid var(--br);border-radius:18px;padding:20px}
.prfemo{font-size:56px}
.prfname{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px}
.prfbio{color:var(--t2);font-size:13px;margin-bottom:12px}
.stats{display:flex;gap:20px}
.st{text-align:center}
.stv{display:block;font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:var(--ac)}
.stl{font-size:10px;color:var(--t3)}
.sml{display:flex;flex-direction:column;gap:6px;margin-bottom:24px}
.smi{display:flex;align-items:flex-start;gap:10px;padding:11px;background:var(--s2);border-radius:11px;border:1px solid var(--br);cursor:pointer;transition:border-color .15s}
.smi:hover{border-color:var(--br2)}
.smd{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}
.smt{font-size:13px;margin-bottom:3px}
.smm{font-size:11px;color:var(--t3)}
.lout{padding:9px 16px;border:1px solid rgba(255,68,102,.3);color:var(--dng);border-radius:9px;font-size:13px;transition:all .15s;margin-top:16px}
.lout:hover{background:rgba(255,68,102,.1)}

/* ADMIN REVIEW */
.admin-section{background:rgba(251,191,36,.04);border:1px solid rgba(251,191,36,.2);border-radius:16px;padding:20px;margin-bottom:24px}
.admin-section-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.pending-card{background:var(--s2);border:1px solid var(--br);border-radius:12px;padding:14px;margin-bottom:10px}
.pc-top{display:flex;align-items:center;gap:11px;margin-bottom:12px}
.pc-art{width:40px;height:40px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;font-family:'Syne',sans-serif;flex-shrink:0}
.pc-info{flex:1;min-width:0}
.pc-title{font-size:14px;font-weight:600}
.pc-meta{font-size:12px;color:var(--t2)}
.pc-submitter{font-size:11px;color:var(--ac2);margin-top:2px}
.pc-actions{display:flex;gap:8px;align-items:center}
.pc-play{width:30px;height:30px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:12px;transition:all .15s}
.pc-play:hover,.pc-play.playing{background:var(--ac);color:#fff}
.approve-btn{padding:7px 14px;background:rgba(34,197,94,.15);color:var(--ok);border:1px solid rgba(34,197,94,.3);border-radius:9px;font-size:12px;font-weight:600;transition:all .15s}
.approve-btn:hover{background:rgba(34,197,94,.25)}
.reject-btn{padding:7px 14px;background:rgba(255,68,102,.1);color:var(--dng);border:1px solid rgba(255,68,102,.25);border-radius:9px;font-size:12px;font-weight:600;transition:all .15s}
.reject-btn:hover{background:rgba(255,68,102,.2)}
.note-inp{flex:1;padding:7px 10px;background:var(--bg);border:1px solid var(--br);border-radius:8px;font-size:12px;color:var(--tx)}
.note-inp:focus{border-color:var(--ac)}

/* CHAT PANEL */
.cp{background:var(--s1);border-left:1px solid var(--br);display:flex;flex-direction:column;overflow:hidden;transition:width .3s ease;flex-shrink:0}
.cphdr{display:flex;align-items:center;justify-content:space-between;padding:13px 14px 10px;border-bottom:1px solid var(--br);flex-shrink:0}
.cphdr h3{font-family:'Syne',sans-serif;font-size:13px;font-weight:700}
.cpbtn{padding:4px 8px;background:var(--s2);border-radius:7px;color:var(--t2);font-size:12px;transition:all .15s}
.cpbtn:hover{color:var(--tx)}
.lb{display:flex;align-items:center;gap:5px}
.lbd{width:5px;height:5px;border-radius:50%;background:var(--ac);animation:pulse 1.5s ease infinite}
.lbt{font-size:10px;color:var(--ac)}
.fl{flex:1;overflow-y:auto;padding:6px}
.fi{display:flex;align-items:center;gap:9px;padding:8px;border-radius:9px;cursor:pointer;transition:background .15s}
.fi:hover{background:var(--s2)}
.femo{font-size:21px}
.fii{flex:1;min-width:0}
.fin{font-size:13px;font-weight:500;display:block}
.fls{font-size:10px;color:var(--ac2);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw{flex:1;display:flex;flex-direction:column;overflow:hidden}
.cwhdr{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--br);flex-shrink:0}
.bsm{font-size:15px;color:var(--t2);padding:2px 3px}
.cfn{font-size:13px;font-weight:600}
.ma{flex:1;overflow-y:auto;padding:9px 9px 4px;display:flex;flex-direction:column;gap:6px}
.msg{display:flex;flex-direction:column}
.msg.me{align-items:flex-end}
.msg.them{align-items:flex-start}
.mbx{max-width:88%;padding:7px 11px;border-radius:12px;font-size:13px;line-height:1.4}
.me .mbx{background:var(--ac);color:#fff;border-radius:12px 12px 3px 12px}
.them .mbx{background:var(--s3);border-radius:12px 12px 12px 3px}
.mt{font-size:9px;color:var(--t3);margin-top:2px;padding:0 2px}
.cnp{display:flex;align-items:center;gap:7px;padding:7px 10px;background:rgba(155,109,255,.07);border-top:1px solid var(--br);font-size:11px;color:var(--t2);flex-shrink:0}
.cnpd{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.cir{display:flex;gap:6px;padding:8px 10px;border-top:1px solid var(--br);flex-shrink:0}
.ci{flex:1;padding:8px 10px;background:var(--s2);border:1px solid var(--br);border-radius:9px;font-size:13px;color:var(--tx);transition:border-color .2s}
.ci:focus{border-color:var(--ac)}
.csb{width:32px;height:32px;border-radius:50%;background:var(--ac);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.csb:hover{opacity:.85}

/* PLAYER */
.pb{height:70px;flex-shrink:0;display:flex;align-items:center;gap:12px;padding:0 20px;background:rgba(7,7,26,.97);border-top:1px solid var(--br);backdrop-filter:blur(16px)}
.psi{display:flex;align-items:center;gap:10px;width:220px;cursor:pointer;flex-shrink:0}
.pa{width:40px;height:40px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;font-family:'Syne',sans-serif;position:relative;overflow:hidden}
.paw{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;gap:2px;padding:4px;background:rgba(0,0,0,.42)}
.paw span{width:3px;background:#fff;border-radius:2px}
.paw span:nth-child(1){height:55%;animation:pulse .9s ease infinite 0s}
.paw span:nth-child(2){height:85%;animation:pulse .9s ease infinite .15s}
.paw span:nth-child(3){height:45%;animation:pulse .9s ease infinite .3s}
.pst{flex:1;min-width:0}
.ptit{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.part2{display:block;font-size:11px;color:var(--t2)}
.plk{font-size:16px;color:var(--t3);transition:color .15s;padding:2px}
.plk.lk{color:var(--dng)}
.plk:hover{color:var(--tx)}
.pc2{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}
.pctrl{display:flex;align-items:center;gap:6px}
.cb{font-size:16px;color:var(--t3);padding:5px;border-radius:6px;transition:all .15s}
.cb:hover{color:var(--tx)}
.cb.on{color:var(--ac)}
.cbm{font-size:17px}
.cbp{width:34px;height:34px;border-radius:50%;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:14px;transition:transform .15s;flex-shrink:0}
.cbp:hover{opacity:.85;transform:scale(1.06)}
.pr{display:flex;align-items:center;gap:8px;width:100%;max-width:430px}
.tl{font-size:10px;color:var(--t3);width:28px;flex-shrink:0}
.tl:last-child{text-align:right}
.pt{flex:1;height:4px;background:var(--s3);border-radius:2px;cursor:pointer;position:relative;transition:height .15s}
.pt:hover{height:6px}
.pf{height:100%;border-radius:2px;pointer-events:none}
.pm-dot{position:absolute;top:50%;transform:translate(-50%,-50%);width:6px;height:6px;border-radius:50%;background:var(--ac2);border:1px solid rgba(255,255,255,.35);pointer-events:none}
.prgt{display:flex;align-items:center;gap:8px;width:180px;justify-content:flex-end;flex-shrink:0}
.vol-ic{font-size:13px;color:var(--t3)}
.vol-sl{width:70px;height:4px;accent-color:var(--ac);cursor:pointer}
.pe{flex:1;display:flex;align-items:center;justify-content:center;gap:14px;color:var(--t3)}
.pe-btn{padding:7px 14px;background:var(--s2);border-radius:9px;color:var(--t2);font-size:13px;transition:all .15s}
.pe-btn:hover{background:var(--ac);color:#fff}

/* NP MODAL */
.mo{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);animation:fadeUp .2s ease both}
.npm{width:540px;max-height:90vh;background:var(--s1);border:1px solid var(--br2);border-radius:22px;padding:26px;position:relative;overflow-y:auto;animation:popIn .3s ease both;box-shadow:0 30px 60px rgba(0,0,0,.6)}
.mc{position:absolute;top:14px;right:14px;font-size:17px;color:var(--t3);padding:6px;border-radius:7px}
.mc:hover{color:var(--tx);background:var(--s3)}
.np-art{width:100%;height:180px;border-radius:14px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:16px}
.np-let{font-family:'Syne',sans-serif;font-size:72px;font-weight:800;color:rgba(255,255,255,.35)}
.np-wv{position:absolute;bottom:12px;display:flex;align-items:flex-end;gap:3px}
.np-wv span{width:5px;background:#fff;border-radius:3px;opacity:.75}
.np-wv span:nth-child(1){height:18px;animation:pulse .7s ease infinite 0s}
.np-wv span:nth-child(2){height:32px;animation:pulse .7s ease infinite .1s}
.np-wv span:nth-child(3){height:24px;animation:pulse .7s ease infinite .2s}
.np-wv span:nth-child(4){height:38px;animation:pulse .7s ease infinite .05s}
.np-wv span:nth-child(5){height:20px;animation:pulse .7s ease infinite .25s}
.np-tit{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;margin-bottom:3px}
.np-art2{color:var(--t2);margin-bottom:3px;font-size:14px}
.np-meta{font-size:12px;color:var(--ac);margin-bottom:3px}
.np-sts{font-size:12px;color:var(--t3);margin-bottom:16px}
.np-pb{width:100%;height:6px;background:var(--s3);border-radius:3px;cursor:pointer;position:relative}
.np-ts{display:flex;justify-content:space-between;font-size:11px;color:var(--t3);margin-bottom:7px}
.np-pf{height:100%;border-radius:3px;pointer-events:none}
.smdot{position:absolute;top:50%;transform:translate(-50%,-50%);width:11px;height:11px;border-radius:50%;border:2px solid rgba(255,255,255,.5);cursor:pointer;z-index:1;transition:transform .15s}
.smdot:hover{transform:translate(-50%,-50%) scale(1.5)}
.smhdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:11px}
.smhdr h3{font-size:14px;font-weight:600}
.amb{font-size:12px;color:var(--ac);background:rgba(155,109,255,.1);padding:5px 11px;border-radius:9px;transition:all .15s}
.amb:hover{background:rgba(155,109,255,.2)}
.nir{display:flex;gap:7px;margin-bottom:11px}
.ni2{flex:1;padding:9px 12px;background:var(--s2);border:1px solid var(--br);border-radius:9px;font-size:13px;color:var(--tx)}
.ni2:focus{border-color:var(--ac)}
.ns{padding:9px 14px;background:var(--ac);color:#fff;border-radius:9px;font-size:13px;font-weight:600}
.mlist{display:flex;flex-direction:column;gap:7px}
.memp{font-size:12px;color:var(--t3);font-style:italic}
.mi{display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--s2);border-radius:11px;cursor:pointer;transition:background .15s;border:1px solid var(--br)}
.mi:hover{background:var(--s3)}
.midk{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px}
.mitop{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px}
.miu{font-size:11px;font-weight:600;color:var(--t2)}
.mitm{font-size:10px;color:var(--ac)}
.mitx{font-size:13px;line-height:1.4}
.cpm{background:var(--s1);border:1px solid var(--br2);border-radius:18px;padding:22px;width:340px;animation:popIn .3s ease both}
.cpm h3{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;margin-bottom:14px}
.mi3{width:100%;padding:11px 13px;background:var(--s2);border:1px solid var(--br);border-radius:11px;font-size:14px;margin-bottom:14px;color:var(--tx)}
.mi3:focus{border-color:var(--ac)}
.ma2{display:flex;gap:9px;justify-content:flex-end}
.mcan{padding:8px 16px;background:var(--s2);border-radius:9px;font-size:13px;color:var(--t2)}
.mcon{padding:8px 16px;background:var(--ac);color:#fff;border-radius:9px;font-size:13px;font-weight:600}
.mcon:hover{opacity:.85}

/* SETUP SCREEN */
.setup-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden}
.setup-card{width:480px;padding:40px;background:rgba(13,13,38,.92);border:1px solid var(--br2);border-radius:24px;backdrop-filter:blur(24px);z-index:1;animation:popIn .5s ease both}
.setup-card h2{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;margin-bottom:6px}
.setup-card p{color:var(--t2);font-size:13px;margin-bottom:22px;line-height:1.6}
.setup-inp{width:100%;padding:12px 14px;margin-bottom:12px;background:var(--s2);border:1px solid var(--br);border-radius:11px;font-size:14px;color:var(--tx);transition:border-color .2s}
.setup-inp:focus{border-color:var(--ac)}
.setup-btn{width:100%;padding:13px;border-radius:12px;background:linear-gradient(135deg,var(--ac),#5b21b6);color:#fff;font-weight:600;font-size:15px;transition:opacity .15s;margin-top:4px}
.setup-btn:hover{opacity:.9}
.setup-note{font-size:12px;color:var(--t3);margin-top:14px;text-align:center}
`;

export default function App() {
  /* ── config ── */
  const [cfg, setCfg] = useState({ url: SUPABASE_URL, key: SUPABASE_KEY });
  const [cfgForm, setCfgForm] = useState({ url: "", key: "" });
  const [ready, setReady] = useState(!!(SUPABASE_URL && SUPABASE_KEY));
  const API = useRef(null);

  /* ── auth ── */
  const [user, setUser] = useState(null); // {username, avatar, bio, is_admin}
  const [authMode, setAuthMode] = useState("login");
  const [af, setAf] = useState({ username: "", email: "", password: "", avatar: "🎵" });
  const [aerr, setAerr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  /* ── songs ── */
  const [songs, setSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  /* ── submissions ── */
  const [mySubs, setMySubs] = useState([]);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [subFile, setSubFile] = useState(null);
  const [subForm, setSubForm] = useState({ title: "", artist: "", album: "", genre: "Unknown", year: new Date().getFullYear(), hue: HUES[0] });
  const [subBusy, setSubBusy] = useState(false);
  const [subErr, setSubErr] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [adminNote, setAdminNote] = useState({});
  const [previewId, setPreviewId] = useState(null);

  /* ── player ── */
  const audioRef = useRef(new Audio());
  const [song, setSong] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(0.75);
  const [shuffled, setShuffled] = useState(false);
  const [looped, setLooped] = useState(false);

  /* ── playlists (local) ── */
  const [playlists, setPlaylists] = useState([{ id: "p1", name: "Favourites", songs: [], cover: "❤️" }]);
  const [selPl, setSelPl] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);

  /* ── soundmarks ── */
  const [soundmarks, setSoundmarks] = useState([]);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  /* ── UI ── */
  const [view, setView] = useState("home");
  const [discoverGenre, setDiscoverGenre] = useState(null);
  const [query, setQuery] = useState("");
  const [showNP, setShowNP] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [openChat, setOpenChat] = useState(null);
  const [chatIn, setChatIn] = useState("");
  const [msgs, setMsgs] = useState({});
  const [plMenu, setPlMenu] = useState(null);
  const [showCPL, setShowCPL] = useState(false);
  const [cplName, setCplName] = useState("");
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ── init ── */
  useEffect(() => {
    (async () => {
      const savedCfg = await store.get("nw_cfg");
      if (savedCfg) {
        const c = JSON.parse(savedCfg);
        setCfg(c); API.current = sb(c.url, c.key); setReady(true);
      } else if (SUPABASE_URL && SUPABASE_KEY) {
        API.current = sb(SUPABASE_URL, SUPABASE_KEY); setReady(true);
      }
      const savedUser = await store.get("nw_user");
      if (savedUser) setUser(JSON.parse(savedUser));
      const savedLiked = await store.get("nw_liked");
      if (savedLiked) setLikedSongs(JSON.parse(savedLiked));
      const savedPls = await store.get("nw_pls");
      if (savedPls) setPlaylists(JSON.parse(savedPls));
    })();
    const ae = audioRef.current;
    ae.ontimeupdate = () => setProg(ae.currentTime || 0);
    ae.ondurationchange = () => setDur(ae.duration || 0);
    ae.onended = () => { if (!looped) nextSong(); };
    return () => ae.pause();
  }, []);

  useEffect(() => { if (ready && user) { loadSongs(); loadMySubs(); if (user.is_admin) loadPending(); } }, [ready, user]);
  useEffect(() => { if (user) store.set("nw_user", JSON.stringify(user)); }, [user]);
  useEffect(() => { store.set("nw_liked", JSON.stringify(likedSongs)); }, [likedSongs]);
  useEffect(() => { store.set("nw_pls", JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { audioRef.current.volume = vol; }, [vol]);
  useEffect(() => { audioRef.current.loop = looped; }, [looped]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, openChat]);
  useEffect(() => {
    const h = e => { if (plMenu && !e.target.closest(".plm") && !e.target.closest(".ib")) setPlMenu(null); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [plMenu]);

  /* ── data fetching ── */
  const loadSongs = async () => {
    if (!API.current) return;
    setLoadingSongs(true);
    try {
      const data = await API.current.from("songs").select("*", "&is_approved=eq.true&order=created_at.desc");
      setSongs(data || []);
    } catch (e) { console.error(e); }
    setLoadingSongs(false);
  };

  const loadMySubs = async () => {
    if (!API.current || !user) return;
    try {
      const data = await API.current.from("songs").select("*", `&submitted_by=eq.${encodeURIComponent(user.username)}&is_approved=eq.false&order=created_at.desc`);
      const approved = await API.current.from("songs").select("*", `&submitted_by=eq.${encodeURIComponent(user.username)}&is_approved=eq.true&order=created_at.desc`);
      setMySubs([...(data || []).map(s => ({ ...s, status: "pending" })), ...(approved || []).map(s => ({ ...s, status: "approved" }))]);
    } catch {}
  };

  const loadPending = async () => {
    if (!API.current) return;
    try {
      const data = await API.current.from("songs").select("*", "&is_approved=eq.false&order=created_at.asc");
      setPendingSubs(data || []);
    } catch {}
  };

  /* ── setup ── */
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
        if (!res || !res.length) throw new Error("Wrong username or password.");
        setUser(res[0]);
      } else {
        if (!af.username.trim() || af.username.length < 3) throw new Error("Username must be at least 3 characters.");
        const existing = await API.current.from("profiles").select("id", `&username=eq.${encodeURIComponent(af.username)}`);
        if (existing && existing.length) throw new Error("Username already taken.");
        const [newUser] = await API.current.from("profiles").insert({ id: uid(), username: af.username.trim(), password_hash: hash, email: af.email, avatar: af.avatar, bio: "New to the groove", is_admin: false });
        setUser(newUser);
      }
    } catch (e) { setAerr(e.message); }
    setAuthBusy(false);
  };

  /* ── player ── */
  const playSong = async (s) => {
    audioRef.current.pause();
    if (s.audio_url) { audioRef.current.src = s.audio_url; try { await audioRef.current.play(); setPlaying(true); } catch { setPlaying(false); } }
    setSong(s); setProg(0);
    if (API.current && s.id) {
      API.current.from("songs").update({ plays: (s.plays || 0) + 1 }, `id=eq.${s.id}`).catch(() => {});
      setSongs(p => p.map(x => x.id === s.id ? { ...x, plays: (x.plays || 0) + 1 } : x));
    }
  };
  const togglePlay = () => { if (playing) { audioRef.current.pause(); setPlaying(false); } else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); } };
  const seek = pct => { if (dur) { audioRef.current.currentTime = dur * pct / 100; setProg(dur * pct / 100); } };
  const nextSong = () => { const i = songs.findIndex(s => s.id === song?.id); playSong(shuffled ? songs[Math.floor(Math.random() * songs.length)] : songs[(i + 1) % songs.length]); };
  const prevSong = () => { if (prog > 3) { audioRef.current.currentTime = 0; setProg(0); return; } const i = songs.findIndex(s => s.id === song?.id); playSong(songs[(i - 1 + songs.length) % songs.length]); };
  const toggleLike = id => setLikedSongs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  /* ── submission ── */
  const handleSubFile = async (file) => {
    if (!file || !file.type.startsWith("audio/")) return;
    setSubFile(file);
    const base = file.name.replace(/\.[^.]+$/, "").replace(/_/g, " ");
    const dash = base.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dash) setSubForm(p => ({ ...p, artist: dash[1].trim(), title: dash[2].trim() }));
    else setSubForm(p => ({ ...p, title: base.trim() }));
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => setSubForm(p => ({ ...p, duration: Math.floor(audio.duration) }));
  };

  const submitSong = async () => {
    if (!subFile || !subForm.title || !subForm.artist) return setSubErr("Please fill title & artist, and select a file.");
    setSubBusy(true); setSubErr("");
    try {
      const fn = `${uid()}_${subFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const audioUrl = await API.current.storage.upload("submissions", fn, subFile);
      await API.current.from("songs").insert({
        title: subForm.title, artist: subForm.artist, album: subForm.album || "",
        genre: subForm.genre, year: Number(subForm.year), audio_url: audioUrl,
        hue: subForm.hue, duration: subForm.duration || 0,
        is_approved: false, submitted_by: user.username, plays: 0, likes: 0,
      });
      setSubFile(null); setSubForm({ title: "", artist: "", album: "", genre: "Unknown", year: new Date().getFullYear(), hue: HUES[0] });
      await loadMySubs();
      setSubErr("✓ Submitted! Waiting for admin approval.");
    } catch (e) { setSubErr("Upload failed: " + e.message); }
    setSubBusy(false);
  };

  /* ── admin actions ── */
  const approveSub = async (s) => {
    await API.current.from("songs").update({ is_approved: true, admin_note: adminNote[s.id] || "" }, `id=eq.${s.id}`);
    setPendingSubs(p => p.filter(x => x.id !== s.id));
    await loadSongs();
  };
  const rejectSub = async (s) => {
    await API.current.from("songs").update({ is_approved: false, admin_note: adminNote[s.id] || "Not approved." }, `id=eq.${s.id}`);
    setPendingSubs(p => p.filter(x => x.id !== s.id));
  };
  const deleteSub = async (s) => {
    await API.current.from("songs").delete(`id=eq.${s.id}`);
    setPendingSubs(p => p.filter(x => x.id !== s.id));
  };

  /* ── soundmarks ── */
  const addSoundmark = async () => {
    if (!noteText.trim() || !song) return;
    const sm = { id: uid(), song_id: song.id, username: user.username, avatar: user.avatar, ts_sec: Math.floor(prog), note: noteText };
    setSoundmarks(p => [...p, sm]);
    if (API.current) API.current.from("soundmarks").insert(sm).catch(() => {});
    setNoteText(""); setShowNote(false);
  };

  /* ── chat ── */
  const sendMsg = (toId) => {
    if (!chatIn.trim()) return;
    const m = { id: uid(), from: user.username, text: chatIn.trim(), time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) };
    setMsgs(p => ({ ...p, [toId]: [...(p[toId] || []), m] }));
    setChatIn("");
    const replies = ["that hits different 🎵", "omg yes 🔥", "have you heard the new stuff?", "sending you a soundmark rn 📍", "main character energy ✨"];
    setTimeout(() => setMsgs(p => ({ ...p, [toId]: [...(p[toId] || []), { id: uid(), from: toId, text: replies[Math.floor(Math.random() * replies.length)], time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }] })), 1400 + Math.random() * 2000);
  };

  /* ── helpers ── */
  const userPls = playlists;
  const songMarks = soundmarks.filter(sm => sm.song_id === song?.id);
  const progPct = dur > 0 ? (prog / dur) * 100 : 0;
  const searchResults = query.trim() ? songs.filter(s => s.title?.toLowerCase().includes(query.toLowerCase()) || s.artist?.toLowerCase().includes(query.toLowerCase()) || s.genre?.toLowerCase().includes(query.toLowerCase())) : [];
  const addToPl = (plId, sId) => setPlaylists(p => p.map(pl => pl.id === plId && !pl.songs.includes(sId) ? { ...pl, songs: [...pl.songs, sId] } : pl));
  const createPl = () => { if (!cplName.trim()) return; const emojis = ["🎵","🎶","🎸","🎹","🔥","🌊","✨","🌙"]; setPlaylists(p => [...p, { id: uid(), name: cplName, songs: [], cover: emojis[Math.floor(Math.random() * emojis.length)] }]); setCplName(""); setShowCPL(false); };

  /* ─────────────────────────────
     RENDER HELPERS
  ───────────────────────────── */
  const SongRow = ({ s, idx }) => {
    const isAct = song?.id === s.id;
    const isLk = likedSongs.includes(s.id);
    const mc = songMarks.filter(sm => sm.song_id === s.id).length;
    return (
      <div className={`sr${isAct ? " act" : ""}`} onClick={() => playSong(s)}>
        <div className="srl">
          <div className="snw">{isAct && playing ? <div className="wm"><span /><span /><span /><span /></div> : <span className="snum">{idx + 1}</span>}</div>
          <div className="scov" style={{ background: `linear-gradient(135deg,${s.hue}66,${s.hue}22)` }}>{(s.title || "?")[0]}</div>
          <div className="si2">
            <span className="stit">{s.title}</span>
            <span className="sart">{s.artist}{s.submitted_by ? <span className="subby"> · by {s.submitted_by}</span> : null}</span>
          </div>
        </div>
        <div className="srr">
          {mc > 0 && <span className="mbadge">📍{mc}</span>}
          <button className={`ib${isLk ? " lk" : ""}`} onClick={e => { e.stopPropagation(); toggleLike(s.id); }}>{isLk ? "♥" : "♡"}</button>
          <button className="ib" onClick={e => { e.stopPropagation(); setPlMenu(m => m === s.id ? null : s.id); }}>⊕</button>
          <span className="sdur">{s.duration ? fT(s.duration) : "--:--"}</span>
        </div>
        {plMenu === s.id && (
          <div className="plm" onClick={e => e.stopPropagation()}>
            <p className="plmt">Add to playlist</p>
            {userPls.map(pl => <button key={pl.id} className="plmi" onClick={() => { addToPl(pl.id, s.id); setPlMenu(null); }}>{pl.cover} {pl.name}</button>)}
            <button className="plmi" onClick={() => { setShowCPL(true); setPlMenu(null); }}>+ New playlist</button>
            <button className="plmc" onClick={() => setPlMenu(null)}>✕ close</button>
          </div>
        )}
      </div>
    );
  };

  const renderHome = () => {
    const featured = songs.slice(0, 3);
    const trending = [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 7);
    const genres = [...new Set(songs.map(s => s.genre).filter(Boolean))].slice(0, 8);
    const h = new Date().getHours();
    const greeting = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
    return (
      <div className="vc">
        <div className="hgreet">
          <h1>Good <span className="gtx">{greeting}</span>, {user.username} {user.is_admin ? "⭐" : "✦"}</h1>
          <p className="hsub">{songs.length} songs on the platform · {loadingSongs ? "Loading…" : "Ready to play"}</p>
        </div>
        {featured.length > 0 && (<>
          <div className="sh"><h2 className="stitle">Featured</h2></div>
          <div className="fg">
            {featured.map(s => (
              <div key={s.id} className="fc" style={{ background: `linear-gradient(135deg,${s.hue}44,${s.hue}18,transparent)` }} onClick={() => playSong(s)}>
                <div className="fart">{(s.title || "?")[0]}</div>
                <span className="fgen">{s.genre}</span>
                <p className="ftit">{s.title}</p>
                <p className="fart2">{s.artist}</p>
                <div className="fsts"><span>▶ {fN(s.plays || 0)}</span></div>
                <div className="fplay">▶</div>
              </div>
            ))}
          </div>
        </>)}
        {trending.length > 0 && (<>
          <div className="sh"><h2 className="stitle">Trending Now</h2><button className="slink" onClick={() => setView("discover")}>See all →</button></div>
          <div className="sl">{trending.map((s, i) => <SongRow key={s.id} s={s} idx={i} />)}</div>
        </>)}
        {songs.length === 0 && !loadingSongs && <div className="empty" style={{ textAlign: "center", padding: "40px 0" }}><p style={{ fontSize: 32, marginBottom: 12 }}>🎵</p><p>No songs yet — the admin is adding music soon!</p></div>}
        {genres.length > 0 && (<><div className="sh"><h2 className="stitle">Browse by Genre</h2></div><div className="gps">{genres.map(g => <button key={g} className="gp" onClick={() => { setDiscoverGenre(g); setView("discover"); }}>{g}</button>)}</div></>)}
      </div>
    );
  };

  const renderDiscover = () => {
    const genres = [...new Set(songs.map(s => s.genre).filter(Boolean))];
    const filtered = discoverGenre ? songs.filter(s => s.genre === discoverGenre) : songs;
    return (
      <div className="vc">
        <h2 className="vtitle">Discover</h2>
        <p className="vsub">{songs.length} tracks on the platform</p>
        <div className="gps" style={{ marginBottom: 20 }}>
          <button className={`gp${!discoverGenre ? " on" : ""}`} onClick={() => setDiscoverGenre(null)}>All</button>
          {genres.map(g => <button key={g} className={`gp${discoverGenre === g ? " on" : ""}`} onClick={() => setDiscoverGenre(g)}>{g}</button>)}
        </div>
        <div className="dg">
          {filtered.map(s => (
            <div key={s.id} className="dc" onClick={() => playSong(s)}>
              <div className="dart" style={{ background: `linear-gradient(135deg,${s.hue},${s.hue}88)` }}>
                <span className="dlet">{(s.title || "?")[0]}</span>
                <div className="dplay">▶</div>
              </div>
              <div className="dinfo">
                <p className="dtit">{s.title}</p>
                <p className="dart2">{s.artist}</p>
                <div className="dmeta"><span className="dgt">{s.genre || "Music"}</span><span>{s.duration ? fT(s.duration) : "--:--"}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLibrary = () => {
    const liked = songs.filter(s => likedSongs.includes(s.id));
    return (
      <div className="vc">
        <h2 className="vtitle">Your Library</h2>
        <div className="lsec">
          <div className="sh"><h3 className="stitle">Playlists</h3><button className="slink" onClick={() => setShowCPL(true)}>+ Create</button></div>
          <div className="pg">
            {userPls.map(pl => (
              <div key={pl.id} className="pc" onClick={() => { setSelPl(pl); setView("playlist"); }}>
                <div className="part">{pl.cover}</div><p className="pname">{pl.name}</p><p className="pcnt">{pl.songs.length} tracks</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lsec">
          <div className="sh"><h3 className="stitle">Liked Songs</h3><span className="scnt">{liked.length} tracks</span></div>
          <div className="sl">
            {liked.length === 0 && <p className="empty">Heart a track to save it here.</p>}
            {liked.map((s, i) => <SongRow key={s.id} s={s} idx={i} />)}
          </div>
        </div>
      </div>
    );
  };

  const renderPlaylist = () => {
    if (!selPl) return renderLibrary();
    const pSongs = songs.filter(s => selPl.songs.includes(s.id));
    return (
      <div className="vc">
        <button className="bk" onClick={() => setView("library")}>← Library</button>
        <div className="plhdr">
          <div className="plart-lg">{selPl.cover}</div>
          <div className="plhi">
            <span className="pltype">Playlist</span>
            <h2 className="plhn">{selPl.name}</h2>
            <p className="plhm">{pSongs.length} tracks</p>
            <button className="pall" onClick={() => pSongs.length > 0 && playSong(pSongs[0])}>▶ Play All</button>
          </div>
        </div>
        <div className="sl">{pSongs.length === 0 && <p className="empty">No songs yet — add from Discover!</p>}{pSongs.map((s, i) => <SongRow key={s.id} s={s} idx={i} />)}</div>
      </div>
    );
  };

  const renderSubmit = () => (
    <div className="vc">
      <h2 className="vtitle">Submit Your Music</h2>
      <p className="vsub">Upload a track for the admin to review — if approved it appears on the platform with your name.</p>
      <div className="submit-form">
        <h3>Upload a Track</h3>
        <div className={`drop-zone${isDragging ? " dragging" : ""}`}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleSubFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={e => handleSubFile(e.target.files[0])} />
          <span className="dz-icon">{subFile ? "🎵" : "☁️"}</span>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{subFile ? subFile.name : "Drag & drop your audio file"}</p>
          <p className="dz-sub">{subFile ? "Click to change file" : "or click to browse · MP3, WAV, FLAC"}</p>
        </div>
        <div className="sf-row">
          <div className="sf-field"><label className="sf-label">Song Title *</label><input className="sf-inp" value={subForm.title} onChange={e => setSubForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" /></div>
          <div className="sf-field"><label className="sf-label">Artist *</label><input className="sf-inp" value={subForm.artist} onChange={e => setSubForm(p => ({ ...p, artist: e.target.value }))} placeholder="Artist name" /></div>
          <div className="sf-field"><label className="sf-label">Album</label><input className="sf-inp" value={subForm.album} onChange={e => setSubForm(p => ({ ...p, album: e.target.value }))} placeholder="Album (optional)" /></div>
          <div className="sf-field"><label className="sf-label">Genre</label><select className="sf-sel" value={subForm.genre} onChange={e => setSubForm(p => ({ ...p, genre: e.target.value }))}>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          <div className="sf-field"><label className="sf-label">Year</label><input className="sf-inp" type="number" value={subForm.year} onChange={e => setSubForm(p => ({ ...p, year: e.target.value }))} /></div>
          <div className="sf-field">
            <label className="sf-label">Card Color</label>
            <div className="hue-row">{HUES.map(h => <div key={h} className={`hue-dot${subForm.hue === h ? " sel" : ""}`} style={{ background: h }} onClick={() => setSubForm(p => ({ ...p, hue: h }))} />)}</div>
          </div>
        </div>
        {subErr && <p style={{ fontSize: 13, marginTop: 10, color: subErr.startsWith("✓") ? "var(--ok)" : "var(--dng)" }}>{subErr}</p>}
        <button className="submit-btn" onClick={submitSong} disabled={subBusy || !subFile}>
          {subBusy ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />Uploading…</> : "Submit for Review →"}
        </button>
      </div>
      <div className="sh"><h3 className="stitle">My Submissions</h3><button className="slink" onClick={loadMySubs}>Refresh</button></div>
      <div className="submissions-list">
        {mySubs.length === 0 && <p className="empty">No submissions yet.</p>}
        {mySubs.map(s => (
          <div key={s.id} className="sub-item">
            <div className="sub-art" style={{ background: `linear-gradient(135deg,${s.hue}66,${s.hue}22)` }}>{(s.title || "?")[0]}</div>
            <div className="sub-info">
              <p className="sub-title">{s.title}</p>
              <p className="sub-artist">{s.artist}</p>
              {s.admin_note && <p className="sub-note">Admin: {s.admin_note}</p>}
            </div>
            <span className={`sub-status ${s.is_approved ? "approved" : s.status || "pending"}`}>
              {s.is_approved ? "✓ Approved" : "⏳ Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="vc">
      <h2 className="vtitle">⭐ Admin Panel</h2>
      <p className="vsub">Review user submissions — approve to make them public, reject to decline.</p>
      <div className="admin-section">
        <p className="admin-section-title">⏳ Pending Submissions ({pendingSubs.length})</p>
        {pendingSubs.length === 0 && <p className="empty">No pending submissions — you're all caught up!</p>}
        {pendingSubs.map(s => (
          <div key={s.id} className="pending-card">
            <div className="pc-top">
              <div className="pc-art" style={{ background: `linear-gradient(135deg,${s.hue},${s.hue}66)` }}>{(s.title || "?")[0]}</div>
              <div className="pc-info">
                <p className="pc-title">{s.title}</p>
                <p className="pc-meta">{s.artist} · {s.genre} · {s.year}</p>
                <p className="pc-submitter">Submitted by <strong>{s.submitted_by}</strong></p>
              </div>
              <div className="pc-actions">
                <button className={`pc-play${previewId === s.id ? " playing" : ""}`} onClick={() => {
                  if (previewId === s.id) { audioRef.current.pause(); setPreviewId(null); }
                  else { audioRef.current.pause(); audioRef.current.src = s.audio_url; audioRef.current.play().catch(() => {}); setPreviewId(s.id); }
                }}>{previewId === s.id ? "⏸" : "▶"}</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="note-inp" placeholder="Note to user (optional)…" value={adminNote[s.id] || ""} onChange={e => setAdminNote(p => ({ ...p, [s.id]: e.target.value }))} />
              <button className="approve-btn" onClick={() => approveSub(s)}>✓ Approve</button>
              <button className="reject-btn" onClick={() => rejectSub(s)}>✕ Reject</button>
              <button style={{ fontSize: 12, color: "var(--t3)", padding: "6px 8px" }} onClick={() => deleteSub(s)}>🗑</button>
            </div>
          </div>
        ))}
        <button className="slink" style={{ marginTop: 8, display: "block" }} onClick={loadPending}>↻ Refresh</button>
      </div>
      <div className="sh"><h3 className="stitle">All Approved Songs ({songs.length})</h3></div>
      <div className="sl">{songs.map((s, i) => <SongRow key={s.id} s={s} idx={i} />)}</div>
    </div>
  );

  const renderProfile = () => {
    const myMarks = soundmarks.filter(sm => sm.username === user.username);
    return (
      <div className="vc">
        <div className="prfhdr">
          <div className="prfemo">{user.avatar}</div>
          <div>
            <p className="prfname">{user.username}{user.is_admin && <span className="admin-badge">⭐ ADMIN</span>}</p>
            <p className="prfbio">{user.bio}</p>
            <div className="stats">
              <div className="st"><span className="stv">{likedSongs.length}</span><span className="stl">Liked</span></div>
              <div className="st"><span className="stv">{myMarks.length}</span><span className="stl">Soundmarks</span></div>
              <div className="st"><span className="stv">{mySubs.length}</span><span className="stl">Submissions</span></div>
            </div>
          </div>
        </div>
        <div className="sh"><h3 className="stitle">My Soundmarks 📍</h3></div>
        <div className="sml">
          {myMarks.length === 0 && <p className="empty">No soundmarks yet — click 📍 while listening!</p>}
          {myMarks.map(sm => { const s = songs.find(x => x.id === sm.song_id); return (
            <div key={sm.id} className="smi" onClick={() => s && playSong(s)}>
              <div className="smd" style={{ background: s?.hue || "var(--ac)" }} />
              <div><p className="smt">{sm.note}</p><p className="smm">{s?.title} · at {fT(sm.ts_sec)}</p></div>
            </div>
          ); })}
        </div>
        <button className="lout" onClick={() => { audioRef.current.pause(); setUser(null); store.del("nw_user"); }}>Sign Out</button>
      </div>
    );
  };

  const renderNPModal = () => {
    if (!song) return null;
    return (
      <div className="mo" onClick={() => setShowNP(false)}>
        <div className="npm" onClick={e => e.stopPropagation()}>
          <button className="mc" onClick={() => setShowNP(false)}>✕</button>
          <div className="np-art" style={{ background: `linear-gradient(135deg,${song.hue},${song.hue}66)` }}>
            <span className="np-let">{(song.title || "?")[0]}</span>
            {playing && <div className="np-wv"><span /><span /><span /><span /><span /></div>}
          </div>
          <p className="np-tit">{song.title}</p>
          <p className="np-art2">{song.artist}{song.album ? ` · ${song.album}` : ""}</p>
          <p className="np-meta">{song.genre}{song.year ? ` · ${song.year}` : ""}{song.submitted_by ? ` · uploaded by ${song.submitted_by}` : ""}</p>
          <p className="np-sts">▶ {fN(song.plays || 0)} plays</p>
          <div style={{ marginBottom: 16 }}>
            <div className="np-ts"><span>{fT(Math.floor(prog))}</span><span>{fT(Math.floor(dur || song.duration || 0))}</span></div>
            <div className="np-pb" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * 100); }}>
              <div className="np-pf" style={{ width: `${progPct}%`, background: song.hue }} />
              {dur > 0 && songMarks.map(sm => (
                <div key={sm.id} className="smdot" style={{ left: `${(sm.ts_sec / dur) * 100}%`, background: song.hue }}
                  onClick={e => { e.stopPropagation(); audioRef.current.currentTime = sm.ts_sec; setProg(sm.ts_sec); }} />
              ))}
            </div>
          </div>
          <div className="smhdr">
            <h3>Soundmarks 📍</h3>
            <button className="amb" onClick={() => setShowNote(!showNote)}>+ Note at {fT(Math.floor(prog))}</button>
          </div>
          {showNote && (<div className="nir"><input className="ni2" placeholder="What's on your mind?" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === "Enter" && addSoundmark()} autoFocus /><button className="ns" onClick={addSoundmark}>Post</button></div>)}
          <div className="mlist">
            {songMarks.length === 0 && <p className="memp">No soundmarks yet — be the first!</p>}
            {[...songMarks].sort((a, b) => a.ts_sec - b.ts_sec).map(sm => (
              <div key={sm.id} className="mi" onClick={() => { audioRef.current.currentTime = sm.ts_sec; setProg(sm.ts_sec); }}>
                <div className="midk" style={{ background: song.hue }} />
                <div style={{ flex: 1 }}>
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

  /* ─────────── SETUP SCREEN ─────────── */
  if (!ready) return (
    <>
      <style>{CSS}</style>
      <div className="setup-screen">
        <div className="orbs"><div className="orb o1" /><div className="orb o2" /><div className="orb o3" /></div>
        <div className="setup-card">
          <div className="auth-logo" style={{ marginBottom: 12 }}><span className="logo-icon">◎</span><span className="logo-text">NOVAWAVE</span></div>
          <h2>Connect to Your Music Server</h2>
          <p>Enter your Supabase credentials. This is a one-time setup — users will never see this screen. For production, set these as environment variables instead.</p>
          <input className="setup-inp" placeholder="Supabase Project URL (https://xyz.supabase.co)" value={cfgForm.url} onChange={e => setCfgForm(p => ({ ...p, url: e.target.value }))} />
          <input className="setup-inp" placeholder="Supabase Anon / Public API Key" value={cfgForm.key} onChange={e => setCfgForm(p => ({ ...p, key: e.target.value }))} onKeyDown={e => e.key === "Enter" && saveConfig()} />
          <button className="setup-btn" onClick={saveConfig}>Connect & Launch →</button>
          <p className="setup-note">For GitHub Pages deployment: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file instead.</p>
        </div>
      </div>
    </>
  );

  /* ─────────── AUTH SCREEN ─────────── */
  if (!user) return (
    <>
      <style>{CSS}</style>
      <div className="auth-bg">
        <div className="orbs"><div className="orb o1" /><div className="orb o2" /><div className="orb o3" /></div>
        <div className="auth-card">
          <div className="auth-logo"><span className="logo-icon">◎</span><span className="logo-text">NOVAWAVE</span></div>
          <p className="auth-tag">music · notes · moments</p>
          <div className="atabs">
            <button className={`atab${authMode === "login" ? " on" : ""}`} onClick={() => setAuthMode("login")}>Sign In</button>
            <button className={`atab${authMode === "signup" ? " on" : ""}`} onClick={() => setAuthMode("signup")}>Create Account</button>
          </div>
          <input className="ai" placeholder="Username" value={af.username} onChange={e => setAf(p => ({ ...p, username: e.target.value }))} />
          {authMode === "signup" && <input className="ai" placeholder="Email (optional)" value={af.email} onChange={e => setAf(p => ({ ...p, email: e.target.value }))} />}
          <input className="ai" type="password" placeholder="Password" value={af.password} onChange={e => setAf(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && doAuth()} />
          {authMode === "signup" && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: "var(--t3)", marginBottom: 6 }}>PICK AN AVATAR</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["🎵","🎶","🌌","🎹","🌊","🔥","✨","🎸","🌙","🎺","🎻","🥁"].map(e => (
                  <button key={e} onClick={() => setAf(p => ({ ...p, avatar: e }))} style={{ fontSize: 22, padding: 4, borderRadius: 8, background: af.avatar === e ? "var(--ac)" : "var(--s2)", border: "1px solid var(--br)", transition: "all .15s" }}>{e}</button>
                ))}
              </div>
            </div>
          )}
          {aerr && <p className="aerr">{aerr}</p>}
          <button className="abtn" onClick={doAuth} disabled={authBusy}>
            {authBusy ? <><div className="spin-sm" />{authMode === "login" ? "Signing in…" : "Creating account…"}</> : authMode === "login" ? "Enter the Wave ▶" : "Join NovaWave ✦"}
          </button>
        </div>
      </div>
    </>
  );

  /* ─────────── MAIN APP ─────────── */
  const renderView = () => {
    if (query.trim()) return (
      <div className="vc"><h2 className="vtitle">Results for "{query}"</h2>
        {searchResults.length === 0 ? <p className="empty">No matches.</p> : <div className="sl">{searchResults.map((s, i) => <SongRow key={s.id} s={s} idx={i} />)}</div>}
      </div>
    );
    switch (view) {
      case "home": return renderHome();
      case "discover": return renderDiscover();
      case "library": return renderLibrary();
      case "playlist": return renderPlaylist();
      case "submit": return renderSubmit();
      case "admin": return user.is_admin ? renderAdmin() : renderHome();
      case "profile": return renderProfile();
      default: return renderHome();
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="app-body">
          {/* SIDEBAR */}
          <aside className="sb">
            <div className="sb-logo" onClick={() => { setView("home"); setQuery(""); }}><span className="logo-icon">◎</span><span className="logo-text">NOVAWAVE</span></div>
            <nav className="sb-nav">
              {[
                { id: "home", ic: "⌂", lb: "Home" },
                { id: "discover", ic: "✦", lb: "Discover" },
                { id: "library", ic: "▤", lb: "Library" },
                { id: "submit", ic: "↑", lb: "Submit Music" },
                ...(user.is_admin ? [{ id: "admin", ic: "⭐", lb: "Admin", badge: pendingSubs.length }] : []),
                { id: "profile", ic: "◉", lb: "Profile" },
              ].map(it => (
                <button key={it.id} className={`ni${view === it.id && !query ? " on" : ""}`} onClick={() => { setView(it.id); setQuery(""); }}>
                  <span className="nic">{it.ic}</span><span>{it.lb}</span>
                  {it.badge > 0 && <span className="ni-badge">{it.badge}</span>}
                </button>
              ))}
            </nav>
            <div className="sb-pls">
              <div className="spt"><span>Playlists</span><button className="sb-add" onClick={() => setShowCPL(true)}>+</button></div>
              {userPls.map(pl => <button key={pl.id} className="sp-i" onClick={() => { setSelPl(pl); setView("playlist"); setQuery(""); }}><span>{pl.cover}</span><span className="sp-n">{pl.name}</span></button>)}
            </div>
            <div className="sb-user" onClick={() => { setView("profile"); setQuery(""); }}>
              <span className="sb-emo">{user.avatar}</span>
              <div className="sb-ui">
                <span className="sb-un">{user.username}{user.is_admin && <span className="admin-badge">⭐</span>}</span>
                <span className="sb-st">Online</span>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <div className="main">
            <div className="topbar">
              <div className="sw">
                <span className="si-ic">⌕</span>
                <input className="si" placeholder="Search songs, artists, genres…" value={query} onChange={e => setQuery(e.target.value)} />
                {query && <button className="sc" onClick={() => setQuery("")}>✕</button>}
              </div>
            </div>
            <div className="content">{renderView()}</div>
          </div>

          {/* CHAT */}
          <aside className="cp" style={{ width: chatOpen ? 270 : 0 }}>
            {chatOpen && (
              <>
                <div className="cphdr">
                  <h3>Friends</h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {song && playing && <div className="lb"><div className="lbd" /><span className="lbt">Live</span></div>}
                    <button className="cpbtn" onClick={() => setChatOpen(false)}>✕</button>
                  </div>
                </div>
                {!openChat ? (
                  <div className="fl">
                    <div style={{ padding: "8px 12px", color: "var(--t3)", fontSize: 12 }}>Friends feature coming soon — invite friends to join!</div>
                    {song && <div style={{ margin: "8px 6px 0" }}>
                      <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--t3)", marginBottom: 6 }}>Now Playing</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, background: "var(--s2)", borderRadius: 9, border: "1px solid var(--br)" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: song.hue, flexShrink: 0 }} />
                        <div><p style={{ fontSize: 11, fontWeight: 600 }}>{song.title}</p><p style={{ fontSize: 10, color: "var(--t3)" }}>{song.artist}</p></div>
                      </div>
                    </div>}
                  </div>
                ) : (
                  <div className="cw">
                    <div className="cwhdr"><button className="bsm" onClick={() => setOpenChat(null)}>←</button><span className="cfn">{openChat}</span></div>
                    <div className="ma">
                      {(msgs[openChat] || []).map(m => <div key={m.id} className={`msg${m.from === user.username ? " me" : " them"}`}><div className="mbx">{m.text}</div><span className="mt">{m.time}</span></div>)}
                      <div ref={chatEndRef} />
                    </div>
                    {song && <div className="cnp"><div className="cnpd" style={{ background: song.hue }} /><span>♪ {song.title}</span></div>}
                    <div className="cir">
                      <input className="ci" placeholder="Message…" value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg(openChat)} />
                      <button className="csb" onClick={() => sendMsg(openChat)}>↑</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>

        {/* PLAYER */}
        <div className="pb">
          {song ? (
            <>
              <div className="psi" onClick={() => setShowNP(true)}>
                <div className="pa" style={{ background: `linear-gradient(135deg,${song.hue},${song.hue}66)` }}>
                  {(song.title || "?")[0]}
                  {playing && <div className="paw"><span /><span /><span /></div>}
                </div>
                <div className="pst"><span className="ptit">{song.title}</span><span className="part2">{song.artist}</span></div>
                <button className={`plk${likedSongs.includes(song.id) ? " lk" : ""}`} onClick={e => { e.stopPropagation(); toggleLike(song.id); }}>{likedSongs.includes(song.id) ? "♥" : "♡"}</button>
              </div>
              <div className="pc2">
                <div className="pctrl">
                  <button className={`cb${shuffled ? " on" : ""}`} onClick={() => setShuffled(!shuffled)}>⇄</button>
                  <button className="cb cbm" onClick={prevSong}>⏮</button>
                  <button className="cbp" onClick={togglePlay}>{playing ? "⏸" : "▶"}</button>
                  <button className="cb cbm" onClick={nextSong}>⏭</button>
                  <button className={`cb${looped ? " on" : ""}`} onClick={() => setLooped(!looped)}>↻</button>
                </div>
                <div className="pr">
                  <span className="tl">{fT(Math.floor(prog))}</span>
                  <div className="pt" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * 100); }}>
                    <div className="pf" style={{ width: `${progPct}%`, background: song.hue }} />
                    {dur > 0 && songMarks.map(sm => <div key={sm.id} className="pm-dot" style={{ left: `${(sm.ts_sec / dur) * 100}%` }} />)}
                  </div>
                  <span className="tl">{fT(Math.floor(dur || song.duration || 0))}</span>
                </div>
              </div>
              <div className="prgt">
                <button className="cb" style={{ fontSize: 14 }} onClick={() => setShowNP(true)}>📍</button>
                <span className="vol-ic">🔊</span>
                <input type="range" className="vol-sl" min="0" max="1" step="0.01" value={vol} onChange={e => setVol(parseFloat(e.target.value))} />
                {!chatOpen && <button className="cpbtn" onClick={() => setChatOpen(true)}>💬</button>}
              </div>
            </>
          ) : (
            <div className="pe">
              <span style={{ fontSize: 13, color: "var(--t3)" }}>No track playing</span>
              {songs.length > 0 && <button className="pe-btn" onClick={() => playSong(songs[0])}>▶ Play something</button>}
              {!chatOpen && <button className="cpbtn" style={{ marginLeft: "auto" }} onClick={() => setChatOpen(true)}>💬</button>}
            </div>
          )}
        </div>

        {/* MODALS */}
        {showNP && renderNPModal()}
        {showCPL && (
          <div className="mo" onClick={() => setShowCPL(false)}>
            <div className="cpm" onClick={e => e.stopPropagation()}>
              <h3>New Playlist</h3>
              <input className="mi3" placeholder="Give it a name…" value={cplName} onChange={e => setCplName(e.target.value)} onKeyDown={e => e.key === "Enter" && createPl()} autoFocus />
              <div className="ma2"><button className="mcan" onClick={() => setShowCPL(false)}>Cancel</button><button className="mcon" onClick={createPl}>Create ✦</button></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
