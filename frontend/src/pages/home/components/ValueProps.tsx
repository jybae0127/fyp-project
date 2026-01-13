export default function ValueProps() {
  const businessPoints = [
    "Eliminates manual spreadsheet tracking",
    "Provides real-time application status updates",
    "Identifies patterns to improve success rate",
    "Saves hours of inbox searching"
  ];

  const technicalPoints = [
    "OAuth 2.0 secure Gmail authentication",
    "GPT-4 powered email classification",
    "Real-time data sync and caching",
    "Privacy-first: emails processed, not stored"
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Why JobTracker AI?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built with both user experience and technical excellence in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <i className="ri-briefcase-line text-blue-600 text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Business Value</h3>
            <ul className="space-y-4">
              {businessPoints.map((point, i) => (
                <li key={i} className="flex items-start">
                  <i className="ri-check-line text-blue-600 text-xl mr-3 mt-0.5"></i>
                  <span className="text-gray-700 text-lg">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-10 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <i className="ri-code-s-slash-line text-purple-600 text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Technical Excellence</h3>
            <ul className="space-y-4">
              {technicalPoints.map((point, i) => (
                <li key={i} className="flex items-start">
                  <i className="ri-check-line text-purple-600 text-xl mr-3 mt-0.5"></i>
                  <span className="text-gray-700 text-lg">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
