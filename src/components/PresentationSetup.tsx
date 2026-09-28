import React, { useState } from 'react';
import { Presentation, Clock, FileText, Sparkles, Video } from 'lucide-react';
import { PresentationConfig } from '../types';

interface PresentationSetupProps {
  onStart: (config: PresentationConfig) => void;
  onCancel: () => void;
}

export const PresentationSetup: React.FC<PresentationSetupProps> = ({ onStart, onCancel }) => {
  const [title, setTitle] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(3);
  const [rubric, setRubric] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || 'Untitled Presentation';
    onStart({
      title: finalTitle,
      targetDurationSec: targetMinutes * 60,
      rubric: rubric.trim() || undefined,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-8 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 dark:border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Presentation Practice Setup</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Configure your presentation goals and notes before starting your camera recording.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Presentation Title or Topic <span className="text-brand-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Climate Change Solutions & Renewable Energy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
            />
          </div>

          {/* Target Duration Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                <span>Target Presentation Duration</span>
              </span>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{targetMinutes} Minutes</span>
            </label>

            <div className="grid grid-cols-4 gap-3">
              {[1, 3, 5, 10].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setTargetMinutes(mins)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                    targetMinutes === mins
                      ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 font-semibold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mins} {mins === 1 ? 'Minute' : 'Minutes'}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Speaker Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <span>Optional Teleprompter / Speaker Notes</span>
              </span>
              <span className="text-xs text-slate-400">Available during recording</span>
            </label>
            <textarea
              rows={3}
              placeholder="Key talking points, slide bullet points, or introduction hook..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all resize-none"
            />
          </div>

          {/* Optional Rubric */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Optional Evaluation Rubric</span>
              </span>
              <span className="text-xs text-slate-400">Criteria</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AP English Speech Rubric: Clear Thesis, Eye Contact, Minimal Fillers"
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
            />
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
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Video className="w-4 h-4" />
              <span>Start Presentation Practice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
