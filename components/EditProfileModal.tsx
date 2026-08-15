'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Avatar } from './PostComposer';

export default function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      let avatar_url = profile.avatar_url;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${profile.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('x-avatars')
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('x-avatars').getPublicUrl(path);
        avatar_url = data.publicUrl;
      }

      const { data: updated, error: updateError } = await supabase
        .from('x_profiles')
        .update({ display_name: displayName.trim(), bio: bio.trim(), avatar_url })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      onSaved(updated as Profile);
    } catch {
      setError('保存に失敗しました。もう一度試してください。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[420px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFF3F4] sticky top-0 bg-white">
          <button onClick={onClose} className="text-[15px]">
            キャンセル
          </button>
          <span className="font-bold text-[16px]">プロフィールを編集</span>
          <button
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
            className="h-[32px] px-4 rounded-full bg-[#0F1419] text-white text-[14px] font-bold disabled:opacity-40"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="relative">
              <Avatar url={avatarPreview} name={displayName || 'U'} size={88} />
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center text-white text-[12px]">
                変更
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && <p className="text-[13px] text-[#F4212E]">{error}</p>}

          <div>
            <label className="text-[12px] text-[#536471]">名前</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full h-[44px] rounded-[4px] border border-[#CFD9DE] px-3 text-[15px] outline-none focus:border-[#4A5FE0] mt-1"
            />
          </div>

          <div>
            <label className="text-[12px] text-[#536471]">自己紹介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              className="w-full rounded-[4px] border border-[#CFD9DE] px-3 py-2 text-[15px] outline-none focus:border-[#4A5FE0] mt-1 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
