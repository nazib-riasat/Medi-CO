export default function VerifyEmail() {
  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: '#1D717C',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 32
    }}>
      <div style={{ textAlign: 'center', color: 'white', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>📧</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          Check your email
        </h1>
        <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.7 }}>
          We sent a verification link to your email address.
          Click the link to activate your account and start using MEDI-CO.
        </p>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 24 }}>
          Didn't receive it? Check your spam folder.
        </p>
      </div>
    </div>
  )
}