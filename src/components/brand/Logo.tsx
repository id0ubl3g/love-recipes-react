interface CupcakeIconProps {
  className?: string
}

/** Cupcake em traço único — símbolo da marca. Herda a cor via currentColor. */
export function CupcakeIcon({ className }: CupcakeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5.5 11.5a3 3 0 0 1 1.7-5.4 4.9 4.9 0 0 1 9.6 0 3 3 0 0 1 1.7 5.4" />
      <path d="M4.5 11.5h15l-1.6 8.1a1 1 0 0 1-1 .9H7.1a1 1 0 0 1-1-.9z" />
      <path d="M10 11.5v9M14 11.5v9" />
      <circle cx="12" cy="2.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Logo() {
  return (
    <a href="#/" className="flex items-center gap-2" aria-label="Love Recipes — início">
      <CupcakeIcon className="size-6 text-blush-500" />
      <span className="text-[17px] font-semibold tracking-tight text-cocoa">
        love<span className="text-blush-500">recipes</span>
      </span>
    </a>
  )
}
