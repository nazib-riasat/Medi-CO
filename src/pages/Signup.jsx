import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/auth'
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

const selectStyle = {
  height: 48, borderRadius: 12,
  padding: '0 8px',
  background: 'white',
  color: '#1D717C',
  border: '1px solid rgba(255,255,255,0.3)',
  fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
  cursor: 'pointer',
  fontWeight: 500
}

const labelStyle = {
  display: 'block', color: 'white',
  fontSize: 14, marginBottom: 8
}

export default function Signup() {
  const [current, setCurrent] = useState(0)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    confirmPassword: '', phone: '', dob: '', nid: ''
  })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const prevSlide = () => setCurrent((current - 1 + slides.length) % slides.length)
  const nextSlide = () => setCurrent((current + 1) % slides.length)
  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const getDay = () => form.dob ? form.dob.split('-')[2] || '' : ''
  const getMonth = () => form.dob ? form.dob.split('-')[1] || '' : ''
  const getYear = () => form.dob ? form.dob.split('-')[0] || '' : ''

  const updateDay = (val) => {
    const y = getYear() || 'YYYY'
    const m = getMonth() || 'MM'
    update('dob', `${y}-${m}-${val}`)
  }
  const updateMonth = (val) => {
    const y = getYear() || 'YYYY'
    const d = getDay() || 'DD'
    update('dob', `${y}-${val}-${d}`)
  }
  const updateYear = (val) => {
    const m = getMonth() || 'MM'
    const d = getDay() || 'DD'
    update('dob', `${val}-${m}-${d}`)
  }

  const handleContinue = () => {
    setError('')
    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setStep(2)
  }

  const handleSignup = async () => {
    setError('')
    if (!form.dob || !form.nid) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    const { error } = await signUp({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      phone: form.phone,
      dob: form.dob,
      nid: form.nid
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Account created! Redirecting to sign in...')
      setTimeout(() => navigate('/'), 1500)
    }
  }

  const carousel = (
    <div style={{
      position: 'relative', width: '100%',
      height: isMobile ? '35vh' : '100vh',
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
      flexShrink: 0, boxSizing: 'border-box',
      overflowY: 'auto',
      position: 'relative', zIndex: 1
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'white', marginBottom: 16 }}>
          MEDI-CO
        </h1>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'white', color: '#1D717C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0
          }}>1</div>
          <div style={{
            flex: 1, height: 2,
            background: step === 2 ? 'white' : 'rgba(255,255,255,0.3)',
            transition: 'background 0.3s'
          }} />
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: step === 2 ? 'white' : 'rgba(255,255,255,0.3)',
            color: step === 2 ? '#1D717C' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
            transition: 'all 0.3s'
          }}>2</div>
        </div>

        {step === 1 ? (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'white', marginBottom: 6 }}>
              Account Details
            </h2>
            <p style={{ color: 'white', fontSize: 13, opacity: 0.8, marginBottom: 24 }}>
              Step 1 of 2 — Create your login credentials
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={e => update('fullName', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +880 17XXXXXXXX"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleContinue()}
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ color: '#ffcccc', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button
              onClick={handleContinue}
              style={{
                width: '100%', height: 48,
                background: 'white', color: '#1D717C',
                fontWeight: 600, borderRadius: 12,
                border: 'none', fontSize: 16, cursor: 'pointer'
              }}>
              Continue →
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'white', marginBottom: 6 }}>
              Personal Details
            </h2>
            <p style={{ color: 'white', fontSize: 13, opacity: 0.8, marginBottom: 24 }}>
              Step 2 of 2 — Tell us about yourself
            </p>

            {/* Date of Birth */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Date of Birth</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={getDay()}
                  onChange={e => updateDay(e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}>
                  <option value=''>DD</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d).padStart(2, '0')}>
                      {String(d).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select
                  value={getMonth()}
                  onChange={e => updateMonth(e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}>
                  <option value=''>MM</option>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
                <select
                  value={getYear()}
                  onChange={e => updateYear(e.target.value)}
                  style={{ ...selectStyle, flex: 2 }}>
                  <option value=''>YYYY</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>NID Number</label>
              <input
                type="text"
                placeholder="Enter your NID number"
                value={form.nid}
                onChange={e => update('nid', e.target.value)}
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ color: '#ffcccc', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                {error}
              </p>
            )}

            {success && (
              <p style={{ color: '#90EE90', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                {success}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setStep(1); setError('') }}
                style={{
                  flex: 1, height: 48,
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white', fontWeight: 600,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: 15, cursor: 'pointer'
                }}>
                ← Back
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                style={{
                  flex: 2, height: 48,
                  background: 'white', color: '#1D717C',
                  fontWeight: 600, borderRadius: 12,
                  border: 'none', fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1
                }}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </>
        )}

        <p style={{ color: 'white', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/" style={{ color: 'white', fontWeight: 600 }}>
            Sign in
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