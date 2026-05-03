import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { C, FONT } from '../theme'
import { useAuth } from '../context/AuthContext'

export default function BannedScreen() {
  const { banInfo } = useAuth()

  return (
    <div style={{
      maxWidth: 390, margin: '0 auto', height: '100dvh',
      background: C.bg, fontFamily: FONT,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 999,
        background: '#FFE8E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 24,
      }}>
        🚫
      </div>
      <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
        계정이 정지되었어요
      </h1>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: C.gray, lineHeight: 1.6 }}>
        {banInfo.isPermanent
          ? '커뮤니티 이용 규칙 위반으로 계정이 영구 정지되었어요.'
          : '커뮤니티 이용 규칙 위반으로 계정이 일시 정지되었어요.'}
      </p>
      {!banInfo.isPermanent && banInfo.until && (
        <p style={{ margin: '4px 0 32px', fontSize: 15, fontWeight: 700, color: '#E53E3E' }}>
          {banInfo.until.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지
        </p>
      )}
      {banInfo.isPermanent && <div style={{ marginBottom: 32 }} />}
      <button
        onClick={() => signOut(auth)}
        style={{
          border: `1.5px solid ${C.border}`, background: C.white,
          borderRadius: 999, padding: '13px 32px',
          fontSize: 15, fontWeight: 600, color: C.text,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        로그아웃
      </button>
    </div>
  )
}
