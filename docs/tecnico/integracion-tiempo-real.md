## Integración Tiempo Real (WebSocket)

### Endpoint
- `ws://127.0.0.1:5175/api/cv/stream`
- Frecuencia objetivo: ~10 Hz (100ms) según backend

### Formato esperado (adaptable)
```json
{
  "landmarks": { "points": [{ "x": 0.5, "y": 0.4 }] },
  "scores": { "neck": 8, "back": 6, "arms": 9, "overall": 7.5 },
  "statuses": { "neck": "warning", "back": "good", "arms": "good", "overall": "good" }
}
```

### Flujo
1. Conexión y escucha de mensajes
2. Adaptación de payload a `ErgonomicAnalysis`
3. Update de store global (`updateAnalysis`)
4. Reglas básicas de alertas en cliente (debounce 30s por métrica)

### Resiliencia
- Reintento de conexión (1.5s) si error/cierre
- Limpieza en `useEffect` al desmontar

### Rendimiento
- Canvas overlay: solo redibuja con cambios en `landmarks`
- Evitar renders innecesarios con `React.memo`


