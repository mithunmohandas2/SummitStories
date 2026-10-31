"use client";

import { useLayoutEffect, useRef } from "react";

function fitContent(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  const style = getComputedStyle(textarea);
  const borders =
    parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  textarea.style.height = `${Math.ceil(textarea.scrollHeight + borders)}px`;
}

export default function ParagraphTextarea({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (ref.current) fitContent(ref.current);
  }, [value]);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    let width = 0;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (nextWidth !== undefined && nextWidth !== width) {
        width = nextWidth;
        fitContent(textarea);
      }
    });
    observer.observe(textarea);
    const onFontsLoaded = () => fitContent(textarea);
    document.fonts.addEventListener("loadingdone", onFontsLoaded);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", onFontsLoaded);
    };
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={5}
      maxLength={20000}
      className={`${className} resize-none overflow-hidden`}
      placeholder="Tell your story…"
    />
  );
}
