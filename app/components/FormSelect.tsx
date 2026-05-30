export default function FormSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-muted">{label}</span>
      <select
        {...props}
        className="px-3 py-2 rounded-md border border-hairline bg-canvas text-sm h-11"
      >
        {children}
      </select>
    </label>
  )
}
