@echo off
rem =============================================================
rem  Actualiza seed.json con los últimos N días de La Primitiva
rem  Requisitos: Windows 10+ (curl.exe incluido), Python 3
rem  Uso: doble clic
rem =============================================================
setlocal

set DIAS=90

set "SEED=%~dp0seed.json"
set "TMP_RAW=%TEMP%\prim_raw_%RANDOM%.json"
set "TMP_PY=%TEMP%\prim_parse_%RANDOM%.py"

rem ── Detectar Python ─────────────────────────────────────────
set PYTHON=
where python3 >nul 2>&1 && set PYTHON=python3
if not defined PYTHON (
    where python >nul 2>&1 && set PYTHON=python
)
if not defined PYTHON (
    echo ERROR: Python 3 no encontrado.
    echo Descargalo en https://www.python.org/downloads/
    pause
    exit /b 1
)

rem ── Calcular fechas ─────────────────────────────────────────
for /f %%d in ('powershell -NoProfile -Command "(Get-Date).ToString(\"yyyyMMdd\")"') do set TODAY=%%d
for /f %%d in ('powershell -NoProfile -Command "(Get-Date).AddDays(-%DIAS%).ToString(\"yyyyMMdd\")"') do set CUTOFF=%%d

echo Descargando sorteos del %CUTOFF% al %TODAY%...

rem ── Descarga con curl ───────────────────────────────────────
curl.exe -sf ^
  "https://www.loteriasyapuestas.es/servicios/buscadorSorteos?game_id=LAPR&celebrados=true&fechaInicioInclusiva=%CUTOFF%&fechaFinInclusiva=%TODAY%&num_sorteos=200" ^
  --compressed ^
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" ^
  -H "Accept-Language: es-ES,es;q=0.9" ^
  -H "Accept-Encoding: gzip, deflate, br" ^
  -H "Sec-Fetch-Dest: document" ^
  -H "Sec-Fetch-Mode: navigate" ^
  -H "Sec-Fetch-Site: none" ^
  -H "Sec-Fetch-User: ?1" ^
  -H "Upgrade-Insecure-Requests: 1" ^
  -o "%TMP_RAW%"

if errorlevel 1 (
    echo ERROR: fallo la descarga. Comprueba la conexion a internet.
    del "%TMP_RAW%" 2>nul
    pause
    exit /b 1
)

rem ── Escribir script Python desde base64 ─────────────────────
rem    (evita problemas de escape de parentesis en batch)
powershell -NoProfile -Command ^
  "[IO.File]::WriteAllBytes('%TMP_PY%', [Convert]::FromBase64String('aW1wb3J0IGpzb24sIHJlLCBzeXMKCnNlZWRfcGF0aCA9IHN5cy5hcmd2WzFdCnJhd19wYXRoICA9IHN5cy5hcmd2WzJdCgp0cnk6CiAgICB3aXRoIG9wZW4oc2VlZF9wYXRoLCBlbmNvZGluZz0ndXRmLTgnKSBhcyBmOgogICAgICAgIGV4aXN0aW5nID0ganNvbi5sb2FkKGYpCmV4Y2VwdCBFeGNlcHRpb246CiAgICBleGlzdGluZyA9IFtdCgpleGlzdGluZ19kYXRlcyA9IHtkWydkYXRlJ10gZm9yIGQgaW4gZXhpc3Rpbmd9Cgp3aXRoIG9wZW4ocmF3X3BhdGgsIGVuY29kaW5nPSd1dGYtOCcpIGFzIGY6CiAgICByYXcgPSBqc29uLmxvYWQoZikKCmlmIG5vdCBpc2luc3RhbmNlKHJhdywgbGlzdCk6CiAgICBwcmludCgnRVJST1I6IHJlc3B1ZXN0YSBpbmVzcGVyYWRhIGRlbCBzZXJ2aWRvcjonLCBzdHIocmF3KVs6MjAwXSkKICAgIHN5cy5leGl0KDEpCgpuZXdfZHJhd3MgPSBbXQpmb3IgZCBpbiByYXc6CiAgICBmcyAgICAgICAgPSBzdHIoZC5nZXQoJ2ZlY2hhX3NvcnRlbycsICcnKSlbOjEwXQogICAgY29tYiAgICAgID0gc3RyKGQuZ2V0KCdjb21iaW5hY2lvbicsICcnKSkKICAgIG51bXNfcGFydCA9IHJlLnNwbGl0KHInXHMqQ1woJywgY29tYilbMF0KICAgIG51bWJlcnMgICA9IFtpbnQoeC5zdHJpcCgpKSBmb3IgeCBpbiBudW1zX3BhcnQuc3BsaXQoJyAtICcpIGlmIHguc3RyaXAoKS5pc2RpZ2l0KCldCiAgICBjb21wX20gICAgPSByZS5zZWFyY2gocidDXCgoXGQrKVwpJywgY29tYikKICAgIHJlaW5fbSAgICA9IHJlLnNlYXJjaChyJ1JcKChcZCspXCknLCBjb21iKQogICAgaWYgbGVuKG51bWJlcnMpID09IDYgYW5kIGZzIGFuZCBmcyBub3QgaW4gZXhpc3RpbmdfZGF0ZXM6CiAgICAgICAgbmV3X2RyYXdzLmFwcGVuZCh7CiAgICAgICAgICAgICdkYXRlJzogICAgICAgICAgIGZzLAogICAgICAgICAgICAnbnVtYmVycyc6ICAgICAgICBudW1iZXJzLAogICAgICAgICAgICAnY29tcGxlbWVudGFyaW8nOiBpbnQoY29tcF9tLmdyb3VwKDEpKSBpZiBjb21wX20gZWxzZSAwLAogICAgICAgICAgICAncmVpbnRlZ3JvJzogICAgICBpbnQocmVpbl9tLmdyb3VwKDEpKSBpZiByZWluX20gZWxzZSAtMSwKICAgICAgICB9KQoKbWVyZ2VkID0gc29ydGVkKGV4aXN0aW5nICsgbmV3X2RyYXdzLCBrZXk9bGFtYmRhIHg6IHhbJ2RhdGUnXSwgcmV2ZXJzZT1UcnVlKQoKd2l0aCBvcGVuKHNlZWRfcGF0aCwgJ3cnLCBlbmNvZGluZz0ndXRmLTgnKSBhcyBmOgogICAganNvbi5kdW1wKG1lcmdlZCwgZiwgc2VwYXJhdG9ycz0oJywnLCAnOicpKQoKYWRkZWQgPSBsZW4obmV3X2RyYXdzKQp0b3RhbCA9IGxlbihtZXJnZWQpCnByaW50KCdTb3J0ZW9zIG51ZXZvczogJyArIHN0cihhZGRlZCkgKyAnLiBUb3RhbCBlbiBzZWVkLmpzb246ICcgKyBzdHIodG90YWwpICsgJy4nKQppZiBhZGRlZCA9PSAwOgogICAgcHJpbnQoJ0VsIHNlZWQgeWEgZXN0YWJhIGFsIGRpYSwgbm8gaGFiaWEgc29ydGVvcyBudWV2b3MuJykK'))"

rem ── Ejecutar parser ─────────────────────────────────────────
%PYTHON% "%TMP_PY%" "%SEED%" "%TMP_RAW%"

del "%TMP_RAW%" "%TMP_PY%" 2>nul
pause
