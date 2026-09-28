import {
  FilesetResolver,
  PoseLandmarker,
  FaceLandmarker,
  PoseLandmarkerResult,
  FaceLandmarkerResult
} from '@mediapipe/tasks-vision';

export interface VisionAnalysisSnapshot {
  isCameraFacing: boolean | null;
  cameraFacingConfidence: number; // 0-1
  postureLean: 'left' | 'right' | 'forward' | 'backward' | 'centered';
  postureAngleDeg: number;
  movementMagnitude: number; // 0-100 stability index
  handsDetected: boolean;
  handsOutsideFrame: boolean;
  isModelReady: boolean;
  errorMessage?: string;
}

interface Point2D {
  x: number;
  y: number;
  z?: number;
}

export class VisionTracker {
  private poseLandmarker: PoseLandmarker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitialized = false;
  private initError: string | null = null;

  private prevKeypoints: Point2D[] = [];
  private prevTimestamp = 0;

  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Load MediaPipe WASM binaries from CDN
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      // Create Pose Landmarker
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1
      });

      // Create Face Landmarker for precise head pitch/yaw
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1
      });

      this.isInitialized = true;
      return true;
    } catch (err: unknown) {
      console.warn('MediaPipe GPU initialization failed, falling back to CPU delegate:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });

        this.isInitialized = true;
        return true;
      } catch (fallbackErr: unknown) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'MediaPipe Vision models unavailable';
        console.error('VisionTracker initialization failed:', msg);
        this.initError = msg;
        return false;
      }
    }
  }

  public analyzeFrame(videoElement: HTMLVideoElement, timestampMs: number): VisionAnalysisSnapshot {
    if (!this.isInitialized || !videoElement || videoElement.readyState < 2) {
      return {
        isCameraFacing: null,
        cameraFacingConfidence: 0,
        postureLean: 'centered',
        postureAngleDeg: 0,
        movementMagnitude: 0,
        handsDetected: false,
        handsOutsideFrame: false,
        isModelReady: this.isInitialized,
        errorMessage: this.initError || undefined
      };
    }

    try {
      let poseResult: PoseLandmarkerResult | null = null;
      let faceResult: FaceLandmarkerResult | null = null;

      if (this.poseLandmarker) {
        poseResult = this.poseLandmarker.detectForVideo(videoElement, timestampMs);
      }
      if (this.faceLandmarker) {
        faceResult = this.faceLandmarker.detectForVideo(videoElement, timestampMs);
      }

      // Process Face & Pose Landmark Data
      return this.computeMetrics(poseResult, faceResult, timestampMs);
    } catch (err) {
      return {
        isCameraFacing: null,
        cameraFacingConfidence: 0,
        postureLean: 'centered',
        postureAngleDeg: 0,
        movementMagnitude: 0,
        handsDetected: false,
        handsOutsideFrame: false,
        isModelReady: this.isInitialized,
        errorMessage: 'Frame processing skipped'
      };
    }
  }

  private computeMetrics(
    poseResult: PoseLandmarkerResult | null,
    faceResult: FaceLandmarkerResult | null,
    timestampMs: number
  ): VisionAnalysisSnapshot {
    let isCameraFacing: boolean | null = null;
    let cameraFacingConfidence = 0.5;
    let postureLean: 'left' | 'right' | 'forward' | 'backward' | 'centered' = 'centered';
    let postureAngleDeg = 0;
    let movementMagnitude = 0;
    let handsDetected = false;
    let handsOutsideFrame = false;

    // 1. Camera Facing Estimation via Face Mesh or Pose Head Landmarks
    if (faceResult && faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
      const landmarks = faceResult.faceLandmarks[0];
      // Index 1: Nose tip, Index 33: Left eye outer, Index 263: Right eye outer
      const nose = landmarks[1];
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];

      if (nose && leftEye && rightEye) {
        const distLeft = Math.hypot(nose.x - leftEye.x, nose.y - leftEye.y);
        const distRight = Math.hypot(nose.x - rightEye.x, nose.y - rightEye.y);
        const ratio = distLeft / (distRight + 0.0001);

        // Yaw check: Ratio between 0.6 and 1.6 indicates face pointing forward
        const yawCentered = ratio >= 0.65 && ratio <= 1.55;

        // Pitch check: Nose y relative to eye y midpoint
        const eyeMidY = (leftEye.y + rightEye.y) / 2;
        const pitchDiff = nose.y - eyeMidY;
        const pitchCentered = pitchDiff > 0.01 && pitchDiff < 0.15;

        isCameraFacing = yawCentered && pitchCentered;
        cameraFacingConfidence = isCameraFacing ? 0.95 : 0.40;
      }
    } else if (poseResult && poseResult.landmarks && poseResult.landmarks.length > 0) {
      const pose = poseResult.landmarks[0];
      const nose = pose[0];
      const leftEar = pose[7];
      const rightEar = pose[8];

      if (nose && leftEar && rightEar) {
        const distLeft = Math.abs(nose.x - leftEar.x);
        const distRight = Math.abs(nose.x - rightEar.x);
        const ratio = distLeft / (distRight + 0.0001);
        isCameraFacing = ratio >= 0.6 && ratio <= 1.6;
      }
    }

    // 2. Posture & Lean Analysis from Shoulders and Nose
    if (poseResult && poseResult.landmarks && poseResult.landmarks.length > 0) {
      const pose = poseResult.landmarks[0];
      const nose = pose[0];
      const leftShoulder = pose[11];
      const rightShoulder = pose[12];
      const leftWrist = pose[15];
      const rightWrist = pose[16];

      if (leftShoulder && rightShoulder) {
        // Shoulder slope angle in degrees
        const dy = rightShoulder.y - leftShoulder.y;
        const dx = rightShoulder.x - leftShoulder.x;
        postureAngleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

        const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;

        if (nose) {
          const leanOffset = nose.x - shoulderMidX;
          if (leanOffset < -0.06) {
            postureLean = 'right'; // Mirrored camera view
          } else if (leanOffset > 0.06) {
            postureLean = 'left';
          } else if (Math.abs(postureAngleDeg) > 8) {
            postureLean = postureAngleDeg > 0 ? 'left' : 'right';
          } else {
            postureLean = 'centered';
          }
        }
      }

      // Hands detection
      if (leftWrist && rightWrist) {
        const leftVisible = (leftWrist.visibility ?? 1) > 0.4;
        const rightVisible = (rightWrist.visibility ?? 1) > 0.4;

        handsDetected = leftVisible || rightVisible;

        // Check if hands are out of frame (y near 1.0 or x near boundaries)
        const leftOut = leftWrist.x < 0.05 || leftWrist.x > 0.95 || leftWrist.y > 0.95;
        const rightOut = rightWrist.x < 0.05 || rightWrist.x > 0.95 || rightWrist.y > 0.95;
        handsOutsideFrame = leftOut || rightOut;
      }

      // 3. Movement Magnitude Calculation across frames
      const currentPoints: Point2D[] = [
        pose[0],  // Nose
        pose[11], // L Shoulder
        pose[12], // R Shoulder
        pose[15], // L Wrist
        pose[16]  // R Wrist
      ].filter(Boolean);

      if (this.prevKeypoints.length === currentPoints.length && this.prevTimestamp > 0) {
        let totalDelta = 0;
        for (let i = 0; i < currentPoints.length; i++) {
          const p1 = this.prevKeypoints[i];
          const p2 = currentPoints[i];
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          totalDelta += dist;
        }

        const dtSec = (timestampMs - this.prevTimestamp) / 1000;
        if (dtSec > 0) {
          const velocity = (totalDelta / currentPoints.length) / dtSec;
          movementMagnitude = Math.min(100, Math.round(velocity * 120));
        }
      }

      this.prevKeypoints = currentPoints;
      this.prevTimestamp = timestampMs;
    }

    return {
      isCameraFacing,
      cameraFacingConfidence,
      postureLean,
      postureAngleDeg,
      movementMagnitude,
      handsDetected,
      handsOutsideFrame,
      isModelReady: true
    };
  }

  public destroy(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.isInitialized = false;
  }
}
