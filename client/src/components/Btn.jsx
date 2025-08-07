/* client/src/components/Btn.jsx */
export default function Btn({ className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 ${className}`}
    />
  );
}
