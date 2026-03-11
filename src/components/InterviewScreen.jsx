import { useState, useRef, useEffect, useCallback } from 'react'
import { buildSystemPrompt, callAI, processUploadedFile } from '../utils/helpers.js'

// ─── Strip emoji & markdown untuk TTS ────────────────────────────────────
function stripForSpeech(text) {
  return text
    .replace(/[🎯✨💡➡️📎🖼️📄📝⚠️🎤🧑‍💻]/gu, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^---$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Render pesan AI ─────────────────────────────────────────────────────
function parseMsg(text) {
  return text.split('\n').map((line, i) => {
    if (line.trim() === '') return <br key={i} />
    if (/^(🎯|✨|💡|➡️)/.test(line)) return (
      <div key={i} style={{ fontWeight: 700, color: '#fff', marginTop: 16, marginBottom: 4, fontSize: 13.5 }}>{line}</div>
    )
    if (line.startsWith('---')) return (
      <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
    )
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <div key={i} style={{ margin: '2px 0', lineHeight: 1.65 }}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </div>
    )
  })
}

// ─── Hook: Speech Recognition (input suara → teks) ───────────────────────
function useSpeechRecognition(lang, onResult) {
  const recogRef = useRef(null)
  const [listening, setListening] = useState(false)

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    if (!supported) {
      alert('Browser kamu tidak mendukung speech recognition. Gunakan Chrome.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = lang === 'Bahasa Indonesia' ? 'id-ID' : 'en-US'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onstart  = () => setListening(true)
    r.onend    = () => setListening(false)
    r.onerror  = () => setListening(false)
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      onResult(transcript)
    }
    recogRef.current = r
    r.start()
  }, [lang, onResult, supported])

  const stop = useCallback(() => {
    if (recogRef.current) recogRef.current.stop()
    setListening(false)
  }, [])

  return { listening, start, stop, supported }
}

// ─── Hook: Text-to-Speech (teks → suara) ─────────────────────────────────
function useTTS(lang) {
  const [speakingIdx, setSpeakingIdx] = useState(null)

  const speak = useCallback((text, idx) => {
    if (!('speechSynthesis' in window)) {
      alert('Browser kamu tidak mendukung text-to-speech.')
      return
    }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(stripForSpeech(text))
    utt.lang  = lang === 'Bahasa Indonesia' ? 'id-ID' : 'en-US'
    utt.rate  = 0.92
    utt.pitch = 1
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

// ─── Komponen utama ───────────────────────────────────────────────────────
export default function InterviewScreen({ profile, uploadedFiles, apiKey, onBack }) {
  const [msgs, setMsgs]                 = useState([])
  const [history, setHistory]           = useState([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])

  const bottomRef = useRef()
  const taRef     = useRef()
  const fileRef   = useRef()

  const lang = profile.interviewLang || 'English'

  // Voice hooks
  const handleVoiceResult = useCallback((transcript) => {
    setInput(prev => prev ? prev + ' ' + transcript : transcript)
  }, [])

  const { listening, start: startListening, stop: stopListening, supported: micSupported }
    = useSpeechRecognition(lang, handleVoiceResult)

  const { speakingIdx, speak, stop: stopSpeaking }
    = useTTS(lang)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  // Cleanup TTS saat unmount
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  // Mulai greeting saat pertama load
  useEffect(() => {
    runGreeting()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Greeting awal ──
  async function runGreeting() {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setLoading(true)
    setMsgs([])
    setHistory([])
    const system = buildSystemPrompt(profile, 'interview')
    const initMsg = { role: 'user', content: '[SESSION_START] Greet the candidate and ask if they are ready.' }
    try {
      const reply = await callAI({
        apiKey,
        system,
        messages: [initMsg],
        files: uploadedFiles || [],
        maxTokens: 600,
      })
      setHistory([
        { role: 'user', content: '[SESSION_START]' },
        { role: 'assistant', content: reply },
      ])
      setMsgs([{ role: 'assistant', content: reply }])
    } catch (e) {
      setMsgs([{
        role: 'assistant',
        content: `⚠️ Gagal terhubung: ${e.message}\n\nPastikan API key sudah benar dan ada koneksi internet.`,
      }])
    }
    setLoading(false)
  }

  // ── Kirim pesan ──
  async function send() {
    if (!input.trim() || loading) return
    stopSpeaking()
    const userText = input.trim()
    setInput('')
    if (taRef.current) taRef.current.style.height = '24px'

    const newMsgs    = [...msgs, { role: 'user', content: userText }]
    const newHistory = [...history, { role: 'user', content: userText }]
    setMsgs(newMsgs)
    setLoading(true)

    try {
      const reply = await callAI({
        apiKey,
        system: buildSystemPrompt(profile, 'interview'),
        messages: newHistory,
        files: pendingFiles,
        maxTokens: 1500,
      })
      setHistory([...newHistory, { role: 'assistant', content: reply }])
      setMsgs([...newMsgs, { role: 'assistant', content: reply }])
      setPendingFiles([])
    } catch (e) {
      setMsgs([...newMsgs, {
        role: 'assistant',
        content: `⚠️ Error: ${e.message}`,
      }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  async function handleFileAttach(rawFiles) {
    for (const f of Array.from(rawFiles)) {
      if (f.size > 10 * 1024 * 1024) {
        alert(`${f.name} terlalu besar (maks 10MB)`)
        continue
      }
      try {
        const processed = await processUploadedFile(f)
        setPendingFiles(prev => [...prev, processed])
      } catch {
        alert(`Gagal baca ${f.name}`)
      }
    }
  }

  function reset() {
    stopSpeaking()
    stopListening()
    setInput('')
    setPendingFiles([])
    runGreeting()
  }

  function toggleMic() {
    if (listening) stopListening()
    else startListening()
  }

  // ── Render ──
  return (
    <div style={sWrap}>

      {/* Header */}
      <div style={sHdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={sLiveDot} />
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>
              {profile.targetJob || 'Interview'}
              {profile.targetCompany ? ` · ${profile.targetCompany}` : ''}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
              {profile.name} · {lang}
              {uploadedFiles?.length > 0 && (
                <span style={{ color: 'var(--amber)', marginLeft: 6 }}>📎 {uploadedFiles.length} dok</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={sHdrBtn} onClick={onBack}>← Prediksi</button>
          <button style={sHdrBtn} onClick={reset}>↺ Ulang</button>
        </div>
      </div>

      {/* Chat area */}
      <div style={sChat}>

        {/* Spinner awal */}
        {loading && msgs.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 14 }}>
            <div style={sSpinner} />
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>Menghubungkan ke AI...</div>
          </div>
        )}

        {/* Pesan */}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeUp .25s ease', marginBottom: 16 }}>
            <div style={sAva(m.role)}>
              {m.role === 'assistant' ? '🎤' : '🧑‍💻'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 'calc(100% - 60px)', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={sBubble(m.role)}>
                {m.role === 'user' ? m.content : parseMsg(m.content)}
              </div>
              {/* Tombol TTS hanya untuk pesan AI */}
              {m.role === 'assistant' && (
                <button
                  style={sSpeakBtn(speakingIdx === i)}
                  onClick={() => speakingIdx === i ? stopSpeaking() : speak(m.content, i)}
                >
                  {speakingIdx === i ? '⏹ stop' : '🔊 dengarkan'}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Loading dots saat menunggu reply */}
        {loading && msgs.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={sAva('assistant')}>🎤</div>
            <div style={{ ...sBubble('assistant'), display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px' }}>
              {[0, 0.15, 0.3].map((d, i) => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: ['var(--amber)', 'var(--green)', 'var(--blue)'][i], animation: `bounce 1.2s ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — muncul setelah ada pesan */}
      {msgs.length > 0 && (
        <div style={sInputArea}>

          {/* Bar listening */}
          {listening && (
            <div style={sListeningBar}>
              <div style={sListeningDot} />
              <span>Mendengarkan... bicara sekarang</span>
              <button onClick={stopListening} style={sStopMicBtn}>✕ selesai</button>
            </div>
          )}

          {/* File yang akan dikirim */}
          {pendingFiles.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {pendingFiles.map((f, i) => (
                <div key={i} style={sFileChip}>
                  <span>{f.type === 'image' ? '🖼️' : f.type === 'pdf' ? '📄' : '📝'}</span>
                  <span style={{ fontSize: 11, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button
                    onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11 }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={sInputRow}>
            {/* Lampirkan file */}
            <button style={sIconBtn} onClick={() => fileRef.current?.click()} title="Lampirkan file">📎</button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,image/*"
              style={{ display: 'none' }}
              onChange={e => handleFileAttach(e.target.files)}
            />

            {/* Textarea */}
            <textarea
              ref={taRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = '24px'
                e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px'
              }}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder={listening ? '🎙 Mendengarkan suaramu...' : 'Ketik atau tekan mic untuk bicara...'}
              style={sTa}
            />

            {/* Tombol mic */}
            {micSupported && (
              <button
                style={sMicBtn(listening)}
                onClick={toggleMic}
                disabled={loading}
                title={listening ? 'Stop recording' : 'Bicara'}
              >
                {listening ? '⏹' : '🎙'}
              </button>
            )}

            {/* Kirim */}
            <button
              style={sSendBtn(!input.trim() || loading)}
              disabled={!input.trim() || loading}
              onClick={send}
            >↑</button>
          </div>

          <div style={{ fontSize: 10.5, color: 'var(--text3)', textAlign: 'center', marginTop: 6 }}>
            <span style={{ color: 'var(--amber)' }}>Enter</span> kirim &nbsp;·&nbsp;
            <span style={{ color: 'var(--amber)' }}>Shift+Enter</span> baris baru &nbsp;·&nbsp;
            <span style={{ color: 'var(--amber)' }}>🎙</span> bicara langsung
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────
const sWrap         = { height: '100vh', display: 'flex', flexDirection: 'column', animation: 'fadeIn .3s ease' }
const sHdr          = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(12,12,14,.97)', backdropFilter: 'blur(12px)', flexShrink: 0, gap: 8, flexWrap: 'wrap' }
const sLiveDot      = { width: 9, height: 9, borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 10px var(--amber)', animation: 'pulse 2s infinite', flexShrink: 0 }
const sHdrBtn       = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 13px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontFamily: 'Space Grotesk,sans-serif' }
const sChat         = { flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column' }
const sSpinner      = { width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin .8s linear infinite' }
const sAva          = r => ({ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 2, background: r === 'assistant' ? '#0f1118' : '#0d1a2e', border: `1px solid ${r === 'assistant' ? 'var(--amber-border)' : 'rgba(96,165,250,0.2)'}` })
const sBubble       = r => ({ padding: '12px 16px', borderRadius: 18, fontSize: 13.5, color: r === 'user' ? '#c8daff' : 'var(--text)', background: r === 'user' ? 'linear-gradient(135deg,#0d1f3c,#091528)' : 'var(--bg2)', border: `1px solid ${r === 'user' ? 'rgba(96,165,250,0.13)' : 'var(--border)'}`, borderTopLeftRadius: r === 'assistant' ? 6 : 18, borderTopRightRadius: r === 'user' ? 6 : 18 })
const sSpeakBtn     = active => ({ background: 'none', border: 'none', color: active ? 'var(--amber)' : 'var(--text3)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', fontFamily: 'Space Grotesk,sans-serif', transition: 'color .2s' })
const sInputArea    = { padding: '10px 14px 14px', borderTop: '1px solid var(--border)', background: 'rgba(12,12,14,.98)', flexShrink: 0 }
const sListeningBar = { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid var(--amber-border)', borderRadius: 10, marginBottom: 8, fontSize: 12, color: 'var(--amber)' }
const sListeningDot = { width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1s infinite', flexShrink: 0 }
const sStopMicBtn   = { marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontSize: 11, fontFamily: 'Space Grotesk,sans-serif' }
const sInputRow     = { display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 14, padding: '8px 10px 8px 4px' }
const sIconBtn      = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px', color: 'var(--text3)', flexShrink: 0 }
const sTa           = { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'Space Grotesk,sans-serif', fontSize: 14, lineHeight: 1.5, resize: 'none', height: 24, maxHeight: 130 }
const sMicBtn       = on => ({ width: 34, height: 34, borderRadius: 9, border: `1px solid ${on ? 'var(--amber-border)' : 'var(--border)'}`, background: on ? 'var(--amber-dim)' : 'transparent', color: on ? 'var(--amber)' : 'var(--text3)', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' })
const sSendBtn      = d  => ({ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#1a0f00', fontSize: 17, cursor: d ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: d ? 0.38 : 1, transition: 'all .2s', fontWeight: 'bold', flexShrink: 0 })
const sFileChip     = { display: 'flex', alignItems: 'center', gap: 5, background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: 'var(--amber)' }
