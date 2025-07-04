#!/usr/bin/env bash
set -e

echo "🚀 Private Cafe Order App - 自動環境構築スクリプト"
echo "================================================="

########################################################
# 0) 引数処理 & 対話入力
########################################################
GITHUB_REPO="mae-hidari/cafe-order-app"
GOOGLE_API_KEY="AIzaSyCu99etpuXJupwhuX5G9JGJtoeY8wVpVb8"
MENU_SHEET_ID="1E2mHNN2lNkrzAkx_SaAoLzVAtV9rCefdDv12vYXuuaU"
ORDER_SHEET_ID="1GVABLdcEMLSaMsv_HopZtxQTcUCvtKdpQmQiGPlcxBQ"

while getopts g:k:m:o: flag; do
  case "${flag}" in
    g) GITHUB_REPO=${OPTARG} ;;
    k) GOOGLE_API_KEY=${OPTARG} ;;
    m) MENU_SHEET_ID=${OPTARG} ;;
    o) ORDER_SHEET_ID=${OPTARG} ;;
  esac
done

# 値が渡されていなければ対話で聞く
if [ -z "$GITHUB_REPO" ]; then read -rp "GitHub repo (user/name): " GITHUB_REPO; fi
if [ -z "$GOOGLE_API_KEY" ]; then read -rp "GOOGLE_API_KEY: " GOOGLE_API_KEY; fi
if [ -z "$MENU_SHEET_ID" ]; then read -rp "MENU_SHEET_ID: " MENU_SHEET_ID; fi
if [ -z "$ORDER_SHEET_ID" ]; then read -rp "ORDER_SHEET_ID: " ORDER_SHEET_ID; fi

echo "✅ 設定値:"
echo "  - GitHub Repo: $GITHUB_REPO"
echo "  - Google API Key: ${GOOGLE_API_KEY:0:10}..."
echo "  - Menu Sheet ID: $MENU_SHEET_ID"
echo "  - Order Sheet ID: $ORDER_SHEET_ID"

########################################################
# 1) 依存関係チェック & インストール
########################################################
echo ""
echo "🔍 依存関係をチェック中..."

# Node.js チェック
if ! command -v node &> /dev/null; then
  echo "❌ Node.js がインストールされていません。"
  echo "https://nodejs.org/ からインストールしてください。"
  exit 1
fi

# pnpm チェック
if ! command -v pnpm &> /dev/null; then
  echo "📦 pnpm をインストール中..."
  npm install -g pnpm
fi

# GitHub CLI チェック
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI がインストールされていません。"
  echo "https://cli.github.com/ からインストールしてください。"
  exit 1
fi

# Vercel CLI チェック
if ! command -v vercel &> /dev/null; then
  echo "📦 Vercel CLI をインストール中..."
  npm install -g vercel
fi

########################################################
# 2) プロジェクトディレクトリに移動
########################################################
echo ""
echo "📁 プロジェクトディレクトリに移動中..."
cd "$(dirname "$0")/.."

########################################################
# 3) パッケージインストール
########################################################
echo ""
echo "📦 パッケージをインストール中..."
pnpm install

########################################################
# 4) 環境変数設定
########################################################
echo ""
echo "🔧 環境変数を設定中..."

# .env.local を作成
cat <<EOF > .env.local
GOOGLE_API_KEY=$GOOGLE_API_KEY
MENU_SHEET_ID=$MENU_SHEET_ID
ORDER_SHEET_ID=$ORDER_SHEET_ID
EOF

echo "✅ .env.local を作成しました"

########################################################
# 5) 開発サーバーの動作確認
########################################################
echo ""
echo "🧪 開発サーバーの動作確認中..."
pnpm run build
if [ $? -eq 0 ]; then
  echo "✅ ビルドが成功しました"
else
  echo "❌ ビルドに失敗しました"
  exit 1
fi

########################################################
# 6) Git 初期化 & GitHub へ push
########################################################
echo ""
echo "🔄 Git リポジトリを初期化中..."

# 既存の .git があれば削除
if [ -d ".git" ]; then
  rm -rf .git
fi

git init
git add .
git commit -m "feat: initial commit - private cafe order app

✨ Features:
- Next.js 14 with TypeScript
- Google Sheets API integration
- Mobile-first responsive design
- Real-time menu updates
- Cart functionality
- Order management
- User payment tracking

🎯 Generated with Claude Code"

# GitHub リポジトリ作成 & Push
echo ""
echo "🚀 GitHub リポジトリを作成中..."
gh repo create "$GITHUB_REPO" --source=. --public --push --description "スマホ向けプライベートカフェ注文アプリ"

########################################################
# 7) Vercel 連携 & デプロイ
########################################################
echo ""
echo "🌐 Vercel にデプロイ中..."

# Vercel プロジェクトを作成
vercel --confirm --force

# 環境変数を設定
vercel env add GOOGLE_API_KEY "$GOOGLE_API_KEY" --force
vercel env add MENU_SHEET_ID "$MENU_SHEET_ID" --force  
vercel env add ORDER_SHEET_ID "$ORDER_SHEET_ID" --force

# 本番デプロイ
vercel --prod --force

########################################################
# 8) 完了メッセージ
########################################################
echo ""
echo "🎉 セットアップが完了しました！"
echo "================================================="
echo ""
echo "📋 次のステップ:"
echo "1. GitHub: https://github.com/$GITHUB_REPO"
echo "2. Vercel Dashboard で本番URLを確認"
echo "3. Google Sheets のメニューとオーダーシートを準備"
echo ""
echo "💡 ローカル開発を開始する場合:"
echo "   pnpm run dev"
echo ""
echo "🔧 Google Sheets 設定:"
echo "   - メニューシート: 'Menu' タブに 'name' と 'price' 列を作成"
echo "   - オーダーシート: 'Order' タブに 'timestamp', 'user', 'item', 'price' 列を作成"
echo "   - 両方のシートを「リンクを知っている全員」に公開設定"
echo ""
echo "✅ 全ての設定が完了しました！"