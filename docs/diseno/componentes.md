## Inventario de Componentes (UI)

### Estructura General del Dashboard
```
HeaderBar: estado | acciones (minimizar/restaurar)

Grid principal (xl: 2 columnas)
- Columna izquierda (Live Camera)
  - PoseVisualizer (video + overlay esqueleto)
- Columna derecha
  - ScoreCards (neck, back, arms, overall)
  - AlertPanel (lista de alertas)

Sección inferior
- SettingsPanel (ajustes rápidos)

DockMinibar (modo minimizado, flotante)
```

### Componentes
- PoseVisualizer
  - Rol: Visualizar cámara con overlay de esqueleto
  - Estados: Overlay on/off, sin cámara
  - Accesibilidad: Provide alt/labels en contenedores

- ScoreCard (4 variantes por categoría)
  - Muestra puntaje (1–10) y estado (good/warning/critical)
  - Indicador de tendencia (▲ ▼ ▪)

- AlertPanel
  - Lista de alertas con acciones (Posponer, Descartar)
  - Contenido: título, mensaje, recomendación

- SettingsPanel
  - Controles: selección de cámara, tema, mostrar esqueleto, alto contraste, sensibilidad de alertas

- HeaderBar
  - Acciones: Minimizar/Restaurar

- DockMinibar
  - Resumen compacto de puntajes; visible en modo minimizado

### Layout y Responsividad
- Desktop: grid 2 columnas
- Móvil: 1 columna apilada
- Minimizado: solo DockMinibar


