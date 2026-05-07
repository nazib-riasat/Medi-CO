import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const FILTERS = ['All', 'lab_report', 'scan', 'prescription']

const FILTER_LABELS = {
  'All': 'All',
  'lab_report': 'Lab Reports',
  'scan': 'Scans',
  'prescription': 'Prescriptions',
}

const TYPE_ICONS = {
  'lab_report': '📄',
  'scan': '🩻',
  'prescription': '💊',
  'other': '📁'
}

export default function Records({ activePatient, onBack }) {
  const [records, setRecords] = useState([])
  const [filtered, setFiltered] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewingFile, setViewingFile] = useState(null)
  const [viewingUrl, setViewingUrl] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)

  useEffect(() => { if (activePatient) loadRecords() }, [activePatient])
  useEffect(() => { applyFilter() }, [records, activeFilter, search])

  async function loadRecords() {
    setLoading(true)
    const { data } = await supabase
      .from('medical_record').select('*')
      .eq('patient_id', activePatient.patient_id)
      .order('record_date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  function applyFilter() {
    let result = [...records]
    if (activeFilter !== 'All') {
      result = result.filter(r => r.record_type === activeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      )
      result.sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(q) ? 1 : 0
        const bExact = b.title.toLowerCase().startsWith(q) ? 1 : 0
        if (bExact !== aExact) return bExact - aExact
        return new Date(b.record_date) - new Date(a.record_date)
      })
    }
    setFiltered(result)
  }

  async function openFile(record) {
    setLoadingFile(true)
    setViewingFile(record)
    const { data } = await supabase.storage
      .from('medical-files')
      .createSignedUrl(record.file_url, 300)
    setViewingUrl(data?.signedUrl)
    setLoadingFile(false)
  }

  async function deleteRecord(record) {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    await supabase.storage.from('medical-files').remove([record.file_url])
    await supabase.from('medical_record').delete().eq('record_id', record.record_id)
    loadRecords()
  }

  if (viewingFile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', background: '#111', fontFamily: 'Poppins, sans-serif' }}>
        <div style={{ background: '#1D7C57', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button
            onClick={() => { setViewingFile(null); setViewingUrl(null) }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            Back
          </button>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>{viewingFile.title}</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            {FILTER_LABELS[viewingFile.record_type] || viewingFile.record_type}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {loadingFile ? (
            <p style={{ color: 'white', fontSize: 16 }}>Loading file...</p>
          ) : viewingUrl ? (
            viewingFile.file_type && viewingFile.file_type.includes('image') ? (
              <img
                src={viewingUrl}
                alt={viewingFile.title}
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }}
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', marginBottom: 8, fontSize: 15 }}>{viewingFile.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 24 }}>Tap below to open the file</p>
                  <a
                  href={viewingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '14px 28px', background: '#1D7C57', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15, display: 'inline-block' }}>
                  Open File
                </a>
              </div>
            )
          ) : (
            <p style={{ color: 'white' }}>Could not load file.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif' }}>

      <nav style={{ background: '#1D7C57', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            Back
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Records — {activePatient?.full_name}</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </nav>

      <div style={{ padding: 20, paddingBottom: 80 }}>

        <div style={{ marginBottom: 14 }}>
          <input
            type="search"
            placeholder="Search by file name or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: 42, borderRadius: 12, padding: '0 18px', border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{ padding: '6px 14px', borderRadius: 20, border: activeFilter === f ? '2px solid #1D7C57' : '2px solid #e0e0e0', background: activeFilter === f ? '#1D7C57' : 'white', color: activeFilter === f ? 'white' : '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', padding: 48 }}>Loading records...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#888' }}>
            <p style={{ fontSize: 40, marginBottom: 10 }}>📂</p>
            <p style={{ fontSize: 15, fontWeight: 500 }}>No records found</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              {search ? 'Try a different search term' : 'Upload records from the dashboard'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(record => (
              <div
                key={record.record_id}
                onClick={() => openFile(record)}
                style={{ background: 'white', borderRadius: 12, padding: '12px 16px', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0faf5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {TYPE_ICONS[record.record_type] || '📁'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2d2d', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.title}
                  </p>
                  <p style={{ fontSize: 12, color: '#888' }}>
                    {FILTER_LABELS[record.record_type]} · {record.record_date ? new Date(record.record_date).toLocaleDateString('en-GB') : 'No date'}
                    {record.notes && ` · ${record.notes}`}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 11, color: '#bbb', marginBottom: 4 }}>
                    {record.file_size_bytes ? `${(record.file_size_bytes / 1024).toFixed(0)} KB` : ''}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); deleteRecord(record) }}
                    style={{ padding: '3px 8px', fontSize: 11, background: '#fdecea', color: '#c62828', border: '1px solid #c62828', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{ background: '#1D7C57', color: 'white', textAlign: 'center', padding: '12px', fontSize: 13, position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 100 }}>
        Developed & Maintained by @Medi-Co
      </footer>

    </div>
  )
}