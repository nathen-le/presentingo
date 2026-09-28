import { FillerWordMatch, TranscriptSegment } from '../types';

export const DEFAULT_FILLER_WORDS = [
  'um',
  'uh',
  'like',
  'you know',
  'basically',
  'actually',
  'so',
  'I mean',
  'right',
  'sort of',
  'kind of'
];

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export class SpeechTranscriber {
  private recognition: any = null;
  private isListening = false;
  private fullTranscript = '';
  private transcriptSegments: TranscriptSegment[] = [];
  private startTimeMs = 0;
  private isSupported = false;
  private onTranscriptUpdateCallback?: (transcript: string) => void;

  constructor() {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.isSupported = true;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = '';
        const nowSec = (Date.now() - this.startTimeMs) / 1000;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const text = result[0].transcript.trim();

          if (result.isFinal) {
            this.fullTranscript += (this.fullTranscript ? ' ' : '') + text;

            this.transcriptSegments.push({
              id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              text: text,
              startTime: Math.max(0, nowSec - 2),
              endTime: nowSec
            });
          } else {
            currentInterim += text;
          }
        }

        const combined = (this.fullTranscript + ' ' + currentInterim).trim();
        if (this.onTranscriptUpdateCallback) {
          this.onTranscriptUpdateCallback(combined);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition notice:', event.error);
        // Automatically restart if harmless network error during active session
        if (this.isListening && (event.error === 'no-speech' || event.error === 'network')) {
          try {
            this.recognition.start();
          } catch (e) {
            // Ignore duplicate start errors
          }
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Ignore
          }
        }
      };
    }
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  public start(onUpdate?: (transcript: string) => void): void {
    if (!this.isSupported || !this.recognition) return;

    this.fullTranscript = '';
    this.transcriptSegments = [];
    this.startTimeMs = Date.now();
    this.isListening = true;
    this.onTranscriptUpdateCallback = onUpdate;

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition start error:', err);
    }
  }

  public stop(): string {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignore
      }
    }
    return this.fullTranscript.trim();
  }

  public getFullTranscript(): string {
    return this.fullTranscript.trim();
  }

  public getSegments(): TranscriptSegment[] {
    return [...this.transcriptSegments];
  }

  /**
   * Analyzes transcript against filler word list and repeated phrase patterns
   */
  public static analyzeTranscript(
    transcript: string,
    customFillerWords: string[] = DEFAULT_FILLER_WORDS
  ): {
    wordCount: number;
    fillersCount: Record<string, number>;
    totalFillers: number;
    fillerMatches: FillerWordMatch[];
    repeatedWordsCount: number;
    repeatedPhrases: string[];
  } {
    if (!transcript || transcript.trim() === '') {
      return {
        wordCount: 0,
        fillersCount: {},
        totalFillers: 0,
        fillerMatches: [],
        repeatedWordsCount: 0,
        repeatedPhrases: []
      };
    }

    const words = transcript.toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const fillersCount: Record<string, number> = {};
    const fillerMatches: FillerWordMatch[] = [];
    let totalFillers = 0;

    // Standardize list of filler words sorted by length descending so multi-word fillers match first (e.g. "you know")
    const sortedFillers = [...customFillerWords].sort((a, b) => b.length - a.length);

    const lowerTranscript = transcript.toLowerCase();

    sortedFillers.forEach((filler) => {
      const fillerLower = filler.toLowerCase();
      // Regex boundary search
      const escaped = fillerLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

      let match: RegExpExecArray | null;
      let count = 0;

      while ((match = regex.exec(lowerTranscript)) !== null) {
        count++;
        totalFillers++;
        fillerMatches.push({
          id: `fill-${match.index}`,
          word: filler,
          timestamp: match.index, // position proxy
          transcriptOffset: match.index
        });
      }

      if (count > 0) {
        fillersCount[filler] = count;
      }
    });

    // Detect repeated consecutive words ("the the", "I I", "and and")
    const repeatedPhrases: string[] = [];
    let repeatedWordsCount = 0;

    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i].replace(/[^\w]/g, '');
      const w2 = words[i + 1].replace(/[^\w]/g, '');

      if (w1 && w1 === w2 && w1.length > 1) {
        repeatedWordsCount++;
        const phrase = `${w1} ${w2}`;
        if (!repeatedPhrases.includes(phrase)) {
          repeatedPhrases.push(phrase);
        }
      }
    }

    return {
      wordCount,
      fillersCount,
      totalFillers,
      fillerMatches,
      repeatedWordsCount,
      repeatedPhrases
    };
  }
}
