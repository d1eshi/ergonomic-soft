## Guía de Estilos (Diseño)

Esta guía define tokens, colores y principios visuales. Aplica a estados claro/oscuro y alto contraste.

### Paleta y Tokens de Tema
- Variables CSS (en `:root` / `.dark`):
  - `--bg-primary`: Fondo principal
  - `--bg-secondary`: Contenedor/Surface
  - `--text-primary`: Texto principal
  - `--accent-good`: Estados correctos
  - `--accent-warning`: Advertencias
  - `--accent-critical`: Críticos

Estados de color:
- Claro
  - `--bg-primary: #ffffff`
  - `--bg-secondary: #f8fafc`
  - `--text-primary: #1e293b`
- Oscuro
  - `--bg-primary: #0f172a`
  - `--bg-secondary: #1e293b`
  - `--text-primary: #f1f5f9`
- Acentos (comunes)
  - `--accent-good: #10b981`
  - `--accent-warning: #f59e0b`
  - `--accent-critical: #ef4444`

### Tipografía y Escalas
- Base: sistema (Inter/SF/Segoe/Roboto según plataforma)
- Jerarquía típica
  - Título sección: 18–20px, semibold
  - Cuerpo: 14–16px, regular
  - Leyendas: 12–13px, regular, 70% de opacidad

### Espaciado y Radios
- Espaciado: 4/8/12/16/24
- Radios: 8px en contenedores, 4px en botones pequeños
- Sombra: suave en contenedores para profundidad

### Estados y Feedback
- Good: verde `--accent-good`
- Warning: ámbar `--accent-warning`
- Critical: rojo `--accent-critical`
- En tarjetas se refleja con color de valor y chips de tendencia

### Accesibilidad (Diseño)
- Contraste mínimo 4.5:1 en texto principal
- Modo Alto Contraste (`.hc`) disponible
- Indicadores de foco visibles (outline ámbar)
- Tamaños táctiles mínimos: 40x40px

### Iconografía y Emojis
- Se permiten emojis en alertas (💡, ⚠️) como refuerzo visual
- Evitar dependencia exclusiva de color para el estado


