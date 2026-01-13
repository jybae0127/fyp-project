export default function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Connect Your Gmail",
      description: "Securely link your Gmail account with one click using OAuth 2.0. We only read job-related emails.",
      icon: "ri-google-line",
      color: "bg-blue-500"
    },
    {
      step: "2",
      title: "AI Analyzes Emails",
      description: "Our AI automatically scans your inbox, identifies job application emails, and extracts company and stage information.",
      icon: "ri-robot-line",
      color: "bg-purple-500"
    },
    {
      step: "3",
      title: "View Your Dashboard",
      description: "See all your applications in one place with visual timelines, funnel charts, and performance analytics.",
      icon: "ri-dashboard-line",
      color: "bg-green-500"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get started in under a minute. No manual data entry required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <div key={i} className="relative h-full">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gray-300"></div>
              )}

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center relative h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                {/* Step number */}
                <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <i className={`${item.icon} text-white text-2xl`}></i>
                </div>

                {/* Step badge */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">{item.step}</span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
