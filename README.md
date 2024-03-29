# MAIL SORTING

Googleの[Apps script](https://workspace.google.co.jp/intl/ja/products/apps-script/)を使って、Gmailを自動で分類しTODOリスト化するプログラムです。ローカル環境は node か bun、静的型付けのためにTypeScriptを使用、GASの管理には[clasp](https://github.com/google/clasp)を使っています。

スプレッドシート、Notion、またはJira Softwareのプロジェクトに、メールの内容をTODOとして登録することを想定しています。

## 使い方

`bun i`等で事前に依存関係をインストールしておいてください。NodeやBun、claspはグローバルにインストールしている想定です。

### ローカルでの開発

.clasp.json適切に設定してください。

```json
{
  "scriptId": "自分のGASのスクリプトID",
  "rootDir": "dist/"
}
```

### ファイルのバンドル

/dist にバンドルされたファイルが生成されます。内部的には[esbuild](https://esbuild.github.io/)を使っています。

```bash
bun run build
```

### バンドルと同時にファイルを本番環境へプッシュ

```bash
bun run deploy
```

## clespについて

Node.jsやBunの他に、clespを事前にインストールする必要があります。
詳細は[github](https://github.com/google/clasp#readme)か[リファレンス](https://developers.google.com/apps-script/guides/clasp?hl=en)を参照。

### clespのインストール

```bash
# グローバルにインストール
npm i @google/clasp -g

# TypeScriptの場合は、型定義ファイルをインストール
bun add -D @types/google-apps-script
```

### clespのログイン

事前に「Google Apps Script API」を有効にする。
[https://script.google.com/home/usersettings](https://script.google.com/home/usersettings) にアクセスして、「オン」にする。

```bash
clasp login
```

ブラウザが開いて許可を求められるので、許可する。

### 新規作成

```bash
clasp create
```

### ローカルに反映

```bash
clasp pull ${既存のGASの「スクリプトID」}
```

### デプロイ

```bash
clasp push
```
