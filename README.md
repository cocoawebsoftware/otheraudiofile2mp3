# 🎵 Audio → MP3 コンバーター

さまざまな音声ファイルを MP3 に変換できる、シンプルで使いやすいオーディオコンバーターです。ブラウザ上で完全にローカル動作し、サーバーへのアップロードは不要です。

## 機能紹介

### ✨ 主な機能

- **多形式対応**: WAV, OGG, FLAC, AAC, M4A, WMA, AWA, MP4, WEBM に対応
- **ドラッグ&ドロップ**: ファイルをドラッグして簡単にアップロード
- **複数ファイル同時変換**: 複数のファイルを一度に変換可能
- **ビットレート選択**: 128kbps / 192kbps / 320kbps から選択可能
- **進行状況表示**: リアルタイムで変換進捗を表示
- **ZIP一括ダウンロード**: 変換後のファイルをZIPで一括ダウンロード
- **変換履歴**: 変換済みファイルの履歴を表示
- **ダークモード**: 目に優しいダークモードを搭載
- **レスポンシブデザイン**: スマートフォンにも対応
- **エラーログ**: 変換エラーをログに記録
- **完全ローカル動作**: サーバー不要、データは一切送信されません

## スクリーンショット

```
Light Mode:
┌─────────────────────────────────────┐
│  🎵 Audio → MP3 コンバーター    🌙  │
│  様々な音声ファイルをMP3に変換      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         ファイルをD&Dで追加         │
└─────────────────────────────────────┘
┌─ ビットレート選択 ────────────────┐
│ 192 kbps (標準品質) ▼             │
└─────────────────────────────────────┘
┌─ 変換キュー ──────────────────┐
│ ✓ 変換を開始  ⬇ ZIP一括DL      │
└─────────────────────────────────────┘
```

## 導入方法

### 1. リポジトリをクローン

```bash
git clone https://github.com/cocoawebsoftware/otheraudiofile2mp3.git
cd otheraudiofile2mp3
```

### 2. ファイル構成

```
otheraudiofile2mp3/
├── index.html      # HTMLファイル
├── style.css       # スタイルシート
├── script.js       # JavaScriptロジック
├── assets/         # アセット（オプション）
└── README.md       # このファイル
```

### 3. ローカルサーバーで実行

#### Python 3を使用:
```bash
python -m http.server 8000
```

#### Python 2を使用:
```bash
python -m SimpleHTTPServer 8000
```

#### Node.jsを使用:
```bash
npm install -g http-server
http-server
```

#### VS Codeを使用:
Live Server拡張機能をインストール後、ファイルを右クリックして「Open with Live Server」を選択

### 4. ブラウザでアクセス

```
http://localhost:8000
```

## 使用方法

### 基本的な使い方

1. **ファイルを追加**
   - ドラッグ&ドロップ: ファイルをドロップゾーンにドラッグ
   - ファイル選択: 「ファイルを選択」ボタンをクリック
   - 複数選択可能

2. **ビットレートを選択**
   - 128 kbps: 低品質・小ファイルサイズ
   - 192 kbps: 標準品質（推奨）
   - 320 kbps: 高品質・大ファイルサイズ

3. **変換を開始**
   - 「✓ 変換を開始」ボタンをクリック
   - 進捗状況がリアルタイムで表示されます

4. **ダウンロード**
   - 個別: キューのファイルの「⬇」ボタンをクリック
   - 一括: 「⬇ ZIP で一括ダウンロード」をクリック

### AWAファイル対応

- `.awa` ファイルは自動で検出されます
- AWAコンテナから音声抽出を試行します
- 非対応形式の場合は、エラーメッセージが表示されます
- ブラウザがクラッシュしないようにエラーハンドリングを実装しています

### 変換のキャンセル

- 変換中に「✕ 変換をキャンセル」ボタンをクリック
- すべての処理が停止されます

## 対応形式

### 入力形式

| 形式 | 拡張子 | 説明 |
|------|--------|------|
| WAV | .wav | Windows Audio |
| OGG | .ogg | Ogg Vorbis |
| FLAC | .flac | Free Lossless Audio |
| AAC | .aac | Advanced Audio |
| MP4 Audio | .m4a | MPEG-4 Audio |
| WMA | .wma | Windows Media Audio |
| AWA | .awa | AWA形式（実験的） |
| MP4 | .mp4 | MP4コンテナ（音声のみ） |
| WebM | .webm | WebM Audio |

### 出力形式

- **MP3**: MPEG-1 Audio Layer III

## 対応ブラウザ

| ブラウザ | バージョン | 対応状況 |
|---------|-----------|--------|
| Chrome | 67+ | ✅ 対応 |
| Firefox | 79+ | ✅ 対応 |
| Safari | 14.1+ | ✅ 対応 |
| Edge | 79+ | ✅ 対応 |
| Opera | 54+ | ✅ 対応 |
| Android Chrome | 最新 | ✅ 対応 |
| iOS Safari | 14.1+ | ✅ 対応 |
| IE 11 | - | ❌ 非対応 |

### 推奨環境

- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **RAM**: 2GB以上推奨
- **ネット接続**: FFmpeg.wasmの読み込みに必要

## 技術仕様

### 使用技術

- **HTML5**: セマンティックマークアップ
- **CSS3**: Flexbox, Grid, CSS変数
- **JavaScript (ES6+)**: 非同期処理、Promise
- **FFmpeg.wasm**: オーディオ変換エンジン
- **JSZip**: ZIP圧縮ライブラリ

### アーキテクチャ

```
┌─────────────────────────────┐
│   User Interface (HTML/CSS)  │
├─────────────────────────────┤
│   Application Logic (JS)     │
├─────────────────────────────┤
│   FFmpeg.wasm (WASM)        │
├─────────────────────────────┤
│   Browser APIs              │
│   - File API                │
│   - Blob API                │
│   - LocalStorage            │
└─────────────────────────────┘
```

### パフォーマンス

- **初期化**: 約2-3秒（FFmpeg.wasm読み込み）
- **変換速度**: ファイルサイズに依存（通常2-10秒/ファイル）
- **メモリ使用**: 約100-500MB（FFmpeg + ファイルバッファ）

## トラブルシューティング

### Q: FFmpegが読み込まれない

**A:**
1. ネット接続を確認
2. ブラウザのコンソールでエラーを確認
3. ブラウザのキャッシュをクリア
4. 別のブラウザで試す

### Q: 変換が遅い

**A:**
1. ファイルサイズを確認
2. 他のアプリケーションを終了（メモリ開放）
3. ビットレートを下げる

### Q: AWAファイルが対応していないと表示される

**A:**
1. ファイル形式を確認
2. 別のコンバーターで一度MP3に変換後、使用
3. GitHub Issues で報告

### Q: スマートフォンで使用できない

**A:**
1. 最新ブラウザを使用していることを確認
2. ブラウザのプライベートモードを使用
3. ストレージ容量を確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

```
MIT License

Copyright (c) 2026 cocoawebsoftware

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 外部リソース

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg.wasm GitHub](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [MDN Web Docs - Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [JSZip Documentation](https://stuk.github.io/jszip/)

## 貢献

バグ報告や機能リクエストは、GitHubのIssuesで受け付けています。

### 開発に参加する

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. コミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## よくある質問

### Q: ファイルはサーバーに送信される？

**A:** いいえ。このアプリケーションは完全にブラウザ上で動作します。ファイルはローカルに保存され、サーバーには一切送信されません。

### Q: オフラインで使用できる？

**A:** FFmpeg.wasmの初期化時のみネット接続が必要です。その後はオフラインで使用可能です。

### Q: 変換済みファイルはどこに保存される？

**A:** ブラウザのメモリに一時的に保存されます。ブラウザを閉じるとクリアされます。

### Q: 大きなファイルに対応している？

**A:** ブラウザのメモリ制限に依存します。通常1GB程度のファイルまで対応可能です。

## 更新履歴

### v1.0.0 (2026-05-25)

- 初版リリース
- 基本的な音声変換機能
- ドラッグ&ドロップ対応
- ダークモード対応
- ZIP一括ダウンロード機能

## 今後の予定

- 🔄 オーディオプレビア機能
- 🎚️ イコライザー機能
- 📊 高度な統計情報表示
- 🔐 パスワード保護オプション
- 🌍 多言語対応
- 📱 ネイティブアプリ版

## サポート

問題が発生した場合:

1. [GitHub Issues](https://github.com/cocoawebsoftware/otheraudiofile2mp3/issues) で確認
2. ブラウザのコンソール（F12）でエラーを確認
3. 新しいIssueを作成して報告

## 作成者

**cocoawebsoftware**

- GitHub: [@cocoawebsoftware](https://github.com/cocoawebsoftware)

## 謝辞

- FFmpeg.wasm チーム
- JSZip 開発者
- すべてのコントリビューター

---

**Happy Converting! 🎵**

このプロジェクトが役に立ったら、⭐ をお願いします！