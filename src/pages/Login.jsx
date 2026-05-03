import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { C, FONT } from '../theme'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 13.252 17.64 11.336 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/', { replace: true })
    } catch (e) {
      console.error('로그인 실패:', e)
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: 390, margin: '0 auto', minHeight: '100dvh',
      background: C.bg, fontFamily: FONT,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 32px',
    }}>
      {/* 로고 */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>🧶</div>
        <h1 style={{
          margin: '0 0 12px', fontSize: 34, fontWeight: 800,
          color: C.text, letterSpacing: '-0.04em',
        }}>
          이음실<span style={{ color: C.point }}>.</span>
        </h1>
        <p style={{
          margin: 0, fontSize: 15, color: C.gray,
          lineHeight: 1.65, letterSpacing: '-0.01em',
        }}>
          뜨개 재료를 쉽게 나누고<br />거래해요
        </p>
      </div>

      {/* 구글 로그인 버튼 */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '15px 24px', borderRadius: 999,
          background: C.white, border: `1.5px solid ${C.border}`,
          fontSize: 15, fontWeight: 700, color: C.text,
          cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit', letterSpacing: '-0.01em',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <GoogleIcon />
        {loading ? '로그인 중...' : 'Google로 로그인'}
      </button>
    </div>
  )
}
