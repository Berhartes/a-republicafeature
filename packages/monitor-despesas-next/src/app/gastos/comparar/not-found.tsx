export default function NotFound() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="rounded-md border border-muted p-4 text-muted-foreground">
        <p className="text-sm">Página de comparação não encontrada.</p>
        <a href="/gastos/comparar" className="mt-2 inline-block rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90">
          Voltar para comparar
        </a>
      </div>
    </div>
  )
}