import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, ClipboardList, Settings, LogOut, Menu,
  Users as UsersIcon, Building2, Eye, FileBarChart, Wifi, Briefcase,
} from 'lucide-react';

import { Button } from './components/Button.jsx';
import { Logo } from './components/Logo.jsx';
import { INITIAL_TEAMS } from './data/teams.js';
import { THEME } from './data/theme.js';
import * as api from './data/api.js';

import {
  ToastContainer, LoadingScreen, ConnectionErrorScreen, LoginPage,
  DashboardPage, DataEntryPage, SupervisorPage, useToast,
} from './components/AppParts1.jsx';

import {
  UsersPage, CompaniesPage, TeamsManagementPage, SettingsPage, ReportsPage,
} from './components/AppParts2.jsx';

import { ContractorsModule } from './components/ContractorsModule.jsx';
import { MonitorPage } from './components/MonitorPage.jsx';

export default function App() {
  const [user, setUser] = useState(() => {
    // استعادة المستخدم من localStorage عند تحميل الصفحة
    try {
      const saved = localStorage.getItem('ithra_user');
      if (saved) return JSON.parse(saved);
    } catch (err) { console.error('فشل قراءة الجلسة:', err); }
    return null;
  });

  // حفظ المستخدم في localStorage عند تغييره
  useEffect(() => {
    try {
      if (user) localStorage.setItem('ithra_user', JSON.stringify(user));
      else localStorage.removeItem('ithra_user');
    } catch (err) { console.error('فشل حفظ الجلسة:', err); }
  }, [user]);
  const [page, setPage] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { toasts, show } = useToast();
  const toast = { show };

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [settings, setSettings] = useState({
    season_start_date: null,
    closing_mode: 'always_open',
    closing_time: '19:00:00',
    manually_closed_dates: [],
  });
  const [evaluations, setEvaluations] = useState([]);
  const [appReady, setAppReady] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const refreshUsers = useCallback(async () => {
    const data = await api.getAllUsers();
    setUsers(data.map(api.dbUserToApp));
  }, []);

  const refreshCompanies = useCallback(async () => {
    const data = await api.getAllCompanies();
    setCompanies(data.map(api.dbCompanyToApp));
  }, []);

  const refreshTeams = useCallback(async () => {
    const data = await api.getAllTeamsWithCriteria();
    setTeams(data);
  }, []);

  const refreshSettings = useCallback(async () => {
    const data = await api.getSettings();
    setSettings(data || {
      season_start_date: null,
      closing_mode: 'always_open',
      closing_time: '19:00:00',
      manually_closed_dates: [],
    });
  }, []);

  const refreshEvaluations = useCallback(async () => {
    const data = await api.getAllEvaluations();
    setEvaluations(data);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setConnectionError(null);
      const conn = await import('./data/supabase.js').then(m => m.checkConnection());
      if (!conn.connected) {
        setConnectionError(conn.error);
        return;
      }

      await api.seedTeamsIfEmpty(INITIAL_TEAMS);

      // تحميل متوازي لتحسين السرعة
      await Promise.all([
        refreshUsers(),
        refreshCompanies(),
        refreshTeams(),
        refreshSettings(),
        refreshEvaluations(),
      ]);

      setAppReady(true);
    } catch (err) {
      console.error('فشل تحميل البيانات:', err);
      setConnectionError(err.message);
    }
  }, [refreshUsers, refreshCompanies, refreshTeams, refreshSettings, refreshEvaluations]);

  useEffect(() => {
    loadAll();
  }, []);

  const pages = useMemo(() => {
    if (!user) return [];
    const all = {
      dashboard: { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة المتابعة' },
      reports: { id: 'reports', icon: FileBarChart, label: 'التقارير' },
      supervisor: { id: 'supervisor', icon: Eye, label: 'متابعة المدخلين' },
      entry: { id: 'entry', icon: ClipboardList, label: 'إدخال البيانات' },
      users: { id: 'users', icon: UsersIcon, label: 'إدارة الحسابات' },
      companies: { id: 'companies', icon: Building2, label: 'إدارة الشركات' },
      teamsAdmin: { id: 'teamsAdmin', icon: Settings, label: 'إدارة الفرق' },
      settings: { id: 'settings', icon: Settings, label: 'إعدادات النظام' },
      contractors: { id: 'contractors', icon: Briefcase, label: 'وحدة المتعهدين' },
      monitor: { id: 'monitor', icon: ClipboardList, label: 'تعبئة المراقبة' },
    };
    switch (user.role) {
      case 'admin':
        return [all.dashboard, all.reports, all.contractors, all.users, all.companies, all.teamsAdmin, all.settings];
      case 'dashboard':
        return [all.dashboard, all.reports];
      case 'supervisor':
        return [all.supervisor];
      case 'data_entry':
        return [all.entry];
      case 'contractor_monitor_food':
      case 'contractor_monitor_transport':
      case 'contractor_monitor_security':
        return [all.monitor];
      case 'contractor_pmo':
        return [all.contractors];
      default:
        return [];
    }
  }, [user]);

  useEffect(() => {
    if (user && pages.length) setPage(pages[0].id);
  }, [user]);

  // شاشة خطأ الاتصال
  if (connectionError) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <ConnectionErrorScreen error={connectionError} onRetry={loadAll} />
      </>
    );
  }

  // شاشة التحميل
  if (!appReady) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <LoadingScreen message="جاري الاتصال بقاعدة البيانات..." />
      </>
    );
  }

  // شاشة تسجيل الدخول
  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <LoginPage onLogin={setUser} toast={toast} />
      </>
    );
  }

  const company = companies.find(c => c.id === user.companyId);
  const currentPageLabel = pages.find(p => p.id === page)?.label;

  const sidebarContent = (
    <>
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#fff' }}>
        <Logo height={50} />
        <div style={{ fontSize: 12, color: THEME.colors.textTertiary, marginTop: 6 }}>{user.name}</div>
      </div>
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {pages.map(p => {
          const Icon = p.icon;
          const active = page === p.id;
          return (
            <button
              key={p.id}
              onClick={() => { setPage(p.id); setMobileSidebarOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                background: active ? 'rgba(184,153,104,0.12)' : 'transparent',
                border: 'none',
                borderRight: active ? `3px solid ${THEME.colors.accent}` : '3px solid transparent',
                color: active ? THEME.colors.accent : 'rgba(255,255,255,0.65)',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                textAlign: 'right',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>
              <Icon size={20} />
              {p.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Button variant="danger" fullWidth icon={LogOut} onClick={() => { setUser(null); setMobileSidebarOpen(false); }}>
          تسجيل الخروج
        </Button>
      </div>
    </>
  );

  return (
    <>
      <ToastContainer toasts={toasts} />
      <div style={{ minHeight: '100vh', background: THEME.colors.bg }}>
        {/* Top Bar */}
        <div style={{
          background: THEME.colors.surface,
          borderBottom: `1px solid ${THEME.colors.border}`,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button
                onClick={() => setMobileSidebarOpen(v => !v)}
                style={{
                  background: THEME.colors.bgSecondary,
                  border: 'none',
                  borderRadius: THEME.radius.md,
                  padding: 10,
                  cursor: 'pointer',
                }}>
                <Menu size={20} color={THEME.colors.primary} />
              </button>
            )}
            <Logo height={36} />
            <div style={{ borderRight: `1px solid ${THEME.colors.border}`, paddingRight: 12, marginRight: 4 }}>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: THEME.colors.primary }}>
                {currentPageLabel}
              </h1>
              {company && (
                <p style={{ fontSize: 11, color: THEME.colors.textTertiary }}>
                  {company.name} — قسم {user.section}
                </p>
              )}
              {user.role === 'supervisor' && (
                <p style={{ fontSize: 11, color: THEME.colors.textTertiary }}>
                  مشرف قسم {user.section}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: THEME.colors.successSoft,
              borderRadius: THEME.radius.full,
              fontSize: 12,
              fontWeight: 600,
              color: THEME.colors.success,
            }}>
              <Wifi size={14} strokeWidth={2.5} />
              متصل
            </div>
            <button
              onClick={() => { if (confirm('هل تريد تسجيل الخروج؟')) setUser(null); }}
              title="تسجيل الخروج"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: THEME.colors.dangerSoft,
                color: THEME.colors.danger,
                border: `1px solid ${THEME.colors.danger}33`,
                borderRadius: THEME.radius.full,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = THEME.colors.danger; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = THEME.colors.dangerSoft; e.currentTarget.style.color = THEME.colors.danger; }}>
              <LogOut size={14} strokeWidth={2.5} />
              <span style={{ display: window.innerWidth > 600 ? 'inline' : 'none' }}>خروج</span>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}>
            <aside
              onClick={e => e.stopPropagation()}
              style={{
                width: 280,
                background: THEME.colors.primary,
                color: '#fff',
                height: '100vh',
                position: 'fixed',
                top: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInRight 0.2s ease-out',
              }}>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Layout: Sidebar + Main */}
        <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto' }}>
          {/* Desktop Sidebar */}
          {!isMobile && (
            <aside style={{
              width: 240,
              background: THEME.colors.primary,
              color: '#fff',
              minHeight: 'calc(100vh - 64px)',
              position: 'sticky',
              top: 64,
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}>
              {sidebarContent}
            </aside>
          )}

          {/* Main Content */}
          <main style={{ flex: 1, padding: 16, minWidth: 0 }}>
            {page === 'dashboard' && (
              <DashboardPage teams={teams} companies={companies} evaluations={evaluations} />
            )}
            {page === 'reports' && (
              <ReportsPage
                teams={teams} companies={companies}
                evaluations={evaluations} users={users}
                settings={settings} toast={toast}
              />
            )}
            {page === 'supervisor' && (
              <SupervisorPage
                user={user} users={users} companies={companies}
                teams={teams} evaluations={evaluations} settings={settings}
              />
            )}
            {page === 'entry' && (
              <DataEntryPage
                user={user} teams={teams} settings={settings}
                toast={toast} evaluations={evaluations}
                refreshEvaluations={refreshEvaluations}
                companies={companies}
              />
            )}
            {page === 'users' && (
              <UsersPage users={users} companies={companies} toast={toast} refreshUsers={refreshUsers} />
            )}
            {page === 'companies' && (
              <CompaniesPage companies={companies} toast={toast} refreshCompanies={refreshCompanies} />
            )}
            {page === 'teamsAdmin' && (
              <TeamsManagementPage
                teams={teams} settings={settings} toast={toast}
                refreshTeams={refreshTeams} refreshSettings={refreshSettings}
              />
            )}
            {page === 'settings' && (
              <SettingsPage settings={settings} teams={teams} refreshSettings={refreshSettings} toast={toast} />
            )}
            {page === 'contractors' && (
              <ContractorsModule user={user} companies={companies} toast={toast} />
            )}
            {page === 'monitor' && (
              <MonitorPage user={user} companies={companies} toast={toast} />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
