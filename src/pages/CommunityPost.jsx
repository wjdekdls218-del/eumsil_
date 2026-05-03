import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Heart, MoreVertical } from 'lucide-react'
import {
  doc, getDoc, deleteDoc, addDoc, updateDoc,
  collection, query, orderBy, onSnapshot,
  serverTimestamp, increment,
} from 'firebase/firestore'
import { C, FONT } from '../theme'
import { BADGE_COLORS } from '../data/communityData'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const formatTime = (ts) => {
  if (!ts?.toDate) return typeof ts === 'string' ? ts : ''
  const diff = Date.now() - ts.toDate().getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

function DefaultAvatar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={C.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 390,
        background: C.white, borderRadius: '20px 20px 0 0',
        padding: '28px 24px 36px',
      }}>
        <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
          정말 삭제할까요?
        </p>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: C.gray }}>
          삭제된 글은 복구할 수 없어요.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '13px', borderRadius: 999,
            border: `1.5px solid ${C.border}`, background: C.white,
            fontSize: 15, fontWeight: 600, color: C.text,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            취소
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '13px', borderRadius: 999,
            border: 'none', background: '#E53E3E',
            fontSize: 15, fontWeight: 700, color: C.white,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            삭제하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState([])
  const [input, setInput] = useState('')
  const [liked, setLiked] = useState(new Set())
  const [sortBy, setSortBy] = useState('latest')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [sending, setSending] = useState(false)
  const [questionLiked, setQuestionLiked] = useState(false)

  // 질문 로드
  useEffect(() => {
    getDoc(doc(db, 'community', id))
      .then(snap => {
        if (snap.exists()) setQuestion({ id: snap.id, ...snap.data() })
      })
      .finally(() => setLoading(false))
  }, [id])

  // 답변 실시간 구독 (subcollection)
  useEffect(() => {
    const q = query(
      collection(db, 'community', id, 'answers'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      console.log('[CommunityPost] 답변 onSnapshot:', data.length, '개', data)
      setAnswers(data)
    }, err => {
      console.error('[CommunityPost] 답변 구독 실패:', err)
    })
  }, [id])

  const sortedAnswers = [...answers].sort((a, b) => {
    if (sortBy === 'likes') return (b.likes ?? 0) - (a.likes ?? 0)
    const tA = a.createdAt?.toDate?.()?.getTime() ?? 0
    const tB = b.createdAt?.toDate?.()?.getTime() ?? 0
    return tB - tA
  })

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const body = input.trim()
    setInput('')

    let nickname = user?.displayName ?? '익명'
    let profileImage = user?.photoURL ?? ''
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        nickname     = snap.data().displayName || nickname
        profileImage = snap.data().photoURL    || profileImage
      }
    } catch {}

    await addDoc(collection(db, 'community', id, 'answers'), {
      uid: user?.uid ?? '',
      nickname,
      profileImage,
      body,
      likes: 0,
      createdAt: serverTimestamp(),
      questionId: id,
      questionTitle: question?.title ?? '',
    })

    await updateDoc(doc(db, 'community', id), {
      answerCount: increment(1),
    })

    // 질문 작성자에게 답변 알림 생성 (내 질문에 내가 답변하는 경우 제외)
    const questionAuthorUid = question?.uid ?? question?.author?.id
    if (questionAuthorUid && questionAuthorUid !== (user?.uid ?? '')) {
      addDoc(collection(db, 'notifications'), {
        uid: questionAuthorUid,
        type: 'answer',
        message: `${nickname}님이 답변을 달았어요`,
        relatedId: id,
        isRead: false,
        createdAt: serverTimestamp(),
      }).catch(err => console.error('[CommunityPost] 알림 생성 실패:', err))
    }

    setSending(false)
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 100)
  }

  const handleDelete = async () => {
    await deleteDoc(doc(db, 'community', id))
    navigate('/community', { replace: true })
  }

  const toggleQuestionLike = async () => {
    const willLike = !questionLiked
    setQuestionLiked(willLike)
    try {
      await updateDoc(doc(db, 'community', id), {
        likes: increment(willLike ? 1 : -1),
      })
      console.log('[CommunityPost] 질문 좋아요 저장 완료:', willLike ? '+1' : '-1')
    } catch (err) {
      console.error('[CommunityPost] 질문 좋아요 실패:', err)
      setQuestionLiked(!willLike)
    }
  }

  const toggleLike = async (answerId) => {
    const isLiked = liked.has(answerId)
    console.log('[CommunityPost] toggleLike answerId:', answerId, '→', isLiked ? '취소' : '좋아요')
    setLiked(prev => {
      const next = new Set(prev)
      isLiked ? next.delete(answerId) : next.add(answerId)
      return next
    })
    try {
      await updateDoc(doc(db, 'community', id, 'answers', answerId), {
        likes: increment(isLiked ? -1 : 1),
      })
      console.log('[CommunityPost] 좋아요 Firestore 저장 완료')
    } catch (err) {
      console.error('[CommunityPost] 좋아요 저장 실패:', err)
    }
  }

  const isOwner = user?.uid && question?.uid === user.uid
    || user?.uid && question?.author?.id === user.uid

  if (loading) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
      </div>
    )
  }

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

  const badge = BADGE_COLORS[question.category] ?? { bg: C.grayLight, text: C.gray }

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
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>질문방</span>

      </header>

      {/* Content */}
      <div ref={scrollRef} style={{ padding: '20px 16px 130px' }}>
        <span style={{
          display: 'inline-block', padding: '4px 12px', borderRadius: 999,
          fontSize: 11, fontWeight: 600,
          background: badge.bg, color: badge.text, marginBottom: 12,
        }}>
          {question.category}
        </span>

        <h2 style={{ margin: '0 0 12px', fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.4 }}>
          {question.title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => navigate(`/user/${question.uid ?? question.author?.id ?? 'me'}`)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: C.point }}
          >
            {question.author?.name ?? '익명'}
          </button>
          <span style={{ fontSize: 12, color: C.gray }}>{formatTime(question.createdAt)}</span>

          {isOwner && (
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <button
                onClick={() => setShowMenu(v => !v)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <MoreVertical size={18} color={C.gray} strokeWidth={1.8} />
              </button>
              {showMenu && (
                <>
                  <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 100,
                    background: C.white, borderRadius: 12,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    overflow: 'hidden', minWidth: 120,
                  }}>
                    <button
                      onClick={() => { navigate(`/community/write?edit=${id}`); setShowMenu(false) }}
                      style={{
                        display: 'block', width: '100%', padding: '12px 16px',
                        textAlign: 'left', border: 'none',
                        borderBottom: `1px solid ${C.border}`,
                        cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: 14, color: C.text, background: C.white,
                      }}
                    >
                      수정하기
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
                      style={{
                        display: 'block', width: '100%', padding: '12px 16px',
                        textAlign: 'left', border: 'none',
                        cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: 14, color: '#E53E3E', background: C.white,
                      }}
                    >
                      삭제하기
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <p style={{ margin: '0 0 16px', fontSize: 14, color: C.text, lineHeight: 1.75, letterSpacing: '-0.01em' }}>
          {question.body}
        </p>

        <button
          onClick={toggleQuestionLike}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            border: `1px solid ${questionLiked ? C.point : C.border}`,
            borderRadius: 999, padding: '6px 14px',
            background: questionLiked ? `${C.point}15` : 'transparent',
            cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: 24,
            transition: 'all 0.15s',
          }}
        >
          <Heart size={13} fill={questionLiked ? C.point : 'none'} color={questionLiked ? C.point : C.gray} />
          <span style={{ fontSize: 13, color: questionLiked ? C.point : C.gray, fontWeight: questionLiked ? 600 : 400 }}>
            {(question.likes ?? 0) + (questionLiked ? 1 : 0)}
          </span>
        </button>

        <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

        {/* Answer count + sort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.gray }}>
            답변 {answers.length}개
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
              onUserClick={() => navigate(`/user/${answer.uid ?? answer.author?.id}`)}
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
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !sending && handleSend()}
          placeholder="답변을 입력하세요..."
          style={{
            flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 999,
            padding: '10px 16px', fontSize: 13, fontFamily: 'inherit',
            background: C.bg, color: C.text, outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: 999, border: 'none',
            background: input.trim() && !sending ? C.point : C.border,
            cursor: input.trim() && !sending ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          <Send size={16} color="white" />
        </button>
      </div>

      {showDeleteConfirm && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}

function AnswerCard({ answer, liked, onLike, onUserClick }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {/* 프로필 이미지 */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: C.grayLight, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {answer.profileImage ? (
            <img
              src={answer.profileImage}
              alt={answer.nickname ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              referrerPolicy="no-referrer"
            />
          ) : <DefaultAvatar />}
        </div>

        <button
          onClick={onUserClick}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: C.text }}
        >
          {answer.nickname ?? answer.author?.name ?? '익명'}
        </button>
        <span style={{ fontSize: 11, color: C.gray }}>{formatTime(answer.createdAt)}</span>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 13, color: C.text, lineHeight: 1.7, letterSpacing: '-0.01em' }}>
        {answer.body}
      </p>

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
          {answer.likes ?? 0}
        </span>
      </button>
    </div>
  )
}
