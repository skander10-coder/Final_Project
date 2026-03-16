export default function Table({ columns = [], data = [], onRowAction }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-slate-50/50 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-16 text-center text-slate-500">
          No data to display
        </div>
      )}
    </div>
  );
}
