import type { Priority, Status } from '../../types';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    High: 'bg-red-100 text-red-800 border border-red-200',
    Medium: 'bg-amber-100 text-amber-800 border border-amber-200',
    Low: 'bg-green-100 text-green-800 border border-green-200',
  };
  return (
    <span className={`badge ${styles[priority]}`}>
      {priority === 'High' && '▲ '}
      {priority === 'Medium' && '● '}
      {priority === 'Low' && '▽ '}
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    'Submitted': 'bg-blue-100 text-blue-800 border border-blue-200',
    'Under Review': 'bg-purple-100 text-purple-800 border border-purple-200',
    'In Progress': 'bg-amber-100 text-amber-800 border border-amber-200',
    'Resolved': 'bg-green-100 text-green-800 border border-green-200',
  };
  return (
    <span className={`badge ${styles[status]}`}>
      {status}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="badge bg-gray-100 text-gray-700 border border-gray-200">
      {category}
    </span>
  );
}
