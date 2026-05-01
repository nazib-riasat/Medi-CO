import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const RECORD_TYPES = {
  'Upload Report': 'lab_report',
  'Upload Scan': 'scan',
  'Upload Prescription': 'prescription',
}

const PLACEHOLDERS = {
  'Upload Report': 'e.g. bloodtest_28/02/2026',
  'Upload Scan': 'e.g. xray_28/02/2026',
  'Upload Prescription': 'e.g. prescription_28/02/2026',
}

const NAME_REGEX = /^[a-zA-Z0-9]+_\d{2}\/\d{2}\/\d{4}$/

export default function UploadRecordModal({ patientId, recordLabel, onClose, onSaved }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [recordDate, setRecordDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameValid, setNameValid] = useState(null)

  const recordType = RECORD_TYPES[recordLabel] || 'other'
  const placeholder = PLACEHOLDERS[recordLabel] || 'e.g. reportname_28/02/2026'

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return
    setFile(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileChange(dropped)
  }

  const validateName = (value) => {
    setFileName(value)
    if (!value) { setNameValid(null); return }
    setNameValid(NAME_REGEX.test(value))
  }

  const handleUpload = async () => {
    setError('')
    if (!file) { setError('Please select a file'); return }
    if (!fileName) { setError('Please enter a file name'); return }
    if (!nameValid) { setError('File name must be in format: name_DD/MM/YYYY'); return }
    if (!recordDate) { setError('Please select a record date'); return }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/${patientId}/${Date.now()}_${fileName}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('medical-files')
      .upload(filePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setLoading(false)
      return
    }

    const { data: signedData } = await supabase.storage
      .from('medical-files')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365)

    const { error: dbError } = await supabase
      .from('medical_record')
      .insert({
        patient_id: patientId,
        record_type: recordType,
        title: fileName,
        file_url: filePath,
        file_type: file.type,
        file_size_bytes: file.size,
        notes: notes || null,
        record_date: recordDate
      })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    // Auto index keywords
    const keywords = fileName
      .split(/[_\s]+/)
      .filter(k => k.length > 1)

    const indexRows = keywords.map(keyword => ({
      patient_id: patientId,
      record_id: null,
      keyword: keyword.toLowerCase(),
      record_type: recordType
    }))

    setLoading(false)
    onSaved()
  }

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
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>
            {recordLabel}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'white', fontSize: 22, cursor: 'pointer'
          }}>X</button>
        </div>

        <div style={{ padding: 24 }}>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('record-file-input').click()}
            style={{
              border: `2px dashed ${dragging ? '#1D7C57' : '#ccc'}`,
              borderRadius: 14, padding: '32px 20px',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? '#f0faf5' : '#fafafa',
              marginBottom: 20, transition: 'all 0.2s'
            }}>
            {file ? (
              <>
                <p style={{ fontSize: 32, marginBottom: 8 }}>
                  {file.type.includes('image') ? '🖼️' : '📄'}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1D7C57' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB — click to change
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 36, marginBottom: 8 }}>📁</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#555' }}>
                  Drag & drop your file here
                </p>
                <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  or click to browse — PDF, JPG, PNG up to 10MB
                </p>
              </>
            )}
            <input
              id="record-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => handleFileChange(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>

          {/* File Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>File Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={placeholder}
                value={fileName}
                onChange={e => validateName(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: nameValid === false ? '#c62828'
                    : nameValid === true ? '#1D7C57' : '#ddd',
                  paddingRight: 36
                }}
              />
              {nameValid === true && (
                <span style={{
                  position: 'absolute', right: 12,
                  top: '50%', transform: 'translateY(-50%)',
                  color: '#1D7C57', fontSize: 18
                }}>✓</span>
              )}
              {nameValid === false && (
                <span style={{
                  position: 'absolute', right: 12,
                  top: '50%', transform: 'translateY(-50%)',
                  color: '#c62828', fontSize: 18
                }}>✗</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Format: name_DD/MM/YYYY &nbsp;|&nbsp; e.g. {placeholder.replace('e.g. ', '')}
            </p>
          </div>

          {/* Record Date */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Record Date</label>
            <input
              type="date"
              value={recordDate}
              onChange={e => setRecordDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              placeholder="Any additional notes about this record..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              style={{
                width: '100%', borderRadius: 10,
                padding: '10px 14px', border: '1px solid #ddd',
                fontSize: 14, outline: 'none',
                boxSizing: 'border-box', resize: 'none'
              }}
            />
          </div>

          {error && (
            <p style={{
              color: '#c62828', fontSize: 13,
              textAlign: 'center', marginBottom: 12
            }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{
              flex: 1, height: 44, borderRadius: 10,
              background: '#f0f0f0', color: '#333',
              border: 'none', fontWeight: 500, cursor: 'pointer'
            }}>Cancel</button>
            <button
              onClick={handleUpload}
              disabled={loading || !file || !nameValid}
              style={{
                flex: 2, height: 44, borderRadius: 10,
                background: loading || !file || !nameValid
                  ? '#ccc' : '#1D7C57',
                color: 'white', border: 'none',
                fontWeight: 600, cursor: loading || !file || !nameValid
                  ? 'not-allowed' : 'pointer'
              }}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}