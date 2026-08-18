import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import iconLogo from '../assets/logo.png';
import MentorModal from '../components/MentorModal';
import UserModal from '../components/UserModal';
import { api } from '../services/api';

// Tạo màu avatar từ tên
function getAvatarColor(name = '') {
  const colors = [
    '#c0392b', '#8e44ad', '#2980b9', '#16a085', '#d35400',
    '#27ae60', '#2c3e50', '#e74c3c', '#7f8c8d', '#f39c12',
    '#6c5ce7', '#00b894', '#fd79a8', '#0984e3', '#e17055',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('mentors');

  // Mentors state
  const [mentors, setMentors] = useState([]);
  const [mentorSearch, setMentorSearch] = useState('');
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [editMentorTarget, setEditMentorTarget] = useState(null);
  const [deleteMentorId, setDeleteMentorId] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  // Shared state
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* ── Data Fetching ── */
  const fetchMentorsData = async () => {
    try {
      const data = await api.getMentors();
      setMentors(data || []);
    } catch (err) {
      console.error('Error loading mentors:', err);
    }
  };

  const fetchUsersData = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  useEffect(() => {
    fetchMentorsData();
    fetchUsersData();
  }, []);

  /* ── Mentor CRUD ── */
  const handleSaveMentor = async (mentor) => {
    const isEdit = mentors.some((m) => m.id === mentor.id);
    try {
      await api.saveMentor(mentor);
      await fetchMentorsData();
      showToast(isEdit ? 'Đã cập nhật mentor thành công!' : 'Đã thêm mentor mới!');
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi lưu mentor.', 'error');
    }
    setShowMentorModal(false);
    setEditMentorTarget(null);
  };

  const handleDeleteMentor = async (id) => {
    try {
      await api.deleteMentor(id);
      await fetchMentorsData();
      setDeleteMentorId(null);
      showToast('Đã xoá mentor.', 'info');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xoá mentor.', 'error');
    }
  };

  /* ── User CRUD ── */
  const handleSaveUser = async (userData) => {
    const isEdit = Boolean(userData.id);
    try {
      const res = await api.saveUser(userData);
      if (res.success) {
        await fetchUsersData();
        showToast(isEdit ? 'Đã cập nhật thông tin thành viên!' : 'Đã thêm thành viên mới thành công!');
        setShowUserModal(false);
        setEditUserTarget(null);
      } else {
        showToast(res.message || 'Lưu thành viên thất bại.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu thông tin thành viên.', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const res = await api.deleteUser(id);
      if (res.success) {
        await fetchUsersData();
        setDeleteUserId(null);
        showToast('Đã xoá thành viên thành công.', 'info');
      } else {
        showToast(res.message || 'Lỗi khi xoá thành viên.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Không thể xoá thành viên.', 'error');
    }
  };

  /* ── Export Excel ── */
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const mentorRows = mentors.map((m, idx) => ({
      STT: idx + 1,
      'Biệt danh': m.nickname,
      'Ngành học': m.major,
      'Nhánh': m.track || '—',
      'Sở thích': m.hobbies,
      'Tối đa đăng ký': m.maxSlots,
      'Đã đăng ký': (m.registrations || []).length,
      'Còn lại': m.maxSlots - (m.registrations || []).length,
    }));
    const ws1 = XLSX.utils.json_to_sheet(mentorRows);
    ws1['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 22 }, { wch: 24 }, { wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Danh sách Mentor');

    const regRows = [];
    mentors.forEach((m) => {
      (m.registrations || []).forEach((r) => {
        regRows.push({
          'Tên Mentor (biệt danh)': m.nickname,
          'Tên Mentee': r.menteeName,
          'MSSV Mentee': r.menteeId || '',
          'Thời gian đăng ký': r.registeredAt || '',
        });
      });
    });
    const ws2 = XLSX.utils.json_to_sheet(regRows.length ? regRows : [{ 'Ghi chú': 'Chưa có đăng ký nào' }]);
    ws2['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết đăng ký');

    XLSX.writeFile(wb, `DangKyMentor_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Xuất Excel thành công!');
  };

  /* ── Filtered Data ── */
  const filteredMentors = mentors.filter((m) => {
    const q = mentorSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      (m.major && m.major.toLowerCase().includes(q))
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="ad-layout">
      {/* ══ SIDEBAR ══ */}
      <aside className="ad-sidebar">
        {/* Logo area */}
        <div className="ad-sidebar-logo">
          <div className="ad-logo-wrap">
            <img src={iconLogo} alt="Logo" />
          </div>
        </div>

        {/* Nav */}
        <nav className="ad-nav">
          <button
            className={`ad-nav-item ${activeTab === 'mentors' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentors')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Quản lý Mentor
          </button>

          <button
            className={`ad-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
            </svg>
            Quản lý Thành viên
          </button>
        </nav>

        {/* Logout */}
        <div className="ad-sidebar-footer">
          <button className="ad-logout-btn" onClick={onLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="ad-content">

        {/* ════ TAB: QUẢN LÝ MENTOR ════ */}
        {activeTab === 'mentors' && (
          <div className="ad-page">
            {/* Header */}
            <div className="ad-page-header">
              <div>
                <h1 className="ad-page-title">Quản lý Mentor</h1>
                <p className="ad-page-sub">Tổng số: <strong>{mentors.length} mentor</strong></p>
              </div>
              <button
                className="ad-btn-primary"
                onClick={() => { setEditMentorTarget(null); setShowMentorModal(true); }}
              >
                + Thêm Mentor
              </button>
            </div>

            {/* Search */}
            <div className="ad-search-wrap">
              <svg className="ad-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="ad-search-input"
                placeholder="Tìm kiếm mentor..."
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
              />
            </div>

            {/* Mentor Grid */}
            {filteredMentors.length === 0 ? (
              <div className="ad-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p>Chưa có mentor nào. Nhấn <strong>+ Thêm Mentor</strong> để bắt đầu.</p>
              </div>
            ) : (
              <div className="ad-mentor-grid">
                {filteredMentors.map((m) => {
                  const registered = (m.registrations || []).length;
                  const pct = m.maxSlots > 0 ? Math.round((registered / m.maxSlots) * 100) : 0;
                  const initials = getInitials(m.nickname);
                  const bgColor = getAvatarColor(m.nickname);

                  return (
                    <div key={m.id} className="amc-card">
                      {/* Card header: avatar + name */}
                      <div className="amc-header">
                        <div className="amc-avatar" style={{ background: bgColor }}>
                          {m.avatar
                            ? <img src={m.avatar} alt={m.nickname} />
                            : <span>{initials}</span>
                          }
                        </div>
                        <div className="amc-identity">
                          <h3 className="amc-name">{m.nickname}</h3>
                          <span className="amc-username">@{(m.nickname || '').replace(/\s+/g, '').toLowerCase()}</span>
                        </div>
                      </div>

                      {/* Major badge */}
                      <div className="amc-major-badge">{(m.major || '').toUpperCase()}</div>

                      {/* Track / Nhánh */}
                      <div className="amc-specialty">
                        <span className="amc-star">★</span>
                        <span>{m.track || '—'}</span>
                      </div>

                      {/* Progress */}
                      <div className="amc-progress-section">
                        <div className="amc-progress-row">
                          <span className="amc-progress-label">Mentee</span>
                          <span className="amc-progress-count">{registered}/{m.maxSlots}</span>
                        </div>
                        <div className="amc-track">
                          <div
                            className="amc-bar"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              background: pct >= 100 ? '#ef4444' : '#e8a838'
                            }}
                          />
                        </div>
                      </div>

                      {/* Actions overlay on hover */}
                      <div className="amc-actions">
                        <button
                          className="amc-btn-edit"
                          onClick={() => { setEditMentorTarget(m); setShowMentorModal(true); }}
                          title="Chỉnh sửa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          className="amc-btn-delete"
                          onClick={() => setDeleteMentorId(m.id)}
                          title="Xoá"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ TAB: QUẢN LÝ THÀNH VIÊN ════ */}
        {activeTab === 'users' && (
          <div className="ad-page">
            {/* Header */}
            <div className="ad-page-header">
              <div>
                <h1 className="ad-page-title">Quản lý Thành viên</h1>
                <p className="ad-page-sub">Tổng số: <strong>{users.length} thành viên</strong></p>
              </div>
              <button
                className="ad-btn-primary"
                onClick={() => { setEditUserTarget(null); setShowUserModal(true); }}
              >
                + Thêm Thành viên
              </button>
            </div>

            {/* Search */}
            <div className="ad-search-wrap">
              <svg className="ad-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="ad-search-input"
                placeholder="Tìm kiếm thành viên..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
              <div className="ad-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><rcle cx="9" cy="7" r="4" />
                </svg>
                <p>Không tìm thấy thành viên nào.</p>
              </div>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>HỌ VÀ TÊN</th>
                      <th>MSSV</th>
                      <th>BIỆT DANH</th>
                      <th>MẬT KHẨU</th>
                      <th>VAI TRÒ</th>
                      <th>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, index) => (
                      <tr key={u.id || index}>
                        <td className="td-stt">{String(index + 1).padStart(2, '0')}</td>
                        <td className="td-name">{u.name || 'N/A'}</td>
                        <td className="td-mssv"><span className="mssv-badge">{u.username}</span></td>
                        <td className="td-nickname">@{u.username || '—'}</td>
                        <td className="td-pass">
                          <span className="pass-dots">••••••••</span>
                        </td>
                        <td>
                          <span className={`ad-role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                            {u.role === 'admin' ? 'Admin' : 'Thành viên'}
                          </span>
                        </td>
                        <td className="td-actions">
                          <button
                            className="ad-icon-btn edit"
                            onClick={() => { setEditUserTarget(u); setShowUserModal(true); }}
                            title="Chỉnh sửa"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button
                            className="ad-icon-btn del"
                            onClick={() => setDeleteUserId(u.id)}
                            title="Xoá"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="ad-table-footer">
                  Hiển thị {filteredUsers.length}/{users.length} thành viên
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {showMentorModal && (
        <MentorModal
          mentor={editMentorTarget}
          onSave={handleSaveMentor}
          onClose={() => { setShowMentorModal(false); setEditMentorTarget(null); }}
        />
      )}

      {showUserModal && (
        <UserModal
          show={showUserModal}
          editUser={editUserTarget}
          onSave={handleSaveUser}
          onClose={() => { setShowUserModal(false); setEditUserTarget(null); }}
        />
      )}

      {/* Confirm Delete Mentor */}
      {deleteMentorId && (
        <div className="modal-overlay" onClick={() => setDeleteMentorId(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h4>Xác nhận xoá mentor?</h4>
            <p>Hành động này không thể hoàn tác và sẽ xoá toàn bộ dữ liệu đăng ký của mentor này.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setDeleteMentorId(null)}>Huỷ</button>
              <button className="btn-delete-confirm" onClick={() => handleDeleteMentor(deleteMentorId)}>Xoá</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete User */}
      {deleteUserId && (
        <div className="modal-overlay" onClick={() => setDeleteUserId(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h4>Xác nhận xoá thành viên?</h4>
            <p>Hành động này sẽ xoá tài khoản thành viên khỏi hệ thống.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setDeleteUserId(null)}>Huỷ</button>
              <button className="btn-delete-confirm" onClick={() => handleDeleteUser(deleteUserId)}>Xoá</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
