import { useState, useRef, useEffect, useCallback } from 'react'
import { buildSystemPrompt, callAI, processUploadedFile } from '../utils/helpers.js'
import { Icon } from '../App.jsx'

// ─── BCP-47 language code mapping untuk TTS & Speech Recognition ──────────
// Browser hanya terima kode standar — petakan nama bahasa bebas ke kode ini.
function getLangCode(lang) {
  if (!lang) return 'id-ID'
  const l = lang.toLowerCase().trim()
  if (l.includes('indonesia') || l === 'id') return 'id-ID'
  if (l.includes('japan') || l.includes('jepang') || l === 'ja') return 'ja-JP'
  if (l.includes('mandarin') || l.includes('chinese') || l.includes('china') || l.includes('cina') || l === 'zh') return 'zh-CN'
  if (l.includes('arabic') || l.includes('arab') || l === 'ar') return 'ar-SA'
  if (l.includes('french') || l.includes('prancis') || l.includes('français') || l === 'fr') return 'fr-FR'
  if (l.includes('german') || l.includes('jerman') || l === 'de') return 'de-DE'
  if (l.includes('korean') || l.includes('korea') || l === 'ko') return 'ko-KR'
  if (l.includes('spanish') || l.includes('spanyol') || l === 'es') return 'es-ES'
  if (l.includes('portuguese') || l.includes('portugis') || l === 'pt') return 'pt-BR'
  if (l.includes('thai') || l.includes('thailand') || l === 'th') return 'th-TH'
  if (l.includes('hindi') || l === 'hi') return 'hi-IN'
  if (l.includes('vietnam') || l === 'vi') return 'vi-VN'
  if (l.includes('malay') || l.includes('melayu') || l === 'ms') return 'ms-MY'
  if (l.includes('english') || l === 'en') return 'en-US'
  // campur / mix default ke Indonesia
  if (l.includes('+') || l.includes('campur')) return 'id-ID'
  return 'en-US'
}

// ─── Strip markdown untuk TTS ──────────────────────────────────────────────
function stripForSpeech(text) {
  return text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^---$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Render pesan AI ───────────────────────────────────────────────────────
function parseMsg(text) {
  return text.split('\n').map((line, i) => {
    if (line.trim() === '') return <br key={i} />
    if (line.startsWith('---')) return <hr key={i} style={{ border:'none',borderTop:'1px solid var(--border)',margin:'10px 0' }} />
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <div key={i} style={{ margin:'2px 0',lineHeight:1.65 }}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </div>
    )
  })
}

// ─── Hook: Speech Recognition ─────────────────────────────────────────────
function useSpeechRecognition(lang, onResult) {
  const recogRef = useRef(null)
  const [listening, setListening] = useState(false)
  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    if (!supported) { alert('Browser kamu tidak mendukung speech recognition. Gunakan Chrome.'); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r  = new SR()
    r.lang            = getLangCode(lang)
    r.interimResults  = false
    r.maxAlternatives = 1
    r.onstart  = () => setListening(true)
    r.onend    = () => setListening(false)
    r.onerror  = () => setListening(false)
    r.onresult = (e) => onResult(e.results[0][0].transcript)
    recogRef.current = r
    r.start()
  }, [lang, onResult, supported])

  const stop = useCallback(() => {
    if (recogRef.current) recogRef.current.stop()
    setListening(false)
  }, [])

  return { listening, start, stop, supported }
}

// ─── Hook: TTS ────────────────────────────────────────────────────────────
function useTTS(lang) {
  const [speakingIdx, setSpeakingIdx] = useState(null)

  const speak = useCallback((text, idx) => {
    if (!('speechSynthesis' in window)) { alert('Browser kamu tidak mendukung text-to-speech.'); return }
    window.speechSynthesis.cancel()
    const utt   = new SpeechSynthesisUtterance(stripForSpeech(text))
    utt.lang    = getLangCode(lang)
    utt.rate    = 0.92
    utt.pitch   = 1
    utt.onstart = () => setSpeakingIdx(idx)
    utt.onend   = () => setSpeakingIdx(null)
    utt.onerror = () => setSpeakingIdx(null)
    window.speechSynthesis.speak(utt)
  }, [lang])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeakingIdx(null)
  }, [])

  return { speakingIdx, speak, stop }
}

// ─── Avatar AI — logo tanpa border container ──────────────────────────────
const AiAvatar = () => (
  <img
    src="/img/logo/logo_v2.svg"
    alt="AI"
    style={{ width:34, height:34, flexShrink:0, marginTop:2 }}
  />
)

// ─── Export rangkuman sebagai TXT ─────────────────────────────────────────
function exportTxt(msgs, profile) {
  if (!msgs || msgs.length === 0) return
  const now     = new Date().toLocaleString('id-ID')
  const name    = profile.name || 'Kandidat'
  const job     = profile.targetJob || '-'
  const company = profile.targetCompany ? ` di ${profile.targetCompany}` : ''
  const lang    = profile.interviewLang || '-'
  const sep     = '─'.repeat(60)

  const lines = [`RANGKUMAN SESI WAWANCARA`, sep, `Nama   : ${name}`, `Posisi : ${job}${company}`, `Bahasa : ${lang}`, `Waktu  : ${now}`, sep, '']

  msgs.forEach(m => {
    if (m.content === '[SESSION_START]') return
    const who   = m.role === 'assistant' ? '[AI Coach]' : `[${name}]`
    const clean = m.content.replace(/🎯\s*/g,'').replace(/✨\s*/g,'').replace(/➡️\s*/g,'').replace(/💡\s*/g,'').trim()
    lines.push(who, clean, '')
  })

  lines.push(sep, 'Dibuat oleh Interview Coach AI — interviewai.my.id')

  const blob = new Blob([lines.join('\n')], { type:'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `wawancara-${name.replace(/\s+/g,'-').toLowerCase()}-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Copy teks ke clipboard ───────────────────────────────────────────────
function copyText(text, setCopied) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }).catch(() => alert('Gagal menyalin teks.'))
}

// ─── Komponen utama ────────────────────────────────────────────────────────
export default function InterviewScreen({ profile, uploadedFiles, apiKey, onBack }) {
  const [msgs, setMsgs]                 = useState([])
  const [history, setHistory]           = useState([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [copiedIdx, setCopiedIdx]       = useState(null)

  const bottomRef = useRef()
  const taRef     = useRef()
  const fileRef   = useRef()

  const lang = profile.interviewLang || 'Indonesia + English'

  // Hitung pertanyaan: jumlah pesan user yang dikirim (tidak termasuk SESSION_START)
  const questionCount = msgs.filter(m => m.role === 'user' && m.content !== '[SESSION_START]').length

  const handleVoiceResult = useCallback((transcript) => {
    setInput(prev => prev ? prev + ' ' + transcript : transcript)
  }, [])

  const { listening, start: startListening, stop: stopListening, supported: micSupported }
    = useSpeechRecognition(lang, handleVoiceResult)
  const { speakingIdx, speak, stop: stopSpeaking } = useTTS(lang)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, loading])
  useEffect(() => { return () => { window.speechSynthesis?.cancel() } }, [])
  useEffect(() => { runGreeting() }, []) // eslint-disable-line

  async function runGreeting() {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setLoading(true); setMsgs([]); setHistory([])
    const system  = buildSystemPrompt(profile, 'interview')
    const initMsg = { role:'user', content:'[SESSION_START] Greet the candidate and ask if they are ready.' }
    try {
      const reply = await callAI({ apiKey, system, messages:[initMsg], files:uploadedFiles||[], maxTokens:600 })
      setHistory([{ role:'user', content:'[SESSION_START]' }, { role:'assistant', content:reply }])
      setMsgs([{ role:'assistant', content:reply }])
    } catch (e) {
      setMsgs([{ role:'assistant', content:`Gagal terhubung: ${e.message}\n\nPastikan API / koneksi internet sudah benar.` }])
    }
    setLoading(false)
  }

  async function send() {
    if (!input.trim() || loading) return
    stopSpeaking()
    const userText   = input.trim()
    setInput('')
    if (taRef.current) taRef.current.style.height = '24px'
    const newMsgs    = [...msgs, { role:'user', content:userText }]
    const newHistory = [...history, { role:'user', content:userText }]
    setMsgs(newMsgs); setLoading(true)
    try {
      const reply = await callAI({ apiKey, system:buildSystemPrompt(profile,'interview'), messages:newHistory, files:pendingFiles, maxTokens:1500 })
      setHistory([...newHistory, { role:'assistant', content:reply }])
      setMsgs([...newMsgs, { role:'assistant', content:reply }])
      setPendingFiles([])
    } catch (e) {
      setMsgs([...newMsgs, { role:'assistant', content:`Error: ${e.message}` }])
    }
    setLoading(false)
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  async function handleFileAttach(rawFiles) {
    for (const f of Array.from(rawFiles)) {
      if (f.size > 10 * 1024 * 1024) { alert(`${f.name} terlalu besar (maks 10MB)`); continue }
      try { const processed = await processUploadedFile(f); setPendingFiles(prev => [...prev, processed]) }
      catch { alert(`Gagal baca ${f.name}`) }
    }
  }

  function reset() { stopSpeaking(); stopListening(); setInput(''); setPendingFiles([]); runGreeting() }
  function toggleMic() { if (listening) stopListening(); else startListening() }

  return (
    <div style={sWrap}>

      {/* ── Header ── */}
      <div style={sHdr}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={sLiveDot} />
          <div>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontWeight:500,fontSize:13,color:'var(--text)' }}>
              {profile.targetJob || 'Interview'}
              {profile.targetCompany ? ` · ${profile.targetCompany}` : ''}
            </div>
            <div style={{ fontSize:11,color:'var(--text3)',marginTop:1,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
              {profile.name} · {lang}
              {questionCount > 0 && <span style={{ color:'var(--amber)', fontWeight:500 }}>· Pertanyaan ke-{questionCount}</span>}
              {uploadedFiles?.length > 0 && (
                <span style={{ color:'var(--amber)',display:'flex',alignItems:'center',gap:3 }}>
                  <Icon name="clip" size={11} color="var(--amber)" /> {uploadedFiles.length} dok
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display:'flex',gap:6 }}>
          {msgs.length > 1 && (
            <button style={sHdrBtn} onClick={() => exportTxt(msgs, profile)} title="Simpan sebagai TXT">
              <Icon name="file" size={14} color="var(--text2)" /> Simpan
            </button>
          )}
          <button style={sHdrBtn} onClick={onBack}>
            <Icon name="list" size={14} color="var(--text2)" /> Prediksi
          </button>
          <button style={sHdrBtn} onClick={reset}>
            <Icon name="refresh" size={14} color="var(--text2)" /> Ulang
          </button>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={sChat}>
        {loading && msgs.length === 0 && (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,gap:14 }}>
            <div style={sSpinner} />
            <div style={{ color:'var(--text2)',fontSize:13 }}>Menghubungkan ke AI...</div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ display:'flex',gap:10,flexDirection:m.role==='user'?'row-reverse':'row',animation:'fadeUp .25s ease',marginBottom:16 }}>
            {m.role === 'assistant'
              ? <AiAvatar />
              : <div style={sAva('user')}><Icon name="user" size={16} color="var(--blue)" /></div>
            }
            <div style={{ display:'flex',flexDirection:'column',gap:4,maxWidth:'calc(100% - 54px)',alignItems:m.role==='user'?'flex-end':'flex-start' }}>
              <div style={sBubble(m.role)}>
                {m.role === 'user' ? m.content : parseMsg(m.content)}
              </div>
              {/* Action buttons bawah bubble */}
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                {m.role === 'assistant' && (
                  <>
                    <button style={sActionBtn(speakingIdx === i)}
                      onClick={() => speakingIdx === i ? stopSpeaking() : speak(m.content, i)}>
                      <Icon name={speakingIdx === i ? 'speakerx' : 'speaker'} size={12}
                        color={speakingIdx === i ? 'var(--amber)' : 'var(--text3)'} />
                      {speakingIdx === i ? ' stop' : ' dengarkan'}
                    </button>
                    <button style={sActionBtn(copiedIdx === i)}
                      onClick={() => copyText(m.content, (v) => { if (v) setCopiedIdx(i); else setCopiedIdx(null) })}>
                      <Icon name="check" size={12} color={copiedIdx === i ? 'var(--green)' : 'var(--text3)'} />
                      {copiedIdx === i ? ' disalin' : ' salin'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && msgs.length > 0 && (
          <div style={{ display:'flex',gap:10,marginBottom:16 }}>
            <AiAvatar />
            <div style={{ ...sBubble('assistant'),display:'flex',alignItems:'center',gap:6,padding:'14px 16px' }}>
              {[0,0.15,0.3].map((d,i) => (
                <div key={i} style={{ width:7,height:7,borderRadius:'50%',background:['var(--amber)','var(--green)','var(--blue)'][i],animation:`bounce 1.2s ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      {msgs.length > 0 && (
        <div style={sInputArea}>
          {listening && (
            <div style={sListeningBar}>
              <div style={sListeningDot} />
              <span>Mendengarkan... bicara sekarang</span>
              <button onClick={stopListening} style={sStopMicBtn}>
                <Icon name="x" size={13} color="var(--amber)" /> selesai
              </button>
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:8 }}>
              {pendingFiles.map((f,i) => (
                <div key={i} style={sFileChip}>
                  <Icon name="file" size={13} color="var(--amber)" />
                  <span style={{ fontSize:11,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{f.name}</span>
                  <button onClick={() => setPendingFiles(p => p.filter((_,j) => j!==i))}
                    style={{ background:'none',border:'none',cursor:'pointer',padding:'0 2px',display:'flex',alignItems:'center' }}>
                    <Icon name="x" size={11} color="var(--amber)" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={sInputRow}>
            <button style={sIconBtn} onClick={() => fileRef.current?.click()} title="Lampirkan file">
              <Icon name="clip" size={18} color="var(--text3)" />
            </button>
            <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.md,image/*"
              style={{ display:'none' }} onChange={e => handleFileAttach(e.target.files)} />

            <textarea ref={taRef} value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height='24px'; e.target.style.height=Math.min(e.target.scrollHeight,130)+'px' }}
              onKeyDown={handleKey} disabled={loading}
              placeholder={listening ? 'Mendengarkan suaramu...' : 'Ketik atau tekan mic untuk bicara...'}
              style={sTa} />

            {micSupported && (
              <button style={sMicBtn(listening)} onClick={toggleMic} disabled={loading}>
                <Icon name={listening ? 'speakerx' : 'mic'} size={17} color={listening ? 'var(--amber)' : 'var(--text3)'} />
              </button>
            )}

            <button style={sSendBtn(!input.trim() || loading)} disabled={!input.trim() || loading} onClick={send}>
              <Icon name="send" size={16} color="#1a0f00" />
            </button>
          </div>

          <div style={{ fontSize:10.5,color:'var(--text3)',textAlign:'center',marginTop:6 }}>
            <span style={{ color:'var(--amber)' }}>Enter</span> kirim &nbsp;·&nbsp;
            <span style={{ color:'var(--amber)' }}>Shift+Enter</span> baris baru &nbsp;·&nbsp;
            mic untuk bicara langsung
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────
const sWrap         = { height:'100%',display:'flex',flexDirection:'column',animation:'fadeIn .3s ease' }
const sHdr          = { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'rgba(12,12,14,.97)',backdropFilter:'blur(12px)',flexShrink:0,gap:8,flexWrap:'wrap' }
const sLiveDot      = { width:9,height:9,borderRadius:'50%',background:'var(--amber)',boxShadow:'0 0 10px var(--amber)',animation:'pulse 2s infinite',flexShrink:0 }
const sHdrBtn       = { display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text2)',padding:'6px 13px',borderRadius:20,cursor:'pointer',fontSize:12,fontFamily:'Space Grotesk,sans-serif' }
const sChat         = { flex:1,overflowY:'auto',padding:'20px 16px',display:'flex',flexDirection:'column' }
const sSpinner      = { width:32,height:32,border:'3px solid var(--border)',borderTopColor:'var(--amber)',borderRadius:'50%',animation:'spin .8s linear infinite' }
const sAva          = r => ({ width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2,background:'#0d1a2e',border:'1px solid rgba(96,165,250,0.2)' })
const sBubble       = r => ({ padding:'12px 16px',borderRadius:18,fontSize:13.5,color:r==='user'?'#c8daff':'var(--text)',background:r==='user'?'linear-gradient(135deg,#0d1f3c,#091528)':'var(--bg2)',border:`1px solid ${r==='user'?'rgba(96,165,250,0.13)':'var(--border)'}`,borderTopLeftRadius:r==='assistant'?6:18,borderTopRightRadius:r==='user'?6:18 })
const sActionBtn    = active => ({ display:'flex',alignItems:'center',gap:4,background:'none',border:'none',color:active?'var(--amber)':'var(--text3)',cursor:'pointer',fontSize:11,padding:'2px 6px',fontFamily:'Space Grotesk,sans-serif',transition:'color .2s' })
const sInputArea    = { padding:'10px 14px 14px',borderTop:'1px solid var(--border)',background:'rgba(12,12,14,.98)',flexShrink:0 }
const sListeningBar = { display:'flex',alignItems:'center',gap:8,padding:'7px 12px',background:'rgba(245,158,11,0.08)',border:'1px solid var(--amber-border)',borderRadius:10,marginBottom:8,fontSize:12,color:'var(--amber)' }
const sListeningDot = { width:8,height:8,borderRadius:'50%',background:'var(--amber)',animation:'pulse 1s infinite',flexShrink:0 }
const sStopMicBtn   = { display:'flex',alignItems:'center',gap:4,marginLeft:'auto',background:'none',border:'none',color:'var(--amber)',cursor:'pointer',fontSize:11,fontFamily:'Space Grotesk,sans-serif' }
const sInputRow     = { display:'flex',gap:8,alignItems:'flex-end',background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:14,padding:'8px 10px 8px 4px' }
const sIconBtn      = { background:'none',border:'none',cursor:'pointer',padding:'4px 8px',color:'var(--text3)',flexShrink:0,display:'flex',alignItems:'center' }
const sTa           = { flex:1,background:'transparent',border:'none',outline:'none',color:'var(--text)',fontFamily:'Space Grotesk,sans-serif',fontSize:14,lineHeight:1.5,resize:'none',height:24,maxHeight:130 }
const sMicBtn       = on => ({ width:34,height:34,borderRadius:9,border:`1px solid ${on?'var(--amber-border)':'var(--border)'}`,background:on?'var(--amber-dim)':'transparent',color:on?'var(--amber)':'var(--text3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s' })
const sSendBtn      = d  => ({ width:34,height:34,borderRadius:9,border:'none',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#1a0f00',cursor:d?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:d?0.38:1,transition:'all .2s',fontWeight:'bold',flexShrink:0 })
const sFileChip     = { display:'flex',alignItems:'center',gap:5,background:'var(--amber-dim)',border:'1px solid var(--amber-border)',borderRadius:20,padding:'3px 10px',fontSize:12,color:'var(--amber)' }
