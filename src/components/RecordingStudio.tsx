import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Square,
  AlertTriangle,
  Eye,
  Activity,
  FileText,
  ChevronRight,
  Sparkles,
  Zap,
  Volume2,
  Clock
} from 'lucide-react';
import {
  MetricSample,
  PauseRecord,
  PresentationConfig,
  InterviewConfig,
  ImpromptuConfig,
  SessionMode,
  SessionResult,
  QuestionSessionResult
} from '../types';
import { AudioAnalyzer } from '../utils/audioAnalyzer';
import { VisionTracker, VisionAnalysisSnapshot } from '../utils/visionTracker';
import { SpeechTranscriber } from '../utils/speechTranscriber';
import { AnalysisEngine } from '../utils/analysisEngine';
import { INTERVIEW_CATEGORIES } from '../utils/interviewData';

interface RecordingStudioProps {
  mode: SessionMode;
  presentationConfig?: PresentationConfig;
  interviewConfig?: InterviewConfig;
  impromptuConfig?: ImpromptuConfig;
  onFinish: (result: SessionResult) => void;
  onCancel: () => void;
}

export const RecordingStudio: React.FC<RecordingStudioProps> = ({
  mode,
  presentationConfig,
  interviewConfig,
  impromptuConfig,
  onFinish,
  onCancel
}) => {
  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const visionTrackerRef = useRef<VisionTracker | null>(null);
  const speechTranscriberRef = useRef<SpeechTranscriber | null>(null);

  // States
  const [streamReady, setStreamReady] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Impromptu Phase State
  const [impromptuPhase, setImpromptuPhase] = useState<'prep' | 'speaking'>(
    mode === 'impromptu' ? 'prep' : 'speaking'
  );
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number>(
    impromptuConfig ? impromptuConfig.prepTimeSec : 30
  );

  // Interview Mode State
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [questionResults, setQuestionResults] = useState<QuestionSessionResult[]>([]);
  const [questionStartTimeSec, setQuestionStartTimeSec] = useState<number>(0);

  // Recording Telemetry States
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [liveVolume, setLiveVolume] = useState(0);
  const [livePitch, setLivePitch] = useState<number | null>(null);
  const [liveCameraFacing, setLiveCameraFacing] = useState<boolean | null>(null);
  const [livePostureLean, setLivePostureLean] = useState<string>('centered');
  const [liveMovement, setLiveMovement] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveWpm, setLiveWpm] = useState(0);
  const [showNotes, setShowNotes] = useState(true);

  // Data Recording Buffers
  const timeSeriesRef = useRef<MetricSample[]>([]);
  const pausesRef = useRef<PauseRecord[]>([]);
  const currentPauseStartRef = useRef<number | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const prepTimerRef = useRef<number | null>(null);

  // Initialize Interview Questions if in Interview Mode
  useEffect(() => {
    if (mode === 'interview' && interviewConfig) {
      const catData = INTERVIEW_CATEGORIES.find((c) => c.category === interviewConfig.category);
      if (catData) {
        const shuffled = [...catData.questions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, interviewConfig.questionCount);
        setInterviewQuestions(selected);
      }
    }
  }, [mode, interviewConfig]);

  // Setup Media Stream & Analyzers
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true
        });

        if (!isMounted) return;
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Initialize Audio Analyzer
        const audioAnalyzer = new AudioAnalyzer();
        await audioAnalyzer.start(stream);
        audioAnalyzerRef.current = audioAnalyzer;

        // Initialize Speech Transcriber
        const transcriber = new SpeechTranscriber();
        setSpeechSupported(transcriber.checkSupport());
        speechTranscriberRef.current = transcriber;

        // Initialize Vision Tracker
        const tracker = new VisionTracker();
        await tracker.initialize();
        visionTrackerRef.current = tracker;

        setStreamReady(true);
      } catch (err: any) {
        console.error('Media devices error:', err);
        if (isMounted) {
          let msg = 'Could not access camera or microphone. Please check browser permissions.';
          if (err.name === 'NotAllowedError') {
            msg = 'Camera or microphone permission was denied. Please allow access in your browser settings to continue.';
          } else if (err.name === 'NotFoundError') {
            msg = 'No camera or microphone device was detected on your computer.';
          }
          setPermissionError(msg);
        }
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      stopAllMedia();
    };
  }, []);

  // Cleanup helper
  const stopAllMedia = () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);

    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.stop();
      audioAnalyzerRef.current = null;
    }
    if (speechTranscriberRef.current) {
      speechTranscriberRef.current.stop();
    }
    if (visionTrackerRef.current) {
      visionTrackerRef.current.destroy();
      visionTrackerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  // Telemetry Polling Loop during Recording
  const startRecordingSession = useCallback(() => {
    setIsRecording(true);
    setElapsedSec(0);
    timeSeriesRef.current = [];
    pausesRef.current = [];
    currentPauseStartRef.current = null;

    // Start Speech Recognition
    if (speechTranscriberRef.current) {
      speechTranscriberRef.current.start((text) => {
        setLiveTranscript(text);
        const words = text.split(/\s+/).filter(Boolean).length;
        const mins = Math.max(0.1, elapsedSec / 60);
        setLiveWpm(Math.round(words / mins));
      });
    }

    // Timer Interval (Elapsed Time)
    const startTime = Date.now();
    timerIdRef.current = window.setInterval(() => {
      const now = Date.now();
      const currentElapsed = Math.floor((now - startTime) / 1000);
      setElapsedSec(currentElapsed);
    }, 1000);

    // Telemetry Sampling Interval (~250ms)
    intervalIdRef.current = window.setInterval(() => {
      const currentSec = (Date.now() - startTime) / 1000;

      // 1. Audio Sample
      let audioSnap = { volume: 0, pitch: null as number | null, isSpeaking: false, rms: 0 };
      if (audioAnalyzerRef.current) {
        audioSnap = audioAnalyzerRef.current.getSnapshot();
        setLiveVolume(audioSnap.volume);
        setLivePitch(audioSnap.pitch);
      }

      // Track Silence / Pauses
      if (!audioSnap.isSpeaking) {
        if (currentPauseStartRef.current === null) {
          currentPauseStartRef.current = currentSec;
        }
      } else {
        if (currentPauseStartRef.current !== null) {
          const pauseDuration = currentSec - currentPauseStartRef.current;
          if (pauseDuration >= 1.0) {
            pausesRef.current.push({
              id: `pause-${Date.now()}`,
              startTime: Math.round(currentPauseStartRef.current * 10) / 10,
              duration: Math.round(pauseDuration * 10) / 10,
              isDisruptive: pauseDuration > 2.5
            });
          }
          currentPauseStartRef.current = null;
        }
      }

      // 2. Vision Sample
      let visionSnap: VisionAnalysisSnapshot = {
        isCameraFacing: null,
        cameraFacingConfidence: 0,
        postureLean: 'centered',
        postureAngleDeg: 0,
        movementMagnitude: 0,
        handsDetected: false,
        handsOutsideFrame: false,
        isModelReady: false
      };

      if (visionTrackerRef.current && videoRef.current) {
        visionSnap = visionTrackerRef.current.analyzeFrame(videoRef.current, performance.now());
        setLiveCameraFacing(visionSnap.isCameraFacing);
        setLivePostureLean(visionSnap.postureLean);
        setLiveMovement(visionSnap.movementMagnitude);
      }

      // Append Sample
      const sample: MetricSample = {
        timestamp: Math.round(currentSec * 10) / 10,
        volume: audioSnap.volume,
        pitch: audioSnap.pitch,
        isSpeaking: audioSnap.isSpeaking,
        isCameraFacing: visionSnap.isCameraFacing,
        postureLean: visionSnap.postureLean,
        movementMagnitude: visionSnap.movementMagnitude,
        handsDetected: visionSnap.handsDetected
      };

      timeSeriesRef.current.push(sample);
    }, 250);
  }, [elapsedSec]);

  // Impromptu Prep Countdown Timer
  useEffect(() => {
    if (mode === 'impromptu' && impromptuPhase === 'prep' && streamReady) {
      prepTimerRef.current = window.setInterval(() => {
        setPrepSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepTimerRef.current!);
            startRecordingSession();
            setImpromptuPhase('speaking');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      };
    }
    return undefined;
  }, [mode, impromptuPhase, streamReady, startRecordingSession]);

  // Auto-Start Recording when ready for Presentation & Interview Modes
  useEffect(() => {
    if (streamReady && !isRecording && (mode === 'presentation' || mode === 'interview')) {
      startRecordingSession();
    }
  }, [streamReady, isRecording, mode, startRecordingSession]);

  // Handle Interview Next Question
  const handleNextInterviewQuestion = () => {
    const qDurationSec = Math.max(1, elapsedSec - questionStartTimeSec);
    const qTranscript = liveTranscript;
    const currentQText = interviewQuestions[currentQuestionIdx] || `Question ${currentQuestionIdx + 1}`;

    const qResult: QuestionSessionResult = {
      questionIndex: currentQuestionIdx,
      question: currentQText,
      durationSec: qDurationSec,
      transcript: qTranscript,
      wordCount: qTranscript.split(/\s+/).filter(Boolean).length,
      wpm: Math.round((qTranscript.split(/\s+/).filter(Boolean).length / (qDurationSec / 60))),
      fillerCount: 0,
      fillersBreakdown: {},
      pauseCount: pausesRef.current.filter((p) => p.startTime >= questionStartTimeSec).length,
      silenceTimeSec: 0,
      volumeVariation: 15,
      pitchVariation: 20,
      cameraFacingPct: liveCameraFacing === true ? 85 : 60,
      postureSummary: livePostureLean === 'centered' ? 'Centered posture' : `Leaned ${livePostureLean}`,
      communicationObservations: [
        'Response directly addressed the question prompt.',
        qTranscript.length > 50 ? 'Included clear supporting details.' : 'Answer was relatively brief.'
      ]
    };

    setQuestionResults((prev) => [...prev, qResult]);

    if (currentQuestionIdx + 1 < interviewQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setQuestionStartTimeSec(elapsedSec);
      setLiveTranscript('');
      if (speechTranscriberRef.current) {
        speechTranscriberRef.current.stop();
        speechTranscriberRef.current.start((text) => setLiveTranscript(text));
      }
    } else {
      finishSession();
    }
  };

  // Finish Recording & Generate Results
  const finishSession = () => {
    stopAllMedia();

    const finalTranscript = speechTranscriberRef.current
      ? speechTranscriberRef.current.stop()
      : liveTranscript;

    const totalDurationSec = Math.max(1, elapsedSec);

    let sessionTitle = 'Practice Session';
    let targetDurationSec: number | undefined;

    if (mode === 'presentation' && presentationConfig) {
      sessionTitle = presentationConfig.title;
      targetDurationSec = presentationConfig.targetDurationSec;
    } else if (mode === 'interview' && interviewConfig) {
      sessionTitle = `${interviewConfig.category} Interview Practice (${interviewConfig.questionCount} Questions)`;
    } else if (mode === 'impromptu' && impromptuConfig) {
      sessionTitle = `Impromptu: "${impromptuConfig.topic}"`;
      targetDurationSec = impromptuConfig.speakingTimeSec;
    }

    const compiledResult = AnalysisEngine.calculateResults({
      title: sessionTitle,
      mode,
      durationSec: totalDurationSec,
      targetDurationSec,
      prepTimeSec: mode === 'impromptu' ? impromptuConfig?.prepTimeSec : undefined,
      timeSeries: timeSeriesRef.current,
      pauses: pausesRef.current,
      transcript: finalTranscript,
      interviewQuestionsResults: mode === 'interview' ? questionResults : undefined
    });

    onFinish(compiledResult);
  };

  if (permissionError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="glass-panel rounded-3xl p-8 space-y-6 border border-rose-300 dark:border-rose-500/40 bg-rose-50/80 dark:bg-rose-950/20 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-200">Camera & Mic Access Required</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{permissionError}</p>
          </div>
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors"
          >
            Back to Options
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6 space-y-6">
      {/* Top Studio Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping absolute" />
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 relative" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center space-x-2">
              <span>
                {mode === 'presentation' && presentationConfig?.title}
                {mode === 'interview' && `${interviewConfig?.category} Interview`}
                {mode === 'impromptu' && 'Impromptu Speaking Challenge'}
              </span>
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'impromptu' && impromptuPhase === 'prep'
                ? 'Preparation Phase (Count Down)'
                : `Recording Studio • ${formatDuration(elapsedSec)}`}
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center space-x-3">
          {mode === 'presentation' && presentationConfig?.notes && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-sky-500" />
              <span>{showNotes ? 'Hide Notes' : 'Teleprompter Notes'}</span>
            </button>
          )}

          {mode === 'impromptu' && impromptuPhase === 'prep' && (
            <button
              onClick={() => {
                if (prepTimerRef.current) clearInterval(prepTimerRef.current);
                setImpromptuPhase('speaking');
                startRecordingSession();
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-md"
            >
              <Zap className="w-4 h-4" />
              <span>Start Speaking Now</span>
            </button>
          )}

          {mode === 'interview' && (
            <button
              onClick={handleNextInterviewQuestion}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-md"
            >
              <span>
                {currentQuestionIdx + 1 === (interviewConfig?.questionCount || 3)
                  ? 'Finish Interview'
                  : 'Next Question'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {(mode === 'presentation' || (mode === 'impromptu' && impromptuPhase === 'speaking')) && (
            <button
              onClick={finishSession}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all transform hover:scale-105"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Finish Practice</span>
            </button>
          )}
        </div>
      </div>

      {/* Impromptu Prep Countdown Overlay */}
      {mode === 'impromptu' && impromptuPhase === 'prep' && (
        <div className="glass-panel rounded-3xl p-8 border border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
            <span>Preparation Countdown</span>
          </div>

          <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            {prepSecondsLeft} <span className="text-2xl text-amber-600 dark:text-amber-400 font-semibold">seconds</span>
          </div>

          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Topic Prompt</div>
            <div className="text-lg font-bold text-amber-900 dark:text-amber-200">"{impromptuConfig?.topic}"</div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Organize your opening hook, 2 main points, and conclusion. Recording starts automatically when timer expires.
          </p>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Canvas Container */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden glass-panel border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950 min-h-[340px] sm:min-h-[460px] flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Video Overlay Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
            {/* Camera Facing Indicator */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-semibold border transition-all ${
                liveCameraFacing === true
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : liveCameraFacing === false
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {liveCameraFacing === true
                  ? 'Camera Facing'
                  : liveCameraFacing === false
                  ? 'Looking Away'
                  : 'Detecting Face...'}
              </span>
            </div>

            {/* Live Timer & WPM */}
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-xs font-mono font-bold text-white border border-slate-700">
                {formatDuration(elapsedSec)}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-xs font-bold text-brand-400 border border-slate-700">
                {liveWpm} WPM
              </div>
            </div>
          </div>

          {/* Bottom Live Audio & Posture Telemetry Bar */}
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-300">
            {/* Volume Audio Meter */}
            <div className="flex items-center space-x-3">
              <Volume2 className="w-4 h-4 text-brand-400" />
              <div className="w-24 sm:w-32 h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-400 to-rose-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, liveVolume)}%` }}
                />
              </div>
              <span className="font-mono text-slate-200">{liveVolume}%</span>
            </div>

            {/* Pitch Readout */}
            <div className="hidden sm:flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Pitch:</span>
              <span className="font-mono font-bold text-sky-300">
                {livePitch ? `${livePitch} Hz` : 'Quiet'}
              </span>
            </div>

            {/* Posture Lean */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Lean:</span>
              <span
                className={`font-semibold capitalize ${
                  livePostureLean === 'centered' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {livePostureLean}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-6">
          {/* Interview Question Card */}
          {mode === 'interview' && (
            <div className="glass-panel rounded-3xl p-6 border border-sky-300 dark:border-sky-500/30 space-y-4 bg-sky-50/70 dark:bg-sky-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                  Question {currentQuestionIdx + 1} of {interviewQuestions.length}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300">
                  {interviewConfig?.category}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                "{interviewQuestions[currentQuestionIdx] || 'Tell me about yourself.'}"
              </h4>
            </div>
          )}

          {/* Teleprompter Notes (Presentation Mode) */}
          {mode === 'presentation' && presentationConfig?.notes && showNotes && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-brand-500" />
                  <span>Speaker Teleprompter Notes</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                {presentationConfig.notes}
              </div>
            </div>
          )}

          {/* Real-time Live Transcript Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                <span>Live Speech Transcript</span>
              </h4>
              {!speechSupported && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                  Engine Unsupported
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 min-h-[160px] max-h-[220px] overflow-y-auto text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-sans">
              {liveTranscript ? (
                <span>{liveTranscript}</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">
                  {speechSupported
                    ? 'Start speaking into your microphone to view live transcript...'
                    : 'Speech transcription is not supported in this browser engine. Audio, pitch, volume, and vision telemetry are 100% active.'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
