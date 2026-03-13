
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import Features from './components/Features';
import Team from './components/Team';
import Contact from './components/Contact';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import { StudentProgress, WeeklyHighlight, TeamMember, Season, Notification, Page, UserData } from './types';
import api, { WS_URL, MEDIA_BASE_URL } from './api';

const BuddyStorage = {
  KEYS: {
    CURRENT_PAGE: 'buddy_current_page',
    USER: 'buddy_user',
    ALL_USERS: 'buddy_all_users',
    STUDENTS_DATA: 'buddy_all_students_data',
    HIGHLIGHTS: 'buddy_weekly_highlights',
    REGISTRATION_OPEN: 'buddy_is_registration_open',
    CURATOR_REGISTRATION_OPEN: 'buddy_is_curator_registration_open',
    NOTIFICATIONS: 'buddy_notifications',
    SEASONS: 'buddy_seasons',
    ACTIVE_SEASON_ID: 'buddy_active_season_id',
    CHAT_MESSAGES: 'buddy_chat_messages'
  },
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage`, e);
    }
  },
  load: <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.error(`Failed to load ${key} from localStorage`, e);
      return defaultValue;
    }
  }
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    try {
      return (localStorage.getItem(BuddyStorage.KEYS.CURRENT_PAGE) as Page) || 'home';
    } catch (e) {
      return 'home';
    }
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Data states
  const [allStudentsData, setAllStudentsData] = useState<StudentProgress[]>([]);
  const [weeklyHighlights, setWeeklyHighlights] = useState<WeeklyHighlight[]>([]);
  const [dynamicTeamMembers, setDynamicTeamMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([{ id: '1', number: 1, startDate: '2025-05-01', isActive: true }]);
  const [activeSeasonId, setActiveSeasonId] = useState('1');

  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isCuratorRegistrationOpen, setIsCuratorRegistrationOpen] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>(() => BuddyStorage.load(BuddyStorage.KEYS.NOTIFICATIONS, [
    {
      id: 'n1',
      title: 'Xush kelibsiz!',
      message: 'Buddy Team portalining yangi talqiniga xush kelibsiz. Monitoring bo\'limini tekshirishni unutmang.',
      type: 'info',
      timestamp: new Date().toISOString(),
      isRead: false,
      targetRole: 'all',
      sender: 'Sistema'
    }
  ]));

  const filteredNotifications = useMemo(() => {
    if (!user) return [];

    // Admin barcha xabarlarni ko'ra oladi
    if (user.role === 'admin') return notifications;

    return notifications.filter(notif => {
      // Shaxsiy xabarni faqat o'sha user ko'radi
      if (notif.targetUserId) {
        return notif.targetUserId === user.id;
      }
      // Aks holda role bo'yicha tekshirish
      return notif.targetRole === 'all' || notif.targetRole === user.role;
    });
  }, [notifications, user]);

  // Sync currentPage with URL path (only purely informational)
  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const path = segments[0] || 'home';

    // Valid main pages - including login/register aliases
    const validPages = ['home', 'features', 'team', 'contact', 'auth', 'dashboard', 'admin', 'login', 'signup'];

    if (validPages.includes(path)) {
      if (path === 'login' || path === 'signup') {
        setCurrentPage('auth');
      } else {
        setCurrentPage(path as Page);
      }
    }
  }, [location]);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    navigate(`/${page === 'home' ? '' : page}`);
  };

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(BuddyStorage.KEYS.CURRENT_PAGE, currentPage);
  }, [currentPage]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const userRes = await api.get('auth/me/');
          setUser(userRes.data as UserData);
        }
      } catch (err) {
        console.error("Failed to authenticate user", err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // WebSocket for Real-time Notifications
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('access_token');
    // Use dynamic WS_URL from api.ts
    const wsUrl = `${WS_URL}notifications/?token=${token}`;

    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications(prev => {
          if (prev.some(n => n.id === data.notification.id)) return prev;
          const newList = [data.notification, ...prev];
          BuddyStorage.save(BuddyStorage.KEYS.NOTIFICATIONS, newList);
          return newList;
        });
      } else if (data.type === 'monitoring_update') {
        setAllStudentsData(prev => {
          const index = prev.findIndex(m => m.id === data.monitoring.id);
          if (index !== -1) {
            const newList = [...prev];
            newList[index] = data.monitoring;
            return newList;
          }
          return [...prev, data.monitoring];
        });
      } else if (data.type === 'user_status') {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (data.status === 'online') {
            newSet.add(data.user_id);
          } else {
            newSet.delete(data.user_id);
          }
          return newSet;
        });
      }
    };

    socket.onopen = () => console.log('WebSocket Connected');
    socket.onerror = (e) => console.error('WebSocket Error:', e);
    socket.onclose = () => console.log('WebSocket Disconnected');

    return () => {
      socket.close();
    };
  }, [user]);

  // Fetch public data (users/seasons) immediately, no auth needed
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [usersRes, seasonsRes] = await Promise.all([
          api.get('users/').catch(() => ({ data: [] })),
          api.get('seasons/').catch(() => ({ data: [] })),
        ]);
        setAllUsers(usersRes.data);
        setSeasons(seasonsRes.data);
        if (seasonsRes.data.length > 0) {
          const activeSeason = seasonsRes.data.find((s: Season) => s.isActive) || seasonsRes.data[0];
          setActiveSeasonId(activeSeason.id);
        }
      } catch (e) {
        console.error('Public data load error', e);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchPublicData();
  }, []); // Run once on mount, no auth needed

  // Fetch application data periodically or when auth changes
  useEffect(() => {
    if (!user) return; // Auth-protected data only for logged-in users
    const fetchData = async () => {
      try {
        const [usersRes, seasonsRes, monitorRes, hlRes, notifRes] = await Promise.all([
          api.get('users/').catch(() => ({ data: [] })),
          api.get('seasons/').catch(() => ({ data: [] })),
          api.get('monitoring/').catch(() => ({ data: [] })),
          api.get('highlights/').catch(() => ({ data: [] })),
          api.get('notifications/').catch(() => ({ data: [] }))
        ]);

        setAllUsers(usersRes.data);
        setSeasons(seasonsRes.data);
        if (seasonsRes.data.length > 0) {
          const activeSeason = seasonsRes.data.find((s: Season) => s.isActive) || seasonsRes.data[0];
          setActiveSeasonId(activeSeason.id);
        }
        setAllStudentsData(monitorRes.data);
        setWeeklyHighlights(hlRes.data);

        // Bildirishnomalarni overwrite qilmaymiz, balki merge qilamiz
        if (notifRes.data && Array.isArray(notifRes.data)) {
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newOnes = notifRes.data.filter((n: any) => !existingIds.has(n.id));
            if (newOnes.length === 0) return prev;
            return [...newOnes, ...prev].sort((a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          });
        }
      } catch (e) {
        console.error("Data load error", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    BuddyStorage.save(BuddyStorage.KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  useEffect(() => {
    // Rasm URLni to'g'rilash: agar relative path bo'lsa, MEDIA_BASE_URL qo'sh
    const fixUrl = (url: string | null | undefined): string => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      return `${MEDIA_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Faqat statusi 'active' bo'lgan kuratorlarni chiqarish
    const approvedCurators = allUsers
      .filter(u => u.role === 'curator' && u.status === 'active')
      .map(u => ({
        id: u.id,
        name: u.name,
        role: u.field || 'Mentor',
        avatar: fixUrl(u.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'Curator')}&background=6366f1&color=fff&size=400&bold=true`,
        bio: u.longBio?.slice(0, 100) || "Buddy jamoasining faol kuratori.",
        longBio: u.longBio || "Foydalanuvchi haqida ma'lumot yo'q.",
        fieldDescription: u.fieldDescription || "O'quvchilarga o'z yo'nalishi bo'yicha yordam beradi.",
        motivationQuote: u.motivationQuote || "Harakatda barakat!",
        skills: u.skills || [],
        socialLinks: (u.socialLinks || []).map(link => ({
          ...link,
          iconUrl: fixUrl(link.iconUrl)
        }))
      }));
    setDynamicTeamMembers(approvedCurators);
  }, [allUsers]);

  const handleNavigateToAuth = (mode: 'login' | 'signup') => {
    if (mode === 'signup' && !isRegistrationOpen) {
      setAuthMode('login');
    } else {
      setAuthMode(mode);
    }
    handleNavigate('auth');
  };

  const handleLoginSuccess = (userData: UserData) => {
    setUser(userData);
    handleNavigate(userData.role === 'admin' ? 'admin' : 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    handleNavigate('home');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Haqiqatan ham ushbu foydalanuvchini o'chirib tashlamoqchimisiz?")) return;
    try {
      await api.delete(`users/${userId}/`);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      setAllStudentsData(prev => prev.filter(s => s.curatorId !== userId && s.studentId !== userId));
    } catch (e) {
      console.error("Foydalanuvchini o'chirishda xatolik:", e);
    }
  };

  const handleChangeRole = async (userId: string, role: 'student' | 'curator' | 'admin') => {
    try {
      await api.patch(`admin/users/${userId}/role/`, { role });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e) {
      console.error("Rolni o'zgartirishda xatolik:", e);
    }
  };

  const handleUpdateStudent = async (updatedStudent: StudentProgress) => {
    try {
      const res = await api.patch(`monitoring/${updatedStudent.id}/`, updatedStudent);
      setAllStudentsData(prev => prev.map(s => s.id === updatedStudent.id ? res.data : s));
    } catch (err) {
      console.error("Failed to update student progress:", err);
    }
  };

  const handleAddProgress = async (p: StudentProgress) => {
    try {
      const payload = {
        curatorId: p.curatorId,
        seasonId: p.seasonId || activeSeasonId,
        weekNumber: p.weekNumber,
        studentId: p.studentId || null,
        studentName: p.studentName,
        weeklyGoal: p.weeklyGoal || '',
        difficulty: p.difficulty || '',
        solution: p.solution || '',
        status: p.status || 'Kutilmoqda',
        meetingDay: p.meetingDay || null,
        attended: p.attended ?? false
      };
      const res = await api.post('monitoring/', payload);
      setAllStudentsData(prev => [...prev, res.data]);
    } catch (err) {
      console.error("Failed to add progress:", err);
      // fallback: add to local state anyway
      setAllStudentsData(prev => [...prev, { ...p, seasonId: p.seasonId || activeSeasonId }]);
    }
  };

  const handleRemoveProgress = async (id: string) => {
    try {
      await api.delete(`monitoring/${id}/`);
      setAllStudentsData(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to remove progress:", err);
      setAllStudentsData(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await api.post(`admin/users/${userId}/approve/`);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isApproved: true, status: 'active' } : u));
      if (user?.id === userId) {
        setUser(prev => prev ? { ...prev, isApproved: true, status: 'active' } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeUserStatus = async (userId: string, status: 'active' | 'inactive' | 'pending') => {
    try {
      await api.patch(`admin/users/${userId}/status/`, { status });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      if (user?.id === userId) {
        setUser(prev => prev ? { ...prev, status } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (data: Partial<UserData>) => {
    if (!user) return false;
    try {
      const res = await api.patch(`users/${user.id}/`, data);
      setUser(res.data);
      setAllUsers(prev => prev.map(u => u.id === user.id ? res.data : u));
      return true;
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : "Xatolik yuz berdi";
      alert("Profilni yangilashda xatolik: " + errorMsg);
      return false;
    }
  };

  const handleAddHighlight = async (h: any) => {
    try {
      const form = new FormData();
      form.append('curatorId', h.curatorId);
      form.append('seasonId', h.seasonId || activeSeasonId);
      form.append('weekNumber', h.weekNumber.toString());
      form.append('uploadedBy', h.uploadedBy || '');
      if (h.imageFile) {
        form.append('image', h.imageFile);
      } else if (h.photoUrl) {
        form.append('photoUrl', h.photoUrl);
      }

      const res = await api.post('highlights/', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      setWeeklyHighlights(prev => [...prev, res.data]);
    } catch (e) {
      console.error("Rasmni saqlashda xatolik:", e);
    }
  };

  const handleRemoveHighlight = async (id: string) => {
    try {
      await api.delete(`highlights/${id}/`);
      setWeeklyHighlights(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      console.error("Rasmni o'chirishda xatolik:", e);
    }
  };

  const handleUpdateSeason = async (seasonId: string, updates: Partial<Season>) => {
    try {
      await api.patch(`seasons/${seasonId}/`, updates);
      setSeasons(prev => prev.map(s => s.id === seasonId ? { ...s, ...updates } : s));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    try {
      await api.delete(`seasons/${seasonId}/`);
      setSeasons(prev => {
        const newSeasons = prev.filter(s => s.id !== seasonId);
        if (activeSeasonId === seasonId && newSeasons.length > 0) {
          setActiveSeasonId(newSeasons[newSeasons.length - 1].id);
        }
        return newSeasons;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartNewSeason = async (durationInMonths: number = 3) => {
    try {
      const nextNumber = seasons.length > 0 ? Math.max(...seasons.map(s => s.number)) + 1 : 1;
      const res = await api.post("seasons/", {
        number: nextNumber,
        startDate: new Date().toISOString().split('T')[0],
        isActive: true,
        durationInMonths: durationInMonths
      });

      const newSeasonData = res.data;

      const nextSeason: Season = {
        id: newSeasonData.id,
        number: newSeasonData.number,
        startDate: newSeasonData.start_date,
        isActive: newSeasonData.is_active,
        durationInMonths: newSeasonData.duration_months
      };

      setSeasons(prev => prev.map(s => ({ ...s, isActive: false })).concat([nextSeason]));
      setActiveSeasonId(nextSeason.id);
      setIsRegistrationOpen(true);

      handleAddNotification({
        id: Math.random().toString(36).substr(2, 9),
        title: `Yangi Mavsum #${nextNumber} boshlandi!`,
        message: 'Buddy Team loyihasida yangi mavsum start oldi. Rejalaringizni belgilashni boshlang.',
        type: 'success',
        timestamp: new Date().toISOString(),
        isRead: false,
        targetRole: 'all',
        sender: 'Admin'
      });
    } catch (e) { console.error(e) }
  };

  const handleAddNotification = async (notif: Partial<Notification>) => {
    try {
      const res = await api.post('notifications/', notif);
      const savedNotif = res.data;
      setNotifications(prev => {
        // ID bo'yicha tekshirish (WebSocket orqali kelgan bo'lsa ham takrorlanmasin)
        if (prev.some(n => n.id === savedNotif.id)) return prev;
        return [savedNotif, ...prev];
      });
      return savedNotif;
    } catch (e) {
      console.error("Xabarni yuborishda xatolik:", e);
      throw e;
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await api.patch(`notifications/${id}/`, { isRead: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error("Xabarni o'qilgan deb belgilashda xatolik:", e);
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!user) return;
    try {
      await api.patch(`users/${studentId}/`, { assignedCuratorId: user.id });
      setAllUsers(prev => prev.map(u => u.id === studentId ? { ...u, assignedCuratorId: user.id } : u));

      const student = allUsers.find(u => u.id === studentId);
      if (student) {
        handleAddNotification({
          id: Math.random().toString(36).substr(2, 9),
          title: 'Yangi Kurator Biriktirildi',
          message: `${user.name} sizni o'z jamoasiga qo'shdi.`,
          type: 'success',
          timestamp: new Date().toISOString(),
          isRead: false,
          targetRole: 'student',
          targetUserId: studentId,
          sender: user.name
        });
      }
    } catch (e) { console.error(e) }
  };

  const handleUnassignStudent = async (studentId: string) => {
    if (!user) return;
    try {
      await api.patch(`users/${studentId}/`, { assignedCuratorId: null });
      setAllUsers(prev => prev.map(u => u.id === studentId ? { ...u, assignedCuratorId: null } : u));
    } catch (e) { console.error(e) }
  };

  const handleAssignCurator = async (curatorId: string) => {
    if (!user) return;
    try {
      await api.patch(`users/${user.id}/`, { assignedCuratorId: curatorId });
      setUser(prev => prev ? { ...prev, assignedCuratorId: curatorId } : null);
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, assignedCuratorId: curatorId } : u));

      const curator = allUsers.find(u => u.id === curatorId);

      // Notify the curator (sent via backend or local depending on implementation, but local here)
      if (curator) {
        handleAddNotification({
          id: Math.random().toString(36).substr(2, 9),
          title: 'Yangi O\'quvchi Qo\'shildi',
          message: `${user.name || user.username} sizni o'z kuratori sifatida tanladi.`,
          type: 'success',
          timestamp: new Date().toISOString(),
          isRead: false,
          targetRole: 'curator',
          targetUserId: curatorId,
          sender: user.name || user.username
        });
      }

      // Notify the student themselves
      handleAddNotification({
        id: Math.random().toString(36).substr(2, 9),
        title: 'Kurator Tanlandi',
        message: `${curator?.name || 'Kurator'} muvaffaqiyatli biriktirildi. Mashg'ulotlarni boshlashingiz mumkin!`,
        type: 'success',
        timestamp: new Date().toISOString(),
        isRead: false,
        targetRole: 'student',
        targetUserId: user.id,
        sender: 'Tizim'
      });

      handleNavigate('dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0c] z-50">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse text-sm">Profil tekshirilmoqda...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0c]">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onAuthNavigate={handleNavigateToAuth}
        user={user}
        onLogout={handleLogout}
        isRegistrationOpen={isRegistrationOpen}
        unreadCount={filteredNotifications.filter(n => !n.isRead).length}
      />
      <main className="animate-in fade-in duration-700">
        <Routes>
          <Route path="/" element={<HomeView onNavigate={handleNavigate} onAuthNavigate={handleNavigateToAuth} isRegistrationOpen={isRegistrationOpen} user={user} />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/features" element={<div className="pt-20"><Features /></div>} />
          <Route path="/team" element={
            <div className="pt-20">
              <Team
                user={user}
                onAssignCurator={handleAssignCurator}
                customMembers={dynamicTeamMembers}
                studentsData={allStudentsData}
                highlights={weeklyHighlights}
                seasons={seasons}
                activeSeasonId={activeSeasonId}
                isLoading={isDataLoading}
              />
            </div>
          } />
          <Route path="/contact" element={<div className="pt-20"><Contact /></div>} />
          <Route path="/dashboard" element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <div className="pt-20">
                  <Dashboard
                    user={user} studentsData={allStudentsData} highlights={weeklyHighlights}
                    allUsers={allUsers}
                    onRemoveStudent={handleRemoveProgress}
                    onUpdateProfile={handleUpdateProfile}
                    onUpdateStudent={handleUpdateStudent}
                    onAddProgress={handleAddProgress}
                    onAddHighlight={handleAddHighlight}
                    onRemoveHighlight={handleRemoveHighlight}
                    activeSeasonId={activeSeasonId}
                    seasons={seasons}
                    notifications={filteredNotifications}
                    onMarkRead={handleMarkNotificationAsRead}
                    onAssignStudent={handleAssignStudent}
                    onUnassignStudent={handleUnassignStudent}
                    onlineUsers={onlineUsers}
                  />
                </div>
              )
            ) : <Navigate to="/auth" replace />
          } />
          <Route path="/admin/:activeTab?" element={
            user?.role === 'admin' ? (
              <div className="pt-20">
                <AdminPanel
                  user={user} allUsers={allUsers} allProgress={allStudentsData}
                  onDeleteUser={handleDeleteUser}
                  onChangeRole={handleChangeRole}
                  onUpdateProgress={handleUpdateStudent}
                  onApproveUser={handleApproveUser}
                  onChangeStatus={handleChangeUserStatus}
                  isRegistrationOpen={isRegistrationOpen}
                  onToggleRegistration={() => setIsRegistrationOpen(!isRegistrationOpen)}
                  isCuratorRegistrationOpen={isCuratorRegistrationOpen}
                  onToggleCuratorRegistration={() => setIsCuratorRegistrationOpen(!isCuratorRegistrationOpen)}
                  seasons={seasons}
                  activeSeasonId={activeSeasonId}
                  onSwitchSeason={setActiveSeasonId}
                  onStartNewSeason={handleStartNewSeason}
                  onUpdateSeason={handleUpdateSeason}
                  onDeleteSeason={handleDeleteSeason}
                  onSendNotification={handleAddNotification}
                  notifications={notifications}
                  onMarkAsRead={handleMarkNotificationAsRead}
                />
              </div>
            ) : user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
          <Route path="/auth/:mode?" element={
            user ? (
              <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
            ) : (
              <AuthPage
                initialMode={authMode}
                onBack={() => handleNavigate('home')}
                onSuccess={handleLoginSuccess}
                isRegistrationOpen={isRegistrationOpen}
                isCuratorRegistrationOpen={isCuratorRegistrationOpen}
              />
            )
          } />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/monitoring" element={<Navigate to="/admin/monitoring" replace />} />
          <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
