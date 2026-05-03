import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { doc, getDoc, collectionGroup, query, where, getDocs, orderBy } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // 유저 프로필 로드
      const profileSnap = await getDoc(doc(db, 'users', id))
      if (!cancelled) {
        setProfile(profileSnap.exists() ? profileSnap.data() : null)
      }

      // 해당 유저의 답변 로드 (collection group query)
      try {
        const q = query(
          collectionGroup(db, 'answers'),
          where('uid', '==', id),
          orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        if (!cancelled) {
          setAnswers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch (e) {
        // 인덱스 미생성 시 빈 배열 유지 (콘솔 에러의 링크를 클릭해 인덱스 생성 필요)
        console.warn('answers 쿼리 실패 (Firestore 인덱스 필요):', e)
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [id])

  const userName  = profile?.displayName ?? id
  const userPhoto = profile?.photoURL ?? null

  if (loading) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px', borderBottom: `1px solid ${C.border}`,
        background: C.bg, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>프로필</span>
      </header>

      {/* Profile card */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 16px 28px',
        background: C.white, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: C.grayLight, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14, border: `3px solid ${C.point}`,
        }}>
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={userName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke={C.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
          {userName}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.gray }}>
          총 답변 <span style={{ color: C.point, fontWeight: 700 }}>{answers.length}</span>개
        </p>
      </div>

      {/* Answer history */}
      <div style={{ padding: '20px 16px 40px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.gray }}>답변 기록</p>

        {answers.length === 0 ? (
          <p style={{ color: C.gray, fontSize: 14, textAlign: 'center', marginTop: 48 }}>
            아직 답변이 없어요
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {answers.map(answer => (
              <div
                key={answer.id}
                onClick={() => navigate(`/community/${answer.questionId}`)}
                style={{ background: C.white, borderRadius: 16, padding: '16px', cursor: 'pointer' }}
              >
                <p style={{
                  margin: '0 0 6px', fontSize: 14, fontWeight: 700,
                  color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4,
                }}>
                  {answer.questionTitle || '질문'}
                </p>
                <p style={{
                  margin: '0 0 8px', fontSize: 12, color: C.gray, lineHeight: 1.5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  내 답변: {answer.body}
                </p>
                <span style={{ fontSize: 11, color: C.border }}>
                  {answer.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') ?? ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
