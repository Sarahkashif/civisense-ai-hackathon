import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white text-lg font-bold mb-2">CiviSense AI</h3>
            <p className="text-sm">
              A civic intelligence platform that turns scattered civic complaints into structured, prioritized, actionable city intelligence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/report" className="hover:text-white transition-colors">Report Issue</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Track Complaint</Link></li>
              <li><Link to="/authority" className="hover:text-white transition-colors">Authority Portal</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">About</h4>
            <p className="text-sm">
              CiviSense AI is a hackathon MVP demonstrating how local analysis can help organize and prioritize civic reports without requiring external APIs.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} CiviSense AI. Built for civic good.</p>
        </div>
      </div>
    </footer>
  );
}
