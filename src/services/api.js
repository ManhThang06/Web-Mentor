// Dùng biến môi trường VITE_API_URL khi deploy, fallback về localhost khi dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LOCAL_STORAGE_KEY = 'icon_mentors';
const SESSION_KEY = 'icon_session';

// Local storage fallback helpers
const getLocalMentors = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || []; }
  catch { return []; }
};
const setLocalMentors = (data) => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

// Get auth headers with JWT token
const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }
  } catch (e) {
    // ignore
  }
  return headers;
};

export const api = {
  // 1. Auth Login
  async login(username, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại.');
      return data;
    } catch (err) {
      console.error('Lỗi đăng nhập:', err.message);
      throw err;
    }
  },

  // 2. Fetch all mentors
  async getMentors() {
    try {
      const res = await fetch(`${API_BASE_URL}/mentors`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLocalMentors(data.mentors); // Sync local cache
        return data.mentors;
      }
      throw new Error(data.message || 'Không thể tải danh sách mentor.');
    } catch (err) {
      console.warn('Backend server offline, loading mentors from localStorage:', err.message);
      return getLocalMentors();
    }
  },

  // 3. Save / Update Mentor
  async saveMentor(mentor) {
    try {
      const res = await fetch(`${API_BASE_URL}/mentors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(mentor)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lưu mentor thất bại.');
      
      // Update local storage fallback as well
      const current = getLocalMentors();
      const updated = current.find(m => m.id === mentor.id)
        ? current.map(m => m.id === mentor.id ? mentor : m)
        : [...current, { ...mentor, registrations: mentor.registrations || [] }];
      setLocalMentors(updated);

      return data;
    } catch (err) {
      console.warn('Backend server offline, saving mentor to localStorage:', err.message);
      const current = getLocalMentors();
      const updated = current.find(m => m.id === mentor.id)
        ? current.map(m => m.id === mentor.id ? mentor : m)
        : [...current, { ...mentor, registrations: [] }];
      setLocalMentors(updated);
      return { success: true, localOnly: true };
    }
  },

  // 4. Delete Mentor
  async deleteMentor(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/mentors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xoá mentor thất bại.');

      const updated = getLocalMentors().filter(m => m.id !== id);
      setLocalMentors(updated);

      return data;
    } catch (err) {
      console.warn('Backend server offline, deleting mentor from localStorage:', err.message);
      const updated = getLocalMentors().filter(m => m.id !== id);
      setLocalMentors(updated);
      return { success: true, localOnly: true };
    }
  },

  // 5. Register Mentee
  async registerMentee(mentorId, menteeName, menteeId) {
    try {
      const res = await fetch(`${API_BASE_URL}/mentors/${mentorId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menteeName, menteeId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại.');
      return data;
    } catch (err) {
      console.warn('Backend server offline, registering mentee in localStorage:', err.message);
      const mentors = getLocalMentors();
      const nowStr = new Date().toLocaleString('vi-VN');
      const updated = mentors.map(m => {
        if (m.id === mentorId) {
          const regs = m.registrations || [];
          return {
            ...m,
            registrations: [...regs, { menteeName, menteeId, registeredAt: nowStr }]
          };
        }
        return m;
      });
      setLocalMentors(updated);
      return { success: true, localOnly: true };
    }
  },

  // 6. Fetch Users (Quản lý Thành viên)
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('icon_users', JSON.stringify(data.users));
        return data.users;
      }
      throw new Error(data.message || 'Không thể tải danh sách thành viên.');
    } catch (err) {
      console.warn('Backend server offline, loading users from localStorage:', err.message);
      try { return JSON.parse(localStorage.getItem('icon_users')) || []; }
      catch { return []; }
    }
  },

  // 7. Save / Update User
  async saveUser(user) {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(user)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lưu thông tin thành viên thất bại.');
      return data;
    } catch (err) {
      console.warn('Backend server offline, fallback saving user:', err.message);
      const current = JSON.parse(localStorage.getItem('icon_users') || '[]');
      let updated;
      if (user.id) {
        updated = current.map(u => u.id === user.id ? { ...u, ...user } : u);
      } else {
        updated = [...current, { ...user, id: Date.now(), created_at: new Date().toISOString() }];
      }
      localStorage.setItem('icon_users', JSON.stringify(updated));
      return { success: true, localOnly: true };
    }
  },

  // 7.5. Change Password (lưu thẳng vào database MySQL)
  async changePassword(userId, currentPassword, newPassword) {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đổi mật khẩu thất bại.');
    return data;
  },

  // 8. Delete User
  async deleteUser(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xoá thành viên thất bại.');
      return data;
    } catch (err) {
      console.warn('Backend server offline, fallback deleting user:', err.message);
      const current = JSON.parse(localStorage.getItem('icon_users') || '[]');
      const updated = current.filter(u => u.id !== id);
      localStorage.setItem('icon_users', JSON.stringify(updated));
      return { success: true, localOnly: true };
    }
  },

  // 9. Delete Registration (xoá đăng ký của mentee)
  async deleteRegistration(registrationId) {
    const res = await fetch(`${API_BASE_URL}/registrations/${registrationId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Xoá đăng ký thất bại.');
    return data;
  },

  // 10. Check registration status (kiểm tra mentee đã đăng ký mentor nào chưa)
  async checkRegistration(menteeId) {
    try {
      const res = await fetch(`${API_BASE_URL}/registrations/check/${menteeId}`);
      const data = await res.json();
      if (res.ok && data.success) return data; // { registered: bool, mentorId: string|null }
      return { registered: false, mentorId: null };
    } catch {
      return { registered: false, mentorId: null };
    }
  }
};
