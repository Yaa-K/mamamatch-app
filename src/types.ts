
export type Language = 'english' | 'twi' | 'ga';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Question {
  id: number;
  text: string;
  type: 'choice' | 'number';
  options?: { label: string; value: boolean | string | number }[];
  concernValue?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'ama' | 'user';
  text: string;
  timestamp: Date;
}

export interface DetailedAnalysis {
  summary: string;
  riskExplanation: string;
  pregnancyTips: string[];
  nextSteps: string[];
}

export interface AppState {
  screen: 'start' | 'language-select' | 'chat' | 'loading' | 'result' | 'nurse-match';
  language: Language;
  currentQuestionIndex: number;
  answers: Record<number, any>;
  riskLevel: RiskLevel | null;
  detailedAnalysis?: DetailedAnalysis | null;
}

export interface Nurse {
  id: string;
  name: string;
  licenseNumber: string;
  region: string;
  languages: string[];
  availability: 'Available' | 'Busy' | 'Off';
  whatsapp: string;
  status: 'PENDING' | 'VERIFIED';
  avatar: string;
}

export interface PatientCheckIn {
  id: string;
  name: string;
  phone: string;
  language: Language;
  gestationalWeeks: number;
  region: string;
  riskLevel: RiskLevel;
  answers: Record<string, any>;
  summary: string;
  riskExplanation: string;
  pregnancyTips: string[];
  nextSteps: string[];
  timestamp: string;
  status: 'pending' | 'completed';
  matchedNurseId: string | null;
}
