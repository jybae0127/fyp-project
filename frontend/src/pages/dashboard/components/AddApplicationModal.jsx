
import { useState } from 'react';
import { addApplication } from '../../../services/api';

export default function AddApplicationModal({ isOpen, onClose, onSave }) {
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [aptitudeTest, setAptitudeTest] = useState('');
  const [simulationTest, setSimulationTest] = useState('');
  const [codingTest, setCodingTest] = useState('');
  const [videoInterview, setVideoInterview] = useState('');
  const [numInterviews, setNumInterviews] = useState('0');
  const [appAccepted, setAppAccepted] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setCompanyName('');
    setPositionTitle('');
    setAppliedDate('');
    setAptitudeTest('');
    setSimulationTest('');
    setCodingTest('');
    setVideoInterview('');
    setNumInterviews('0');
    setAppAccepted('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!companyName.trim() || !positionTitle.trim()) {
      setError('Company name and position are required.');
      return;
    }

    setSaving(true);
    setError(null);

    const positionData = {
      position: positionTitle.trim(),
      application_submitted: appliedDate || null,
      aptitude_test: aptitudeTest || null,
      simulation_test: simulationTest || null,
      coding_test: codingTest || null,
      video_interview: videoInterview || null,
      num_human_interview: numInterviews || '0',
      app_accepted: appAccepted || null,
      manual: true,
    };

    const result = await addApplication(companyName.trim(), positionData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      setSaving(false);
      resetForm();
      onSave();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-add-line text-blue-600 text-xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Add Application</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Google"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Software Engineer"
            />
          </div>

          {/* Applied Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Date
            </label>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Status
            </label>
            <select
              value={appAccepted}
              onChange={(e) => setAppAccepted(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">In Progress</option>
              <option value="y">Offer Received</option>
              <option value="n">Rejected</option>
            </select>
          </div>

          {/* Tests Section */}
          <div className="pt-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Assessment Dates (optional)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Aptitude Test</label>
                <input
                  type="date"
                  value={aptitudeTest}
                  onChange={(e) => setAptitudeTest(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Simulation Test</label>
                <input
                  type="date"
                  value={simulationTest}
                  onChange={(e) => setSimulationTest(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Coding Test</label>
                <input
                  type="date"
                  value={codingTest}
                  onChange={(e) => setCodingTest(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Video Interview</label>
                <input
                  type="date"
                  value={videoInterview}
                  onChange={(e) => setVideoInterview(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Number of Interviews */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Interviews
            </label>
            <input
              type="number"
              min="0"
              value={numInterviews}
              onChange={(e) => setNumInterviews(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !companyName.trim() || !positionTitle.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
