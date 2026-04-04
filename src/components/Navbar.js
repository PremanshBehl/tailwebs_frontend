import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        tailwebs<span className="auth-logo-dot">.</span>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'none', md: 'block' }}>
            <div className="navbar-name">{user?.name}</div>
            <div className="navbar-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={() => dispatch(logout())}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </nav>
  );
}
