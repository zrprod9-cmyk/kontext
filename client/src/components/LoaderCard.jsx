/* client/src/components/LoaderCard.jsx */
export default function LoaderCard() {
  return (
    <div className="flex h-[310px] flex-col rounded-lg bg-muted/40 p-3 shadow">
      <div className="flex flex-1 items-center justify-center">
        <svg
          className="h-10 w-10 animate-spin text-primary"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            d="M22 12a10 10 0 01-10 10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
