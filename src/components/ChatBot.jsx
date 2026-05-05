import { useState, useRef, useEffect } from 'react'

const SYSTEM_CONTEXT = `You are MEDI-CO Assistant, a helpful and friendly AI for family caregivers in Bangladesh managing elderly patients medical records.

You help with:
- General medical questions about medications, dosages, side effects and drug interactions
- Understanding medical reports, scans and terminology
- Psychological support and wellness advice for caregivers and patients
- How to use the MEDI-CO platform (uploading records, adding medications, generating doctor QR codes, viewing records)
- General health and wellness advice

Important rules:
- Always recommend consulting a real doctor for serious medical concerns
- Be simple, clear and empathetic in your responses
- Keep responses concise and easy to understand
- If asked about MEDI-CO features, explain them clearly
- You can respond in both English and Bangla based on what the user writes
- Never provide definitive diagnoses, always say consult your doctor`

export default function ChatBot({ triggerOpen }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! I am MEDI-CO Assistant. I can help you with medical questions, understanding reports, or how to use this platform. How can I help you today?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (triggerOpen) setIsOpen(true)
  }, [triggerOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages, isOpen])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMessage = { role: 'user', text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_KEY

      // Build full prompt with history
      const historyText = updatedMessages
        .slice(0, -1)
        .map(m => (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.text)
        .join('\n')

      const fullPrompt = SYSTEM_CONTEXT + '\n\n' + historyText + '\nUser: ' + text + '\nAssistant:'

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: fullPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512
            }
          })
        }
      )

      const data = await response.json()
      console.log('Gemini response:', JSON.stringify(data, null, 2))

      if (data.error) {
        console.error('Gemini error:', data.error)
        setMessages(prev => [...prev, {
          role: 'bot',
          text: 'API Error: ' + data.error.message
        }])
        setLoading(false)
        return
      }

      const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || 'Sorry, I could not get a response. Please try again.'

      setMessages(prev => [...prev, { role: 'bot', text: botText }])

    } catch (err) {
      console.error('Chatbot fetch error:', err)
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Network error: ' + err.message
      }])
    }

    setLoading(false)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          id="chatbot-trigger"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: 70, right: 24,
            width: 56, height: 56, borderRadius: '50%',
            background: '#1D7C57', border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            cursor: 'pointer', zIndex: 500,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24
          }}>
          💬
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 70, right: 24,
          width: 340, height: 500,
          background: 'white', borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          zIndex: 500, overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}>

          {/* Header */}
          <div style={{
            background: '#1D7C57', padding: '14px 18px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18
              }}>🤖</div>
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
                  MEDI-CO Assistant
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                  AI Health Guide
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none', border: 'none',
                color: 'white', fontSize: 20, cursor: 'pointer'
              }}>X</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '16px 14px', display: 'flex',
            flexDirection: 'column', gap: 12,
            background: '#f9f9f9'
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                {msg.role === 'bot' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#1D7C57', flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14,
                    marginRight: 8, alignSelf: 'flex-end'
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '75%', padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? '#1D7C57' : 'white',
                  color: msg.role === 'user' ? 'white' : '#2d2d2d',
                  fontSize: 13, lineHeight: 1.6,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  border: msg.role === 'bot' ? '1px solid #e8e8e8' : 'none',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#1D7C57',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14
                }}>🤖</div>
                <div style={{
                  padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
                  background: 'white', border: '1px solid #e8e8e8',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#1D7C57', opacity: 0.4,
                        animation: 'bounce 1s ease-in-out ' + (i * 0.2) + 's infinite'
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 14px', borderTop: '1px solid #e0e0e0',
            display: 'flex', gap: 8, background: 'white', flexShrink: 0
          }}>
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              style={{
                flex: 1, height: 40, borderRadius: 20,
                padding: '0 14px', border: '1px solid #ddd',
                fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: loading || !input.trim() ? '#ccc' : '#1D7C57',
                border: 'none', color: 'white', fontSize: 18,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              ›
            </button>
          </div>

        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  )
}