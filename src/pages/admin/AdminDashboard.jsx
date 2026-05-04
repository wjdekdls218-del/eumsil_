import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

function todayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function StatCard({ label, value, sub, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.white, borderRadius: 16, padding: '18px 16px',
        cursor: 'pointer', flex: 1,
        borderTop: `3px solid ${accent}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 12, color: C.gray, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '0 0 2px', fontSize: 30, fontWeight: 800, color: C.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: C.gray }}>{sub}</p>
    </div>
  )
}

const SHORTCUTS = [
  { label: '신고 관리',    desc: '신고 처리 및 제재 조치',   path: '/admin/reports',   accent: '#E53E3E' },
  { label: '게시글 관리',  desc: '게시글 삭제 및 숨김 처리', path: '/admin/posts',     accent: C.point },
  { label: '질문방 관리',  desc: '질문 및 답변 관리',         path: '/admin/community', accent: '#7C3AED' },
  { label: '공지사항 관리', desc: '공지 작성 및 편집',         path: '/admin/notices',   accent: '#D97706' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({ reports: 0, posts: 0, community: 0, notices: 0 })

  useEffect(() => {
    const start = todayStart()
    const isToday = (ts) => ts?.toDate?.() >= start

    const subs = [
      onSnapshot(collection(db, 'reports'), s =>
        setCounts(p => ({ ...p, reports: s.docs.filter(d => isToday(d.data().createdAt)).length }))),
      onSnapshot(collection(db, 'posts'), s =>
        setCounts(p => ({ ...p, posts: s.docs.filter(d => isToday(d.data().createdAt)).length }))),
      onSnapshot(collection(db, 'community'), s =>
        setCounts(p => ({ ...p, community: s.docs.filter(d => isToday(d.data().createdAt)).length }))),
      onSnapshot(collection(db, 'notices'), s =>
        setCounts(p => ({ ...p, notices: s.size }))),
    ]
    return () => subs.forEach(u => u())
  }, [])

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, paddingBottom: 90 }}>
      <header style={{ padding: '28px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
            관리자 페이지
          </h1>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.white,
            background: C.point, borderRadius: 999, padding: '4px 12px',
          }}>
            ADMIN
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.gray }}>{dateStr}</p>
      </header>

      <section style={{ padding: '0 16px 24px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text }}>오늘 현황</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <StatCard label="신규 신고" value={counts.reports} sub="건" accent="#E53E3E"
            onClick={() => navigate('/admin/reports')} />
          <StatCard label="신규 게시글" value={counts.posts} sub="개" accent={C.point}
            onClick={() => navigate('/admin/posts')} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard label="신규 질문" value={counts.community} sub="개" accent="#7C3AED"
            onClick={() => navigate('/admin/community')} />
          <StatCard label="전체 공지" value={counts.notices} sub="개" accent="#D97706"
            onClick={() => navigate('/admin/notices')} />
        </div>
      </section>

      <section style={{ padding: '0 16px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text }}>바로 가기</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SHORTCUTS.map(item => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: C.white, borderRadius: 14, padding: '16px 18px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{ width: 6, height: 36, borderRadius: 3, background: item.accent, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.gray }}>{item.desc}</p>
              </div>
              <ChevronRight size={16} color={C.gray} strokeWidth={1.8} />
            </div>
          ))}
        </div>
      </section>

      <AdminNav />
    </div>
  )
}
