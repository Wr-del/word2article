#!/bin/bash

# ECDICT 词典下载脚本
# 从 GitHub 下载完整的 ECDICT 词典数据

echo "=== ECDICT 词典下载脚本 ==="
echo ""
echo "请手动下载 ECDICT 词典数据："
echo ""
echo "1. 访问: https://github.com/skywind3000/ECDICT/releases"
echo "2. 下载最新版本的 ecdict.csv.7z 文件"
echo "3. 解压后将 ecdict.csv 放到项目根目录"
echo "4. 运行: npm run build-dict"
echo ""
echo "或者使用以下命令直接下载（如果链接有效）："
echo ""
echo "# 下载 ECDICT 数据"
echo "wget https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict.csv.7z"
echo ""
echo "# 解压（需要安装 p7zip）"
echo "7z x ecdict.csv.7z"
echo ""
echo "# 运行构建脚本"
echo "npm run build-dict"
echo ""
echo "=== 说明 ==="
echo "ECDICT 包含约 77 万词条，文件大小约 170MB"
echo "构建后的词典文件将生成在 data/dict/ 目录下"