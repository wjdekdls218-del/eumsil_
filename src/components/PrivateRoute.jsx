import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { C, FONT } from '../theme'

export default function PrivateRoute({ children }) {
  const { user } = useAuth()

  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100dvh', background: C.bg, fontFamily: FONT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: C.gray, fontSize: 14 }}>로딩 중...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
