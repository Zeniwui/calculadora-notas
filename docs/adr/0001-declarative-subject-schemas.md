# 0001. Arquitectura declarativa de asignaturas y pipeline de ingesta

Para soportar guías docentes heterogéneas (PDFs con texto estándar, PDFs vectorizados o escaneados) y reglas de evaluación complejas con fórmulas condicionales y penalizaciones, se decide desacoplar la ingesta de las guías docentes de la aplicación web cliente mediante un esquema declarativo JSON (`data/subjects/*.json`).

La aplicación web funciona como un cliente estático en React + Vite + TypeScript que consume estas configuraciones declarativas y gestiona el estado del alumno localmente en `localStorage`. La incorporación de nuevas asignaturas se realiza mediante un pipeline de extracción estructurado que compila cada guía docente en una especificación JSON verificable, garantizando exactitud matemática y escalabilidad sin riesgo de fallos de parseo en el navegador.
