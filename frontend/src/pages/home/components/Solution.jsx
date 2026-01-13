export default function Solution() {
  const solutions = [
    {
      icon: "ri-mail-check-line",
      title: "Smart Email Detection",
      description: "Automatically identifies job application emails from companies, recruiters, and ATS platforms like Workday, Lever, and Greenhouse."
    },
    {
      icon: "ri-pie-chart-line",
      title: "Stage Classification",
      description: "AI categorizes each email into stages: Application Submitted, Assessment, Interview, Offer, or Rejection."
    },
    {
      icon: "ri-line-chart-line",
      title: "Visual Analytics",
      description: "Interactive dashboards with Sankey diagrams, funnel charts, and timeline views to track your progress."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">Our Solution</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            JobTracker AI connects to your Gmail and does the heavy lifting — so you can focus on landing your dream job.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {solutions.map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <i className={`${item.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{item.title}</h3>
              <p className="text-blue-100 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
