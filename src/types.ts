export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type Language = 'English' | 'Twi' | 'Ga';

export interface Message {
  id: string;
  role: 'nurse' | 'user';
  text: string;
  timestamp: string;
}

export interface Nurse {
  id: string;
  name: string;
  region: string;
  languages: string[];
  role: string;
  experience: string;
  available: boolean;
  avatar: string;
}

export interface TriageResult {
  riskLevel: RiskLevel;
  title: string;
  description: string;
  recommendations: string[];
  concerns?: string[];
  nearestFacility?: string;
}

export interface RegionRiskCluster {
  region: string;
  highRiskCount: number;
  medRiskCount: number;
  lowRiskCount: number;
}
