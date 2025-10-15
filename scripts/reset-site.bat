@echo off
echo ====================================
echo      网站内容重置脚本
echo ====================================
echo.

echo [1/13] 清理HTML文件...
call npm run clear-html
if %errorlevel% neq 0 (
    echo 错误: 清理HTML文件失败
    pause
    exit /b %errorlevel%
)
echo.

echo [2/13] 删除所有现有文章...
call npm run delete-all-articles
if %errorlevel% neq 0 (
    echo 错误: 删除文章失败
    pause
    exit /b %errorlevel%
)
echo.

echo [3/13] 更新主题配置...
call npm run update-theme-fixed
if %errorlevel% neq 0 (
    echo 错误: 更新主题配置失败
    pause
    exit /b %errorlevel%
)
echo.

echo [4/13] 更新文章配置并重置追踪...
call npm run update-articles-full
if %errorlevel% neq 0 (
    echo 错误: 更新文章配置失败
    pause
    exit /b %errorlevel%
)
echo.

echo [5/13] 生成文章...
call npm run generate-articles
if %errorlevel% neq 0 (
    echo 错误: 生成文章失败
    pause
    exit /b %errorlevel%
)
echo.

echo [6/13] 同步配置到模板...
call npm run sync-config
if %errorlevel% neq 0 (
    echo 错误: 同步配置失败
    pause
    exit /b %errorlevel%
)
echo.

echo [7/13] 添加新文章到网站...
call npm run add-articles-improved
if %errorlevel% neq 0 (
    echo 错误: 添加文章失败
    pause
    exit /b %errorlevel%
)
echo.

echo [8/13] 生成新主题方向...
call npm run generate-new-topics
if %errorlevel% neq 0 (
    echo 错误: 生成新主题失败
    pause
    exit /b %errorlevel%
)
echo.

echo [9/13] 生成15篇定时发布文章...
call npm run generate-articles -- -s -k 25 -c 15
if %errorlevel% neq 0 (
    echo 错误: 生成定时文章失败
    pause
    exit /b %errorlevel%
)
echo.

echo [10/13] 设置文章定时发布...
call npm run schedule-articles
if %errorlevel% neq 0 (
    echo 错误: 设置定时发布失败
    pause
    exit /b %errorlevel%
)
echo.

echo [11/13] 生成AI图标...
call npm run generate-ai-favicon
if %errorlevel% neq 0 (
    echo 错误: 生成AI图标失败
    pause
    exit /b %errorlevel%
)
echo.

echo [12/13] 生成图标...
call npm run generate-favicon
if %errorlevel% neq 0 (
    echo 错误: 生成图标失败
    pause
    exit /b %errorlevel%
)
echo.

echo [13/13] 更新网站图标...
call npm run update-favicon
if %errorlevel% neq 0 (
    echo 错误: 更新图标失败
    pause
    exit /b %errorlevel%
)
echo.

echo ====================================
echo      所有任务完成！
echo ====================================
echo.
pause