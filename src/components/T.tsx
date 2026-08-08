import React from 'react';
import { useTranslation, type TranslationKey } from '../context/LanguageContext';
import { BlurTextAnim } from './BlurTextAnim';

export interface TProps {
  /** Translation dictionary key */
  k?: TranslationKey | string;
  /** Variable replacements for the translation string */
  replacements?: Record<string, string | number>;
  /** Direct string to translate/animate */
  text?: string;
  /** Children fallback string */
  children?: string;
  /** Extra CSS classes */
  className?: string;
  /** Custom animation duration in ms */
  duration?: number;
  /** React element wrapper (default 'span') */
  as?: React.ElementType;
}

export const T: React.FC<TProps> = ({
  k,
  replacements,
  text,
  children,
  className = '',
  duration = 480,
  as = 'span',
}) => {
  const { t } = useTranslation();

  let targetText = '';
  if (k) {
    targetText = t(k, replacements);
  } else if (text !== undefined) {
    targetText = text;
  } else if (children !== undefined) {
    targetText = children;
  }

  return <BlurTextAnim text={targetText} className={className} duration={duration} as={as} />;
};

export default T;
