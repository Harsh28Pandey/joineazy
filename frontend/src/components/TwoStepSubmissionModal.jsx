import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import api from '../api/client';

const TwoStepSubmissionModal = ({
  isOpen,
  onClose,
  assignment,
  userGroups = [],
  onSubmissionSuccess
}) => {
  const [step, setStep] = useState(1);
  const [selectedGroupId, setSelectedGroupId] = useState(
    userGroups.length > 0 ? userGroups[0].id : ''
  );
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  
  // Step 2 checklist states
  const [hasUploadedToOneDrive, setHasUploadedToOneDrive] = useState(false);
  const [yesConfirmed, setYesConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !assignment) return null;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      setError('Please select which group is submitting this assignment.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleConfirmSubmit = async () => {
    if (!hasUploadedToOneDrive || !yesConfirmed) {
      setError('Please complete the verification checklist and confirm "Yes, I have submitted".');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/submissions/confirm', {
        assignmentId: assignment.id,
        groupId: selectedGroupId,
        confirmationNote: notes,
        onedriveItemUrl: fileUrl,
        twoStepVerified: true
      });

      if (res.data.success) {
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (_) {}

        if (onSubmissionSuccess) {
          onSubmissionSuccess(res.data.receipt);
        }
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm submission.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setNotes('');
    setFileUrl('');
    setHasUploadedToOneDrive(false);
    setYesConfirmed(false);
    setError('');
    onClose();
  };

  const selectedGroup = userGroups.find((g) => g.id === selectedGroupId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${step === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
              Step {step} of 2
            </span>
            <h3 className="text-base font-semibold text-slate-800">
              {step === 1 ? 'Submit Assignment Work' : 'Two-Step Verification'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-indigo-600 h-1 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Details & External OneDrive Upload Link */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="p-6 space-y-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900">{assignment.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Due: {new Date(assignment.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Select Group */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Submitting on behalf of Group
              </label>
              {userGroups.length > 0 ? (
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {userGroups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  You are not currently in any group. Please create or join a group first to confirm submission.
                </div>
              )}
            </div>

            {/* OneDrive External Link Action */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  1. External OneDrive Submission Folder
                </span>
                <span className="text-[11px] bg-blue-200/80 text-blue-800 font-medium px-2 py-0.5 rounded-full">
                  Required Action
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Please upload your group files to the professor's shared OneDrive folder before confirming.
              </p>
              <a
                href={assignment.onedrive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg shadow-sm transition-colors"
              >
                <span>Open OneDrive Submission Folder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Submission Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Submission Notes / Description (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Uploaded Final_Architecture_Report.pdf and slide deck to folder."
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Direct item link */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Direct File URL / Link (Optional)
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://onedrive.live.com/..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={userGroups.length === 0}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                <span>Proceed to Step 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Two-Step Verification ("Yes, I have submitted" -> confirm) */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-8 h-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Confirmation Verification for {selectedGroup?.name || 'Group'}
                </h4>
                <p className="text-xs text-slate-500">
                  This confirmation will officially log your submission in the professor's dashboard.
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={hasUploadedToOneDrive}
                  onChange={(e) => setHasUploadedToOneDrive(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700">
                  I have successfully uploaded our team's work to the specified OneDrive folder.
                </span>
              </label>

              {/* Explicit "Yes, I have submitted" checkbox */}
              <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${yesConfirmed ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20' : 'border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70'}`}>
                <input
                  type="checkbox"
                  checked={yesConfirmed}
                  onChange={(e) => setYesConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>“Yes, I have submitted”</span>
                    {yesConfirmed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />}
                  </span>
                  <p className="text-[11px] text-slate-600">
                    I explicitly verify and submit this assignment on behalf of <strong>{selectedGroup?.name}</strong>.
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 1</span>
              </button>
              
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={!hasUploadedToOneDrive || !yesConfirmed || loading}
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Confirm Submission'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoStepSubmissionModal;
