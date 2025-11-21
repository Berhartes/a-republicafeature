#!/usr/bin/env tsx

/**
 * Sistema de Alertas para Pipeline
 * 
 * Envia notificações via Slack/Discord quando eventos de falha ocorrem.
 * 
 * Uso:
 *   pnpm tsx scripts/alert.ts --event-type etl_run_manifest --status failure
 *   SLACK_WEBHOOK_URL=https://... pnpm tsx scripts/alert.ts --file observability-events.json
 * 
 * @author A República
 * @since Nov 2025
 */

// ========================================
// Types
// ========================================

interface PipelineEvent {
  type: string
  timestamp: string
  status: 'success' | 'failure' | 'warning' | 'unknown'
  metadata: Record<string, unknown>
}

interface AlertOptions {
  webhookUrl?: string
  eventFile?: string
  eventType?: string
  status?: string
}

// ========================================
// Alert Senders
// ========================================

/**
 * Envia alerta via Slack
 */
async function sendSlackAlert(event: PipelineEvent, webhookUrl: string): Promise<void> {
  const statusEmoji =
    event.status === 'failure' ? '🚨' : event.status === 'warning' ? '⚠️' : 'ℹ️'

  const payload = {
    text: `${statusEmoji} Pipeline Alert: ${event.type}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji} Pipeline: ${event.type}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status:*\n${event.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Timestamp:*\n${new Date(event.timestamp).toLocaleString('pt-BR')}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Metadata:*\n\`\`\`${JSON.stringify(event.metadata, null, 2)}\`\`\``,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📚 Ver Runbook' },
            url: 'https://github.com/Berhartes/arepublica-brasileira/blob/main/docs/11-tools/RUNBOOK_PIPELINE.md',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '📊 Ver Logs' },
            url: 'https://github.com/Berhartes/arepublica-brasileira/actions',
          },
        ],
      },
    ],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`)
    }

    console.log('✅ Alerta enviado para Slack')
  } catch (error) {
    console.error('❌ Erro ao enviar alerta Slack:', error)
    throw error
  }
}

/**
 * Envia alerta via Discord
 */
async function sendDiscordAlert(event: PipelineEvent, webhookUrl: string): Promise<void> {
  const statusColor =
    event.status === 'failure' ? 0xff0000 : event.status === 'warning' ? 0xffa500 : 0x0099ff

  const payload = {
    embeds: [
      {
        title: `Pipeline Alert: ${event.type}`,
        color: statusColor,
        fields: [
          {
            name: 'Status',
            value: event.status,
            inline: true,
          },
          {
            name: 'Timestamp',
            value: new Date(event.timestamp).toLocaleString('pt-BR'),
            inline: true,
          },
          {
            name: 'Metadata',
            value: `\`\`\`json\n${JSON.stringify(event.metadata, null, 2)}\`\`\``,
          },
        ],
        footer: {
          text: 'A República - Pipeline Observability',
        },
      },
    ],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`)
    }

    console.log('✅ Alerta enviado para Discord')
  } catch (error) {
    console.error('❌ Erro ao enviar alerta Discord:', error)
    throw error
  }
}

// ========================================
// Event Processing
// ========================================

/**
 * Processa eventos e envia alertas quando necessário
 */
async function processEvents(events: PipelineEvent[], webhookUrl: string): Promise<void> {
  const alertableEvents = events.filter(
    (e) => e.status === 'failure' || e.status === 'warning'
  )

  if (alertableEvents.length === 0) {
    console.log('✅ Nenhum evento requer alerta')
    return
  }

  console.log(`📨 Enviando alertas para ${alertableEvents.length} eventos...`)

  for (const event of alertableEvents) {
    try {
      // Detectar tipo de webhook (Slack vs Discord)
      if (webhookUrl.includes('slack.com')) {
        await sendSlackAlert(event, webhookUrl)
      } else if (webhookUrl.includes('discord.com')) {
        await sendDiscordAlert(event, webhookUrl)
      } else {
        console.warn('⚠️  Webhook URL não reconhecida, assumindo Slack')
        await sendSlackAlert(event, webhookUrl)
      }
    } catch (error) {
      console.error(`❌ Falha ao enviar alerta para ${event.type}:`, error)
    }
  }
}

/**
 * Cria evento manualmente (para testes)
 */
function createManualEvent(type: string, status: string): PipelineEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    status: status as 'success' | 'failure' | 'warning' | 'unknown',
    metadata: {
      manual: true,
      description: 'Evento criado manualmente para teste de alertas',
    },
  }
}

// ========================================
// CLI
// ========================================

async function main() {
  const args = process.argv.slice(2)
  const options: AlertOptions = {}

  // Parse args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      options.eventFile = args[i + 1]
      i++
    } else if (args[i] === '--event-type' && args[i + 1]) {
      options.eventType = args[i + 1]
      i++
    } else if (args[i] === '--status' && args[i + 1]) {
      options.status = args[i + 1]
      i++
    }
  }

  // Webhook URL (obrigatório)
  options.webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL

  if (!options.webhookUrl) {
    console.error('❌ Erro: SLACK_WEBHOOK_URL ou DISCORD_WEBHOOK_URL não definido')
    console.error()
    console.error('Uso:')
    console.error('  export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...')
    console.error('  pnpm tsx scripts/alert.ts --file observability-events.json')
    console.error()
    console.error('Ou para teste manual:')
    console.error('  export SLACK_WEBHOOK_URL=https://...')
    console.error('  pnpm tsx scripts/alert.ts --event-type etl_run --status failure')
    process.exit(1)
  }

  try {
    let events: PipelineEvent[] = []

    // Opção 1: Carregar de arquivo JSON
    if (options.eventFile) {
      console.log(`📂 Carregando eventos de: ${options.eventFile}`)
      const fs = await import('fs/promises')
      const content = await fs.readFile(options.eventFile, 'utf-8')
      events = JSON.parse(content)
    }
    // Opção 2: Criar evento manual
    else if (options.eventType && options.status) {
      console.log(`🔧 Criando evento manual: ${options.eventType} (${options.status})`)
      events = [createManualEvent(options.eventType, options.status)]
    }
    // Opção 3: Erro - precisa de uma das opções
    else {
      console.error('❌ Erro: Especifique --file ou (--event-type + --status)')
      process.exit(1)
    }

    await processEvents(events, options.webhookUrl)

    console.log('\n✅ Alertas processados com sucesso')
  } catch (error) {
    console.error('❌ Erro fatal ao processar alertas:', error)
    process.exit(1)
  }
}

main()
