import { useState, useRef } from 'react';
import { api } from '../services/api';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23e2e8f0'/%3E%3Ccircle cx='40' cy='32' r='14' fill='%2394a3b8'/%3E%3Cellipse cx='40' cy='68' rx='22' ry='14' fill='%2394a3b8'/%3E%3C/svg%3E";

export default function MentorModal({ mentor, onSave, onClose, onRegistrationDeleted }) {
  const isEdit = !!mentor;
  const fileRef = useRef(null);

  // Tab: 'info' | 'mentees'
  const [tab, setTab] = useState('info');

  const [form, setForm] = useState({
    nickname: mentor?.nickname || '',
    mssv: mentor?.mssv || '',
    major: mentor?.major || '',
    track: mentor?.track || '',
    hobbies: mentor?.hobbies || '',
    maxSlots: mentor?.maxSlots ?? 10,
    avatar: mentor?.avatar || '',
  });
  const [preview, setPreview] = useState(mentor?.avatar || '');
  const [errors, setErrors] = useState({});

  // Mentee management state
  const [deletingRegId, setDeletingRegId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [registrations, setRegistrations] = useState(mentor?.registrations || []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setForm((f) => ({ ...f, avatar: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const TRACK_OPTIONS = [
    'Mạng máy tính',
    'Lập trình ứng dụng',
    'Lập trình & giải thuật',
  ];

  const validate = () => {
    const errs = {};
    if (!form.nickname.trim()) errs.nickname = 'Vui lòng nhập biệt danh.';
    if (!form.major.trim())    errs.major    = 'Vui lòng nhập ngành học.';
    if (!form.track)           errs.track    = 'Vui lòng chọn nhánh.';
    if (!form.hobbies.trim())  errs.hobbies  = 'Vui lòng nhập sở thích.';
    if (!form.maxSlots || form.maxSlots < 1) errs.maxSlots = 'Tối thiểu 1 slot.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      id: mentor?.id || Date.now(),
      ...form,
      mssv: form.mssv.trim(),
      maxSlots: Number(form.maxSlots),
      registrations: mentor?.registrations || [],
    });
  };

  const handleDeleteRegistration = async (regId) => {
    if (!regId) return;
    setDeleteLoading(true);
    try {
      await api.deleteRegistration(regId);
      setRegistrations((prev) => prev.filter((r) => r.id !== regId));
      setDeletingRegId(null);
      if (onRegistrationDeleted) onRegistrationDeleted();
    } catch (err) {
      console.error('Xoá đăng ký thất bại:', err);
      setDeletingRegId(null);
      alert('Xoá đăng ký thất bại: ' + (err.message || 'Lỗi kết nối server'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Chỉnh sửa Mentor' : 'Thêm Mentor mới'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab bar — chỉ hiện khi đang edit */}
        {isEdit && (
          <div className="modal-tabs">
            <button
              className={`modal-tab ${tab === 'info' ? 'active' : ''}`}
              onClick={() => setTab('info')}
            >
              Thông tin
            </button>
            <button
              className={`modal-tab ${tab === 'mentees' ? 'active' : ''}`}
              onClick={() => setTab('mentees')}
            >
              Danh sách Mentee
              {registrations.length > 0 && (
                <span className="modal-tab-badge">{registrations.length}</span>
              )}
            </button>
          </div>
        )}

        {/* ── TAB: Thông tin ── */}
        {tab === 'info' && (
          <form onSubmit={handleSubmit} className="modal-body">
            {/* Avatar */}
            <div className="avatar-section">
              <div className="avatar-preview" onClick={() => fileRef.current.click()}>
                <img src={preview || DEFAULT_AVATAR} alt="avatar" />
                <div className="avatar-overlay">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} id="avatar-upload" />
              <label htmlFor="avatar-upload" className="avatar-hint">Nhấn để chọn ảnh đại diện</label>
            </div>

            {/* Nickname */}
            <div className="mfield">
              <label>Biệt danh <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Vd: Blue, Phoenix, NightOwl..."
                value={form.nickname}
                onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              />
              {errors.nickname && <span className="merror">{errors.nickname}</span>}
            </div>

            {/* MSSV */}
            <div className="mfield">
              <label>MSSV</label>
              <input
                type="text"
                placeholder="Vd: 52400036"
                value={form.mssv}
                onChange={(e) => setForm((f) => ({ ...f, mssv: e.target.value }))}
              />
            </div>

            {/* Major */}
            <div className="mfield">
              <label>Ngành học <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Vd: Công nghệ Thông tin, ATTT, KHMT..."
                value={form.major}
                onChange={(e) => setForm((f) => ({ ...f, major: e.target.value }))}
              />
              {errors.major && <span className="merror">{errors.major}</span>}
            </div>

            {/* Track / Nhánh */}
            <div className="mfield">
              <label>Nhánh <span className="required">*</span></label>
              <select
                value={form.track}
                onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
                className={errors.track ? 'input-error' : ''}
              >
                <option value="">-- Chọn nhánh --</option>
                {TRACK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.track && <span className="merror">{errors.track}</span>}
            </div>
            

            {/* Hobbies */}
            <div className="mfield">
              <label>Sở thích <span className="required">*</span></label>
              <textarea
                rows={3}
                placeholder="Vd: Lập trình, Gaming, Âm nhạc, Đọc sách..."
                value={form.hobbies}
                onChange={(e) => setForm((f) => ({ ...f, hobbies: e.target.value }))}
              />
              {errors.hobbies && <span className="merror">{errors.hobbies}</span>}
            </div>

            {/* Max Slots */}
            <div className="mfield">
              <label>Số lượng tối đa đăng ký <span className="required">*</span></label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.maxSlots}
                onChange={(e) => setForm((f) => ({ ...f, maxSlots: e.target.value }))}
              />
              {errors.maxSlots && <span className="merror">{errors.maxSlots}</span>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Huỷ</button>
              <button type="submit" className="btn-save">
                {isEdit ? 'Lưu thay đổi' : 'Thêm Mentor'}
              </button>
            </div>
          </form>
        )}

        {/* ── TAB: Danh sách Mentee ── */}
        {tab === 'mentees' && (
          <div className="modal-body mentee-list-body">
            {registrations.length === 0 ? (
              <div className="mentee-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
                <p>Chưa có mentee nào đăng ký với mentor này.</p>
              </div>
            ) : (
              <ul className="mentee-list">
                {registrations.map((r, idx) => (
                  <li key={r.id ?? idx} className="mentee-item">
                    <div className="mentee-avatar-wrap">
                      <span className="mentee-avatar-initials">
                        {(r.menteeName || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="mentee-info">
                      <div className="mentee-name">{r.menteeName}</div>
                      <div className="mentee-meta">
                        <span className="mentee-mssv">{r.menteeId || '—'}</span>
                        {r.registeredAt && (
                          <span className="mentee-time">· {r.registeredAt}</span>
                        )}
                      </div>
                    </div>
                    {deletingRegId === r.id ? (
                      <div
                        className="mentee-confirm-del"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Xoá?</span>
                        <button
                          type="button"
                          className="mentee-del-yes"
                          disabled={deleteLoading}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteRegistration(r.id); }}
                        >
                          {deleteLoading ? '...' : 'Xác nhận'}
                        </button>
                        <button
                          type="button"
                          className="mentee-del-no"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingRegId(null); }}
                        >
                          Huỷ
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="mentee-del-btn"
                        title="Xoá đăng ký"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingRegId(r.id); }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mentee-list-footer">
              {registrations.length}/{mentor?.maxSlots ?? 0} slot đã sử dụng
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
