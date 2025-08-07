## Visión de Arquitectura

### Principios
- Separación de responsabilidades (UI, estado, integración tiempo real)
- Local-first, privacidad por diseño (procesamiento en dispositivo)
- Rendimiento: 60fps UI cuando sea posible

### Módulos
- UI (React + Tailwind)
- Estado (Zustand)
- Integración RT (`useErgonomicData`)
- Tipos compartidos (`shared/types.ts`)

### Flujo de Datos
```
WebSocket → useErgonomicData → store (Zustand) → componentes UI
```

### Componentes Core
- PoseVisualizer: video + canvas overlay
- ScoreCard: tarjetas métricas
- AlertPanel: notificaciones contextuales
- SettingsPanel: preferencias del usuario (tema, cámara, contraste)
- HeaderBar / DockMinibar: estados y modo minimizado

### Decisiones
- Tema con CSS variables para permitir handoff a diseño
- Dark mode controlado por clase (Tailwind)
- Alertas cliente con debounce para evitar fatiga


