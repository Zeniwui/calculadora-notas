---
name: Calculadora de Expediente Académico
description: Sistema de diseño institucional para actas oficiales, cálculo y simulación de calificaciones universitarias
colors:
  primary: "#0f172a"
  primary-dark: "#020617"
  surface-bg: "#f8fafc"
  surface-card: "#ffffff"
  surface-subtle: "#f1f5f9"
  border: "#cbd5e1"
  border-light: "#e2e8f0"
  text-primary: "#0f172a"
  text-secondary: "#475569"
  text-muted: "#64748b"
  accent-institutional: "#1e3a8a"
  accent-passed: "#065f46"
  accent-passed-bg: "#ecfdf5"
  accent-passed-border: "#6ee7b7"
  accent-failed: "#9f1239"
  accent-failed-bg: "#fff1f2"
  accent-failed-border: "#fda4af"
  accent-warning: "#b45309"
  accent-warning-bg: "#fffbeb"
  accent-warning-border: "#fcd34d"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, 'JetBrains Mono', SFMono-Regular, monospace"
    fontSize: "0.75rem"
rounded:
  none: "0px"
  sm: "2px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card-dossier:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "24px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-card}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-action:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
---

# Design System: Acta Notarial (Secretaría Académica)

## Overview
El sistema de diseño **Acta Notarial** concibe la aplicación no como una calculadora convencional, sino como un expediente oficial universitario emitido por una secretaría académica de alto rigor. 

Principios fundamentales:
- **Rigor documental**: Estructura de pliego administrativo, tablas matriciales numeradas, sellos de estado tipográficos y tipografía editorial de cátedra.
- **Transparencia reglamentaria**: Desglose explícito de fórmulas matemáticas, avisos diagnósticos con cálculo del déficit de puntos exacto y control riguroso de asistencia obligatoria.
- **Sobriedad institucional**: Cero emojis, paleta de alto contraste basada en tintas sobre papel pergamino frío (`#f8fafc`) y eliminación de radios redondeados superfluos (`rounded-none`).

## Colors
- **Tinta Principal (`#0f172a`)**: Pizarra profunda institucional para encabezados, totales en acta y botones de acción primaria.
- **Fondo de Documento (`#f8fafc`)**: Gris pergamino frío que aporta textura de papel de registro sin reflejos deslumbrantes.
- **Superficie de Acta (`#ffffff`)**: Blanco puro para tarjetas, celdas de tabla y formularios de entrada.
- **Divisores y Filetes (`#cbd5e1` / `#e2e8f0`)**: Líneas nítidas y delgadas que delimitan las áreas de evaluación emulando los libros de registro oficiales.
- **Azul Notarial (`#1e3a8a`)**: Tono universitario para monogramas de cátedra, identificadores de matrícula y enlaces de auditoría.
- **Estados Normativos**:
  - **Aprobado (`#065f46` sobre `#ecfdf5`, borde `#6ee7b7`)**: Verde laurel académico de alta legibilidad WCAG AAA.
  - **Suspenso (`#9f1239` sobre `#fff1f2`, borde `#fda4af`)**: Carmín sereno que señala el incumplimiento de nota sin estridencias.
  - **Tope Reglamentario / Advertencia (`#b45309` sobre `#fffbeb`, borde `#fcd34d`)**: Ámbar pergamino para diagnósticos de aplicación de tope a 4,00 o 4,50.

## Typography
La jerarquía tipográfica establece una distinción nítida entre autoridad institucional y datos operativos:
- **Títulos de Acta y Calificaciones Principales**: *Newsreader* (serif de corte editorial con proporciones tradicionales).
- **Etiquetas de Metadatos y Estructura**: *Sans-serif* funcional (`system-ui`), con mayúsculas sostenidas (`uppercase tracking-wider`) a tamaño `text-xs` (12px).
- **Numerales y Auditoría**: Cifras tabulares monoespaciadas (`tabular-nums`, `font-mono`) para garantizar el alineamiento vertical perfecto en sumatorios de ponderaciones y decimales.

## Layout
- **Estructura en Dossier (Grid 12 columnas)**:
  - **Columna izquierda (5 cols)**: Resumen del acta, calificación final en display 4xl, sello de calificación (Aprobado / Suspenso / Tope 4.0), cuadro diagnóstico de penalización, control de asistencia obligatoria y cockpit de simulación inversa con botones de meta rápida (`5.0`, `6.0`, `7.0`, `8.0`, `9.0`).
  - **Columna derecha (7 cols)**: Libro de registro evaluativo, organizado por bloques y sub-bloques indentados con borde lateral de expediente (`border-l-2 border-[#cbd5e1] pl-3.5`).
- **Nivel de pantalla fija**: Barra superior institucional adherente (`sticky top-0`) con acceso a importación/exportación JSON y ayuda reglamentaria.

## Elevation & Depth
- **Diseño estrictamente plano y matricial**: No se emplean sombras proyectadas pronunciadas ni efectos de desenfoque *glassmorphism*.
- **Contraste por delimitación**: La profundidad se resuelve exclusivamente mediante filetes perimetrales de 1px (`border border-[#cbd5e1]`) y sutiles variaciones tonales entre `#f8fafc` y `#ffffff`.

## Shapes
- **Vértices rectilíneos (`rounded-none`)**: En consonancia con la estética notarial, los contenedores, botones, badges y cuadros de entrada carecen de bordes redondeados infantiles.
- **Bordes acentuados en sub-bloques**: Los niveles jerárquicos secundarios emplean un filete vertical sólido a la izquierda para señalar parentesco visual sin añadir cajas envolventes pesadas.

## Components
- **Ficha de Elemento Evaluable**:
  - Contiene nombre formal de la prueba, badge de grupal/conservada, porcentaje de ponderación y nota mínima si aplica.
  - Botón de fijación (`Lock/Unlock`) para aislar calificaciones en la simulación inversa.
  - Botón de borrado de calificación individual (`RotateCcw`).
  - Control dual sincronizado: slider de precisión y caja numérica decimal directa.
- **Banner de Tope Reglamentario**:
  - Aparece únicamente cuando el promedio real supera el aprobado pero se suspende un mínimo obligatorio o la asistencia.
  - Muestra la fórmula oficial aplicada, el déficit de puntos para desbloquear la nota real y el tope reglamentario resultante.
- **Cockpit de Simulación Inversa**:
  - Muestra la nota media necesaria en los elementos no fijados.
  - Botón "Rellenar notas sugeridas" para volcar la solución balanceada en el acta con un clic.
  - Notificación flotante reversible (`Toast con Deshacer`) ante acciones destructivas o restablecimientos de notas.

## Do's and Don'ts
### Do's
- Mantener siempre cifras numéricas formateadas a 2 decimales (`toFixed(2)`).
- Respetar los tamaños tipográficos mínimos (ningún texto por debajo de `text-xs` / 12px).
- Incluir siempre el cálculo del déficit exacto en cualquier diagnóstico de penalización.
- Mantener el contraste tipográfico por encima del estándar WCAG AA (mínimo 4.5:1).

### Don'ts
- **No usar emojis** en títulos, botones, alertas ni textos del sistema.
- No emplear radios curvados (`rounded-xl`, `rounded-full`) en tarjetas o contenedores institucionales.
- No inventar ponderaciones o notas mínimas no respaldadas por la guía docente oficial.
- No mostrar botones de acción sin sus correspondientes atributos accesibles (`aria-label`, `title`).
