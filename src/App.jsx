import { useState } from 'react'
import { store } from './utils/helpers.js'
import SetupScreen from './components/SetupScreen.jsx'
import PrepScreen from './components/PrepScreen.jsx'
import InterviewScreen from './components/InterviewScreen.jsx'
import ApiKeyManager from './components/ApiKeyManager.jsx'
import DonateModal from './components/DonateModal.jsx'

// ─── SVG Icon set ──────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.7 }) => {
  const s = { display:'inline-block', flexShrink:0 }
  const p = { fill:'none', stroke:color, strokeWidth, strokeLinecap:'round', strokeLinejoin:'round' }
  const paths = {
    user:      <><circle cx="12" cy="8" r="4" {...p}/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" {...p}/></>,
    list:      <><rect x="4" y="4" width="16" height="16" rx="3" {...p}/><path d="M8 9h8M8 12h6M8 15h4" {...p}/></>,
    mic:       <><rect x="9" y="2" width="6" height="11" rx="3" {...p}/><path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" {...p}/></>,
    key:       <><circle cx="8" cy="14" r="4" {...p}/><path d="M12 14h9M18 14v3" {...p}/></>,
    coffee:    <><path d="M6 2h12l-2 14H8L6 2z" {...p}/><path d="M18 6h2a2 2 0 010 4h-2M3 22h18" {...p}/></>,
    settings:  <><circle cx="12" cy="12" r="3" {...p}/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...p}/></>,
    check:     <><polyline points="20 6 9 17 4 12" {...p}/></>,
    warning:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" {...p}/><line x1="12" y1="9" x2="12" y2="13" {...p}/><line x1="12" y1="17" x2="12.01" y2="17" {...p}/></>,
    arrow_r:   <><line x1="5" y1="12" x2="19" y2="12" {...p}/><polyline points="12 5 19 12 12 19" {...p}/></>,
    refresh:   <><polyline points="23 4 23 10 17 10" {...p}/><polyline points="1 20 1 14 7 14" {...p}/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" {...p}/></>,
    chevron_r: <><polyline points="9 18 15 12 9 6" {...p}/></>,
    clip:      <><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" {...p}/></>,
    lightbulb: <><path d="M9 21h6M12 3a6 6 0 016 6c0 2.22-1.2 4.16-3 5.2V17H9v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 016-6z" {...p}/></>,
    chat:      <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" {...p}/></>,
    link:      <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" {...p}/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" {...p}/></>,
    file:      <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" {...p}/><polyline points="14 2 14 8 20 8" {...p}/></>,
    upload:    <><polyline points="16 16 12 12 8 16" {...p}/><line x1="12" y1="12" x2="12" y2="21" {...p}/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" {...p}/></>,
    trash:     <><polyline points="3 6 5 6 21 6" {...p}/><path d="M19 6l-1 14H6L5 6" {...p}/><path d="M10 11v6M14 11v6M9 6V4h6v2" {...p}/></>,
    speaker:   <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" {...p}/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" {...p}/></>,
    speakerx:  <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" {...p}/><line x1="23" y1="9" x2="17" y2="15" {...p}/><line x1="17" y1="9" x2="23" y2="15" {...p}/></>,
    x:         <><line x1="18" y1="6" x2="6" y2="18" {...p}/><line x1="6" y1="6" x2="18" y2="18" {...p}/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19" {...p}/><line x1="5" y1="12" x2="19" y2="12" {...p}/></>,
    eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...p}/><circle cx="12" cy="12" r="3" {...p}/></>,
    eye_off:   <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" {...p}/></>,
    send:      <><line x1="22" y1="2" x2="11" y2="13" {...p}/><polygon points="22 2 15 22 11 13 2 9 22 2" {...p}/></>,
    circle_ok: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" {...p}/><polyline points="22 4 12 14.01 9 11.01" {...p}/></>,
  }
  return (
    <svg style={s} width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {paths[name]}
    </svg>
  )
}

export { Icon }

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]           = useState('setup')
  const [profile, setProfile]         = useState(store.get('ic3_profile', {}))
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [showKeyMgr, setShowKeyMgr]   = useState(false)
  const [showNavChoice, setShowNavChoice] = useState(false)
  const [showDonate, setShowDonate]   = useState(false)
  const [apiKeys, setApiKeys]         = useState(() => store.get('ic3_keys', []))
  const [activeKey, setActiveKey]     = useState(() => store.get('ic3_active', null))

  const saveKeys   = ks => { setApiKeys(ks); store.set('ic3_keys', ks) }
  const saveActive = k  => { setActiveKey(k); store.set('ic3_active', k) }
  const addKey     = k  => { const u=[...apiKeys,k]; saveKeys(u); if(!activeKey) saveActive(k) }
  const removeKey  = id => { const u=apiKeys.filter(k=>k.id!==id); saveKeys(u); if(activeKey?.id===id) saveActive(u[0]||null) }

  const handleStart = (p) => {
    setProfile(p)
    store.set('ic3_profile', p)
    if (!activeKey) { setShowKeyMgr(true); return }
    setShowNavChoice(true)
  }

  const goTo = (dest) => { setShowNavChoice(false); setScreen(dest) }

  const NAV = [
    { id:'setup',     icon:'settings', label:'Profil' },
    { id:'prep',      icon:'list',     label:'Prediksi' },
    { id:'interview', icon:'mic',      label:'Wawancara' },
  ]

  return (
    <div style={appWrap}>

      {/* ── Top bar ── */}
      <header style={topBar}>
        {/* Logo */}
        <div style={logo}>
          <img
            src="/img/logo/logo_v2.svg"
            alt="Interview.AI logo"
            style={{ width:22, height:22, flexShrink:0 }}
          />
          <span style={logoText}>Interview<span style={{ color:'var(--amber)' }}>.AI</span></span>
        </div>

        {/* Desktop tabs */}
        <nav style={desktopTabs} className="desktop-nav">
          {NAV.map(({ id, icon, label }) => {
            const idx      = NAV.findIndex(n => n.id === id)
            const curIdx   = NAV.findIndex(n => n.id === screen)
            const isActive = screen === id
            const isDone   = idx < curIdx
            const disabled = (id==='prep' || id==='interview') && !profile?.name
            return (
              <button key={id} style={desktopTab(isActive, isDone)} disabled={disabled}
                onClick={() => !disabled && setScreen(id)}>
                <Icon name={isDone ? 'check' : icon} size={14}
                  color={isActive ? 'var(--amber)' : isDone ? 'var(--green)' : 'var(--text3)'} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Right actions */}
        <div style={topActions}>
          <button style={iconBtn} onClick={() => setShowDonate(true)} title="Donasi">
            <Icon name="coffee" size={17} color="var(--amber)" />
            <span className="btn-label"> Donasi</span>
          </button>
          <button style={iconBtn2(!!activeKey)} onClick={() => setShowKeyMgr(true)} title="API Key">
            <Icon name="key" size={17} color={activeKey ? 'var(--amber)' : 'var(--red)'} />
            <span className="btn-label"> {activeKey ? activeKey.label : 'API Key'}</span>
            {!activeKey && <span style={keyAlert}>!</span>}
          </button>
        </div>
      </header>

      {/* ── Screen content ── */}
      <main style={mainContent}>
        {screen === 'setup' && (
          <SetupScreen
            initial={profile} uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles} onStart={handleStart}
          />
        )}
        {screen === 'prep' && activeKey && (
          <PrepScreen
            profile={profile} apiKey={activeKey.key}
            uploadedFiles={uploadedFiles}
            onStartInterview={() => setScreen('interview')}
            onBack={() => setScreen('setup')}
          />
        )}
        {screen === 'interview' && activeKey && (
          <InterviewScreen
            profile={profile} uploadedFiles={uploadedFiles}
            apiKey={activeKey.key} onBack={() => setScreen('prep')}
          />
        )}
        {!activeKey && screen !== 'setup' && (
          <div style={noKeyWarn}>
            <Icon name="key" size={40} color="var(--text3)" />
            <div style={{ fontWeight:700,fontSize:16,marginBottom:6,marginTop:14 }}>API Key belum diset</div>
            <div style={{ fontSize:13,color:'var(--text2)',marginBottom:20 }}>
              Tambahkan API key Gemini atau OpenRouter untuk menggunakan fitur ini
            </div>
            <button style={warnBtn} onClick={() => setShowKeyMgr(true)}>
              <Icon name="plus" size={15} color="#1a0f00" /> Tambah API Key
            </button>
          </div>
        )}
      </main>

      {/* ── Bottom nav — mobile only ── */}
      <nav style={bottomNav} className="mobile-nav">
        {NAV.map(({ id, icon, label }) => {
          const idx      = NAV.findIndex(n => n.id === id)
          const curIdx   = NAV.findIndex(n => n.id === screen)
          const isActive = screen === id
          const isDone   = idx < curIdx
          const disabled = (id==='prep' || id==='interview') && !profile?.name
          return (
            <button key={id} style={bottomTab(isActive, disabled)}
              disabled={disabled}
              onClick={() => !disabled && setScreen(id)}>
              <div style={bottomTabIcon(isActive, isDone)}>
                <Icon
                  name={isDone ? 'check' : icon}
                  size={20}
                  color={isActive ? 'var(--amber)' : isDone ? 'var(--green)' : disabled ? 'var(--text3)' : 'var(--text2)'}
                />
                {isActive && <div style={activeIndicator} />}
              </div>
              <span style={{ fontSize:10.5, color: isActive ? 'var(--amber)' : isDone ? 'var(--green)' : disabled ? 'var(--text3)' : 'var(--text2)', marginTop:3, fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* ── Nav choice modal ── */}
      {showNavChoice && (
        <div style={overlay} onClick={() => setShowNavChoice(false)}>
          <div style={choiceModal} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
              <Icon name="circle_ok" size={16} color="var(--amber)" />
              <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--amber)' }}>Profil disimpan</span>
            </div>
            <div style={{ fontWeight:700,fontSize:17,color:'var(--text)',marginBottom:4 }}>Mau ke mana dulu?</div>
            <div style={{ fontSize:13,color:'var(--text3)',marginBottom:20 }}>Pilih sesuai kebutuhanmu</div>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <button style={choiceBtn('amber')} onClick={() => goTo('prep')}>
                <Icon name="list" size={22} color="var(--amber)" />
                <div>
                  <div style={{ fontWeight:600,fontSize:14 }}>Lihat Prediksi Pertanyaan</div>
                  <div style={{ fontSize:12,opacity:.7,marginTop:2 }}>AI prediksi pertanyaan + tips & contoh jawaban</div>
                </div>
              </button>
              <button style={choiceBtn('green')} onClick={() => goTo('interview')}>
                <Icon name="mic" size={22} color="var(--green)" />
                <div>
                  <div style={{ fontWeight:600,fontSize:14 }}>Langsung Wawancara</div>
                  <div style={{ fontSize:12,opacity:.7,marginTop:2 }}>Latihan wawancara sekarang, dapat feedback real-time</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showKeyMgr && (
        <ApiKeyManager
          keys={apiKeys} activeKey={activeKey}
          onAdd={addKey} onRemove={removeKey} onSetActive={saveActive}
          onClose={() => { setShowKeyMgr(false); if (activeKey && profile?.name) setShowNavChoice(true) }}
        />
      )}
      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-7px);opacity:1} }
        @keyframes popIn  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
        input::placeholder, textarea::placeholder { color:var(--text3) }
        select option { background:var(--bg) }
        button { transition: opacity .15s, transform .15s }
        button:active { transform:scale(.97) }
        button:hover:not(:disabled) { opacity:.85 }

        @media (min-width: 641px) {
          .mobile-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
          .btn-label { display: inline !important; }
        }
        @media (max-width: 640px) {
          .mobile-nav { display: flex !important; }
          .desktop-nav { display: none !important; }
          .btn-label { display: none !important; }
          main { padding-bottom: 64px; }
        }
        @media (max-width: 640px) {
          input, textarea, select { font-size: 16px !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────
const appWrap     = { height:'100dvh', display:'flex', flexDirection:'column', overflow:'hidden' }
const topBar      = { display:'flex', alignItems:'center', gap:8, padding:'0 12px', height:48, borderBottom:'1px solid var(--border)', background:'rgba(12,12,14,.98)', backdropFilter:'blur(12px)', flexShrink:0, zIndex:10 }
const logo        = { display:'flex', alignItems:'center', gap:8, flexShrink:0 }
const logoText    = { fontFamily:'JetBrains Mono,monospace', fontWeight:500, fontSize:14, color:'var(--text)' }
const desktopTabs = { display:'none', gap:3, flex:1, justifyContent:'center' }
const desktopTab  = (a, d) => ({ display:'flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:20, border:`1px solid ${a?'var(--amber-border)':d?'var(--green-border)':'transparent'}`, background:a?'var(--amber-dim)':d?'rgba(52,211,153,0.07)':'transparent', color:a?'var(--amber)':d?'var(--green)':'var(--text3)', fontSize:12.5, cursor:'pointer', fontFamily:'Space Grotesk,sans-serif', fontWeight:a?600:400, transition:'all .2s', whiteSpace:'nowrap' })
const topActions  = { display:'flex', gap:5, alignItems:'center', marginLeft:'auto', flexShrink:0 }
const iconBtn     = { display:'flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:20, border:'1px solid rgba(245,158,11,0.3)', background:'rgba(245,158,11,0.08)', color:'var(--amber)', fontSize:12, cursor:'pointer', fontFamily:'Space Grotesk,sans-serif', whiteSpace:'nowrap' }
const iconBtn2    = ok => ({ display:'flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:20, border:`1px solid ${ok?'var(--amber-border)':'rgba(248,113,113,0.3)'}`, background:ok?'var(--amber-dim)':'var(--red-dim)', color:ok?'var(--amber)':'var(--red)', fontSize:12, cursor:'pointer', fontFamily:'Space Grotesk,sans-serif', whiteSpace:'nowrap' })
const keyAlert    = { display:'inline-flex', alignItems:'center', justifyContent:'center', width:16, height:16, borderRadius:'50%', background:'var(--red)', color:'#fff', fontSize:10, fontWeight:700, marginLeft:2 }
const mainContent = { flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }
const bottomNav   = { display:'none', position:'fixed', bottom:0, left:0, right:0, height:60, background:'rgba(12,12,14,0.97)', borderTop:'1px solid var(--border)', backdropFilter:'blur(16px)', zIndex:100, alignItems:'stretch' }
const bottomTab   = (a, d) => ({ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'none', background:'transparent', cursor: d?'not-allowed':'pointer', padding:'6px 0 4px', position:'relative' })
const bottomTabIcon = (a, d) => ({ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:40, height:28, borderRadius:12, background: a?'var(--amber-dim)': d?'rgba(52,211,153,0.1)':'transparent', transition:'all .2s' })
const activeIndicator = { position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:'var(--amber)' }
const noKeyWarn   = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', textAlign:'center', padding:24 }
const warnBtn     = { display:'flex', alignItems:'center', gap:7, background:'linear-gradient(135deg,#f59e0b,#d97706)', border:'none', color:'#1a0f00', padding:'11px 24px', borderRadius:50, cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'Space Grotesk,sans-serif' }
const overlay     = { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', zIndex:150, display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeIn .2s ease' }
const choiceModal = { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:20, padding:28, width:'100%', maxWidth:400, animation:'popIn .25s ease' }
const choiceBtn   = c => ({ display:'flex', gap:14, alignItems:'center', padding:'14px 16px', borderRadius:14, border:`1px solid ${c==='amber'?'var(--amber-border)':'var(--green-border)'}`, background:c==='amber'?'var(--amber-dim)':'rgba(52,211,153,0.07)', color:c==='amber'?'var(--amber)':'var(--green)', cursor:'pointer', fontFamily:'Space Grotesk,sans-serif', textAlign:'left', width:'100%' })
