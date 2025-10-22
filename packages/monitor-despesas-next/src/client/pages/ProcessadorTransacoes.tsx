import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProcessadorTransacoes() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Processador de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo de processamento de transações em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
