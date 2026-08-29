import { useState, useEffect, useRef } from 'react'
import './UserDashboard.css'
import iconLogo from '../assets/logo.png'
import { api } from '../services/api'

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23e2e8f0'/%3E%3Ccircle cx='40' cy='32' r='14' fill='%2394a3b8'/%3E%3Cellipse cx='40' cy='68' rx='22' ry='14' fill='%2394a3b8'/%3E%3C/svg%3E"

const TRACK_OPTIONS = ['Tất cả', 'Mạng máy tính', 'Lập trình ứng dụng', 'Giải thuật & lập trình']

/* ──────────────────────────────────────
   Modal xác nhận đăng ký với countdown
────────────────────────────────────── */
function ConfirmModal({ mentor, onConfirm, onCancel }) {
  const [countdown, setCountdown] = useState(5)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  return (
    <div className="ud-confirm-overlay" onClick={onCancel}>
      <div className="ud-confirm-modal" onClick={e => e.stopPropagation()}>
        {/* Icon cảnh báo */}
        <div className="ud-confirm-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h3 className="ud-confirm-title">Xác nhận đăng ký Mentor</h3>

        {/* Thông tin mentor */}
        <div className="ud-confirm-mentor-info">
          <img
            src={mentor.avatar || DEFAULT_AVATAR}
            alt={mentor.nickname}
            className="ud-confirm-avatar"
          />
          <div>
            <div className="ud-confirm-mentor-name">{mentor.nickname}</div>
            <div className="ud-confirm-mentor-meta">{mentor.major} · {mentor.track}</div>
          </div>
        </div>

        {/* Thông báo quan trọng */}
        <div className="ud-confirm-notice">
          <div className="ud-confirm-notice-row">
            <span className="ud-confirm-dot" />
            <span className="ud-confirm-notice-text">
              Mỗi thành viên chỉ được đăng ký <strong>duy nhất 1 mentor</strong>.
            </span>
          </div>
          <div className="ud-confirm-notice-row">
            <span className="ud-confirm-dot" />
            <span className="ud-confirm-notice-text">
              Quyết định này <strong>không thể hoàn tác</strong> sau khi xác nhận.
            </span>
          </div>
          <div className="ud-confirm-notice-row">
            <span className="ud-confirm-dot" />
            <span className="ud-confirm-notice-text">
              Vui lòng đọc kỹ thông tin trước khi đồng ý.
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="ud-confirm-actions">
          <button className="ud-confirm-btn-cancel" onClick={onCancel}>
            Huỷ bỏ
          </button>
          <button
            className={`ud-confirm-btn-ok ${countdown > 0 ? 'ud-confirm-btn-ok--waiting' : ''}`}
            disabled={countdown > 0}
            onClick={onConfirm}
          >
            {countdown > 0
              ? `Đồng ý (${countdown}s)`
              : 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   Progress bar
────────────────────────────────────── */
function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const full = value >= max
  return (
    <div className="ud-progress-wrap">
      <div
        className={`ud-progress-bar ${full ? 'ud-progress-bar--full' : 'ud-progress-bar--normal'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ──────────────────────────────────────
   Mentor Card
────────────────────────────────────── */
function MentorCard({ mentor, onRequestRegister, registered, anyRegistered }) {
  const registered_count = mentor.registrations ? mentor.registrations.length : 0
  const max = mentor.max_slots || mentor.maxSlots || 5
  const full = registered_count >= max
  const statusColor = full ? '#e05252' : registered_count / max >= 0.75 ? '#e0943a' : '#22a663'

  // Khoá nút nếu: đã full, hoặc user đã đăng ký 1 người khác
  const isDisabled = full || (anyRegistered && !registered)

  let btnClass = 'ud-btn '
  if (registered) btnClass += 'ud-btn--registered'
  else if (full || isDisabled) btnClass += 'ud-btn--full'
  else btnClass += 'ud-btn--default'

  const hobbyTags = mentor.hobbies
    ? mentor.hobbies.split(',').map(h => h.trim()).filter(Boolean)
    : []

  return (
    <div className={`ud-card ${registered ? 'ud-card--registered' : ''}`}>
      <div className="ud-card-strip" />

      <div className="ud-card-body">
        {/* Avatar + name */}
        <div className="ud-card-avatar-row">
          <div className="ud-avatar-wrap">
            <img
              src={mentor.avatar || DEFAULT_AVATAR}
              alt={mentor.nickname}
              className="ud-avatar-img"
            />
            <div className="ud-avatar-status" style={{ background: statusColor }} />
          </div>
          <div>
            <div className="ud-card-name">{mentor.nickname}</div>
            <div className="ud-card-major-badge">{mentor.major}</div>
          </div>
        </div>

        {/* Nhánh */}
        <div>
          <div className="ud-section-label">Nhánh</div>
          <div className="ud-card-direction">{mentor.track || '—'}</div>
        </div>

        {/* Hobbies */}
        {hobbyTags.length > 0 && (
          <div>
            <div className="ud-section-label" style={{ marginBottom: 6 }}>Sở thích</div>
            <div className="ud-tags">
              {hobbyTags.map(tag => (
                <span key={tag} className="ud-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Slots */}
        <div className="ud-slots">
          <div className="ud-slots-row">
            <span className="ud-slots-label">Đăng ký</span>
            <span className={`ud-slots-count ${full ? 'ud-slots-count--full' : 'ud-slots-count--normal'}`}>
              {registered_count}
              <span className="ud-slots-max">/{max}</span>
            </span>
          </div>
          <ProgressBar value={registered_count} max={max} />
          {full && <div className="ud-slots-full-msg">Đã đầy slot</div>}
        </div>

        {/* Button */}
        <button
          disabled={isDisabled && !registered}
          onClick={() => !registered && !isDisabled && onRequestRegister(mentor)}
          className={btnClass}
        >
          {registered
            ? '✓ Đã đăng ký'
            : full
            ? 'Hết chỗ'
            : anyRegistered
            ? 'Đã chọn mentor khác'
            : 'Đăng ký ngay'}
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   UserDashboard (main)
────────────────────────────────────── */
export default function UserDashboard({ user, onLogout }) {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState('Tất cả')
  const [registeredId, setRegisteredId] = useState(null)   // chỉ 1 người
  const [search, setSearch] = useState('')
  const [confirmMentor, setConfirmMentor] = useState(null) // mentor đang chờ xác nhận

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true)
        const data = await api.getMentors()
        setMentors(data || [])
      } catch (err) {
        console.error('Lỗi tải mentor:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMentors()
  }, [])

  // Mở modal xác nhận
  const handleRequestRegister = (mentor) => {
    setConfirmMentor(mentor)
  }

  // Xác nhận → đăng ký qua API
  const handleConfirm = async () => {
    if (!confirmMentor) return;
    try {
      await api.registerMentee(confirmMentor.id, user?.name || user?.username, user?.username);
      setRegisteredId(confirmMentor.id);
      setConfirmMentor(null);
      // Refetch để cập nhật số lượng đăng ký thực tế
      const data = await api.getMentors();
      setMentors(data || []);
    } catch (err) {
      console.error('Đăng ký thất bại:', err);
      setConfirmMentor(null);
    }
  }


  // Huỷ modal
  const handleCancelConfirm = () => {
    setConfirmMentor(null)
  }

  const filtered = mentors.filter(m => {
    const matchTrack = selectedTrack === 'Tất cả' || m.track === selectedTrack
    const matchSearch =
      search === '' ||
      (m.nickname && m.nickname.toLowerCase().includes(search.toLowerCase())) ||
      (m.track && m.track.toLowerCase().includes(search.toLowerCase())) ||
      (m.major && m.major.toLowerCase().includes(search.toLowerCase()))
    return matchTrack && matchSearch
  })

  return (
    <div className="ud-page">
      {/* Modal xác nhận */}
      {confirmMentor && (
        <ConfirmModal
          mentor={confirmMentor}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}

      {/* Top nav */}
      <header className="ud-header">
        <div className="ud-header-brand">
          <img src={iconLogo} alt="ICON Logo" className="ud-header-logo-img" />
          <div>
            <div className="ud-header-title">CÂU LẠC BỘ <span className="ud-header-title-accent">ICON</span></div>
            <div className="ud-header-subtitle">Cổng đăng ký mentor</div>
          </div>
        </div>

        <div className="ud-header-right">
          {registeredId && (
            <div className="ud-registered-badge">
              ✓ 1 mentor đã đăng ký
            </div>
          )}
          <button className="ud-logout-btn" onClick={onLogout} title="Đăng xuất">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="ud-hero">
        <div className="ud-hero-dots" />
        <div className="ud-hero-content">
          <h1 className="ud-hero-title">Chọn Mentor của bạn</h1>
          <p className="ud-hero-desc">
            Mỗi thành viên được đăng ký <strong>tối đa 1 mentor</strong>. Hãy chọn người phù hợp với định hướng và sở thích của bạn.
          </p>
          <div className="ud-search-wrap">
            <span className="ud-search-icon">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm mentor, nhánh, ngành học..."
              className="ud-search-input"
            />
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="ud-main">
        {/* Filter */}
        <div className="ud-filter-bar">
          <div className="ud-filter-label">Lọc theo nhánh</div>
          <div className="ud-filter-chips">
            {TRACK_OPTIONS.map(track => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                className={`ud-chip${selectedTrack === track ? ' active' : ''}`}
              >
                {track}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="ud-results-row">
          <div className="ud-results-count">
            Tìm thấy <strong>{filtered.length}</strong> mentor
          </div>
          <div className="ud-legend">
            <span className="ud-legend-item"><span className="ud-dot ud-dot--green" /> Còn chỗ</span>
            <span className="ud-legend-item"><span className="ud-dot ud-dot--orange" /> Sắp đầy</span>
            <span className="ud-legend-item"><span className="ud-dot ud-dot--red" /> Đã đầy</span>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="ud-empty">Đang tải danh sách mentor...</div>
        ) : filtered.length === 0 ? (
          <div className="ud-empty">Không tìm thấy mentor phù hợp 😕</div>
        ) : (
          <div className="ud-grid">
            {filtered.map(mentor => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onRequestRegister={handleRequestRegister}
                registered={registeredId === mentor.id}
                anyRegistered={!!registeredId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
