## Guía de Frontend (React + Zustand + Tailwind)

### Principios
- TypeScript estricto y componentes funcionales con hooks.
- Estado global local-first con Zustand, sin side-effects en renders.
- Accesibilidad: roles, labels y focus visible.

### Estructura de Código
- `src/components`: UI atómica (PoseVisualizer, ScoreCard, AlertPanel, SettingsPanel, HeaderBar, DockMinibar)
- `src/store/ergonomicStore.ts`: estado global (monitoring, análisis, alertas, settings)
- `src/hooks/useErgonomicData.ts`: WebSocket y reconexión
- `shared/types.ts`: contratos compartidos y modelos de dominio

### Estado Global (Zustand)
```ts
interface ErgonomicStore {
  isMonitoring: boolean; isMinimized: boolean;
  currentAnalysis: ErgonomicAnalysis | null;
  alerts: ErgonomicAlert[]; settings: UserSettings;
  startMonitoring(); stopMonitoring(); toggleMinimized();
  updateAnalysis(a: ErgonomicAnalysis); pushAlert(a: ErgonomicAlert);
  dismissAlert(id: string); snoozeAlert(id: string, m: number);
}
```

### WebSocket (Tiempo real)
- Hook `useErgonomicData` conecta a `ws://127.0.0.1:5175/api/cv/stream`
- Reconexión con backoff corto (1.5s)
- Mapea payload a `ErgonomicAnalysis` y genera alertas básicas

### Estilos y Tema
- Tailwind `darkMode: 'class'`
- Variables CSS en `index.css` para tokens de color
- Alto contraste: clase `.hc`

### Rendimiento
- `React.memo` en componentes de alto refresco
- Canvas overlay redibuja al cambiar landmarks
- Limpieza de `MediaStream` al desmontar o cambiar cámara


