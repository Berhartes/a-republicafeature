export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="rounded-md border border-muted p-6 text-muted-foreground">
        <h2 className="mb-2 text-lg font-semibold">Página não encontrada</h2>
        <p className="text-sm">Verifique a URL ou volte para a página inicial.</p>
        <a href="/" className="mt-4 inline-block rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
          Ir para o início
        </a>
      </div>
    </div>
  )
}