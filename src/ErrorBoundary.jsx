import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0c0c0e', color: '#e5e3de', fontFamily: 'Space Grotesk, sans-serif',
          padding: '2rem', textAlign: 'center', gap: '1rem'
        }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Terjadi kesalahan tak terduga</h2>
          <p style={{ margin: 0, color: '#7c7a75', fontSize: '0.9rem', maxWidth: '360px' }}>
            {this.state.error?.message || 'Silakan muat ulang halaman.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem', padding: '0.6rem 1.4rem',
              background: '#f59e0b', color: '#0c0c0e',
              border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
            }}
          >
            Muat Ulang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
