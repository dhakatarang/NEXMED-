@echo off
echo Cleaning up project...

REM Delete node_modules
if exist node_modules (
    rmdir /s /q node_modules
    echo Deleted node_modules
)

REM Delete database files
if exist backend\databases\*.db (
    del /q backend\databases\*.db
    echo Deleted database files
)

REM Delete uploads folder
if exist backend\uploads (
    rmdir /s /q backend\uploads
    echo Deleted uploads folder
)

REM Delete package-lock files
if exist package-lock.json del /q package-lock.json
if exist backend\package-lock.json del /q backend\package-lock.json

echo Cleanup complete!
pause