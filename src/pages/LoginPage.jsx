import { useState } from "react";
import iconLogo from "../assets/logo.png";
import { api } from "../services/api";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Vui lòng điền tài khoản.");
      return;
    }
    if (!password) {
      setError("Vui lòng điền mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.message || "Tài khoản hoặc mật khẩu không đúng.");
      }
    } catch (err) {
      setError(err.message || "Không thể đăng nhập. Vui lòng kiểm tra lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-wrapper">
        {/* Left Brand Panel */}
        <div className="brand-panel">
          <div className="brand-header">
            <img src={iconLogo} alt="ICON Club Logo" className="tdt-logo-img" />
            <div className="club-name">
              CÂU LẠC BỘ <br />
              <strong>ICON</strong>
            </div>
          </div>

          <div className="brand-content">
            <h1>
              Đăng ký mentor <br />
              câu lạc bộ học thuật <br />
              ICON
            </h1>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="form-panel">
          <div className="form-container">
            <div className="form-header">
              <h2>Đăng nhập</h2>
              <p>Đăng ký mentor câu lạc bộ ICON</p>
              <div className="separator-bar">
                <div className="bar-blue"></div>
                <div className="bar-red"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Username */}
              <div className="form-group">
                <label className="input-label" htmlFor="login-username">
                  Tài khoản
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    id="login-username"
                    className="form-input"
                    placeholder="Nhập MSSV"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="input-label" htmlFor="login-password">
                  Mật khẩu
                </label>
                <div className="input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    className="form-input form-input-password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={
                      showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                    }
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="error-msg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
