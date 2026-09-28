export type SessionMode = 'presentation' | 'interview' | 'impromptu';

export type InterviewCategory =
  | 'General'
  | 'College'
  | 'Scholarship'
  | 'Internship'
  | 'Job'
  | 'Leadership'
  | 'Behavioral'
  | 'Situational';

export interface PresentationConfig {
  title: string;
  targetDurationSec: number;
  rubric?: string;
  notes?: string;
}

export interface InterviewConfig {
  category: InterviewCategory;
  questionCount: number;
  customQuestions?: string[];
}

export interface ImpromptuConfig {
  topic: string;
  prepTimeSec: number;
  speakingTimeSec: number;
}

export interface MetricSample {
  timestamp: number; // in seconds from start
  volume: number; // 0 to 100 relative RMS
  pitch: number | null; // in Hz or null if unpitched/silent
  isSpeaking: boolean;
  isCameraFacing: boolean | null; // estimated percentage or boolean
  postureLean: 'left' | 'right' | 'forward' | 'backward' | 'centered';
  movementMagnitude: number; // 0 to 100
  handsDetected: boolean;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  startTime: number; // sec
  endTime: number; // sec
  isFiller?: boolean;
  fillerWord?: string;
}

export interface FillerWordMatch {
  id: string;
  word: string;
  timestamp: number;
  transcriptOffset?: number;
}

export interface PauseRecord {
  id: string;
  startTime: number;
  duration: number;
  isDisruptive: boolean; // > 2.5s
}

export interface QuestionSessionResult {
  questionIndex: number;
  question: string;
  durationSec: number;
  transcript: string;
  wordCount: number;
  wpm: number;
  fillerCount: number;
  fillersBreakdown: Record<string, number>;
  pauseCount: number;
  silenceTimeSec: number;
  volumeVariation: number;
  pitchVariation: number;
  cameraFacingPct: number;
  postureSummary: string;
  communicationObservations: string[];
}

export interface SessionResult {
  id: string;
  title: string;
  mode: SessionMode;
  date: string; // ISO string
  durationSec: number;
  targetDurationSec?: number;
  prepTimeSec?: number;

  // Speech & Transcript
  transcript: string;
  transcriptSegments: TranscriptSegment[];
  wordCount: number;
  wpm: number;
  speakingTimeSec: number;
  silenceTimeSec: number;
  silencePercentage: number;

  // Fillers & Pauses
  fillersCount: Record<string, number>;
  totalFillers: number;
  fillerMatches: FillerWordMatch[];
  pauses: PauseRecord[];
  longestPauseSec: number;
  avgPauseLengthSec: number;
  repeatedWordsCount: number;
  repeatedPhrases: string[];

  // Audio Stats
  pitchStats: {
    avg: number;
    min: number;
    max: number;
    variation: number;
    hasReliablePitch: boolean;
  };
  volumeStats: {
    avg: number;
    quietSectionsPct: number;
    loudSectionsPct: number;
    variation: number;
  };

  // Visual & Body Language Stats
  cameraFacingPct: number;
  postureObservations: string[];
  movementObservations: string[];
  gestureObservations: string[];

  // Detailed time series for charts
  timeSeries: MetricSample[];

  // Transparent Scoring (0-100)
  scores?: {
    paceConsistency: number;
    fillerFrequency: number;
    timingAccuracy: number;
    volumeStability: number;
    cameraFacing: number;
    postureStability: number;
    overall: number;
  };

  // Data-driven feedback
  actionableSuggestions: string[];

  // Interview mode results
  interviewQuestionsResults?: QuestionSessionResult[];

  // Optional recording URL
  videoBlobUrl?: string;
}

export interface UserSettings {
  fillerWords: string[];
  autoRecordAudio: boolean;
  enableSpeechRecognition: boolean;
  enableMediaPipe: boolean;
  theme?: 'light' | 'dark';
}
