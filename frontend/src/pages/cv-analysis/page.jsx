import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import CVPreview from './components/CVPreview';
import TargetRolesInput from './components/TargetRolesInput';
import AnalysisResults from './components/AnalysisResults';
import { uploadCV, analyzeCV, getApplications, transformToApplications } from '../../services/api';

export default function CVAnalysis() {
  const navigate = useNavigate();

  // CV Upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [cvSections, setCvSections] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Analysis state
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Target preferences
  const [targetRoles, setTargetRoles] = useState([]);
  const [targetCompanies, setTargetCompanies] = useState([]);

  // Applications from cache
  const [applications, setApplications] = useState([]);

  // Load applications on mount
  useEffect(() => {
    const loadApplications = async () => {
      const data = await getApplications();
      if (!data.error && data.companies) {
        const transformedApps = transformToApplications(data);
        setApplications(transformedApps);
      }
    };
    loadApplications();
  }, []);

  const handleFileSelect = async (file) => {
    setUploading(true);
    setUploadError(null);
    setAnalysisResults(null);

    try {
      const result = await uploadCV(file);
      if (result.error) {
        setUploadError(result.error);
        return;
      }

      setUploadedFile({
        filename: result.filename,
        word_count: result.word_count
      });
      setCvText(result.cv_text);
      setCvSections(result.sections);

      // Save to localStorage for Job Recommendations page
      localStorage.setItem('cv_sections', JSON.stringify(result.sections));
    } catch (err) {
      setUploadError(err.message || 'Failed to upload CV');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!cvText || !cvSections) {
      setAnalysisError('Please upload a CV first');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeCV(
        cvText,
        cvSections,
        applications,
        targetRoles,
        targetCompanies
      );

      if (result.error) {
        setAnalysisError(result.error);
        return;
      }

      setAnalysisResults(result);
    } catch (err) {
      setAnalysisError(err.message || 'Failed to analyze CV');
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze = cvText && cvSections && !uploading && !analyzing;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Analysis</h1>
          <p className="text-gray-600">
            Upload your CV to get AI-powered insights based on your application history.
            We'll analyze patterns and provide actionable recommendations to improve your success rate.
          </p>
        </div>

        {/* Error Messages */}
        {(uploadError || analysisError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <i className="ri-error-warning-line text-xl mr-3"></i>
            <span>{uploadError || analysisError}</span>
            <button
              onClick={() => { setUploadError(null); setAnalysisError(null); }}
              className="ml-auto hover:text-red-900 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        )}

        {/* No Applications Notice */}
        {applications.length === 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex items-start">
            <i className="ri-information-line text-xl mr-3 mt-0.5"></i>
            <div>
              <p className="font-medium">No application data found</p>
              <p className="text-sm mt-1">
                For the best insights, connect your Gmail and process your application emails first.
                <button
                  onClick={() => navigate('/dashboard')}
                  className="ml-2 text-amber-800 underline hover:no-underline cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Settings */}
          <div className="lg:col-span-1 space-y-6">
            <FileUpload
              onFileSelect={handleFileSelect}
              uploading={uploading}
              uploadedFile={uploadedFile}
            />

            {cvSections && (
              <CVPreview sections={cvSections} />
            )}

            <TargetRolesInput
              targetRoles={targetRoles}
              setTargetRoles={setTargetRoles}
              targetCompanies={targetCompanies}
              setTargetCompanies={setTargetCompanies}
            />

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center ${
                canAnalyze
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl cursor-pointer'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Analyzing Your CV...
                </>
              ) : (
                <>
                  <i className="ri-sparkling-line mr-2 text-xl"></i>
                  Analyze My CV
                </>
              )}
            </button>

            {/* Application Stats */}
            {applications.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Your Application Data</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
                    <p className="text-xs text-gray-600">Applications</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {new Set(applications.map(a => a.company)).size}
                    </p>
                    <p className="text-xs text-gray-600">Companies</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <AnalysisResults results={analysisResults} />
          </div>
        </div>
      </main>
    </div>
  );
}
