/**
 * HighlightedText Component
 * Renders text with highlighted search terms
 */

import React from 'react';
import { getHighlightParts, getMultipleHighlightParts, getFuzzyHighlightParts, HIGHLIGHT_COLORS } from '@/utils/searchHighlight';

const HighlightedText = ({ 
  text, 
  searchTerm, 
  searchTerms, 
  highlightClass = HIGHLIGHT_COLORS.DEFAULT,
  fuzzy = false,
  className = ""
}) => {
  if (!text) {
    return null;
  }

  let parts = [];

  if (fuzzy && searchTerm) {
    parts = getFuzzyHighlightParts(text, searchTerm);
  } else if (searchTerms && searchTerms.length > 0) {
    parts = getMultipleHighlightParts(text, searchTerms);
  } else if (searchTerm) {
    parts = getHighlightParts(text, searchTerm);
  } else {
    parts = [{ text, isHighlight: false }];
  }

  return (
    <span className={className}>
      {parts.map((part, index) => (
        part.isHighlight ? (
          <span key={index} className={highlightClass}>
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      ))}
    </span>
  );
};

export default HighlightedText;

