import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, EyeOff } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

const TABS = ['전체', '판매중', '나눔', '신고된 글']

const fmtDate = (ts) =>
  ts?.toDate?.().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) ?? ''

export default function AdminPosts() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [reportedIds, setReportedIds] = useState(new Set())
  const [tab, setTab] = useState('전체')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    getDocs(collection(db, 'reports')).then(snap => {
      const ids = new Set(
        snap.docs.filter(d => d.data().targetType === 'product').map(d => d.data().targetId)
      )
      setReportedIds(ids)
    })
  }, [])

  const filtered = posts.filter(p => {
    if (tab === '판매중')   return p.type === 'sell'
    if (tab === '나눔')     return p.type === 'share'
    if (tab === '신고된 글') return reportedIds.has(p.id)
    return true
  })

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, paddingBottom: 90 }}>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/admin')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>게시글 관리</h1>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.point }}>{filtered.length}개</span>
      </header>

      <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 14px', borderRadius: 999, border: 'none', flexShrink: 0,
            fontSize: 13, fontWeight: tab === t ? 700 : 500,
            background: tab === t ? C.point : C.white,
            color: tab === t ? C.white : C.gray,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>게시글이 없어요.</p>
        ) : filtered.map(post => (
          <div
            key={post.id}
            onClick={() => navigate(`/admin/posts/${post.id}`)}
            style={{
              background: post.hidden ? '#F8F3ED' : C.white,
              borderRadius: 14, padding: '12px', cursor: 'pointer',
              display: 'flex', gap: 12, alignItems: 'center',
              opacity: post.hidden ? 0.7 : 1,
            }}
          >
            {post.imageUrl ? (
              <img src={post.imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 10, background: C.grayLight, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                {post.hidden && <EyeOff size={12} color={C.gray} strokeWidth={1.8} />}
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.title}
                </p>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: post.type === 'share' ? C.point : C.text }}>
                {post.type === 'share' ? '나눔' : `${Number(post.price ?? 0).toLocaleString()}원`}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: C.gray }}>
                {post.nickname ?? '익명'} · {fmtDate(post.createdAt)}
              </p>
            </div>
            {reportedIds.has(post.id) && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#E53E3E', background: '#FFE8E8', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                신고
              </span>
            )}
          </div>
        ))}
      </div>

      <AdminNav />
    </div>
  )
}
