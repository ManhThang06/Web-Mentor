import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 0. Welcome & Server Status page
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #f8fafc; color: #1e293b; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="color: #2563eb; margin-bottom: 10px;">🚀 Web_Mentor Backend API Server</h1>
      <p style="font-size: 1.1rem; color: #64748b;">Backend Server đang hoạt động tốt tại cổng <strong>5000</strong>!</p>
      <div style="margin: 20px 0; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: left; max-width: 500px;">
        <p>🌐 <strong>Giao diện ứng dụng (Frontend UI):</strong> <a href="http://localhost:5173" style="color: #2563eb; font-weight: bold; text-decoration: none;">http://localhost:5173</a></p>
        <p>🔗 <strong>API Health Status:</strong> <a href="http://localhost:5000/api/health" style="color: #059669;">/api/health</a></p>
        <p>📋 <strong>API Mentors List:</strong> <a href="http://localhost:5000/api/mentors" style="color: #059669;">/api/mentors</a></p>
      </div>
      <p style="color: #94a3b8; font-size: 0.9rem;">Vui lòng mở <strong><a href="http://localhost:5173" style="color: #2563eb;">http://localhost:5173</a></strong> trên trình duyệt để sử dụng ứng dụng Web_Mentor.</p>
    </div>
  `);
});

// 1. Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1 + 1 AS result');
    res.json({ status: 'ok', dbConnected: true, message: 'Server and Database are active!' });
  } catch (error) {
    res.status(500).json({ status: 'error', dbConnected: false, error: error.message });
  }
});

// 2. Auth Login API
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tài khoản và mật khẩu.' });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, name, username, password, role FROM users WHERE username = ?',
      [username.trim()]
    );

    if (users.length > 0) {
      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return res.json({
          success: true,
          user: { id: user.id, name: user.name || user.username, username: user.username, role: user.role }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng.' });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập.', error: error.message });
  }
});

// 2.0. Change Password API (lưu thẳng vào database)
app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự.' });
  }

  try {
    // Verify current password
    const [users] = await pool.query(
      'SELECT id, password FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    return res.json({ success: true, message: 'Đổi mật khẩu thành công. Mật khẩu mới đã được lưu vào cơ sở dữ liệu.' });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đổi mật khẩu.', error: error.message });
  }
});

// 2.1. Get All Users (Quản lý thành viên)
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, username, password, role, created_at FROM users ORDER BY id DESC');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách thành viên.', error: error.message });
  }
});

// 2.2. Create or Update User
app.post('/api/users', async (req, res) => {
  const { id, name, username, password, role } = req.body;

  if (!username || !name) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ Họ tên và MSSV (Tài khoản).' });
  }

  try {
    if (id) {
      // Fetch the user's existing password from the database
      const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [id]);
      let passwordToSave;
      if (users.length > 0) {
        const existingPasswordHash = users[0].password;
        // If password is provided and different from existing hash, hash it. Otherwise keep existing hash.
        if (password && password !== existingPasswordHash) {
          passwordToSave = await bcrypt.hash(password, 10);
        } else {
          passwordToSave = existingPasswordHash;
        }
      } else {
        // Fallback if user doesn't exist yet but ID is provided
        const plainPassword = password || username.trim();
        passwordToSave = await bcrypt.hash(plainPassword, 10);
      }

      // Update
      await pool.query(
        'UPDATE users SET name = ?, username = ?, password = ?, role = ? WHERE id = ?',
        [name.trim(), username.trim(), passwordToSave, role || 'user', id]
      );
      res.json({ success: true, message: 'Đã cập nhật thông tin thành viên.' });
    } else {
      // Insert
      const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: `Tài khoản MSSV ${username.trim()} đã tồn tại trong hệ thống.` });
      }

      // Default password to username (MSSV) if not provided
      const plainPassword = password || username.trim();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const [result] = await pool.query(
        'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
        [name.trim(), username.trim(), hashedPassword, role || 'user']
      );
      res.json({ success: true, userId: result.insertId, message: 'Thêm thành viên mới thành công.' });
    }
  } catch (error) {
    console.error('Save user error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu thông tin thành viên.', error: error.message });
  }
});

// 2.3. Delete User
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xoá thành viên thành công.' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi xoá thành viên.', error: error.message });
  }
});

// 3. Get All Mentors (with Registrations) API
app.get('/api/mentors', async (req, res) => {
  try {
    const [mentors] = await pool.query('SELECT * FROM mentors ORDER BY created_at DESC');
    const [registrations] = await pool.query('SELECT * FROM registrations ORDER BY created_at ASC');

    const result = mentors.map((m) => {
      const regs = registrations
        .filter((r) => r.mentor_id === m.id)
        .map((r) => ({
          id: r.id,
          menteeName: r.mentee_name,
          menteeId: r.mentee_id,
          registeredAt: r.registered_at
        }));

      return {
        id: m.id,
        nickname: m.nickname,
        mssv: m.mssv || '',
        major: m.major,
        track: m.track || 'Lập trình ứng dụng',
        hobbies: m.hobbies,
        maxSlots: m.max_slots,
        avatar: m.avatar,
        facebookUrl: m.facebook_url,
        registrations: regs
      };
    });

    res.json({ success: true, mentors: result });
  } catch (error) {
    console.error('Get mentors error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi truy vấn cơ sở dữ liệu.', error: error.message });
  }
});

// 4. Create or Update Mentor API
app.post('/api/mentors', async (req, res) => {
  const { id, nickname, mssv, major, track, hobbies, maxSlots, avatar, facebookUrl } = req.body;

  if (!nickname || !major) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (nickname, major).' });
  }

  const mentorId = id || `m-${Date.now()}`;

  try {
    const [existing] = await pool.query('SELECT id FROM mentors WHERE id = ?', [mentorId]);

    if (existing.length > 0) {
      // Update
      await pool.query(
        `UPDATE mentors 
         SET nickname = ?, mssv = ?, major = ?, track = ?, hobbies = ?, max_slots = ?, avatar = ?, facebook_url = ?
         WHERE id = ?`,
        [nickname, mssv || '', major, track || 'Lập trình ứng dụng', hobbies || '', maxSlots || 5, avatar || '', facebookUrl || '', mentorId]
      );
    } else {
      // Insert
      await pool.query(
        `INSERT INTO mentors (id, nickname, mssv, major, track, hobbies, max_slots, avatar, facebook_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [mentorId, nickname, mssv || '', major, track || 'Lập trình ứng dụng', hobbies || '', maxSlots || 5, avatar || '', facebookUrl || '']
      );
    }

    res.json({ success: true, mentorId });
  } catch (error) {
    console.error('Save mentor error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu mentor vào MySQL.', error: error.message });
  }
});

// 5. Delete Mentor API
app.delete('/api/mentors/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM mentors WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xoá mentor thành công.' });
  } catch (error) {
    console.error('Delete mentor error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi xoá mentor.', error: error.message });
  }
});

// 6. Register Mentee API
app.post('/api/mentors/:id/register', async (req, res) => {
  const { id } = req.params;
  const { menteeName, menteeId } = req.body;

  if (!menteeName || !menteeId) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Họ tên và MSSV.' });
  }

  try {
    const nowStr = new Date().toLocaleString('vi-VN');
    await pool.query(
      `INSERT INTO registrations (mentor_id, mentee_name, mentee_id, registered_at)
       VALUES (?, ?, ?, ?)`,
      [id, menteeName, menteeId, nowStr]
    );

    res.json({ success: true, message: 'Đăng ký mentor thành công.' });
  } catch (error) {
    console.error('Register mentee error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu đăng ký vào MySQL.', error: error.message });
  }
});

// 7. Check Registration (kiểm tra mentee đã đăng ký mentor nào chưa)
app.get('/api/registrations/check/:menteeId', async (req, res) => {
  const { menteeId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT mentor_id FROM registrations WHERE mentee_id = ? LIMIT 1',
      [menteeId]
    );
    if (rows.length > 0) {
      return res.json({ success: true, registered: true, mentorId: rows[0].mentor_id });
    }
    return res.json({ success: true, registered: false, mentorId: null });
  } catch (error) {
    console.error('Check registration error:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra đăng ký.', error: error.message });
  }
});

// 8. Delete Registration (xoá đăng ký của một mentee)
app.delete('/api/registrations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM registrations WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xoá đăng ký thành công.' });
  } catch (error) {
    console.error('Delete registration error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi xoá đăng ký.', error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});
