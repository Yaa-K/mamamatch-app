
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

export interface AppState {
  screen: 'start' | 'language-select' | 'chat' | 'loading' | 'result' | 'nurse-match';
  language: Language;
  currentQuestionIndex: number;
  answers: Record<number, any>;
  riskLevel: RiskLevel | null;
}
