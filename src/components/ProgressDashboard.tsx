import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock,
  Trash2,
  Eye,
  TrendingDown,
  Mic,
  Award,
  Sparkles,
  Presentation,
  HelpCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { SessionResult } from '../types';
import { storage } from '../utils/storage';
import { Line } from 'react-chartjs-2';

interface ProgressDashboardProps {
  onSelectSession: (session: SessionResult) => void;
  onStartNewPractice: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  onSelectSession,
  onStartNewPractice
}) => {
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    const data = await storage.getAllSessions();
    setSessions(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session report?')) {
      await storage.deleteSession(id);
      await loadSessions();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all practice history? This action cannot be undone.')) {
      await storage.clearAllSessions();
      await loadSessions();
    }
  };

  // Aggregated Stats
  const totalSessions = sessions.length;
  const totalDurationSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
  const avgWpm = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.wpm, 0) / totalSessions)
    : 0;
  const totalFillersSpoken = sessions.reduce((sum, s) => sum + s.totalFillers, 0);

  const chronoSessions = [...sessions].reverse();
  const sessionLabels = chronoSessions.map((s, i) => `S${i + 1}`);
  const fillersTrend = chronoSessions.map((s) => s.totalFillers);
  const wpmTrend = chronoSessions.map((s) => s.wpm);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.15)' }, ticks: { color: '#64748b' } }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-3">
            <BarChart3 className="w-7 h-7 text-brand-500 dark:text-brand-400" />
            <span>Practice History & Progress</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track your speaking pace stability, filler-word reduction, and overall progress across all practice sessions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 text-xs font-semibold transition-colors"
            >
              Clear History
            </button>
          )}

          <button
            onClick={onStartNewPractice}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <span>New Practice Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Practice Sessions</span>
            <Award className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalSessions}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Completed</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Time Practiced</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{formatTime(totalDurationSec)}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Cumulative duration</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Average Speaking Pace</span>
            <Mic className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{avgWpm} WPM</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Target: 130–160 WPM</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Fillers Logged</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-300">{totalFillersSpoken}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Across all recordings</div>
        </div>
      </div>

      {/* Progress Charts (If >= 2 sessions) */}
      {sessions.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filler Word Reduction Trend */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-amber-500" />
              <span>Filler Word Frequency Trend across Sessions</span>
            </h3>
            <div className="h-60">
              <Line
                data={{
                  labels: sessionLabels,
                  datasets: [
                    {
                      label: 'Fillers Count',
                      data: fillersTrend,
                      borderColor: '#d97706',
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      fill: true,
                      tension: 0.3
                    }
                  ]
                }}
                options={chartOptions}
              />
            </div>
          </div>

          {/* WPM Stability Trend */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Mic className="w-4 h-4 text-sky-500" />
              <span>Speaking Pace (WPM) Consistency Trend</span>
            </h3>
            <div className="h-60">
              <Line
                data={{
                  labels: sessionLabels,
                  datasets: [
                    {
                      label: 'WPM',
                      data: wpmTrend,
                      borderColor: '#0284c7',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      fill: true,
                      tension: 0.3
                    }
                  ]
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* Past Sessions History Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Past Practice Reports</h3>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading session history...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Presentation className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <div className="text-base font-bold text-slate-900 dark:text-white">No Practice Sessions Recorded Yet</div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              Start your first presentation, interview simulation, or impromptu speech to track your metrics here!
            </p>
            <button
              onClick={onStartNewPractice}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              Start First Practice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Mode & Title</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">WPM</th>
                  <th className="py-3.5 px-4">Fillers</th>
                  <th className="py-3.5 px-4">Camera Facing</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {sessions.map((sess) => (
                  <tr
                    key={sess.id}
                    onClick={() => onSelectSession(sess)}
                    className="hover:bg-slate-100 dark:hover:bg-slate-850/60 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-4 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(sess.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        {sess.mode === 'presentation' && <Presentation className="w-4 h-4 text-brand-500 shrink-0" />}
                        {sess.mode === 'interview' && <HelpCircle className="w-4 h-4 text-sky-500 shrink-0" />}
                        {sess.mode === 'impromptu' && <Zap className="w-4 h-4 text-amber-500 shrink-0" />}
                        <span className="truncate max-w-xs">{sess.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono">{formatTime(sess.durationSec)}</td>
                    <td className="py-4 px-4 text-xs font-mono font-bold text-sky-600 dark:text-sky-300">{sess.wpm}</td>
                    <td className="py-4 px-4 text-xs font-mono font-bold text-amber-600 dark:text-amber-300">{sess.totalFillers}</td>
                    <td className="py-4 px-4 text-xs font-mono text-emerald-600 dark:text-emerald-400">{sess.cameraFacingPct}%</td>
                    <td className="py-4 px-4">
                      {sess.scores ? (
                        <span className="px-2.5 py-1 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-extrabold text-xs border border-brand-500/30">
                          {sess.scores.overall}/100
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => onSelectSession(sess)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                        title="View Full Coaching Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(sess.id, e)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 text-xs font-semibold transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
