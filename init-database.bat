@echo off
chcp 65001 >nul
echo ========================================
echo   青少年作业自律系统 - 数据库初始化
echo ========================================
echo.

cd backend

echo [1/3] 安装依赖...
call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装完成
echo.

echo [2/3] 检查数据库配置...
if not exist .env.production (
    echo ❌ 未找到 .env.production 文件
    echo 请先配置数据库连接信息
    pause
    exit /b 1
)
echo ✓ 配置文件存在
echo.

echo [3/3] 初始化数据库...
call npm run init-db
if errorlevel 1 (
    echo ❌ 数据库初始化失败
    echo 请检查数据库连接配置是否正确
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ 数据库初始化成功!
echo ========================================
echo.
echo 测试账号:
echo   家长: 13800138000 / 123456
echo   学生: 13900139000 / 123456
echo.
pause
