import { LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { AuthLayout } from '../components/auth/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { PasswordRequirements } from '../components/auth/PasswordRequirements'
import { PASSWORD_MAX, validateNewPassword } from '../lib/validation'

const inputClass =
  'h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-cocoa transition-colors placeholder:text-cocoa-muted/60 focus:border-blush-300 focus:ring-2 focus:ring-blush-100 focus:outline-none'

/** Aberta pelo link de "esqueci minha senha": define a senha nova. */
export function ResetPassword() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const problem = validateNewPassword(password)
    if (problem) return setError(problem)
    if (password !== confirm) return setError('As senhas não são iguais.')
    setSubmitting(true)
    try {
      await updatePassword(password)
      toast.success('Senha atualizada! Bom apetite.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar a senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold text-cocoa">Crie uma nova senha</h1>
      <p className="mt-2 text-sm text-cocoa-muted">Escolha uma senha que você vá lembrar.</p>
      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-8 space-y-4">
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-cocoa">
            Nova senha
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            placeholder="Crie uma senha forte"
            maxLength={PASSWORD_MAX}
            className={inputClass}
          />
          <PasswordRequirements password={password} />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-cocoa">
            Confirme a nova senha
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              setError('')
            }}
            className={inputClass}
          />
        </div>
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
          Salvar nova senha
        </button>
      </form>
    </AuthLayout>
  )
}
