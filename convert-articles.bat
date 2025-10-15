@echo off
echo ========================================
echo    HTML到MDX转换工具
echo ========================================
echo.

echo 正在检查环境...
if not exist "newarticle" (
    echo 错误: 找不到 newarticle 目录
    echo 请确保在项目根目录下运行此脚本
    pause
    exit /b 1
)

if not exist "scripts\convert-html-to-mdx.js" (
    echo 错误: 找不到转换脚本
    echo 请确保 scripts\convert-html-to-mdx.js 文件存在
    pause
    exit /b 1
)

echo 环境检查通过！
echo.

echo 开始转换HTML文章...
echo.

npm run convert-html

echo.
echo ========================================
echo 转换完成！
echo.
echo 下一步:
echo 1. 运行 "npm run dev" 启动开发服务器
echo 2. 在浏览器中查看 http://localhost:4322
echo 3. 检查新添加的文章是否正确显示
echo ========================================
echo.

pause 