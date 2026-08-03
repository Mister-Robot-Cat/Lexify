'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

export default function ShareButton({
  title = 'Lexify - AI Language Learning',
  text = 'Check out Lexify! Learn vocabulary and prepare for IELTS with AI directly in Telegram.',
  url = 'https://t.me/LexifyBot',
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to copy/telegram
      }
    }

    // Fallback: Telegram share URL
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(tgShareUrl, '_blank');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 rounded-xl bg-blue-600/20 border border-blue-500/30 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-600/30 active:scale-95 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 ${className}`}
    >
      {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
      {copied ? 'Link Shared!' : 'Share Lexify'}
    </button>
  );
}
