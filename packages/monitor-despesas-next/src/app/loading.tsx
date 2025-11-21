export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
        <span>Carregando aplicação…</span>
      </div>
    </div>
  )
}