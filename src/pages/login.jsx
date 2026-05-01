import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../lib/auth'
import caregiver from '../assets/images/caregiver.png'
import doctorQr from '../assets/images/doctor_qr.png'
import elderlyUi from '../assets/images/elderly_easy_ui.png'

const slides = [
  {
    image: caregiver,
    title: 'Care Across Generations',
    desc: 'Help your parents and grandparents stay safe by keeping their medical reports organized, updated, and always within reach.'
  },
  {
    image: doctorQr,
    title: 'Fast Doctor Access',
    desc: 'Give doctors quick temporary access to essential medical records through a secure QR scan, so care can begin without delay.'
  },
  {
    image: elderlyUi,
    title: 'Built with Simplicity',
    desc: 'A clean and easy interface helps elderly users view and share their medical reports with comfort and confidence.'
  }
]

const inputStyle = {
  width: '100%', height: 48,
  borderRadius: 12, padding: '0 16px',
  background: 'rgba(255,255,255,0.2)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.3)',
  fontSize: 14, outline: 'none',
  boxSizing: 'border-box'
}

const labelStyle = {
  display: 'block', color: 'white',
  fontSize: 14, marginBottom: 8
}

export default function Login() {
  const [current, setCurrent] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900)
  const navigate = useNavigate()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const prevSlide = () => setCurrent((current - 1 + slides.length) % slides.length)
  const nextSlide = () => setCurrent((current + 1) % slides.length)

  const handleLogin = async () => {
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }
    setLoading(true)
    const { error } = await signIn({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  const carousel = (
    <div style={{
      position: 'relative', width: '100%',
      height: isMobile ? '50vh' : '100vh',
      overflow: 'hidden', flexShrink: 0
    }}>
      <img
        src={slides[current].image}
        alt={slides[current].title}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover'
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
      <div style={{
        position: 'absolute', bottom: 40,
        left: '50%', transform: 'translateX(-50%)',
        width: '80%', background: 'rgba(0,0,0,0.5)',
        borderRadius: 16, padding: '16px 20px',
        color: 'white', textAlign: 'center'
      }}>
        <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>
          {slides[current].title}
        </p>
        <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6 }}>
          {slides[current].desc}
        </p>
      </div>
      <button onClick={prevSlide} style={{
        position: 'absolute', left: 12,
        top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.4)', border: 'none',
        color: 'white', width: 40, height: 40,
        borderRadius: '50%', fontSize: 22, cursor: 'pointer'
      }}>‹</button>
      <button onClick={nextSlide} style={{
        position: 'absolute', right: 12,
        top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.4)', border: 'none',
        color: 'white', width: 40, height: 40,
        borderRadius: '50%', fontSize: 22, cursor: 'pointer'
      }}>›</button>
      <div style={{
        position: 'absolute', bottom: 12,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6
      }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            width: 8, height: 8, borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            background: i === current ? 'white' : 'rgba(255,255,255,0.4)'
          }} />
        ))}
      </div>
    </div>
  )

  const formPanel = (
    <div style={{
      background: '#1D717C',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px 32px',
      width: isMobile ? '100%' : '38%',
      height: isMobile ? 'auto' : '100vh',
      flexShrink: 0, boxSizing: 'border-box'
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <h1 style={{
          fontSize: 36, fontWeight: 700,
          color: 'white', marginBottom: 12
        }}>MEDI-CO</h1>

        <p style={{
          color: 'white', fontSize: 14,
          marginBottom: 32, lineHeight: 1.6, opacity: 0.9
        }}>
          Sign in to manage reports, scans, prescriptions,
          QR access, and elderly care records.
        </p>

        <h2 style={{
          fontSize: 24, fontWeight: 600,
          color: 'white', marginBottom: 24
        }}>Sign In</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', height: 48,
            background: 'white', color: '#1D717C',
            fontWeight: 600, borderRadius: 12,
            border: 'none', fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1
          }}>
          {loading ? 'Signing in...' : 'Log In'}
        </button>

        {error && (
          <p style={{
            color: '#ffcccc', fontSize: 13,
            textAlign: 'center', marginTop: 12
          }}>{error}</p>
        )}

        <p style={{
          color: 'white', fontSize: 14,
          textAlign: 'center', marginTop: 24
        }}>
          Not registered?{' '}
          <Link to="/signup" style={{ color: 'white', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>

      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh', width: '100vw'
      }}>
        {carousel}
        {formPanel}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'row',
      height: '100vh', width: '100vw', overflow: 'hidden'
    }}>
      {formPanel}
      <div style={{
        flex: 1, position: 'relative',
        overflow: 'hidden', height: '100vh'
      }}>
        {carousel}
      </div>
    </div>
  )
}