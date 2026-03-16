export default function Card({ children, className = '', variant = 'default', ...props }) {
  const baseStyles = 'rounded-2xl bg-white border border-slate-100 shadow-sm';
  const variants = {
    default: '',
    hero: 'overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0 shadow-lg',
    elevated: 'shadow-md hover:shadow-lg transition-shadow',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
