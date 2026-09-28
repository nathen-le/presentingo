import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  BarChart3,
  Clock,
  Mic,
  Volume2,
  Activity,
  Eye,
  Award,
  Sparkles,
  RotateCcw,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SessionResult } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ResultsDashboardProps {
  result: SessionResult;
  onPracticeAgain: () => void;
  onGoHome: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  onPracticeAgain,
  onGoHome
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'delivery' | 'fillers' | 'transcript' | 'questions'>('overview');
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeLabels = result.timeSeries.map((s) => `${Math.floor(s.timestamp)}s`);
  const volumeData = result.timeSeries.map((s) => s.volume);
  const pitchData = result.timeSeries.map((s) => s.pitch || null);
  const cameraData = result.timeSeries.map((s) => (s.isCameraFacing ? 100 : 0));

  const paceData = result.timeSeries.map((s, idx) => {
    const window = result.timeSeries.slice(Math.max(0, idx - 8), idx + 1);
    const speakingCount = window.filter((w) => w.isSpeaking).length;
    return Math.round((speakingCount / window.length) * result.wpm);
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1'
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 10 } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.15)' }, ticks: { color: '#64748b' } }
    }
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Presentingo_Report_${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Presentingo {result.mode} Practice Report
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(result.date).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {result.title}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={exportJSON}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>

            <button
              onClick={onPracticeAgain}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>
          </div>
        </div>

        {/* Overall Score Badge */}
        {result.scores && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-black text-slate-900 dark:text-white">
                  {result.scores.overall}
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Transparent Delivery Score</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(0 - 100 Scale)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculated directly from pace consistency, filler frequency, timing, volume, camera orientation, and posture stability.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowScoreDetails(!showScoreDetails)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
            >
              <span>{showScoreDetails ? 'Hide Score Math' : 'View Formula Details'}</span>
              {showScoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Score Math Breakdown Drawer */}
        {showScoreDetails && result.scores && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h5 className="font-bold text-slate-900 dark:text-slate-200">Score Calculation Methodology:</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400">Pace Consistency</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{result.scores.paceConsistency}/100</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400">Filler Control</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{result.scores.fillerFrequency}/100</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400">Timing Accuracy</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{result.scores.timingAccuracy}/100</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400">Volume Stability</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{result.scores.volumeStability}/100</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400">Camera Facing</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{result.scores.cameraFacing}/100</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400">Posture Stability</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{result.scores.postureStability}/100</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Duration */}
        <div className="glass-panel rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Total Duration</span>
            <Clock className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{formatTime(result.durationSec)}</div>
          {result.targetDurationSec && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Target: {formatTime(result.targetDurationSec)}</div>
          )}
        </div>

        {/* WPM */}
        <div className="glass-panel rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Average WPM</span>
            <Mic className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{result.wpm}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{result.wordCount} words spoken</div>
        </div>

        {/* Fillers */}
        <div className="glass-panel rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Filler Words</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-300">{result.totalFillers}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {result.totalFillers === 0 ? 'Zero fillers!' : `${Object.keys(result.fillersCount).length} unique fillers`}
          </div>
        </div>

        {/* Longest Pause */}
        <div className="glass-panel rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Longest Pause</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{result.longestPauseSec}s</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{result.silencePercentage}% total silence</div>
        </div>

        {/* Camera Facing */}
        <div className="glass-panel rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Camera Facing</span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300">{result.cameraFacingPct}%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Landmark ratio</div>
        </div>

        {/* Pitch Variation */}
        <div className="glass-panel rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Pitch Variation</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-300">
            {result.pitchStats.hasReliablePitch ? `${result.pitchStats.variation} Hz` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {result.pitchStats.hasReliablePitch ? `Avg: ${result.pitchStats.avg} Hz` : 'Unpitched audio'}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Overview & Suggestions
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'delivery'
              ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Telemetry Charts over Time
        </button>

        <button
          onClick={() => setActiveTab('fillers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'fillers'
              ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Filler Words ({result.totalFillers})
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'transcript'
              ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Full Transcript
        </button>

        {result.interviewQuestionsResults && (
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'questions'
                ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Interview Questions ({result.interviewQuestionsResults.length})
          </button>
        )}
      </div>

      {/* Tab 1: Overview & Data-Driven Suggestions */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actionable Suggestions Card */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-500 dark:text-brand-400" />
              <span>Data-Driven Improvement Suggestions</span>
            </h3>

            <div className="space-y-3">
              {result.actionableSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start space-x-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Body Language & Posture Observations Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Eye className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span>Measurable Body Observations</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">Posture & Position:</div>
                {result.postureObservations.map((obs, i) => (
                  <p key={i} className="text-slate-500 dark:text-slate-400">{obs}</p>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-slate-200">Movement & Stability:</div>
                {result.movementObservations.map((obs, i) => (
                  <p key={i} className="text-slate-500 dark:text-slate-400">{obs}</p>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-slate-200">Hand Gestures:</div>
                {result.gestureObservations.map((obs, i) => (
                  <p key={i} className="text-slate-500 dark:text-slate-400">{obs}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Delivery Telemetry Time-Series Charts */}
      {activeTab === 'delivery' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Speaking Pace Chart */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Mic className="w-4 h-4 text-sky-500" />
                <span>Speaking Pace over Time (WPM)</span>
              </h4>
              <div className="h-64">
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [
                      {
                        label: 'WPM',
                        data: paceData,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        fill: true,
                        tension: 0.3
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Speaking Volume Chart */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <span>Relative Volume over Time (RMS 0-100)</span>
              </h4>
              <div className="h-64">
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [
                      {
                        label: 'Volume',
                        data: volumeData,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(52, 211, 153, 0.1)',
                        fill: true,
                        tension: 0.2
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Pitch Variation Chart */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span>Fundamental Pitch over Time (Hz)</span>
              </h4>
              <div className="h-64">
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [
                      {
                        label: 'Pitch (Hz)',
                        data: pitchData,
                        borderColor: '#9333ea',
                        backgroundColor: 'rgba(192, 132, 252, 0.1)',
                        fill: false,
                        tension: 0.2
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Camera Facing Chart */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <span>Camera Facing Estimate over Time</span>
              </h4>
              <div className="h-64">
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [
                      {
                        label: 'Camera Facing (%)',
                        data: cameraData,
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(251, 191, 36, 0.1)',
                        fill: true,
                        stepped: true
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Filler Words Breakdown */}
      {activeTab === 'fillers' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Filler Word Breakdown</h3>

          {Object.keys(result.fillersCount).length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-lg font-bold text-slate-900 dark:text-white">No Filler Words Detected!</div>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                Your presentation contained zero common filler words. Excellent speech clarity!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.fillersCount).map(([word, count]) => (
                <div
                  key={word}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <span className="font-bold text-base text-amber-700 dark:text-amber-300">"{word}"</span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-sm border border-amber-500/30">
                    {count} occurrence{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Full Transcript */}
      {activeTab === 'transcript' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Full Speech Transcript</h3>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Filler Words Tracked
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 leading-relaxed text-base font-sans whitespace-pre-wrap">
            {result.transcript ? result.transcript : <span className="text-slate-400 dark:text-slate-500 italic">No transcript captured.</span>}
          </div>
        </div>
      )}

      {/* Tab 5: Interview Questions Breakdown */}
      {activeTab === 'questions' && result.interviewQuestionsResults && (
        <div className="space-y-6">
          {result.interviewQuestionsResults.map((qRes, idx) => (
            <div key={idx} className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Question {idx + 1}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatTime(qRes.durationSec)} duration</span>
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white">"{qRes.question}"</h4>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm text-slate-800 dark:text-slate-200">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Student Answer Transcript:</span>
                {qRes.transcript || <span className="italic text-slate-400 dark:text-slate-500">No transcript recorded.</span>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Speaking Pace</span>
                  <span className="font-bold text-slate-900 dark:text-white">{qRes.wpm} WPM</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Pauses</span>
                  <span className="font-bold text-slate-900 dark:text-white">{qRes.pauseCount} pauses</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Camera Facing</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{qRes.cameraFacingPct}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Posture</span>
                  <span className="font-bold text-slate-900 dark:text-white">{qRes.postureSummary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
