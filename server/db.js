import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true
};

const dbName = process.env.DB_NAME || 'web_mentor';

const pool = mysql.createPool({
  ...dbConfig,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Auto-test and initialize database on startup
(async () => {
  try {
    // 1. Check root connection & auto-create database if not exists
    const rootConnection = await mysql.createConnection(dbConfig);
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );

    // 2. Select database and add missing columns if tables exist
    await rootConnection.query(`USE \`${dbName}\`;`);
    try {
      const [cols] = await rootConnection.query("SHOW COLUMNS FROM users LIKE 'name'");
      if (cols.length === 0) {
        await rootConnection.query("ALTER TABLE users ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT 'Thành viên'");
      }
    } catch {
      // Table users does not exist yet, schema.sql will create it
    }

    try {
      const [trackCols] = await rootConnection.query("SHOW COLUMNS FROM mentors LIKE 'track'");
      if (trackCols.length === 0) {
        await rootConnection.query("ALTER TABLE mentors ADD COLUMN track VARCHAR(100) NOT NULL DEFAULT 'Lập trình ứng dụng'");
      }
    } catch {
      // Table mentors does not exist yet, schema.sql will create it
    }

    // 3. Read schema.sql and execute it automatically
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      await rootConnection.query(sqlContent);
    }
    await rootConnection.end();

    // 4. Test pool connection
    const conn = await pool.getConnection();
    console.log(`✅ Kết nối CSDL MySQL (${dbName}) thành công!`);
    conn.release();
  } catch (error) {
    console.error('❌ Kết nối MySQL thất bại:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
      console.error('🔑 Sai mật khẩu root MySQL! Vui lòng kiểm tra lại DB_PASSWORD trong file server/.env');
    } else {
      console.error('💡 Vui lòng kiểm tra lại dịch vụ MySQL Server trên localhost:3306.');
    }
  }
})();

export default pool;
