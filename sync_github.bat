@echo off
echo Initializing Git...
git init

echo Setting up Remote...
git remote remove origin 2>nul
git remote add origin https://github.com/tienmed/PNT-Health-Station-Manager.git

echo Adding files...
git add .

echo Committing...
git commit -m "Complete Health Station Manager System"

echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo Done! You can close this window.
pause
