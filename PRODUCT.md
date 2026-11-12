# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Estudiantes universitarios de ingeniería y profesorado que precisan modelar con exactitud los criterios de evaluación de sus asignaturas, calcular notas parciales y finales acumuladas, proyectar calificaciones necesarias en pruebas pendientes mediante simulación inversa balanceada y auditar la aplicación estricta de notas mínimas, requisitos de asistencia y normativas oficiales.

## Product Purpose
Proporcionar una herramienta académica rigurosa, matemática y transparente que refleje con total fidelidad los criterios de evaluación de las guías docentes universitarias, permitiendo la simulación directa, la simulación inversa de metas y la justificación explicativa paso a paso.

## Positioning
A diferencia de calculadoras de promedios simples, este sistema modela la normativa universitaria real: estructuras jerárquicas con sub-bloques evaluativos, medias geométricas, exenciones condicionales de examen por trabajo continuo, notas mínimas eliminatorias, penalizaciones reglamentarias (topes restrictivos a 4,00 o 4,50 si se suspende un mínimo), prerrequisitos de asistencia obligatoria a laboratorios y régimen de convocatorias ordinaria y extraordinaria con conservación automática de partes aprobadas.

## Operating Context
Consulta durante el cuatrimestre académico y periodos de exámenes universitarios, en ordenadores y portátiles, con trabajo simultáneo junto al campus virtual y los expedientes académicos oficiales.

## Catalog of Supported Subjects
1. **Ingeniería de Servicios** (`GIIS-IS`): Evaluación continua (60% Teoría, 40% Prácticas). Desglose en Bloque Teórico (3 controles) y Bloque Práctico (Trabajo en Grupo 25% y Evaluación Individual de Prácticas 75% con PP1, PP2, Tarea 1 y Tarea 2). Requisito de asistencia a laboratorios $\ge 75\%$. Tope a 4,00.
2. **Tecnologías Web** (`GIITIN01-3-005`): Evaluación continua (20% Teoría, 80% Prácticas). Desglose en Examen Teórico, Evaluaciones Prácticas (EP1, EP2) y Exámenes Prácticos individuales (ExP1, ExP2) con notas mínimas de 4,00. Conservación de prácticas continuas si $NP \ge 5,00$. Tope a 4,00.
3. **Gestión de Tecnologías de la Información** (`GIITIN01-4-002`): Evaluación continua de 4 partes (30% Teoría con media geométrica $\sqrt{CP_1 \cdot CP_2}$, 15% Participación en clase gamificada, 15% Simulación ITSM en equipo y 40% Trabajo en equipo con memoria y defensa pública). Requisito de asistencia a laboratorios $\ge 80\%$. Tope reglamentario a 4,50.
4. **Inteligencia de Negocio** (`GIITIN01-4-006`): Evaluación continua (50% Prácticas y 50% Teoría). Prácticas desglosadas en Continua (20% global) y Final (30% global). Teoría con regla condicional de exención: si los trabajos de teoría son $\ge 7,00$, el estudiante queda exento del examen y los trabajos computan el 50%; si son $< 7,00$, se realiza examen teórico (15% global) y los trabajos ponderan el 35%. Aprobado por separado en teoría y práctica. Tope a 4,00.

## Capabilities and Constraints
- Motor declarativo universal con simulación directa e inversa con reparto balanceado y fijación de notas (`Lock/Unlock`).
- Soporte de sub-bloques anidados, media geométrica y lógicas de exención condicional.
- Ingesta escalable de nuevas guías docentes en PDF mediante pipeline automatizado (`npm run ingest`).
- Privacidad y persistencia local sin servidor (`localStorage`), con respaldo y restauración mediante ficheros JSON.
- Tono académico, sobrio y riguroso; cero emojis; tipografía Newsreader y Sans de alto contraste.

## Brand Commitments
- Estilo académico, serio e institucional (estética "Acta Notarial").
- Legibilidad impecable para datos numéricos, fórmulas y tablas normativas (WCAG AA/AAA).
- Prohibición de estridencias, gradientes de texto o estética de videojuego.

## Product Principles
1. Rigor matemático absoluto: cada cálculo se audita contra la fórmula oficial de la guía docente.
2. Transparencia explicativa: ningún número aparece sin su desglose y sustitución de valores.
3. Primacía de los mínimos normativos: las condiciones reglamentarias se imponen sobre los promedios simples.
4. Claridad y sobriedad institucional: el diseño evoca la seriedad de una secretaría académica de alto nivel.
