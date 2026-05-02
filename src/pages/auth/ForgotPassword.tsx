import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }: FormData) => {
    const { error } = await resetPassword(email)
    if (error) toast(error.message, 'error')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Recuperar senha</h1>
          <p className="mt-1 text-sm text-gray-500">Enviaremos um link para redefinir sua senha</p>
        </div>

        {isSubmitSuccessful ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            E-mail enviado! Verifique sua caixa de entrada.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Button type="submit" className="w-full" loading={isSubmitting}>Enviar link</Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/auth/login" className="font-medium text-indigo-600 hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </div>
  )
}
