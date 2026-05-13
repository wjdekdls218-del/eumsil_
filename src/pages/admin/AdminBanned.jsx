import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { collection, query, where, onSnapshot, updateDoc, doc, deleteField } from 'firebase/firestore'
import { AC, FONT } from '../../adminTheme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

function ConfirmModal({ title, desc, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, background: AC.white, borderRadius: '20px 20px 0 0', padding: '28px 24px 36px', fontFamily: FONT }}>
        <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: AC.text }}>{title}</p>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: AC.gray }}>{desc}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: 999, border: `1.5px solid ${AC.border}`, background: AC.white, fontSize: 15, fontWeight: 600, color: AC.text, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '13px', borderRadius: 999, border: 'none', background: AC.point, fontSize: 15, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit' }}>제재 해제</button>
        </div>
      </div>
    </div>
  )
}

function BanBadge({ banUntil }) {
  if (!banUntil) return null
  if (banUntil === 'permanent') {
    return <span style={{ fontSize: 10, fontWeight: 700, color: AC.danger, background: '#FFE8E8', padding: '2px 8px', borderRadius: 999 }}>영구정지</span>
  }
  const d = banUntil.toDate ? banUntil.toDate() : new Date(banUntil)
  const daysLeft = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 0) return <span style={{ fontSize: 10, fontWeight: 700, color: AC.gray, background: AC.grayLight, padding: '2px 8px', borderRadius: 999 }}>만료됨</span>
  if (daysLeft <= 8) return <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', background: '#F3E8FF', padding: '2px 8px', borderRadius: 999 }}>7일 정지</span>
  return <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', background: '#F3E8FF', padding: '2px 8px', borderRadius: 999 }}>30일 정지</span>
}

function fmtBanUntil(banUntil) {
  if (!banUntil) return ''
  if (banUntil === 'permanent') return '영구정지'
  const d = banUntil.toDate ? banUntil.toDate() : new Date(banUntil)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) + ' 까지'
}

function addDays(banUntil, days) {
  if (banUntil === 'permanent') return 'permanent'
  const base = banUntil?.toDate ? banUntil.toDate() : new Date()
  if (base < new Date()) return (() => { const d = new Date(); d.setDate(d.getDate() + days); return d })()
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

export default function AdminBanned() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState(null)
  const [confirmUnban, setConfirmUnban] = useState(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'users'), where('banUntil', '!=', null))
    return onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  const handleUnban = async (uid) => {
    if (working) return
    setWorking(true)
    await updateDoc(doc(db, 'users', uid), { banUntil: deleteField() })
    setConfirmUnban(null)
    setWorking(false)
  }

  const handleExtend = async (uid, banUntil, days) => {
    if (working) return
    setWorking(true)
    await updateDoc(doc(db, 'users', uid), { banUntil: addDays(banUntil, days) })
    setOpenMenu(null)
    setWorking(false)
  }

  const handlePermanent = async (uid) => {
    if (working) return
    setWorking(true)
    await updateDoc(doc(db, 'users', uid), { banUntil: 'permanent' })
    setOpenMenu(null)
    setWorking(false)
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: AC.bg, fontFamily: FONT, paddingBottom: 90 }}>
      <header style={{
        background: AC.header, padding: '48px 16px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/admin')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={1.8} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', flex: 1 }}>제재 회원 관리</h1>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '3px 10px' }}>{users.length}명</span>
      </header>

      {openMenu && <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: AC.gray, padding: '60px 0', fontSize: 14 }}>불러오는 중...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: AC.gray, padding: '60px 0', fontSize: 14 }}>제재된 회원이 없어요.</p>
        ) : users.map(u => (
          <div key={u.id} style={{ background: AC.white, borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(108,99,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* 프로필 */}
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: AC.grayLight, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {u.photoURL
                  ? <img src={u.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                  : '🧶'}
              </div>

              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: AC.text }}>{u.displayName || '이름 없음'}</span>
                  <BanBadge banUntil={u.banUntil} />
                </div>
                <p style={{ margin: '0 0 2px', fontSize: 12, color: AC.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email || u.id}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: u.banUntil === 'permanent' ? AC.danger : AC.gray, fontWeight: 600 }}>
                  {fmtBanUntil(u.banUntil)}
                </p>
              </div>

              {/* 더보기 메뉴 */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6, display: 'flex' }}
                >
                  <MoreVertical size={18} color={AC.gray} strokeWidth={1.8} />
                </button>
                {openMenu === u.id && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 100,
                    background: AC.white, borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
                    overflow: 'hidden', minWidth: 140,
                  }}>
                    {[
                      { label: '제재 해제', color: AC.point, action: () => { setConfirmUnban(u); setOpenMenu(null) } },
                      { label: '7일 연장', color: AC.text, action: () => handleExtend(u.id, u.banUntil, 7) },
                      { label: '30일 연장', color: AC.text, action: () => handleExtend(u.id, u.banUntil, 30) },
                      { label: '영구정지로 변경', color: AC.danger, action: () => handlePermanent(u.id) },
                    ].map((item, idx, arr) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        style={{
                          display: 'block', width: '100%', padding: '12px 16px',
                          textAlign: 'left', border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                          color: item.color, background: AC.white,
                          borderBottom: idx < arr.length - 1 ? `1px solid ${AC.border}` : 'none',
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {confirmUnban && (
        <ConfirmModal
          title={`${confirmUnban.displayName || '이 회원'}의 제재를 해제할까요?`}
          desc="제재 해제 후 즉시 서비스 이용이 가능해요."
          onConfirm={() => handleUnban(confirmUnban.id)}
          onCancel={() => setConfirmUnban(null)}
        />
      )}

      <AdminNav />
    </div>
  )
}
