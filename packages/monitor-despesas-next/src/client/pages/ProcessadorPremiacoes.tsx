import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProcessadorPremiacoes() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Processador de Premiações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo de processamento de premiações em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
