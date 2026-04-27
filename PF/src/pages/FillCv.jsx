import { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/ui/Card';

export default function FillCV() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    university: '',
    level: '',
    major: '',
    github_url: '',
    phone_number: '',
    bio: ''
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getProfile();
      if (res.data.success && res.data.has_profile) {
        const p = res.data.profile;
        setSkills(p.skills || []);
        setFormData({
          university: p.university || '',
          level: p.level || '',
          major: p.major || '',
          github_url: p.github_url || '',
          phone_number: p.phone_number || '',
          bio: p.bio || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.replace(/,/g, '').trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (i) => {
    setSkills(skills.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await studentAPI.updateProfile({ ...formData, skills });
      if (res.data.success) {
        setMessage({ type: 'success', text: ' CV saved successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || ' Error saving CV' });
    } finally {
      setSaving(false);
    }
  };

  const completionFields = [formData.university, formData.level, formData.major, skills.length > 0 ? 'ok' : ''];
  const completedCount = completionFields.filter(f => f && f.trim()).length;
  const completionPercentage = (completedCount / 4) * 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header Section */}
      <div className="relative bg-white border border-slate-100 rounded-2xl p-7 overflow-hidden flex items-start justify-between gap-4 shadow-sm">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-indigo-50 opacity-60 pointer-events-none" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-1">Stag.io — Student Portal</p>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            Your Professional CV
          </h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Fill in your details to get matched<br />with top internship opportunities.
          </p>
        </div>
        <div className="w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white border border-slate-100 rounded-xl px-5 py-4 flex items-center gap-5 flex-wrap shadow-sm">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-medium text-slate-400 mb-0.5">Completion</p>
          <p className="text-2xl font-semibold text-indigo-600 leading-none">{Math.round(completionPercentage)}%</p>
        </div>
        <div className="flex-1 min-w-[140px]">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{completedCount} of 4 required fields filled</p>
        </div>
        {completionPercentage === 100 && (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-medium">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
            Ready to apply
          </span>
        )}
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">

        {/* Toast Message */}
        {message.text && (
          <div className={`mx-5 mt-5 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {message.type === 'success'
              ? <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            }
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Academic Info Section */}
          <div>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Academic info</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    University <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block" />
                  </label>
                  <input
                    type="text" name="university" value={formData.university} onChange={handleChange} required
                    placeholder="e.g., USTHB, Constantine 2"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    Level <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block" />
                  </label>
                  <select
                    name="level" value={formData.level} onChange={handleChange} required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                  >
                    <option value="">Select level</option>
                    {['L1','L2','L3','M1','M2','PhD'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  Major <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block" />
                </label>
                <input
                  type="text" name="major" value={formData.major} onChange={handleChange} required
                  placeholder="e.g., Computer Science, Software Engineering"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="border-t border-slate-100">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Skills</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  Technical skills <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block" />
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <input
                    type="text" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKey}
                    placeholder="Type a skill and press Enter or comma"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Press Enter or , to add a skill</p>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-medium">
                      {s}
                      <button type="button" onClick={() => removeSkill(i)} className="text-indigo-400 hover:text-indigo-700 transition-colors leading-none text-base">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact & Links Section */}
          <div className="border-t border-slate-100">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Contact & links</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">GitHub URL</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <input
                      type="url" name="github_url" value={formData.github_url} onChange={handleChange}
                      placeholder="github.com/username"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Phone number</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <input
                      type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange}
                      placeholder="+213 5XX XXX XXX"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="border-t border-slate-100">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">About you</span>
            </div>
            <div className="p-5 space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Bio</label>
              <div className="relative">
                <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <textarea
                  name="bio" value={formData.bio} onChange={handleChange}
                  rows={4} maxLength={400}
                  placeholder="Tell recruiters about your goals, interests, and what kind of internship you're looking for..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 text-right">{formData.bio.length} / 400</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save CV
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Pro Tip Card */}
      <div className="bg-white border-l-4 border-l-indigo-500 border border-slate-100 rounded-xl px-5 py-4 flex gap-3 items-start shadow-sm">
        <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-slate-800">Pro tip</p>
          <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
            A complete CV with at least 5 skills and a clear bio increases your match rate significantly. Companies on Stag.io search by major, level, and skills — make sure yours are accurate.
          </p>
        </div>
      </div>
    </div>
  );
}