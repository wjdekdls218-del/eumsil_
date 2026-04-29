import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Heart } from 'lucide-react'
import { C, FONT } from '../theme'
import { QUESTIONS, BADGE_COLORS } from '../data/communityData'

export default function CommunityPost() {
  const { id } = useParams()
  const navigate = useNavigate()

  const question = QUESTIONS.find(q => q.id === id)

  const [localAnswers, setLocalAnswers] = useState(() =>
    question?.answers ? [...question.answers] : []
  )
  const [input, setInput] = useState('')
  const [liked, setLiked] = useState(new Set())
  const [sortBy, setSortBy] = useState('latest')

  if (!question) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>질문방</span>
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: C.gray, fontSize: 14 }}>질문을 찾을 수 없어요.</p>
        </div>
      </div>
    )
  }

  const badge = BADGE_COLORS[question.category]

  const sortedAnswers = [...localAnswers].sort((a, b) =>
    sortBy === 'likes' ? b.likes - a.likes : b.ts - a.ts
  )

  const handleSend = () => {
    if (!input.trim()) return
    setLocalAnswers(prev => [...prev, {
      id: `a-new-${Date.now()}`,
      author: { id: 'me', name: '나', avatar: '😊' },
      body: input.trim(),
      likes: 0, isBest: false, createdAt: '방금 전', ts: Date.now(),
    }])
    setInput('')
  }

  const toggleLike = (answerId) => {
    setLiked(prev => {
      const next = new Set(prev)
      next.has(answerId) ? next.delete(answerId) : next.add(answerId)
      return next
    })
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
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>질문방</span>
      </header>

      {/* Content */}
      <div style={{ padding: '20px 16px 130px' }}>
        {/* Badge */}
        <span style={{
          display: 'inline-block', padding: '4px 12px', borderRadius: 999,
          fontSize: 11, fontWeight: 600,
          background: badge.bg, color: badge.text, marginBottom: 12,
        }}>
          {question.category}
        </span>

        {/* Title */}
        <h2 style={{ margin: '0 0 12px', fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.4 }}>
          {question.title}
        </h2>

        {/* Author + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => navigate(`/user/${question.author.id}`)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: C.point }}
          >
            {question.author.name}
          </button>
          <span style={{ fontSize: 12, color: C.gray }}>{question.createdAt}</span>
        </div>

        {/* Body */}
        <p style={{ margin: '0 0 24px', fontSize: 14, color: C.text, lineHeight: 1.75, letterSpacing: '-0.01em' }}>
          {question.body}
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

        {/* Answer count + sort toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.gray }}>
            답변 {localAnswers.length}개
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ key: 'latest', label: '최신순' }, { key: 'likes', label: '좋아요순' }].map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                style={{
                  padding: '5px 12px', borderRadius: 999, border: 'none',
                  fontSize: 12, fontWeight: sortBy === opt.key ? 700 : 500,
                  fontFamily: 'inherit', cursor: 'pointer',
                  background: sortBy === opt.key ? C.point : C.white,
                  color: sortBy === opt.key ? C.white : C.gray,
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedAnswers.map(answer => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              liked={liked.has(answer.id)}
              onLike={() => toggleLike(answer.id)}
              onUserClick={() => navigate(`/user/${answer.author.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Fixed input bar */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390,
        background: C.white, borderTop: `1px solid ${C.border}`,
        padding: '10px 16px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="답변을 입력하세요..."
          style={{
            flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 999,
            padding: '10px 16px', fontSize: 13, fontFamily: 'inherit',
            background: C.bg, color: C.text, outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            width: 42, height: 42, borderRadius: 999, border: 'none',
            background: input.trim() ? C.point : C.border,
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  )
}

function AnswerCard({ answer, liked, onLike, onUserClick }) {
  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '16px',
    }}>
      {/* Profile row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: C.grayLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {answer.author.avatar || '👤'}
        </div>
        <button
          onClick={onUserClick}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: C.text }}
        >
          {answer.author.name}
        </button>
        <span style={{ fontSize: 11, color: C.gray }}>{answer.createdAt}</span>
      </div>

      {/* Body */}
      <p style={{ margin: '0 0 12px', fontSize: 13, color: C.text, lineHeight: 1.7, letterSpacing: '-0.01em' }}>
        {answer.body}
      </p>

      {/* Like button */}
      <button
        onClick={onLike}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          border: `1px solid ${liked ? C.point : C.border}`,
          borderRadius: 999, padding: '4px 12px',
          background: liked ? `${C.point}15` : 'transparent',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <Heart size={12} fill={liked ? C.point : 'none'} color={liked ? C.point : C.gray} />
        <span style={{ fontSize: 12, color: liked ? C.point : C.gray, fontWeight: liked ? 600 : 400 }}>
          {answer.likes + (liked ? 1 : 0)}
        </span>
      </button>
    </div>
  )
}
