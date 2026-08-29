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

  // Render colored tokens for #hashtags and @mentions
  const renderHighlighted = () => {
    if (!value) return null;
    const parts = value.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_\-.]+)/g);

    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith("#")) {
            return (
              <mark
                key={idx}
                className="text-sky-500 font-semibold bg-sky-50/90 rounded-xs"
              >
                {part}
              </mark>
            );
          }
          if (part.startsWith("@")) {
            return (
              <mark
                key={idx}
                className="text-indigo-600 font-semibold bg-indigo-50/90 rounded-xs"
              >
                {part}
              </mark>
            );
          }
          return (
            <span key={idx} className="text-slate-800">
              {part}
            </span>
          );
        })}
        {value.endsWith("\n") ? "\n" : null}
      </>
    );
  };

  return (
    <div className={`relative w-full font-sans text-sm ${className}`}>
      {/* 
        Exact overlay backdrop: identical typography, font-size, line-height, padding, 
        border, margins, box-sizing, and word-break to mirror the textarea 1:1 with zero ghosting.
      */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none whitespace-pre-wrap wrap-break-word overflow-hidden select-none p-0 m-0 border-0 leading-relaxed font-sans text-sm tracking-normal"
        style={{
          font: "inherit",
          letterSpacing: "inherit",
          lineHeight: "1.625",
          padding: "0px",
          margin: "0px",
          border: "0px solid transparent",
          boxSizing: "border-box",
        }}
      >
        {renderHighlighted()}
      </div>

      {/* 
        Textarea with identical styling.
        When value exists, text color is transparent so the crisp highlighted backdrop shows through,
        while maintaining the caret and full typing selection.
      */}
      <textarea
        ref={refToUse}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`relative z-10 w-full bg-transparent border-none p-0 m-0 focus:ring-0 resize-none outline-none leading-relaxed font-sans text-sm tracking-normal caret-slate-900 ${
          value ? "text-transparent" : "text-slate-800"
        }`}
        style={{
          font: "inherit",
          letterSpacing: "inherit",
          lineHeight: "1.625",
          padding: "0px",
          margin: "0px",
          border: "0px solid transparent",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};
