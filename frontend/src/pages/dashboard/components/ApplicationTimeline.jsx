
import { useState } from 'react';

const stages = ['Applied', 'Assessment', 'Interview', 'Offer'];

export default function ApplicationTimeline({ applications, onEdit, onAdd }) {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Active', 'Rejected', 'Manual'];

  // Determine which stage an application is at (0-3) and if rejected
  const getStageIndex = (app) => {
    if (app.status === 'Rejection') {
      // Find the last stage reached before rejection
      if (app.interviews > 0) return { index: 2, rejected: true };
      if (app.tests?.aptitude || app.tests?.simulation || app.tests?.coding || app.tests?.video) {
        return { index: 1, rejected: true };
      }
      return { index: 0, rejected: true };
    }

    if (app.status === 'Offer') return { index: 3, rejected: false };
    if (app.interviews > 0 || app.status === 'Interview') return { index: 2, rejected: false };
    if (app.tests?.aptitude || app.tests?.simulation || app.tests?.coding || app.tests?.video ||
        app.status === 'Assessment' || app.status === 'Coding Test' || app.status === 'Video Interview') {
      return { index: 1, rejected: false };
    }
    return { index: 0, rejected: false };
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Active') return app.status !== 'Rejection';
    if (selectedFilter === 'Rejected') return app.status === 'Rejection';
    if (selectedFilter === 'Manual') return app.manual;
    return true;
  });

  // Sort by lastUpdate (most recent first)
  const sortedApplications = [...filteredApplications].sort((a, b) =>
    new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Application Journey</h2>
        <div className="flex items-center space-x-3">
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-add-line mr-1"></i>
              Add
            </button>
          )}
          <div className="flex items-center space-x-2">
            <i className="ri-filter-line text-gray-400"></i>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filters.map(filter => (
                <option key={filter} value={filter}>{filter}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[460px] overflow-y-auto">
        {sortedApplications.map((application) => {
          const { index: currentStage, rejected } = getStageIndex(application);

          return (
            <div
              key={application.id}
              className={`p-4 rounded-xl border transition-colors ${
                application.manual
                  ? 'border-purple-200 bg-purple-50/30 hover:bg-purple-50'
                  : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              {/* Company and Position */}
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 truncate">{application.company}</h3>
                    {application.manual && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        Manual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{application.position}</p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(application.lastUpdate).toLocaleDateString()}
                  </span>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(application);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      title="Edit application"
                    >
                      <i className="ri-pencil-line text-sm"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Stage Progress */}
              <div className="flex items-center justify-between">
                {stages.map((stage, idx) => {
                  const isPassed = idx < currentStage;
                  const isCurrent = idx === currentStage;
                  const isFuture = idx > currentStage;

                  let dotColor = 'bg-gray-200';
                  let textColor = 'text-gray-400';

                  if (rejected) {
                    if (isPassed) {
                      dotColor = 'bg-gray-400';
                      textColor = 'text-gray-500';
                    } else if (isCurrent) {
                      dotColor = 'bg-red-500';
                      textColor = 'text-red-600';
                    }
                  } else {
                    if (isPassed) {
                      dotColor = 'bg-green-500';
                      textColor = 'text-green-600';
                    } else if (isCurrent) {
                      if (idx === 3) {
                        dotColor = 'bg-green-500';
                        textColor = 'text-green-600';
                      } else {
                        dotColor = 'bg-blue-500';
                        textColor = 'text-blue-600';
                      }
                    }
                  }

                  return (
                    <div key={stage} className="flex flex-col items-center flex-1">
                      {/* Dot */}
                      <div className={`w-3 h-3 rounded-full ${dotColor} ${isCurrent && !rejected ? 'ring-2 ring-offset-1 ring-blue-300' : ''} ${isCurrent && rejected ? 'ring-2 ring-offset-1 ring-red-300' : ''}`}></div>
                      {/* Label */}
                      <span className={`text-xs mt-1 ${textColor}`}>{stage}</span>
                      {/* Connector line */}
                      {idx < stages.length - 1 && (
                        <div className={`absolute h-0.5 w-full ${isPassed && !rejected ? 'bg-green-500' : 'bg-gray-200'}`}
                          style={{ display: 'none' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rejected badge */}
              {rejected && (
                <div className="mt-2 flex justify-end">
                  <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Rejected</span>
                </div>
              )}
            </div>
          );
        })}

        {sortedApplications.length === 0 && (
          <div className="text-center py-8">
            <i className="ri-inbox-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No applications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
