# サンプル（プロダクト名）

[![IMAGE ALT TEXT HERE](https://jphacks.com/wp-content/uploads/2025/05/JPHACKS2025_ogp.jpg)](https://www.youtube.com/watch?v=lA9EluZugD8)

## 製品概要
### 背景(製品開発のきっかけ、課題等）
### 製品説明（具体的な製品の説明）
### 特長
#### 1. 特長1
#### 2. 特長2
#### 3. 特長3

### 解決出来ること
### 今後の展望
### 注力したこと（こだわり等）
* 
* 

## 開発技術
### 活用した技術
#### API・データ
* 
* 

#### フレームワーク・ライブラリ・モジュール
* 
* 

#### デバイス
* 
* 

### 独自技術
#### ハッカソンで開発した独自機能・技術
* 独自で開発したものの内容をこちらに記載してください
* 特に力を入れた部分をファイルリンク、またはcommit_idを記載してください。


# [prefix（プレフィックス）](https://qiita.com/numanomanu/items/45dd285b286a1f7280ed)
- chore
    * プロジェクト作成やライブラリの追加
- feat
    * 機能・処理の新規追加 / 未完成機能の進捗
- update
    * 完成した機能・処理の修正
- fix
    * バグ修正
- style
    * ソースコードのスタイル修正（改行など）
- refactor
    * ソースコードのリファクタリング
- doc
    * ドキュメント追加・編集


# 開発フロー
## issue駆動開発 ＋ GitHubフロー
1. issueで仕事を割り当て
2. 命名規則に従ったブランチを作って開発
3. prefixをつけて適宜commit
4. 完成したらテストとLinterが通るかを確認
    1. `rails test`
    2. `rubocop`
5. 問題がなければプルリクエストを作成

## ブランチ命名規則
```
[prefix]/[issue番号]/[issue内容]
```

またはissueが無い場合は
```
[prefix]/date-[yyyymmdd]/[branch内容]
```

### 例
```
chore/1/setup-rails
```

```
feat/2/user-model
```

```
doc/date-20200119/separate-readme-to-some-docs
```

