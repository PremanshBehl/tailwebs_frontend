import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <nav className="navbar">
      <div className="navbar-brand monospace">
        Tailwebs<span style={{ opacity: 0.3 }}>_</span>CORE
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-avatar monospace">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="navbar-name monospace">{user?.name}</div>
            <div className="navbar-role monospace">{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={() => dispatch(logout())}>
          <LogOut size={14} /> LOGOUT
        </button>
      </div>
    </nav>
  );
}
