import React, { useState } from 'react';
import {
  HelpCircle,
  GraduationCap,
  Award,
  Briefcase,
  UserCheck,
  Compass,
  Activity,
  MessageSquare,
  Video,
  CheckCircle2
} from 'lucide-react';
import { InterviewCategory, InterviewConfig } from '../types';
import { INTERVIEW_CATEGORIES } from '../utils/interviewData';

interface InterviewSetupProps {
  onStart: (config: InterviewConfig) => void;
  onCancel: () => void;
}

export const InterviewSetup: React.FC<InterviewSetupProps> = ({ onStart, onCancel }) => {
  const [category, setCategory] = useState<InterviewCategory>('General');
  const [questionCount, setQuestionCount] = useState<number>(3);

  const currentCategoryData = INTERVIEW_CATEGORIES.find((c) => c.category === category) || INTERVIEW_CATEGORIES[0];

  const getCategoryIcon = (cat: InterviewCategory) => {
    switch (cat) {
      case 'College': return <GraduationCap className="w-5 h-5 text-sky-500" />;
      case 'Scholarship': return <Award className="w-5 h-5 text-amber-500" />;
      case 'Internship': return <Briefcase className="w-5 h-5 text-emerald-500" />;
      case 'Job': return <UserCheck className="w-5 h-5 text-indigo-500" />;
      case 'Leadership': return <Compass className="w-5 h-5 text-purple-500" />;
      case 'Behavioral': return <Activity className="w-5 h-5 text-rose-500" />;
      case 'Situational': return <HelpCircle className="w-5 h-5 text-teal-500" />;
      default: return <MessageSquare className="w-5 h-5 text-brand-500" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      category,
      questionCount
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-8 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Interactive Interview Practice Setup</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Select an interview domain and session length. Answers are recorded and evaluated individually.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Category Picker Grid */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Select Interview Category <span className="text-sky-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {INTERVIEW_CATEGORIES.map((catItem) => {
                const selected = category === catItem.category;
                return (
                  <button
                    type="button"
                    key={catItem.category}
                    onClick={() => setCategory(catItem.category)}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between space-y-3 ${
                      selected
                        ? 'bg-sky-500/10 border-sky-500 dark:bg-sky-500/20 text-slate-900 dark:text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {getCategoryIcon(catItem.category)}
                      {selected && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{catItem.category}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {catItem.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Interview Session Length</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{questionCount} Questions</span>
            </label>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[3, 5, 10].map((count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                    questionCount === count
                      ? 'bg-sky-500/10 border-sky-500 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Question Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sample Questions in {category} Category
            </h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {currentCategoryData.questions.slice(0, 3).map((q, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-sky-600 dark:text-sky-400 font-bold shrink-0">{idx + 1}.</span>
                  <span>"{q}"</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
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
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Video className="w-4 h-4" />
              <span>Start Interview Practice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
