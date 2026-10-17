import { ArrowLeft, Eye, EyeOff, LoaderCircle, MailCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { GoogleButton } from '../components/auth/GoogleButton'
import { PasswordRequirements } from '../components/auth/PasswordRequirements'
import { useAuth } from '../hooks/useAuth'
import {
  EMAIL_MAX,
  NAME_MAX,
  PASSWORD_MAX,
  normalizeEmail,
  normalizeName,
  validateEmail,
  validateName,
  validateNewPassword,
} from '../lib/validation'

type Mode = 'entrar' | 'criar' | 'esqueci'


/** O botão do Google só aparece depois de configurar o provedor no Supabase (ver SUPABASE_SETUP.md). */
const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true'

const inputClass =
  'h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-cocoa transition-colors placeholder:text-cocoa-muted/60 focus:border-blush-300 focus:ring-2 focus:ring-blush-100 focus:outline-none'

export function AuthPage() {
  const { signIn, signUp, sendPasswordReset } = useAuth()
  const [mode, setMode] = useState<Mode>('entrar')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  /** Mensagem de "confira seu e-mail" depois de criar conta ou pedir nova senha. */
  const [sentTo, setSentTo] = useState<{ email: string; reason: 'confirmar' | 'senha' } | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setPassword('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const cleanEmail = normalizeEmail(email)
    const problem =
      (mode === 'criar' ? validateName(name) : null) ??
      validateEmail(email) ??
      (mode === 'criar' ? validateNewPassword(password) : null) ??
      (mode === 'entrar' && !password ? 'Digite sua senha.' : null)
    if (problem) return setError(problem)

    setSubmitting(true)
    try {
      if (mode === 'entrar') {
        await signIn(cleanEmail, password)
      } else if (mode === 'criar') {
        const { needsConfirmation } = await signUp(normalizeName(name), cleanEmail, password)
        if (needsConfirmation) setSentTo({ email: cleanEmail, reason: 'confirmar' })
      } else {
        await sendPasswordReset(cleanEmail)
        setSentTo({ email: cleanEmail, reason: 'senha' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <AuthLayout>
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush-50 text-blush-500">
            <MailCheck className="size-7" strokeWidth={1.75} />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold text-cocoa">Confira seu e-mail</h1>
          <p className="mt-3 text-sm leading-relaxed text-cocoa-muted">
            {sentTo.reason === 'confirmar'
              ? 'Enviamos um link de confirmação para '
              : 'Se existir uma conta, enviamos um link para criar uma nova senha em '}
            <span className="font-semibold text-cocoa">{sentTo.email}</span>.
            {sentTo.reason === 'confirmar' && ' Clique nele para ativar sua conta e entrar.'}
          </p>
          <p className="mt-2 text-xs text-cocoa-muted">Não chegou? Olhe a caixa de spam.</p>
          <button
            type="button"
            onClick={() => {
              setSentTo(null)
              switchMode('entrar')
            }}
            className="mt-8 text-sm font-medium text-blush-500 hover:text-blush-600"
          >
            Voltar para o login
          </button>
        </div>
      </AuthLayout>
    )
  }

  const titles: Record<Mode, { title: string; subtitle: string; submit: string }> = {
    entrar: { title: 'Que bom te ver!', subtitle: 'Entre para ver suas receitas.', submit: 'Entrar' },
    criar: { title: 'Crie sua conta', subtitle: 'Comece seu livro de receitas em segundos.', submit: 'Criar conta' },
    esqueci: {
      title: 'Esqueceu a senha?',
      subtitle: 'Digite seu e-mail e enviaremos um link para criar uma nova.',
      submit: 'Enviar link',
    },
  }
  const copy = titles[mode]

  return (
    <AuthLayout>
      {mode === 'esqueci' && (
        <button
          type="button"
          onClick={() => switchMode('entrar')}
          className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-cocoa-muted hover:text-cocoa"
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>
      )}

      <h1 className="font-display text-3xl font-semibold text-cocoa">{copy.title}</h1>
      <p className="mt-2 text-sm text-cocoa-muted">{copy.subtitle}</p>

      {mode !== 'esqueci' && (
        <div role="tablist" aria-label="Entrar ou criar conta" className="mt-8 flex rounded-full bg-blush-50 p-1">
          {(['entrar', 'criar'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              onClick={() => switchMode(tab)}
              className="relative flex-1 rounded-full py-2 text-sm font-medium transition-colors"
            >
              {mode === tab && (
                <motion.span
                  layoutId="auth-tab"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  className="absolute inset-0 rounded-full bg-white shadow-soft"
                />
              )}
              <span className={`relative ${mode === tab ? 'text-blush-500' : 'text-cocoa-muted'}`}>
                {tab === 'entrar' ? 'Entrar' : 'Criar conta'}
              </span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-6 space-y-4">
        <AnimatePresence initial={false}>
          {mode === 'criar' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Field label="Nome" htmlFor="auth-name">
                <input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  maxLength={NAME_MAX}
                  placeholder="Como podemos te chamar?"
                  className={inputClass}
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="E-mail" htmlFor="auth-email">
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={EMAIL_MAX}
            placeholder="voce@email.com"
            className={inputClass}
          />
        </Field>

        {mode !== 'esqueci' && (
          <Field
            label="Senha"
            htmlFor="auth-password"
            action={
              mode === 'entrar' && (
                <button
                  type="button"
                  onClick={() => switchMode('esqueci')}
                  className="text-xs font-medium text-blush-500 hover:text-blush-600"
                >
                  Esqueci minha senha
                </button>
              )
            }
          >
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'criar' ? 'new-password' : 'current-password'}
                placeholder={mode === 'criar' ? 'Crie uma senha forte' : 'Sua senha'}
                maxLength={PASSWORD_MAX}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-cocoa-muted hover:text-cocoa"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === 'criar' && <PasswordRequirements password={password} />}
          </Field>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-blush-500 text-sm font-semibold text-white transition-colors hover:bg-blush-600 disabled:opacity-60"
        >
          {submitting && <LoaderCircle className="size-4 animate-spin" />}
          {copy.submit}
        </button>
      </form>

      {GOOGLE_ENABLED && mode !== 'esqueci' && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-cocoa-muted">
            <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton />
        </>
      )}
    </AuthLayout>
  )
}

interface FieldProps {
  label: string
  htmlFor: string
  action?: ReactNode
  children: ReactNode
}

function Field({ label, htmlFor, action, children }: FieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-cocoa">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}
