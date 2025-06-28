import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SearchableSelect = ({ 
  options = [], 
  value = '', 
  onValueChange, 
  placeholder = 'Select option...',
  className = '',
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected option display text
  const selectedOption = options.find(option => option === value);

  // Handle input change
  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightedIndex(-1);
    
    // Auto-open dropdown when typing
    if (!isOpen && term.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    onValueChange?.(option);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative" ref={inputRef}>
      {/* Input/Trigger */}
      <div
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          type="text"
          value={isOpen ? searchTerm : (selectedOption || '')}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedOption || placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none"
          autoComplete="off"
        />
        <ChevronDown 
          className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )} 
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
          <div ref={listRef} className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    index === highlightedIndex && "bg-accent text-accent-foreground",
                    option === value && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleOptionSelect(option)}
                >
                  <span className="flex-1">{option}</span>
                  {option === value && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-2 px-3 text-sm text-muted-foreground">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
