## Ubuntu Web OS

Ubuntu Web OSは、ウェブブラウザからUbuntuサーバーを操作できるウェブベースのオペレーティングシステムインターフェースです。システム管理者やデベロッパーが、リモートサーバーに簡単にアクセスし、管理できるように設計されています。

### 機能

*   **ウェブベースのデスクトップ環境:** ブラウザから直感的なデスクトップ環境にアクセス
*   **ターミナルエミュレーター:** コマンドラインインターフェースを使用してサーバーを操作
*   **ファイルエクスプローラー:** ファイルシステムの閲覧と管理
*   **システムダッシュボード:** CPU、メモリ、ディスク使用率などのリアルタイムモニタリング
*   **認証システム:** セキュアなログインと認証

### 技術スタック

*   **フロントエンド:** React, TypeScript, Material-UI
*   **バックエンド:** Go, Gin Webフレームワーク
*   **認証:** JWT (JSON Web Tokens)

### インストール方法

#### 前提条件

*   Go 1.16以上
*   Node.js 14以上
*   npm または yarn
*   Ubuntuサーバー（推奨: Ubuntu 20.04 LTS以上）

#### バックエンドのセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/Pikakin/ubuntu-web-os.git
cd ubuntu-web-os

# 依存関係をインストール
go mod download

# バックエンドを起動
go run backend/main.go
```

#### フロントエンドのセットアップ

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係をインストール
npm install
# または
yarn install

# 開発モードで起動
npm start
# または
yarn start

# 本番用ビルド
npm run build
# または
yarn build
```

### 使用方法

1.  ブラウザで `http://localhost:8080` にアクセス
2.  デフォルトの認証情報でログイン:
    *   **ユーザー名:** `admin`
    *   **パスワード:** `password`
3.  デスクトップ環境からアプリケーションを起動して使用

### セキュリティに関する注意

*   本番環境では、必ず強力なパスワードを設定してください
*   デフォルトのJWTシークレットキーを変更してください
*   可能であれば、HTTPS経由でのみアクセスするように設定してください

### 開発者向け情報

#### プロジェクト構造

```
ubuntu-web-os/
├── backend/
│   ├── handlers/     # APIハンドラー
│   ├── main.go       # エントリーポイント
│   └── ...
├── frontend/
│   ├── public/       # 静的ファイル
│   ├── src/
│   │   ├── components/  # Reactコンポーネント
│   │   ├── services/    # APIサービス
│   │   ├── contexts/    # Reactコンテキスト
│   │   └── ...
│   └── ...
└── ...
```

#### APIエンドポイント

*   `POST /api/auth/login` - ユーザー認証
*   `GET /api/system/info` - システム情報の取得
*   `POST /api/system/execute` - コマンド実行
*   `GET /api/files` - ファイル一覧の取得
*   `GET /api/file/content` - ファイル内容の取得
*   `POST /api/file/mkdir` - ディレクトリ作成
*   `POST /api/file/delete` - ファイル/ディレクトリ削除

### ライセンス

[MIT License](LICENSE)

### 貢献

プルリクエストや機能提案は大歓迎です。大きな変更を加える前には、まずissueを開いて議論してください。

### 謝辞

このプロジェクトは以下のオープンソースライブラリを使用しています:

*   [React](https://reactjs.org/)
*   [Material-UI](https://mui.com/)
*   [Gin](https://gin-gonic.com/)
*   [JWT Go](https://github.com/golang-jwt/jwt)

© 2025 Ubuntu Web OS Project