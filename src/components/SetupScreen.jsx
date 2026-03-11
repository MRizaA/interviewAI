import { useState, useRef } from 'react'
import { processUploadedFile } from '../utils/helpers.js'

const DEFAULTS = {
  name: '', education: '', experience: '', skills: '', achievements: '',
  targetJob: '', targetCompany: '', interviewLang: 'English',
  struggles: '', aiPersona: 'a professional, encouraging interview coach who speaks both English and Indonesian',
  extraContext: '',
}

export default function SetupScreen({ initial, uploadedFiles, onFilesChange, onStart }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initial })
  const [files, setFiles] = useState(uploadedFiles || [])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleFiles = async (rawFiles) => {
    setUploading(true)
    const processed = []
    for (const f of Array.from(rawFiles)) {
      if (f.size > 10 * 1024 * 1024) { alert(`${f.name} terlalu besar (maks 10MB)`); continue }
      try {
        const p = await processUploadedFile(f)
        processed.push(p)
      } catch { alert(`Gagal baca ${f.name}`) }
    }
    const updated = [...files, ...processed]
    setFiles(updated)
    onFilesChange(updated)
    setUploading(false)
  }

  const removeFile = (i) => {
    const updated = files.filter((_, idx) => idx !== i)
    setFiles(updated)
    onFilesChange(updated)
  }

  const canStart = form.name.trim() && form.targetJob.trim()

  return (
    <div style={wrap}>
      {/* Hero */}
      <div style={hero}>
        <div style={heroTag}>Interview Coach AI</div>
        <h1 style={heroTitle}>Siapkan sesi<br /><span style={{ color:'var(--amber)' }}>wawancara</span> kamu</h1>
        <p style={heroSub}>Isi profil kamu dulu — semakin lengkap, semakin personal feedback-nya</p>
      </div>

      <div style={grid}>
        {/* LEFT: Your Profile */}
        <div style={panel}>
          <SectionTitle icon="👤" title="Profil Kamu" />

          <Field label="Nama lengkap *">
            <Input placeholder="e.g., Budi Santoso" value={form.name} onChange={v => set('name', v)} />
          </Field>
          <Field label="Pendidikan terakhir">
            <Input placeholder="e.g., S1 Teknik Informatika – Universitas XYZ, lulus 20XX" value={form.education} onChange={v => set('education', v)} />
          </Field>
          <Field label="Pengalaman kerja / magang">
            <Textarea placeholder="e.g., Magang web developer 3 bulan di PT. ABC – mengerjakan fitur backend dengan Laravel dan version control pakai GitHub" value={form.experience} onChange={v => set('experience', v)} rows={3} />
          </Field>
          <Field label="Skills / teknologi">
            <Input placeholder="e.g., Laravel, PHP, React, Git, REST API, MySQL" value={form.skills} onChange={v => set('skills', v)} />
          </Field>
          <Field label="Prestasi / pencapaian">
            <Textarea placeholder="e.g., Juara 1 lomba XXX tingkat provinsi, GPA 3.5" value={form.achievements} onChange={v => set('achievements', v)} rows={2} />
          </Field>

          <SectionTitle icon="🎯" title="Target Lamaran" />

          <Field label="Posisi yang dilamar *">
            <Input placeholder="e.g., Frontend Developer, Data Analyst, UI/UX Designer" value={form.targetJob} onChange={v => set('targetJob', v)} />
          </Field>
          <Field label="Nama perusahaan">
            <Input placeholder="e.g., PT. XYZ, Startup ABC" value={form.targetCompany} onChange={v => set('targetCompany', v)} />
          </Field>
          <Field label="Bahasa wawancara">
            <Select value={form.interviewLang} onChange={v => set('interviewLang', v)}
              options={['English','Bahasa Indonesia','Both (campur)']} />
          </Field>
          <Field label="Konteks tambahan / deskripsi pekerjaan">
            <Textarea placeholder="e.g., posisi ini butuh pengalaman dengan cloud computing, akan banyak bekerja dengan tim internasional" value={form.extraContext} onChange={v => set('extraContext', v)} rows={3} />
          </Field>
        </div>

        {/* RIGHT: Customization + Upload */}
        <div style={panel}>
          <SectionTitle icon="🤖" title="Kustomisasi AI Coach" />

          <Field label="Persona AI coach">
            <Textarea
              placeholder="e.g., a strict but encouraging senior developer who understands Indonesian work culture and gives honest feedback"
              value={form.aiPersona} onChange={v => set('aiPersona', v)} rows={3} />
          </Field>
          <Field label="Kesulitan kamu saat wawancara">
            <Textarea
              placeholder="e.g., sering ngeblank saat menjawab, susah menyusun kalimat bahasa Inggris yang runut, ingin AI kasih contoh jawaban versi lebih baik setelah aku menjawab"
              value={form.struggles} onChange={v => set('struggles', v)} rows={4} />
          </Field>

          <SectionTitle icon="📎" title="Upload Dokumen (Opsional)" />
          <p style={hint}>CV, job description, catatan, atau file pendukung lainnya<br/>
            <span style={{ color:'var(--text3)' }}>Format: PDF, gambar, txt — maks 10MB/file</span></p>

          <div
            style={dropZone(dragging)}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.md,image/*"
              style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />
            {uploading
              ? <div style={{ color:'var(--amber)',fontSize:13 }}>⏳ Memproses file...</div>
              : <>
                  <div style={{ fontSize:28,marginBottom:8 }}>📂</div>
                  <div style={{ fontSize:13,color:'var(--text2)' }}>Drag & drop atau <span style={{ color:'var(--amber)' }}>klik untuk pilih</span></div>
                </>
            }
          </div>

          {files.length > 0 && (
            <div style={{ marginTop:12,display:'flex',flexDirection:'column',gap:6 }}>
              {files.map((f, i) => (
                <div key={i} style={fileCard}>
                  <span style={{ fontSize:16 }}>{f.type==='image'?'🖼️':f.type==='pdf'?'📄':'📝'}</span>
                  <span style={{ flex:1,fontSize:12.5,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{f.name}</span>
                  <button onClick={() => removeFile(i)} style={removeBtn}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'flex',justifyContent:'center',padding:'24px 20px 36px' }}>
        <button style={startBtn(canStart)} disabled={!canStart} onClick={() => onStart(form)}>
          {canStart ? '🚀 Mulai Latihan Wawancara' : '⚠️ Isi nama & posisi dulu'}
        </button>
      </div>
    </div>
  )
}

const SectionTitle = ({ icon, title }) => (
  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16,marginTop:8 }}>
    <span style={{ fontSize:16 }}>{icon}</span>
    <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--amber)',fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase' }}>{title}</span>
    <div style={{ flex:1,height:1,background:'var(--border)',marginLeft:4 }} />
  </div>
)

const Field = ({ label, children }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'block',fontSize:11.5,color:'var(--text3)',marginBottom:5,fontWeight:500 }}>{label}</label>
    {children}
  </div>
)

const inputStyle = { width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 13px',color:'var(--text)',fontSize:13.5,fontFamily:'Space Grotesk,sans-serif',outline:'none',transition:'border-color .2s' }

const Input = ({ value, onChange, placeholder }) => (
  <input style={inputStyle} value={value} placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    onFocus={e => e.target.style.borderColor='var(--amber-border)'}
    onBlur={e => e.target.style.borderColor='var(--border)'} />
)

const Textarea = ({ value, onChange, placeholder, rows = 2 }) => (
  <textarea style={{ ...inputStyle, resize:'vertical', lineHeight:1.55, minHeight: rows*28+'px' }}
    value={value} placeholder={placeholder} rows={rows}
    onChange={e => onChange(e.target.value)}
    onFocus={e => e.target.style.borderColor='var(--amber-border)'}
    onBlur={e => e.target.style.borderColor='var(--border)'} />
)

const Select = ({ value, onChange, options }) => (
  <select style={{ ...inputStyle, cursor:'pointer' }} value={value} onChange={e => onChange(e.target.value)}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
)

const wrap = { minHeight:'100vh',overflowY:'auto',animation:'fadeIn .4s ease' }
const hero = { padding:'40px 24px 28px',textAlign:'center' }
const heroTag = { display:'inline-block',fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--amber)',background:'var(--amber-dim)',border:'1px solid var(--amber-border)',borderRadius:20,padding:'4px 14px',marginBottom:16,letterSpacing:'0.1em' }
const heroTitle = { fontFamily:'Space Grotesk,sans-serif',fontSize:'clamp(28px,5vw,42px)',fontWeight:700,color:'var(--text)',lineHeight:1.2,marginBottom:12 }
const heroSub = { fontSize:14,color:'var(--text2)',maxWidth:500,margin:'0 auto' }
const grid = { display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16,padding:'0 16px' }
const panel = { background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,padding:'20px 18px' }
const hint = { fontSize:12,color:'var(--text2)',lineHeight:1.6,marginBottom:12,marginTop:-8 }
const dropZone = d => ({ border:`2px dashed ${d?'var(--amber)':'var(--border2)'}`,borderRadius:12,padding:'24px 20px',textAlign:'center',cursor:'pointer',transition:'all .2s',background:d?'var(--amber-dim)':'transparent' })
const fileCard = { display:'flex',alignItems:'center',gap:8,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px' }
const removeBtn = { background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:12,padding:'2px 4px' }
const startBtn = ok => ({
  padding:'14px 40px', borderRadius:50, border:'none',
  background: ok ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'var(--bg3)',
  color: ok ? '#1a0f00' : 'var(--text3)',
  fontSize:16, fontWeight:700, fontFamily:'Space Grotesk,sans-serif',
  cursor: ok ? 'pointer' : 'not-allowed',
  transition:'all .3s',
  boxShadow: ok ? '0 4px 24px rgba(245,158,11,0.3)' : 'none',
})
