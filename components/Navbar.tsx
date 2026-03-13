import React, { useState, useEffect } from 'react';
import imgArt from '../buddy_team.jpg';
import { Menu, X, Users, Home, Layout, Mail, Zap, LogIn, LogOut, UserCircle, ShieldAlert, Bell } from 'lucide-react';
import { Page, UserData } from '../types';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onAuthNavigate: (mode: 'login' | 'signup') => void;
  user: UserData | null;
  onLogout: () => void;
  isRegistrationOpen?: boolean;
  unreadCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onAuthNavigate, user, onLogout, isRegistrationOpen = true, unreadCount = 0 }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { name: string; id: Page; icon: React.ReactNode }[] = [
    { name: 'Asosiy', id: 'home', icon: <Home className="w-4 h-4" /> },
    { name: 'Xizmatlar', id: 'features', icon: <Layout className="w-4 h-4" /> },
    { name: 'Kuratorlar', id: 'team', icon: <Users className="w-4 h-4" /> },
    { name: 'Bog\'lanish', id: 'contact', icon: <Mail className="w-4 h-4" /> },
  ];

  if (user) {
    if (user.role === 'admin') {
      navLinks.push({ name: 'Admin Panel', id: 'admin', icon: <ShieldAlert className="w-4 h-4" /> });
    } else {
      navLinks.push({ name: 'Panel', id: 'dashboard', icon: <Layout className="w-4 h-4" /> });
    }
  }

  const handleLinkClick = (id: Page) => {
    onNavigate(id);
    setIsMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled || isMenuOpen ? 'bg-[#0a0a0c] border-b border-white/10 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)]' : 'bg-transparent py-4 md:py-6'
      }`}>
      <div className="max-w-7xl overflow-hidden mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div onClick={() => handleLinkClick('home')} className="flex items-center space-x-2 md:space-x-3 group cursor-pointer shrink-0">
            <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#1a1a1e] rounded-xl md:rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 border border-white/10 overflow-hidden">
              <img
                src={imgArt}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xl md:text-2xl font-black tracking-tighter text-white">Buddy<span className="text-purple-400">Team</span></span>
              <p className="text-[8px] md:text-[10px] text-purple-300 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] leading-none">Команды</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center space-x-2 relative ${(link.id === 'dashboard' || link.id === 'admin')
                  ? 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
                  : currentPage === link.id
                    ? 'text-white bg-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.icon}
                <span>{link.name}</span>
                {(link.id === 'dashboard' || link.id === 'admin') && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}

            <div className="ml-4 pl-4 border-l border-white/10 flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 min-w-0">
                    <UserCircle className="w-5 h-5 text-purple-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[120px]">{user.name}</span>
                      <span className="text-[9px] font-black uppercase text-purple-400 tracking-tighter truncate">{user.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                    title="Chiqish"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onAuthNavigate('login')}
                    className="text-slate-400 hover:text-white text-sm font-bold px-4 py-2 transition-colors"
                  >
                    Kirish
                  </button>
                  {isRegistrationOpen && (
                    <button
                      onClick={() => onAuthNavigate('signup')}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-600/20 flex items-center space-x-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Ro'yxatdan o'tish</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 md:p-3 bg-white/10 rounded-xl text-white transition-colors border border-white/20 shadow-lg active:scale-90"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden bg-[#0f0f12] absolute top-full left-0 right-0 m-4 py-6 px-4 border border-white/20 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`flex items-center space-x-4 p-5 rounded-2xl text-lg font-black tracking-tight transition-all relative ${currentPage === link.id ? 'text-indigo-400 bg-white/10 shadow-inner' : 'text-slate-300 hover:bg-white/5'
                  }`}
              >
                <div className={`${currentPage === link.id ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {link.icon}
                </div>
                <span>{link.name}</span>
                {(link.id === 'dashboard' || link.id === 'admin') && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full font-black">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}

            <div className="h-px bg-white/10 my-4 mx-2"></div>

            {user ? (
              <button
                onClick={() => { onLogout(); setIsMenuOpen(false); }}
                className="w-full py-5 bg-red-500/10 text-red-400 font-black rounded-2xl border border-red-500/20 flex items-center justify-center space-x-3 active:scale-95 transition-transform"
              >
                <LogOut className="w-5 h-5" />
                <span>Chiqish ({user.name})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => { onAuthNavigate('login'); setIsMenuOpen(false); }}
                  className="py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 active:scale-95 transition-transform"
                >
                  Kirish
                </button>
                {isRegistrationOpen && (
                  <button
                    onClick={() => { onAuthNavigate('signup'); setIsMenuOpen(false); }}
                    className="py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform"
                  >
                    Qo'shilish
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
