import type { Complaint, Category, Status, StatusEvent } from '../types';
import { analyzeComplaint } from './analysisService';
import {
  loadComplaints,
  addComplaint,
  getComplaint,
  updateComplaint,
  incrementSupport,
  hasBeenSeeded,
  seedComplaints,
  loadUserComplaints,
  getUserComplaint,
} from './storageService';
import { dbUpdateComplaintStatus } from './databaseService';
import { SEED_COMPLAINTS } from '../data/seedData';

/**
 * Complaint service — high-level operations used by UI pages.
 * All functions are async (Supabase-backed).
 */

/** Initialize seed data if storage is empty. */
export async function initializeData(): Promise<void> {
  const seeded = await hasBeenSeeded();
  if (!seeded) {
    const existing = await loadComplaints();
    if (existing.length === 0) {
      await seedComplaints(SEED_COMPLAINTS);
    }
  }
}

/** Generate a unique complaint ID in format CS-YYYY-XXXX */
export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CS-${year}-${rand}`;
}

/** Submit a new complaint: analyze, assign ID, persist. */
export async function submitComplaint(input: {
  userId: string;
  title: string;
  description: string;
  location: string;
  selectedCategory: Category | null;
  imageData: string | null;
  voiceTranscript: string | null;
}): Promise<Complaint> {
  const existing = await loadComplaints();
  const analysis = analyzeComplaint(
    input.title,
    input.description,
    input.location,
    input.selectedCategory,
    existing
  );

  const now = new Date().toISOString();
  const id = generateComplaintId();

  const complaint: Complaint = {
    id,
    userId: input.userId,
    title: input.title,
    description: input.description,
    selectedCategory: input.selectedCategory,
    analysisCategory: analysis.category,
    finalCategory: input.selectedCategory || analysis.category,
    location: input.location,
    imageData: input.imageData,
    voiceTranscript: input.voiceTranscript,
    status: 'Submitted',
    priority: analysis.priority,
    priorityScore: analysis.priorityScore,
    priorityExplanation: analysis.priorityExplanation,
    duplicateStatus: analysis.duplicate.status,
    duplicateOf: analysis.duplicate.matchId,
    supportCount: 0,
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status: 'Submitted', timestamp: now }],
  };

  await addComplaint(complaint);
  return complaint;
}

/** Update complaint status with history tracking. */
export async function updateComplaintStatus(
  id: string,
  newStatus: Status,
  note?: string
): Promise<Complaint | null> {
  return dbUpdateComplaintStatus(id, newStatus, note);
}

export { loadComplaints, getComplaint, updateComplaint, incrementSupport, loadUserComplaints, getUserComplaint };
