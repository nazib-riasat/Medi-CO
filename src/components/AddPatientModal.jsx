import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AddPatientModal({ managerId, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: '', date_of_birth: '', gender: '',
    blood_group: '', phone: '', nid: ''
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.full_name) {
      setError('Full name is required')
      return
    }
    setLoading(true)

    let profile_pic_url = null

    if (photoFile) {
      const { data: { user } } = await supabase.auth.getUser()
      const filePath = `${user.id}/${Date.now()}_${photoFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(filePath, photoFile)

      if (!uploadError) {
        const { data: signedData } = await supabase.storage
          .from('patient-photos')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365)
        profile_pic_url = signedData?.signedUrl
      }
    }

    console.log('Inserting patient with manager_id:', managerId)

    const { data, error } = await supabase
      .from('patient')
      .insert({
        manager_id: managerId,
        full_name: form.full_name,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        profile_pic_url,
        is_active: true
      })
      .select()

    console.log('Insert result:', data, 'Error:', error)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    onSaved()
  }

  const inputStyle = {
    width: '100%', height: 44, borderRadius: 10,
    padding: '0 14px', border: '1px solid #ddd',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    background: 'white', color: '#333'
  }

  const labelStyle = {
    display: 'block', fontSize: 13,
    fontWeight: 500, color: '#444', marginBottom: 6
  }

  const selectStyle = {
    height: 44, borderRadius: 10,
    border: '1px solid #ddd', fontSize: 14,
    outline: 'none', background: 'white',
    color: '#333', cursor: 'pointer',
    boxSizing: 'border-box'
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
        width: '100%', maxWidth: 460,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        margin: 'auto'
      }}>

        {/* Header */}
        <div style={{
          background: '#1D7C57', padding: '18px 24px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>
            Add New Patient
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'white', fontSize: 22, cursor: 'pointer'
          }}>X</button>
        </div>

        <div style={{ padding: 24 }}>

          {/* Photo Upload */}
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <div
              onClick={() => document.getElementById('patient-photo-input').click()}
              style={{
                width: 100, height: 100, borderRadius: '50%',
                border: '2px dashed #1D7C57',
                background: '#f0faf5',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
                margin: '0 auto 8px', overflow: 'hidden'
              }}>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 36, color: '#1D7C57' }}>+</span>
              )}
            </div>
            <p
              onClick={() => document.getElementById('patient-photo-input').click()}
              style={{ fontSize: 12, color: '#1D7C57', cursor: 'pointer' }}>
              Click to upload photo
            </p>
            <input
              id="patient-photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Full Name *</label>
            <input
              type="text"
              placeholder="Enter full name"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Date of Birth */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Date of Birth</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={form.date_of_birth ? form.date_of_birth.split('-')[2] : ''}
                onChange={e => {
                  const parts = form.date_of_birth ? form.date_of_birth.split('-') : ['', '', '']
                  update('date_of_birth', `${parts[0]}-${parts[1]}-${e.target.value}`)
                }}
                style={{ ...selectStyle, flex: 1 }}>
                <option value=''>DD</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d).padStart(2, '0')}>
                    {String(d).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={form.date_of_birth ? form.date_of_birth.split('-')[1] : ''}
                onChange={e => {
                  const parts = form.date_of_birth ? form.date_of_birth.split('-') : ['', '', '']
                  update('date_of_birth', `${parts[0]}-${e.target.value}-${parts[2]}`)
                }}
                style={{ ...selectStyle, flex: 1 }}>
                <option value=''>MM</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
              <select
                value={form.date_of_birth ? form.date_of_birth.split('-')[0] : ''}
                onChange={e => {
                  const parts = form.date_of_birth ? form.date_of_birth.split('-') : ['', '', '']
                  update('date_of_birth', `${e.target.value}-${parts[1]}-${parts[2]}`)
                }}
                style={{ ...selectStyle, flex: 2 }}>
                <option value=''>YYYY</option>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              placeholder="+880 17XXXXXXXX"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* NID */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>NID / Birth Reg</label>
            <input
              type="text"
              placeholder="Enter NID or birth registration"
              value={form.nid}
              onChange={e => update('nid', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Gender + Blood Group */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Gender</label>
              <select
                value={form.gender}
                onChange={e => update('gender', e.target.value)}
                style={{ ...selectStyle, width: '100%' }}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Blood Group</label>
              <select
                value={form.blood_group}
                onChange={e => update('blood_group', e.target.value)}
                style={{ ...selectStyle, width: '100%' }}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p style={{
              color: '#c62828', fontSize: 13,
              textAlign: 'center', marginBottom: 12
            }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onClose} style={{
              flex: 1, height: 44, borderRadius: 10,
              background: '#f0f0f0', color: '#333',
              border: 'none', fontWeight: 500, cursor: 'pointer'
            }}>Cancel</button>
            <button onClick={handleSave} disabled={loading} style={{
              flex: 2, height: 44, borderRadius: 10,
              background: '#1D7C57', color: 'white',
              border: 'none', fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.8 : 1
            }}>{loading ? 'Saving...' : 'Add Patient'}</button>
          </div>

        </div>
      </div>
    </div>
  )
}