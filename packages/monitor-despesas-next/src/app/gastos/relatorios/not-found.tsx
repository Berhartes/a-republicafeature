export default function NotFound() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="rounded-md border border-muted p-4 text-muted-foreground">
        <p className="text-sm">Página de relatórios não encontrada.</p>
        <a href="/gastos/relatorios" className="mt-2 inline-block rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90">
          Voltar para relatórios
        </a>
      </div>
    </div>
  )
}