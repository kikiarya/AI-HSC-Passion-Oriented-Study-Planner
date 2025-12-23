#!/bin/bash

# HSC Power - Docker 启动脚本
# Docker Start Script for HSC Power Application

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message "$RED" "❌ Docker 未安装。请先安装 Docker。"
        print_message "$YELLOW" "访问: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_message "$GREEN" "✅ Docker 已安装"
}

# 检查 Docker Compose 是否安装
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_message "$RED" "❌ Docker Compose 未安装。请先安装 Docker Compose。"
        exit 1
    fi
    print_message "$GREEN" "✅ Docker Compose 已安装"
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f "backend/.env" ]; then
        print_message "$YELLOW" "⚠️  backend/.env 文件不存在"
        if [ -f "backend/.env.example" ]; then
            print_message "$BLUE" "📋 发现 .env.example 文件，正在复制..."
            cp backend/.env.example backend/.env
            print_message "$YELLOW" "请编辑 backend/.env 文件，填入正确的配置信息"
            print_message "$YELLOW" "然后重新运行此脚本"
            exit 1
        else
            print_message "$RED" "❌ 请创建 backend/.env 文件并配置环境变量"
            exit 1
        fi
    fi
    print_message "$GREEN" "✅ 环境变量文件存在"
}

# 显示菜单
show_menu() {
    echo ""
    print_message "$BLUE" "=================================="
    print_message "$BLUE" "  HSC Power - Docker 管理"
    print_message "$BLUE" "=================================="
    echo "1) 启动生产环境 (Production)"
    echo "2) 启动开发环境 (Development)"
    echo "3) 停止所有服务"
    echo "4) 重启服务"
    echo "5) 查看服务状态"
    echo "6) 查看日志"
    echo "7) 清理 Docker 资源"
    echo "8) 重新构建并启动"
    echo "0) 退出"
    print_message "$BLUE" "=================================="
    echo -n "请选择操作 (0-8): "
}

# 启动生产环境
start_production() {
    print_message "$BLUE" "🚀 启动生产环境..."
    docker-compose up -d --build
    print_message "$GREEN" "✅ 生产环境已启动"
    print_message "$YELLOW" "前端访问: http://localhost"
    print_message "$YELLOW" "后端访问: http://localhost:3000"
}

# 启动开发环境
start_development() {
    print_message "$BLUE" "🚀 启动开发环境..."
    docker-compose -f docker-compose.dev.yml up --build
    print_message "$GREEN" "✅ 开发环境已启动"
    print_message "$YELLOW" "前端访问: http://localhost:5173"
    print_message "$YELLOW" "后端访问: http://localhost:3000"
}

# 停止服务
stop_services() {
    print_message "$BLUE" "🛑 停止所有服务..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    print_message "$GREEN" "✅ 服务已停止"
}

# 重启服务
restart_services() {
    print_message "$BLUE" "🔄 重启服务..."
    echo "1) 重启生产环境"
    echo "2) 重启开发环境"
    echo -n "请选择 (1-2): "
    read restart_choice
    
    case $restart_choice in
        1)
            docker-compose restart
            print_message "$GREEN" "✅ 生产环境已重启"
            ;;
        2)
            docker-compose -f docker-compose.dev.yml restart
            print_message "$GREEN" "✅ 开发环境已重启"
            ;;
        *)
            print_message "$RED" "无效选择"
            ;;
    esac
}

# 查看服务状态
view_status() {
    print_message "$BLUE" "📊 服务状态:"
    echo ""
    echo "生产环境:"
    docker-compose ps
    echo ""
    echo "开发环境:"
    docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "未运行"
}

# 查看日志
view_logs() {
    echo "1) 查看生产环境日志"
    echo "2) 查看开发环境日志"
    echo "3) 查看后端日志"
    echo "4) 查看前端日志"
    echo -n "请选择 (1-4): "
    read log_choice
    
    case $log_choice in
        1)
            docker-compose logs -f
            ;;
        2)
            docker-compose -f docker-compose.dev.yml logs -f
            ;;
        3)
            echo "生产环境 (p) 还是开发环境 (d)? "
            read env_choice
            if [ "$env_choice" = "d" ]; then
                docker-compose -f docker-compose.dev.yml logs -f backend
            else
                docker-compose logs -f backend
            fi
            ;;
        4)
            echo "生产环境 (p) 还是开发环境 (d)? "
            read env_choice
            if [ "$env_choice" = "d" ]; then
                docker-compose -f docker-compose.dev.yml logs -f frontend
            else
                docker-compose logs -f frontend
            fi
            ;;
        *)
            print_message "$RED" "无效选择"
            ;;
    esac
}

# 清理 Docker 资源
cleanup_docker() {
    print_message "$YELLOW" "⚠️  这将清理所有未使用的 Docker 资源"
    echo -n "确认继续? (y/n): "
    read confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        print_message "$BLUE" "🧹 清理 Docker 资源..."
        docker system prune -a --volumes -f
        print_message "$GREEN" "✅ 清理完成"
    else
        print_message "$YELLOW" "已取消"
    fi
}

# 重新构建并启动
rebuild_and_start() {
    echo "1) 重新构建生产环境"
    echo "2) 重新构建开发环境"
    echo -n "请选择 (1-2): "
    read rebuild_choice
    
    case $rebuild_choice in
        1)
            print_message "$BLUE" "🔨 重新构建生产环境..."
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
            print_message "$GREEN" "✅ 生产环境已重新构建并启动"
            ;;
        2)
            print_message "$BLUE" "🔨 重新构建开发环境..."
            docker-compose -f docker-compose.dev.yml down
            docker-compose -f docker-compose.dev.yml build --no-cache
            docker-compose -f docker-compose.dev.yml up -d
            print_message "$GREEN" "✅ 开发环境已重新构建并启动"
            ;;
        *)
            print_message "$RED" "无效选择"
            ;;
    esac
}

# 主程序
main() {
    print_message "$GREEN" "🎓 HSC Power - Docker 管理脚本"
    
    # 检查依赖
    check_docker
    check_docker_compose
    check_env_file
    
    # 主循环
    while true; do
        show_menu
        read choice
        
        case $choice in
            1)
                start_production
                ;;
            2)
                start_development
                ;;
            3)
                stop_services
                ;;
            4)
                restart_services
                ;;
            5)
                view_status
                ;;
            6)
                view_logs
                ;;
            7)
                cleanup_docker
                ;;
            8)
                rebuild_and_start
                ;;
            0)
                print_message "$GREEN" "👋 再见!"
                exit 0
                ;;
            *)
                print_message "$RED" "❌ 无效选择，请重试"
                ;;
        esac
        
        echo ""
        echo -n "按 Enter 继续..."
        read
    done
}

# 运行主程序
main

