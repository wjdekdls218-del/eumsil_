import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, PenLine } from 'lucide-react'
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { BADGE_COLORS } from '../data/communityData'
import { db } from '../firebase'

const TABS = ['전체', '실', '도구', '도안', '자유게시판']

const formatTime = (ts) => {
  if (!ts?.toDate) return ''
  const diff = Date.now() - ts.toDate().getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default function Community() {
  const [activeTab, setActiveTab] = useState('전체')
  const [questions, setQuestions] = useState([])
  const [answerLikes, setAnswerLikes] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(collection(db, 'community'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  // 질문 목록이 바뀔 때 각 질문의 answers 좋아요 합산
  const questionIds = questions.map(q => q.id).join(',')
  useEffect(() => {
    if (!questionIds) return
    const ids = questionIds.split(',')
    Promise.all(
      ids.map(qid =>
        getDocs(collection(db, 'community', qid, 'answers'))
          .then(snap => {
            const total = snap.docs.reduce((sum, d) => sum + (d.data().likes ?? 0), 0)
            return [qid, total]
          })
      )
    ).then(entries => {
      const result = Object.fromEntries(entries)
      console.log('[Community] 답변 좋아요 합산:', result)
      setAnswerLikes(result)
    }).catch(err => console.error('[Community] 답변 좋아요 로드 실패:', err))
  }, [questionIds])

  const filtered = activeTab === '전체'
    ? questions
    : questions.filter(q => q.category === activeTab)

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: '22px 16px 0', background: C.bg }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.03em' }}>
          질문방
        </h1>
        <p style={{ fontSize: 13, color: C.point, marginTop: 6, lineHeight: 1.6, fontWeight: 500, letterSpacing: '-0.01em' }}>
          뜨다보면 생기는 고민<br />서로에게 물어봐요!
        </p>

        {/* Category tabs */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 14, marginBottom: 16,
          overflowX: 'auto', paddingBottom: 2,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0,
                padding: '7px 16px', borderRadius: 999,
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                fontFamily: 'inherit',
                background: activeTab === tab ? C.point : C.white,
                color: activeTab === tab ? C.white : C.gray,
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Question cards */}
      <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.gray, fontSize: 14 }}>
            아직 질문이 없어요.<br />첫 번째로 질문해보세요!
          </div>
        ) : filtered.map(q => {
          const badge = BADGE_COLORS[q.category] ?? { bg: C.grayLight, text: C.gray }
          return (
            <div
              key={q.id}
              onClick={() => navigate(`/community/${q.id}`)}
              style={{
                background: C.white, borderRadius: 16,
                padding: '16px', cursor: 'pointer',
              }}
            >
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                fontSize: 11, fontWeight: 600,
                background: badge.bg, color: badge.text, marginBottom: 8,
              }}>
                {q.category}
              </span>

              <p style={{
                margin: '0 0 6px', fontSize: 15, fontWeight: 700,
                color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4,
              }}>
                {q.title}
              </p>

              <p style={{
                margin: '0 0 12px', fontSize: 12, color: C.gray, lineHeight: 1.5,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {q.body}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.gray }}>
                <span style={{ fontWeight: 600, color: C.text }}>{q.author?.name ?? '익명'}</span>
                <span style={{ color: C.border }}>·</span>
                <span>답변 {q.answerCount ?? q.answers?.length ?? 0}</span>
                <span style={{ color: C.border }}>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Heart size={11} color={C.point} fill={C.point} />
                  {answerLikes[q.id] ?? 0}
                </span>
                <span style={{ marginLeft: 'auto' }}>{formatTime(q.createdAt)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390,
        height: 0, pointerEvents: 'none', zIndex: 99,
      }}>
        <button
          onClick={() => navigate('/community/write')}
          style={{
            position: 'absolute',
            bottom: 'calc(68px + 16px)',
            right: 16,
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: 6,
            background: C.point, color: C.white,
            border: 'none', borderRadius: 999,
            padding: '12px 20px',
            fontSize: 14, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(61,189,184,0.45)',
          }}
        >
          <PenLine size={16} color="white" strokeWidth={2} />
          질문하기
        </button>
      </div>
    </div>
  )
}
