import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  BookOpen,
  LayoutDashboard,
  BarChart3,
  LogOut,
  FolderPlus,
  Layers,
  ChevronDown,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';

const Navbar = () => {
  const { user, logout, quickDemoLogin, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleDemoSwitch = async (roleType) => {
    setShowDemoMenu(false);
    await quickDemoLogin(roleType);
    if (roleType === 'prof') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Main Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
                J
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                  Joineazy
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Student & Assignment System
                </span>
              </div>
            </Link>

            {/* Role Links */}
            {user && (
              <div className="hidden md:flex items-center space-x-1">
                {isStudent && (
                  <>
                    <Link
                      to="/student/dashboard"
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive('/student/dashboard')
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to="/student/assignments"
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive('/student/assignments')
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Assignments</span>
                    </Link>

                    <Link
                      to="/student/groups"
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive('/student/groups')
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>My Groups</span>
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive('/admin/dashboard')
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics Dashboard</span>
                    </Link>

                    <Link
                      to="/admin/assignments"
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive('/admin/assignments')
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Manage Assignments</span>
                    </Link>

                    <Link
                      to="/admin/tracking"
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive('/admin/tracking')
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Submission Tracking</span>
                    </Link>

                    <Link
                      to="/admin/groups"
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive('/admin/groups')
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>All Groups</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Section: Role Switcher Demo + User Profile + Logout */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Switcher (Crucial for easy evaluator demonstration) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors shadow-2xs"
                title="Switch demo account seamlessly"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Switch Demo User</span>
                <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Test Account
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('prof')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold block">Prof. Dr. Alan Vance</span>
                      <span className="text-[10px] text-slate-400">Admin / Professor</span>
                    </div>
                    <Badge variant="professor">Admin</Badge>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('alex')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between border-t border-slate-100"
                  >
                    <div>
                      <span className="font-semibold block">Alex Rivera</span>
                      <span className="text-[10px] text-slate-400">Leader, Alpha Innovators</span>
                    </div>
                    <Badge variant="student">Student</Badge>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('emma')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between border-t border-slate-100"
                  >
                    <div>
                      <span className="font-semibold block">Emma Watson</span>
                      <span className="text-[10px] text-slate-400">Leader, Byte Crafters</span>
                    </div>
                    <Badge variant="student">Student</Badge>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {user.name}
                  </span>
                  <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                    <Badge variant={user.role === 'admin' ? 'professor' : 'student'}>
                      {user.role === 'admin' ? 'Professor' : 'Student'}
                    </Badge>
                    {user.student_id && (
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        {user.student_id}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
