# ozendate - 開発ドキュメント

## セットアップ

### 必要な環境

- Node.js 18 以上
- pnpm

### インストール

```bash
pnpm install
```

### 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、Gemini API キーを設定してください:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

`.env.example` をコピーして `.env` を作成することもできます:

```bash
cp .env.example .env
```

その後、`.env` ファイルを開いて実際の API キーを設定してください。

### 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで http://localhost:5173 にアクセスしてください。

### ビルド

```bash
pnpm build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

### プレビュー

ビルドした成果物をローカルでプレビューする場合:

```bash
pnpm preview
```

## プロジェクト構成

```
src/
├── components/          # Reactコンポーネント
│   ├── UploadSection.tsx      # 画像アップロード
│   ├── EditorSection.tsx      # 配置場所選択と食器選択
│   ├── LoadingSection.tsx     # 生成中の表示
│   ├── ResultSection.tsx      # 生成結果の表示
│   └── ErrorModal.tsx         # エラーモーダル
├── constants/           # 定数定義
│   └── dishes.ts              # 食器データ
├── types/              # TypeScript型定義
│   └── index.ts               # 型定義
├── utils/              # ユーティリティ関数
│   └── geminiApi.ts           # Gemini API連携
├── App.tsx             # メインコンポーネント
├── main.tsx            # エントリーポイント
└── index.css           # グローバルスタイル
```

## 技術スタック

- **React 19** - UI ライブラリ
- **TypeScript** - 型安全な開発
- **Vite** - 高速なビルドツール
- **Tailwind CSS** - ユーティリティファーストの CSS フレームワーク
- **Gemini API** - Google の生成 AI API

## 主な機能

1. **画像アップロード**: テーブルの写真をアップロード
2. **配置場所選択**: クリックして食器を置きたい場所を指定
3. **食器選択**: 8 種類の食器から選択
4. **AI 画像生成**: Gemini API で自然な合成画像を生成
5. **結果表示**: 生成された画像を表示

## コンポーネント設計

### App

- アプリケーション全体の状態管理
- 各ステップの切り替え

### UploadSection

- ファイル選択 UI
- 画像読み込み処理

### EditorSection

- アップロードした画像表示
- クリック位置の取得とマーカー表示
- 食器カードの表示と選択

### LoadingSection

- ローディングアニメーション
- 生成中メッセージ

### ResultSection

- 生成結果の画像表示
- リセットボタン

### ErrorModal

- エラーメッセージの表示
- モーダルの開閉制御

## API 統合

### Gemini API

`src/utils/geminiApi.ts` に Gemini API との連携ロジックを実装しています。

- エンドポイント: `gemini-2.5-flash-image-preview:generateContent`
- リトライ機能: 429 エラー時に指数バックオフ
- 画像入力: Base64 エンコード
- 画像出力: Base64 エンコードされた画像データ

## スタイリング

Tailwind CSS を使用して、以下の特徴を実現:

- ダークモード対応
- レスポンシブデザイン
- カスタムアニメーション (ローディングスピナー)
- ホバーエフェクト

カスタム CSS は `src/index.css` で定義しています。
