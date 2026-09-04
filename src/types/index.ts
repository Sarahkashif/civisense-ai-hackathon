export type Category =
  | 'Road Damage'
  | 'Garbage & Sanitation'
  | 'Water Supply / Leakage'
  | 'Drainage & Sewage'
  | 'Street Lighting'
  | 'Public Infrastructure'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Road Damage',
  'Garbage & Sanitation',
  'Water Supply / Leakage',
  'Drainage & Sewage',
  'Street Lighting',
  'Public Infrastructure',
  'Other',
];

export type Priority = 'High' | 'Medium' | 'Low';

export type Status = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved';

export const STATUSES: Status[] = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

export type DuplicateStatus = 'Likely duplicate' | 'Possible duplicate' | 'No likely duplicate';

export interface StatusEvent {
  status: Status;
  timestamp: string;
  note?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  title: string;
  description: string;
  selectedCategory: Category | null;
  analysisCategory: Category;
  finalCategory: Category;
  location: string;
  imageData: string | null;
  voiceTranscript: string | null;
  status: Status;
  priority: Priority;
  priorityScore: number;
  priorityExplanation: string;
  duplicateStatus: DuplicateStatus;
  duplicateOf: string | null;
  supportCount: number;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusEvent[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface StoredUser extends User {
  password: string;
}

export interface DuplicateResult {
  status: DuplicateStatus;
  matchId: string | null;
  matchTitle: string | null;
  confidence: number;
}

export interface AnalysisResult {
  category: Category;
  categoryConfidence: string;
  priority: Priority;
  priorityScore: number;
  priorityExplanation: string;
  duplicate: DuplicateResult;
}
