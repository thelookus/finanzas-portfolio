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

## Datos de Mercado: Yahoo Finance

La app consume datos financieros de **Yahoo Finance** a través de la librería [`yahoo-finance2`](https://www.npmjs.com/package/yahoo-finance2) (v3). Es un wrapper no-oficial que no requiere API key — hace requests directos a los endpoints de Yahoo.

### Funciones principales (`lib/yahoo-finance.ts`)

| Función | Qué trae | Dónde se usa |
|---------|----------|-------------|
| `getQuote(ticker)` | Precio actual, cambio diario, P/E, market cap, 52W high/low, targets de analistas | Dashboard, Watchlist, Stock page |
| `getQuotes(tickers[])` | Batch de quotes (llama `getQuote` en paralelo con `Promise.allSettled`) | Dashboard, Opportunities |
| `getChart(ticker, range)` | **Datos históricos** — velas OHLCV (open, high, low, close, volume) | Stock page, Opportunities, DCA |
| `getQuoteSummary(ticker)` | Datos fundamentales profundos (financialData, earnings, keyStats) | AI Analysis route |

### Datos históricos: `getChart`

```
getChart("AAPL", "1y")
   ↓
yahoo-finance2.chart("AAPL", { period1: hace1año, interval: "1d" })
   ↓
Yahoo Finance API responde con array de velas
   ↓
Se filtra nulls y mapea a CandleData { date, open, high, low, close, volume }
```

**Rangos disponibles y sus intervalos:**

| Range | Intervalo | Datos aprox |
|-------|-----------|------------|
| `1mo` | 1 día | ~22 velas |
| `3mo` | 1 día | ~65 velas |
| `6mo` | 1 día | ~130 velas |
| `1y` | 1 día | ~252 velas |
| `2y` | 1 semana | ~104 velas |
| `5y` | 1 semana | ~260 velas |

### Flujo completo en la Stock Page

```
app/stocks/[ticker]/page.tsx  (client component)
   ↓  fetch(`/api/analysis?ticker=AAPL&range=6mo`)
app/api/analysis/route.ts  (API route)
   ↓  getChart("AAPL", "6mo") + getQuote("AAPL")
lib/yahoo-finance.ts  →  yahoo-finance2  →  Yahoo Finance API
   ↓
computeTechnicalAnalysis(candles)  →  RSI, SMA, MACD, Bollinger
   ↓
Response: { candles, analysis, quote }
   ↓
PriceChart renders candles  +  TechnicalPanel shows indicators
```

### Flujo en Opportunities

```
app/opportunities/page.tsx  (server component)
   ↓  getChart(ticker, "1y") para cada ticker
lib/yahoo-finance.ts  →  Yahoo Finance
   ↓
computeTechnicalAnalysis  →  scoreOpportunity  →  Score 0-100
```

### Datos locales (no Yahoo Finance)

Los holdings, transacciones y dividendos se guardan localmente en `data/portfolio.json`. Yahoo solo provee precios de mercado en tiempo real e históricos.

### Resumen

- **Fuente única:** Yahoo Finance (gratis, sin API key)
- **Librería:** `yahoo-finance2` v3
- **Datos históricos:** Método `.chart()` con velas OHLCV diarias/semanales
- **Análisis técnico:** Se computa localmente con `technicalindicators` (RSI, SMA, EMA, MACD, Bollinger) a partir de los precios de cierre de las velas
- **Cache:** La API route `/api/analysis` cachea 5 min (`s-maxage=300`)

## Scripts

```bash
pnpm dev       # Desarrollo (http://localhost:3000)
pnpm build     # Build de producción
pnpm start     # Servidor de producción
pnpm lint      # ESLint
```
