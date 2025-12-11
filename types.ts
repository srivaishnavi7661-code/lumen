export interface CareerAssets {
  resumeDraft: string;
  coverLetter: string;
  interviewPrep: string;
  linkedinContent: string;
  networkingMessages: string;
  skillGapAnalysis: string;
  atsOptimization: string;
}

export interface CompanyResearch {
  culture: string;
  workMode: string;
  salary: string;
  availability: string;
  sources: string[];
}

export interface JobMatchAnalysis {
  matchScore: number;
  tailoredSummary: string;
  missingSkills: string[];
  resumeImprovements: string[];
  interviewFocus: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isThinking?: boolean;
}

export interface SavedSession {
  id: string;
  title: string;
  timestamp: number;
  lastModified: string;
  data: {
    rawNotes: string;
    tone: Tone;
    companyInput: string;
    companyResearch: CompanyResearch | null;
    assets: CareerAssets | null;
    appState: AppState;
    chatMessages: ChatMessage[];
    targetJobDescription: string;
    jobMatchAnalysis: JobMatchAnalysis | null;
    activeTab: Tab;
  };
}

export interface User {
  email: string;
  password?: string;
  linkedin?: string;
  mobile?: string;
  dob?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  RESEARCHING = 'RESEARCHING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export enum Tab {
  RESUME = 'RESUME',
  COVER_LETTER = 'COVER_LETTER',
  INTERVIEW_PREP = 'INTERVIEW_PREP',
  COMPANY_INTEL = 'COMPANY_INTEL',
  LINKEDIN = 'LINKEDIN',
  NETWORKING = 'NETWORKING',
  SKILL_GAP = 'SKILL_GAP',
  JOB_MATCH = 'JOB_MATCH'
}

export type Tone = 'Professional' | 'Enthusiastic' | 'Academic' | 'Creative' | 'Confident';