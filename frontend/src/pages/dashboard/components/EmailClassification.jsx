
export default function EmailClassification({ applications }) {
  const emailStats = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + app.emails;
    return acc;
  }, {});

  const totalEmails = Object.values(emailStats).reduce((sum, count) => sum + count, 0);

  const classificationData = [
    {
      category: 'Application Confirmations',
      count: emailStats['Applied'] || 0,
      percentage: totalEmails > 0 ? Math.round(((emailStats['Applied'] || 0) / totalEmails) * 100) : 0,
      color: 'bg-blue-500',
      icon: 'ri-send-plane-line'
    },
    {
      category: 'Online Assessments',
      count: emailStats['Assessment'] || 0,
      percentage: totalEmails > 0 ? Math.round(((emailStats['Assessment'] || 0) / totalEmails) * 100) : 0,
      color: 'bg-orange-500',
      icon: 'ri-file-list-line'
    },
    {
      category: 'Coding Test Invites',
      count: emailStats['Coding Test'] || 0,
      percentage: totalEmails > 0 ? Math.round(((emailStats['Coding Test'] || 0) / totalEmails) * 100) : 0,
      color: 'bg-yellow-500',
      icon: 'ri-code-line'
    },
    {
      category: 'Video Interviews',
      count: emailStats['Video Interview'] || 0,
      percentage: totalEmails > 0 ? Math.round(((emailStats['Video Interview'] || 0) / totalEmails) * 100) : 0,
      color: 'bg-indigo-500',
      icon: 'ri-video-line'
    },
    {
      category: 'Interview Invitations',
      count: emailStats['Interview'] || 0,
      percentage: totalEmails > 0 ? Math.round(((emailStats['Interview'] || 0) / totalEmails) * 100) : 0,
      color: 'bg-purple-500',
      icon: 'ri-user-voice-line'
    },
    {
      category: 'Job Offers',
      count: emailStats['Offer'] || 0,
      percentage: totalEmails > 0 ? Math.round(((emailStats['Offer'] || 0) / totalEmails) * 100) : 0,
      color: 'bg-green-500',
      icon: 'ri-gift-line'
    },
    {
      category: 'Rejections',
      count: emailStats['Rejection'] || 0,
      percentage: totalEmails > 0 ? Math.round(((emailStats['Rejection'] || 0) / totalEmails) * 100) : 0,
      color: 'bg-red-500',
      icon: 'ri-close-circle-line'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Email Classification</h2>
        <div className="flex items-center text-sm text-gray-500">
          <i className="ri-mail-line mr-1"></i>
          {totalEmails} total emails
        </div>
      </div>

      <div className="space-y-4">
        {classificationData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                  <i className={`${item.icon} text-white text-sm`}></i>
                </div>
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                <span className="text-xs text-gray-500 ml-1">({item.percentage}%)</span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <i className="ri-robot-line text-white"></i>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI Classification</h3>
            <p className="text-xs text-gray-600">Emails are automatically categorized using advanced AI pattern recognition</p>
          </div>
        </div>
      </div>
    </div>
  );
}
