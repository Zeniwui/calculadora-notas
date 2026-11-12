# Simulador de Calificaciones Universitarias

Aplicación para modelar criterios de evaluación académica a partir de guías docentes, calcular calificaciones acumuladas y proyectar notas necesarias para superar asignaturas.

## Language

**Asignatura**:
Unidad académica individual (materia) con su propio conjunto de normativas y criterios de evaluación descritos en su guía docente.
_Avoid_: Curso, materia, clase

**Convocatoria**:
Ocasión formal de examen o evaluación (Ordinaria, Extraordinaria) con reglas de cálculo, ponderaciones y requisitos de mínimos específicos.
_Avoid_: Intento, llamado, periodo

**Bloque Evaluativo**:
Agrupación de alto nivel de elementos de evaluación dentro de una asignatura (habitualmente Bloque Teórico y Bloque Práctico).
_Avoid_: Módulo, sección, parte general

**Sub-bloque Evaluativo**:
Subdivisión interna de un bloque que agrupa varios elementos evaluables dependientes (ej. Evaluación Individual de Prácticas dentro del Bloque Práctico).
_Avoid_: Subgrupo, subdivisión

**Elemento Evaluable**:
Actividad, prueba, control, examen, práctica o entrega individual o grupal que recibe una calificación numérica.
_Avoid_: Tarea, ítem, parcialito

**Nota Mínima**:
Calificación numérica umbral obligatoria (habitualmente 4,0 o 5,0) requerida en un elemento o bloque para poder promediar o aprobar la asignatura.
_Avoid_: Nota de corte, aprobado raso, mínimo exigible

**Tope por Mínimo (Penalización)**:
Regla reglamentaria que limita la calificación final a un valor máximo (típicamente 4,0 o 4,5) cuando no se alcanza alguna de las notas mínimas exigidas o prerrequisitos, independientemente del promedio ponderado.
_Avoid_: Suspenso automático, capado

**Prerrequisito de Asistencia**:
Condición cualitativa de presencia mínima obligatoria (ej. 75% o 80% de sesiones de laboratorio) sin la cual se anula la convocatoria ordinaria o el derecho a evaluación continua.
_Avoid_: Asistencia obligatoria, fichaje

**Media Geométrica**:
Calificación calculada como la raíz cuadrada del producto de las notas obtenidas ($\sqrt{CP_1 \cdot CP_2}$), empleada cuando la normativa penaliza desequilibrios pronunciados entre partes.
_Avoid_: Promedio multiplicativo

**Exención Condicional de Examen**:
Mecanismo reglamentario mediante el cual alcanzar una calificación mínima destacada en el trabajo continuo (ej. trabajos de teoría $\ge 7,00$) exime al estudiante de rendir el examen teórico final.
_Avoid_: Aprobado por la cara, convalidación

**Conservación de Partes (Carry-Over)**:
Mecanismo reglamentario que transfiere las calificaciones de bloques o pruebas aprobadas ($\ge 5,00$) en la convocatoria ordinaria directamente a la convocatoria extraordinaria.
_Avoid_: Arrastre libre, guardar nota

**Simulación Directa**:
Cálculo de la nota final o de bloque resultante a partir de las calificaciones ya introducidas por el estudiante.
_Avoid_: Calculadora estándar, promedio

**Simulación Inversa (Nota Necesaria)**:
Cálculo automático de la calificación mínima requerida en los elementos evaluables pendientes para alcanzar una nota meta deseada (ej. 5,0 o notable).
_Avoid_: Despeje de nota, predictor

**Reparto Proporcional Balanceado**:
Cálculo en la simulación inversa que distribuye el objetivo de nota de manera uniforme y equilibrada entre todos los elementos evaluables pendientes.
_Avoid_: Promedio plano, nota fija

**Nota Máxima Alcanzable**:
Límite matemático superior que un estudiante puede obtener en la asignatura asumiendo una calificación perfecta (10,0) en todas las pruebas pendientes.
_Avoid_: Techo teórico, nota tope
