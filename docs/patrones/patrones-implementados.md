## Patrones Implementados

### UI
- Presentational Components + Hooks: separar visual de lógica (p.ej. `PoseVisualizer` renderiza, `useErgonomicData` integra)
- Grid responsivo con Tailwind, tokens de tema en CSS variables

### Estado
- Store única con acciones puras (Zustand)
- Derivación mínima en componentes vía `useMemo`

### Integración Tiempo Real
- Conector dedicado (`useErgonomicData`) con reconexión y limpieza
- Adaptador de payload → modelo de dominio (`ErgonomicAnalysis`)

### Accesibilidad
- Foco visible, labels y roles, alto contraste `.hc`

### Resiliencia
- Debounce de alertas por métrica (30s)
- Manejo de cierre/errores de WebSocket


