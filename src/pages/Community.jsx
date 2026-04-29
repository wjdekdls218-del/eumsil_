import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { C, FONT } from '../theme'
import { QUESTIONS, BADGE_COLORS } from '../data/communityData'

const TABS = ['전체', '실', '도구', '도안', '자유게시판']

export default function Community() {
  const [activeTab, setActiveTab] = useState('전체')
  const navigate = useNavigate()

  const filtered = activeTab === '전체'
    ? QUESTIONS
    : QUESTIONS.filter(q => q.category === activeTab)

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
      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(q => {
          const badge = BADGE_COLORS[q.category]
          return (
            <div
              key={q.id}
              onClick={() => navigate(`/community/${q.id}`)}
              style={{
                background: C.white, borderRadius: 16,
                padding: '16px', cursor: 'pointer',
                transition: 'opacity 0.1s',
              }}
            >
              {/* Category badge */}
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                fontSize: 11, fontWeight: 600,
                background: badge.bg, color: badge.text, marginBottom: 8,
              }}>
                {q.category}
              </span>

              {/* Title */}
              <p style={{
                margin: '0 0 6px', fontSize: 15, fontWeight: 700,
                color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4,
              }}>
                {q.title}
              </p>

              {/* Body preview */}
              <p style={{
                margin: '0 0 12px', fontSize: 12, color: C.gray, lineHeight: 1.5,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {q.body}
              </p>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.gray }}>
                <span style={{ fontWeight: 600, color: C.text }}>{q.author.name}</span>
                <span style={{ color: C.border }}>·</span>
                <span>답변 {q.answers.length}</span>
                <span style={{ color: C.border }}>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Heart size={11} color={C.point} fill={C.point} />
                  {q.likes}
                </span>
                <span style={{ marginLeft: 'auto' }}>{q.createdAt}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
