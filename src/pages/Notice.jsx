import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { C, FONT } from '../theme'

const NOTICES = [
  {
    id: 1,
    title: '이음실 서비스 오픈 안내',
    date: '2025.01.01',
    body: `안녕하세요, 이음실입니다.

뜨개질을 사랑하는 모든 분들을 위한 커뮤니티, 이음실이 정식 오픈했습니다.

이음실에서는 실, 도구, 도안 등 뜨개 관련 물품을 자유롭게 사고팔고 나눌 수 있으며, 질문방을 통해 서로의 경험을 나눌 수 있습니다.

앞으로도 더 나은 서비스로 찾아뵙겠습니다. 감사합니다.`,
  },
  {
    id: 2,
    title: '커뮤니티 이용 규칙 안내',
    date: '2025.01.05',
    body: `이음실을 이용해 주시는 모든 분들께 감사드립니다.

원활하고 즐거운 서비스 이용을 위해 아래 규칙을 꼭 지켜주세요.

1. 타인을 비방하거나 불쾌감을 주는 게시글은 삭제될 수 있습니다.
2. 허위 정보나 사기성 거래는 즉시 계정 정지 처리됩니다.
3. 상업적 광고 및 홍보성 게시글은 금지됩니다.
4. 개인정보(전화번호, 주소 등)는 채팅을 통해서만 공유해 주세요.

건강한 뜨개 커뮤니티를 함께 만들어 나가요!`,
  },
  {
    id: 3,
    title: '질문방 기능 업데이트 안내',
    date: '2025.02.10',
    body: `이음실 질문방에 새로운 기능이 추가되었습니다.

• 답변 좋아요 기능: 도움이 된 답변에 좋아요를 눌러 감사함을 전달하세요.
• 답변 정렬: 최신순 / 좋아요순으로 답변을 정렬할 수 있습니다.
• 카테고리 필터: 실, 도구, 도안, 자유게시판 카테고리별로 질문을 필터링하세요.

앞으로도 더 편리한 기능으로 찾아뵙겠습니다.`,
  },
]

export default function Notice() {
  const navigate = useNavigate()

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
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>공지사항</span>
      </header>

      <div style={{ padding: '20px 16px 60px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NOTICES.slice().reverse().map(notice => (
          <div key={notice.id} style={{ background: C.white, borderRadius: 16, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4 }}>
                {notice.title}
              </p>
              <span style={{ fontSize: 11, color: C.gray, flexShrink: 0, marginLeft: 12 }}>{notice.date}</span>
            </div>
            <p style={{
              margin: 0, fontSize: 13, color: '#4A4A4A',
              lineHeight: 1.8, letterSpacing: '-0.01em',
              whiteSpace: 'pre-line',
            }}>
              {notice.body}
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}
