#!/bin/bash
cd "$(dirname "$0")"

# Добавляем стандартные пути для macOS (Apple Silicon M-серии и Intel Homebrew/Node)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Освобождаем порт 5173, если он занят
OLD_PID=$(lsof -ti :5173)
if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null
    sleep 1
fi

echo "========================================="
echo "  CocktailCalc Pro Dev Server (macOS)"
echo "========================================="
echo ""
echo "URL: http://localhost:5173"
echo ""
echo "Остановить: нажмите Ctrl + C"
echo ""

# Открываем браузер через 1 секунду после старта
(sleep 1 && open "http://localhost:5173") &

npm run dev

if [ $? -ne 0 ]; then
    echo ""
    echo "Ошибка запуска сервера. Нажмите любую клавишу..."
    read -n 1
fi