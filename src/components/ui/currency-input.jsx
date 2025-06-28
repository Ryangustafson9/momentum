import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CurrencyInput = ({ 
  value = 0, 
  onChange, 
  placeholder = "0.00",
  className = "",
  disabled = false,
  ...props 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef(null);

  // Format value for display when not editing
  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const numValue = typeof val === 'string' ? parseFloat(val.replace(/[$,]/g, '')) : parseFloat(val);
    if (isNaN(numValue)) return '';
    return `$${numValue.toFixed(2)}`;
  };

  // Parse currency input to number
  const parseCurrency = (val) => {
    if (!val || val === '') return 0;
    // Remove all non-numeric characters except decimal point
    const cleanValue = val.toString().replace(/[^0-9.]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Update display value when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, isEditing]);

  // Handle focus - switch to editing mode
  const handleFocus = () => {
    setIsEditing(true);
    // Show raw number for editing
    const rawValue = value === 0 ? '' : value.toString();
    setDisplayValue(rawValue);
    
    // Select all text for easy replacement
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }, 0);
  };

  // Handle blur - switch back to formatted display
  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseCurrency(displayValue);
    onChange?.(numValue);
    setDisplayValue(formatCurrency(numValue));
  };

  // Handle input change during editing
  const handleChange = (e) => {
    if (isEditing) {
      const inputValue = e.target.value;
      // Allow only numbers and one decimal point
      const validInput = inputValue.replace(/[^0-9.]/g, '');
      
      // Prevent multiple decimal points
      const decimalCount = (validInput.match(/\./g) || []).length;
      if (decimalCount <= 1) {
        setDisplayValue(validInput);
      }
    }
  };

  // Handle Enter key to finish editing
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
        $
      </span>
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-8", className)}
        {...props}
      />
    </div>
  );
};

export default CurrencyInput;
