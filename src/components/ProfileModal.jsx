import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ProfileModal({ manager, onClose, onSaved, onSignOut }) {
  const [form, setForm] = useState({
    full_name: manager.full_name || '',
    phone: manager.phone || '',
    dob: manager.dob || '',
    nid: manager.nid || '',
  })
  const [showNid, setShowNid] = useState(false)
  const [nidPassword, setNidPassword] = useState('')
  const [showNidPrompt, setShowNidPrompt] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSave = async () => {
    setError(''); setSuccess('')
    setLoading(true)
    const { error } = await supabase
      .from('manager')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        dob: form.dob || null,
        nid: form.nid,
      })
      .eq('manager_id', manager.manager_id)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('Profile updated successfully!')
    setTimeout(() => onSaved(), 1000)
  }

  const handleChangePassword = async () => {
    setError(''); setSuccess('')
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match'); return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters'); return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('Password changed successfully!')
    setNewPassword(''); setConfirmPassword('')
  }

  const handleRevealNid = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: manager.email,
      password: nidPassword
    })
    if (error) { setError('Incorrect password'); return }
    setShowNid(true)
    setShowNidPrompt(false)
    setNidPassword('')
    setTimeout(() => setShowNid(false), 30000)
  }

  const maskedNid = manager.nid
    ? '••••••••' + manager.nid.slice(-3)
    : 'Not set'

  const inputStyle = {
    width: '100%', height: 44, borderRadius: 10,
    padding: '0 14px', border: '1px solid #ddd',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block', fontSize: 13,
    fontWeight: 500, color: '#444', marginBottom: 6
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200,
      padding: 16, overflowY: 'auto'
    }}>
      <div style={{
        background: 'white', borderRadius: 20,
        width: '100%', maxWidth: 480,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        margin: 'auto'
      }}>

        {/* Header */}
        <div style={{
          background: '#1D7C57', padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h3 style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>
            Profile Settings
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'white', fontSize: 22, cursor: 'pointer'
          }}>X</button>
        </div>

        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>

          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Email - read only */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={manager.email}
              disabled
              style={{ ...inputStyle, background: '#f5f5f5', color: '#888' }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Date of Birth */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={e => update('dob', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* NID */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>NID Number</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={showNid ? (manager.nid || 'Not set') : maskedNid}
                disabled
                style={{ ...inputStyle, flex: 1, background: '#f5f5f5', color: '#333' }}
              />
              <button
                onClick={() => showNid ? setShowNid(false) : setShowNidPrompt(true)}
                style={{
                  padding: '0 14px', borderRadius: 10,
                  background: '#1D7C57', color: 'white',
                  border: 'none', fontSize: 13, cursor: 'pointer',
                  fontWeight: 500, whiteSpace: 'nowrap'
                }}>
                {showNid ? 'Hide' : 'Reveal'}
              </button>
            </div>
            {showNid && (
              <p style={{ fontSize: 12, color: '#e67e22', marginTop: 4 }}>
                Auto-hides in 30 seconds
              </p>
            )}
          </div>

          {/* NID Password Prompt */}
          {showNidPrompt && (
            <div style={{
              background: '#f9f9f9', borderRadius: 12,
              padding: 16, marginBottom: 14,
              border: '1px solid #e0e0e0'
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: '#333' }}>
                Enter your password to reveal NID
              </p>
              <input
                type="password"
                placeholder="Your password"
                value={nidPassword}
                onChange={e => setNidPassword(e.target.value)}
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowNidPrompt(false); setNidPassword('') }}
                  style={{
                    flex: 1, height: 38, borderRadius: 8,
                    background: '#f0f0f0', border: 'none',
                    cursor: 'pointer', fontSize: 13
                  }}>Cancel</button>
                <button
                  onClick={handleRevealNid}
                  style={{
                    flex: 2, height: 38, borderRadius: 8,
                    background: '#1D7C57', color: 'white',
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600
                  }}>Confirm</button>
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              width: '100%', height: 44, borderRadius: 10,
              background: '#1D7C57', color: 'white',
              border: 'none', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
              opacity: loading ? 0.8 : 1, marginBottom: 20
            }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: '#e0e0e0', marginBottom: 20 }} />

          {/* Change Password */}
          <h4 style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 14 }}>
            Change Password
          </h4>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            style={{
              width: '100%', height: 44, borderRadius: 10,
              background: '#f0f0f0', color: '#333',
              border: 'none', fontWeight: 600,
              fontSize: 14, cursor: 'pointer', marginBottom: 20
            }}>
            Update Password
          </button>

          {error && (
            <p style={{
              color: '#c62828', fontSize: 13,
              textAlign: 'center', marginBottom: 12
            }}>{error}</p>
          )}

          {success && (
            <p style={{
              color: '#1D7C57', fontSize: 13,
              textAlign: 'center', marginBottom: 12
            }}>{success}</p>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: '#e0e0e0', marginBottom: 20 }} />

          {/* Sign Out */}
          <button
            onClick={onSignOut}
            style={{
              width: '100%', height: 44, borderRadius: 10,
              background: '#fdecea', color: '#c62828',
              border: '1px solid #c62828', fontWeight: 600,
              fontSize: 14, cursor: 'pointer'
            }}>
            Sign Out
          </button>

        </div>
      </div>
    </div>
  )
}