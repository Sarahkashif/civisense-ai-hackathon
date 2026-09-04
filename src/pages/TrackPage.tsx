import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUserComplaint } from '../services/complaintService';
import { useAuth } from '../contexts/AuthContext';
import type { Complaint } from '../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/common/Badges';

export default function TrackPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('id') || '');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get('id');
    if (prefill && user) {
      fetchComplaint(prefill);
    }
  }, [searchParams, user]);

  const fetchComplaint = async (id: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const found = await getUserComplaint(id.trim().toUpperCase(), user.id);
      setComplaint(found);
      setSearched(true);
    } catch (e) {
      console.error('Failed to fetch complaint:', e);
      setComplaint(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;
    fetchComplaint(trimmed);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Track Your Complaint</h1>
      <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Enter your complaint ID to see its current status and history.</p>

      {/* Search */}
      <div className="flex gap-2 sm:gap-3 mb-8">
        <input
          type="text"
          className="input-field flex-1 min-w-0"
          placeholder="e.g., CS-2026-1001"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          inputMode="text"
          autoCapitalize="characters"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary shrink-0 px-4 sm:px-6">
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            <>
              <span className="hidden sm:inline">Search</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {searched && !complaint && !loading && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Complaint Found</h3>
          <p className="text-gray-600 text-sm">
            {query.trim()
              ? <>No complaint matches the ID "<span className="break-all">{query}</span>", or it does not belong to your account. Please check the ID and try again.</>
              : <>Please enter a complaint ID to search.</>
            }
          </p>
          <p className="text-gray-400 text-xs mt-2">
            The format is typically CS-YYYY-XXXX. You can only track your own complaints.
          </p>
        </div>
      )}

      {complaint && (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Card */}
          <div className="card">
            <div className="mb-4">
              <span className="font-mono text-xs sm:text-sm text-primary-600 font-semibold block mb-1 break-all">{complaint.id}</span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{complaint.title}</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Category</span>
                <div className="mt-1"><CategoryBadge category={complaint.finalCategory} /></div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Priority</span>
                <div className="mt-1"><PriorityBadge priority={complaint.priority} /></div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Status</span>
                <div className="mt-1"><StatusBadge status={complaint.status} /></div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Support Count</span>
                <p className="mt-1 text-gray-700 font-semibold">{complaint.supportCount}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">Location</span>
                <p className="mt-1 text-gray-700 break-words">{complaint.location}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">Submitted</span>
                <p className="mt-1 text-gray-700">{new Date(complaint.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {complaint.duplicateStatus !== 'No likely duplicate' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                {complaint.duplicateStatus}
                {complaint.duplicateOf && (
                  <span className="break-all"> — related to {complaint.duplicateOf}</span>
                )}
              </div>
            )}
          </div>

          {/* Priority Explanation */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Priority Analysis</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{complaint.priorityExplanation}</p>
          </div>

          {/* Status Timeline */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Timeline</h3>
            <div className="space-y-0">
              {complaint.statusHistory.map((event, i) => (
                <div key={i} className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${
                      i === complaint.statusHistory.length - 1 ? 'bg-primary-600' : 'bg-gray-300'
                    }`} />
                    {i < complaint.statusHistory.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="pb-5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={event.status} />
                      <span className="text-xs text-gray-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {event.note && (
                      <p className="text-sm text-gray-600 mt-1 break-words">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          {complaint.imageData && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Attached Image</h3>
              <img src={complaint.imageData} alt="Complaint" className="w-full max-h-48 object-cover rounded-lg border border-gray-200" />
            </div>
          )}

          {/* Voice Transcript */}
          {complaint.voiceTranscript && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Voice Transcript</h3>
              <p className="text-sm text-gray-600 italic break-words">{complaint.voiceTranscript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
