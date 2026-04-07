export default function Modal({ isOpen, onClose, title, onSubmit, submitText, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">Fill in the details below</p>
        </div>
        
        {/* Form - children هنا نمرر الفورم */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}