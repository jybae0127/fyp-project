
export default function StatsOverview({ applications }) {
  const totalApplications = applications.length;
  const activeApplications = applications.filter(app =>
    !['Rejection', 'Offer'].includes(app.status)
  ).length;
  // Count applications that had interviews (interviews > 0)
  const hadInterviews = applications.filter(app => app.interviews > 0).length;
  const offerReceived = applications.filter(app => app.status === 'Offer').length;

  const conversionRate = totalApplications > 0 ?
    Math.round((hadInterviews / totalApplications) * 100) : 0;

  const stats = [
    {
      title: 'Total Applications',
      value: totalApplications,
      icon: 'ri-file-list-line',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Applications',
      value: activeApplications,
      icon: 'ri-time-line',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Had Interviews',
      value: hadInterviews,
      icon: 'ri-user-voice-line',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: 'ri-line-chart-line',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
              <i className={`${stat.icon} text-xl ${stat.textColor}`}></i>
            </div>
          </div>
          <div className="mt-4">
            <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-full`}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
