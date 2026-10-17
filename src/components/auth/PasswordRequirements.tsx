import { Check } from 'lucide-react'
import { PASSWORD_RULES } from '../../lib/validation'

interface PasswordRequirementsProps {
  password: string
}

/** Checklist ao vivo das regras de senha forte: cada item fica verde quando é cumprido. */
export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length
  const strength = passed / PASSWORD_RULES.length

  return (
    <div className="mt-3" aria-live="polite">
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength === 1 ? 'bg-emerald-500' : strength >= 0.6 ? 'bg-amber-400' : 'bg-blush-300'
          }`}
          style={{ width: `${strength * 100}%` }}
        />
      </div>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password)
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-600' : 'text-cocoa-muted'}`}
            >
              <span
                className={`grid size-4 shrink-0 place-items-center rounded-full border transition-colors ${
                  ok ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line'
                }`}
              >
                {ok && <Check className="size-2.5" strokeWidth={3.5} />}
              </span>
              {rule.label}
              <span className="sr-only">{ok ? '(cumprido)' : '(pendente)'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
