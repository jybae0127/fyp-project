export default function JobCard({ job }) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Potential Match';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getSourceBadge = (source) => {
    const colors = {
      'Remotive': 'bg-purple-100 text-purple-700',
      'Arbeitnow': 'bg-blue-100 text-blue-700',
      'default': 'bg-gray-100 text-gray-700'
    };
    return colors[source] || colors.default;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            {job.source && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSourceBadge(job.source)}`}>
                {job.source}
              </span>
            )}
          </div>
          <div className="flex items-center mt-1 text-gray-600">
            <i className="ri-building-line mr-1"></i>
            <span className="font-medium">{job.company || 'Company not specified'}</span>
          </div>
        </div>

        {/* Match Score */}
        <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${getScoreColor(job.match_score)}`}>
          <span className="text-2xl font-bold">{job.match_score}</span>
          <span className="text-xs font-medium">{getScoreLabel(job.match_score)}</span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
        {job.location && (
          <div className="flex items-center">
            <i className="ri-map-pin-line mr-1"></i>
            {job.location}
          </div>
        )}
        {job.salary && (
          <div className="flex items-center">
            <i className="ri-money-dollar-circle-line mr-1"></i>
            {job.salary}
          </div>
        )}
        {job.posted_date && (
          <div className="flex items-center">
            <i className="ri-time-line mr-1"></i>
            {formatDate(job.posted_date)}
          </div>
        )}
      </div>

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.tags.slice(0, 5).map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {job.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {job.description.replace(/<[^>]*>/g, '').substring(0, 250)}...
        </p>
      )}

      {/* Match Reasons */}
      {job.match_reasons && job.match_reasons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Why this matches</h4>
          <div className="flex flex-wrap gap-2">
            {job.match_reasons.map((reason, i) => (
              <span key={i} className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                <i className="ri-check-line mr-1"></i>
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Concerns */}
      {job.concerns && job.concerns.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Considerations</h4>
          <div className="flex flex-wrap gap-2">
            {job.concerns.map((concern, i) => (
              <span key={i} className="inline-flex items-center px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                <i className="ri-information-line mr-1"></i>
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer">
          <i className="ri-bookmark-line mr-1"></i>
          Save
        </button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Apply Now
          <i className="ri-external-link-line ml-2"></i>
        </a>
      </div>
    </div>
  );
}
