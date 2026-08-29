import React from 'react';

interface RichTweetTextProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

export const RichTweetText: React.FC<RichTweetTextProps> = ({
  content,
  onHashtagClick,
  className = '',
}) => {
  if (!content) return null;

  // Regex matches hashtags (#word), mentions (@word), and URLs (http:// or https://)
  const regex = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+|https?:\/\/[^\s]+)/g;

  const parts = content.split(regex);

  return (
    <span className={`whitespace-pre-line leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          return (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onHashtagClick) {
                  onHashtagClick(part);
                }
              }}
              className="inline-block text-sky-500 font-semibold hover:text-sky-600 hover:underline cursor-pointer bg-sky-50/70 hover:bg-sky-100/70 px-1 py-0.2 rounded mx-0.5 transition-colors"
            >
              {part}
            </button>
          );
        }

        if (part.startsWith('@')) {
          return (
            <span
              key={index}
              className="text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              {part}
            </span>
          );
        }

        if (part.startsWith('http://') || part.startsWith('https://')) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-500 hover:underline inline-flex items-center gap-0.5 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
