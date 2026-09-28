import React from 'react';
import {
  Mic,
  Video,
  Presentation,
  HelpCircle,
  Zap,
  BarChart3,
  Settings,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

export type NavTab = 'home' | 'presentation' | 'interview' | 'impromptu' | 'progress' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isRecordingActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  theme,
  onToggleTheme,
  isRecordingActive
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Presentation className="w-4 h-4" /> },
    { id: 'presentation', label: 'Presentations', icon: <Video className="w-4 h-4" /> },
    { id: 'interview', label: 'Interviews', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'impromptu', label: 'Impromptu', icon: <Zap className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center space-x-3 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-sky-500 to-indigo-500 p-0.5 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Mic className="w-5 h-5 text-brand-600 dark:text-brand-400 group-hover:text-brand-500 transition-colors" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Presentingo
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  disabled={isRecordingActive}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  } ${isRecordingActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => onSelectTab('settings')}
              disabled={isRecordingActive}
              className={`p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                currentTab === 'settings' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''
              } ${isRecordingActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              disabled={isRecordingActive}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                currentTab === item.id
                  ? 'bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
