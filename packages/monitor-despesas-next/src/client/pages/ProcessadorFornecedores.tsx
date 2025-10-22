import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProcessadorFornecedores() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Processador de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo de processamento de fornecedores em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
