import { useState, useEffect } from 'react';

export default function UserModal({ show, onClose, onSave, editUser }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editUser) {
      setName(editUser.name || '');
      setUsername(editUser.username || '');
      setPassword(editUser.password || '');
      setRole(editUser.role || 'user');
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setRole('user');
    }
    setError('');
    setShowPassword(false);
  }, [editUser, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Vui lòng nhập Họ và tên thành viên.'); return; }
    if (!username.trim()) { setError('Vui lòng nhập MSSV (tài khoản).'); return; }
    if (!password) { setError('Vui lòng nhập mật khẩu.'); return; }

    onSave({
      id: editUser?.id || null,
      name: name.trim(),
      username: username.trim(),
      password: password,
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

            {/* Mật khẩu */}
            <div className="form-group">
              <label className="modal-label" htmlFor="user-password">Mật khẩu <span className="req">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="user-password"
                  className="modal-input"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
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
