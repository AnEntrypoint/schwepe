set "file=%~n1"
set "extension=%~x1"
cd im
for /r %%i in (..\input\*) do convert "..\input\%%~nxi" ..\hald_schwepe.png -hald-clut  "..\output\%%~nxi"
pause