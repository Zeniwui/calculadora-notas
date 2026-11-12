# Calculadora de Expediente Académico y Simulador de Calificaciones

Aplicación web para modelar normativas de evaluación universitaria, simular calificaciones en tiempo real, proyectar notas necesarias para alcanzar metas académicas (simulación inversa con reparto balanceado) y auditar paso a paso el cálculo de notas conforme a las **Guías Docentes Oficiales**.

---

## Inicio Rápido

### Requisitos del Sistema
- **Node.js**: v18 o superior (v20+ recomendado)
- **Python**: 3.10+ con `pymupdf` (para el pipeline de ingesta de nuevos documentos PDF)

### 1. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación se iniciará en `http://localhost:5173/` (o el puerto disponible).

### 2. Ejecutar la Suite de Pruebas Matemáticas
```bash
npm test
```
Verifica que las fórmulas, condiciones de notas mínimas, medias geométricas, exenciones condicionales, topes reglamentarios (4,0 y 4,5) y arrastre de convocatorias extraordinarias coinciden al 100% con los criterios oficiales de todas las asignaturas.

### 3. Compilar para Producción
```bash
npm run build
```
Genera la compilación de producción en el directorio `dist/` validando tipos TypeScript y dependencias estáticas.

---

## Catálogo de Asignaturas Integradas

El sistema incorpora de serie los modelos matemáticos y normativos de las siguientes guías docentes universitarias:

1. **Ingeniería de Servicios** (`GIIS-IS`):
   - Bloque Teórico (60%, mín. 5,0): 3 controles individuales.
   - Bloque Práctico (40%, mín. 5,0): Trabajo en Grupo (25%, mín. 5,0) y Evaluación Individual de Prácticas (75% con PP1, PP2, Tarea 1 y Tarea 2).
   - Requisito de asistencia obligatoria a laboratorios $\ge 75\%$. Tope a 4,00.
2. **Tecnologías Web** (`GIITIN01-3-005`):
   - Bloque Teórico (20%): Examen teórico continuo.
   - Bloque Práctico (80%): Entregas prácticas (EP1, EP2) y Exámenes Prácticos individuales (ExP1, ExP2) con notas mínimas de 4,00.
   - Conservación de prácticas continuas si $NP \ge 5,00$. Tope a 4,00.
3. **Gestión de Tecnologías de la Información** (`GIITIN01-4-002`):
   - Bloque Teórico (30%, mín. 5,0): Media geométrica de 2 controles parciales ($\sqrt{CP_1 \cdot CP_2}$).
   - Participación en clase (15%): Cuestionarios gamificados en aula expositiva.
   - Simulación de procesos ITSM en equipo (15%, mín. 5,0): Caso Apolo 13 con memoria y defensa oral.
   - Trabajo en equipo (40%, mín. 5,0): Gestión de servicio TI con memoria y defensa.
   - Requisito de asistencia obligatoria a laboratorios $\ge 80\%$. Tope reglamentario a 4,50.
4. **Inteligencia de Negocio** (`GIITIN01-4-006`):
   - Bloque Práctico (50%, mín. 5,0): Evaluación continua (20%) y Evaluación final de producto y memoria (30%).
   - Bloque Teórico (50%, mín. 5,0): Trabajos de teoría y Examen teórico con exención condicional (si Trabajos $\ge 7,00$, exento de examen teórico y los trabajos cuentan el 50% de la nota final; si $< 7,00$, examen del 15% y trabajos del 35%).
   - Aprobado por separado en teoría y práctica. Tope a 4,00.

---

## Incorporación de Nuevas Guías Docentes

1. Deposita el archivo PDF oficial en la carpeta `guias-docentes/`:
   ```
   guias-docentes/NombreAsignatura.pdf
   ```
2. Ejecuta el comando de ingesta:
   ```bash
   npm run ingest
   ```
3. El pipeline detectará el documento, generará la especificación declarativa en `src/data/subjects/` y actualizará automáticamente el catálogo central de asignaturas.

---

## Características Técnicas y Funcionales

1. **Simulación Directa en Tiempo Real**:
   - Ajuste decimal mediante deslizadores y casillas numéricas sincronizadas.
   - Recálculo instantáneo de subtotales por bloque y calificación global de acta.

2. **Simulador de Meta Inversa ("Qué necesito sacar")**:
   - Algoritmo de bisección matemática que despeja la nota requerida en las pruebas pendientes con reparto balanceado uniforme.
   - Botón de fijación de nota (`Lock/Unlock`) para aislar calificaciones reales ya obtenidas.
   - Detección inmediata de metas inalcanzables con cálculo de la Nota Máxima Alcanzable.

3. **Diagnóstico Reglamentario de Mínimos y Topes**:
   - Comprobación automática de notas mínimas por prueba individual y por bloque.
   - Cálculo del déficit exacto de puntos necesarios para desbloquear la media real ante la aplicación de un tope reglamentario (4,00 o 4,50).

4. **Régimen de Convocatorias y Arrastre**:
   - Conmutación directa entre Convocatoria Ordinaria y Convocatoria Extraordinaria.
   - Arrastre automático de partes aprobadas con nota $\ge 5,00$ de acuerdo con la normativa particular de cada guía docente.

5. **Privacidad y Persistencia Local**:
   - Almacenamiento seguro en el navegador (`localStorage`) sin envío de datos a servidores externos.
   - Opciones integradas para importar y exportar el expediente en formato JSON.

---

## Documentación del Sistema
- [DESIGN.md](./DESIGN.md): Especificación del sistema de diseño visual institucional "Acta Notarial".
- [PRODUCT.md](./PRODUCT.md): Declaración de producto, principios y especificación funcional.
- [GLOSSARY.md](./GLOSSARY.md): Terminología canónica del dominio académico.
