import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              Turn Civic Problems Into <span className="text-accent-400">Action</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-100 mb-8 leading-relaxed">
              CiviSense AI helps citizens report public issues — from potholes to sewage overflows — and gives authorities the intelligence to act on what matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/report" className="btn-primary bg-accent-600 hover:bg-accent-700 text-white text-lg px-8 py-3 focus:ring-accent-500">
                Report an Issue
              </Link>
              <Link to="/track" className="btn-primary bg-accent-600 hover:bg-accent-700 text-white text-lg px-8 py-3 focus:ring-accent-500">
                Track My Complaint
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Three simple steps to turn your civic concern into a tracked, prioritized report.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Report',
                desc: 'Describe the issue in your own words. Add a photo, use voice input, and specify the location.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                step: '2',
                title: 'Analyze',
                desc: 'The system categorizes your report, calculates priority, and checks for similar existing complaints.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                ),
              },
              {
                step: '3',
                title: 'Act',
                desc: 'Authorities review prioritized reports, update status, and citizens can track progress in real time.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="card text-center">
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Step {item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Key Capabilities</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Built for citizens, designed for authorities, powered by transparent local analysis.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Multi-Input Reporting',
                desc: 'Report via text in any language, browser voice input, photo upload, and location — all in one form.',
                icon: '✍',
              },
              {
                title: 'Intelligent Categorization',
                desc: 'Automatic category suggestion using keyword analysis across Road, Water, Drainage, Lighting, and more.',
                icon: '🏷',
              },
              {
                title: 'Priority Scoring',
                desc: 'Transparent weighted scoring based on severity, urgency keywords, repeated reports, and community support.',
                icon: '📊',
              },
              {
                title: 'Duplicate Detection',
                desc: 'Identifies similar existing reports so citizens can support them or submit a separate complaint.',
                icon: '🔍',
              },
              {
                title: 'Civic Hotspot Insights',
                desc: 'Authorities see which locations have the most repeated complaints and highest priority issues.',
                icon: '📍',
              },
              {
                title: 'Complaint Tracking',
                desc: 'Every complaint gets a unique ID. Citizens track status changes through a clear timeline view.',
                icon: '📋',
              },
            ].map((cap) => (
              <div key={cap.title} className="card hover:shadow-md transition-shadow">
                <div className="text-2xl mb-3">{cap.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{cap.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make Your City Better?</h2>
          <p className="text-primary-100 mb-8">Report a civic issue now and see the complete analysis in action.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/report" className="btn-primary bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-3">
              Report an Issue
            </Link>
            <Link to="/authority" className="btn-primary bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-3">
              Authority Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
