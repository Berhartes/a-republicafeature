# 🎨 UI Components Library

Esta pasta contém componentes de interface reutilizáveis que garantem a consistência visual e funcional do projeto **Monitor de Despesas**.

## 📦 Estrutura

Os componentes são baseados em [Radix UI](https://www.radix-ui.com/) e estilizados com [Tailwind CSS](https://tailwindcss.com/), seguindo padrões de design modernos.

## 🧩 Componentes Principais

### Elementos Básicos
- **`button.tsx`**: Botões com variantes (`default`, `destructive`, `outline`, `ghost`, `link`) e tamanhos.
- **`badge.tsx`**: Etiquetas para status, categorias e contadores.
- **`card.tsx`**: Container padrão para agrupamento de conteúdo.
- **`input.tsx`**, **`label.tsx`**, **`select.tsx`**: Elementos de formulário.

### Feedback & Status
- **`toast.tsx` / `toaster.tsx`**: Notificações temporárias (sucesso, erro).
- **`alert.tsx`**: Mensagens de alerta em destaque.
- **`progress.tsx`**: Barras de progresso.
- **`skeleton.tsx`**: Placeholders de carregamento (loading states).

### Navegação & Estrutura
- **`tabs.tsx`**: Abas para alternar visualizações.
- **`table.tsx`**: Tabelas de dados estilizadas.
- **`scroll-area.tsx`**: Áreas com rolagem customizada.

### Interação Avançada
- **`dialog.tsx`**: Modais e janelas de diálogo.
- **`popover.tsx`**: Conteúdo flutuante acionado por clique.
- **`tooltip.tsx`**: Dicas de contexto ao passar o mouse.
- **`dropdown-menu.tsx`**: Menus de ação suspensos.
- **`slider.tsx`**: Seleção de valores em intervalo.
- **`switch.tsx`**: Alternadores (toggles).

### Visualização de Dados
- **`charts/`**: Componentes base para gráficos (Chart.js / Visx).

## 🚀 Como Usar

Importe os componentes usando o alias `@/ui`:

```tsx
import { Button } from '@/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card'

export default function MeuComponente() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título do Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Clique Aqui</Button>
      </CardContent>
    </Card>
  )
}
```

## ⚠️ Manutenção

- **Não duplique**: Antes de criar um novo componente de UI, verifique se ele já existe aqui.
- **Consistência**: Mantenha os padrões de estilo (Tailwind) e acessibilidade (Radix).
- **Escopo**: Componentes aqui devem ser agnósticos ao negócio (não devem conter lógica de "deputados" ou "fornecedores").
