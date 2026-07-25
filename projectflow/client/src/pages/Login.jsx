import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import toast from "react-hot-toast";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const { data } = await authService.login(form);
      login(
        { _id: data._id, name: data.name, email: data.email, role: data.role },
        data.token,
      );
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">P</div>
            <div>
              <div className="auth-logo-text">ProjectFlow</div>
              <div className="auth-logo-sub">Project Management</div>
            </div>
          </div>
          <div className="auth-welcome-copy">
            <h1 className="auth-title">Welcome back 👋</h1>
            <p className="auth-subtitle">
              Sign in to your account to continue to your dashboard.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              name="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
            </div>
            <div className="password-field">
              <input
                id="login-password"
                className="form-input"
                type={showPw ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg w-full auth-submit"
            disabled={loading}
          >
            <LogIn size={16} />
            <span>{loading ? "Signing in…" : "Sign In"}</span>
          </button>
        </form>

        <p className="auth-link">
          Don’t have an account? <Link to="/register">Createe one</Link>
        </p>
      </div>
    </div>
  );
}
