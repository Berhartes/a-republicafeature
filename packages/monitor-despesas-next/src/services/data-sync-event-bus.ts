type EventHandler = (payload?: unknown) => void

type EventKey =
  | 'PREMIACOES_PROCESSED'
  | 'PREMIACOES_CACHE_INVALIDATED'
  | string

type Namespace = 'Processador' | 'Premiacoes' | 'GlobalData' | string

interface Subscription {
  namespace: Namespace
  event: EventKey
  handler: EventHandler
}

class DataSyncEventBus {
  private subscriptions: Subscription[] = []

  subscribe(namespace: Namespace, event: EventKey, handler: EventHandler): () => void {
    const subscription: Subscription = { namespace, event, handler }
    this.subscriptions.push(subscription)

    return () => {
      this.subscriptions = this.subscriptions.filter(sub => sub !== subscription)
    }
  }

  notify(namespace: Namespace, event: EventKey, payload?: unknown): void {
    for (const subscription of this.subscriptions) {
      const matchesNamespace = subscription.namespace === namespace || subscription.namespace === '*'
      const matchesEvent = subscription.event === event || subscription.event === '*'
      if (matchesNamespace && matchesEvent) {
        try {
          subscription.handler(payload)
        } catch (error) {
          console.error('❌ [DataSyncEventBus] Handler error:', error)
        }
      }
    }
  }

  notifyCustomEvent(namespace: Namespace, event: EventKey, payload?: unknown): void {
    this.notify(namespace, event, payload)
  }

  clear(namespace?: Namespace): void {
    if (!namespace) {
      this.subscriptions = []
      return
    }

    this.subscriptions = this.subscriptions.filter(sub => sub.namespace !== namespace)
  }
}

export const dataSyncEventBus = new DataSyncEventBus()
