# Primitiva · Números Calientes

App web para analizar la frecuencia de los números de **La Primitiva** en los últimos N días. Sin instalación, sin servidor — abre `index.html` y listo.

![Gráfica de frecuencias](https://img.shields.io/badge/La_Primitiva-Análisis_de_frecuencias-gold)

---

## Cómo usar

### 1. Descarga

Descarga el ZIP desde [Releases](../../releases/latest), descomprímelo en cualquier carpeta.

### 2. Abre la app

Abre `index.html` en el navegador. Los datos históricos incluidos en `seed.json` se cargan automáticamente.

### 3. Actualiza los datos

Para añadir los sorteos celebrados desde la última actualización:

| Sistema | Acción |
|---|---|
| **Mac / Linux** | Doble clic en `update.sh` |
| **Windows** | Doble clic en `update.bat` |

Luego recarga `index.html`. El rango de días disponible en la app se ajusta solo.

---

## Requisitos

**Para usar la app:** cualquier navegador moderno (Chrome, Firefox, Safari, Edge).

**Para actualizar datos:**
- Mac / Linux: `curl` y `python3` (preinstalados en la mayoría de sistemas)
- Windows 10+: `curl.exe` (incluido en Windows) y [Python 3](https://www.python.org/downloads/)

---

## Configuración del script

Al principio de `update.sh` / `update.bat` hay una variable:

```bash
DIAS=90   # días hacia atrás que descarga
```

Cámbiala para ampliar o reducir el histórico. El máximo que permite la web oficial es varios años.

---

## Cómo funciona

Los datos vienen directamente de **loteriasyapuestas.es** (web oficial del Estado). El script hace una petición HTTP con las cabeceras exactas que enviaría un navegador real, lo que permite obtener los datos sin API key ni registro.

Los resultados se guardan en `seed.json` (fichero local) y en IndexedDB del navegador para arranques instantáneos.

---

## Contenido de la carpeta

```
index.html      ← la app
styles.css
js/
seed.json       ← histórico de sorteos (actualizado por el script)
update.sh       ← script de actualización (Mac/Linux)
update.bat      ← script de actualización (Windows)
```
