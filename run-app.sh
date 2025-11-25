#!/bin/bash

# app-electron 应用运行脚本
# 用于在终端中运行应用并查看输出

APP_PATH="/Applications/app-electron.app/Contents/MacOS/app-electron"
LOG_DIR="$HOME/Library/Logs/app-electron"
LOG_FILE="$LOG_DIR/app-electron.log"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

echo "=========================================="
echo "启动 app-electron 应用"
echo "=========================================="
echo "应用路径: $APP_PATH"
echo "日志文件: $LOG_FILE"
echo "=========================================="
echo ""
echo "提示:"
echo "  - 按 Ctrl+C 可以停止应用"
echo "  - 所有输出会同时显示在终端和日志文件中"
echo "  - 在另一个终端运行 'tail -f $LOG_FILE' 可以查看日志"
echo ""
echo "=========================================="
echo ""

# 检查应用是否存在
if [ ! -f "$APP_PATH" ]; then
    echo "错误: 找不到应用文件 $APP_PATH"
    echo "请确保应用已安装在 /Applications/app-electron.app/"
    exit 1
fi

# 运行应用并显示输出
# 使用 2>&1 将标准错误重定向到标准输出，这样可以看到所有输出
exec "$APP_PATH" 2>&1

