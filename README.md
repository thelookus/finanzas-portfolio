# Finance Dashboard

Dashboard personal para seguimiento de portfolio de acciones, análisis técnico y detección de oportunidades de compra.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React Server Components)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui (Radix UI)
- **Iconos:** Phosphor Icons
- **Charts:** Recharts, Lightweight Charts (candlestick)
- **Datos:** Yahoo Finance 2 (cotizaciones en tiempo real)
- **Análisis:** technicalindicators (RSI, SMA, MACD, Bollinger Bands)
- **Package Manager:** pnpm

## Inicio rápido

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Estructura del proyecto

```
app/
├── page.tsx                    # Dashboard principal (portfolio)
├── opportunities/page.tsx      # Scanner de oportunidades de compra
├── stocks/[ticker]/page.tsx    # Detalle de acción individual
├── watchlist/page.tsx          # Watchlist
├── layout.tsx                  # Layout con navegación (sidebar + mobile)
└── api/
    ├── portfolio/              # CRUD de portfolio y dividendos
    │   ├── route.ts            # GET / POST / DELETE transacciones
    │   └── dividend/route.ts   # POST dividendos
    ├── opportunities/route.ts  # GET count de oportunidades hot
    ├── analysis/route.ts       # Análisis técnico
    ├── quotes/route.ts         # Cotizaciones en tiempo real
    └── watchlist/route.ts      # CRUD watchlist

components/
├── dashboard/
│   ├── portfolio-summary.tsx   # Cards resumen (valor, invertido, P&L, cambio diario)
│   ├── holdings-table.tsx      # Tabla de posiciones
│   ├── transaction-history.tsx # Historial de transacciones (con eliminar)
│   ├── dividend-tracker.tsx    # Tracker de dividendos (con agregar)
│   └── add-transaction-dialog.tsx # Modal para agregar compras
├── stocks/
│   ├── technical-panel.tsx     # Panel de análisis técnico (RSI, SMA, MACD, Bollinger)
│   ├── fundamentals-card.tsx   # Fundamentales (P/E, Market Cap, etc.)
│   └── position-card.tsx       # Detalle de posición del usuario
├── charts/
│   ├── allocation-chart.tsx    # Torta de asignación
│   ├── pnl-chart.tsx           # Gráfico P&L
│   └── price-chart.tsx         # Velas (candlestick)
├── nav/
│   ├── nav-links.tsx           # Navegación desktop/mobile con estado activo
│   └── opportunity-badge.tsx   # Badge de notificación (oportunidades 70+)
├── opportunities/
│   └── guide-dialog.tsx        # Modal guía "Cómo leer esto?"
└── ui/                         # Componentes shadcn/ui
    ├── info-tooltip.tsx        # Tooltip explicativo (hover desktop, tap mobile)
    ├── button.tsx, card.tsx, dialog.tsx, input.tsx,
    │   table.tsx, tabs.tsx, tooltip.tsx, badge.tsx, skeleton.tsx

lib/
├── portfolio.ts          # Lectura/escritura de portfolio.json (CRUD)
├── yahoo-finance.ts      # Integración Yahoo Finance API
├── calculations.ts       # Cálculos financieros (P&L, pesos, promedios)
├── technical-analysis.ts # Cómputo de indicadores técnicos
├── scanner.ts            # Scoring de oportunidades (0-100)
├── utils.ts              # Utilidades (cn)
└── hooks/
    └── use-market-data.ts

data/
├── portfolio.json        # Holdings, transacciones y dividendos
└── watchlist.json        # Tickers en watchlist

types/
└── index.ts              # Tipos TypeScript centralizados
```

## Funcionalidades

### Portfolio Dashboard
- Resumen con 4 cards: valor total, invertido, P&L y cambio diario
- Tabla de holdings con precio, P&L, cambio diario y peso
- Gráficos de asignación (torta) y P&L (barras)
- Historial de transacciones con búsqueda y eliminación
- Tracker de dividendos con formulario para agregar

### CRUD de Transacciones
- **Agregar compra:** botón "Add Purchase" en el dashboard, dialog con cálculo automático de precio por acción
- **Eliminar transacción:** botón trash en cada fila del historial, con confirmación
- **Agregar dividendo:** formulario inline en el tracker de dividendos
- Recálculo automático de totales al modificar datos

### Detalle de Acción (`/stocks/[ticker]`)
- Gráfico de velas (candlestick) con múltiples períodos
- Panel de análisis técnico: RSI, SMA(20/50/200), MACD, Bollinger Bands
- Fundamentales: Market Cap, P/E, Dividend Yield, 52W range, targets de analistas
- Detalle de tu posición con historial de compras

### Scanner de Oportunidades (`/opportunities`)
- Analiza holdings + watchlist (no busca acciones nuevas)
- Score 0-100 basado en RSI, SMA200, 52W low, analyst target, MACD, Bollinger
- Colores: verde (70+) buena oportunidad, amarillo (50-69) neutral, rojo (<50) no es momento
- Badge de notificación en la navegación cuando hay oportunidades con score 70+
- Modal guía "Cómo leer esto?" con explicación completa del scoring

### UX
- Tooltips explicativos en todas las métricas financieras (español, para usuarios no expertos)
- Los tooltips funcionan con hover en desktop y tap en mobile
- Navegación con estado activo (icono filled + highlight) en desktop y mobile
- Dark mode por defecto
- Responsive: sidebar en desktop, bottom nav en mobile

## Scripts

```bash
pnpm dev       # Desarrollo (http://localhost:3000)
pnpm build     # Build de producción
pnpm start     # Servidor de producción
pnpm lint      # ESLint
```
