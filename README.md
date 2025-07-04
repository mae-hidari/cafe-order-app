# Private Cafe Order App

スマホ向けプライベートカフェ注文アプリ

## 概要

Next.js 14 と Google Sheets API を使用した、プライベートカフェ向けの注文管理アプリです。スマートフォンでの使用に最適化されており、リアルタイムでメニューの確認と注文が可能です。

## 主な機能

- 📱 **スマホ最適化**: スマートフォンでの使用に最適化されたレスポンシブデザイン
- 🍽️ **リアルタイムメニュー**: Google Sheets から30秒間隔でメニューを自動更新
- 🛒 **カート機能**: 複数商品の選択と数量調整
- 💳 **注文管理**: ユーザー名付きで注文を Google Sheets に記録
- 📊 **支払い集計**: ユーザー別の支払い金額を自動集計
- 🌙 **ダークモード**: ライト/ダークモードに対応
- 🔔 **通知機能**: トースト通知でユーザーフィードバック

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks
- **API**: Google Sheets v4 API
- **デプロイ**: Vercel
- **コード管理**: GitHub

## セットアップ手順

### 1. 自動セットアップ（推奨）

```bash
bash scripts/setup.sh
```

### 2. 手動セットアップ

#### 前提条件

- Node.js 18.0.0 以上
- pnpm
- GitHub CLI
- Vercel CLI

#### 手順

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/mae-hidari/cafe-order-app.git
   cd cafe-order-app
   ```

2. **依存関係のインストール**
   ```bash
   pnpm install
   ```

3. **環境変数の設定**
   ```bash
   cp .env.local.example .env.local
   # .env.local を編集して必要な値を設定
   ```

4. **開発サーバーの起動**
   ```bash
   pnpm run dev
   ```

### 3. Google Sheets の設定

#### メニューシート（Menu）

| 列名 | 内容 | 例 |
|------|------|-----|
| name | 商品名 | コーヒー |
| price | 価格 | 300 |

#### オーダーシート（Order）

| 列名 | 内容 | 例 |
|------|------|-----|
| timestamp | 注文日時 | 2024-01-01T10:00:00.000Z |
| user | ユーザー名 | 山田太郎 |
| item | 商品名 | コーヒー |
| price | 価格 | 300 |

#### 共有設定

両方のシートを「リンクを知っている全員が閲覧可能」に設定してください。

### 4. Google Apps Script の設定

1. **script.google.com** にアクセス
2. **新しいプロジェクト** を作成
3. **scripts/google-apps-script.js** の内容をコピー&ペースト
4. **デプロイ** → **新しいデプロイ** → **ウェブアプリ**
5. 設定：
   - 実行者: **自分**
   - アクセス許可: **全員**
6. **デプロイ** をクリックしてURLを取得
7. 取得したURLを `.env.local` の `GOOGLE_SCRIPT_URL` に設定

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `GOOGLE_API_KEY` | Google Sheets API キー | `AIza...` |
| `MENU_SHEET_ID` | メニューシートID | `1AbcD...` |
| `ORDER_SHEET_ID` | オーダーシートID | `1XyZ...` |
| `GOOGLE_SCRIPT_URL` | Google Apps Script Web App URL | `https://script.google.com/macros/s/.../exec` |

**重要**: これらの環境変数はサーバーサイドでのみ使用され、ブラウザに公開されません。

## 利用可能なスクリプト

- `pnpm run dev` - 開発サーバーの起動
- `pnpm run build` - 本番用ビルド
- `pnpm run start` - 本番サーバーの起動
- `pnpm run lint` - ESLint実行
- `pnpm run type-check` - TypeScript型チェック

## プロジェクト構造

```
cafe-order-app/
├── app/
│   ├── layout.tsx          # レイアウト
│   ├── page.tsx            # メニュー画面
│   ├── checkout/page.tsx   # 会計画面
│   └── globals.css         # グローバルスタイル
├── components/
│   ├── MenuItemCard.tsx    # メニューアイテムカード
│   ├── Cart.tsx           # カートコンポーネント
│   └── Toast.tsx          # トースト通知
├── lib/
│   └── sheets.ts          # Google Sheets API
├── scripts/
│   └── setup.sh           # 自動セットアップスクリプト
└── public/                # 静的ファイル
```

## API仕様

### Google Sheets API使用

- **読み取り**: メニューデータと注文データの取得
- **書き込み**: 新規注文の追加
- **更新間隔**: 30秒

### エラーハンドリング

- API通信エラー時のトースト通知
- 入力値検証
- 空データの適切な処理

## 貢献

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ライセンス

MIT License

## 作成者

- **GitHub**: [mae-hidari](https://github.com/mae-hidari)
- **Generated with**: [Claude Code](https://claude.ai/code)

---

🤖 このアプリは Claude Code によって生成されました。