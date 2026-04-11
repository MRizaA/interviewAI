import { useState } from 'react'
import { detectProvider, PROVIDER_INFO, getCFSessionsToday } from '../utils/helpers.js'

const CF_DAILY_LIMIT = 30

// Panduan per provider — lengkap tapi ringkas
const GUIDES = [
  {
    id: 'interviewer',
    name: 'Interviewer AI (built-in)',
    badge: 'Tanpa daftar',
    desc: 'Sudah tersedia langsung, tidak perlu key. Masih dalam pengembangan dan cepat habis karena dipakai bersama semua pengguna. Untuk pengalaman lebih baik, gunakan Gemini.',
    steps: null,
    prefix: null,
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    badge: 'Gratis · Direkomendasikan',
    desc: 'Kualitas terbaik untuk app ini. Support semua bahasa termasuk Jepang, Mandarin, Arab. File PDF & gambar bisa dibaca.',
    steps: [
      { text: 'Buka', link: 'https://aistudio.google.com', linkText: 'aistudio.google.com', rest: '→ login Google' },
      { text: 'Klik Get API Key → Create API key', link: null },
      { text: 'Copy key → tambah di atas', link: null },
    ],
    prefix: 'AIza...',
  },
  {
    id: 'groq',
    name: 'Groq',
    badge: 'Gratis · Sangat cepat',
    desc: 'Response hampir instan. Gratis hingga ribuan request/hari. Kurang optimal untuk bahasa non-Latin (Jepang, Arab).',
    steps: [
      { text: 'Buka', link: 'https://console.groq.com', linkText: 'console.groq.com', rest: '→ Sign up' },
      { text: 'API Keys → Create API key', link: null },
      { text: 'Copy key → tambah di atas', link: null },
    ],
    prefix: 'gsk_...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Ada model gratis',
    desc: 'Satu key untuk banyak model AI. Termasuk model gratis Llama, Gemma, Qwen, dan Kimi. Pilih model via OpenRouter dashboard.',
    steps: [
      { text: 'Buka', link: 'https://openrouter.ai', linkText: 'openrouter.ai', rest: '→ Sign up' },
      { text: 'Pojok kanan → Keys → Create key', link: null },
      { text: 'Copy key → tambah di atas', link: null },
    ],
    prefix: 'sk-or-...',
    extraNote: 'Via OpenRouter tersedia: Qwen (Alibaba), Kimi (Moonshot), Gemma, Llama, Mistral, dan banyak lagi.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    badge: 'Berbayar',
    desc: 'Model Claude dari Anthropic. Kualitas sangat baik, berbayar. Tidak ada free tier.',
    steps: [
      { text: 'Buka', link: 'https://console.anthropic.com', linkText: 'console.anthropic.com', rest: '→ daftar & isi saldo' },
      { text: 'API Keys → Create Key', link: null },
      { text: 'Copy key → tambah di atas', link: null },
    ],
    prefix: 'sk-ant-...',
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    badge: 'Ada free credit',
    desc: 'Model Llama & Mixtral. Dapat free credit saat daftar pertama kali.',
    steps: [
      { text: 'Buka', link: 'https://fireworks.ai', linkText: 'fireworks.ai', rest: '→ Sign up' },
      { text: 'API Keys → Create new key', link: null },
      { text: 'Copy key → tambah di atas', link: null },
    ],
    prefix: 'fw-...',
  },
]

export default function ApiKeyManager({ keys, activeKey, onAdd, onRemove, onSetActive, onClose }) {
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel]       = useState('')
  const [key, setKey]           = useState('')
  const [showKey, setShowKey]   = useState(false)
  const [err, setErr]           = useState('')
  const [openGuide, setOpenGuide] = useState(null)

  const cfSessions  = getCFSessionsToday()
  const cfNearLimit = cfSessions >= Math.floor(CF_DAILY_LIMIT * 0.7)
  const cfFull      = cfSessions >= CF_DAILY_LIMIT

  const cfEntry  = keys.find(k => k.permanent)
  const userKeys = keys.filter(k => !k.permanent)

  const detectedProvider = key.trim() ? detectProvider(key.trim()) : null
  const detectedInfo     = detectedProvider ? PROVIDER_INFO[detectedProvider] : null

  const add = () => {
    const k = key.trim(), l = label.trim()
    if (!l) return setErr('Isi label dulu')
    if (!k) return setErr('Masukkan API key')
    if (detectedProvider === 'unknown') return setErr('API key tidak didukung — prefix tidak dikenal')
    onAdd({ id: Date.now(), label: l, key: k })
    setLabel(''); setKey(''); setErr(''); setShowForm(false)
  }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>

        <div style={hdr}>
          <div>
            <div style={title}>Pengaturan AI</div>
            <div style={sub}>Pilih atau tambah provider AI</div>
          </div>
          <button style={xbtn} onClick={onClose}>✕</button>
        </div>

        {/* ── List AI ── */}
        <div style={{ marginBottom:10 }}>

          {/* CF Permanent */}
          {cfEntry && (
            <div style={card(activeKey?.id === 'cf_permanent')} onClick={() => onSetActive(cfEntry)}>
              <div style={dot(activeKey?.id === 'cf_permanent')} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <span style={cardName}>Interviewer AI</span>
                  {activeKey?.id === 'cf_permanent' && <span style={activeTag}>AKTIF</span>}
                  <span style={tagPill}>Gratis · Tanpa key</span>
                </div>
                <div style={cardSub}>
                  {cfFull
                    ? <span style={{ color:'var(--red)' }}>Batas harian habis — gunakan API key sendiri atau coba besok</span>
                    : cfNearLimit
                      ? <span style={{ color:'var(--amber)' }}>Hampir habis</span>
                      : 'Dipakai bersama semua pengguna'
                  }
                </div>
              </div>
              <span style={{ fontSize:10, color:'var(--text3)', flexShrink:0 }}>tidak bisa dihapus</span>
            </div>
          )}

          {/* User keys */}
          {userKeys.map(k => {
            const active = activeKey?.id === k.id
            const pInfo  = PROVIDER_INFO[detectProvider(k.key)] || PROVIDER_INFO.unknown
            return (
              <div key={k.id} style={card(active)} onClick={() => onSetActive(k)}>
                <div style={dot(active)} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span style={cardName}>{k.label}</span>
                    {active && <span style={activeTag}>AKTIF</span>}
                    <span style={tagPill}>{pInfo.label}</span>
                    {pInfo.note && <span style={tagNote}>{pInfo.note}</span>}
                  </div>
                  <div style={cardSub}>
                    {k.key.slice(0, 14)}···{k.key.slice(-4)}
                  </div>
                </div>
                <button style={delBtn} onClick={e => { e.stopPropagation(); onRemove(k.id) }}>Hapus</button>
              </div>
            )
          })}

          {/* Form tambah key */}
          {!showForm ? (
            <button style={addBtn} onClick={() => setShowForm(true)}>+ Tambah API Key</button>
          ) : (
            <div style={formBox}>
              <input style={inp} placeholder="Label, contoh: Gemini Pribadi"
                value={label} onChange={e => setLabel(e.target.value)} autoFocus />
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <input
                  style={{ ...inp, flex:1, fontFamily:'JetBrains Mono,monospace', fontSize:12 }}
                  placeholder="AIza...  gsk_...  sk-or-...  sk-ant-...  fw-..."
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => { setKey(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && add()}
                />
                <button style={eyeBtn} onClick={() => setShowKey(v => !v)}>{showKey ? '🙈' : '👁️'}</button>
              </div>

              {/* Provider detection */}
              {key.trim() && detectedInfo && (
                <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                  {detectedProvider === 'unknown' ? (
                    <span style={{ color:'var(--red)', fontWeight:500 }}>
                      ✗ API key tidak dikenali — prefix tidak didukung
                    </span>
                  ) : (
                    <>
                      <span style={{ color:'var(--green)' }}>✓</span>
                      <span style={{ color:'var(--text3)' }}>Terdeteksi:</span>
                      <span style={{ color:'var(--text2)', fontWeight:500 }}>{detectedInfo.label}</span>
                      {detectedInfo.note && <span style={{ color:'var(--text3)', fontSize:11 }}>· {detectedInfo.note}</span>}
                    </>
                  )}
                </div>
              )}

              {err && <div style={{ color:'var(--red)', fontSize:12, marginTop:5 }}>{err}</div>}

              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <button style={saveBtnStyle} onClick={add}>Simpan</button>
                <button style={cancelBtnStyle} onClick={() => { setShowForm(false); setKey(''); setErr('') }}>Batal</button>
              </div>
            </div>
          )}
        </div>

        <div style={divider} />

        {/* ── Panduan ── */}
        <div style={sectionLabel}>Cara mendapatkan API key</div>

        {GUIDES.map(g => (
          <div key={g.id} style={guideCard}>
            <button style={guideHead} onClick={() => setOpenGuide(openGuide === g.id ? null : g.id)}>
              <div style={{ flex:1, textAlign:'left' }}>
                <span style={guideName}>{g.name}</span>
                {g.prefix && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'var(--text3)', marginLeft:8 }}>{g.prefix}</span>}
              </div>
              <span style={guideBadgePill}>{g.badge}</span>
              <span style={{ fontSize:11, color:'var(--text3)', marginLeft:8 }}>{openGuide === g.id ? '▲' : '▼'}</span>
            </button>

            {openGuide === g.id && (
              <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                <p style={guideDesc}>{g.desc}</p>
                {g.extraNote && <p style={{ ...guideDesc, color:'var(--text2)', marginTop:-4 }}>{g.extraNote}</p>}
                {g.steps && (
                  <div>
                    {g.steps.map((s, i) => (
                      <div key={i} style={stepRow}>
                        <span style={stepN}>{i + 1}</span>
                        <span>
                          {s.text}{' '}
                          {s.link && <a href={s.link} target="_blank" rel="noreferrer" style={link}>{s.linkText}</a>}
                          {s.rest && ' ' + s.rest}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <p style={{ fontSize:11, color:'var(--text3)', marginTop:12, lineHeight:1.6 }}>
          🔒 API key disimpan di browser lokal — tidak pernah dikirim ke server kami.
        </p>

      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────
const ov           = { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }
const modal        = { background:'#111115', border:'1px solid var(--border2)', borderRadius:20, padding:22, width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto' }
const hdr          = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }
const title        = { fontFamily:'JetBrains Mono,monospace', fontWeight:500, fontSize:16, color:'var(--amber)' }
const sub          = { fontSize:12, color:'var(--text3)', marginTop:3 }
const xbtn         = { background:'rgba(255,255,255,0.06)', border:'none', color:'var(--text3)', width:28, height:28, borderRadius:'50%', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }
const card         = a => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:`1px solid ${a ? 'var(--amber-border)' : 'var(--border)'}`, background:a ? 'rgba(245,158,11,0.04)' : 'var(--bg)', cursor:'pointer', marginBottom:6, transition:'border-color .15s' })
const dot          = a => ({ width:8, height:8, borderRadius:'50%', flexShrink:0, background:a ? 'var(--amber)' : 'rgba(255,255,255,0.2)', boxShadow:a ? '0 0 6px var(--amber)' : 'none', transition:'all .2s' })
const cardName     = { fontSize:13.5, color:'var(--text)', fontWeight:500 }
const cardSub      = { fontSize:11, color:'var(--text3)', marginTop:3, fontFamily:'JetBrains Mono,monospace' }
const activeTag    = { fontSize:10, background:'rgba(245,158,11,0.15)', color:'var(--amber)', padding:'1px 7px', borderRadius:20, fontWeight:700 }
const tagPill      = { fontSize:10.5, color:'var(--text3)', background:'rgba(255,255,255,0.06)', padding:'1px 7px', borderRadius:20 }
const tagNote      = { fontSize:10.5, color:'var(--text3)', fontStyle:'italic' }
const delBtn       = { background:'none', border:'1px solid rgba(248,113,113,0.2)', borderRadius:6, color:'var(--red)', cursor:'pointer', fontSize:11, padding:'3px 9px', flexShrink:0 }
const addBtn       = { width:'100%', padding:'10px', borderRadius:10, border:'1px dashed rgba(245,158,11,0.3)', background:'rgba(245,158,11,0.04)', color:'var(--amber)', cursor:'pointer', fontSize:13, fontFamily:'Space Grotesk,sans-serif', fontWeight:600, marginTop:4 }
const formBox      = { background:'var(--bg)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginTop:8 }
const inp          = { width:'100%', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px', color:'var(--text)', fontSize:13.5, fontFamily:'Space Grotesk,sans-serif', outline:'none', boxSizing:'border-box' }
const eyeBtn       = { background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, cursor:'pointer', padding:'8px 12px', fontSize:14 }
const saveBtnStyle = { padding:'8px 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#1a0f00', cursor:'pointer', fontSize:12.5, fontFamily:'Space Grotesk,sans-serif', fontWeight:600 }
const cancelBtnStyle = { padding:'8px 14px', borderRadius:8, border:'none', background:'rgba(255,255,255,0.07)', color:'var(--text2)', cursor:'pointer', fontSize:12.5, fontFamily:'Space Grotesk,sans-serif' }
const divider      = { border:'none', borderTop:'1px solid var(--border)', margin:'14px 0' }
const sectionLabel = { fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:8 }
const guideCard    = { border:'1px solid var(--border)', borderRadius:10, marginBottom:6, overflow:'hidden' }
const guideHead    = { width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'none', border:'none', cursor:'pointer', fontFamily:'Space Grotesk,sans-serif' }
const guideName    = { fontSize:13, color:'var(--text)', fontWeight:500 }
const guideBadgePill = { fontSize:10, background:'rgba(255,255,255,0.07)', color:'var(--text3)', padding:'2px 8px', borderRadius:20, flexShrink:0 }
const guideDesc    = { fontSize:12, color:'var(--text3)', margin:'0 0 8px', lineHeight:1.6, padding:'0 12px' }
const stepRow      = { display:'flex', alignItems:'flex-start', gap:7, fontSize:12, color:'var(--text3)', lineHeight:1.5, marginBottom:4, padding:'0 12px' }
const stepN        = { width:16, height:16, borderRadius:'50%', background:'rgba(255,255,255,0.08)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'var(--text2)', flexShrink:0, marginTop:1 }
const link         = { color:'var(--amber)', textDecoration:'none' }
