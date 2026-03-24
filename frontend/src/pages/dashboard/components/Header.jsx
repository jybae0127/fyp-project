
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, logout } from '../../../services/api';
import SettingsModal from '../../../components/SettingsModal';
import HelpModal from '../../../components/HelpModal';

export default function Header({ isGmailConnected, onGmailConnect, onRefresh, onSignOut, onDateRangeClick, loading, processing }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Fetch user info when Gmail is connected
  useEffect(() => {
    if (isGmailConnected) {
      getUserInfo().then((info) => {
        if (info?.email) {
          setUserEmail(info.email);
        }
      });
    }
  }, [isGmailConnected]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    const success = await logout();
    if (success) {
      setUserEmail(null);
      setShowUserMenu(false);
      onSignOut(); // Notify parent to clear state
      navigate('/');
    }
    setLoggingOut(false);
  };

  // Extract name from email (part before @)
  const userName = userEmail ? userEmail.split('@')[0] : 'User';

  return (
  <>
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

            {isGmailConnected && (
              <div className="flex items-center space-x-3 ml-8">
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700 font-medium">Gmail Connected</span>
                </div>
                <button
                  onClick={onDateRangeClick}
                  disabled={processing}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <i className="ri-calendar-line mr-1.5"></i>
                  Date Range
                </button>
                <button
                  onClick={onRefresh}
                  disabled={processing}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="ri-refresh-line mr-1.5"></i>
                      Refresh
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!isGmailConnected && (
              <button
                onClick={onGmailConnect}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <i className="ri-google-line mr-2"></i>
                    Connect Gmail
                  </>
                )}
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors duration-200"
              >
                <i className="ri-user-line text-gray-600"></i>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail || 'Not connected'}</p>
                  </div>
                  <button onClick={() => { setShowUserMenu(false); setShowSettings(true); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <i className="ri-settings-line mr-2"></i>
                    Settings
                  </button>
                  <button onClick={() => { setShowUserMenu(false); setShowHelp(true); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <i className="ri-question-line mr-2"></i>
                    Help & Support
                  </button>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleSignOut}
                      disabled={loggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                    >
                      <i className="ri-logout-box-line mr-2"></i>
                      {loggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>

    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSignOut={onSignOut} />}
    {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
  </>
  );
}
