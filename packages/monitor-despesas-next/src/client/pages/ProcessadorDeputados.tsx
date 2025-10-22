import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProcessadorDeputados() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Processador de Deputados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo de processamento de deputados em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
