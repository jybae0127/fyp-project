import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGmailPopup from "../../hooks/useGmailPopup";
import { checkAuthStatus, getUserInfo, logout } from "../../../services/api";

export default function Header() {
  const navigate = useNavigate();
  const openPopup = useGmailPopup();

  const [isGmailConnected, setIsGmailConnected] = useState(
    localStorage.getItem("gmail_connected") === "true"
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Check Gmail connection status on mount and listen for auth success
  useEffect(() => {
    const checkConnection = async () => {
      const localConnected = localStorage.getItem("gmail_connected") === "true";
      if (localConnected) {
        // Verify with backend
        const backendConnected = await checkAuthStatus();
        setIsGmailConnected(backendConnected);
        if (!backendConnected) {
          localStorage.removeItem("gmail_connected");
        }
      }
    };

    checkConnection();

    // Listen for auth success event
    const handler = () => {
      setIsGmailConnected(true);
    };

    window.addEventListener("auth-success", handler);
    return () => window.removeEventListener("auth-success", handler);
  }, []);

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
      setIsGmailConnected(false);
      // Notify other components about sign out
      window.dispatchEvent(new Event('auth-signout'));
    }
    setLoggingOut(false);
  };

  // Extract name from email (part before @)
  const userName = userEmail ? userEmail.split('@')[0] : 'User';

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <i className="ri-briefcase-line text-white text-xl"></i>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">JobTracker</h1>
              <span className="text-xs font-medium text-blue-500 -mt-1">AI Powered</span>
            </div>

            {isGmailConnected && (
              <div className="flex items-center space-x-2 ml-4 px-3 py-1 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">Gmail Connected</span>
              </div>
            )}
          </div>

          {isGmailConnected ? (
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
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <i className="ri-dashboard-line mr-2"></i>
                    Go to Dashboard
                  </button>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <i className="ri-settings-line mr-2"></i>
                    Settings
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <i className="ri-question-line mr-2"></i>
                    Help & Support
                  </a>
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
          ) : (
            <button
              onClick={openPopup}
              className="btn-shine px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5"
            >
              <i className="ri-google-fill mr-2"></i>
              Get Started
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
