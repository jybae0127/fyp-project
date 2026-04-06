
export default function PerformanceAnalytics({ applications }) {
  const totalApplications = applications.length;

  // Count applications that HAD interviews (interviews > 0), not just current status
  const hadInterviewCount = applications.filter(app => app.interviews > 0).length;
  const offerCount = applications.filter(app => app.status === 'Offer').length;
  const rejectionCount = applications.filter(app => app.status === 'Rejection').length;
  const pendingCount = totalApplications - offerCount - rejectionCount;

  // Count applications with various tests
  const hadCodingTest = applications.filter(app => app.tests?.coding).length;
  const hadVideoInterview = applications.filter(app => app.tests?.video).length;
  const hadAptitudeTest = applications.filter(app => app.tests?.aptitude).length;

  const applicationToInterviewRate = totalApplications > 0 ?
    Math.round((hadInterviewCount / totalApplications) * 100) : 0;
  const interviewToOfferRate = hadInterviewCount > 0 ?
    Math.round((offerCount / hadInterviewCount) * 100) : 0;
  const successRate = totalApplications > 0 ?
    Math.round((offerCount / totalApplications) * 100) : 0;
  // Response = any application that moved past "Applied" stage (no double-counting)
  const gotResponse = applications.filter(app => app.status !== 'Applied').length;
  const responseRate = totalApplications > 0 ?
    Math.round((gotResponse / totalApplications) * 100) : 0;

  // Calculate average response time (days between appliedDate and lastUpdate)
  const responseTimes = [];
  applications.forEach(app => {
    if (app.appliedDate && app.lastUpdate && app.appliedDate !== app.lastUpdate) {
      const applied = new Date(app.appliedDate);
      const updated = new Date(app.lastUpdate);
      const diffDays = Math.round((updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays < 365) {
        responseTimes.push(diffDays);
      }
    }
  });
  const avgResponseTime = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
    : 'N/A';

  // Calculate weekly data from actual applications
  const getWeekNumber = (date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const weeklyStats = {};

  applications.forEach(app => {
    if (app.appliedDate) {
      const date = new Date(app.appliedDate);
      const weekKey = `${date.getFullYear()}-W${getWeekNumber(date).toString().padStart(2, '0')}`;

      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = { applications: 0, interviews: 0, offers: 0, rejections: 0 };
      }

      weeklyStats[weekKey].applications++;
      if (app.interviews > 0) weeklyStats[weekKey].interviews++;
      if (app.status === 'Offer') weeklyStats[weekKey].offers++;
      if (app.status === 'Rejection') weeklyStats[weekKey].rejections++;
    }
  });

  // Get last 4 weeks of data
  const sortedWeeks = Object.keys(weeklyStats).sort().slice(-4);
  const weeklyData = sortedWeeks.map((week, index) => ({
    week: `Week ${index + 1}`,
    ...weeklyStats[week]
  }));

  const metrics = [
    {
      title: 'Response Rate',
      value: `${responseRate}%`,
      description: `${gotResponse} responded out of ${totalApplications}`,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Avg Response Time',
      value: avgResponseTime === 'N/A' ? 'N/A' : `${avgResponseTime} days`,
      description: 'From application to first update',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Application → Interview',
      value: `${applicationToInterviewRate}%`,
      description: `${hadInterviewCount} out of ${totalApplications} got interviews`,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Interview → Offer',
      value: `${interviewToOfferRate}%`,
      description: `${offerCount} offers from ${hadInterviewCount} interviewed`,
      color: 'from-green-500 to-green-600'
    }
  ];

  // Generate dynamic insights based on actual data
  const insights = [];

  if (responseRate < 30 && totalApplications > 5) {
    insights.push({
      type: 'tip',
      title: 'Low Response Rate',
      message: `Only ${responseRate}% of your applications got a response. Consider tailoring your CV more specifically to each role.`
    });
  }

  if (hadInterviewCount > 0 && interviewToOfferRate > 30) {
    insights.push({
      type: 'strength',
      title: 'Strong Interview Performance',
      message: `You convert ${interviewToOfferRate}% of interviews to offers. Your interview skills are above average!`
    });
  } else if (hadInterviewCount > 2 && interviewToOfferRate === 0) {
    insights.push({
      type: 'tip',
      title: 'Interview Conversion',
      message: `You've had ${hadInterviewCount} interviews but no offers yet. Consider practicing common interview questions.`
    });
  }

  if (pendingCount > 3) {
    insights.push({
      type: 'reminder',
      title: 'Pending Applications',
      message: `You have ${pendingCount} applications still pending. Consider following up on older ones.`
    });
  }

  if (rejectionCount > 0 && totalApplications > 0) {
    const rejectionRate = Math.round((rejectionCount / totalApplications) * 100);
    if (rejectionRate < 50) {
      insights.push({
        type: 'strength',
        title: 'Good Application Quality',
        message: `Your rejection rate is ${rejectionRate}%, which is below average. Keep up the targeted applications!`
      });
    }
  }

  // Default insight if none generated
  if (insights.length === 0) {
    insights.push({
      type: 'tip',
      title: 'Keep Applying',
      message: `You have ${totalApplications} applications tracked. Continue applying to increase your chances!`
    });
  }

  const insightStyles = {
    tip: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ri-lightbulb-line', iconColor: 'text-blue-600', titleColor: 'text-blue-900', textColor: 'text-blue-700' },
    strength: { bg: 'bg-green-50', border: 'border-green-200', icon: 'ri-trophy-line', iconColor: 'text-green-600', titleColor: 'text-green-900', textColor: 'text-green-700' },
    reminder: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'ri-time-line', iconColor: 'text-purple-600', titleColor: 'text-purple-900', textColor: 'text-purple-700' }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
        <div className="text-sm text-gray-500">
          {totalApplications} total applications
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
            </div>
            <p className="text-xs text-gray-500">{metric.description}</p>
            <div className={`mt-3 h-1 bg-gradient-to-r ${metric.color} rounded-full`}></div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
        <div className="space-y-4">
          {insights.slice(0, 3).map((insight, index) => {
            const style = insightStyles[insight.type];
            return (
              <div key={index} className={`p-4 rounded-lg ${style.bg} border ${style.border}`}>
                <div className="flex items-start space-x-3">
                  <i className={`${style.icon} ${style.iconColor} text-lg mt-0.5`}></i>
                  <div>
                    <h4 className={`text-sm font-semibold ${style.titleColor}`}>{insight.title}</h4>
                    <p className={`text-sm ${style.textColor} mt-1`}>{insight.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
