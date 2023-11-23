# Boilerplate based bun

Javascriptランタイム「bun」をベースとしたボイラープレート。

## 環境開発の手順

### git初期化

```bash
git init
```

### [Bun](https://bun.sh/)でディレクトリを初期化

```bash
bun init

# 依存関係をインストール
bun i
```

### [Typescript](https://www.typescriptlang.org/ja/)の汎用モジュールのインストールと設定

[typesync](https://github.com/jeffijoe/typesync), [tsconfig-paths](https://github.com/dividab/tsconfig-paths)

```bash
bun add -D typesync tsconfig-paths
npm pkg set scripts.preinstall="typesync || :"
```

### [ESLint](https://eslint.org/)の設定

```bash
# eslintの初期化(設定ファイルの自動生成)
# ※モジュールをbunで管理したいため
# "Would you like to install them now?"の項目では"No"を選択
# 必要なモジュールを控えて、bun add <$モジュール名>...で追加する
npm init @eslint/config

# 依存関係のインストール(eslint以外はプロジェクトに応じて変更)
bun add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser

# 除外ファイルの作成
echo "node_modules\ndist\n.github" > .eslintignore

# package.jsonにscriptsを追加
npm pkg set scripts.lint="eslint ."

# package.jsonにscriptsを追加
npm pkg set scripts.lint="eslint ."
```

### [Prettier](https://prettier.io/)の設定

```bash
# 依存関係のインストール
bun add -D prettier

# 設定ファイルの作成
echo "/** @type {import("prettier").Config} */\nmodule.exports = {}" \
> .prettierrc.cjs

# 除外ファイルの作成
echo "node_modules\ndist\n.github\nCHANGELOG.md\nREADME.md" > .prettierignore

# package.jsonにscriptsを追加
npm pkg set scripts.format="prettier . --write"
npm pkg set scripts.fix="bun run format && bun run lint"
```

### [husky](https://typicode.github.io/husky/)と[lint-staged](https://github.com/lint-staged/lint-staged)の設定

```bash
# 初期化とモジュールインストール
bunx husky-init && bun i && bun add -D lint-staged

# フックを作成する
bun husky set .husky/pre-commit "bun lint-staged"
```

package.jsonに以下を追加

```json
{
  ...
  "lint-staged": {
    "src/**/*.{js,jsx,ts,tsx}": "eslint src --fix",
    "src/**/*": "prettier src --write"
  },
  ...
}
```

### [Release Please Action](https://github.com/google-github-actions/release-please-action)の設定

1. Github actionsでPRを作成できるように、リポジトリのSettingsタブの「Actions > General > Workflow permissions」の、`Allow GitHub Actions to create and approve pull requests`をチェックする。
2. `.github/workflows/release-please.yml`に以下の内容を記述。

```yaml
on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

name: release-please

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v3
        with:
          release-type: node
          package-name: <your-package-name>
```

3. デフォルトブランチ(おおかた`main`)にPRがマージされると、release PRが自動で作成される。
4. release PRをマージしたら完了。
5. 公式はsquash-mergeを強く推奨。

### [Vitest](https://vitest.dev/)の設定

```bash
bun add -D vitest

# package.jsonにscriptsを追加
npm pkg set scripts.test="vitest"
```
