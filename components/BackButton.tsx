'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F7F8F8] transition-colors -ml-2"
      aria-label="戻る"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M19 12H5M5 12l6-6M5 12l6 6"
          stroke="#0F1419"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
