export default function Stats() {
  const stats = [
    { number: "4", label: "Application Stages Tracked", icon: "ri-flow-chart" },
    { number: "100%", label: "Automated Analysis", icon: "ri-robot-line" },
    { number: "24/7", label: "Real-time Sync", icon: "ri-refresh-line" },
    { number: "1-Click", label: "Gmail Integration", icon: "ri-google-line" },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-6">Built for Modern Job Seekers</h2>
        <p className="text-xl text-gray-600 mb-16">Everything you need to track your job search journey.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <i className={`${s.icon} text-3xl text-blue-600 mb-4`}></i>
              <div className="text-4xl font-bold text-gray-900 mb-2">{s.number}</div>
              <div className="text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
