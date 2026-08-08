import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../context/LanguageContext';

interface BlurTextAnimProps {
  text: string;
  className?: string;
  /** Custom duration in ms (default 450ms) */
  duration?: number;
  /** Component wrapper element type */
  as?: React.ElementType;
}

export const BlurTextAnim: React.FC<BlurTextAnimProps> = ({
  text,
  className = '',
  duration = 450,
  as: Component = 'span',
}) => {
  const { locale } = useTranslation();
  const [prevText, setPrevText] = useState(text);
  const [currText, setCurrText] = useState(text);
  const [prevLocale, setPrevLocale] = useState(locale);
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef<HTMLElement>(null);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const charNodesRef = useRef<HTMLSpanElement[]>([]);

  // Trigger animation state when locale or text changes
  useEffect(() => {
    if (locale !== prevLocale || (text !== currText && text !== prevText)) {
      setPrevText(currText);
      setCurrText(text);
      setPrevLocale(locale);
      setIsAnimating(true);
    }
  }, [text, locale, prevLocale, currText]);

  // RAF Direct DOM Animation Loop — zero React re-renders during execution
  useEffect(() => {
    if (!isAnimating) return;

    const timer = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const nodes = Array.from(
        containerRef.current.querySelectorAll<HTMLSpanElement>('[data-char-idx]')
      );
      charNodesRef.current = nodes;

      const blurSpread = 2.2;
      const gapSpread = 1.8;
      const oldLen = prevText.length;
      const newLen = currText.length;
      const maxLen = Math.max(oldLen, newLen, 1);
      const totalSteps = maxLen + (blurSpread + gapSpread) * 2;

      // Adapt duration so longer multi-line text doesn't take too long
      const animDuration = Math.min(duration, 550);

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / animDuration, 1);

        // Smooth cubic-bezier easeInOut Easing
        const easedProgress =
          progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const waveIndex = -(blurSpread + gapSpread) + easedProgress * totalSteps;

        // Direct DOM update loop — zero React re-renders per frame!
        const nodesList = charNodesRef.current;
        for (let i = 0; i < nodesList.length; i++) {
          const node = nodesList[i];
          const idx = parseInt(node.dataset.charIdx || '0', 10);
          const oldChar = node.dataset.oldChar ?? '';
          const newChar = node.dataset.newChar ?? '';

          let oldState: 'sharp' | 'blur' | 'gap' = 'gap';
          if (oldChar !== '') {
            if (idx > waveIndex + gapSpread + blurSpread) {
              oldState = 'sharp';
            } else if (idx > waveIndex + gapSpread) {
              oldState = 'blur';
            } else {
              oldState = 'gap';
            }
          }

          let newState: 'sharp' | 'blur' | 'gap' = 'gap';
          if (newChar !== '') {
            if (idx < waveIndex - gapSpread - blurSpread) {
              newState = 'sharp';
            } else if (idx < waveIndex - gapSpread) {
              newState = 'blur';
            } else {
              newState = 'gap';
            }
          }

          let charToDisplay = '';
          let charState: 'sharp' | 'blur' | 'gap' = 'gap';
          let isNewChar = false;

          if (newState === 'sharp') {
            charToDisplay = newChar;
            charState = 'sharp';
            isNewChar = true;
          } else if (newState === 'blur') {
            charToDisplay = newChar;
            charState = 'blur';
            isNewChar = true;
          } else if (oldState === 'blur') {
            charToDisplay = oldChar;
            charState = 'blur';
            isNewChar = false;
          } else if (oldState === 'sharp') {
            charToDisplay = oldChar;
            charState = 'sharp';
            isNewChar = false;
          } else {
            charToDisplay = newChar || oldChar || ' ';
            charState = 'gap';
          }

          let styleClass = 'yaqeen-blur-char-base yaqeen-blur-char-sharp';
          if (charState === 'blur') {
            styleClass = `yaqeen-blur-char-base ${
              isNewChar ? 'yaqeen-blur-char-blur-new' : 'yaqeen-blur-char-blur-old'
            }`;
          } else if (charState === 'gap') {
            styleClass = 'yaqeen-blur-char-base yaqeen-blur-char-gap';
          }

          if (node.className !== styleClass) {
            node.className = styleClass;
          }
          if (node.textContent !== charToDisplay) {
            node.textContent = charToDisplay;
          }
        }

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setPrevText(text);
          startTimeRef.current = null;
        }
      };

      startTimeRef.current = null;
      animRef.current = requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(timer);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isAnimating, currText, prevText, text, duration]);

  // Clean static text output when not animating
  const hasWhitespaceClass = className.includes('whitespace-') || className.includes('truncate');
  const defaultClasses = hasWhitespaceClass ? '' : 'whitespace-pre-wrap break-words';

  if (!isAnimating) {
    return <Component className={`${defaultClasses} ${className}`}>{currText}</Component>;
  }

  // Tokenize target text for proper word-wrapping and multi-line support
  const maxLen = Math.max(prevText.length, currText.length);

  // Build structure: group characters into words, preserve spaces and newlines
  const elements: React.ReactNode[] = [];
  let currentWordChars: React.ReactNode[] = [];

  const flushWord = (key: string) => {
    if (currentWordChars.length > 0) {
      elements.push(
        <span key={key} className="inline-block whitespace-nowrap">
          {currentWordChars}
        </span>
      );
      currentWordChars = [];
    }
  };

  for (let idx = 0; idx < maxLen; idx++) {
    const oldChar = prevText[idx] !== undefined ? prevText[idx] : '';
    const newChar = currText[idx] !== undefined ? currText[idx] : '';
    const charToDisplay = oldChar || newChar || ' ';

    if (charToDisplay === '\n') {
      flushWord(`w-break-${idx}`);
      elements.push(<br key={`br-${idx}`} />);
      continue;
    }

    if (charToDisplay === ' ') {
      flushWord(`w-space-${idx}`);
      elements.push(
        <span
          key={`char-space-${idx}`}
          data-char-idx={idx}
          data-old-char={oldChar}
          data-new-char={newChar}
          className="yaqeen-blur-char-base yaqeen-blur-char-sharp"
        >
          {' '}
        </span>
      );
      continue;
    }

    currentWordChars.push(
      <span
        key={`char-${idx}`}
        data-char-idx={idx}
        data-old-char={oldChar}
        data-new-char={newChar}
        className="yaqeen-blur-char-base yaqeen-blur-char-sharp"
      >
        {oldChar || newChar}
      </span>
    );
  }
  flushWord(`w-end-${maxLen}`);

  return (
    <Component ref={containerRef} className={`${defaultClasses} tracking-normal ${className}`}>
      {elements}
    </Component>
  );
};
