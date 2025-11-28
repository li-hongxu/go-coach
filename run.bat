@echo off
echo 正在启动围棋AI教练...
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

REM 安装依赖
echo 正在安装依赖包...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo 警告：依赖包安装可能出现问题
)

echo.
echo 启动Web服务器...
echo 请在浏览器中访问 http://localhost:5000
echo 按 Ctrl+C 停止服务器
echo.

python app.py

pause