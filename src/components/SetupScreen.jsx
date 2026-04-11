import { useState, useRef } from 'react'
import { processUploadedFile } from '../utils/helpers.js'
import { Icon } from '../App.jsx'

const DEFAULTS = {
  name: '', education: '', experience: '', skills: '', achievements: '',
  targetJob: '', targetCompany: '', interviewLang: 'Indonesia + English',
  struggles: '', aiPersona: 'a professional, encouraging interview coach who speaks both English and Indonesian',
  extraContext: '',
}

const LANG_PILLS = ['Indonesia + English', 'Bahasa Indonesia', 'English']

export default function SetupScreen({ initial, uploadedFiles, onFilesChange, onStart }) {
  const [form, setForm]                   = useState({ ...DEFAULTS, ...initial })
  const [files, setFiles]                 = useState(uploadedFiles || [])
  const [dragging, setDragging]           = useState(false)
  const [uploading, setUploading]         = useState(false)
  const [showDetail, setShowDetail]       = useState(false)
  const [showAI, setShowAI]               = useState(false)
  const [showCustomLang, setShowCustomLang] = useState(
    !LANG_PILLS.includes(initial?.interviewLang ?? DEFAULTS.interviewLang)
  )
  const [customLang, setCustomLang]       = useState(
    LANG_PILLS.includes(initial?.interviewLang ?? DEFAULTS.interviewLang) ? '' : (initial?.interviewLang ?? '')
  )
  const fileRef = useRef()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleLangPill = (lang) => {
    setCustomLang('')
    setShowCustomLang(false)
    set('interviewLang', lang)
  }

  const handleCustomLangToggle = () => {
    setShowCustomLang(true)
    // deactivate pill selection
    if (LANG_PILLS.includes(form.interviewLang)) {
      set('interviewLang', customLang.trim() || '')
    }
  }

  const handleCustomLang = (v) => {
    setCustomLang(v)
    set('interviewLang', v.trim() || LANG_PILLS[0])
  }

  const handleFiles = async (rawFiles) => {
    setUploading(true)
    const processed = []
    for (const f of Array.from(rawFiles)) {
      if (f.size > 10 * 1024 * 1024) { alert(`${f.name} terlalu besar (maks 10MB)`); continue }
      try { processed.push(await processUploadedFile(f)) }
      catch { alert(`Gagal baca ${f.name}`) }
    }
    const updated = [...files, ...processed]
    setFiles(updated); onFilesChange(updated)
    setUploading(false)
  }

  const removeFile = (i) => {
    const updated = files.filter((_, idx) => idx !== i)
    setFiles(updated); onFilesChange(updated)
  }

  const canStart   = form.name.trim() && form.targetJob.trim()
  const activePill = !showCustomLang && LANG_PILLS.includes(form.interviewLang) ? form.interviewLang : null
  const filledCount = [form.education, form.experience, form.skills, form.achievements, form.targetCompany, form.extraContext]
    .filter(v => v && v.trim()).length

  return (
    <div style={wrap}>

      {/* ── Hero ── */}
      <div style={hero}>
        <div style={heroAccent}>Interview Coach AI</div>
        <h1 style={heroTitle}>
          Latihan <span style={{ color:'var(--amber)' }}>wawancara</span> kerja<br />
          <span style={{ fontSize:'0.7em', color:'var(--text2)', fontWeight:400 }}>dengan AI — gratis, tanpa daftar</span>
        </h1>
        <div style={heroFeatures}>
          <span style={featurePill}><Icon name="list" size={12} color="var(--amber)" /> Prediksi pertanyaan</span>
          <span style={featurePill}><Icon name="mic" size={12} color="var(--amber)" /> Simulasi wawancara</span>
          <span style={featurePill}><Icon name="circle_ok" size={12} color="var(--amber)" /> Feedback real-time</span>
        </div>
      </div>

      <div style={formWrap}>

        {/* ── Panel Utama ── */}
        <div style={panel}>
          <div style={panelHeader}>
            <Icon name="user" size={16} color="var(--amber)" />
            <span style={panelTitle}>Profil Kamu</span>
            <div style={panelDivider} />
          </div>

          <div style={fieldGrid}>
            <Field label="Nama" required hint="Dipakai AI untuk menyapa dan mempersonalisasi sesi">
              <Input placeholder="Contoh: Budi Santoso" value={form.name} onChange={v => set('name', v)} autoFocus />
            </Field>
            <Field label="Posisi yang dilamar" required hint="AI akan fokus ke pertanyaan relevan untuk posisi ini">
              <Input placeholder="Contoh: Frontend Developer, Data Analyst, HRD" value={form.targetJob} onChange={v => set('targetJob', v)} />
            </Field>
          </div>

          <Field label="Bahasa wawancara" hint="Pilih bahasa sesi — atau pilih 'Bahasa lain' untuk bahasa apapun">
            <div style={pillRow}>
              {LANG_PILLS.map(l => (
                <button key={l} style={pill(activePill === l)} onClick={() => handleLangPill(l)}>{l}</button>
              ))}
              <button style={pill(showCustomLang)} onClick={handleCustomLangToggle}>
                Bahasa lain...
              </button>
            </div>
            {showCustomLang && (
              <div style={{ marginTop:8 }}>
                <Input
                  placeholder="Ketik bahasa, contoh: Japanese, Mandarin, Arabic, Français, Korean..."
                  value={customLang}
                  onChange={handleCustomLang}
                />
                {customLang.trim() && (
                  <div style={{ fontSize:11, color:'var(--green)', marginTop:4 }}>
                    ✓ Bahasa wawancara: <strong>{customLang.trim()}</strong>
                  </div>
                )}
              </div>
            )}
          </Field>
        </div>

        {/* ── Detail Profil (collapse) — dibuat lebih mencolok ── */}
        {/* <div style={{ ...panel, border: filledCount > 0 ? '1px solid var(--amber-border)' : '1px solid rgba(245,158,11,0.25)', background: filledCount > 0 ? 'var(--bg2)' : 'rgba(245,158,11,0.03)' }}> */}
        <div style={panel}>
          <button style={collapseBtn} onClick={() => setShowDetail(v => !v)}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
              <div style={{ width:28, height:28, borderRadius:8, background: showDetail ? 'var(--amber-dim)' : 'rgba(245,158,11,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="list" size={15} color="var(--amber)" />
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', fontFamily:'Space Grotesk,sans-serif' }}>
                  Detail Profil
                  {filledCount === 0 && <span style={{ fontSize:11, color:'var(--amber)', marginLeft:8, fontWeight:400 }}>↑ Isi untuk hasil lebih akurat</span>}
                </div>
                <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>
                  {showDetail
                    ? 'Pendidikan, pengalaman, skill, pencapaian, perusahaan'
                    : filledCount > 0
                      ? <span style={{ color:'var(--green)' }}>{filledCount} kolom diisi — prediksi lebih personal</span>
                      : 'Pendidikan · Pengalaman · Skill · Pencapaian'
                  }
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              {filledCount > 0 && !showDetail && <span style={progressPill}>{filledCount}/6</span>}
              <div style={{ transform: showDetail ? 'rotate(90deg)' : 'rotate(0)', transition:'transform .2s' }}>
                <Icon name="chevron_r" size={16} color="var(--amber)" />
              </div>
            </div>
          </button>

          {showDetail && (
            <div style={{ marginTop:16 }}>
              <div style={fieldGrid}>
                <Field label="Pendidikan terakhir">
                  <Input placeholder="Contoh: S1 Teknik Informatika – Universitas XYZ, 2024" value={form.education} onChange={v => set('education', v)} />
                </Field>
                <Field label="Nama perusahaan yang dituju">
                  <Input placeholder="Contoh: Tokopedia, Bank BCA, PT. XYZ" value={form.targetCompany} onChange={v => set('targetCompany', v)} />
                </Field>
              </div>
              <Field label="Pengalaman kerja / magang">
                <Textarea placeholder="Contoh: Magang web developer 3 bulan di PT. ABC — menangani fitur X, teknologi Y..." value={form.experience} onChange={v => set('experience', v)} rows={3} />
              </Field>
              <div style={fieldGrid}>
                <Field label="Skill / teknologi">
                  <Input placeholder="Contoh: React, Laravel, MySQL, Git, Figma" value={form.skills} onChange={v => set('skills', v)} />
                </Field>
                <Field label="Prestasi / pencapaian">
                  <Input placeholder="Contoh: Juara 1 Hackathon, IPK 3.7, meningkatkan performa sistem 40%" value={form.achievements} onChange={v => set('achievements', v)} />
                </Field>
              </div>
              <Field label="Deskripsi pekerjaan / konteks tambahan" hint="Tempel job description atau tulis hal khusus yang perlu diketahui AI">
                <Textarea placeholder="Posisi ini butuh pengalaman cloud computing dan tim internasional..." value={form.extraContext} onChange={v => set('extraContext', v)} rows={3} />
              </Field>
            </div>
          )}
        </div>

        {/* ── Upload (collapse) ── */}
        <div style={panel}>
          <button style={collapseBtn} onClick={() => fileRef.current?.click()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
              <Icon name="clip" size={15} color={files.length > 0 ? 'var(--amber)' : 'var(--text3)'} />
              <div style={{ textAlign:'left' }}>
                <div style={{ ...panelTitle, color: files.length > 0 ? 'var(--amber)' : 'var(--text2)' }}>Upload CV / Dokumen</div>
                <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>
                  {files.length > 0
                    ? <span style={{ color:'var(--green)' }}>{files.length} dokumen terlampir</span>
                    : 'CV, job description, catatan — PDF, gambar, teks (maks 10MB)'}
                </div>
              </div>
            </div>
            <span style={{ fontSize:11.5, color:'var(--amber)', fontWeight:500, flexShrink:0 }}>Pilih file →</span>
          </button>

          <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.md,image/*"
            style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />

          <div style={{ ...dropZone(dragging), marginTop:10 }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}>
            {uploading
              ? <div style={{ color:'var(--amber)', fontSize:13 }}>Memproses file...</div>
              : <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                  <Icon name="upload" size={16} color="var(--text3)" />
                  <span style={{ fontSize:12.5, color:'var(--text3)' }}>Drag & drop atau <span style={{ color:'var(--amber)' }}>klik untuk pilih</span></span>
                </div>
            }
          </div>

          {files.length > 0 && (
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:5 }}>
              {files.map((f, i) => (
                <div key={i} style={fileCard}>
                  <Icon name="file" size={14} color="var(--text3)" />
                  <span style={{ flex:1, fontSize:12.5, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                  <button onClick={() => removeFile(i)} style={removeBtn}><Icon name="x" size={13} color="var(--text3)" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Kustomisasi AI (collapse) ── */}
        <div style={panel}>
          <button style={collapseBtn} onClick={() => setShowAI(v => !v)}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
              <Icon name="settings" size={15} color={showAI ? 'var(--amber)' : 'var(--text3)'} />
              <div style={{ textAlign:'left' }}>
                <div style={{ ...panelTitle, color: showAI ? 'var(--amber)' : 'var(--text2)' }}>Kustomisasi AI Coach</div>
                <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>
                  {showAI ? 'Persona coach dan area kesulitan kamu' : 'Atur gaya AI dan ceritakan kesulitan wawancara'}
                </div>
              </div>
            </div>
            <div style={{ transform: showAI ? 'rotate(90deg)' : 'rotate(0)', transition:'transform .2s' }}>
              <Icon name="chevron_r" size={16} color="var(--text3)" />
            </div>
          </button>

          {showAI && (
            <div style={{ marginTop:16 }}>
              <Field label="Persona AI coach" hint="Gaya dan karakter yang kamu inginkan dari AI">
                <Textarea placeholder="Contoh: seorang senior developer yang tegas tapi suportif, atau HRD berpengalaman yang ramah" value={form.aiPersona} onChange={v => set('aiPersona', v)} rows={2} />
              </Field>
              <Field label="Apa yang sering bikin kamu kesulitan saat interview?" hint="AI akan fokus membantu di area ini">
                <Textarea placeholder="Contoh: sering ngeblank, susah bahasa Inggris, tidak percaya diri, bingung cara cerita pengalaman" value={form.struggles} onChange={v => set('struggles', v)} rows={3} />
              </Field>
            </div>
          )}
        </div>

        {/* ── CTA ── */}
        <div style={ctaWrap}>
          {!canStart && (
            <div style={ctaHint}>
              <span style={{ color:'var(--red)', fontSize:13 }}>*</span>
              {' '}Isi <strong style={{ color:'var(--text)' }}>Nama</strong> dan <strong style={{ color:'var(--text)' }}>Posisi yang dilamar</strong> untuk memulai
            </div>
          )}
          <button style={startBtn(canStart)} disabled={!canStart} onClick={() => onStart(form)}>
            {canStart
              ? <><Icon name="arrow_r" size={18} color="#1a0f00" /> Mulai Latihan Wawancara</>
              : <><Icon name="warning" size={16} color="var(--text3)" /> Lengkapi data wajib dulu</>
            }
          </button>
          {canStart && (
            <div style={ctaMeta}>
              <span><Icon name="circle_ok" size={11} color="var(--green)" /> {form.name}</span>
              <span>·</span><span>{form.targetJob}</span>
              <span>·</span><span>{form.interviewLang}</span>
              {files.length > 0 && <><span>·</span><span style={{ color:'var(--green)' }}>{files.length} dok</span></>}
              {filledCount > 0 && <><span>·</span><span style={{ color:'var(--amber)' }}>profil {filledCount}/6</span></>}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────
const Field = ({ label, required, hint, children }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text2)', marginBottom:4, fontWeight:500 }}>
      {label}{required && <span style={{ color:'var(--red)', fontSize:13, lineHeight:1 }}>*</span>}
    </label>
    {hint && <p style={{ fontSize:11, color:'var(--text3)', margin:'0 0 5px', lineHeight:1.5 }}>{hint}</p>}
    {children}
  </div>
)

const inputBase = { width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 13px', color:'var(--text)', fontSize:13.5, fontFamily:'Space Grotesk,sans-serif', outline:'none', transition:'border-color .2s', boxSizing:'border-box' }

const Input = ({ value, onChange, placeholder, autoFocus }) => (
  <input style={inputBase} value={value} placeholder={placeholder} autoFocus={autoFocus}
    onChange={e => onChange(e.target.value)}
    onFocus={e => e.target.style.borderColor = 'var(--amber-border)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
)

const Textarea = ({ value, onChange, placeholder, rows = 2 }) => (
  <textarea style={{ ...inputBase, resize:'vertical', lineHeight:1.6, minHeight: rows * 30 + 'px' }}
    value={value} placeholder={placeholder} rows={rows}
    onChange={e => onChange(e.target.value)}
    onFocus={e => e.target.style.borderColor = 'var(--amber-border)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
)

// ─── Styles ───────────────────────────────────────────────────────────────
const wrap         = { minHeight:'100%', overflowY:'auto', animation:'fadeIn .4s ease' }
const hero         = { padding:'32px 24px 20px', textAlign:'center' }
const heroAccent   = { display:'inline-block', fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--amber)', background:'var(--amber-dim)', border:'1px solid var(--amber-border)', borderRadius:20, padding:'4px 14px', marginBottom:12, letterSpacing:'0.1em' }
const heroTitle    = { fontFamily:'Space Grotesk,sans-serif', fontSize:'clamp(22px,5vw,36px)', fontWeight:700, color:'var(--text)', lineHeight:1.3, marginBottom:14 }
const heroFeatures = { display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }
const featurePill  = { display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, color:'var(--text3)', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 12px' }
const formWrap     = { maxWidth:720, margin:'0 auto', padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:10 }
const panel        = { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'16px 18px' }
const panelHeader  = { display:'flex', alignItems:'center', gap:8, marginBottom:16 }
const panelTitle   = { fontFamily:'JetBrains Mono,monospace', fontSize:11.5, fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--amber)' }
const panelDivider = { flex:1, height:1, background:'var(--border)', marginLeft:4 }
const fieldGrid    = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'0 16px' }
const pillRow      = { display:'flex', gap:7, flexWrap:'wrap', marginBottom:0 }
const pill         = active => ({ padding:'7px 15px', borderRadius:20, border:`1px solid ${active ? 'var(--amber-border)' : 'var(--border)'}`, background: active ? 'var(--amber-dim)' : 'transparent', color: active ? 'var(--amber)' : 'var(--text3)', fontSize:12.5, cursor:'pointer', fontFamily:'Space Grotesk,sans-serif', fontWeight: active ? 600 : 400, transition:'all .15s', whiteSpace:'nowrap' })
const collapseBtn  = { width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'Space Grotesk,sans-serif', gap:8 }
const progressPill = { fontSize:10, background:'var(--amber-dim)', color:'var(--amber)', border:'1px solid var(--amber-border)', padding:'2px 7px', borderRadius:20, fontWeight:600 }
const dropZone     = d => ({ border:`1.5px dashed ${d ? 'var(--amber)' : 'var(--border2)'}`, borderRadius:10, padding:'12px 20px', textAlign:'center', cursor:'pointer', transition:'all .2s', background: d ? 'var(--amber-dim)' : 'transparent' })
const fileCard     = { display:'flex', alignItems:'center', gap:8, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px' }
const removeBtn    = { background:'none', border:'none', cursor:'pointer', padding:'2px 4px', display:'flex', alignItems:'center', flexShrink:0 }
const ctaWrap      = { padding:'4px 0 36px', textAlign:'center' }
const ctaHint      = { fontSize:12.5, color:'var(--text3)', marginBottom:14 }
const startBtn     = ok => ({ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 44px', borderRadius:50, border:'none', background: ok ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'var(--bg3)', color: ok ? '#1a0f00' : 'var(--text3)', fontSize:16, fontWeight:700, fontFamily:'Space Grotesk,sans-serif', cursor: ok ? 'pointer' : 'not-allowed', transition:'all .3s', boxShadow: ok ? '0 4px 24px rgba(245,158,11,0.3)' : 'none' })
const ctaMeta      = { display:'flex', alignItems:'center', gap:6, justifyContent:'center', flexWrap:'wrap', fontSize:11.5, color:'var(--text3)', marginTop:10 }
