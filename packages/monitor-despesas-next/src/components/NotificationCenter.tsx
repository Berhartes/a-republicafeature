import { useEffect, useState, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, X, AlertTriangle, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'alert' | 'info' | 'success' | 'warning'
  title: string
  description: string
  timestamp: Date
  read: boolean
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationCenterProps {
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationCenter({ onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    if (!notificationsEnabled) return

    const mockNotifications = [
      {
        id: '1',
        type: 'alert' as const,
        title: 'Novo alerta detectado',
        description: 'Superfaturamento em combustível - Deputado João Silva',
        timestamp: new Date(),
        read: false,
        icon: <AlertTriangle className="h-4 w-4" />
      },
      {
        id: '2',
        type: 'warning' as const,
        title: 'Limite excedido',
        description: 'Deputado Maria Santos ultrapassou o limite mensal',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        id: '3',
        type: 'info' as const,
        title: 'Análise concluída',
        description: '523 registros processados com sucesso',
        timestamp: new Date(Date.now() - 7200000),
        read: true,
        icon: <Users className="h-4 w-4" />
      }
    ]

    const interval = setInterval(() => {
      const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)]
      const newNotification: Notification = {
        ...randomNotification,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false
      }
      
      setNotifications(prev => [newNotification, ...prev].slice(0, 10))
    }, 30000)

    return () => clearInterval(interval)
  }, [notificationsEnabled])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'success': return 'text-green-600 bg-green-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    return `${days}d atrás`
  }

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        {notificationsEnabled ? (
          <Bell className="h-5 w-5" />
        ) : (
          <BellOff className="h-5 w-5" />
        )}
        {unreadCount > 0 && notificationsEnabled && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Painel de Notificações */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notificações</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  {notificationsEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                  >
                    Limpar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar notificações"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50/50"
                    )}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (onNotificationClick) {
                        onNotificationClick(notification)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        getNotificationColor(notification.type)
                      )}>
                        {notification.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            aria-label="Remover notificação"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </span>
                          {notification.action && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                notification.action?.onClick()
                              }}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
