import { Link } from 'react-router-dom';

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-slate-900">Account</h2>
        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
          Update your profile information, skills, and contact details from your profile page.
        </p>
        <Link
          to="/profile"
          className="inline-flex mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to profile
        </Link>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
        <p className="text-slate-500 text-sm mt-2">Notification preferences will be available here soon.</p>
      </section>
    </div>
  );
}
