# Private Cafe Order App

🍽️ プライベートカフェ向けの包括的な注文管理システム

## 📱 概要

Next.js 14 と Google Sheets を使用した、プライベートカフェ向けの注文管理アプリです。お客様の注文から管理者の業務支援まで、カフェ運営に必要な機能を一つのアプリで提供します。

## ✨ 主な機能

### 🛒 注文システム
- **カテゴリ別メニュー**: フード、デザート、ソフトドリンク、お酒の分類表示
- **作成者表示**: メニューアイテムに「by 作成者名」を表示
- **カート機能**: 複数商品の選択と数量調整
- **スタッフ確認フロー**: 注文確定時の二段階確認システム
- **注文履歴**: 個人の注文履歴表示と完了状況確認

### 🛠️ 管理者機能
- **リアルタイム注文管理**: 未完了・完了済み注文の一覧表示
- **手動更新システム**: ワンクリックでのデータ更新（前回更新からの経過時間表示）
- **楽観的更新**: 注文ステータス変更の即座のUI反映
- **新規注文ハイライト**: 未確認注文の視覚的強調
- **ユーザー別会計**: 個別売上集計とチェックアウト機能
- **総売上表示**: リアルタイムの売上集計

### 🎵 UX機能
- **効果音**: カート追加・注文完了時の音響フィードバック
- **ローディング状態**: すべての非同期処理での視覚的フィードバック
- **エラーハンドリング**: 包括的なエラー処理とユーザーへの適切な通知
- **レスポンシブデザイン**: デスクトップ・モバイル完全対応

### 👤 ユーザー管理
- **ユニークID生成**: ニックネーム + 動物での識別システム
- **管理者権限**: ローカルストレージベースの管理者フラグ
- **セッション永続化**: ローカルストレージでのユーザー情報保持

## 🏗️ 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript** - 型安全性の確保
- **Tailwind CSS** - スタイリング
- **React Hooks** - 状態管理

### バックエンド・API
- **Google Sheets API** - データストレージ
- **Google Apps Script** - サーバーレス API
- **Web Audio API** - 効果音機能

### デプロイ・管理
- **Vercel** - ホスティング
- **GitHub** - バージョン管理

## 📊 データベース構造

### メニューシート
```
name | price | stock | category | creator
-----|-------|-------|----------|--------
カフェラテ | 450 | TRUE | ソフトドリンク | たかし
チーズケーキ | 550 | TRUE | デザート | はなこ
```

### 注文シート
```
orderId | timestamp | userId | nickname | animal | item | price | completed
--------|-----------|--------|----------|--------|------|-------|----------
order_1234567890_abc123 | 2024-01-01T10:00:00.000Z | 太郎_いぬ | 太郎 | 🐶 いぬ | カフェラテ | 450 | FALSE
```

## 🚀 セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/mae-hidari/cafe-order-app.git
cd cafe-order-app
```

### 2. 依存関係のインストール
```bash
pnpm install
```

### 3. 環境変数の設定
```bash
cp .env.local.example .env.local
```

`.env.local` ファイルを編集:
```env
GOOGLE_API_KEY=your_google_api_key
MENU_SHEET_ID=your_menu_sheet_id
ORDER_SHEET_ID=your_order_sheet_id
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/your_script_id/exec
```

### 4. Google Sheets の準備

#### A. スプレッドシートの作成
1. Google Sheets で新しいスプレッドシートを作成
2. 2つのシートを作成：「Menu」と「Orders」

#### B. メニューシートの設定
ヘッダー行に以下を設定：
```
A1: name | B1: price | C1: stock | D1: category | E1: creator
```

#### C. 注文シートの設定
ヘッダー行に以下を設定：
```
A1: orderId | B1: timestamp | C1: userId | D1: nickname | E1: animal | F1: item | G1: price | H1: completed
```

#### D. 共有設定
両方のシートを「リンクを知っている全員が閲覧可能」に設定

### 5. Google Apps Script の設定

1. **script.google.com** にアクセス
2. 新しいプロジェクトを作成
3. `scripts/google-apps-script.js` の内容をコピー&ペースト
4. **デプロイ** → **新しいデプロイ** → **ウェブアプリ**
5. 設定：
   - 実行者: **自分**
   - アクセス許可: **全員**
6. デプロイ後のURLを `.env.local` の `GOOGLE_SCRIPT_URL` に設定

### 6. 開発サーバーの起動
```bash
pnpm run dev
```

## 📱 使用方法

### お客様の利用フロー
1. **ユーザー登録**: ニックネーム + 好きな動物を選択
2. **メニュー閲覧**: カテゴリ別に整理されたメニューから選択
3. **カート追加**: 商品をカートに追加し、数量調整
4. **注文確定**: スタッフ確認後に注文を確定
5. **注文履歴**: 過去の注文と完了状況を確認

### 管理者の利用フロー
1. **管理者設定**: 初回登録時に「管理者として利用する」をチェック
2. **管理画面アクセス**: ヘッダーの「🛠️ 管理画面」ボタンをクリック
3. **注文管理**: 
   - 未完了注文の確認と完了処理
   - 手動更新ボタンで最新状況を取得
   - 楽観的更新による即座のUI反映
4. **売上管理**: ユーザー別会計と総売上の確認

## 🔧 開発スクリプト

```bash
# 開発サーバー
pnpm run dev

# 本番ビルド
pnpm run build

# 本番サーバー
pnpm run start

# リンター
pnpm run lint

# 型チェック
pnpm run type-check
```

## 📁 プロジェクト構造

```
cafe-order-app/
├── app/
│   ├── admin/page.tsx          # 管理者画面
│   ├── api/                    # API Routes
│   │   ├── menu/route.ts       # メニューAPI
│   │   └── orders/             # 注文API
│   ├── checkout/page.tsx       # 会計画面
│   ├── layout.tsx              # レイアウト
│   ├── page.tsx                # メニュー画面
│   └── globals.css             # グローバルスタイル
├── components/
│   ├── BottomNav.tsx           # ボトムナビゲーション
│   ├── Cart.tsx                # カートコンポーネント
│   ├── LoadingSpinner.tsx      # ローディングスピナー
│   ├── MenuItemCard.tsx        # メニューアイテムカード
│   ├── UserIdentity.tsx        # ユーザー登録
│   └── UserOrderHistory.tsx    # 注文履歴
├── lib/
│   └── sheets.ts               # Google Sheets API
├── scripts/
│   └── google-apps-script.js   # Google Apps Script
└── public/                     # 静的ファイル
```

## 🎯 主要機能の技術詳細

### 楽観的更新 (Optimistic Updates)
- 注文ステータス変更時に即座にUIを更新
- バックグラウンドでサーバー同期
- エラー時の自動ロールバック機能

### 手動更新システム
- 自動更新を廃止し、ユーザー主導の更新に変更
- リアルタイム経過時間表示（◯秒前/◯分前）
- 安定したレイアウトの実現

### 音響フィードバック
- Web Audio API を使用した効果音
- カート追加時：軽やかな音(600Hz)
- 注文完了時：成功音(800Hz)

### エラーハンドリング
- 包括的なtry-catch文
- ユーザーフレンドリーなエラーメッセージ
- ネットワークエラー時の適切な対応

## 🌟 今後の拡張予定

- [ ] 在庫管理の自動化
- [ ] 売上レポート機能
- [ ] QRコード注文システム
- [ ] プッシュ通知
- [ ] 多言語対応

## 🤝 貢献

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 ライセンス

MIT License

## 👨‍💻 作成者

- **GitHub**: [mae-hidari](https://github.com/mae-hidari)
- **Generated with**: [Claude Code](https://claude.ai/code)

---

🤖 このプロジェクトは Claude Code によって開発されました。