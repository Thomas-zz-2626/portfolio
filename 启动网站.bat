@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   正在构建并启动网站...
echo   启动后浏览器打开：http://localhost:4173/
echo   关闭这个黑窗口 = 关闭网站
echo.
call npx vite build && call npx vite preview --port 4173 --strictPort
pause
