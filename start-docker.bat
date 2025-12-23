@echo off
REM HSC Power - Docker 启动脚本 (Windows)
REM Docker Start Script for HSC Power Application (Windows)

title HSC Power - Docker Management

:MAIN_MENU
cls
echo =====================================
echo   HSC Power - Docker 管理
echo =====================================
echo.
echo 1) 启动生产环境 (Production)
echo 2) 启动开发环境 (Development)
echo 3) 停止所有服务
echo 4) 重启服务
echo 5) 查看服务状态
echo 6) 查看日志
echo 7) 清理 Docker 资源
echo 8) 重新构建并启动
echo 0) 退出
echo.
echo =====================================
set /p choice="请选择操作 (0-8): "

if "%choice%"=="1" goto START_PROD
if "%choice%"=="2" goto START_DEV
if "%choice%"=="3" goto STOP_SERVICES
if "%choice%"=="4" goto RESTART_SERVICES
if "%choice%"=="5" goto VIEW_STATUS
if "%choice%"=="6" goto VIEW_LOGS
if "%choice%"=="7" goto CLEANUP
if "%choice%"=="8" goto REBUILD
if "%choice%"=="0" goto EXIT
echo 无效选择，请重试
pause
goto MAIN_MENU

:CHECK_DOCKER
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker 未安装。请先安装 Docker Desktop for Windows
    echo 访问: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)
goto :eof

:CHECK_ENV
if not exist "backend\.env" (
    echo 警告: backend\.env 文件不存在
    if exist "backend\.env.example" (
        echo 发现 .env.example 文件，正在复制...
        copy "backend\.env.example" "backend\.env"
        echo 请编辑 backend\.env 文件，填入正确的配置信息
        pause
        exit /b 1
    ) else (
        echo 请创建 backend\.env 文件并配置环境变量
        pause
        exit /b 1
    )
)
goto :eof

:START_PROD
call :CHECK_DOCKER
call :CHECK_ENV
echo.
echo 启动生产环境...
docker-compose up -d --build
echo.
echo 生产环境已启动
echo 前端访问: http://localhost
echo 后端访问: http://localhost:3000
pause
goto MAIN_MENU

:START_DEV
call :CHECK_DOCKER
call :CHECK_ENV
echo.
echo 启动开发环境...
docker-compose -f docker-compose.dev.yml up --build
echo.
echo 开发环境已启动
echo 前端访问: http://localhost:5173
echo 后端访问: http://localhost:3000
pause
goto MAIN_MENU

:STOP_SERVICES
echo.
echo 停止所有服务...
docker-compose down
docker-compose -f docker-compose.dev.yml down 2>nul
echo 服务已停止
pause
goto MAIN_MENU

:RESTART_SERVICES
echo.
echo 1) 重启生产环境
echo 2) 重启开发环境
set /p restart_choice="请选择 (1-2): "
if "%restart_choice%"=="1" (
    docker-compose restart
    echo 生产环境已重启
) else if "%restart_choice%"=="2" (
    docker-compose -f docker-compose.dev.yml restart
    echo 开发环境已重启
) else (
    echo 无效选择
)
pause
goto MAIN_MENU

:VIEW_STATUS
echo.
echo 服务状态:
echo.
echo 生产环境:
docker-compose ps
echo.
echo 开发环境:
docker-compose -f docker-compose.dev.yml ps 2>nul
if errorlevel 1 echo 未运行
pause
goto MAIN_MENU

:VIEW_LOGS
echo.
echo 1) 查看生产环境日志
echo 2) 查看开发环境日志
echo 3) 查看后端日志
echo 4) 查看前端日志
set /p log_choice="请选择 (1-4): "

if "%log_choice%"=="1" (
    docker-compose logs -f
) else if "%log_choice%"=="2" (
    docker-compose -f docker-compose.dev.yml logs -f
) else if "%log_choice%"=="3" (
    set /p env_choice="生产环境 (p) 还是开发环境 (d)? "
    if "%env_choice%"=="d" (
        docker-compose -f docker-compose.dev.yml logs -f backend
    ) else (
        docker-compose logs -f backend
    )
) else if "%log_choice%"=="4" (
    set /p env_choice="生产环境 (p) 还是开发环境 (d)? "
    if "%env_choice%"=="d" (
        docker-compose -f docker-compose.dev.yml logs -f frontend
    ) else (
        docker-compose logs -f frontend
    )
) else (
    echo 无效选择
)
pause
goto MAIN_MENU

:CLEANUP
echo.
echo 警告: 这将清理所有未使用的 Docker 资源
set /p confirm="确认继续? (y/n): "
if /i "%confirm%"=="y" (
    echo 清理 Docker 资源...
    docker system prune -a --volumes -f
    echo 清理完成
) else (
    echo 已取消
)
pause
goto MAIN_MENU

:REBUILD
echo.
echo 1) 重新构建生产环境
echo 2) 重新构建开发环境
set /p rebuild_choice="请选择 (1-2): "

if "%rebuild_choice%"=="1" (
    echo 重新构建生产环境...
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo 生产环境已重新构建并启动
) else if "%rebuild_choice%"=="2" (
    echo 重新构建开发环境...
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml up -d
    echo 开发环境已重新构建并启动
) else (
    echo 无效选择
)
pause
goto MAIN_MENU

:EXIT
echo.
echo 再见!
timeout /t 2 >nul
exit

