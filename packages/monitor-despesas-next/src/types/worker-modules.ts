type WorkerConstructor = { new (): Worker }

declare module '@/workers/transacoes.worker.ts?worker' {
  const WorkerFactory: WorkerConstructor
  export default WorkerFactory
}
