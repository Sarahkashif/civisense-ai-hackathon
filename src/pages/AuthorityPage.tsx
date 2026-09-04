import { useState, useMemo } from 'react';
import type { Complaint, Category, Priority, Status } from '../types';
import { CATEGORIES, STATUSES } from '../types';
import { useComplaints } from '../hooks/useComplaints';
import { updateComplaintStatus } from '../services/complaintService';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/common/Badges';
import Modal from '../components/common/Modal';

export default function AuthorityPage() {
  const { complaints, refresh, loading } = useComplaints();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('');
  const [priFilter, setPriFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'priority'>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => complaints.find((c) => c.id === selectedId) || null,
    [complaints, selectedId]
  );

  // Overview metrics
  const metrics = useMemo(() => ({
    total: complaints.length,
    high: complaints.filter((c) => c.priority === 'High').length,
    underReview: complaints.filter((c) => c.status === 'Under Review').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  }), [complaints]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...complaints];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
      );
    }
    if (catFilter) list = list.filter((c) => c.finalCategory === catFilter);
    if (priFilter) list = list.filter((c) => c.priority === priFilter);
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      const priOrder: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
      list.sort((a, b) => priOrder[a.priority] - priOrder[b.priority]);
    }

    return list;
  }, [complaints, search, catFilter, priFilter, statusFilter, sortBy]);

  // Hotspot insights
  const hotspots = useMemo(() => {
    const groups: Record<string, Complaint[]> = {};
    for (const c of complaints) {
      const key = c.location.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    return Object.entries(groups)
      .filter(([, arr]) => arr.length > 1)
      .map(([loc, arr]) => ({
        location: arr[0].location,
        count: arr.length,
        highestPriority: arr.some((c) => c.priority === 'High')
          ? 'High'
          : arr.some((c) => c.priority === 'Medium')
          ? 'Medium'
          : ('Low' as Priority),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [complaints]);

  const handleStatusUpdate = async (id: string, newStatus: Status) => {
    await updateComplaintStatus(id, newStatus);
    refresh();
  };

  const statusOptions: Status[] = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Authority Dashboard</h1>
      <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Manage, prioritize, and track civic complaints across the city.</p>

      {/* Metrics */}
      {loading && (
        <div className="text-center py-8">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading complaint data...</p>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Reports" value={metrics.total} color="bg-primary-600" />
        <MetricCard label="High Priority" value={metrics.high} color="bg-red-600" />
        <MetricCard label="Under Review" value={metrics.underReview} color="bg-purple-600" />
        <MetricCard label="Resolved" value={metrics.resolved} color="bg-green-600" />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            className="input-field"
            placeholder="Search by ID, title, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input-field" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field" value={priFilter} onChange={(e) => setPriFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'priority')}>
            <option value="newest">Sort: Newest First</option>
            <option value="priority">Sort: Priority (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden mb-8 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="text-3xl mb-2">📭</div>
                    No complaints match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="px-4 py-3 font-mono text-primary-600 font-medium whitespace-nowrap">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{c.title}</td>
                    <td className="px-4 py-3 hidden md:table-cell"><CategoryBadge category={c.finalCategory} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell max-w-[150px] truncate">{c.location}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Showing {filtered.length} of {complaints.length} complaints
          </div>
        )}
      </div>

      {/* Hotspot Insights */}
      {hotspots.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Civic Hotspot Insights</h2>
          <p className="text-sm text-gray-600 mb-4">Locations with repeated complaints, sorted by frequency and severity.</p>
          <div className="space-y-3">
            {hotspots.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-6">{i + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{h.location}</p>
                    <p className="text-xs text-gray-500">{h.count} reports</p>
                  </div>
                </div>
                <PriorityBadge priority={h.highestPriority} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected?.title || 'Complaint Details'}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-primary-600 font-semibold">{selected.id}</span>
              <CategoryBadge category={selected.finalCategory} />
              <PriorityBadge priority={selected.priority} />
              <StatusBadge status={selected.status} />
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h4>
              <p className="text-sm text-gray-700">{selected.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Location</span>
                <p className="text-gray-700 font-medium">{selected.location}</p>
              </div>
              <div>
                <span className="text-gray-500">Submitted</span>
                <p className="text-gray-700 font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Priority Score</span>
                <p className="text-gray-700 font-medium">{selected.priorityScore}/100</p>
              </div>
              <div>
                <span className="text-gray-500">Support Count</span>
                <p className="text-gray-700 font-medium">{selected.supportCount}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Priority Explanation</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selected.priorityExplanation}</p>
            </div>

            {selected.duplicateStatus !== 'No likely duplicate' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                {selected.duplicateStatus}
                {selected.duplicateOf && <span> — related to {selected.duplicateOf}</span>}
              </div>
            )}

            {selected.imageData && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Attached Image</h4>
                <img src={selected.imageData} alt="Complaint" className="max-h-48 rounded-lg border border-gray-200 object-cover" />
              </div>
            )}

            {selected.voiceTranscript && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Voice Transcript</h4>
                <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">{selected.voiceTranscript}</p>
              </div>
            )}

            {/* Status Timeline */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Status Timeline</h4>
              <div className="space-y-0">
                {selected.statusHistory.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        i === selected.statusHistory.length - 1 ? 'bg-primary-600' : 'bg-gray-300'
                      }`} />
                      {i < selected.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 my-0.5" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={event.status} />
                        <span className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update Controls */}
            {selected.status !== 'Resolved' && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {statusOptions
                    .filter((s) => s !== selected.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(selected.id, s)}
                        className="btn-secondary text-sm px-3 py-1.5"
                      >
                        Move to {s}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card flex items-center gap-3 sm:gap-4 !p-3 sm:!p-6">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-lg flex items-center justify-center text-white text-lg sm:text-xl font-bold shrink-0`}>
        {value}
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}
