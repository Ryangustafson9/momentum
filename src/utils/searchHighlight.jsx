/**
 * Utility functions for highlighting search terms in text
 */

// Standardized highlight color classes for consistent UX
export const HIGHLIGHT_COLORS = {
  // Primary highlight for member/profile searches - blue theme
  MEMBER_SEARCH: 'bg-blue-200 dark:bg-blue-800 font-bold text-blue-900 dark:text-blue-100 px-1 rounded',

  // Default highlight for general searches - yellow theme
  DEFAULT: 'bg-yellow-200 dark:bg-yellow-800 font-semibold text-yellow-900 dark:text-yellow-100 px-0.5 rounded',

  // Alternative highlight colors for different contexts
  SUCCESS: 'bg-green-200 dark:bg-green-800 font-semibold text-green-900 dark:text-green-100 px-0.5 rounded',
  WARNING: 'bg-orange-200 dark:bg-orange-800 font-semibold text-orange-900 dark:text-orange-100 px-0.5 rounded',
  ERROR: 'bg-red-200 dark:bg-red-800 font-semibold text-red-900 dark:text-red-100 px-0.5 rounded'
};

/**
 * Finds matching indices in a text string for highlighting
 * @param {string} text - The text to search
 * @param {string} searchTerm - The search term to find
 * @returns {Array} - Array of {start, end, text} objects for highlighting
 */
export const findSearchMatches = (text, searchTerm) => {
  if (!text || !searchTerm) {
    return [];
  }

  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();

  if (!textLower.includes(searchLower)) {
    return [];
  }

  // Find all matching indices
  const matches = [];
  let startIndex = 0;

  while (startIndex < textLower.length) {
    const index = textLower.indexOf(searchLower, startIndex);
    if (index === -1) break;

    matches.push({
      start: index,
      end: index + searchTerm.length,
      text: text.slice(index, index + searchTerm.length)
    });

    startIndex = index + 1;
  }

  return matches;
};

/**
 * Splits text into parts for highlighting
 * @param {string} text - The text to split
 * @param {string} searchTerm - The search term to highlight
 * @returns {Array} - Array of {text, isHighlight} objects
 */
export const getHighlightParts = (text, searchTerm) => {
  if (!text || !searchTerm) {
    return [{ text, isHighlight: false }];
  }

  const matches = findSearchMatches(text, searchTerm);

  if (matches.length === 0) {
    return [{ text, isHighlight: false }];
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match) => {
    // Add text before match
    if (match.start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.start),
        isHighlight: false
      });
    }

    // Add highlighted match
    parts.push({
      text: text.slice(match.start, match.end),
      isHighlight: true
    });

    lastIndex = match.end;
  });

  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isHighlight: false
    });
  }

  return parts;
};

/**
 * Gets highlight parts for multiple search terms
 * @param {string} text - The text to search
 * @param {string[]} searchTerms - Array of search terms to find
 * @returns {Array} - Array of {text, isHighlight} objects
 */
export const getMultipleHighlightParts = (text, searchTerms) => {
  if (!text || !searchTerms || searchTerms.length === 0) {
    return [{ text, isHighlight: false }];
  }

  let result = [{ text, isHighlight: false }];

  searchTerms.forEach((term) => {
    if (term && term.trim()) {
      const newResult = [];
      result.forEach(part => {
        if (part.isHighlight) {
          newResult.push(part);
        } else {
          const parts = getHighlightParts(part.text, term.trim());
          newResult.push(...parts);
        }
      });
      result = newResult;
    }
  });

  return result;
};

/**
 * Gets fuzzy match highlight parts (character by character)
 * @param {string} text - The text to search
 * @param {string} searchTerm - The search term to find
 * @returns {Array} - Array of {text, isHighlight} objects
 */
export const getFuzzyHighlightParts = (text, searchTerm) => {
  if (!text || !searchTerm) {
    return [{ text, isHighlight: false }];
  }

  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();

  const parts = [];
  const highlightedIndices = new Set();

  let searchIndex = 0;

  // Find fuzzy matches (characters in order but not necessarily consecutive)
  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      highlightedIndices.add(i);
      searchIndex++;
    }
  }

  // Build parts with highlighted characters
  for (let i = 0; i < text.length; i++) {
    parts.push({
      text: text[i],
      isHighlight: highlightedIndices.has(i)
    });
  }

  return parts;
};

/**
 * Utility to check if text matches search term (case-insensitive)
 * @param {string} text - Text to check
 * @param {string} searchTerm - Search term
 * @returns {boolean} - True if text contains search term
 */
export const matchesSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return false;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
};

/**
 * Utility to get search relevance score for sorting
 * @param {string} text - Text to score
 * @param {string} searchTerm - Search term
 * @returns {number} - Relevance score (higher is more relevant)
 */
export const getSearchRelevanceScore = (text, searchTerm) => {
  if (!text || !searchTerm) return 0;
  
  const textLower = text.toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === searchLower) return 100;
  
  // Starts with search term gets high score
  if (textLower.startsWith(searchLower)) return 90;
  
  // Contains search term as whole word gets medium-high score
  const words = textLower.split(/\s+/);
  if (words.some(word => word === searchLower)) return 80;
  
  // Contains search term anywhere gets medium score
  if (textLower.includes(searchLower)) return 70;
  
  // Fuzzy match gets lower score based on character match ratio
  let matchedChars = 0;
  let searchIndex = 0;
  
  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      matchedChars++;
      searchIndex++;
    }
  }
  
  const fuzzyScore = (matchedChars / searchLower.length) * 50;
  return fuzzyScore;
};

