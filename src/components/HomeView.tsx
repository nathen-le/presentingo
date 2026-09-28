import React from 'react';
import {
  Presentation,
  HelpCircle,
  Zap,
  Activity,
  Video,
  BarChart2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { NavTab } from './Navbar';

interface HomeViewProps {
  onSelectTab: (tab: NavTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTab }) => {
  return (
    <div className="space-y-16 py-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto pt-4">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-sm font-semibold shadow-sm">
          <Zap className="w-4 h-4 text-brand-500 dark:text-brand-400 animate-pulse" />
          <span>Presentingo Practice Studio</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Practice. Present. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-600 via-sky-500 to-indigo-600 dark:from-brand-400 dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Improve Your Speech.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Turn on your webcam and microphone to practice presentations, interview questions, and impromptu speeches.
          Get real-time browser analytics on speaking pace, filler words, volume, pitch, body language, and timing.
        </p>

        {/* Quick CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onSelectTab('presentation')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white font-semibold text-base shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Presentation className="w-5 h-5" />
            <span>Presentation Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTab('interview')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-base border border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <HelpCircle className="w-5 h-5 text-sky-500" />
            <span>Interview Simulator</span>
          </button>

          <button
            onClick={() => onSelectTab('impromptu')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-base border border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Impromptu Speaking</span>
          </button>
        </div>
      </div>

      {/* Core Practice Modes Grid */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Choose a Practice Mode</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Select the mode that fits your upcoming speech, interview, or classroom presentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mode 1: Presentation Practice */}
          <div
            onClick={() => onSelectTab('presentation')}
            className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 dark:border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                <Presentation className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                Presentation Practice
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Set custom presentation titles, target lengths, rubrics, and speaker notes. Present directly to your camera and get comprehensive pacing, pitch, and transcript breakdown.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
              <span>Start Presentation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 2: Interview Practice */}
          <div
            onClick={() => onSelectTab('interview')}
            className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                Interview Simulator
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Practice 8 interview categories (General, College, Scholarship, Internship, Job, Leadership, Behavioral, Situational). Answer questions one at a time with answer analysis.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
              <span>Start Interview Simulation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 3: Impromptu Speaking */}
          <div
            onClick={() => onSelectTab('impromptu')}
            className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                Impromptu Speaking
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Test your on-the-spot thinking with random prompts. Get 30 seconds to organize your thoughts followed by a timed 1–3 minute response with delivery tracking.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>Start Impromptu Practice</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="glass-panel rounded-3xl p-8 space-y-8 border border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Objective Telemetry</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Presentingo relies entirely on measurable audio and visual telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <Activity className="w-8 h-8 text-brand-500 dark:text-brand-400" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Speaking Rate & Fillers</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Calculates WPM, identifies filler word occurrences (um, uh, like, etc.), and highlights repeated phrases in transcript.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <Video className="w-8 h-8 text-sky-500 dark:text-sky-400" />
            <h4 className="font-semibold text-slate-900 dark:text-white">MediaPipe Vision</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Estimates camera-facing percentage, detects body posture lean, and tracks overall movement stability.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <BarChart2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Pitch & Volume Charts</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time Web Audio API pitch autocorrelation and RMS volume analysis mapped onto interactive post-session timelines.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <Clock className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Pause & Timing Analysis</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Measures useful vs disruptive pauses, silence percentages, target duration variances, and question timing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
