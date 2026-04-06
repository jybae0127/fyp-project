const BOTTLENECKS = {
  ghosted: {
    id: 'ghosted',
    label: 'No Response After Applying',
    icon: 'ri-mail-close-line',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
    titleColor: 'text-blue-800',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    statColor: 'text-blue-600',
    tagline: 'CVs are filtered before a human sees them — alignment and keywords matter.',
    tips: [
      'Get AI feedback across 15+ CV categories on VMock',
      'Use faculty-specific CV templates',
      'Score your CV against each job description',
    ],
    cedarsLabel: 'Improve CV on VMock',
    cedarsUrl: 'https://www.cedars.hku.hk/careers/vmock',
    cedarsIcon: 'ri-file-edit-line',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
  },
  stuckAtAssessment: {
    id: 'stuckAtAssessment',
    label: 'Failing Assessments',
    icon: 'ri-survey-line',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50',
    titleColor: 'text-orange-800',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    statColor: 'text-orange-600',
    tagline: '60–80% of candidates fail at this stage — practice is the fix.',
    tips: [
      'Practice 100+ ability and game-based assessments',
      'Focus on numerical and verbal reasoning',
      'Time yourself under exam conditions',
    ],
    cedarsLabel: 'Practice Aptitude Tests',
    cedarsUrl: 'https://www.cedars.hku.hk/careers/aptitude-tests',
    cedarsIcon: 'ri-brain-line',
    btnColor: 'bg-orange-600 hover:bg-orange-700',
  },
  stuckAtVideo: {
    id: 'stuckAtVideo',
    label: 'Stuck at Video Interview',
    icon: 'ri-vidicon-line',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50',
    titleColor: 'text-purple-800',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    statColor: 'text-purple-600',
    tagline: 'Body language and eye contact matter as much as your answers.',
    tips: [
      'Use VMock AI scoring on eye contact, body language, and speech',
      'Practice with industry-specific question libraries',
      'Record and review before submitting',
    ],
    cedarsLabel: 'Practice Video Interviews',
    cedarsUrl: 'https://www.cedars.hku.hk/careers/vmock',
    cedarsIcon: 'ri-camera-line',
    btnColor: 'bg-purple-600 hover:bg-purple-700',
  },
  stuckAtInterview: {
    id: 'stuckAtInterview',
    label: 'Not Converting Interviews',
    icon: 'ri-user-voice-line',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50',
    titleColor: 'text-purple-800',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    statColor: 'text-purple-600',
    tagline: 'Know what employers ask — prepare targeted answers.',
    tips: [
      'Browse HKU alumni interview questions by company',
      'Prepare STAR answers for specific roles',
      'Contribute your experience to unlock full access',
    ],
    cedarsLabel: 'Browse Interview Questions',
    cedarsUrl: 'https://www.cedars.hku.hk/careers/droppicker-career-library',
    cedarsIcon: 'ri-question-answer-line',
    btnColor: 'bg-purple-600 hover:bg-purple-700',
  },
};

export default function BottleneckInsights({ applications }) {
  if (!applications || applications.length < 3) return null;

  const counts = {
    ghosted: applications.filter(app => app.status === 'Applied').length,
    stuckAtAssessment: applications.filter(
      app => (app.tests?.aptitude || app.tests?.coding || app.tests?.simulation) &&
        app.interviews === 0 && app.status !== 'Offer' && app.status !== 'Rejection'
    ).length,
    stuckAtVideo: applications.filter(app => app.tests?.video && app.interviews === 0).length,
    stuckAtInterview: applications.filter(app => app.interviews > 0 && app.status !== 'Offer').length,
  };

  const sorted = Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  if (!sorted.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Where You're Falling Off</h2>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800">You're Progressing Well</p>
            <p className="text-sm text-green-700 mt-0.5">No major drop-off detected. Keep it up!</p>
          </div>
          <a href="https://www.cedars.hku.hk/careers/resources" target="_blank" rel="noopener noreferrer"
            className="ml-4 flex-shrink-0 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
            Career Resources
          </a>
        </div>
      </div>
    );
  }

  const [[primaryId, primaryCount], ...secondaryEntries] = sorted;
  const primary = BOTTLENECKS[primaryId];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center mb-5">
        <div className={`w-10 h-10 rounded-xl ${primary.bgColor} flex items-center justify-center mr-3`}>
          <i className={`${primary.icon} text-xl ${primary.statColor}`}></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Where You're Falling Off</h2>
          <p className="text-sm text-gray-500">Powered by HKU CEDARS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary card */}
        <div className={`${primary.bgColor} border-2 ${primary.borderColor} rounded-xl p-4`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center mb-1">
                <i className={`${primary.icon} ${primary.statColor} mr-2`}></i>
                <span className={`font-bold ${primary.titleColor}`}>{primary.label}</span>
              </div>
              <p className={`text-xs font-medium ${primary.statColor}`}>
                {primaryCount} of {applications.length} stalled here
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${primary.badgeBg} ${primary.badgeText}`}>
              Primary
            </span>
          </div>
          <p className={`text-xs ${primary.titleColor} italic mb-3 border-l-4 ${primary.borderColor} pl-2`}>
            {primary.tagline}
          </p>
          <ul className="space-y-1.5 mb-4">
            {primary.tips.map((tip, i) => (
              <li key={i} className="flex items-start text-xs">
                <i className={`ri-check-line ${primary.statColor} mr-1.5 mt-0.5 flex-shrink-0`}></i>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
          <a href={primary.cedarsUrl} target="_blank" rel="noopener noreferrer"
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${primary.btnColor}`}>
            <i className={`${primary.cedarsIcon} mr-1.5`}></i>
            {primary.cedarsLabel}
            <i className="ri-external-link-line ml-1.5 opacity-80"></i>
          </a>
        </div>

        {/* Secondary cards */}
        {secondaryEntries.length > 0 && secondaryEntries.slice(0, 1).map(([id, count]) => {
          const b = BOTTLENECKS[id];
          return (
            <div key={id} className={`${b.bgColor} border-2 ${b.borderColor} rounded-xl p-4`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center mb-1">
                    <i className={`${b.icon} ${b.statColor} mr-2`}></i>
                    <span className={`font-bold ${b.titleColor}`}>{b.label}</span>
                  </div>
                  <p className={`text-xs font-medium ${b.statColor}`}>
                    {count} of {applications.length} stalled here
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.badgeBg} ${b.badgeText}`}>
                  Watch This
                </span>
              </div>
              <p className={`text-xs ${b.titleColor} italic mb-3 border-l-4 ${b.borderColor} pl-2`}>
                {b.tagline}
              </p>
              <ul className="space-y-1.5 mb-4">
                {b.tips.map((tip, i) => (
                  <li key={i} className="flex items-start text-xs">
                    <i className={`ri-check-line ${b.statColor} mr-1.5 mt-0.5 flex-shrink-0`}></i>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
              <a href={b.cedarsUrl} target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${b.btnColor}`}>
                <i className={`${b.cedarsIcon} mr-1.5`}></i>
                {b.cedarsLabel}
                <i className="ri-external-link-line ml-1.5 opacity-80"></i>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
