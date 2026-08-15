'use client';

import { useState } from 'react';
import type { Profile } from '@/lib/types';
import { Avatar } from './PostComposer';
import EditProfileModal from './EditProfileModal';

export default function ProfileHeader({
  profile,
  isMe,
  onUpdated,
}: {
  profile: Profile;
  isMe: boolean;
  onUpdated: (p: Profile) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="border-b border-[#EFF3F4] px-4 py-5">
      <div className="flex items-start justify-between">
        <Avatar url={profile.avatar_url} name={profile.display_name} size={72} />
        {isMe && (
          <button
            onClick={() => setEditing(true)}
            className="h-[34px] px-4 rounded-full border border-[#CFD9DE] text-[14px] font-bold hover:bg-[#F7F8F8] transition-colors"
          >
            プロフィールを編集
          </button>
        )}
      </div>

      <p className="text-[19px] font-bold mt-3">{profile.display_name}</p>
      <p className="text-[14px] text-[#536471]">@{profile.username}</p>

      {profile.bio && (
        <p className="text-[14px] mt-3 whitespace-pre-wrap break-words">{profile.bio}</p>
      )}

      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            onUpdated(p);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
