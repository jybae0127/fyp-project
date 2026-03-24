export default function About() {
  const painPoints = [
    {
      icon: "ri-mail-unread-line",
      title: "Emails Get Buried",
      description: "Application emails get lost among hundreds of others."
    },
    {
      icon: "ri-file-list-3-line",
      title: "No Central Tracking",
      description: "Spreadsheets get outdated and hard to maintain."
    },
    {
      icon: "ri-question-line",
      title: "Lack of Visibility",
      description: "No clear picture of your application success rate."
    }
  ];

  const stages = [
    {
      num: 1,
      title: "Job Search",
      icon: "ri-search-line",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      items: ["LinkedIn", "Glassdoor", "Indeed"]
    },
    {
      num: 2,
      title: "Apply",
      icon: "ri-send-plane-line",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      items: ["Company A", "Company B", "Company C"]
    },
    {
      num: 3,
      title: "Screening",
      icon: "ri-file-search-line",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      items: ["Resume Review", "ATS Filter", "HR Screen"]
    },
    {
      num: 4,
      title: "Assessments",
      icon: "ri-code-box-line",
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      items: ["Coding Test", "Aptitude Test", "Video Interview"]
    },
    {
      num: 5,
      title: "Interviews",
      icon: "ri-user-voice-line",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      items: ["Round 1", "Round 2", "Final Round"]
    },
    {
      num: 6,
      title: "Decision",
      icon: "ri-checkbox-circle-line",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      items: ["Offer", "Negotiation", "Accept/Reject"]
    }
  ];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">The Problem We Solve</h2>
        </div>

        {/* Process Diagram */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200 mb-8">
          <h3 className="text-center text-lg font-semibold text-gray-700 mb-8">
            <i className="ri-flow-chart mr-2"></i>
            Job Application Process
          </h3>

          {/* Stages Flow */}
          <div className="flex flex-wrap lg:flex-nowrap items-stretch justify-center gap-2">
            {stages.map((stage, i) => (
              <div key={i} className="flex items-center">
                {/* Stage Card */}
                <div className={`${stage.bgColor} ${stage.borderColor} border rounded-xl p-3 transition-all duration-300 w-32 h-52 flex flex-col hover:shadow-xl hover:scale-110 hover:-translate-y-2 hover:z-10 relative cursor-default`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${stage.color} rounded-lg flex items-center justify-center mb-3 mx-auto shadow-sm`}>
                    <i className={`${stage.icon} text-white text-lg`}></i>
                  </div>
                  <div className="text-center mb-2">
                    <span className="text-xs font-medium text-gray-400">Stage {stage.num}</span>
                    <h4 className="font-semibold text-gray-800 text-sm">{stage.title}</h4>
                  </div>
                  <div className="space-y-1 flex-1">
                    {stage.items.map((item, j) => (
                      <div key={j} className="text-xs text-gray-600 bg-white/60 rounded px-1.5 py-0.5 text-center truncate">
                        {item}
                      </div>
                    ))}
                    <div className="text-xs text-gray-400 text-center">...</div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {i < stages.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center px-1">
                    <i className="ri-arrow-right-line text-gray-400 text-3xl"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-12 mt-8">
          <p className="text-2xl text-gray-600 font-semibold">
            <i className="ri-arrow-down-line text-orange-500 mr-2"></i>
            Leading to common problems
          </p>
        </div>

        {/* Pain Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {painPoints.map((point, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-default relative z-10">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <i className={`${point.icon} text-red-600 text-xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{point.title}</h3>
              <p className="text-gray-600 leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
