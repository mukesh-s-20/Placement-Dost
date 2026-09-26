import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  Code2,
  Users2,
  Coins,
  Flame,
  LogOut,
  ChevronDown,
  UserCheck
} from 'lucide-react';

export const Navbar = ({ currentTab, onNavigate, onOpenLedger }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => onNavigate('dashboard')}>
          <div className="brand-logo-icon">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="brand-name">Placement Dost</span>
            <span className="brand-badge">AI Placement Platform</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-links">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('learn')}
            className={`nav-link ${currentTab === 'learn' ? 'active' : ''}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Learn</span>
          </button>

          <button
            onClick={() => onNavigate('prep-plan')}
            className={`nav-link ${currentTab === 'prep-plan' ? 'active' : ''}`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Prep Plan</span>
          </button>

          <button
            onClick={() => onNavigate('dsa')}
            className={`nav-link ${currentTab === 'dsa' ? 'active' : ''}`}
          >
            <Code2 className="w-4 h-4" />
            <span>DSA Practice</span>
          </button>

          <button
            onClick={() => onNavigate('peer')}
            className={`nav-link ${currentTab === 'peer' ? 'active' : ''}`}
          >
            <Users2 className="w-4 h-4" />
            <span>Peer Mentors</span>
          </button>
        </nav>

        {/* User Stats & Profile */}
        <div className="navbar-right">
          {/* Points Pill (Opens Ledger) */}
          <button
            onClick={onOpenLedger}
            className="points-badge-pill text-xs font-semibold"
            title="View Points Ledger"
          >
            <Coins className="w-3.5 h-3.5 text-slate-700" />
            <span>{user?.points ?? 10} pts</span>
          </button>

          {/* Daily Streak Pill */}
          <div className="streak-badge-pill text-xs font-semibold" title={`${user?.streakDaily || 1}-day active streak`}>
            <Flame className="w-3.5 h-3.5 text-slate-700" />
            <span>{user?.streakDaily || 1}d</span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="user-profile-button"
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'student'}`}
                alt={user?.name}
                className="user-avatar-small"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">{user?.name || 'Student'}</div>
                <div className="text-[11px] text-slate-500 truncate max-w-[120px]">{user?.college || 'CIT'}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown-menu">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{user?.name}</p>
                  <p className="text-[11px] text-slate-600 truncate">{user?.department}</p>
                  <div className="mt-2 text-xs flex justify-between text-slate-700 pt-2 border-t border-slate-200">
                    <span>Baseline Score:</span>
                    <strong className="text-slate-900 font-bold">{user?.comprehensionBaseline || 0}/100</strong>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenLedger();
                      setDropdownOpen(false);
                    }}
                    className="dropdown-item flex items-center gap-2"
                  >
                    <Coins className="w-4 h-4 text-slate-600" />
                    <span>Points Ledger & Rules</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('onboarding');
                      setDropdownOpen(false);
                    }}
                    className="dropdown-item flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-slate-600" />
                    <span>Re-evaluate Baseline</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="dropdown-item flex items-center gap-2 text-slate-700 hover:text-red-600 border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
