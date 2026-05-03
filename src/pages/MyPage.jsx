import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, Star, ChevronRight, Pencil } from 'lucide-react'
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'

const STATUS_STYLE = {
  '판매중': { bg: C.text,    color: C.white },
  '나눔':   { bg: C.point,   color: C.white },
  '예약중': { bg: '#9E9E9E', color: C.white },
  '완료':   { bg: '#DDD5CB', color: '#9E9E9E' },
}

export default function MyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [myPosts, setMyPosts] = useState([])

  // Firestore에서 프로필 로드 (ProfileEdit 저장 후 돌아왔을 때도 재조회)
  useEffect(() => {
    if (!user) return
    let cancelled = false
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (cancelled) return
      if (snap.exists()) {
        setProfile(snap.data())
      } else {
        setProfile({ displayName: user.displayName, photoURL: user.photoURL })
      }
    })
    return () => { cancelled = true }
  }, [user?.uid, location.key])

  // 내 게시글 로드
  useEffect(() => {
    if (!user) return
    console.log('[MyPage] 게시글 쿼리 시작 uid:', user.uid)
    const q = query(
      collection(db, 'posts'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    getDocs(q)
      .then(snap => {
        console.log('[MyPage] 게시글 로드 완료:', snap.docs.length, '개')
        snap.docs.forEach(d => console.log('  -', d.id, d.data()))
        setMyPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
      .catch(err => {
        console.error('[MyPage] 게시글 쿼리 실패:', err)
        console.error('→ Firestore 콘솔에서 복합 인덱스(uid + createdAt)를 생성해야 할 수 있어요. 에러 메시지 링크를 클릭하세요.')
      })
  }, [user?.uid])

  const userName  = profile?.displayName || user?.displayName || '실뭉치'
  const userPhoto = profile?.photoURL    || user?.photoURL    || null
  const reviewCount = 0 // TODO: 실제 후기 수

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 16px 14px',
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
          마이페이지
        </h1>
        <button
          onClick={() => navigate('/settings')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <Settings size={22} color={C.text} strokeWidth={1.8} />
        </button>
      </header>

      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile card */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px 20px 18px', position: 'relative' }}>
          {/* 수정 버튼 */}
          <button
            onClick={() => navigate('/mypage/edit')}
            style={{
              position: 'absolute', top: 16, right: 16,
              border: 'none', background: 'transparent',
              cursor: 'pointer', padding: 4, display: 'flex',
            }}
          >
            <Pencil size={17} color={C.point} strokeWidth={1.8} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
              background: C.grayLight, overflow: 'hidden',
              border: `2.5px solid ${C.point}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34,
            }}>
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  referrerPolicy="no-referrer"
                />
              ) : '🧶'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, paddingRight: 24 }}>
              <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
                {userName}
              </p>
              <button
                onClick={() => navigate('/mypage/reviews')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  border: 'none', background: 'transparent', padding: 0,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {reviewCount > 0 ? (
                  <>
                    <Star size={14} color={C.point} fill={C.point} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>5.0</span>
                    <span style={{ fontSize: 13, color: C.gray }}>· 후기 {reviewCount}개</span>
                    <span style={{ fontSize: 12, color: C.gray, marginLeft: 1 }}>›</span>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: C.gray, letterSpacing: '-0.01em' }}>
                    첫 거래를 시작해보세요!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* My posts */}
        <section>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            내 게시글
          </h2>
          <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>
            {myPosts.length === 0 ? (
              <p style={{ margin: 0, padding: '20px 16px', fontSize: 13, color: C.gray, textAlign: 'center' }}>
                아직 올린 게시글이 없어요.
              </p>
            ) : myPosts.map((item, idx) => {
              const s = STATUS_STYLE[item.status] ?? STATUS_STYLE['판매중']
              return (
                <div key={item.id}>
                  <div
                    onClick={() => navigate(`/product/${item.id}`)}
                    style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: C.text,
                      letterSpacing: '-0.01em', flexShrink: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.type === 'share' ? C.point : C.gray, flexShrink: 0 }}>
                      {item.type === 'share' ? '나눔' : `${Number(item.price).toLocaleString()}원`}
                    </span>
                    <span style={{
                      marginLeft: 'auto', flexShrink: 0,
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
                    }}>
                      {item.status}
                    </span>
                  </div>
                  {idx < myPosts.length - 1 && (
                    <div style={{ height: 1, background: C.border, margin: '0 16px' }} />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Community activity */}
        <button
          onClick={() => navigate(`/user/${user?.uid ?? 'me'}`)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent', padding: '4px 0',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            질문방 활동
          </span>
          <ChevronRight size={18} color={C.text} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
