import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserComplaint } from '../services/complaintService';
import { useAuth } from '../contexts/AuthContext';
import type { Complaint } from '../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/common/Badges';

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComplaint() {
      if (!id || !user) {
        setLoading(false);
        return;
      }
      try {
        const found = await getUserComplaint(id, user.id);
        setComplaint(found);
      } catch (e) {
        console.error('Failed to fetch complaint:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaint();
  }, [id, user]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading complaint details...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">?</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Not Found</h2>
        <p className="text-gray-600 mb-6">The complaint ID could not be found in the system.</p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Report Submitted Successfully</h1>
        <p className="text-gray-600 text-sm sm:text-base">Your complaint has been recorded and is being reviewed.</p>
      </div>

      <div className="card space-y-0 divide-y divide-gray-100 mb-6 sm:mb-8 !p-0">
        <DetailRow label="Complaint ID">
          <span className="font-mono font-bold text-primary-700 text-base sm:text-lg break-all">{complaint.id}</span>
        </DetailRow>
        <DetailRow label="Title">
          <span className="text-sm text-gray-900 font-medium text-right">{complaint.title}</span>
        </DetailRow>
        <DetailRow label="Category">
          <CategoryBadge category={complaint.finalCategory} />
        </DetailRow>
        <DetailRow label="Priority">
          <PriorityBadge priority={complaint.priority} />
        </DetailRow>
        <DetailRow label="Status">
          <StatusBadge status={complaint.status} />
        </DetailRow>
        <DetailRow label="Location">
          <span className="text-sm text-gray-700 text-right break-words">{complaint.location}</span>
        </DetailRow>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to={`/track?id=${complaint.id}`} className="btn-primary w-full sm:w-auto">
          Track This Complaint
        </Link>
        <Link to="/report" className="btn-secondary w-full sm:w-auto">
          Report Another Issue
        </Link>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3 px-4 sm:px-6 py-3">
      <span className="text-sm font-medium text-gray-500 shrink-0">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}
