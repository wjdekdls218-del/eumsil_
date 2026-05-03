import { useNavigate, useLocation } from 'react-router-dom'
import { C } from '../theme'
import { useNotifications } from '../context/NotificationsContext'

const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24"
    fill={active ? C.point : 'none'}
    stroke={active ? C.point : C.gray}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const ChatIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke={active ? C.point : C.gray}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const GridIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? C.point : C.gray}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

const UserIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke={active ? C.point : C.gray}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export default function BottomNav() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const { chatCount, answerCount } = useNotifications()

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  const tabs = [
    { path: '/',          label: '홈',        icon: (a) => <HomeIcon active={a} /> },
    { path: '/chat',      label: '채팅',       icon: (a) => <ChatIcon active={a} />, badge: chatCount },
    { path: '/write',     label: null,         icon: null, isWrite: true },
    { path: '/community', label: '질문방',     icon: (a) => <GridIcon active={a} />, badge: answerCount },
    { path: '/mypage',    label: '마이페이지', icon: (a) => <UserIcon active={a} /> },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0,
      left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 390,
      background: C.white,
      borderTop: `1px solid ${C.border}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 4px',
      paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {tabs.map((tab) => {
        const active = isActive(tab.path)
        const badge  = tab.badge ?? 0
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
            {tab.isWrite ? (
              <div style={{
                width: 48, height: 48, borderRadius: 999,
                background: C.point,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(61,189,184,0.4)',
              }}>
                <PlusIcon />
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  {tab.icon(active)}
                  {badge > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: -1,
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#FF4444',
                      border: `1.5px solid ${C.white}`,
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: 10, letterSpacing: '-0.01em',
                  color: active ? C.point : C.gray,
                  fontWeight: active ? 700 : 400,
                }}>
                  {tab.label}
                </span>
              </>
            )}
          </button>
        )
      })}
    </nav>
  )
}
