import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { PresentationSetup } from './components/PresentationSetup';
import { InterviewSetup } from './components/InterviewSetup';
import { ImpromptuSetup } from './components/ImpromptuSetup';
import { RecordingStudio } from './components/RecordingStudio';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ProgressDashboard } from './components/ProgressDashboard';
import { SettingsModal } from './components/SettingsModal';
import {
  SessionMode,
  PresentationConfig,
  InterviewConfig,
  ImpromptuConfig,
  SessionResult
} from './types';
import { storage } from './utils/storage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [sessionMode, setSessionMode] = useState<SessionMode>('presentation');
  const [flowState, setFlowState] = useState<'idle' | 'setup' | 'recording' | 'results'>('idle');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Mode Configs
  const [presentationConfig, setPresentationConfig] = useState<PresentationConfig | undefined>();
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | undefined>();
  const [impromptuConfig, setImpromptuConfig] = useState<ImpromptuConfig | undefined>();

  // Current Active Result
  const [activeResult, setActiveResult] = useState<SessionResult | null>(null);

  // Apply theme to DOM
  const applyThemeToDOM = (t: 'light' | 'dark') => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load Saved Theme on Mount
  useEffect(() => {
    storage.getSettings().then((s) => {
      const initialTheme = s.theme || 'light';
      setTheme(initialTheme);
      applyThemeToDOM(initialTheme);
    });
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyThemeToDOM(nextTheme);
    storage.getSettings().then((s) => {
      storage.saveSettings({ ...s, theme: nextTheme });
    });
  };

  // Tab Selection Helper
  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    if (tab === 'presentation') {
      setSessionMode('presentation');
      setFlowState('setup');
    } else if (tab === 'interview') {
      setSessionMode('interview');
      setFlowState('setup');
    } else if (tab === 'impromptu') {
      setSessionMode('impromptu');
      setFlowState('setup');
    } else if (tab === 'progress') {
      setFlowState('idle');
    } else if (tab === 'home') {
      setFlowState('idle');
    } else if (tab === 'settings') {
      setFlowState('idle');
    }
  };

  // Setup Start Handlers
  const handleStartPresentation = (config: PresentationConfig) => {
    setPresentationConfig(config);
    setFlowState('recording');
  };

  const handleStartInterview = (config: InterviewConfig) => {
    setInterviewConfig(config);
    setFlowState('recording');
  };

  const handleStartImpromptu = (config: ImpromptuConfig) => {
    setImpromptuConfig(config);
    setFlowState('recording');
  };

  // Finish Recording & Save
  const handleFinishRecording = async (result: SessionResult) => {
    await storage.saveSession(result);
    setActiveResult(result);
    setFlowState('results');
  };

  // Practice Again
  const handlePracticeAgain = () => {
    setFlowState('setup');
  };

  // Return to Home
  const handleGoHome = () => {
    setCurrentTab('home');
    setFlowState('idle');
  };

  // Select historical session from Progress Dashboard
  const handleSelectHistoricalSession = (result: SessionResult) => {
    setActiveResult(result);
    setFlowState('results');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isRecordingActive={flowState === 'recording'}
      />

      <main className="flex-1">
        {/* Settings View */}
        {currentTab === 'settings' && (
          <SettingsModal
            onClose={() => setCurrentTab('home')}
            theme={theme}
            onThemeChange={(newTheme) => {
              setTheme(newTheme);
              applyThemeToDOM(newTheme);
            }}
          />
        )}

        {/* Recording Studio View */}
        {flowState === 'recording' && (
          <RecordingStudio
            mode={sessionMode}
            presentationConfig={presentationConfig}
            interviewConfig={interviewConfig}
            impromptuConfig={impromptuConfig}
            onFinish={handleFinishRecording}
            onCancel={() => setFlowState('setup')}
          />
        )}

        {/* Results Dashboard View */}
        {flowState === 'results' && activeResult && (
          <ResultsDashboard
            result={activeResult}
            onPracticeAgain={handlePracticeAgain}
            onGoHome={handleGoHome}
          />
        )}

        {/* Mode Setup Views */}
        {flowState === 'setup' && currentTab === 'presentation' && (
          <PresentationSetup
            onStart={handleStartPresentation}
            onCancel={handleGoHome}
          />
        )}

        {flowState === 'setup' && currentTab === 'interview' && (
          <InterviewSetup
            onStart={handleStartInterview}
            onCancel={handleGoHome}
          />
        )}

        {flowState === 'setup' && currentTab === 'impromptu' && (
          <ImpromptuSetup
            onStart={handleStartImpromptu}
            onCancel={handleGoHome}
          />
        )}

        {/* Progress Dashboard View */}
        {flowState === 'idle' && currentTab === 'progress' && (
          <ProgressDashboard
            onSelectSession={handleSelectHistoricalSession}
            onStartNewPractice={() => handleSelectTab('presentation')}
          />
        )}

        {/* Home Landing View */}
        {flowState === 'idle' && currentTab === 'home' && (
          <HomeView onSelectTab={handleSelectTab} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-6 text-center text-xs text-slate-500 dark:text-slate-500 transition-colors duration-200">
        <p>Presentingo • Practice. Present. Improve.</p>
      </footer>
    </div>
  );
};
