interface SkeletonProps {
  className?: string
}

/** Bloco de carregamento com brilho deslizante (shimmer). */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}
