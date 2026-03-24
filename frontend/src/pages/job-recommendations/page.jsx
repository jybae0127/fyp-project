import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import JobCard from './components/JobCard';
import JobFilters from './components/JobFilters';
import { getJobRecommendations, getApplications, transformToApplications } from '../../services/api';

export default function JobRecommendations() {
  const navigate = useNavigate();

  // Job state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keywordsUsed, setKeywordsUsed] = useState([]);
  const [overallAdvice, setOverallAdvice] = useState('');

  // Filter state
  const [targetRoles, setTargetRoles] = useState([]);
  const [location, setLocation] = useState('hong kong');
  const [country, setCountry] = useState('hk');
  const [useAI, setUseAI] = useState(false);

  // CV and application data
  const [cvSections, setCvSections] = useState(null);
  const [applications, setApplications] = useState([]);
  const [hasCV, setHasCV] = useState(false);

  // Load applications and check for CV data
  useEffect(() => {
    const loadData = async () => {
      // Load applications
      const appData = await getApplications();
      if (!appData.error && appData.companies) {
        const transformedApps = transformToApplications(appData);
        setApplications(transformedApps);
      }

      // Check localStorage for CV data
      const savedCV = localStorage.getItem('cv_sections');
      if (savedCV) {
        try {
          const parsed = JSON.parse(savedCV);
          setCvSections(parsed);
          setHasCV(true);
        } catch (e) {
          console.error('Error parsing saved CV:', e);
        }
      }
    };
    loadData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getJobRecommendations(
        cvSections,
        applications,
        targetRoles,
        location,
        country,
        useAI
      );

      console.log('API Result:', result);

      if (result.error) {
        setError(result.error);
        return;
      }

      console.log('Setting jobs:', result.jobs);
      setJobs(result.jobs || []);
      setKeywordsUsed(result.keywords_used || []);
      setOverallAdvice(result.overall_advice || '');
    } catch (err) {
      setError(err.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Save CV sections to localStorage when navigating from CV Analysis
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCV = localStorage.getItem('cv_sections');
      if (savedCV) {
        try {
          const parsed = JSON.parse(savedCV);
          setCvSections(parsed);
          setHasCV(true);
        } catch (e) {
          console.error('Error parsing saved CV:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Recommendations</h1>
          <p className="text-gray-600">
            Discover personalized job opportunities based on your CV, skills, and application history.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <i className="ri-error-warning-line text-xl mr-3"></i>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto hover:text-red-900 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        )}

        {/* Data Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* CV Status */}
          <div className={`p-4 rounded-lg border ${hasCV ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${hasCV ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <i className={`ri-file-user-line text-xl ${hasCV ? 'text-green-600' : 'text-yellow-600'}`}></i>
                </div>
                <div>
                  <p className={`font-medium ${hasCV ? 'text-green-900' : 'text-yellow-900'}`}>
                    {hasCV ? 'CV Loaded' : 'No CV Data'}
                  </p>
                  <p className={`text-sm ${hasCV ? 'text-green-600' : 'text-yellow-600'}`}>
                    {hasCV ? 'Your skills will be matched' : 'Upload CV for better matches'}
                  </p>
                </div>
              </div>
              {!hasCV && (
                <button
                  onClick={() => navigate('/cv-analysis')}
                  className="px-3 py-1.5 bg-yellow-200 text-yellow-800 text-sm rounded-lg hover:bg-yellow-300 cursor-pointer"
                >
                  Upload CV
                </button>
              )}
            </div>
          </div>

          {/* Applications Status */}
          <div className={`p-4 rounded-lg border ${applications.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${applications.length > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <i className={`ri-file-list-3-line text-xl ${applications.length > 0 ? 'text-blue-600' : 'text-gray-600'}`}></i>
                </div>
                <div>
                  <p className={`font-medium ${applications.length > 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                    {applications.length > 0 ? `${applications.length} Applications` : 'No Application Data'}
                  </p>
                  <p className={`text-sm ${applications.length > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                    {applications.length > 0 ? 'Patterns will inform recommendations' : 'Process emails for better matches'}
                  </p>
                </div>
              </div>
              {applications.length === 0 && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 cursor-pointer"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Filters */}
          <div className="lg:col-span-1 space-y-6">
            <JobFilters
              targetRoles={targetRoles}
              setTargetRoles={setTargetRoles}
              location={location}
              setLocation={setLocation}
              country={country}
              setCountry={setCountry}
              useAI={useAI}
              setUseAI={setUseAI}
            />

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Finding Jobs...
                </>
              ) : (
                <>
                  <i className="ri-search-line mr-2 text-xl"></i>
                  Find Jobs
                </>
              )}
            </button>

            {/* Keywords Used */}
            {keywordsUsed.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Search Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {keywordsUsed.map((keyword, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-3">
            {/* Overall Advice */}
            {overallAdvice && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <i className="ri-lightbulb-line text-xl text-purple-600"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900 mb-1">AI Career Advice</h4>
                    <p className="text-purple-700 text-sm">{overallAdvice}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Results */}
            {jobs.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {jobs.length} Jobs Found
                  </h2>
                  <span className="text-sm text-gray-500">Sorted by match score</span>
                </div>

                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : !loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className="ri-briefcase-line text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Ready to Find Jobs</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Add your target roles and click "Find Jobs" to get personalized job recommendations
                  based on your profile.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Software Engineer</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">Data Analyst</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Product Manager</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
