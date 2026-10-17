/** Sabores de cobertura: cada conta ganha sempre o mesmo, escolhido a partir do id. */
const FLAVORS = [
  { frosting: '#FF6B9D', background: '#FFF0F6' }, // morango
  { frosting: '#B9A3F5', background: '#F3EFFE' }, // lavanda
  { frosting: '#6FD1AE', background: '#EBFAF4' }, // menta
  { frosting: '#FFAE73', background: '#FFF3EA' }, // pêssego
  { frosting: '#9A6A55', background: '#F6EEEA' }, // chocolate
]

function flavorFor(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return FLAVORS[hash % FLAVORS.length]
}

interface CupcakeAvatarProps {
  /** Normalmente o id do usuário — define o sabor. */
  seed: string
  className?: string
}

/** Avatar de personagem: cupcake com carinha, cobertura colorida e cereja. */
export function CupcakeAvatar({ seed, className }: CupcakeAvatarProps) {
  const { frosting, background } = flavorFor(seed)

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="32" fill={background} />

      {/* Forminha */}
      <path d="M15 34h34l-4.6 21.5a2.5 2.5 0 0 1-2.45 2H22.05a2.5 2.5 0 0 1-2.45-2L15 34Z" fill="#FFD6E7" />
      <path d="M23 34l1.4 23M32 34v23.5M41 34l-1.4 23" stroke="#FFB8D1" strokeWidth="2" strokeLinecap="round" />

      {/* Cobertura */}
      <path
        d="M14 35c-5 0-6-8 0-9-1-6 5-9 9-7 2-6 10-7 12-3 4-4 12-1 11 4 5-1 9 5 5 8 5 2 3 7-2 7H14Z"
        fill={frosting}
      />
      <path
        d="M20 27l2-1M28 22.5l2 1M38 22l1.5-1.5M44 28.5l2 .5M33 29l1.5-1"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Cereja */}
      <path d="M33 13.5c.5-2.5 2-4 4-4.5" stroke="#5B8A3C" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="15.5" r="4" fill="#E8336F" />
      <circle cx="30.6" cy="14.2" r="1.1" fill="#fff" opacity="0.7" />

      {/* Carinha */}
      <circle cx="26" cy="43" r="2.3" fill="#4A2C2A" />
      <circle cx="38" cy="43" r="2.3" fill="#4A2C2A" />
      <circle cx="26.8" cy="42.2" r="0.7" fill="#fff" />
      <circle cx="38.8" cy="42.2" r="0.7" fill="#fff" />
      <path d="M29 47.5q3 2.6 6 0" stroke="#4A2C2A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="21.5" cy="47" rx="2.6" ry="1.6" fill="#FF6B9D" opacity="0.45" />
      <ellipse cx="42.5" cy="47" rx="2.6" ry="1.6" fill="#FF6B9D" opacity="0.45" />
    </svg>
  )
}
