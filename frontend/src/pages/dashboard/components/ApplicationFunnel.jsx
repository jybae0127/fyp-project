import { useState } from 'react';

export default function ApplicationFunnel({ applications }) {
  const [toastVisible, setToastVisible] = useState(false);

  const shareOnLinkedIn = () => {
    const total = applications.length;
    const interviews = applications.filter(a => a.interviews > 0).length;
    const offers = applications.filter(a => a.status === 'Offer').length;
    const year = new Date().getFullYear();
    const text = `🚀 My Job Search Journey ${year}\n\n📋 Applications: ${total}\n🤝 Interviews: ${interviews}\n🎉 Offers: ${offers}\n\nTracked with JobTracker AI #JobSearch #Hiring`;
    navigator.clipboard.writeText(text);
    window.open('https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fyouraijobtracker.vercel.app', '_blank');
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };
  const total = applications.length;

  // Calculate funnel stages (cumulative - each stage includes those who passed through)
  const applied = total;
  const hadAssessment = applications.filter(
    app => app.tests?.aptitude || app.tests?.simulation || app.tests?.coding || app.tests?.video
  ).length;
  const hadInterview = applications.filter(app => app.interviews > 0).length;
  const gotOffer = applications.filter(app => app.status === 'Offer').length;
  const rejected = applications.filter(app => app.status === 'Rejection').length;

  // Calculate conversion rates
  const assessmentRate = applied > 0 ? Math.round((hadAssessment / applied) * 100) : 0;
  const interviewRate = applied > 0 ? Math.round((hadInterview / applied) * 100) : 0;
  const offerRate = applied > 0 ? Math.round((gotOffer / applied) * 100) : 0;

  // Stage-to-stage conversion
  const assessmentToInterview = hadAssessment > 0 ? Math.round((hadInterview / hadAssessment) * 100) : 0;
  const interviewToOffer = hadInterview > 0 ? Math.round((gotOffer / hadInterview) * 100) : 0;

  const funnelStages = [
    {
      name: 'Applied',
      count: applied,
      rate: 100,
      color: 'bg-blue-500',
      width: 'w-full',
      icon: 'ri-send-plane-line'
    },
    {
      name: 'Assessment',
      count: hadAssessment,
      rate: assessmentRate,
      color: 'bg-orange-500',
      width: applied > 0 ? `w-[${Math.max(assessmentRate, 20)}%]` : 'w-[20%]',
      icon: 'ri-file-list-line'
    },
    {
      name: 'Interview',
      count: hadInterview,
      rate: interviewRate,
      color: 'bg-purple-500',
      width: applied > 0 ? `w-[${Math.max(interviewRate, 15)}%]` : 'w-[15%]',
      icon: 'ri-user-voice-line'
    },
    {
      name: 'Offer',
      count: gotOffer,
      rate: offerRate,
      color: 'bg-green-500',
      width: applied > 0 ? `w-[${Math.max(offerRate, 10)}%]` : 'w-[10%]',
      icon: 'ri-gift-line'
    }
  ];

  // Calculate width percentages for visual funnel
  const getWidthStyle = (rate) => {
    const minWidth = 15;
    const width = Math.max(rate, minWidth);
    return { width: `${width}%` };
  };

  return (
    <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Application Funnel</h2>
        <div className="flex items-center text-sm text-gray-500">
          <i className="ri-filter-3-line mr-1"></i>
          {total} applications
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="ri-filter-3-line text-4xl text-gray-300 mb-2"></i>
          <p>No applications to display</p>
        </div>
      ) : (
        <>
          {/* Visual Funnel */}
          <div className="space-y-3 mb-6">
            {funnelStages.map((stage, index) => (
              <div key={stage.name} className="relative">
                <div className="flex items-center gap-3">
                  {/* Label on the left */}
                  <div className="w-24 flex-shrink-0 flex items-center justify-end space-x-1.5 text-gray-600">
                    <i className={`${stage.icon} text-sm`}></i>
                    <span className="text-sm font-medium">{stage.name}</span>
                  </div>
                  {/* Funnel bar */}
                  <div
                    className={`${stage.color} h-10 rounded-lg flex items-center justify-end px-3 transition-all duration-500`}
                    style={getWidthStyle(stage.rate)}
                  >
                    <div className="text-white font-bold text-sm">
                      {stage.count}
                    </div>
                  </div>
                </div>

                {/* Connector between stages */}
                {index < funnelStages.length - 1 && (
                  <div className="flex my-0.5">
                    <div className="w-24 flex-shrink-0"></div>
                    <i className="ri-arrow-down-s-line text-gray-300 text-sm ml-2"></i>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* LinkedIn Share — always shown */}
          {total > 0 && (
            <div className={`mb-4 p-3 rounded-xl flex items-center justify-between ${gotOffer > 0 ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div>
                <p className={`text-sm font-semibold ${gotOffer > 0 ? 'text-green-800' : 'text-blue-800'}`}>
                  {gotOffer > 0 ? 'Proud of your progress? 🎉' : 'Share your job search journey'}
                </p>
                <p className={`text-xs mt-0.5 ${gotOffer > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                  {gotOffer > 0 ? 'Share your job search journey with your network.' : 'Let your network know you\'re on the hunt.'}
                </p>
              </div>
              <button
                onClick={shareOnLinkedIn}
                className="ml-4 flex-shrink-0 flex items-center px-3 py-1.5 bg-[#0077B5] text-white text-xs font-semibold rounded-lg hover:bg-[#005f91] transition-colors cursor-pointer"
              >
                <i className="ri-linkedin-fill mr-1.5 text-sm"></i>
                Share
              </button>
              {toastVisible && (
                <div className="absolute right-6 bottom-6 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                  Stats copied! LinkedIn post opened.
                </div>
              )}
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <i className="ri-close-circle-line text-red-500"></i>
                <span className="text-sm text-gray-600">Rejected</span>
              </div>
              <div className="mt-1">
                <span className="text-xl font-bold text-red-600">{rejected}</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({applied > 0 ? Math.round((rejected / applied) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <i className="ri-time-line text-gray-500"></i>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="mt-1">
                <span className="text-xl font-bold text-gray-700">
                  {applied - gotOffer - rejected}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({applied > 0 ? Math.round(((applied - gotOffer - rejected) / applied) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Conversion Insight */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <i className="ri-bar-chart-box-line text-blue-600 mt-0.5"></i>
              <div className="text-sm">
                <span className="font-medium text-gray-800">Conversion: </span>
                <span className="text-gray-600">
                  {hadInterview > 0 ? (
                    <>
                      {interviewToOffer}% of interviews led to offers
                      {interviewToOffer >= 30 && <span className="text-green-600 ml-1">(Above avg!)</span>}
                    </>
                  ) : hadAssessment > 0 ? (
                    `${assessmentToInterview}% of assessments led to interviews`
                  ) : (
                    'Apply to more positions to see conversion stats'
                  )}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
