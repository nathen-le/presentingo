import {
  MetricSample,
  PauseRecord,
  SessionMode,
  SessionResult,
  QuestionSessionResult
} from '../types';
import { SpeechTranscriber, DEFAULT_FILLER_WORDS } from './speechTranscriber';

export interface RawSessionInput {
  title: string;
  mode: SessionMode;
  durationSec: number;
  targetDurationSec?: number;
  prepTimeSec?: number;
  timeSeries: MetricSample[];
  pauses: PauseRecord[];
  transcript: string;
  customFillerWords?: string[];
  interviewQuestionsResults?: QuestionSessionResult[];
}

export class AnalysisEngine {
  public static calculateResults(input: RawSessionInput): SessionResult {
    const {
      title,
      mode,
      durationSec,
      targetDurationSec,
      prepTimeSec,
      timeSeries,
      pauses,
      transcript,
      customFillerWords = DEFAULT_FILLER_WORDS,
      interviewQuestionsResults
    } = input;

    const safeDuration = Math.max(1, durationSec);

    // 1. Analyze Transcript
    const transcriptData = SpeechTranscriber.analyzeTranscript(
      transcript,
      customFillerWords
    );

    const wordCount = transcriptData.wordCount;
    const wpm = Math.round((wordCount / (safeDuration / 60)));

    // 2. Pause & Silence Metrics
    const totalPauseTimeSec = pauses.reduce((sum, p) => sum + p.duration, 0);
    const silenceTimeSec = Math.min(safeDuration, Math.round(totalPauseTimeSec * 10) / 10);
    const speakingTimeSec = Math.max(0, safeDuration - silenceTimeSec);
    const silencePercentage = Math.round((silenceTimeSec / safeDuration) * 100);

    const longestPauseSec = pauses.length > 0
      ? Math.round(Math.max(...pauses.map((p) => p.duration)) * 10) / 10
      : 0;

    const avgPauseLengthSec = pauses.length > 0
      ? Math.round((silenceTimeSec / pauses.length) * 10) / 10
      : 0;

    // 3. Audio Stats (Volume & Pitch)
    const volumes = timeSeries.map((s) => s.volume);
    const avgVolume = volumes.length > 0
      ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length)
      : 0;

    const quietSectionsCount = volumes.filter((v) => v > 0 && v < 15).length;
    const loudSectionsCount = volumes.filter((v) => v > 65).length;
    const quietSectionsPct = volumes.length > 0
      ? Math.round((quietSectionsCount / volumes.length) * 100)
      : 0;
    const loudSectionsPct = volumes.length > 0
      ? Math.round((loudSectionsCount / volumes.length) * 100)
      : 0;

    // Volume Variation Index (Standard Deviation)
    const volVariance = volumes.length > 0
      ? volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length
      : 0;
    const volumeVariation = Math.round(Math.sqrt(volVariance));

    // Pitch Stats
    const pitchSamples = timeSeries
      .map((s) => s.pitch)
      .filter((p): p is number => p !== null && p > 60 && p < 450);

    const hasReliablePitch = pitchSamples.length >= 5;
    let avgPitch = 0;
    let minPitch = 0;
    let maxPitch = 0;
    let pitchVariation = 0;

    if (hasReliablePitch) {
      avgPitch = Math.round(pitchSamples.reduce((a, b) => a + b, 0) / pitchSamples.length);
      minPitch = Math.min(...pitchSamples);
      maxPitch = Math.max(...pitchSamples);
      const pitchVariance = pitchSamples.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) / pitchSamples.length;
      pitchVariation = Math.round(Math.sqrt(pitchVariance));
    }

    // 4. Visual & Body Language Observations
    const cameraFacingSamples = timeSeries.map((s) => s.isCameraFacing).filter((c) => c !== null);
    const facingCount = cameraFacingSamples.filter((c) => c === true).length;
    const cameraFacingPct = cameraFacingSamples.length > 0
      ? Math.round((facingCount / cameraFacingSamples.length) * 100)
      : 0;

    const postureObservations: string[] = [];
    const movementObservations: string[] = [];
    const gestureObservations: string[] = [];

    // Lean Distribution
    const leanLeftCount = timeSeries.filter((s) => s.postureLean === 'left').length;
    const leanRightCount = timeSeries.filter((s) => s.postureLean === 'right').length;
    const totalPostureSamples = timeSeries.length;

    if (totalPostureSamples > 0) {
      const leftPct = Math.round((leanLeftCount / totalPostureSamples) * 100);
      const rightPct = Math.round((leanRightCount / totalPostureSamples) * 100);

      if (leftPct > 20) {
        postureObservations.push(`Upper body leaned to the left for approximately ${leftPct}% of the recording duration.`);
      }
      if (rightPct > 20) {
        postureObservations.push(`Upper body leaned to the right for approximately ${rightPct}% of the recording duration.`);
      }
      if (leftPct <= 20 && rightPct <= 20) {
        postureObservations.push('Body posture remained predominantly centered and balanced throughout the session.');
      }
    }

    // Movement Stability
    const avgMovement = timeSeries.length > 0
      ? Math.round(timeSeries.reduce((sum, s) => sum + s.movementMagnitude, 0) / timeSeries.length)
      : 0;

    if (avgMovement > 45) {
      movementObservations.push(`Frequent body movement detected (average movement intensity index: ${avgMovement}/100).`);
    } else if (avgMovement < 15) {
      movementObservations.push(`Body position was exceptionally still throughout the session (movement index: ${avgMovement}/100).`);
    } else {
      movementObservations.push(`Moderate natural movement detected during speaking (movement index: ${avgMovement}/100).`);
    }

    // Hand Gestures
    const handsDetectedCount = timeSeries.filter((s) => s.handsDetected).length;
    if (totalPostureSamples > 0) {
      const handsPct = Math.round((handsDetectedCount / totalPostureSamples) * 100);
      if (handsPct > 30) {
        gestureObservations.push(`Hand gestures detected in frame during ${handsPct}% of the session.`);
      } else {
        gestureObservations.push(`Hands remained mostly out of the camera frame or below the desk (${100 - handsPct}% of session).`);
      }
    }

    // 5. Transparent Scores (0-100)
    const fillersPerMin = (transcriptData.totalFillers / safeDuration) * 60;
    const fillerFrequencyScore = Math.max(0, Math.min(100, Math.round(100 - fillersPerMin * 14)));

    // Pace Consistency (Target 130-165 WPM)
    let paceScore = 100;
    if (wpm < 90) {
      paceScore = Math.max(40, Math.round(100 - (90 - wpm) * 0.8));
    } else if (wpm > 175) {
      paceScore = Math.max(40, Math.round(100 - (wpm - 175) * 0.9));
    }

    // Timing Accuracy Score (if target duration provided)
    let timingAccuracyScore = 100;
    if (targetDurationSec && targetDurationSec > 0) {
      const diffSec = Math.abs(durationSec - targetDurationSec);
      const pctErr = diffSec / targetDurationSec;
      timingAccuracyScore = Math.max(30, Math.round(100 - pctErr * 100));
    }

    // Volume Stability Score
    const volumeStabilityScore = Math.max(40, Math.min(100, Math.round(100 - (quietSectionsPct + loudSectionsPct) * 0.6)));

    // Posture Stability Score
    const postureStabilityScore = Math.max(40, Math.min(100, Math.round(100 - (100 - (leanLeftCount + leanRightCount > 0 ? 80 : 100)))));

    const overallScore = Math.round(
      paceScore * 0.2 +
      fillerFrequencyScore * 0.25 +
      timingAccuracyScore * 0.15 +
      volumeStabilityScore * 0.15 +
      cameraFacingPct * 0.15 +
      postureStabilityScore * 0.1
    );

    // 6. Actionable Suggestions (Data-Driven Factual Messages)
    const actionableSuggestions: string[] = [];

    if (transcriptData.totalFillers > 0) {
      const topFiller = Object.entries(transcriptData.fillersCount).sort((a, b) => b[1] - a[1])[0];
      if (topFiller) {
        actionableSuggestions.push(
          `You used filler words ${transcriptData.totalFillers} time${transcriptData.totalFillers > 1 ? 's' : ''} (most frequent: "${topFiller[0]}" — ${topFiller[1]} time${topFiller[1] > 1 ? 's' : ''}). Try replacing filler words with short, intentional pauses.`
        );
      }
    } else if (wordCount > 10) {
      actionableSuggestions.push('Excellent filler-word control! Zero filler words were detected in your speech.');
    }

    if (wpm > 175) {
      actionableSuggestions.push(
        `Your average speaking rate was ${wpm} WPM, which is faster than the recommended 130–160 WPM conversational pace. Consider slowing down during key points.`
      );
    } else if (wpm > 0 && wpm < 100) {
      actionableSuggestions.push(
        `Your average speaking rate was ${wpm} WPM. Expanding slightly on ideas can help maintain listener engagement.`
      );
    }

    if (targetDurationSec && targetDurationSec > 0) {
      const diff = Math.round(durationSec - targetDurationSec);
      if (diff > 15) {
        actionableSuggestions.push(
          `You exceeded your target duration of ${formatTime(targetDurationSec)} by ${diff} seconds.`
        );
      } else if (diff < -15) {
        actionableSuggestions.push(
          `Your presentation ended ${Math.abs(diff)} seconds under your target duration of ${formatTime(targetDurationSec)}.`
        );
      } else {
        actionableSuggestions.push(
          `Great pacing discipline! Your total duration was within 15 seconds of your ${formatTime(targetDurationSec)} target.`
        );
      }
    }

    if (silencePercentage > 30) {
      actionableSuggestions.push(
        `You spent approximately ${silencePercentage}% of the session in silence (${silenceTimeSec}s). Review your speech flow to minimize unexpected gaps.`
      );
    }

    if (cameraFacingPct < 70 && cameraFacingPct > 0) {
      actionableSuggestions.push(
        `Estimated camera-facing time was ${cameraFacingPct}%. Aligning head orientation toward the webcam increases audience rapport.`
      );
    }

    if (hasReliablePitch && pitchVariation > 35) {
      actionableSuggestions.push(
        `Your vocal pitch varied noticeably (${pitchVariation} Hz standard deviation, range ${minPitch}–${maxPitch} Hz), indicating expressive vocal inflection.`
      );
    }

    return {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      mode,
      date: new Date().toISOString(),
      durationSec,
      targetDurationSec,
      prepTimeSec,
      transcript,
      transcriptSegments: [],
      wordCount,
      wpm,
      speakingTimeSec,
      silenceTimeSec,
      silencePercentage,
      fillersCount: transcriptData.fillersCount,
      totalFillers: transcriptData.totalFillers,
      fillerMatches: transcriptData.fillerMatches,
      pauses,
      longestPauseSec,
      avgPauseLengthSec,
      repeatedWordsCount: transcriptData.repeatedWordsCount,
      repeatedPhrases: transcriptData.repeatedPhrases,
      pitchStats: {
        avg: avgPitch,
        min: minPitch,
        max: maxPitch,
        variation: pitchVariation,
        hasReliablePitch
      },
      volumeStats: {
        avg: avgVolume,
        quietSectionsPct,
        loudSectionsPct,
        variation: volumeVariation
      },
      cameraFacingPct,
      postureObservations,
      movementObservations,
      gestureObservations,
      timeSeries,
      scores: {
        paceConsistency: paceScore,
        fillerFrequency: fillerFrequencyScore,
        timingAccuracy: timingAccuracyScore,
        volumeStability: volumeStabilityScore,
        cameraFacing: cameraFacingPct,
        postureStability: postureStabilityScore,
        overall: overallScore
      },
      actionableSuggestions,
      interviewQuestionsResults
    };
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
