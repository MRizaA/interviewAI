import { useState, useEffect } from 'react'
import { buildSystemPrompt, callAI, parseQuestionsJSON } from '../utils/helpers.js'

export default function PrepScreen({ profile, apiKey, uploadedFiles, onStartInterview, onBack }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { generate() }, [])

  const generate = async (append = false) => {
    append ? setLoadingMore(true) : (setLoading(true), setError(''))
    try {
      const system = buildSystemPrompt(profile, 'predict')
      const extra = append && questions.length > 0
        ? ` Do NOT repeat these questions: ${questions.map(q => q.q).join(' | ')}`
        : ''
      const raw = await callAI({
        apiKey, system,
        messages: [{ role: 'user', content: `Generate predicted interview questions.${extra}` }],
        maxTokens: 4000,
        files: uploadedFiles || [],
      })
      const parsed = parseQuestionsJSON(raw)
      setQuestions(prev => append ? [...prev, ...parsed] : parsed)
      if (!append) setExpanded(null)
    } catch (e) {
      if (!append) setError(e.message)
      else alert('Gagal: ' + e.message)
    }
    append ? setLoadingMore(false) : setLoading(false)
  }

  const deleteQ = (i) => setQuestions(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={hdr}>
        <button style={backBtn} onClick={onBack}>← Edit Profil</button>
        <div style={{ textAlign:'center' }}>
          <div style={tag}>Prediksi Pertanyaan</div>
          <div style={sub}>
            {profile.targetJob && <span style={{ color:'var(--amber)' }}>{profile.targetJob}</span>}
            {profile.targetCompany && <span> · {profile.targetCompany}</span>}
          </div>
        </div>
        <button style={startBtn} onClick={onStartInterview}>Mulai Wawancara →</button>
      </div>

      <div style={content}>
        {/* Loading */}
        {loading && (
          <div style={loadWrap}>
            <div style={spinner} />
            <div style={{ color:'var(--text2)',fontSize:14,marginTop:16 }}>AI sedang menganalisis profil & dokumen kamu...</div>
            <div style={{ color:'var(--text3)',fontSize:12,marginTop:6 }}>Memprediksi pertanyaan untuk {profile.targetJob || 'posisi ini'}</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={errBox}>
            <div style={{ color:'var(--red)',fontWeight:600,marginBottom:8 }}>⚠️ Gagal generate pertanyaan</div>
            <div style={{ fontSize:11,color:'var(--text2)',marginBottom:12,fontFamily:'JetBrains Mono,monospace' }}>{error}</div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <button style={retryBtn} onClick={() => generate()}>↺ Coba Lagi</button>
              <button style={retryBtn} onClick={onStartInterview}>Langsung Wawancara →</button>
            </div>
          </div>
        )}

        {/* Questions */}
        {!loading && questions.length > 0 && (
          <>
            <div style={intro}>
              <span style={{ fontSize:18 }}>💡</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:3 }}>
                  {questions.length} pertanyaan diprediksi
                  {uploadedFiles?.length > 0 && <span style={{ color:'var(--green)',fontSize:12,marginLeft:8 }}>📎 berdasarkan dokumen kamu</span>}
                </div>
                <div style={{ fontSize:12.5,color:'var(--text2)' }}>
                  Klik pertanyaan untuk lihat contoh jawaban, tips & key phrases.
                </div>
              </div>
              <button style={moreBtn} onClick={() => generate(true)} disabled={loadingMore}>
                {loadingMore ? '⏳' : '+ Pertanyaan Lain'}
              </button>
            </div>

            <div style={qList}>
              {questions.map((item, i) => (
                <div key={i} style={qCard(expanded === i)} onClick={() => setExpanded(expanded === i ? null : i)}>
                  <div style={qHeader}>
                    <div style={qNum}>{String(i+1).padStart(2,'0')}</div>
                    <div style={qText}>"{item.q}"</div>
                    <button style={delBtn} onClick={e => { e.stopPropagation(); deleteQ(i) }} title="Hapus">✕</button>
                    <div style={chevron(expanded === i)}>›</div>
                  </div>

                  {expanded === i && (
                    <div style={qBody} onClick={e => e.stopPropagation()}>

                      {/* Tip */}
                      <div style={tipBox}>
                        <div style={tipLabel}>💡 Tips</div>
                        <div style={{ fontSize:13.5,color:'var(--text2)',lineHeight:1.7 }}>{item.tip}</div>
                      </div>

                      {/* Contoh jawaban */}
                      {item.answer && (
                        <div style={answerBox}>
                          <div style={answerLabel}>💬 Contoh jawaban</div>
                          <div style={answerText}>"{item.answer}"</div>
                          <div style={answerNote}>Ini hanya contoh — sesuaikan dengan kata-katamu sendiri</div>
                        </div>
                      )}

                      {/* Key phrases */}
                      {item.phrases?.length > 0 && (
                        <div style={phraseBox}>
                          <div style={phraseLabel}>🔗 Key Phrases</div>
                          <div style={phraseGrid}>
                            {item.phrases.map((p, j) => <div key={j} style={phraseItem}>{p}</div>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      {!loading && (
        <div style={bottomCTA}>
          <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
            <button style={secondaryBtn} onClick={() => generate()}>↺ Generate Ulang</button>
            <button style={bigStartBtn} onClick={onStartInterview}>🎤 Mulai Sesi Wawancara</button>
          </div>
          <div style={{ fontSize:11.5,color:'var(--text3)',marginTop:8 }}>AI tanya satu per satu — jawab semampunya, dapat feedback langsung</div>
        </div>
      )}
    </div>
  )
}

const wrap = { height:'100vh',display:'flex',flexDirection:'column',animation:'fadeIn .3s ease' }
const hdr = { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)',background:'rgba(12,12,14,0.97)',backdropFilter:'blur(12px)',flexWrap:'wrap',gap:10,flexShrink:0 }
const tag = { fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--amber)',letterSpacing:'0.08em',textTransform:'uppercase' }
const sub = { fontSize:13,color:'var(--text2)',marginTop:3 }
const backBtn = { background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text2)',padding:'7px 14px',borderRadius:20,cursor:'pointer',fontSize:12,fontFamily:'Space Grotesk,sans-serif' }
const startBtn = { background:'linear-gradient(135deg,#f59e0b,#d97706)',border:'none',color:'#1a0f00',padding:'8px 18px',borderRadius:20,cursor:'pointer',fontSize:12.5,fontWeight:700,fontFamily:'Space Grotesk,sans-serif' }
const content = { flex:1,overflowY:'auto',padding:'20px 16px',display:'flex',flexDirection:'column',gap:12 }
const loadWrap = { display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:300 }
const spinner = { width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--amber)',borderRadius:'50%',animation:'spin .8s linear infinite',flexShrink:0 }
const errBox = { background:'var(--red-dim)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:14,padding:20 }
const retryBtn = { background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text2)',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontSize:13,fontFamily:'Space Grotesk,sans-serif' }
const intro = { display:'flex',gap:12,alignItems:'center',background:'var(--amber-dim)',border:'1px solid var(--amber-border)',borderRadius:12,padding:'12px 14px' }
const moreBtn = { background:'rgba(255,255,255,0.06)',border:'1px solid var(--border2)',color:'var(--text2)',padding:'6px 14px',borderRadius:20,cursor:'pointer',fontSize:12,fontFamily:'Space Grotesk,sans-serif',whiteSpace:'nowrap',flexShrink:0 }
const qList = { display:'flex',flexDirection:'column',gap:8 }
const qCard = exp => ({ background:exp?'var(--bg2)':'var(--bg)',border:`1px solid ${exp?'var(--amber-border)':'var(--border)'}`,borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all .2s' })
const qHeader = { display:'flex',alignItems:'flex-start',gap:10,padding:'13px 14px' }
const qNum = { fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--amber)',fontWeight:500,minWidth:26,marginTop:2,flexShrink:0 }
const qText = { fontSize:13.5,color:'var(--text)',lineHeight:1.55,fontStyle:'italic',flex:1 }
const delBtn = { background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:12,padding:'2px 6px',flexShrink:0 }
const chevron = exp => ({ fontSize:20,color:'var(--text3)',transform:exp?'rotate(90deg)':'rotate(0)',transition:'transform .2s',marginTop:-2,flexShrink:0 })
const qBody = { padding:'12px 14px 14px 14px',borderTop:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:10 }
const tipBox = { background:'var(--bg)',border:'1px solid var(--border)',borderRadius:10,padding:'11px 13px' }
const tipLabel = { fontSize:11,color:'var(--green)',fontWeight:700,letterSpacing:'0.06em',marginBottom:6 }
const answerBox = { background:'rgba(96,165,250,0.04)',border:'1px solid rgba(96,165,250,0.15)',borderRadius:10,padding:'12px 14px' }
const answerLabel = { fontSize:11,color:'var(--blue)',fontWeight:700,letterSpacing:'0.06em',marginBottom:8 }
const answerText = { fontSize:13.5,color:'#c8daff',lineHeight:1.75,fontStyle:'italic',marginBottom:8 }
const answerNote = { fontSize:11,color:'#4a5568',fontStyle:'normal' }
const phraseBox = { background:'rgba(245,158,11,0.04)',border:'1px solid var(--amber-border)',borderRadius:10,padding:'11px 13px' }
const phraseLabel = { fontSize:11,color:'var(--amber)',fontWeight:700,letterSpacing:'0.06em',marginBottom:8 }
const phraseGrid = { display:'flex',flexWrap:'wrap',gap:6 }
const phraseItem = { background:'rgba(245,158,11,0.1)',color:'var(--amber)',fontSize:12,padding:'4px 10px',borderRadius:20,fontFamily:'JetBrains Mono,monospace' }
const bottomCTA = { padding:'14px 20px 18px',borderTop:'1px solid var(--border)',background:'var(--bg)',textAlign:'center',flexShrink:0 }
const bigStartBtn = { background:'linear-gradient(135deg,#f59e0b,#d97706)',border:'none',color:'#1a0f00',padding:'12px 32px',borderRadius:50,cursor:'pointer',fontSize:14.5,fontWeight:700,fontFamily:'Space Grotesk,sans-serif',boxShadow:'0 4px 20px rgba(245,158,11,0.3)' }
const secondaryBtn = { background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text2)',padding:'12px 20px',borderRadius:50,cursor:'pointer',fontSize:13.5,fontFamily:'Space Grotesk,sans-serif' }
