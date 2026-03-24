import { useState } from 'react';

export default function AnalysisResults({ results }) {
  const [activeTab, setActiveTab] = useState('insights');

  if (!results) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <i className="ri-bar-chart-box-line text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
        <p className="text-gray-500">Upload your CV and click "Analyze My CV" to get personalized insights.</p>
      </div>
    );
  }

  const { pattern_insights, improvement_suggestions, summary } = results;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'skills': return 'ri-tools-line';
      case 'experience': return 'ri-briefcase-line';
      case 'format': return 'ri-layout-line';
      case 'education': return 'ri-graduation-cap-line';
      default: return 'ri-lightbulb-line';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-semibold mb-3 flex items-center">
            <i className="ri-dashboard-3-line mr-2"></i>
            Analysis Summary
          </h3>
          <p className="text-blue-100 mb-4">{summary.overall_assessment}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strengths */}
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <i className="ri-thumb-up-line mr-2"></i>
                Strengths
              </h4>
              <ul className="text-sm text-blue-100 space-y-1">
                {summary.strengths?.slice(0, 3).map((strength, i) => (
                  <li key={i} className="flex items-start">
                    <i className="ri-check-line mr-1 mt-0.5 flex-shrink-0"></i>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <i className="ri-focus-3-line mr-2"></i>
                Focus Areas
              </h4>
              <ul className="text-sm text-blue-100 space-y-1">
                {summary.areas_for_improvement?.slice(0, 3).map((area, i) => (
                  <li key={i} className="flex items-start">
                    <i className="ri-arrow-right-s-line mr-1 mt-0.5 flex-shrink-0"></i>
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <i className="ri-rocket-line mr-2"></i>
                Next Steps
              </h4>
              <ul className="text-sm text-blue-100 space-y-1">
                {summary.recommended_next_steps?.slice(0, 3).map((step, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-1 flex-shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'insights'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-line-chart-line mr-2"></i>
            Pattern Insights
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'suggestions'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-lightbulb-line mr-2"></i>
            Improvement Suggestions
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'insights' && pattern_insights && (
            <div className="space-y-6">
              {/* Skill Match Analysis */}
              {pattern_insights.skill_match_analysis && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="ri-tools-line mr-2 text-blue-600"></i>
                    Skill Match Analysis
                  </h4>

                  {/* Strong Matches */}
                  {pattern_insights.skill_match_analysis.strong_matches?.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-green-700 mb-2">Strong Matches</h5>
                      <div className="space-y-2">
                        {pattern_insights.skill_match_analysis.strong_matches.map((match, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">{match.skill}</span>
                              {match.matched_companies?.length > 0 && (
                                <span className="text-sm text-gray-500 ml-2">
                                  at {match.matched_companies.join(', ')}
                                </span>
                              )}
                            </div>
                            {match.success_rate && (
                              <span className="text-green-600 font-medium">{match.success_rate}% success</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {pattern_insights.skill_match_analysis.missing_skills?.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-orange-700 mb-2">Skills to Consider Adding</h5>
                      <div className="space-y-2">
                        {pattern_insights.skill_match_analysis.missing_skills.map((skill, i) => (
                          <div key={i} className="p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{skill.skill}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(skill.priority)}`}>
                                {skill.priority} priority
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{skill.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role Alignment */}
              {pattern_insights.role_alignment && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="ri-user-star-line mr-2 text-purple-600"></i>
                    Role Alignment
                  </h4>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700">Alignment Score</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {pattern_insights.role_alignment.alignment_score || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pattern_insights.role_alignment.alignment_score || 0}%` }}
                      ></div>
                    </div>
                    {pattern_insights.role_alignment.best_fit_roles?.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">Best fit roles: </span>
                        <span className="font-medium text-gray-900">
                          {pattern_insights.role_alignment.best_fit_roles.join(', ')}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">{pattern_insights.role_alignment.explanation}</p>
                  </div>
                </div>
              )}

              {/* Application Patterns */}
              {pattern_insights.application_patterns && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="ri-bar-chart-grouped-line mr-2 text-indigo-600"></i>
                    Application Patterns
                  </h4>
                  <div className="grid gap-3">
                    {pattern_insights.application_patterns.success_factors?.map((factor, i) => (
                      <div key={i} className="flex items-start p-3 bg-green-50 rounded-lg">
                        <i className="ri-checkbox-circle-line text-green-600 mr-2 mt-0.5"></i>
                        <span className="text-gray-700">{factor}</span>
                      </div>
                    ))}
                    {pattern_insights.application_patterns.failure_patterns?.map((pattern, i) => (
                      <div key={i} className="flex items-start p-3 bg-red-50 rounded-lg">
                        <i className="ri-error-warning-line text-red-600 mr-2 mt-0.5"></i>
                        <span className="text-gray-700">{pattern}</span>
                      </div>
                    ))}
                    {pattern_insights.application_patterns.timing_insights?.map((insight, i) => (
                      <div key={i} className="flex items-start p-3 bg-blue-50 rounded-lg">
                        <i className="ri-time-line text-blue-600 mr-2 mt-0.5"></i>
                        <span className="text-gray-700">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && improvement_suggestions && (
            <div className="space-y-4">
              {improvement_suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="flex items-start p-4 bg-gray-50">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                      suggestion.priority === 'high' ? 'bg-red-100' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <i className={`${getCategoryIcon(suggestion.category)} text-xl ${
                        suggestion.priority === 'high' ? 'text-red-600' :
                        suggestion.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-semibold text-gray-900">{suggestion.title}</h5>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 uppercase">{suggestion.category}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 mb-3">{suggestion.description}</p>
                    {suggestion.action_items?.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Action Items:</h6>
                        <ul className="space-y-1">
                          {suggestion.action_items.map((item, j) => (
                            <li key={j} className="flex items-start text-sm text-gray-600">
                              <i className="ri-checkbox-blank-circle-line text-xs mr-2 mt-1 text-gray-400"></i>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
