import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { QRCodeSVG } from 'qrcode.react'

export default function QRModal({ patient, manager, onClose }) {
  const [token, setToken] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    generateToken()
  }, [])

  useEffect(() => {
    if (!expiresAt) return
    const interval = setInterval(() => {
      const diff = new Date(expiresAt) - new Date()
      if (diff <= 0) {
        setTimeLeft(0)
        clearInterval(interval)
      } else {
        setTimeLeft(Math.floor(diff / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  async function generateToken() {
    setLoading(true)
    setError('')

    const tokenHash = crypto.randomUUID().replace(/-/g, '') +
                      crypto.randomUUID().replace(/-/g, '')

    const expires = new Date()
    expires.setMinutes(expires.getMinutes() + 30)

    const { data, error } = await supabase
      .from('qr_token')
      .insert({
        patient_id: patient.patient_id,
        generated_by: manager.manager_id,
        token_hash: tokenHash,
        expires_at: expires.toISOString(),
        is_used: false,
        access_scope: 'read_only'
      })
      .select()
      .single()

    if (error) { setError(error.message); setLoading(false); return }

    setToken(tokenHash)
    setExpiresAt(expires.toISOString())
    setTimeLeft(30 * 60)
    setLoading(false)
  }

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--'
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const qrUrl = token
  ? `${import.meta.env.VITE_APP_URL || window.location.origin}/doctor/${token}`
  : ''

  const isExpired = timeLeft === 0

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200, padding: 16
    }}>
      <div style={{
        background: 'white', borderRadius: 20,
        width: '100%', maxWidth: 420,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>

        {/* Header */}
        <div style={{
          background: '#1D7C57', padding: '18px 24px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ color: 'white', fontWeight: 600, fontSize: 18, marginBottom: 2 }}>
              Doctor QR Access
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {patient.full_name}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'white', fontSize: 22, cursor: 'pointer'
          }}>X</button>
        </div>

        <div style={{ padding: 24, textAlign: 'center' }}>

          {loading ? (
            <p style={{ color: '#888', padding: 40 }}>Generating QR code...</p>

          ) : error ? (
            <p style={{ color: '#c62828', padding: 40 }}>{error}</p>

          ) : isExpired ? (
            <div style={{ padding: 32 }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>🔒</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#c62828', marginBottom: 8 }}>
                Access Expired
              </p>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
                This QR code is no longer valid.
              </p>
              <button
                onClick={generateToken}
                style={{
                  padding: '10px 24px', background: '#1D7C57',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}>
                Generate New QR
              </button>
            </div>

          ) : (
            <>
              {/* Countdown */}
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                gap: 8, background: timeLeft < 300 ? '#fdecea' : '#f0faf5',
                padding: '8px 16px', borderRadius: 20, marginBottom: 20
              }}>
                <span style={{ fontSize: 14 }}>⏱</span>
                <span style={{
                  fontSize: 15, fontWeight: 700,
                  color: timeLeft < 300 ? '#c62828' : '#1D7C57'
                }}>
                  {formatTime(timeLeft)}
                </span>
                <span style={{ fontSize: 12, color: '#888' }}>remaining</span>
              </div>

              {/* QR Code */}
              <div style={{
                display: 'inline-block', padding: 16,
                background: 'white', borderRadius: 16,
                border: '2px solid #e0e0e0',
                marginBottom: 16
              }}>
                <QRCodeSVG
                  value={qrUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                Scan this QR code to access patient records
              </p>
              <p style={{ fontSize: 12, color: '#aaa' }}>
                Valid for 30 minutes from generation
              </p>

              <button
                onClick={generateToken}
                style={{
                  marginTop: 16, padding: '8px 20px',
                  background: 'white', color: '#1D7C57',
                  border: '1px solid #1D7C57', borderRadius: 10,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer'
                }}>
                Regenerate QR
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}