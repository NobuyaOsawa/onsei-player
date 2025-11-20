# 音声プレイヤー

子供向けのシンプルな音声再生アプリケーションです。

## セットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. 開発サーバーを起動:
```bash
npm run dev
```

## 音声ファイルの追加

1. `public/audio` フォルダに音声ファイル（.mp3, .wav, .m4a など）を配置してください
2. `src/main.js` の `audioFiles` 配列にファイル名を追加してください

例:
```javascript
const audioFiles = [
  'sound1.mp3',
  'sound2.mp3',
  'sound3.wav'
]
```

## Androidアプリとしてビルド

1. プロジェクトをビルド:
```bash
npm run build
```

2. Capacitorを初期化（初回のみ）:
```bash
npx cap add android
```

3. Capacitorを同期:
```bash
npm run cap:sync
```

4. Android Studioで開く:
```bash
npm run cap:open
```

その後、Android StudioからAPKをビルドできます。

## GitHub Pagesで公開

1. GitHubにリポジトリを作成してプッシュ:
```bash
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
git push -u origin master
```

2. GitHubリポジトリの設定:
   - リポジトリページで「Settings」→「Pages」を開く
   - 「Source」で「GitHub Actions」を選択

3. リポジトリ名が「onsei-player」以外の場合:
   - `vite.config.js` の `base` パスをリポジトリ名に合わせて変更してください
   - 例: リポジトリ名が「my-audio-player」の場合、`base: '/my-audio-player/'` に変更

4. `master` または `main` ブランチにプッシュすると、自動的にビルドとデプロイが実行されます
   - デプロイ状況は「Actions」タブで確認できます
   - デプロイ完了後、`https://あなたのユーザー名.github.io/リポジトリ名/` でアクセスできます

