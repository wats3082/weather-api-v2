@echo off
REM Colors not supported in CMD, so we'll use simple formatting

echo.
echo ======= Weather API v2 - GitHub Deployment Setup =======
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Initialize git if not already done
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit: Weather API v2 with turbulence prediction"
    echo [OK] Git repository initialized
    echo.
) else (
    echo Git repository already exists
    echo.
)

REM Instructions
echo.
echo === NEXT STEPS ===
echo.
echo 1. CREATE GITHUB REPOSITORY:
echo    - Go to: https://github.com/new
echo    - Name: weather-api-v2
echo    - Choose public or private
echo    - Copy the HTTPS URL
echo.
echo 2. ADD REMOTE AND PUSH:
echo    git remote add origin ^<YOUR_GITHUB_URL^>
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. ENABLE GITHUB PAGES:
echo    - Go to: Settings ^> Pages
echo    - Source: Deploy from a branch
echo    - Branch: gh-pages, /(root)
echo    - Save
echo.
echo 4. (OPTIONAL) SET BACKEND API URL:
echo    - Settings ^> Secrets and variables ^> Actions
echo    - New secret: VITE_API_URL
echo    - Value: Your backend URL
echo.
echo Your site will be live at:
echo    https://YOUR_USERNAME.github.io/weather-api-v2
echo.
echo For full deployment guide, see: DEPLOYMENT.md
echo.
pause
