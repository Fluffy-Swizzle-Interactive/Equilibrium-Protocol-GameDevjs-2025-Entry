@echo off
echo Installing Butler for itch.io deployment...

:: Create a temporary directory for the download
mkdir .butler-temp 2>nul
cd .butler-temp

:: Download Butler for Windows
echo Downloading Butler...
powershell -Command "Invoke-WebRequest -Uri 'https://broth.itch.ovh/butler/windows-amd64/LATEST/archive/default' -OutFile 'butler.zip'"

:: Extract the ZIP file
echo Extracting...
powershell -Command "Expand-Archive -Path 'butler.zip' -DestinationPath '../' -Force"

:: Clean up
cd ..
rmdir /S /Q .butler-temp

:: Verify installation
echo Verifying Butler installation...
butler --version

echo.
echo Butler has been installed. You can now deploy to itch.io using:
echo npm run deploy
echo.
echo To authenticate with itch.io, run:
echo butler login
echo.

pause