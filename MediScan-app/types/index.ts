// Authentication types
export interface AuthState {
  isAuthenticatedUser: boolean;
  user: UserProfile | null;
  error: string | null;
  tokens: AuthTokens | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  bio?: string | null;
  birth_date?: string | null;
}

export interface UserProfile {
  username: string;
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  birth_date?: string | null;
  profile_picture?: string | null;
  role?: string;
}

// Login/Register request and response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  birth_date: string | null;
  profile_picture: string | null;
}

// X-ray analysis types
export interface XRayImage {
  file: File;
  preview: string;
}

export interface Prediction {
  label: string;
  confidence: number;
}

export interface PatientVitals {
  patientName: string;
  birthdate: string; // YYYY-MM-DD
  gender: string;    // 'male' | 'female'
}

export interface DiseasePrediction {
  label: string;
  probability?: number;
  percentage?: number;
  confidence?: number;
  detected?: boolean;
  source_model?: string;
}

export interface UIDecision {
  type: "pneumonia" | "other_pulmonary_disease" | "normal";
  title: string;
  message: string;
  specialist_required: boolean;
  specialist?: string | null;
  diseases?: DiseasePrediction[];
  detected_labels?: string[];
}

export interface AnalysisResult {
  Normal?: number;
  Pneumonia?: number;

  patientName: string;
  age?: number;
  gender?: string;

  prediction?: {
    label?: string;
    final_status?: string;
    has_pneumonia?: boolean;
    confidence?: number;
    probabilities?: Record<string, number>;
  };

  predictions?: Prediction[];
  topPrediction?: Prediction;

  final_detected_diseases?: DiseasePrediction[];
  ui_decision?: UIDecision;

  success?: boolean;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PredictionResponse {
  prediction?: {
    label: string;
    final_status?: string;
    has_pneumonia: boolean;
    confidence: number;
    probabilities: Record<string, number>;
  };

  pneumonia_prediction?: Record<string, any>;

  multi_label_prediction?: {
    detected_diseases?: DiseasePrediction[];
    top_prediction?: DiseasePrediction;
    all_probabilities?: DiseasePrediction[];
  };

  final_detected_diseases?: DiseasePrediction[];

  ui_decision?: UIDecision;

  Normal?: number;
  Pneumonia?: number;
  age?: number;
  gender?: string;
  patientName: string;
}