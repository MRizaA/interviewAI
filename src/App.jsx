import { useState } from 'react'
import { store } from './utils/helpers.js'
import SetupScreen from './components/SetupScreen.jsx'
import PrepScreen from './components/PrepScreen.jsx'
import InterviewScreen from './components/InterviewScreen.jsx'
import ApiKeyManager from './components/ApiKeyManager.jsx'
import DonateModal from './components/DonateModal.jsx'

export default function App() {
  const [screen, setScreen] = useState('setup')
  const [profile, setProfile] = useState(store.get('ic3_profile', {}))
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [showKeyMgr, setShowKeyMgr] = useState(false)
  const [showNavChoice, setShowNavChoice] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [apiKeys, setApiKeys] = useState(() => store.get('ic3_keys', []))
  const [activeKey, setActiveKey] = useState(() => store.get('ic3_active', null))

  const saveKeys = ks => { setApiKeys(ks); store.set('ic3_keys', ks) }
  const saveActive = k => { setActiveKey(k); store.set('ic3_active', k) }
  const addKey = k => { const u=[...apiKeys,k]; saveKeys(u); if(!activeKey) saveActive(k) }
  const removeKey = id => { const u=apiKeys.filter(k=>k.id!==id); saveKeys(u); if(activeKey?.id===id) saveActive(u[0]||null) }

  const handleStart = (p) => {
    setProfile(p)
    store.set('ic3_profile', p)
    if (!activeKey) { setShowKeyMgr(true); return }
    setShowNavChoice(true)
  }

  const goTo = (dest) => { setShowNavChoice(false); setScreen(dest) }

  const SCREENS = ['setup','prep','interview']
  const LABELS = ['⚙️ Profil','📋 Prediksi','🎤 Wawancara']

  return (
    <div style={{ height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden' }}>

      {/* Top bar */}
      <div style={topBar}>
        <div style={logo}>
          <span style={logoDot} />
          <span style={logoText}>Interview<span style={{ color:'var(--amber)' }}>.AI</span></span>
        </div>

        <div style={tabs}>
          {SCREENS.map((s, i) => {
            const isDone = i < SCREENS.indexOf(screen)
            const isActive = screen === s
            const disabled = (s==='prep' && !profile?.name) || (s==='interview' && !profile?.name)
            return (
              <button key={s} style={tab(isActive, isDone)} disabled={disabled}
                onClick={() => { if (!disabled) setScreen(s) }}>
                {LABELS[i]}
              </button>
            )
          })}
        </div>

        <div style={{ display:'flex',gap:6,alignItems:'center' }}>
          {/* Donate button */}
          <button style={donateBtn} onClick={() => setShowDonate(true)}>
            ☕ Donasi
          </button>
          {/* API key button */}
          <button style={keyBtn(!!activeKey)} onClick={() => setShowKeyMgr(true)}>
            🔑 {activeKey ? activeKey.label : 'Set API Key'}
          </button>
        </div>
      </div>

      {/* Screen content */}
      <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
        {screen === 'setup' && (
          <SetupScreen
            initial={profile}
            uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles}
            onStart={handleStart}
          />
        )}

        {screen === 'prep' && activeKey && (
          <PrepScreen
            profile={profile}
            apiKey={activeKey.key}
            uploadedFiles={uploadedFiles}
            onStartInterview={() => setScreen('interview')}
            onBack={() => setScreen('setup')}
          />
        )}

        {screen === 'interview' && activeKey && (
          <InterviewScreen
            profile={profile}
            uploadedFiles={uploadedFiles}
            apiKey={activeKey.key}
            onBack={() => setScreen('prep')}
          />
        )}

        {!activeKey && screen !== 'setup' && (
          <div style={noKeyWarn}>
            <div style={{ fontSize:32,marginBottom:12 }}>🔑</div>
            <div style={{ fontWeight:700,fontSize:16,marginBottom:6 }}>API Key belum diset</div>
            <div style={{ fontSize:13,color:'var(--text2)',marginBottom:20 }}>
              Tambahkan API key (Gemini/OpenRouter/dll) untuk menggunakan fitur ini
            </div>
            <button style={warnBtnStyle} onClick={() => setShowKeyMgr(true)}>+ Tambah API Key</button>
          </div>
        )}
      </div>

      {/* Nav choice modal */}
      {showNavChoice && (
        <div style={overlay} onClick={() => setShowNavChoice(false)}>
          <div style={choiceModal} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:13,color:'var(--amber)',marginBottom:6 }}>Profil disimpan ✓</div>
            <div style={{ fontWeight:700,fontSize:17,color:'var(--text)',marginBottom:6 }}>Mau ke mana dulu?</div>
            <div style={{ fontSize:13,color:'var(--text3)',marginBottom:20 }}>Pilih sesuai kebutuhanmu</div>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <button style={choiceBtn('amber')} onClick={() => goTo('prep')}>
                <div style={{ fontSize:22 }}>📋</div>
                <div>
                  <div style={{ fontWeight:600,fontSize:14 }}>Lihat Prediksi Pertanyaan</div>
                  <div style={{ fontSize:12,opacity:.7,marginTop:2 }}>AI prediksi pertanyaan yang mungkin muncul + tips menjawab</div>
                </div>
              </button>
              <button style={choiceBtn('green')} onClick={() => goTo('interview')}>
                <div style={{ fontSize:22 }}>🎤</div>
                <div>
                  <div style={{ fontWeight:600,fontSize:14 }}>Langsung Wawancara</div>
                  <div style={{ fontSize:12,opacity:.7,marginTop:2 }}>Mulai latihan wawancara sekarang, dapat feedback real-time</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showKeyMgr && (
        <ApiKeyManager
          keys={apiKeys} activeKey={activeKey}
          onAdd={addKey} onRemove={removeKey} onSetActive={saveActive}
          onClose={() => { setShowKeyMgr(false); if (activeKey && profile?.name) setShowNavChoice(true) }}
        />
      )}

      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-7px);opacity:1}}
        input::placeholder,textarea::placeholder{color:var(--text3)}
        select option{background:var(--bg)}
        button{transition:opacity .15s,transform .15s}
        button:hover:not(:disabled){opacity:.85}
      `}</style>
    </div>
  )
}

const topBar = { display:'flex',alignItems:'center',gap:8,padding:'0 12px',height:48,borderBottom:'1px solid var(--border)',background:'rgba(12,12,14,.98)',backdropFilter:'blur(12px)',flexShrink:0 }
const logo = { display:'flex',alignItems:'center',gap:8,flexShrink:0 }
const logoDot = { display:'inline-block',width:8,height:8,borderRadius:'50%',background:'var(--amber)',boxShadow:'0 0 8px var(--amber)',animation:'pulse 2s infinite' }
const logoText = { fontFamily:'JetBrains Mono,monospace',fontWeight:500,fontSize:14,color:'var(--text)' }
const tabs = { display:'flex',gap:3,flex:1,justifyContent:'center' }
const tab = (active, done) => ({ padding:'5px 12px',borderRadius:20,border:`1px solid ${active?'var(--amber-border)':done?'var(--green-border)':'transparent'}`,background:active?'var(--amber-dim)':done?'rgba(52,211,153,0.07)':'transparent',color:active?'var(--amber)':done?'var(--green)':'var(--text3)',fontSize:12,cursor:'pointer',fontFamily:'Space Grotesk,sans-serif',fontWeight:active?600:400,transition:'all .2s' })
const donateBtn = { padding:'5px 12px',borderRadius:20,border:'1px solid rgba(245,158,11,0.3)',background:'rgba(245,158,11,0.08)',color:'var(--amber)',fontSize:11.5,cursor:'pointer',fontFamily:'Space Grotesk,sans-serif',whiteSpace:'nowrap',flexShrink:0 }
const keyBtn = ok => ({ padding:'5px 12px',borderRadius:20,border:`1px solid ${ok?'var(--amber-border)':'rgba(248,113,113,0.3)'}`,background:ok?'var(--amber-dim)':'var(--red-dim)',color:ok?'var(--amber)':'var(--red)',fontSize:11.5,cursor:'pointer',fontFamily:'Space Grotesk,sans-serif',whiteSpace:'nowrap',flexShrink:0 })
const noKeyWarn = { display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',textAlign:'center',padding:24 }
const warnBtnStyle = { background:'linear-gradient(135deg,#f59e0b,#d97706)',border:'none',color:'#1a0f00',padding:'11px 28px',borderRadius:50,cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'Space Grotesk,sans-serif' }
const overlay = { position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',zIndex:150,display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'fadeIn .2s ease' }
const choiceModal = { background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:20,padding:28,width:'100%',maxWidth:400,animation:'fadeUp .2s ease' }
const choiceBtn = c => ({ display:'flex',gap:14,alignItems:'center',padding:'14px 16px',borderRadius:14,border:`1px solid ${c==='amber'?'var(--amber-border)':'var(--green-border)'}`,background:c==='amber'?'var(--amber-dim)':'rgba(52,211,153,0.07)',color:c==='amber'?'var(--amber)':'var(--green)',cursor:'pointer',fontFamily:'Space Grotesk,sans-serif',textAlign:'left',width:'100%' })
