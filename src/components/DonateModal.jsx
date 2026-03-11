export default function DonateModal({ onClose }) {
  const MAYAR_LINK = 'https://mayar.to/muhammad-riza-aditya'

  const shareApp = () => {
    const url = window.location.href
    const text = 'Nemu app latihan wawancara kerja gratis pake AI, lumayan bantu banget. Cobain: '
    if (navigator.share) {
      navigator.share({ title: 'Interview Coach AI', text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link disalin!'))
    }
  }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <button style={xbtn} onClick={onClose}>✕</button>

        <div style={tag}>dari developer</div>

        <p style={body}>
          App ini gratis{' '}
          <span style={muted}>
            Tapi kalau app ini ngebantu persiapan interview kamu,
            boleh nih traktir admin kuota — seikhlasnya aja.
            Dukung saya biar bisa bikin sesuatu yang lebih berguna lagi.
          </span>
        </p>

        <p style={warmth}>
          Semoga dapat pekerjaan yang sesuai ya.
        </p>

        <a href={MAYAR_LINK} target="_blank" rel="noopener noreferrer" style={mainBtn}>
          bantu donasi admin beli kuota
        </a>

        <button style={shareBtn} onClick={shareApp}>
          atau share ke temen yang lagi butuh
        </button>

        <div style={footer}>dibuat oleh Muhammad Riza Aditya</div>
      </div>
    </div>
  )
}

const ov = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.82)',
  backdropFilter: 'blur(12px)',
  zIndex: 300,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
  animation: 'fadeIn .2s ease',
}
const modal = {
  background: '#0f0f13',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: '32px 26px 24px',
  width: '100%', maxWidth: 360,
  position: 'relative',
  animation: 'fadeUp .25s ease',
}
const xbtn = {
  position: 'absolute', top: 14, right: 14,
  background: 'none', border: 'none',
  color: '#555', cursor: 'pointer', fontSize: 15,
  padding: '2px 6px',
}
const tag = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  color: '#555',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: 16,
}
const body = {
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: 18,
  fontWeight: 700,
  color: '#f59e0b',
  lineHeight: 1.6,
  margin: '0 0 14px',
}
const muted = {
  fontWeight: 400,
  color: '#f0ede8',
  fontSize: 14,
}
const warmth = {
  fontSize: 13,
  color: '#6b6560',
  fontStyle: 'italic',
  margin: '0 0 24px',
}
const mainBtn = {
  display: 'block',
  textAlign: 'center',
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  color: '#1a0f00',
  padding: '13px 20px',
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 14,
  fontFamily: 'Space Grotesk, sans-serif',
  marginBottom: 8,
}
const shareBtn = {
  display: 'block',
  width: '100%',
  textAlign: 'center',
  background: 'transparent',
  border: '1px solid #222',
  color: '#555',
  padding: '11px 20px',
  borderRadius: 12,
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'Space Grotesk, sans-serif',
  marginBottom: 20,
}
const footer = {
  textAlign: 'center',
  fontSize: 11,
  color: '#333',
  fontStyle: 'italic',
}
