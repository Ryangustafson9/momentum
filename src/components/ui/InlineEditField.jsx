import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const InlineEditField = ({
  label,
  value,
  fieldName,
  type = "text",
  icon: Icon,
  isRequired = false,
  placeholder = "",
  options = null,
  onChange,
  className = "",
  error = null
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Immediately update the global state to trigger unsaved changes detection
    onChange(fieldName, newValue);
  };

  const handleSelectChange = (newValue) => {
    setLocalValue(newValue);
    onChange(fieldName, newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleClick = () => {
    setIsEditing(true);
  };

  const displayValue = localValue || placeholder;
  const isEmpty = !localValue;

  return (
    <div className={cn(
      "group relative p-3 rounded-lg border transition-all duration-300 cursor-pointer",
      isEditing
        ? "border-blue-300 bg-blue-50/50 shadow-md ring-2 ring-blue-100"
        : error
        ? "border-red-300 bg-red-50/50 hover:border-red-400"
        : "border-border/40 bg-card/40 hover:bg-card/60 hover:border-border/60 hover:shadow-sm",
      className
    )} onClick={!isEditing ? handleClick : undefined}>
      
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={cn(
              "h-4 w-4 transition-colors",
              isEditing ? "text-blue-600" : error ? "text-red-500" : "text-muted-foreground"
            )} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <label className={cn(
              "text-xs font-medium transition-colors",
              isEditing ? "text-blue-700" : error ? "text-red-700" : "text-foreground"
            )}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          
          {isEditing ? (
            <div className="space-y-1">
              {options ? (
                <Select value={localValue} onValueChange={handleSelectChange}>
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : type === 'textarea' ? (
                <Textarea
                  value={localValue}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  className="min-h-[80px] text-sm resize-none"
                  autoFocus
                />
              ) : (
                <Input
                  type={type}
                  value={localValue}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  className="h-8 text-sm"
                  autoFocus
                />
              )}
              
              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className={cn(
                "text-sm transition-colors",
                isEmpty ? "text-muted-foreground italic" : "text-foreground"
              )}>
                {displayValue}
              </div>
              
              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
            </div>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-4 h-4 rounded border border-muted-foreground/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineEditField;
