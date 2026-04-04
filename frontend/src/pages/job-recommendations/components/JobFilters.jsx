import { useState } from 'react';

export default function JobFilters({
  targetRoles,
  setTargetRoles,
  location,
  setLocation,
  country,
  setCountry,
  useAI,
  setUseAI
}) {
  const [roleInput, setRoleInput] = useState('');

  const handleAddRole = (e) => {
    if (e.key === 'Enter' && roleInput.trim()) {
      e.preventDefault();
      if (!targetRoles.includes(roleInput.trim())) {
        setTargetRoles([...targetRoles, roleInput.trim()]);
      }
      setRoleInput('');
    }
  };

  const removeRole = (role) => {
    setTargetRoles(targetRoles.filter(r => r !== role));
  };

  const countries = [
    { code: 'sg', name: 'Singapore', defaultLocation: 'singapore' },
    { code: 'gb', name: 'United Kingdom', defaultLocation: 'london' },
    { code: 'us', name: 'United States', defaultLocation: 'new york' },
    { code: 'au', name: 'Australia', defaultLocation: 'sydney' },
    { code: 'ca', name: 'Canada', defaultLocation: 'toronto' },
    { code: 'de', name: 'Germany', defaultLocation: 'berlin' },
    { code: 'fr', name: 'France', defaultLocation: 'paris' },
    { code: 'in', name: 'India', defaultLocation: 'bangalore' },
    { code: 'nl', name: 'Netherlands', defaultLocation: 'amsterdam' },
    { code: 'br', name: 'Brazil', defaultLocation: 'sao paulo' },
    { code: 'it', name: 'Italy', defaultLocation: 'milan' },
    { code: 'es', name: 'Spain', defaultLocation: 'madrid' },
    { code: 'nz', name: 'New Zealand', defaultLocation: 'auckland' },
    { code: 'pl', name: 'Poland', defaultLocation: 'warsaw' },
    { code: 'be', name: 'Belgium', defaultLocation: 'brussels' },
    { code: 'ch', name: 'Switzerland', defaultLocation: 'zurich' },
    { code: 'at', name: 'Austria', defaultLocation: 'vienna' },
    { code: 'mx', name: 'Mexico', defaultLocation: 'mexico city' },
    { code: 'za', name: 'South Africa', defaultLocation: 'johannesburg' },
  ];

  const handleCountryChange = (e) => {
    const selectedCountry = countries.find(c => c.code === e.target.value);
    setCountry(e.target.value);
    if (selectedCountry) {
      setLocation(selectedCountry.defaultLocation);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="ri-filter-3-line mr-2 text-blue-600"></i>
        Search Preferences
      </h3>

      <div className="space-y-4">
        {/* Target Roles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Roles
          </label>
          <input
            type="text"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            onKeyDown={handleAddRole}
            placeholder="e.g., Software Engineer (press Enter)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {targetRoles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {targetRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                >
                  {role}
                  <button
                    onClick={() => removeRole(role)}
                    className="ml-1.5 hover:text-blue-900 cursor-pointer"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={country}
            onChange={handleCountryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or region"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* AI Enhancement Toggle */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-purple-900">AI-Enhanced Matching</p>
            <p className="text-xs text-purple-600">Deeper analysis with GPT</p>
          </div>
          <button
            onClick={() => setUseAI(!useAI)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              useAI ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useAI ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
