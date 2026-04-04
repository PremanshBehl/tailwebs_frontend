import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { setCredentials, setLoading, setError, clearError } from '../store/slices/authSlice';
import { loginUser, registerUser } from '../api/axios';
import { 
  AlertCircle, UserPlus, Lock, 
  Lightbulb, Mail, User
} from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const { register: reg, handleSubmit, reset, formState: { errors } } = useForm();

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    reset();
    dispatch(clearError());
  };

  const onSubmit = async (data) => {
    dispatch(setLoading(true));
    dispatch(clearError());
    try {
      let res;
      if (mode === 'login') {
        res = await loginUser({ email: data.email, password: data.password });
      } else {
        res = await registerUser(data);
      }
      
      const { user, token } = res.data;
      dispatch(setCredentials({ user, token }));
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Authentication failed'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const setTestCreds = (role) => {
    reset({
      email: role === 'teacher' ? 'teacher@test.com' : 'student@test.com',
      password: 'password123',
      role: role
    });
    setMode('login');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-text">
            tailwebs<span className="auth-logo-dot">.</span>
          </div>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Enter your credentials to access your dashboard' : 'Join as a teacher or student'}
          </p>
        </div>

        {/* Auth Toggle */}
        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button 
            type="button" 
            id="btn-tab-register"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 24, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> Something went wrong. {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Name — register only */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="f-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                <input
                  id="f-name"
                  className="form-input"
                  placeholder="Premansh"
                  style={{ paddingLeft: 42 }}
                  {...reg('name', { required: 'Name is required' })}
                />
              </div>
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="f-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
              <input
                id="f-email"
                type="email"
                className="form-input"
                placeholder="s@gmail.com"
                style={{ paddingLeft: 42 }}
                {...reg('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
              />
            </div>
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="f-pass">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
              <input
                id="f-pass"
                type="password"
                className="form-input"
                placeholder="••••••••"
                style={{ paddingLeft: 42 }}
                {...reg('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
              />
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          {/* Role — register only */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="f-role">I am a</label>
              <select id="f-role" className="form-select" {...reg('role', { required: 'Role is required' })}>
                <option value="">Select role…</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {errors.role && <p className="form-error">{errors.role.message}</p>}
            </div>
          )}

          <button type="submit" id="btn-auth-submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 12 }}>
            {loading 
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign In' : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserPlus size={18} /> Create Account
                  </div>
                ))
            }
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button type="button" className="btn-link" onClick={toggleMode} style={{ marginLeft: 6, fontWeight: 600, color: 'var(--red)' }}>
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>

        {/* Quick Setup Hint */}
        <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            <Lightbulb size={16} color="var(--red)" />
            <span>Quick Setup</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setTestCreds('teacher')}>Teacher</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setTestCreds('student')}>Student</button>
          </div>
        </div>
      </div>
    </div>
  );
}
