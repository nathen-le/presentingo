import React, { useState } from 'react';
import { Zap, RefreshCw, Clock, Video, Sparkles } from 'lucide-react';
import { ImpromptuConfig } from '../types';
import { IMPROMPTU_TOPICS } from '../utils/interviewData';

interface ImpromptuSetupProps {
  onStart: (config: ImpromptuConfig) => void;
  onCancel: () => void;
}

export const ImpromptuSetup: React.FC<ImpromptuSetupProps> = ({ onStart, onCancel }) => {
  const getRandomTopic = () => {
    const idx = Math.floor(Math.random() * IMPROMPTU_TOPICS.length);
    return IMPROMPTU_TOPICS[idx];
  };

  const [topic, setTopic] = useState<string>(getRandomTopic());
  const [prepTimeSec, setPrepTimeSec] = useState<number>(30);
  const [speakingTimeMin, setSpeakingTimeMin] = useState<number>(2);

  const handleShuffle = () => {
    let nextTopic = getRandomTopic();
    while (nextTopic === topic && IMPROMPTU_TOPICS.length > 1) {
      nextTopic = getRandomTopic();
    }
    setTopic(nextTopic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      topic: topic.trim() || 'General Impromptu Topic',
      prepTimeSec,
      speakingTimeSec: speakingTimeMin * 60
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-8 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Impromptu Speaking Setup</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Receive a random topic, prepare during the countdown phase, then speak cleanly on your feet.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Display Box with Shuffle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Impromptu Topic Prompt</span>
              </label>
              <button
                type="button"
                onClick={handleShuffle}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Surprise Me!</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 shadow-inner">
              <textarea
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-transparent text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-100 focus:outline-none resize-none placeholder-amber-400 dark:placeholder-amber-300/40 leading-snug"
                placeholder="Enter or generate a topic..."
              />
            </div>
          </div>

          {/* Prep & Speaking Durations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Prep Time */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Preparation Time</span>
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{prepTimeSec}s</span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((sec) => (
                  <button
                    type="button"
                    key={sec}
                    onClick={() => setPrepTimeSec(sec)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                      prepTimeSec === sec
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Speaking Duration */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  <span>Speaking Time</span>
                </span>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{speakingTimeMin} Min</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((min) => (
                  <button
                    type="button"
                    key={min}
                    onClick={() => setSpeakingTimeMin(min)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                      speakingTimeMin === min
                        ? 'bg-brand-500/10 border-brand-500 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {min} {min === 1 ? 'Minute' : 'Mins'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-4 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Video className="w-4 h-4" />
              <span>Start Impromptu Practice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
