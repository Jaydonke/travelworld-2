@echo off
REM 多网站自动化生成批处理脚本 (Windows)

echo.
echo ========================================
echo   多网站自动化生成系统
echo ========================================
echo.

REM 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查配置文件是否存在
if not exist "websites-config.csv" (
    echo [错误] 配置文件 websites-config.csv 不存在
    echo.
    echo 请创建配置文件或复制示例文件:
    echo   copy websites-config.example.csv websites-config.csv
    echo.
    pause
    exit /b 1
)

REM 运行脚本
node scripts/mul-reset-site.js %*

if %errorlevel% neq 0 (
    echo.
    echo [错误] 执行失败，错误代码: %errorlevel%
    pause
    exit /b %errorlevel%
)

echo.
echo [完成] 所有网站处理完成
pause
