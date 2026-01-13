
import { useState } from 'react';
import { updateApplication, deleteApplication } from '../../../services/api';

export default function EditApplicationModal({ application, isOpen, onClose, onSave }) {
  const [companyName, setCompanyName] = useState(application.company);
  const [positionTitle, setPositionTitle] = useState(application.position);
  const [appliedDate, setAppliedDate] = useState(application.appliedDate || '');
  const [aptitudeTest, setAptitudeTest] = useState(application.tests.aptitude || '');
  const [simulationTest, setSimulationTest] = useState(application.tests.simulation || '');
  const [codingTest, setCodingTest] = useState(application.tests.coding || '');
  const [videoInterview, setVideoInterview] = useState(application.tests.video || '');
  const [numInterviews, setNumInterviews] = useState(application.interviews.toString());
  const [appAccepted, setAppAccepted] = useState(
    application.status === 'Offer' ? 'y' : application.status === 'Rejection' ? 'n' : ''
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const positionData = {
      position: positionTitle,
      application_submitted: appliedDate || null,
      aptitude_test: aptitudeTest || null,
      simulation_test: simulationTest || null,
      coding_test: codingTest || null,
      video_interview: videoInterview || null,
      num_human_interview: numInterviews || '0',
      app_accepted: appAccepted || null,
      manual: true,
    };

    const newCompanyName = companyName !== application.company ? companyName : undefined;
    const result = await updateApplication(
      application.company,
      application.positionIndex,
      positionData,
      newCompanyName
    );

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      setSaving(false);
      onSave();
      onClose();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    const result = await deleteApplication(application.company, application.positionIndex);

    if (result.error) {
      setError(result.error);
      setDeleting(false);
      setShowDeleteConfirm(false);
    } else {
      setDeleting(false);
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
              <h2 className="text-xl font-bold text-gray-900">Edit Application</h2>
              {application.manual && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  Manual Entry
                </span>
              )}
            </div>
            <button
              onClick={onClose}
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
              Company Name
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
              Position
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
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this application? This cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <i className="ri-delete-bin-line mr-1"></i>
                Delete
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
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
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
