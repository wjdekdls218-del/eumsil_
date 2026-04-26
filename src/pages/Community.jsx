import { C, FONT } from '../theme'

export default function Community() {
  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      <header style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>커뮤니티</span>
      </header>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 57px - 68px)' }}>
        <p style={{ color: C.gray, fontSize: 14 }}>준비 중입니다</p>
      </div>
    </div>
  )
}
