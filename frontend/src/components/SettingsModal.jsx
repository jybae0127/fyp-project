import { useState } from "react";
import { logout } from "../services/api";

const LOCAL_SERVER = "https://therapeutic-sell-mls-sends.trycloudflare.com"; // TODO: change back to "https://jobtracker-api.ddns.net" for production

export default function SettingsModal({ onClose, onSignOut }) {
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheClear, setCacheClear] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await fetch(`${LOCAL_SERVER}/clear-cache`);
      setCacheClear(true);
    } catch (e) {
      // ignore
    }
    setClearingCache(false);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    const success = await logout();
    if (success) {
      window.dispatchEvent(new Event("auth-signout"));
      onSignOut?.();
      onClose();
    }
    setDisconnecting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <i className="ri-settings-3-line text-gray-600 text-xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <i className="ri-close-line text-gray-500"></i>
          </button>
        </div>

        <div className="space-y-4">
          {/* Clear Cache */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Clear Application Data</p>
              <p className="text-sm text-gray-500 mt-0.5">Remove all cached email and application data</p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={clearingCache || cacheClear}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {clearingCache ? "Clearing..." : cacheClear ? "Cleared ✓" : "Clear Data"}
            </button>
          </div>

          {/* Disconnect Gmail */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
            <div>
              <p className="font-medium text-red-900">Disconnect Gmail</p>
              <p className="text-sm text-red-500 mt-0.5">Sign out and revoke Gmail access</p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
