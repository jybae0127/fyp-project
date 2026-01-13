import { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import SankeyDiagram from './components/SankeyDiagram';
import ApplicationTimeline from './components/ApplicationTimeline';
import ApplicationFunnel from './components/ApplicationFunnel';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import ChatbotWidget from './components/ChatbotWidget';
import EditApplicationModal from './components/EditApplicationModal';
import AddApplicationModal from './components/AddApplicationModal';
import useGmailPopup from '../hooks/useGmailPopup';
import {
  checkAuthStatus,
  processApplicationsWithProgress,
  transformToApplications,
  getApplications,
} from '../../services/api';

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  // Initialize from localStorage for immediate UI response
  const [isGmailConnected, setIsGmailConnected] = useState(
    () => localStorage.getItem('gmail_connected') === 'true'
  );
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState(null);
  const [cacheNotice, setCacheNotice] = useState({ show: false, fromCache: false, incremental: false });
  const [sessionExpired, setSessionExpired] = useState(false);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    // Default to 3 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });

  const openGmailPopup = useGmailPopup();

  const loadingSteps = [
    { icon: "ri-mail-download-line", text: "Fetching email data...", color: "text-blue-500" },
    { icon: "ri-search-eye-line", text: "Scanning for job applications...", color: "text-purple-500" },
    { icon: "ri-building-2-line", text: "Detecting companies...", color: "text-indigo-500" },
    { icon: "ri-robot-line", text: "AI analyzing content...", color: "text-pink-500" },
    { icon: "ri-filter-3-line", text: "Classifying by stage...", color: "text-orange-500" },
    { icon: "ri-dashboard-3-line", text: "Building your dashboard...", color: "text-green-500" },
  ];

  // Reset loading step when processing starts
  useEffect(() => {
    if (processing) {
      setLoadingStep(0);
      setProgressMessage("");
    }
  }, [processing]);

  useEffect(() => {
    // Verify Gmail connection with backend
    const checkConnection = async () => {
      const localConnected = localStorage.getItem('gmail_connected') === 'true';
      if (localConnected) {
        // Verify with backend
        const backendConnected = await checkAuthStatus();
        setIsGmailConnected(backendConnected);
        if (!backendConnected) {
          // Session expired - clear state and notify user
          localStorage.removeItem('gmail_connected');
          setApplications([]);
          setSessionExpired(true);
          // Auto-hide notification after 5 seconds
          setTimeout(() => setSessionExpired(false), 5000);
        }
      }
    };

    checkConnection();

    // Listen for auth success event (e.g., when user logs in from this page)
    const handler = () => {
      setIsGmailConnected(true);
      setSessionExpired(false);
    };
    window.addEventListener('auth-success', handler);
    return () => window.removeEventListener('auth-success', handler);
  }, []);

  const handleGmailConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await openGmailPopup();
      if (success) {
        setIsGmailConnected(true);
        // Auto-fetch applications after connecting
        await fetchApplications();
      }
    } catch (err) {
      console.error('Failed to connect Gmail:', err);
      setError('Failed to connect to Gmail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (refresh = false) => {
    setProcessing(true);
    setError(null);

    try {
      const handleProgress = (event) => {
        if (event.type === "progress" && event.step !== undefined) {
          setLoadingStep(event.step);
          if (event.message) {
            setProgressMessage(event.message);
          }
        } else if (event.type === "cached") {
          // Fast-forward through all steps for cached data
          setLoadingStep(5);
          setProgressMessage("Loading from cache...");
        }
      };

      const data = await processApplicationsWithProgress(startDate, endDate, refresh, handleProgress);

      // Show cache notice with details
      if (data.from_cache || data.incremental_update) {
        console.log(data.from_cache ? 'Data loaded from cache' : 'Incremental update merged');
        setCacheNotice({
          show: true,
          fromCache: data.from_cache || false,
          incremental: data.incremental_update || false,
          dateRange: data.cached_range
        });
        setTimeout(() => setCacheNotice(prev => ({ ...prev, show: false })), 5000);
      } else {
        console.log('Fresh data fetched from server');
      }
      const transformedApps = transformToApplications(data);
      setApplications(transformedApps);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to process emails. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefresh = async () => {
    // Bypass cache when user manually refreshes
    await fetchApplications(true);
  };

  const handleSignOut = () => {
    // Clear all application state
    setApplications([]);
    setIsGmailConnected(false);
    setError(null);
    setCacheNotice({ show: false, fromCache: false, incremental: false });
  };

  // Modal handlers
  const handleEditApplication = (application) => {
    setEditingApplication(application);
    setIsEditModalOpen(true);
  };

  const handleAddApplication = () => {
    setIsAddModalOpen(true);
  };

  const handleModalSave = async () => {
    // Reload applications from cache after edit/add/delete
    const data = await getApplications();
    if (!data.error) {
      const transformedApps = transformToApplications(data);
      setApplications(transformedApps);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isGmailConnected={isGmailConnected}
        onGmailConnect={handleGmailConnect}
        onRefresh={handleRefresh}
        onSignOut={handleSignOut}
        loading={loading}
        processing={processing}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {sessionExpired && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex items-center justify-between animate-fade-in">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-xl mr-3"></i>
              <div>
                <span className="font-medium">Session expired.</span>
                {' '}Your Gmail connection has ended. Please reconnect to continue tracking your applications.
              </div>
            </div>
            <button
              onClick={() => setSessionExpired(false)}
              className="text-amber-500 hover:text-amber-700 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {cacheNotice.show && (
          <div className={`mb-6 p-4 ${cacheNotice.incremental ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'} border rounded-lg flex items-center justify-between animate-fade-in`}>
            <div className="flex items-center">
              <i className={`${cacheNotice.incremental ? 'ri-refresh-line' : 'ri-database-2-line'} text-xl mr-3`}></i>
              <div>
                <span>
                  {cacheNotice.incremental
                    ? 'New emails merged with cached data.'
                    : 'Using cached data.'}
                  {' '}Click <strong>Refresh</strong> in the header to fetch latest emails.
                </span>
                {cacheNotice.dateRange && (
                  <div className="text-sm opacity-75 mt-1">
                    Cached range: {cacheNotice.dateRange.earliest} to {cacheNotice.dateRange.latest}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setCacheNotice(prev => ({ ...prev, show: false }))}
              className={`${cacheNotice.incremental ? 'text-green-500 hover:text-green-700' : 'text-blue-500 hover:text-blue-700'} cursor-pointer`}
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        )}

        {!isGmailConnected ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-8 bg-blue-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect your Gmail account</h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Start tracking your job applications by connecting your Gmail account.
              We'll automatically analyze your emails and organize your application journey.
            </p>
            <button
              onClick={handleGmailConnect}
              disabled={loading}
              className="btn-shine inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl hover:scale-105 hover:-translate-y-1 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Connect Gmail Account
                </>
              )}
            </button>
          </div>
        ) : applications.length === 0 && !processing ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date Range</h2>
              <p className="text-gray-600 mb-6">
                Choose the date range for emails to analyze
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={() => fetchApplications(false)}
                disabled={processing}
                className="btn-3d w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Analyze Emails
              </button>
            </div>
          </div>
        ) : processing ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              {/* Animated icon */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <i className={`${loadingSteps[loadingStep].icon} text-white text-3xl`}></i>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analyzing your emails</h2>

              {/* Progress steps */}
              <div className="space-y-3 text-left mb-6">
                {loadingSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                      index < loadingStep
                        ? "bg-green-50 text-green-700"
                        : index === loadingStep
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {index < loadingStep ? (
                      <i className="ri-check-line text-green-500 text-xl"></i>
                    ) : index === loadingStep ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <i className={`${step.icon} text-gray-400 text-xl`}></i>
                    )}
                    <span className={`font-medium ${index <= loadingStep ? "" : "opacity-50"}`}>
                      {index === loadingStep && progressMessage ? progressMessage : step.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Step {loadingStep + 1} of {loadingSteps.length}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <StatsOverview applications={applications} />

            <SankeyDiagram applications={applications} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <ApplicationFunnel applications={applications} />
              </div>
              <div className="lg:col-span-3">
                <ApplicationTimeline
                  applications={applications}
                  onEdit={handleEditApplication}
                  onAdd={handleAddApplication}
                />
              </div>
            </div>

            <PerformanceAnalytics applications={applications} />
          </div>
        )}
      </main>

      <ChatbotWidget applications={applications} />

      {/* Modals */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleModalSave}
      />

      {editingApplication && (
        <EditApplicationModal
          application={editingApplication}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingApplication(null);
          }}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
