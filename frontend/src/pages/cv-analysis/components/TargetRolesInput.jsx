import { useState } from 'react';

export default function TargetRolesInput({ targetRoles, setTargetRoles, targetCompanies, setTargetCompanies }) {
  const [roleInput, setRoleInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');

  const handleAddRole = (e) => {
    if (e.key === 'Enter' && roleInput.trim()) {
      e.preventDefault();
      if (!targetRoles.includes(roleInput.trim())) {
        setTargetRoles([...targetRoles, roleInput.trim()]);
      }
      setRoleInput('');
    }
  };

  const handleAddCompany = (e) => {
    if (e.key === 'Enter' && companyInput.trim()) {
      e.preventDefault();
      if (!targetCompanies.includes(companyInput.trim())) {
        setTargetCompanies([...targetCompanies, companyInput.trim()]);
      }
      setCompanyInput('');
    }
  };

  const removeRole = (role) => {
    setTargetRoles(targetRoles.filter(r => r !== role));
  };

  const removeCompany = (company) => {
    setTargetCompanies(targetCompanies.filter(c => c !== company));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="ri-focus-3-line mr-2 text-blue-600"></i>
        Target Preferences
        <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
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
            placeholder="Type a role and press Enter..."
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

        {/* Target Companies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Companies
          </label>
          <input
            type="text"
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            onKeyDown={handleAddCompany}
            placeholder="Type a company and press Enter..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {targetCompanies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {targetCompanies.map((company) => (
                <span
                  key={company}
                  className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                >
                  {company}
                  <button
                    onClick={() => removeCompany(company)}
                    className="ml-1.5 hover:text-purple-900 cursor-pointer"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Add specific roles or companies you're targeting to get more focused recommendations.
      </p>
    </div>
  );
}
