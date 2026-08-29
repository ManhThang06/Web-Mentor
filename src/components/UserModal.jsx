import { useState, useEffect } from 'react';

export default function UserModal({ show, onClose, onSave, editUser }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editUser) {
      setName(editUser.name || '');
      setUsername(editUser.username || '');
      setRole(editUser.role || 'user');
    } else {
      setName('');
      setUsername('');
      setRole('user');
    }
    setError('');
  }, [editUser, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Vui lòng nhập Họ và tên thành viên.'); return; }
    if (!username.trim()) { setError('Vui lòng nhập MSSV (tài khoản).'); return; }

    onSave({
      id: editUser?.id || null,
      name: name.trim(),
      username: username.trim(),
      role: role
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {editUser ? '✏️ Chỉnh sửa thành viên' : '👤 Thêm thành viên mới'}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}
            aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-msg" style={{ marginBottom: '16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Họ và tên */}
            <div className="form-group">
              <label className="modal-label" htmlFor="user-name">Họ và tên <span className="req">*</span></label>
              <input
                type="text"
                id="user-name"
                className="modal-input"
                placeholder="Ví dụ: Nguyễn Văn A"
                defaultValue={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* MSSV / Tài khoản */}
            <div className="form-group">
              <label className="modal-label" htmlFor="user-username">MSSV (Tài khoản đăng nhập) <span className="req">*</span></label>
              <input
                type="text"
                id="user-username"
                className="modal-input"
                placeholder="Ví dụ: 52400036"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>



            {/* Vai trò */}
            <div className="form-group">
              <label className="modal-label" htmlFor="user-role">Vai trò hệ thống</label>
              <select
                id="user-role"
                className="modal-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">👤 Thành viên (Mentee/Thành viên CLB)</option>
                <option value="admin">⭐ Quản trị viên (Admin)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-save">
              {editUser ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
