export default function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="ml-2">Carregando fornecedores…</span>
    </div>
  )
}