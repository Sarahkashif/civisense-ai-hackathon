import type { Complaint } from '../types';
import {
  dbLoadAllComplaints,
  dbLoadUserComplaints,
  dbGetComplaint,
  dbGetUserComplaint,
  dbAddComplaint,
  dbUpdateComplaint,
  dbIncrementSupport,
  dbHasSeedData,
  dbSeedComplaints,
} from './databaseService';

/**
 * Storage service — re-exports database service functions.
 * All functions are now async and backed by Supabase (or localStorage fallback).
 */

export async function loadComplaints(): Promise<Complaint[]> {
  return dbLoadAllComplaints();
}

export async function loadUserComplaints(userId: string): Promise<Complaint[]> {
  return dbLoadUserComplaints(userId);
}

export async function getComplaint(id: string): Promise<Complaint | null> {
  return dbGetComplaint(id);
}

export async function getUserComplaint(id: string, userId: string): Promise<Complaint | null> {
  return dbGetUserComplaint(id, userId);
}

export async function addComplaint(complaint: Complaint): Promise<void> {
  return dbAddComplaint(complaint);
}

export async function updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint | null> {
  return dbUpdateComplaint(id, updates);
}

export async function incrementSupport(id: string): Promise<void> {
  return dbIncrementSupport(id);
}

export async function hasBeenSeeded(): Promise<boolean> {
  return dbHasSeedData();
}

export async function seedComplaints(complaints: Complaint[]): Promise<void> {
  return dbSeedComplaints(complaints);
}
