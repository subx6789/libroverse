import React, { useRef, useLayoutEffect } from "react";

interface HighlightedTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
  textareaRef,
  onKeyDown,
}) => {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const refToUse = textareaRef || localRef;
  const backdropRef = useRef<HTMLDivElement>(null);

  const syncScroll = () => {
    if (refToUse.current && backdropRef.current) {
      backdropRef.current.scrollTop = refToUse.current.scrollTop;
      backdropRef.current.scrollLeft = refToUse.current.scrollLeft;
    }
  };

  useLayoutEffect(() => {
    syncScroll();
  }, [value]);

  // Exact Twitter/X style syntax highlighting: colored text without padding/margin wrappers to avoid width shifts
  const renderHighlighted = () => {
    if (!value) return null;
    const parts = value.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_\-.]+)/g);

    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith("#")) {
            return (
              <span key={idx} className="text-sky-500 font-normal">
                {part}
              </span>
            );
          }
          if (part.startsWith("@")) {
            return (
              <span key={idx} className="text-indigo-600 font-normal">
                {part}
              </span>
            );
          }
          return (
            <span key={idx} className="text-slate-900">
              {part}
            </span>
          );
        })}
        {value.endsWith("\n") ? "\n " : null}
      </>
    );
  };

  const sharedStyle: React.CSSProperties = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: "14px",
    lineHeight: "22px",
    letterSpacing: "0px",
    wordSpacing: "0px",
    padding: "0px",
    margin: "0px",
    border: "0px solid transparent",
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  };

  return (
    <div
      className={`relative w-full ${className}`}
      style={{ minHeight: `${rows * 22}px` }}
    >
      {/* 
        Zero-shift backdrop overlay matching Twitter/X: identical system font, line-height, letter-spacing,
        and strictly no padding/backgrounds around tokens so the glyph positions match the textarea to the exact pixel.
      */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
        style={sharedStyle}
      >
        {renderHighlighted()}
      </div>

      {/* 
        Native Textarea: Text is made transparent so the styled backdrop shows underneath,
        while the caret stays rendered and 100% aligned with user typing.
      */}
      <textarea
        ref={refToUse}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`relative z-10 w-full bg-transparent resize-none outline-none focus:ring-0 caret-indigo-600 ${
          value ? "text-transparent" : "text-slate-800"
        }`}
        style={sharedStyle}
        spellCheck={false}
      />
    </div>
  );
};
