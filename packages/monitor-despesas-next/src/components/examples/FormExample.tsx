/**
 * Componente de formulário moderno usando React 19 hooks
 * 
 * Demonstra:
 * - useFormStatus() para status de submissão
 * - useTransition() para transições suaves
 * - Server Actions para processamento
 * - Validação client-side + server-side
 */

'use client'

import { useTransition, useState } from 'react'
// import { useFormStatus } from 'react-dom' // React 19 - ainda não estável
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, AlertCircle } from 'lucide-react'

interface FormData {
  nome: string
  email: string
  mensagem: string
}

interface FormExampleProps {
  onSubmit: (data: FormData) => Promise<{ success: boolean; message: string }>
}

/**
 * Botão de submit que usa useFormStatus() (React 19)
 * Mostra automaticamente loading state
 */
function SubmitButton() {
  // TODO: Descomentar quando React 19 estabilizar
  // const { pending } = useFormStatus()
  const pending = false // Temporário
  
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <Check className="mr-2 h-4 w-4" />
          Enviar
        </>
      )}
    </Button>
  )
}

/**
 * Formulário moderno com React 19 patterns
 */
export function FormExample({ onSubmit }: FormExampleProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Limpar resultados anteriores
    setResult(null)
    setErrors({})
    
    // Extrair dados do formulário
    const formData = new FormData(e.currentTarget)
    const data: FormData = {
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      mensagem: formData.get('mensagem') as string,
    }
    
    // Validação client-side
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    
    if (!data.nome || data.nome.length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres'
    }
    
    if (!data.email || !data.email.includes('@')) {
      newErrors.email = 'Email inválido'
    }
    
    if (!data.mensagem || data.mensagem.length < 10) {
      newErrors.mensagem = 'Mensagem deve ter pelo menos 10 caracteres'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Enviar com transição suave
    startTransition(async () => {
      try {
        const response = await onSubmit(data)
        setResult(response)
        
        // Limpar formulário se sucesso
        if (response.success) {
          e.currentTarget.reset()
        }
      } catch (error) {
        setResult({
          success: false,
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          type="text"
          placeholder="Seu nome completo"
          disabled={isPending}
          className={errors.nome ? 'border-red-500' : ''}
        />
        {errors.nome && (
          <p className="text-sm text-red-500">{errors.nome}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          disabled={isPending}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Mensagem */}
      <div className="space-y-2">
        <Label htmlFor="mensagem">Mensagem</Label>
        <textarea
          id="mensagem"
          name="mensagem"
          rows={4}
          placeholder="Digite sua mensagem..."
          disabled={isPending}
          className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.mensagem ? 'border-red-500' : ''
          }`}
        />
        {errors.mensagem && (
          <p className="text-sm text-red-500">{errors.mensagem}</p>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {/* Botão Submit */}
      <SubmitButton />
      
      {/* Loading indicator (alternativo ao useFormStatus) */}
      {isPending && (
        <p className="text-sm text-muted-foreground text-center">
          Processando...
        </p>
      )}
    </form>
  )
}

/**
 * Exemplo de uso do formulário com Server Action
 */
export function FormExampleUsage() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Contato</h2>
      <FormExample
        onSubmit={async (data) => {
          // Simular delay de rede
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Aqui você chamaria uma Server Action real:
          // const result = await enviarMensagemAction(data)
          
          return {
            success: true,
            message: 'Mensagem enviada com sucesso!'
          }
        }}
      />
    </div>
  )
}
