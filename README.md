# × (バツ)

X風のミニSNS。Next.js 14 (App Router) + Tailwind CSS + Supabase。

## できること
- サインアップ / ログイン(email + password)
- 投稿(テキスト140字まで + 画像1枚まで)
- いいね / コメント(1階層)
- プロフィール(名前・アイコン・自己紹介の編集)
- タイムラインはSupabase Realtimeで自動更新

全テーブル・Storageバケットは `x_` / `x-` プレフィックス付きで作られるので、
**既存の別アプリ(MyDropなど)と同じSupabaseプロジェクトに相乗りさせても名前が衝突しません。**

## セットアップ手順

### 1. Supabaseプロジェクトを準備
新規プロジェクトは作らず、既存の(例:MyDropの)Supabaseプロジェクトを使う。
1. MyDropのSupabaseプロジェクトを開く
2. SQL Editorで `supabase/0001_init.sql` を実行
3. 続けて `supabase/0002_avatars_bucket.sql` を実行
4. Project Settings → API から `Project URL` と `anon public key` を確認(MyDropで使ってるものと同じ値でOK)

※ 新規にSupabaseプロジェクトを作る場合も手順は同じ。

### 2. 環境変数
`.env.local.example` を `.env.local` にリネームして、値を埋める。

```
NEXT_PUBLIC_SUPABASE_URL=あなたのURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのanon key
```

### 3. インストール & 起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開くと `/login` にリダイレクトされる。
`アカウントを作成` からユーザーを作って試せる。

### 4. Vercelにデプロイ
1. このリポジトリをGitHubにpush
2. Vercelで new project → リポジトリを選択
3. Environment Variables に `.env.local` と同じ2つを設定
4. Deploy

## フォルダ構成

```
app/
  login/page.tsx          ログイン画面
  signup/page.tsx         サインアップ画面
  page.tsx                ホーム(タイムライン)
  profile/[username]/     プロフィールページ
  layout.tsx / globals.css
components/
  AppShell.tsx             サイドバー(デスクトップ)/ 下タブバー(モバイル)
  Timeline.tsx              タイムライン取得+Realtime購読
  PostComposer.tsx          投稿作成ボックス
  PostCard.tsx               投稿カード(いいね・コメント)
  ProfileHeader.tsx / ProfileFeed.tsx / ProfilePageClient.tsx
  EditProfileModal.tsx      プロフィール編集モーダル
lib/
  supabase/client.ts        ブラウザ用クライアント
  supabase/server.ts        サーバー用クライアント
  types.ts                  共通の型
middleware.ts               未ログイン時のリダイレクト制御
supabase/
  0001_init.sql              x_profiles/x_posts/x_likes/x_comments + RLS + x-post-imagesバケット
  0002_avatars_bucket.sql    x-avatarsバケット
```

## テーブル/バケット名一覧(MyDropとの衝突回避用)
- テーブル: `x_profiles`, `x_posts`, `x_likes`, `x_comments`
- Storageバケット: `x-post-images`, `x-avatars`
- トリガー関数: `handle_new_user_x` / トリガー名: `on_auth_user_created_x`

## 既知の制約 / 今後の拡張候補
- フォロー機能なし(全員のタイムラインが見える)
- 通知機能なし
- 画像は1投稿1枚まで
- コメントはネストなし(返信への返信は不可)
- ログインはusernameではなくemailベース

これらは後から追加できる設計にしてあるので、必要になったタイミングで拡張していく想定。
