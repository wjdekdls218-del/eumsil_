import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { C, FONT } from '../theme'
import { QUESTIONS, USERS } from '../data/communityData'

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const user = USERS[id]

  const userAnswers = []
  QUESTIONS.forEach(q => {
    q.answers.forEach(a => {
      if (a.author.id === id) {
        userAnswers.push({ question: q, answer: a })
      }
    })
  })

  if (!user) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>프로필</span>
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: C.gray, fontSize: 14 }}>유저를 찾을 수 없어요.</p>
        </div>
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
          background: C.grayLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, marginBottom: 14,
          border: `3px solid ${C.point}`,
        }}>
          {user.avatar}
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
          {user.name}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.gray }}>
          총 답변{' '}
          <span style={{ color: C.point, fontWeight: 700 }}>{userAnswers.length}</span>개
        </p>
      </div>

      {/* Answer history */}
      <div style={{ padding: '20px 16px 40px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.gray }}>답변 기록</p>

        {userAnswers.length === 0 ? (
          <p style={{ color: C.gray, fontSize: 14, textAlign: 'center', marginTop: 48 }}>
            아직 답변이 없어요
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {userAnswers.map(({ question, answer }) => (
              <div
                key={answer.id}
                onClick={() => navigate(`/community/${question.id}`)}
                style={{ background: C.white, borderRadius: 16, padding: '16px', cursor: 'pointer' }}
              >
                <p style={{
                  margin: '0 0 6px', fontSize: 14, fontWeight: 700,
                  color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4,
                }}>
                  {question.title}
                </p>
                <p style={{
                  margin: '0 0 8px', fontSize: 12, color: C.gray, lineHeight: 1.5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  내 답변: {answer.body}
                </p>
                <span style={{ fontSize: 11, color: C.border }}>{answer.createdAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
