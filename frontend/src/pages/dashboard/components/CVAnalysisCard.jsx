import { useNavigate } from 'react-router-dom';

export default function CVAnalysisCard() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/cv-analysis')}
      className="card-shine relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 cursor-pointer transition-all duration-300 group"
    >
      {/* Animated glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300 -z-10"></div>

{/* Content - matching stat card layout */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">CV Analysis</p>
          <p className="text-2xl font-bold text-white drop-shadow-lg">AI Insights</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
          <i className="ri-file-user-line text-xl text-white"></i>
        </div>
      </div>
      <div className="mt-4 relative z-10">
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-white/60 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
