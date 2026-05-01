import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AddMedicationModal({ patientId, onClose, onSaved }) {
  const [form, setForm] = useState({
    medicine_name: '', dose: '', unit: 'mg',
    morning: '0', afternoon: '0', night: '0',
    food_timing: 'after', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSave = async () => {
    if (!form.medicine_name) return
    setLoading(true)
    const timing = `${form.morning}+${form.afternoon}+${form.night} (${form.food_timing} food)`
    const dose = `${form.dose} ${form.unit}`
    await supabase.from('medication').insert({
      patient_id: patientId,
      medicine_name: form.medicine_name,
      dose,
      timing,
      notes: form.notes || null,
      is_active: true
    })
    setLoading(false)
    onSaved()
  }

  const inputStyle = {
    width: '100%', height: 44, borderRadius: 10,
    padding: '0 14px', border: '1px solid #ddd',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200, padding: 16
    }}>
      <div style={{
        background: 'white', borderRadius: 20,
        width: '100%', maxWidth: 460,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          background: '#1D7C57', padding: '18px 24px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>
            Add Medication
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'white', fontSize: 22, cursor: 'pointer'
          }}>X</button>
        </div>

        <div style={{ padding: 24 }}>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>
              Medicine Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Paracetamol"
              value={form.medicine_name}
              onChange={e => update('medicine_name', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>
              Dose
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="500"
                value={form.dose}
                onChange={e => update('dose', e.target.value)}
                style={{ ...inputStyle, flex: 2 }}
              />
              <select
                value={form.unit}
                onChange={e => update('unit', e.target.value)}
                style={{ ...inputStyle, flex: 1 }}>
                {['mg', 'ml', 'tablet', 'teaspoon', 'drops'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>
              Timing
            </label>
            <div style={{
              display: 'flex', gap: 8,
              background: '#f9f9f9', borderRadius: 10,
              padding: 12, border: '1px solid #ddd'
            }}>
              {[
                { label: 'Morning', field: 'morning' },
                { label: 'Afternoon', field: 'afternoon' },
                { label: 'Night', field: 'night' },
              ].map(({ label, field }) => (
                <div key={field} style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{label}</p>
                  <select
                    value={form[field]}
                    onChange={e => update(field, e.target.value)}
                    style={{
                      width: '100%', height: 36, borderRadius: 8,
                      border: '1px solid #ddd', fontSize: 14,
                      textAlign: 'center', cursor: 'pointer'
                    }}>
                    {['0', '0.5', '1', '1.5', '2'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 8 }}>
              Food Timing
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'before', label: 'Before food' },
                { value: 'after', label: 'After food' },
                { value: 'empty', label: 'Empty stomach' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => update('food_timing', value)}
                  style={{
                    flex: 1, padding: '8px 4px', fontSize: 12,
                    borderRadius: 8, cursor: 'pointer', fontWeight: 500,
                    background: form.food_timing === value ? '#1D7C57' : '#f0f0f0',
                    color: form.food_timing === value ? 'white' : '#444',
                    border: 'none'
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>
              Notes (optional)
            </label>
            <textarea
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              rows={3}
              style={{
                width: '100%', borderRadius: 10,
                padding: '10px 14px', border: '1px solid #ddd',
                fontSize: 14, outline: 'none',
                boxSizing: 'border-box', resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
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
            }}>{loading ? 'Saving...' : 'Save Medication'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}