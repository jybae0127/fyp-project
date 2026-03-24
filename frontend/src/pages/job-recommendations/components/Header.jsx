import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <img src="/logo.png" alt="JobTracker logo" className="w-10 h-10 object-contain rounded-2xl border border-gray-200 shadow-md group-hover:scale-105 transition-all duration-300" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">JobTracker</h1>
            </button>

            <div className="flex items-center space-x-2 ml-4">
              <i className="ri-arrow-right-s-line text-gray-400"></i>
              <span className="text-gray-600 font-medium">Job Recommendations</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/cv-analysis')}
              className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <i className="ri-file-user-line mr-2"></i>
              CV Analysis
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
