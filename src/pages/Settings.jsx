import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import {
  signOut, deleteUser,
  RecaptchaVerifier, PhoneAuthProvider,
  linkWithCredential, updatePhoneNumber,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, deleteDoc, getDocs,
  collection, query, where,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { C, FONT } from '../theme'

// ── 카카오 우편번호 스크립트 로더 ──────────────────────
const loadKakaoPostcode = () =>
  new Promise(resolve => {
    if (window.daum?.Postcode) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    s.onload = resolve
    document.head.appendChild(s)
  })

// ── 전화번호 유틸 ──────────────────────────────────────
const formatPhoneInput = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

const toE164 = (phone) => {
  const d = phone.replace(/\D/g, '')
  return '+82' + (d.startsWith('0') ? d.slice(1) : d)
}

// ── 공통 컴포넌트 ──────────────────────────────────────
function ConfirmModal({ title, desc, confirmLabel, confirmColor = '#E53E3E', onConfirm, onCancel }) {
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
          {title}
        </p>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: C.gray }}>{desc}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '13px', borderRadius: 999,
            border: `1.5px solid ${C.border}`, background: C.white,
            fontSize: 15, fontWeight: 600, color: C.text,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>취소</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '13px', borderRadius: 999,
            border: 'none', background: confirmColor,
            fontSize: 15, fontWeight: 700, color: C.white,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 999, border: 'none',
        background: value ? C.point : C.border,
        cursor: 'pointer', padding: 0, position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: C.white,
        position: 'absolute', top: 3, left: value ? 23 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }} />
    </button>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // 프로필 / 설정값
  const [profile, setProfile]       = useState(null)
  const [chatNotif, setChatNotif]   = useState(true)
  const [tradeNotif, setTradeNotif] = useState(true)
  const [region, setRegion]         = useState('')

  // 전화번호 인증
  // phoneStep: 'idle' | 'editing' | 'sending' | 'code' | 'confirming'
  const [phoneNumber, setPhoneNumber]   = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [phoneStep, setPhoneStep]       = useState('idle')
  const [smsCode, setSmsCode]           = useState('')
  const [verificationId, setVerificationId] = useState(null)
  const [phoneError, setPhoneError]     = useState('')
  const recaptchaRef = useRef(null)

  // 모달
  const [showLogoutModal, setShowLogoutModal]   = useState(false)
  const [showDeleteModal, setShowDeleteModal]   = useState(false)
  const [deleting, setDeleting]                 = useState(false)

  // ── 프로필 로드 ──
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setProfile(d)
        setChatNotif(d.chatNotif ?? true)
        setTradeNotif(d.tradeNotif ?? true)
        setRegion(d.region ?? '')
        setPhoneVerified(d.phoneVerified ?? false)
        setVerifiedPhone(d.phoneNumber ?? '')
        setPhoneNumber(d.phoneNumber ?? '')
      }
    })
  }, [user?.uid])

  // reCAPTCHA 클린업
  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear()
      recaptchaRef.current = null
    }
  }, [])

  // ── 헬퍼 ──
  const saveField = (field, value) => {
    if (!user) return
    setDoc(doc(db, 'users', user.uid), { [field]: value }, { merge: true })
  }

  const getRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      })
    }
    return recaptchaRef.current
  }

  // ── 알림 토글 ──
  const handleChatNotif  = (v) => { setChatNotif(v);  saveField('chatNotif', v) }
  const handleTradeNotif = (v) => { setTradeNotif(v); saveField('tradeNotif', v) }

  // ── 지역 변경 ──
  const handleRegionChange = async () => {
    await loadKakaoPostcode()
    new window.daum.Postcode({
      oncomplete: async (data) => {
        const newRegion = data.sido + ' ' + data.sigungu
        setRegion(newRegion)
        if (user) await setDoc(doc(db, 'users', user.uid), { region: newRegion }, { merge: true })
      },
    }).open()
  }

  // ── 전화번호 인증: SMS 발송 ──
  const handleSendSms = async () => {
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length < 10) {
      setPhoneError('올바른 번호를 입력해주세요.')
      return
    }
    setPhoneError('')
    setPhoneStep('sending')
    try {
      const recaptcha = getRecaptcha()
      const provider = new PhoneAuthProvider(auth)
      const vid = await provider.verifyPhoneNumber(toE164(phoneNumber), recaptcha)
      setVerificationId(vid)
      setPhoneStep('code')
    } catch (err) {
      console.error('SMS 발송 실패:', err)
      setPhoneError('인증에 실패했어요. 다시 시도해주세요.')
      recaptchaRef.current?.clear()
      recaptchaRef.current = null
      setPhoneStep('editing')
    }
  }

  // ── 전화번호 인증: 코드 확인 ──
  const handleConfirmCode = async () => {
    if (!verificationId || smsCode.length < 6) return
    setPhoneStep('confirming')
    setPhoneError('')
    try {
      const credential = PhoneAuthProvider.credential(verificationId, smsCode)
      try {
        await linkWithCredential(auth.currentUser, credential)
      } catch (linkErr) {
        // 이미 연결된 경우 → 번호 업데이트
        if (linkErr.code === 'auth/provider-already-linked') {
          await updatePhoneNumber(auth.currentUser, credential)
        } else {
          throw linkErr
        }
      }
      await setDoc(doc(db, 'users', user.uid), {
        phoneNumber,
        phoneVerified: true,
      }, { merge: true })
      setVerifiedPhone(phoneNumber)
      setPhoneVerified(true)
      setPhoneStep('idle')
      setSmsCode('')
      setVerificationId(null)
    } catch (err) {
      console.error('인증 확인 실패:', err)
      setPhoneError('인증에 실패했어요. 다시 시도해주세요.')
      setPhoneStep('code')
    }
  }

  // ── 번호 변경 시작 ──
  const handleStartChange = () => {
    setPhoneStep('editing')
    setPhoneError('')
    setSmsCode('')
    setVerificationId(null)
  }

  // ── 로그아웃 ──
  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  // ── 회원탈퇴 ──
  const handleDeleteAccount = async () => {
    if (!user || deleting) return
    setDeleting(true)
    try {
      const [postsSnap, communitySnap] = await Promise.all([
        getDocs(query(collection(db, 'posts'),      where('uid', '==', user.uid))),
        getDocs(query(collection(db, 'community'),  where('uid', '==', user.uid))),
      ])
      await Promise.all([
        ...postsSnap.docs.map(d => deleteDoc(d.ref)),
        ...communitySnap.docs.map(d => deleteDoc(d.ref)),
        deleteDoc(doc(db, 'users', user.uid)),
      ])
      await deleteUser(auth.currentUser)
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('회원탈퇴 실패:', err)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const userName  = profile?.displayName || user?.displayName || '사용자'
  const userPhoto = profile?.photoURL    || user?.photoURL    || null
  const userEmail = user?.email || ''

  const isPhoneDisabled = phoneVerified && phoneStep === 'idle'
  const isBusy = phoneStep === 'sending' || phoneStep === 'confirming'

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
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>설정</span>
      </header>

      <div style={{ padding: '24px 16px 60px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── 내 계정 ── */}
        <section>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray, letterSpacing: '0.04em' }}>내 계정</p>

          {/* 프로필 카드 */}
          <div
            onClick={() => navigate('/mypage/edit')}
            style={{
              background: C.white, borderRadius: 16,
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', marginBottom: 10,
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: C.grayLight, overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${C.point}`, fontSize: 26,
            }}>
              {userPhoto ? (
                <img src={userPhoto} alt={userName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  referrerPolicy="no-referrer" />
              ) : '🧶'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
                {userName}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </p>
            </div>
            <ChevronRight size={18} color={C.gray} strokeWidth={2} />
          </div>

          {/* 휴대폰 인증 카드 */}
          <div style={{ background: C.white, borderRadius: 16, padding: '18px 20px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
              휴대폰 인증
              {phoneVerified && phoneStep === 'idle' && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: C.point }}>✓ 인증 완료</span>
              )}
            </p>

            {/* 번호 입력 행 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
              <input
                value={phoneNumber}
                onChange={e => setPhoneNumber(formatPhoneInput(e.target.value))}
                disabled={isPhoneDisabled || phoneStep === 'code' || isBusy}
                placeholder="010-0000-0000"
                style={{
                  flex: 1, minWidth: 0,
                  border: `1.5px solid ${C.border}`, borderRadius: 10,
                  padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                  background: isPhoneDisabled ? C.grayLight : C.bg,
                  color: isPhoneDisabled ? C.gray : C.text,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {isPhoneDisabled ? (
                <button
                  onClick={handleStartChange}
                  style={{
                    flexShrink: 0, whiteSpace: 'nowrap',
                    padding: '10px 12px', borderRadius: 999,
                    border: `1.5px solid ${C.border}`, background: C.white,
                    fontSize: 13, fontWeight: 600, color: C.text,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  번호 변경
                </button>
              ) : (
                <button
                  onClick={handleSendSms}
                  disabled={isBusy || phoneStep === 'code'}
                  style={{
                    flexShrink: 0, whiteSpace: 'nowrap',
                    padding: '10px 12px', borderRadius: 999,
                    border: 'none',
                    background: isBusy || phoneStep === 'code' ? C.border : C.point,
                    fontSize: 13, fontWeight: 700, color: C.white,
                    cursor: isBusy || phoneStep === 'code' ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {phoneStep === 'sending' ? '발송 중...' : '번호 인증'}
                </button>
              )}
            </div>

            {/* 인증번호 입력 행 */}
            {(phoneStep === 'code' || phoneStep === 'confirming') && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, width: '100%' }}>
                <input
                  value={smsCode}
                  onChange={e => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="인증번호 6자리"
                  maxLength={6}
                  style={{
                    flex: 1, minWidth: 0,
                    border: `1.5px solid ${C.border}`, borderRadius: 10,
                    padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                    background: C.bg, color: C.text, outline: 'none',
                    letterSpacing: '0.1em', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handleConfirmCode}
                  disabled={smsCode.length < 6 || phoneStep === 'confirming'}
                  style={{
                    flexShrink: 0, whiteSpace: 'nowrap',
                    padding: '10px 12px', borderRadius: 999,
                    border: 'none',
                    background: smsCode.length === 6 && phoneStep !== 'confirming' ? C.point : C.border,
                    fontSize: 13, fontWeight: 700, color: C.white,
                    cursor: smsCode.length === 6 && phoneStep !== 'confirming' ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                  }}
                >
                  {phoneStep === 'confirming' ? '확인 중...' : '인증 확인'}
                </button>
              </div>
            )}

            {/* 안내 / 오류 메시지 */}
            {phoneStep === 'code' && !phoneError && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: C.gray }}>
                SMS로 발송된 6자리 인증번호를 입력해주세요.
              </p>
            )}
            {phoneError && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#E53E3E' }}>{phoneError}</p>
            )}
          </div>
        </section>

        {/* ── 알림 ── */}
        <section>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray, letterSpacing: '0.04em' }}>알림</p>
          <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>채팅 알림</span>
              <Toggle value={chatNotif} onChange={handleChatNotif} />
            </div>
            <div style={{ height: 1, background: C.border, margin: '0 20px' }} />
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>거래 알림</span>
              <Toggle value={tradeNotif} onChange={handleTradeNotif} />
            </div>
          </div>
        </section>

        {/* ── 지역 설정 ── */}
        <section>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray, letterSpacing: '0.04em' }}>지역 설정</p>
          <div
            onClick={handleRegionChange}
            style={{
              background: C.white, borderRadius: 16,
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: C.text }}>현재 지역</p>
              <p style={{ margin: 0, fontSize: 13, color: region ? C.point : C.gray, fontWeight: region ? 600 : 400 }}>
                {region || '지역을 설정해주세요'}
              </p>
            </div>
            <ChevronRight size={18} color={C.gray} strokeWidth={2} />
          </div>
        </section>

        {/* ── 서비스 ── */}
        <section>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray, letterSpacing: '0.04em' }}>서비스</p>
          <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>
            <button
              onClick={() => navigate('/settings/notice')}
              style={{
                width: '100%', padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>공지사항</span>
              <ChevronRight size={18} color={C.gray} strokeWidth={2} />
            </button>
          </div>
        </section>

        {/* ── 기타 ── */}
        <section>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray, letterSpacing: '0.04em' }}>기타</p>
          <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>
            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                width: '100%', padding: '16px 20px',
                display: 'flex', alignItems: 'center',
                border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>로그아웃</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                width: '100%', padding: '16px 20px',
                display: 'flex', alignItems: 'center',
                border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: '#E53E3E' }}>회원탈퇴</span>
            </button>
          </div>
        </section>

      </div>

      {/* Invisible reCAPTCHA 컨테이너 */}
      <div id="recaptcha-container" />

      {showLogoutModal && (
        <ConfirmModal
          title="로그아웃"
          desc="정말 로그아웃 하시겠어요?"
          confirmLabel="로그아웃"
          confirmColor={C.text}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="정말 탈퇴하시겠어요?"
          desc="모든 데이터가 삭제되며 복구할 수 없어요."
          confirmLabel={deleting ? '처리 중...' : '탈퇴하기'}
          confirmColor="#E53E3E"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

    </div>
  )
}
