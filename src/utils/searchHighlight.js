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
 * Highlights matching characters in a text string
 * @param {string} text - The text to highlight
 * @param {string} searchTerm - The search term to highlight
 * @param {string} highlightClass - CSS classes for highlighted text
 * @returns {JSX.Element} - JSX with highlighted text
 */
export const highlightSearchTerm = (text, searchTerm, highlightClass = HIGHLIGHT_COLORS.DEFAULT) => {
  if (!text || !searchTerm) {
    return text;
  }

  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  
  if (!textLower.includes(searchLower)) {
    return text;
  }

  // Find all matching indices
  const matches = [];
  let startIndex = 0;
  
  while (startIndex < textLower.length) {
    const index = textLower.indexOf(searchLower, startIndex);
    if (index === -1) break;
    
    matches.push({
      start: index,
      end: index + searchTerm.length
    });
    
    startIndex = index + 1;
  }

  // If no matches found, return original text
  if (matches.length === 0) {
    return text;
  }

  // Build JSX with highlighted parts
  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    // Add text before match
    if (match.start > lastIndex) {
      parts.push(text.slice(lastIndex, match.start));
    }

    // Add highlighted match
    parts.push(
      <span key={`highlight-${i}`} className={highlightClass}>
        {text.slice(match.start, match.end)}
      </span>
    );

    lastIndex = match.end;
  });

  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

/**
 * Highlights multiple search terms in a text string
 * @param {string} text - The text to highlight
 * @param {string[]} searchTerms - Array of search terms to highlight
 * @param {string} highlightClass - CSS classes for highlighted text
 * @returns {JSX.Element} - JSX with highlighted text
 */
export const highlightMultipleTerms = (text, searchTerms, highlightClass = HIGHLIGHT_COLORS.DEFAULT) => {
  if (!text || !searchTerms || searchTerms.length === 0) {
    return text;
  }

  let result = text;
  
  searchTerms.forEach((term, index) => {
    if (term && term.trim()) {
      result = highlightSearchTerm(result, term.trim(), `${highlightClass} highlight-term-${index}`);
    }
  });

  return result;
};

/**
 * Highlights search terms with fuzzy matching (character by character)
 * @param {string} text - The text to highlight
 * @param {string} searchTerm - The search term to highlight
 * @param {string} highlightClass - CSS classes for highlighted text
 * @returns {JSX.Element} - JSX with highlighted text
 */
export const highlightFuzzyMatch = (text, searchTerm, highlightClass = HIGHLIGHT_COLORS.DEFAULT) => {
  if (!text || !searchTerm) {
    return text;
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

  // Build JSX with highlighted characters
  for (let i = 0; i < text.length; i++) {
    if (highlightedIndices.has(i)) {
      parts.push(
        <span key={`fuzzy-${i}`} className={highlightClass}>
          {text[i]}
        </span>
      );
    } else {
      parts.push(text[i]);
    }
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
