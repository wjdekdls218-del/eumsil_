import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Flag, Package, MessageSquare, Bell } from 'lucide-react'
import { C, FONT } from '../theme'

const TABS = [
  { path: '/admin',           label: '홈',    Icon: LayoutDashboard, exact: true },
  { path: '/admin/reports',   label: '신고',  Icon: Flag },
  { path: '/admin/posts',     label: '게시글', Icon: Package },
  { path: '/admin/community', label: '질문방', Icon: MessageSquare },
  { path: '/admin/notices',   label: '공지',  Icon: Bell },
]

export default function AdminNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (tab) =>
    tab.exact ? pathname === tab.path : pathname.startsWith(tab.path)

  return (
    <nav style={{
      position: 'fixed', bottom: 0,
      left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 390,
      background: '#1E1E2E',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 4px',
      paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {TABS.map(tab => {
        const active = isActive(tab)
        const { Icon } = tab
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              border: 'none', background: 'transparent',
              cursor: 'pointer', padding: '4px 10px',
              fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            <Icon size={22} color={active ? C.point : '#888'} strokeWidth={active ? 2 : 1.5} />
            <span style={{
              fontSize: 10, letterSpacing: '-0.01em',
              color: active ? C.point : '#888',
              fontWeight: active ? 700 : 400,
              fontFamily: FONT,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
