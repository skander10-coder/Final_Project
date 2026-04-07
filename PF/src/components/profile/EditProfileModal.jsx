import { useEffect, useState } from 'react';
import { studentAPI, companyAPI, adminAPI } from '../../services/api';

const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'M1', 'M2'];

function SkillsTagInput({ skills, onChange, error }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (skills.includes(v)) {
      setInput('');
      return;
    }
    onChange([...skills, v]);
    setInput('');
  };

  const remove = (tag) => {
    onChange(skills.filter((s) => s !== tag));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills *</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Type a skill and press Enter"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        {skills.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="p-0.5 rounded hover:bg-indigo-100 text-indigo-600"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EditProfileModal({ isOpen, onClose, role, profile, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [student, setStudent] = useState({
    skills: [],
    university: '',
    level: 'L1',
    major: '',
    github_url: '',
    phone_number: '',
    bio: '',
  });

  const [company, setCompany] = useState({
    description: '',
    website: '',
    location: '',
    logo_url: '',
  });

  const [admin, setAdmin] = useState({
    phone_number: '',
    department: '',
    university: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    if (role === 'student') {
      const p = profile || {};
      setStudent({
        skills: Array.isArray(p.skills) ? [...p.skills] : [],
        university: p.university || '',
        level: p.level && LEVELS.includes(p.level) ? p.level : 'L1',
        major: p.major || '',
        github_url: p.github_url || '',
        phone_number: p.phone_number || '',
        bio: p.bio || '',
      });
    } else if (role === 'company') {
      const p = profile || {};
      setCompany({
        description: p.description || '',
        website: p.website || '',
        location: p.location || '',
        logo_url: p.logo_url || '',
      });
    } else if (role === 'admin') {
      const p = profile || {};
      setAdmin({
        phone_number: p.phone_number || '',
        department: p.department || '',
        university: p.university || '',
      });
    }
  }, [isOpen, role, profile]);

  if (!isOpen) return null;

  const handleSaveStudent = async () => {
    setFormError('');
    if (!student.university.trim()) {
      setFormError('University is required.');
      return;
    }
    if (!student.major.trim()) {
      setFormError('Major is required.');
      return;
    }
    if (!student.skills.length) {
      setFormError('Add at least one skill.');
      return;
    }
    setSaving(true);
    try {
      await studentAPI.updateProfile({
        skills: student.skills,
        university: student.university.trim(),
        level: student.level,
        major: student.major.trim(),
        github_url: student.github_url.trim(),
        phone_number: student.phone_number.trim(),
        bio: student.bio.trim(),
      });
      onSaved();
      onClose();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    setFormError('');
    if (!company.description.trim() || !company.website.trim() || !company.location.trim()) {
      setFormError('Description, website, and location are required.');
      return;
    }
    setSaving(true);
    try {
      await companyAPI.updateProfile({
        description: company.description.trim(),
        website: company.website.trim(),
        location: company.location.trim(),
        logo_url: company.logo_url.trim(),
      });
      onSaved();
      onClose();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdmin = async () => {
    setFormError('');
    if (!admin.phone_number.trim() || !admin.department.trim() || !admin.university.trim()) {
      setFormError('Phone number, department, and university are required.');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.updateProfile({
        phone_number: admin.phone_number.trim(),
        department: admin.department.trim(),
        university: admin.university.trim(),
      });
      onSaved();
      onClose();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'student') handleSaveStudent();
    else if (role === 'company') handleSaveCompany();
    else handleSaveAdmin();
  };

  const title =
    role === 'student' ? 'Edit student profile' : role === 'company' ? 'Edit company profile' : 'Edit admin profile';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Update your details and save.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm px-4 py-3">{formError}</div>
          )}

          {role === 'student' && (
            <>
              <SkillsTagInput
                skills={student.skills}
                onChange={(next) => setStudent((s) => ({ ...s, skills: next }))}
                error={null}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">University *</label>
                <input
                  type="text"
                  value={student.university}
                  onChange={(e) => setStudent((s) => ({ ...s, university: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Level *</label>
                <select
                  value={student.level}
                  onChange={(e) => setStudent((s) => ({ ...s, level: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Major *</label>
                <input
                  type="text"
                  value={student.major}
                  onChange={(e) => setStudent((s) => ({ ...s, major: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">GitHub URL</label>
                <input
                  type="url"
                  value={student.github_url}
                  onChange={(e) => setStudent((s) => ({ ...s, github_url: e.target.value }))}
                  placeholder="https://github.com/username"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={student.phone_number}
                  onChange={(e) => setStudent((s) => ({ ...s, phone_number: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                <textarea
                  value={student.bio}
                  onChange={(e) => setStudent((s) => ({ ...s, bio: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 resize-y min-h-[100px]"
                />
              </div>
            </>
          )}

          {role === 'company' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
                <textarea
                  value={company.description}
                  onChange={(e) => setCompany((c) => ({ ...c, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 resize-y min-h-[100px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Website *</label>
                <input
                  type="url"
                  value={company.website}
                  onChange={(e) => setCompany((c) => ({ ...c, website: e.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Location *</label>
                <input
                  type="text"
                  value={company.location}
                  onChange={(e) => setCompany((c) => ({ ...c, location: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL</label>
                <input
                  type="url"
                  value={company.logo_url}
                  onChange={(e) => setCompany((c) => ({ ...c, logo_url: e.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>
            </>
          )}

          {role === 'admin' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone number *</label>
                <input
                  type="tel"
                  value={admin.phone_number}
                  onChange={(e) => setAdmin((a) => ({ ...a, phone_number: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department *</label>
                <input
                  type="text"
                  value={admin.department}
                  onChange={(e) => setAdmin((a) => ({ ...a, department: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">University *</label>
                <input
                  type="text"
                  value={admin.university}
                  onChange={(e) => setAdmin((a) => ({ ...a, university: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
