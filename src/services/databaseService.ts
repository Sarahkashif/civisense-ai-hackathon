import { supabase } from './supabaseClient';
import type { Complaint, Status, StatusEvent, User, StoredUser } from '../types';

/**
 * Database service — Supabase adapter for all data persistence.
 * All functions are async and communicate with the Supabase backend.
 * Falls back to localStorage when Supabase is not configured (development/testing).
 */

// ============================
// USERS
// ============================

export async function dbSignUpUser(
  fullName: string,
  email: string,
  phone: string,
  password: string,
  userId: string
): Promise<{ user: User | null; error: string | null }> {
  if (!supabase) return localSignUp(fullName, email, phone, password, userId);

  const { error } = await supabase.from('users').insert({
    id: userId,
    full_name: fullName,
    email: email.toLowerCase(),
    phone,
    password,
  });

  if (error) {
    if (error.code === '23505') {
      return { user: null, error: 'An account with this email already exists.' };
    }
    return { user: null, error: error.message };
  }

  const user: User = { id: userId, fullName, email: email.toLowerCase(), phone };
  return { user, error: null };
}

export async function dbLoginUser(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  if (!supabase) return localLogin(email, password);

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, password')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) {
    return { user: null, error: 'Invalid email or password.' };
  }

  if (data.password !== password) {
    return { user: null, error: 'Invalid email or password.' };
  }

  const user: User = {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
  };
  return { user, error: null };
}

// ============================
// COMPLAINTS
// ============================

export async function dbLoadAllComplaints(): Promise<Complaint[]> {
  if (!supabase) return localLoadComplaints();

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapRowToComplaint);
}

export async function dbLoadUserComplaints(userId: string): Promise<Complaint[]> {
  if (!supabase) return localLoadComplaints().filter(c => c.userId === userId);

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapRowToComplaint);
}

export async function dbGetComplaint(id: string): Promise<Complaint | null> {
  if (!supabase) return localGetComplaint(id);

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapRowToComplaint(data);
}

export async function dbGetUserComplaint(id: string, userId: string): Promise<Complaint | null> {
  if (!supabase) {
    const c = localGetComplaint(id);
    return c && c.userId === userId ? c : null;
  }

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return mapRowToComplaint(data);
}

export async function dbAddComplaint(complaint: Complaint): Promise<void> {
  if (!supabase) {
    localAddComplaint(complaint);
    return;
  }

  await supabase.from('complaints').insert({
    id: complaint.id,
    user_id: complaint.userId,
    title: complaint.title,
    description: complaint.description,
    selected_category: complaint.selectedCategory,
    analysis_category: complaint.analysisCategory,
    final_category: complaint.finalCategory,
    location: complaint.location,
    image_data: complaint.imageData,
    voice_transcript: complaint.voiceTranscript,
    status: complaint.status,
    priority: complaint.priority,
    priority_score: complaint.priorityScore,
    priority_explanation: complaint.priorityExplanation,
    duplicate_status: complaint.duplicateStatus,
    duplicate_of: complaint.duplicateOf,
    support_count: complaint.supportCount,
    created_at: complaint.createdAt,
    updated_at: complaint.updatedAt,
    status_history: JSON.stringify(complaint.statusHistory),
  });
}

export async function dbUpdateComplaint(
  id: string,
  updates: Partial<Complaint>
): Promise<Complaint | null> {
  if (!supabase) return localUpdateComplaint(id, updates);

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.priority !== undefined) row.priority = updates.priority;
  if (updates.priorityScore !== undefined) row.priority_score = updates.priorityScore;
  if (updates.priorityExplanation !== undefined) row.priority_explanation = updates.priorityExplanation;
  if (updates.supportCount !== undefined) row.support_count = updates.supportCount;
  if (updates.duplicateStatus !== undefined) row.duplicate_status = updates.duplicateStatus;
  if (updates.duplicateOf !== undefined) row.duplicate_of = updates.duplicateOf;
  if (updates.finalCategory !== undefined) row.final_category = updates.finalCategory;
  if (updates.statusHistory !== undefined) row.status_history = JSON.stringify(updates.statusHistory);

  const { data, error } = await supabase
    .from('complaints')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return null;
  return mapRowToComplaint(data);
}

export async function dbUpdateComplaintStatus(
  id: string,
  newStatus: Status,
  note?: string
): Promise<Complaint | null> {
  const complaint = await dbGetComplaint(id);
  if (!complaint) return null;

  const event: StatusEvent = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note,
  };

  return dbUpdateComplaint(id, {
    status: newStatus,
    statusHistory: [...complaint.statusHistory, event],
  });
}

export async function dbIncrementSupport(id: string): Promise<void> {
  if (!supabase) {
    localIncrementSupport(id);
    return;
  }

  const complaint = await dbGetComplaint(id);
  if (complaint) {
    await dbUpdateComplaint(id, { supportCount: complaint.supportCount + 1 });
  }
}

export async function dbHasSeedData(): Promise<boolean> {
  if (!supabase) {
    return localStorage.getItem('civisense_seeded') === 'true';
  }

  const { count } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true });

  return (count ?? 0) > 0;
}

export async function dbSeedComplaints(complaints: Complaint[]): Promise<void> {
  if (!supabase) {
    const existing = localLoadComplaints();
    if (existing.length === 0) {
      localStorage.setItem('civisense_complaints', JSON.stringify(complaints));
    }
    localStorage.setItem('civisense_seeded', 'true');
    return;
  }

  // Ensure seed user exists
  const { data: existingSeedUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', 'seed')
    .single();

  if (!existingSeedUser) {
    await supabase.from('users').insert({
      id: 'seed',
      full_name: 'System Seed',
      email: 'seed@civisense.local',
      phone: '0000000000',
      password: 'seed-only',
    });
  }

  // Batch insert complaints
  for (const c of complaints) {
    await dbAddComplaint(c);
  }
}

// ============================
// HELPER: Map Supabase row to Complaint type
// ============================

function mapRowToComplaint(row: Record<string, unknown>): Complaint {
  let statusHistory: StatusEvent[] = [];
  try {
    const raw = row.status_history;
    if (typeof raw === 'string') {
      statusHistory = JSON.parse(raw);
    } else if (Array.isArray(raw)) {
      statusHistory = raw;
    }
  } catch { /* empty */ }

  return {
    id: String(row.id || ''),
    userId: String(row.user_id || ''),
    title: String(row.title || ''),
    description: String(row.description || ''),
    selectedCategory: (row.selected_category as Complaint['selectedCategory']) || null,
    analysisCategory: (String(row.analysis_category || 'Other') as Complaint['analysisCategory']),
    finalCategory: (String(row.final_category || 'Other') as Complaint['finalCategory']),
    location: String(row.location || ''),
    imageData: (row.image_data as string) || null,
    voiceTranscript: (row.voice_transcript as string) || null,
    status: (String(row.status || 'Submitted') as Complaint['status']),
    priority: (String(row.priority || 'Medium') as Complaint['priority']),
    priorityScore: Number(row.priority_score ?? 50),
    priorityExplanation: String(row.priority_explanation || ''),
    duplicateStatus: (String(row.duplicate_status || 'No likely duplicate') as Complaint['duplicateStatus']),
    duplicateOf: (row.duplicate_of as string) || null,
    supportCount: Number(row.support_count ?? 0),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
    statusHistory,
  };
}

// ============================
// LOCAL STORAGE FALLBACK (when Supabase is not configured)
// ============================

const STORAGE_KEY = 'civisense_complaints';
const USERS_KEY = 'civisense_users';

function localLoadComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Complaint[];
  } catch { return []; }
}

function localGetComplaint(id: string): Complaint | null {
  return localLoadComplaints().find(c => c.id === id) || null;
}

function localAddComplaint(complaint: Complaint): void {
  const complaints = localLoadComplaints();
  complaints.unshift(complaint);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

function localUpdateComplaint(id: string, updates: Partial<Complaint>): Complaint | null {
  const complaints = localLoadComplaints();
  const idx = complaints.findIndex(c => c.id === id);
  if (idx === -1) return null;
  complaints[idx] = { ...complaints[idx], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  return complaints[idx];
}

function localIncrementSupport(id: string): void {
  const complaints = localLoadComplaints();
  const c = complaints.find(x => x.id === id);
  if (c) {
    c.supportCount++;
    c.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  }
}

function localSignUp(
  fullName: string, email: string, phone: string, password: string, userId: string
): { user: User | null; error: string | null } {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  if (users.some(u => u.email === email.toLowerCase())) {
    return { user: null, error: 'An account with this email already exists.' };
  }
  users.push({ id: userId, fullName, email: email.toLowerCase(), phone, password });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { user: { id: userId, fullName, email: email.toLowerCase(), phone }, error: null };
}

function localLogin(email: string, password: string): { user: User | null; error: string | null } {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const found = users.find(u => u.email === email.toLowerCase() && u.password === password);
  if (!found) return { user: null, error: 'Invalid email or password.' };
  return { user: { id: found.id, fullName: found.fullName, email: found.email, phone: found.phone }, error: null };
}
