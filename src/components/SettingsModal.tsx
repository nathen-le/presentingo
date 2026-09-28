import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Video,
  Mic,
  Activity,
  Save,
  Sun,
  Moon
} from 'lucide-react';
import { UserSettings } from '../types';
import { storage } from '../utils/storage';
import { SpeechTranscriber } from '../utils/speechTranscriber';

interface SettingsModalProps {
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, theme, onThemeChange }) => {
  const [settings, setSettings] = useState<UserSettings>({
    fillerWords: ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'I mean'],
    autoRecordAudio: true,
    enableSpeechRecognition: true,
    enableMediaPipe: true,
    theme: theme
  });

  const [newFillerInput, setNewFillerInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    storage.getSettings().then((s) => setSettings({ ...s, theme: s.theme || theme }));
    const transcriber = new SpeechTranscriber();
    setSpeechSupported(transcriber.checkSupport());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddFiller = () => {
    const trimmed = newFillerInput.trim().toLowerCase();
    if (trimmed && !settings.fillerWords.includes(trimmed)) {
      setSettings((prev) => ({
        ...prev,
        fillerWords: [...prev.fillerWords, trimmed]
      }));
      setNewFillerInput('');
    }
  };

  const handleRemoveFiller = (word: string) => {
    setSettings((prev) => ({
      ...prev,
      fillerWords: prev.fillerWords.filter((w) => w !== word)
    }));
  };

  const handleToggleTheme = (newTheme: 'light' | 'dark') => {
    const updatedSettings = { ...settings, theme: newTheme };
    setSettings(updatedSettings);
    if (onThemeChange) onThemeChange(newTheme);
    // Persist immediately so theme survives navigation without explicit Save
    storage.saveSettings(updatedSettings);
  };

  const handleSave = async () => {
    await storage.saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-8 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Configure theme preferences, custom filler-word tracking list, and inspect browser capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Theme Preference Option */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <span>Interface Theme</span>
          </h3>

          <div className="flex items-center space-x-3 max-w-sm">
            <button
              onClick={() => handleToggleTheme('light')}
              className={`flex-1 py-3 px-4 rounded-xl border font-semibold text-sm flex items-center justify-center space-x-2 transition-all ${
                theme === 'light'
                  ? 'bg-brand-500/10 border-brand-500 text-brand-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => handleToggleTheme('dark')}
              className={`flex-1 py-3 px-4 rounded-xl border font-semibold text-sm flex items-center justify-center space-x-2 transition-all ${
                theme === 'dark'
                  ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Configurable Filler Words Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <span>Configurable Filler-Words Tracked</span>
          </h3>

          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Specify filler words or vocal pause phrases you wish Presentingo to count:
          </p>

          <div className="flex items-center space-x-2 max-w-md">
            <input
              type="text"
              placeholder="Add custom filler word (e.g., literally)"
              value={newFillerInput}
              onChange={(e) => setNewFillerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFiller())}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleAddFiller}
              className="inline-flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.fillerWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-amber-700 dark:text-amber-300 text-xs font-semibold"
              >
                <span>"{word}"</span>
                <button
                  onClick={() => handleRemoveFiller(word)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Browser Capabilities Diagnostics Box */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-sky-500" />
            <span>Browser Capabilities & Diagnostics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center space-x-1.5">
                  <Mic className="w-4 h-4 text-sky-500" />
                  <span>Web Audio API</span>
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Full support for Pitch Autocorrelation and Volume RMS calculation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center space-x-1.5">
                  <Mic className="w-4 h-4 text-brand-500" />
                  <span>Speech Recognition</span>
                </span>
                {speechSupported ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                {speechSupported
                  ? 'Supported via Web Speech API in current browser engine.'
                  : 'Speech Recognition API disabled in current browser engine. Visual & audio telemetry remain 100% functional.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center space-x-1.5">
                  <Video className="w-4 h-4 text-purple-500" />
                  <span>MediaPipe Vision</span>
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                MediaPipe WASM Pose & Face landmarker supported.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings Saved Successfully!</span>
            </span>
          ) : <span />}

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold"
            >
              Back
            </button>

            <button
              onClick={handleSave}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
