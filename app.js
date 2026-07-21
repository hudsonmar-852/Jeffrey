(() => {
  'use strict';

  const APP_VERSION = '3.4.0';
  const BASE_DATA_URLS = ['today.json', 'data/today.json', './data/today.json'];
  const STATE = { data: null, current: 'all', query: '', source: null };
  const ORDER = ['all','aios_best','daily_special','jeffrey_today','weather','busy_office','fitness_lifestyle','healthy_lifestyle','recovery','senior_safe','long_time_no_see','favourite','archive'];
  const LABELS = {all:'全部',aios_best:'✨ AIOS 精選',daily_special:'⭐ 今日精選',jeffrey_today:'☕ Jeffrey Today',weather:'🌦 天氣背景',busy_office:'💼 上班族',fitness_lifestyle:'🔥 Keep Fit',healthy_lifestyle:'🥗 健康生活',recovery:'🧘 Recovery',senior_safe:'👴 銀髮安全',long_time_no_see:'🫶 久未聯絡',favourite:'❤️ Favourite',archive:'📚 Archive'};
  const $ = id => document.getElementById(id);
  const parse = (v, f) => { try { return JSON.parse(v); } catch { return f; } };
  const get = (k, f) => { try { const v = localStorage.getItem(k); return v ? parse(v, f) : f; } catch { return f; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function hkDate() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  function flatten(d) {
    const a = [];
    (d.dailySpecial || []).forEach(m => a.push({...m, category:'daily_special', daily:String(m.id || '').includes((d.date || '').replaceAll('-',''))}));
    (d.jeffreyToday || []).forEach(m => a.push({...m, category:'jeffrey_today', daily:String(m.id || '').includes((d.date || '').replaceAll('-',''))}));
    Object.entries(d.groups || {}).forEach(([c, x]) => (x || []).forEach(m => a.push({...m, category:c, daily:String(m.id || '').includes((d.date || '').replaceAll('-',''))})));
    (d.weatherMessages || []).forEach(m => a.push({...m, category:'weather', daily:String(m.id || '').includes((d.date || '').replaceAll('-',''))}));
    (d.archive || []).forEach(m => a.push({...m, category:'archive'}));
    return a;
  }

  function valid(d) {
    if (!d || typeof d !== 'object') throw new Error('Invalid JSON');
    if (!flatten(d).length) throw new Error('No reminder content');
    return d;
  }

  async function fetchJson(path) {
    const url = new URL(path, document.baseURI);
    url.searchParams.set('v', Date.now());
    const r = await fetch(url.href, { cache:'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
    return valid(await r.json());
  }

  function mergeDaily(overlay, base) {
    const groups = {...(base.groups || {})};
    for (const [name, items] of Object.entries(overlay.groups || {})) {
      groups[name] = [...items, ...(groups[name] || [])];
    }
    return {
      ...base,
      ...overlay,
      dailySpecial: [...(overlay.dailySpecial || []), ...(base.dailySpecial || [])],
      jeffreyToday: [...(overlay.jeffreyToday || []), ...(base.jeffreyToday || [])],
      weatherMessages: [...(overlay.weatherMessages || []), ...(base.weatherMessages || [])],
      groups,
      archive: base.archive || []
    };
  }

  async function load() {
    let base, basePath, err;
    for (const path of BASE_DATA_URLS) {
      try { base = await fetchJson(path); basePath = path; break; } catch (e) { err = e; }
    }
    if (!base) {
      const cached = get('jeffreyLastGoodData', null);
      if (cached?.data) { STATE.source = 'local-cache'; return valid(cached.data); }
      throw err || new Error('Unable to load base data');
    }

    const date = hkDate();
    const overlayPaths = [`data/daily-${date}.json`, `./data/daily-${date}.json`];
    let overlay = null;
    for (const path of overlayPaths) {
      try { overlay = await fetchJson(path); break; } catch {}
    }

    const data = overlay ? mergeDaily(overlay, base) : base;
    STATE.source = overlay ? `${basePath} + daily-${date}` : basePath;
    set('jeffreyLastGoodData', { savedAt:new Date().toISOString(), data });
    return data;
  }

  function key(m) { return m.id || `${m.category}|${m.topic}|${m.content}`; }
  function status(cls, text) { const e=$('engineStatus'); if(e){ e.className=`engine-status ${cls}`; e.textContent=text; } }
  function brief() {
    const d=STATE.data,w=d.weatherContext||{},s=d.styleCatalogue||{};
    const quality=s.name ? `${s.name} · ${s.singlePurpose?'單一重點':'標準模式'}` : 'AIOS 基礎質檢模式';
    $('dailyBrief').innerHTML=`<div class="brief-grid"><div class="brief-card"><h3>今日主題</h3><p>${esc(d.theme||'今日保持穩定節奏')}</p></div><div class="brief-card"><h3>香港生活脈搏</h3><p>${esc(d.lifePulse||'暫未提供')}</p></div><div class="brief-card"><h3>天氣背景</h3><p>${esc(w.summary||'天氣只作背景資訊')}</p></div><div class="brief-card"><h3>AIOS 狀態</h3><p>${esc(quality)}<br>${esc(STATE.source||'資料來源載入中')}</p></div></div>`;
  }
  function tabs() { const t=$('tabs'); t.innerHTML=''; ORDER.forEach(c=>{ const b=document.createElement('button'); b.className='tab'+(STATE.current===c?' active':''); b.textContent=LABELS[c]||c; b.onclick=()=>{STATE.current=c;tabs();cards();}; t.appendChild(b); }); }
  function selected() {
    const fav=get('jeffreyFavourites',{});
    let a;
    if (STATE.current==='favourite') {
      a=Object.values(fav).map(m=>({...m,category:'favourite',fav:true}));
    } else if (STATE.current==='aios_best') {
      a=flatten(STATE.data)
        .filter(m=>m.category!=='archive' && Number(m.humanScore||0)>=98)
        .sort((x,y)=>(Number(y.daily)-Number(x.daily)) || (Number(y.humanScore||0)-Number(x.humanScore||0)))
        .slice(0,30);
    } else {
      a=flatten(STATE.data).filter(m=>STATE.current==='all'?m.category!=='archive':m.category===STATE.current);
    }
    const q=STATE.query.trim().toLowerCase();
    return q?a.filter(m=>`${m.topic||''} ${m.content||''}`.toLowerCase().includes(q)):a;
  }
  function stats(n) { $('totalCount').textContent=flatten(STATE.data||{}).length; $('visibleCount').textContent=n; $('copiedCount').textContent=Object.keys(get('jeffreyUsage',{})).length; $('favouriteCount').textContent=Object.keys(get('jeffreyFavourites',{})).length; }

  function cards() {
    const g=$('messageGrid'),used=get('jeffreyUsage',{}),fav=get('jeffreyFavourites',{}),items=selected();
    g.innerHTML='';
    if(!items.length){g.innerHTML='<div class="empty-state">找不到相符訊息。</div>';stats(0);return;}
    items.slice(0,100).forEach(m=>{
      const k=key(m),f=!!fav[k]||m.fav,u=!!used[k],c=document.createElement('article');
      const score=Number(m.humanScore||0);
      c.className='card'+(m.daily?' daily':'')+(f?' fav':'');
      c.innerHTML=`<div><div class="meta"><span class="pill">${esc(LABELS[m.category]||m.category)}</span>${m.daily?'<span class="pill today">今日新增</span>':''}${score?`<span class="pill score">Human ${score}</span>`:''}</div><div class="topic">${esc(m.topic||'')}</div><div class="content">${esc(m.content||'')}</div>${u?'<div class="usage">已 Copy 過</div>':''}</div><div class="card-actions"><button class="btn" data-copy>📋 Copy</button><button class="btn secondary" data-fav>${f?'❤️ 已收藏':'♡ Favourite'}</button></div>`;
      g.appendChild(c);
      c.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(m.content||'');const s=get('jeffreyUsage',{});s[k]={...m,lastCopied:new Date().toISOString(),count:(s[k]?.count||0)+1};set('jeffreyUsage',s);cards();}catch{alert('未能自動複製，請長按文字手動複製。');}};
      c.querySelector('[data-fav]').onclick=()=>{const s=get('jeffreyFavourites',{});s[k]?delete s[k]:s[k]={...m,savedAt:new Date().toISOString()};set('jeffreyFavourites',s);cards();};
    });
    stats(items.length);
  }

  async function boot() {
    document.documentElement.dataset.theme=get('jeffreyTheme','light');
    $('searchInput').oninput=e=>{STATE.query=e.target.value;cards();};
    $('themeToggle').onclick=()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;set('jeffreyTheme',n);};
    $('randomReminder').onclick=()=>{const a=selected();if(!a.length)return;const m=a[Math.floor(Math.random()*a.length)];STATE.query=m.topic||m.content||'';$('searchInput').value=STATE.query;cards();};
    try {
      STATE.data=await load(); brief(); tabs(); cards();
      status(STATE.source==='local-cache'?'warning-state':'ready-state',STATE.source==='local-cache'?'Offline cache':'Engine online');
      $('versionInfo').textContent=`Jeffrey Reminder Engine v${APP_VERSION} · Data ${STATE.data.date||'unknown'} · ${STATE.source}`;
    } catch(e) {
      console.error(e); status('error-state','Engine error');
      $('dailyBrief').innerHTML=`<div class="error-panel"><strong>今日內容載入失敗</strong><p>${esc(e.message||'Unknown error')}</p><button class="btn retry">重新載入</button></div>`;
      $('dailyBrief').querySelector('.retry').onclick=()=>location.reload();
      $('messageGrid').innerHTML='<div class="empty-state">未能讀取提醒資料。</div>'; stats(0);
    }
  }

  window.addEventListener('DOMContentLoaded', boot);
})();