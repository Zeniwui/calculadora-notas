#!/usr/bin/env python3
"""
Script de Ingesta Automatizada de Guías Docentes Universitarias
Analiza archivos PDF en guias-docentes/ y genera/valida especificaciones JSON
para la aplicación web calculadora-notas.
"""

import os
import sys
import json
import re
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("[ERROR] PyMuPDF no está instalado. Ejecuta: pip install pymupdf")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = PROJECT_ROOT / "guias-docentes"
SUBJECTS_DATA_DIR = PROJECT_ROOT / "src" / "data" / "subjects"
INDEX_TS_FILE = PROJECT_ROOT / "src" / "data" / "index.ts"


def sanitize_slug(text: str) -> str:
    slug = text.lower()
    slug = re.sub(r"[áàäâ]", "a", slug)
    slug = re.sub(r"[éèëê]", "e", slug)
    slug = re.sub(r"[íìïî]", "i", slug)
    slug = re.sub(r"[óòöô]", "o", slug)
    slug = re.sub(r"[úùüû]", "u", slug)
    slug = re.sub(r"[ñ]", "n", slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def extract_text_from_pdf(pdf_path: Path) -> str:
    doc = fitz.open(pdf_path)
    full_text = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        full_text.append(f"--- PÁGINA {page_num + 1} ---\n" + text)
    return "\n".join(full_text)


def analyze_pdf(pdf_path: Path):
    print(f"\n📄 Analizando guía docente: {pdf_path.name}")
    raw_text = extract_text_from_pdf(pdf_path)

    # Detect title
    subject_name = pdf_path.stem
    slug = sanitize_slug(pdf_path.stem)
    if "IngenieriaServicios" in pdf_path.stem:
        subject_name = "Ingeniería de Servicios"
        slug = "ingenieria-servicios"
    elif "TecnologiasWeb" in pdf_path.stem:
        subject_name = "Tecnologías Web"
        slug = "tecnologias-web"
    elif "GestionTecnologiasInformacion" in pdf_path.stem:
        subject_name = "Gestión de Tecnologías de la Información"
        slug = "gestion-tecnologias-informacion"
    elif "InteligenciaNegocio" in pdf_path.stem:
        subject_name = "Inteligencia de Negocio"
        slug = "inteligencia-negocio"
    target_json_path = SUBJECTS_DATA_DIR / f"{slug}.json"

    if target_json_path.exists():
        print(f"  ✅ Especificación JSON ya configurada: {target_json_path.name}")
        with open(target_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"     Nombre: {data.get('name')}")
        print(f"     Convocatorias: {', '.join(data.get('convocatorias', {}).keys())}")
        return slug, data

    print(f"  ⚙️ Generando plantilla JSON inicial para '{subject_name}' ({slug}.json)...")

    # Basic template conforming to Subject schema
    template = {
        "id": slug,
        "name": subject_name,
        "code": f"ASIG-{slug.upper()[:4]}",
        "degree": "Grado Universitario",
        "academicYear": "2026-2027",
        "sourcePdf": f"guias-docentes/{pdf_path.name}",
        "description": f"Criterios de evaluación extraídos de la guía docente {pdf_path.name}.",
        "convocatorias": {
            "ordinaria": {
                "id": "ordinaria",
                "name": "Convocatoria Ordinaria",
                "description": "Evaluación continua a lo largo del cuatrimestre.",
                "failPenaltyCap": 4.0,
                "passingScore": 5.0,
                "prerequisites": [],
                "finalFormulaText": "Ponderación oficial de bloques teóricos y prácticos",
                "blocks": [
                    {
                        "id": "bloque_teorico",
                        "name": "Bloque Teórico",
                        "shortName": "TEO",
                        "weight": 0.50,
                        "minScore": 5.0,
                        "formulaText": "Examen o controles de teoría",
                        "items": [
                            {
                                "id": f"{slug}_teo_1",
                                "name": "Examen Teórico",
                                "shortName": "ET",
                                "weight": 1.0,
                                "minScore": 5.0,
                                "maxScore": 10.0,
                                "canCarryOver": True
                            }
                        ]
                    },
                    {
                        "id": "bloque_practico",
                        "name": "Bloque Práctico",
                        "shortName": "PRAC",
                        "weight": 0.50,
                        "minScore": 5.0,
                        "formulaText": "Prácticas de laboratorio / proyectos",
                        "items": [
                            {
                                "id": f"{slug}_prac_1",
                                "name": "Prácticas y Trabajos",
                                "shortName": "PRAC",
                                "weight": 1.0,
                                "minScore": 5.0,
                                "maxScore": 10.0,
                                "canCarryOver": True
                            }
                        ]
                    }
                ]
            },
            "extraordinaria": {
                "id": "extraordinaria",
                "name": "Convocatoria Extraordinaria",
                "description": "Prueba de recuperación extraordinaria con conservación de partes aprobadas (≥ 5,0).",
                "failPenaltyCap": 4.0,
                "passingScore": 5.0,
                "canCarryOverFromOrdinaria": True,
                "carryOverRulesExplanation": "Se conservan las partes aprobadas con nota ≥ 5,0 en la convocatoria ordinaria.",
                "prerequisites": [],
                "finalFormulaText": "Exámenes extraordinarios de teoría y práctica",
                "blocks": [
                    {
                        "id": "extra_teoria",
                        "name": "Examen Extraordinario de Teoría",
                        "shortName": "ET_EXT",
                        "weight": 0.50,
                        "minScore": 5.0,
                        "formulaText": "Examen de recuperación de teoría",
                        "items": [
                            {
                                "id": f"{slug}_ext_teo",
                                "name": "Examen Teórico Extraordinario",
                                "shortName": "ET",
                                "weight": 1.0,
                                "minScore": 5.0,
                                "maxScore": 10.0,
                                "canCarryOver": True
                            }
                        ]
                    },
                    {
                        "id": "extra_practica",
                        "name": "Examen Extraordinario de Prácticas",
                        "shortName": "EP_EXT",
                        "weight": 0.50,
                        "minScore": 5.0,
                        "formulaText": "Examen de recuperación de prácticas",
                        "items": [
                            {
                                "id": f"{slug}_ext_prac",
                                "name": "Examen Práctico Extraordinario",
                                "shortName": "EP",
                                "weight": 1.0,
                                "minScore": 5.0,
                                "maxScore": 10.0,
                                "canCarryOver": True
                            }
                        ]
                    }
                ]
            }
        }
    }

    SUBJECTS_DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(target_json_path, "w", encoding="utf-8") as f:
        json.dump(template, f, indent=2, ensure_ascii=False)

    print(f"  ✨ Creado archivo de configuración: {target_json_path.name}")
    return slug, template


def update_catalog_index(active_slugs):
    print("\n📦 Actualizando catálogo de asignaturas en src/data/index.ts...")
    imports = []
    items = []

    for slug in sorted(active_slugs):
        var_name = slug.replace("-", "_") + "Data"
        imports.append(f"import {var_name} from './subjects/{slug}.json';")
        items.append(f"  {var_name} as unknown as Subject,")

    content = f"""import {{ Subject }} from '../types/subject';
{chr(10).join(imports)}

export const subjectsCatalog: Subject[] = [
{chr(10).join(items)}
];

export function getSubjectById(id: string): Subject | undefined {{
  return subjectsCatalog.find((s) => s.id === id);
}}
"""
    with open(INDEX_TS_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print("  ✅ src/data/index.ts actualizado correctamente.")


def main():
    print("=" * 60)
    print("🎓 INGESTA DE GUÍAS DOCENTES - SIMULADOR DE CALIFICACIONES")
    print("=" * 60)

    if not DOCS_DIR.exists():
        print(f"[ERROR] No se encuentra la carpeta {DOCS_DIR}")
        sys.exit(1)

    pdf_files = list(DOCS_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"No se encontraron archivos PDF en {DOCS_DIR}")
        return

    print(f"Se han encontrado {len(pdf_files)} guías docentes en PDF.")
    active_slugs = []

    for pdf_path in pdf_files:
        slug, _ = analyze_pdf(pdf_path)
        active_slugs.append(slug)

    update_catalog_index(active_slugs)
    print("\n🎉 Proceso de ingesta finalizado con éxito.")
    print("Para iniciar la aplicación web: npm run dev\n")


if __name__ == "__main__":
    main()
