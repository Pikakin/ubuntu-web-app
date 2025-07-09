# Ubuntu Web OS

Ubuntu Web OSは、ウェブブラウザからUbuntuサーバーを操作できるウェブベースのオペレーティングシステムインターフェースです。システム管理者やデベロッパーが、リモートサーバーに簡単にアクセスし、管理できるように設計されています。

## 機能

* **ウェブベースのデスクトップ環境:** ブラウザから直感的なデスクトップ環境にアクセス
* **ターミナル:** WebSocketを使用したリアルタイムなターミナル接続（PTY経由の本格的なターミナル体験）
* **ファイルエクスプローラー:** ファイルシステムの閲覧、編集、作成、削除
* **システムダッシュボード:** CPU、メモリ、ディスク使用率などのリアルタイムモニタリング
* **サービスモニター:** システムサービスの状態確認と管理
* **Dockerマネージャー:** Dockerコンテナ、イメージ、ネットワーク、ボリューム管理
  * コンテナの作成、開始、停止、削除
  * イメージのプル、削除
  * ネットワークとボリューム管理
  * リアルタイムログ表示
  * Docker統計情報の表示
  * Docker Composeプロジェクト管理
* **CUDAマネージャー:** NVIDIA GPU・CUDA環境の管理
  * GPU情報表示（型番、メモリ、ドライバー等）
  * リアルタイムGPU監視（使用率、温度、電力等）
  * CUDA Toolkitバージョン管理
  * cuDNNバージョン管理
  * CUDA環境変数設定
  * CUDAテスト実行
* **認証システム:** JWTベースのセキュアなログインと認証

## 技術スタック

* **フロントエンド:** 
  * React 18
  * TypeScript
  * Material-UI (MUI)
  * @xterm/xterm
  * react-draggable
  * axios

* **バックエンド:** 
  * Go
  * Gin Webフレームワーク
  * gorilla/websocket
  * golang-jwt/jwt
  * creack/pty (疑似ターミナル実装)

## インストール方法

### 前提条件

* Go 1.22以上
* Node.js 23以上
* npm または yarn
* Docker（Dockerマネージャー機能を使用する場合）
* Docker Compose（Composeプロジェクト管理を使用する場合）
* Ubuntuサーバー（推奨: Ubuntu 20.04 LTS以上）

### バックエンドのセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/Pikakin/ubuntu-web-app.git
cd ubuntu-web-app

# 依存関係をインストール
go mod download

# バックエンドを起動
go run backend/main.go
```

### フロントエンドのセットアップ

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

## 使用方法

1. ブラウザで `http://localhost:8080` にアクセス
2. デフォルトの認証情報でログイン:
   * **ユーザー名:** `admin`
   * **パスワード:** `password`
3. デスクトップ環境からアプリケーションを起動して使用

## セキュリティに関する注意

* 本番環境では、必ず強力なパスワードを設定してください
* デフォルトのJWTシークレットキーを変更してください
* 可能であれば、HTTPS経由でのみアクセスするように設定してください
* PTY（疑似ターミナル）へのアクセスは特権操作であるため、適切なユーザー権限を設定してください

## プロジェクト構造

```
ubuntu-web-app/
├── backend/
│   ├── handlers/     # APIハンドラー
│   │   ├── auth.go       # 認証関連
│   │   ├── docker.go     # Docker管理
│   │   ├── files.go      # ファイル操作
│   │   ├── services.go   # システムサービス
│   │   ├── system.go     # システム情報
│   │   └── terminal.go   # ターミナル処理
│   ├── main.go       # エントリーポイント
│   └── ...
├── frontend/
│   ├── public/       # 静的ファイル
│   │   ├── wallpapers/   # 壁紙画像
│   │   └── ...
│   ├── src/
│   │   ├── components/   # Reactコンポーネント
│   │   │   ├── Dashboard.tsx     # システムダッシュボード
│   │   │   ├── Desktop.tsx       # デスクトップ環境
│   │   │   ├── DockerManager.tsx # Dockerマネージャー
│   │   │   ├── FileExplorer.tsx  # ファイルエクスプローラー
│   │   │   ├── Login.tsx         # ログイン画面
│   │   │   ├── ServiceMonitor.tsx # サービスモニター
│   │   │   ├── StartMenu.tsx     # スタートメニュー
│   │   │   ├── Taskbar.tsx       # タスクバー
│   │   │   ├── Terminal.tsx      # ターミナル
│   │   │   └── Window.tsx        # ウィンドウコンポーネント
│   │   ├── contexts/    # Reactコンテキスト
│   │   │   ├── AuthContext.tsx   # 認証コンテキスト
│   │   │   └── SettingsContext.tsx # 設定コンテキスト
│   │   ├── services/    # APIサービス
│   │   │   ├── api.ts           # API通信
│   │   │   └── terminal.ts      # ターミナルサービス
│   │   └── ...
│   └── ...
└── ...
```

## APIエンドポイント

* **認証関連**
  * `POST /api/auth/login` - ユーザー認証とJWTトークン取得

* **システム情報**
  * `GET /api/system/info` - システム情報の取得
  * `POST /api/system/execute` - コマンド実行

* **ファイル操作**
  * `GET /api/files` - ファイル一覧の取得
  * `GET /api/file/content` - ファイル内容の取得
  * `POST /api/file/save` - ファイル内容の保存
  * `POST /api/file/mkdir` - ディレクトリ作成
  * `POST /api/file/delete` - ファイル/ディレクトリ削除

* **サービス管理**
  * `GET /api/services` - サービス一覧の取得
  * `GET /api/service/:service` - 特定サービスの状態取得
  * `POST /api/service/control` - サービスの開始/停止/再起動

* **Docker管理**
  * `GET /api/docker/containers` - コンテナ一覧の取得
  * `GET /api/docker/containers/:id` - 特定コンテナの詳細取得
  * `POST /api/docker/containers/:id/start` - コンテナ開始
  * `POST /api/docker/containers/:id/stop` - コンテナ停止
  * `POST /api/docker/containers/:id/restart` - コンテナ再起動
  * `DELETE /api/docker/containers/:id` - コンテナ削除
  * `GET /api/docker/containers/:id/logs` - コンテナログ取得
  * `POST /api/docker/containers` - コンテナ作成
  * `GET /api/docker/images` - イメージ一覧の取得
  * `POST /api/docker/images/pull` - イメージプル
  * `DELETE /api/docker/images/:id` - イメージ削除
  * `GET /api/docker/networks` - ネットワーク一覧の取得
  * `POST /api/docker/networks` - ネットワーク作成
  * `DELETE /api/docker/networks/:id` - ネットワーク削除
  * `GET /api/docker/volumes` - ボリューム一覧の取得
  * `POST /api/docker/volumes` - ボリューム作成
  * `DELETE /api/docker/volumes/:name` - ボリューム削除
  * `GET /api/docker/stats` - コンテナ統計情報の取得
  * `GET /api/docker/info` - Docker情報の取得
  * `POST /api/docker/cleanup` - 未使用リソースのクリーンアップ
  * `GET /api/docker/compose/projects` - Docker Composeプロジェクト一覧
  * `GET /api/docker/compose/project` - プロジェクト詳細の取得
  * `POST /api/docker/compose/project` - プロジェクト保存
  * `POST /api/docker/compose/up` - プロジェクト開始
  * `POST /api/docker/compose/down` - プロジェクト停止
  * `POST /api/docker/compose/restart` - プロジェクト再起動

* **WebSocket**
  * `GET /api/ws` - WebSocket接続（一般用）
  * `GET /api/terminal` - ターミナル専用WebSocket接続（PTY統合）
  * `GET /api/docker/containers/:id/logs/stream` - コンテナログストリーミング

## ライセンス

[MIT License](LICENSE)

## 貢献

プルリクエストや機能提案は大歓迎です。大きな変更を加える前には、まずissueを開いて議論してください。

## 謝辞

このプロジェクトは以下のオープンソースライブラリを使用しています:

* [React](https://reactjs.org/)
* [Material-UI](https://mui.com/)
* [@xterm/xterm](https://xtermjs.org/)
* [@xterm/addon-fit](https://github.com/xtermjs/xterm.js)
* [@xterm/addon-web-links](https://github.com/xtermjs/xterm.js)
* [react-draggable](https://github.com/react-grid-layout/react-draggable)
* [axios](https://axios-http.com/)
* [Gin](https://gin-gonic.com/)
* [gorilla/websocket](https://github.com/gorilla/websocket)
* [golang-jwt/jwt](https://github.com/golang-jwt/jwt)
* [creack/pty](https://github.com/creack/pty) - 疑似ターミナル(PTY)実装

© 2025 Ubuntu Web OS Project
