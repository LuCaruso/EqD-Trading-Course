@echo off
chcp 65001 >nul
title EqD Trading Academy
cd /d "%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY (
  where python >nul 2>nul && set "PY=python"
)
if not defined PY (
  echo.
  echo  [ERRO] Python nao encontrado.
  echo  Instale o Python 3 em https://www.python.org/downloads/
  echo  e marque a opcao "Add python.exe to PATH" durante a instalacao.
  echo.
  pause
  exit /b 1
)

echo Iniciando EqD Trading Academy...
%PY% server.py %*
echo.
echo Servidor encerrado.
pause
