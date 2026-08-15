'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

const MAX_LEN = 140;

export default function PostComposer({
  me,
  onPosted,
}: {
  me: Profile;
  onPosted: () => void;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_LEN - content.length;
  const canPost = content.trim().length > 0 && remaining >= 0 && !posting;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handlePost() {
    if (!canPost) return;
    setPosting(true);
    setError(null);

    let image_url: string | null = null;

    try {
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${me.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('x-post-images')
          .upload(path, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('x-post-images')
          .getPublicUrl(path);

        image_url = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('x_posts').insert({
        user_id: me.id,
        content: content.trim(),
        image_url,
      });

      if (insertError) throw insertError;

      setContent('');
      clearImage();
      onPosted();
    } catch (err) {
      setError('投稿に失敗しました。もう一度試してください。');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="border-b border-[#EFF3F4] px-4 py-3">
      <div className="flex gap-3">
        <Avatar url={me.avatar_url} name={me.display_name} size={44} />
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="いま、どうしてる?"
            rows={2}
            className="w-full resize-none text-[18px] placeholder:text-[#536471] outline-none"
          />

          {imagePreview && (
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-[#EFF3F4]">
              <img src={imagePreview} alt="" className="w-full max-h-[300px] object-cover" />
              <button
                onClick={clearImage}
                className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center text-[16px]"
              >
                ×
              </button>
            </div>
          )}

          {error && <p className="text-[13px] text-[#F4212E] mt-2">{error}</p>}

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#4A5FE0] hover:bg-[#4A5FE0]/10 transition-colors"
              aria-label="画像を追加"
            >
              <ImageIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <span
                className={`text-[13px] ${
                  remaining < 0 ? 'text-[#F4212E]' : 'text-[#536471]'
                }`}
              >
                {remaining}
              </span>
              <button
                onClick={handlePost}
                disabled={!canPost}
                className="h-[36px] px-5 rounded-full bg-[#0F1419] text-white text-[14px] font-bold disabled:opacity-40 transition-opacity"
              >
                {posting ? '投稿中…' : '投稿する'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Avatar({
  url,
  name,
  size = 40,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-[#4A5FE0] text-white flex items-center justify-center font-bold shrink-0"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
      <path
        d="M21 15l-5-5-9 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
