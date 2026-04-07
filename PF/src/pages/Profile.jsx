import { useCallback, useEffect, useState } from 'react';
import { studentAPI, companyAPI, adminAPI } from '../services/api';
import EditProfileModal from '../components/profile/EditProfileModal';

function readUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Profile() {
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const role = user?.role;

  const loadProfile = useCallback(async () => {
    if (!role) return;
    setLoading(true);
    setLoadError('');
    try {
      let res;
      if (role === 'student') {
        res = await studentAPI.getProfile();
      } else if (role === 'company') {
        res = await companyAPI.getProfile();
      } else {
        res = await adminAPI.getProfile();
      }
      const data = res.data;
      setHasProfile(!!data.has_profile);
      setProfile(data.profile || null);
    } catch (e) {
      setLoadError(e.response?.data?.message || 'Failed to load profile.');
      setHasProfile(false);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    setUser(readUser());
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const onSaved = () => {
    loadProfile();
    setToast({ type: 'success', message: 'Profile saved successfully.' });
  };

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-100 max-w-sm rounded-xl px-4 py-3 shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-800'
              : 'bg-white border-red-200 text-red-800'
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Manage how you appear on Stag.io</p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Edit profile
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-100 bg-red-50 text-red-800 text-sm px-4 py-3">{loadError}</div>
      )}

      {!loading && !loadError && (
        <>
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="shrink-0">
                {role === 'company' && profile?.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt=""
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-semibold shadow-sm">
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold text-slate-900 truncate">{user.name || 'User'}</p>
                <p className="text-slate-500 text-sm mt-0.5 break-all">{user.email}</p>
                <span className="inline-block mt-3 text-xs font-medium uppercase tracking-wide text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {role}
                </span>
              </div>
            </div>
          </section>

          {!hasProfile && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 text-amber-900 text-sm px-4 py-3">
              Your profile is incomplete. Add your details to help others recognize you.
            </div>
          )}

          {role === 'student' && hasProfile && profile && (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Academic</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">University</dt>
                  <dd className="mt-1 text-slate-900">{profile.university || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Level</dt>
                  <dd className="mt-1 text-slate-900">{profile.level || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Major</dt>
                  <dd className="mt-1 text-slate-900">{profile.major || '—'}</dd>
                </div>
              </dl>

              <div>
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills || []).length ? (
                    profile.skills.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm">No skills listed</span>
                  )}
                </div>
              </div>

              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pt-2">Contact & links</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</dt>
                  <dd className="mt-1 text-slate-900">{profile.phone_number || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">GitHub</dt>
                  <dd className="mt-1">
                    {profile.github_url ? (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline break-all"
                      >
                        {profile.github_url}
                      </a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bio</dt>
                  <dd className="mt-1 text-slate-800 whitespace-pre-wrap">{profile.bio || '—'}</dd>
                </div>
              </dl>
            </section>
          )}

          {role === 'company' && hasProfile && profile && (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Company</h2>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</dt>
                <dd className="mt-1 text-slate-800 whitespace-pre-wrap">{profile.description || '—'}</dd>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Website</dt>
                  <dd className="mt-1">
                    {profile.website ? (
                      <a href={profile.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline break-all">
                        {profile.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</dt>
                  <dd className="mt-1 text-slate-900">{profile.location || '—'}</dd>
                </div>
              </dl>
            </section>
          )}

          {role === 'admin' && hasProfile && profile && (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Administration</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</dt>
                  <dd className="mt-1 text-slate-900">{profile.phone_number || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Department</dt>
                  <dd className="mt-1 text-slate-900">{profile.department || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">University</dt>
                  <dd className="mt-1 text-slate-900">{profile.university || '—'}</dd>
                </div>
              </dl>
            </section>
          )}
        </>
      )}

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        role={role}
        profile={profile}
        onSaved={onSaved}
      />
    </div>
  );
}
