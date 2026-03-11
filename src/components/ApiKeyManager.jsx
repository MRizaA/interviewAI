import { useState } from 'react'

export default function ApiKeyManager({ keys, activeKey, onAdd, onRemove, onSetActive, onClose }) {
  const [label, setLabel] = useState('')
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')

  const add = () => {
    if (!label.trim()) return setErr('Isi label dulu')
    if (!key.trim()) return setErr('API key tidak boleh kosong')
    onAdd({ id: Date.now(), label: label.trim(), key: key.trim() })
    setLabel(''); setKey(''); setErr('')
  }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={hdr}>
          <div>
            <div style={title}>🔑 API Key Manager</div>
            <div style={sub}>Simpan & kelola API key — Gemini, OpenRouter, dll</div>
          </div>
          <button style={xbtn} onClick={onClose}>✕</button>
        </div>

        {/* Add */}
        <div style={section}>
          <label style={lbl}>Tambah API Key Baru</label>
          <input style={inp} placeholder="Label (misal: Gemini Personal, OpenRouter)"
            value={label} onChange={e => setLabel(e.target.value)} />
          <div style={{ display:'flex',gap:8,marginTop:8 }}>
            <input style={{ ...inp, flex:1, fontFamily:'JetBrains Mono,monospace', fontSize:12 }}
              placeholder="AIza... atau sk-or-... atau sk-ant-..."
              type={show ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()} />
            <Btn onClick={() => setShow(v=>!v)}>{show ? '🙈' : '👁️'}</Btn>
            <Btn color="amber" onClick={add}>+ Simpan</Btn>
          </div>
          {err && <div style={{ color:'var(--red)',fontSize:12,marginTop:6 }}>{err}</div>}
        </div>

        <div style={divider} />

        {/* List */}
        <div style={section}>
          <label style={lbl}>Tersimpan ({keys.length})</label>
          {keys.length === 0 && (
            <div style={{ color:'var(--text3)',fontSize:13,textAlign:'center',padding:'16px 0' }}>
              Belum ada key tersimpan
            </div>
          )}
          {keys.map(k => {
            const active = activeKey?.id === k.id
            return (
              <div key={k.id} style={card(active)} onClick={() => onSetActive(k)}>
                <div style={dot(active)} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:13.5,color:'var(--text)',fontWeight:500 }}>{k.label}</span>
                    {active && <span style={tag}>AKTIF</span>}
                  </div>
                  <div style={{ fontSize:11,color:'var(--text3)',fontFamily:'JetBrains Mono,monospace',marginTop:2 }}>
                    {k.key.slice(0,18)}···{k.key.slice(-4)}
                  </div>
                </div>
                <Btn color="red" onClick={e => { e.stopPropagation(); onRemove(k.id) }}>Hapus</Btn>
              </div>
            )
          })}
        </div>

        <div style={divider} />

        <div style={{ fontSize:11.5,color:'var(--text3)',lineHeight:1.7 }}>
          <div style={{ marginBottom:6,fontWeight:600,color:'var(--text2)' }}>Provider yang didukung:</div>
          <div>🟢 <strong style={{ color:'var(--green)' }}>Gemini</strong> — gratis, daftar di <a href="https://aistudio.google.com" target="_blank" style={{ color:'var(--amber)' }}>aistudio.google.com</a> → Get API Key</div>
          <div>🔵 <strong style={{ color:'var(--blue)' }}>OpenRouter</strong> — banyak model gratis, <a href="https://openrouter.ai" target="_blank" style={{ color:'var(--amber)' }}>openrouter.ai</a></div>
          <div>⚪ <strong>Anthropic</strong> — berbayar, <a href="https://console.anthropic.com" target="_blank" style={{ color:'var(--amber)' }}>console.anthropic.com</a></div>
          <div style={{ marginTop:8,color:'var(--text3)',fontSize:11 }}>💡 Key disimpan di localStorage browser — tidak dikirim ke mana pun selain provider API yang kamu pilih.</div>
        </div>
      </div>
    </div>
  )
}

const Btn = ({ children, onClick, color }) => (
  <button onClick={onClick} style={{
    padding:'8px 14px', borderRadius:8,
    border: color==='red' ? '1px solid var(--red-dim)' : 'none',
    background: color==='amber' ? 'linear-gradient(135deg,#f59e0b,#d97706)'
      : color==='red' ? 'var(--red-dim)' : 'rgba(255,255,255,0.07)',
    color: color==='amber' ? '#1a0f00' : color==='red' ? 'var(--red)' : 'var(--text2)',
    cursor:'pointer', fontSize:13, fontFamily:'Space Grotesk,sans-serif', fontWeight:500, whiteSpace:'nowrap',
  }}>{children}</button>
)

const ov = { position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }
const modal = { background:'#111115',border:'1px solid var(--border2)',borderRadius:20,padding:24,width:'100%',maxWidth:480,maxHeight:'85vh',overflowY:'auto' }
const hdr = { display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }
const title = { fontFamily:'JetBrains Mono,monospace',fontWeight:500,fontSize:17,color:'var(--amber)' }
const sub = { fontSize:12,color:'var(--text3)',marginTop:4 }
const xbtn = { background:'rgba(255,255,255,0.06)',border:'none',color:'var(--text3)',width:28,height:28,borderRadius:'50%',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }
const section = { marginBottom:4 }
const lbl = { display:'block',fontSize:11,color:'var(--text3)',fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:8 }
const inp = { width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 13px',color:'var(--text)',fontSize:13.5,fontFamily:'Space Grotesk,sans-serif',outline:'none' }
const divider = { border:'none',borderTop:'1px solid var(--border)',margin:'16px 0' }
const card = a => ({ background:a?'rgba(245,158,11,0.05)':'var(--bg)',border:`1px solid ${a?'var(--amber-border)':'var(--border)'}`,borderRadius:10,padding:'11px 13px',marginBottom:8,display:'flex',alignItems:'center',gap:10,cursor:'pointer',transition:'all .2s' })
const dot = a => ({ width:8,height:8,borderRadius:'50%',flexShrink:0,background:a?'var(--amber)':'#2a2a30',boxShadow:a?'0 0 8px var(--amber)':'none' })
const tag = { fontSize:10,background:'rgba(245,158,11,0.15)',color:'var(--amber)',padding:'2px 8px',borderRadius:20,fontWeight:700 }
