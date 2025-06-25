import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ⚠️  PRODUCTION WARNING ⚠️ 
 * 
 * This component currently uses MOCK DATA for address suggestions.
 * Before deploying to production, you MUST:
 * 
 * 1. Replace mockAddressSuggestions() with a real API service:
 *    - Google Places API (recommended)
 *    - Mapbox Geocoding API
 *    - HERE Geocoding API
 *    - Or similar address service
 * 
 * 2. Add proper API key management
 * 3. Handle API rate limits and errors
 * 4. Remove mock data generation logic
 * 
 * Current implementation is for DEVELOPMENT/DEMO purposes only!
 */

const AddressAutocomplete = ({ 
  value = '', 
  onChange, 
  onAddressSelect,
  placeholder = "Enter street address",
  className = "",
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  // Development warning - shows in console during development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '🚨 AddressAutocomplete Component Warning 🚨\n' +
        '============================================\n' +
        'This component is currently using MOCK DATA for address suggestions!\n\n' +
        'Before deploying to production, you MUST:\n' +
        '• Replace mockAddressSuggestions() with a real geocoding API\n' +
        '• Recommended APIs: Google Places, Mapbox, HERE, or similar\n' +
        '• Add proper API key management and error handling\n' +
        '• Remove all mock data generation logic\n\n' +
        'Current implementation is for DEVELOPMENT/DEMO purposes only!'
      );
    }
  }, []);

  // Simple address autocomplete using a mock service
  // In production, you would integrate with Google Places API, Mapbox, or similar
  const mockAddressSuggestions = async (query) => {
    if (!query || query.length < 3) return [];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Helper function to capitalize directions
    const capitalizeDirections = (address) => {
      return address
        .replace(/\bnw\b/gi, 'NW')
        .replace(/\bne\b/gi, 'NE')
        .replace(/\bsw\b/gi, 'SW')
        .replace(/\bse\b/gi, 'SE')
        .replace(/\bn\b/gi, 'N')
        .replace(/\bs\b/gi, 'S')
        .replace(/\be\b/gi, 'E')
        .replace(/\bw\b/gi, 'W');
    };

    // Extract street number from query if present
    const streetNumberMatch = query.match(/^\d+/);
    const streetNumber = streetNumberMatch ? streetNumberMatch[0] : query;
    
    // Create realistic street suggestions based on common street patterns
    const streetSuffixes = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Way', 'Ct'];
    const directions = ['NW', 'NE', 'SW', 'SE', 'N', 'S', 'E', 'W'];
    
    let mockSuggestions = [];
    
    // If the query contains numbers, create realistic street addresses
    if (streetNumberMatch) {
      const number = streetNumberMatch[0];
      const restOfQuery = query.slice(number.length).trim();
      
      // Generate suggestions based on the pattern
      if (restOfQuery.toLowerCase().includes('nw') || restOfQuery.toLowerCase().includes('188')) {
        mockSuggestions = [
          {
            id: '1',
            description: `${number} NW 188th St, Oklahoma City, OK 73012`,
            address: `${number} NW 188th St`,
            city: 'Oklahoma City',
            state: 'OK',
            zip: '73012'
          },
          {
            id: '2',
            description: `${number} NW 188th Ave, Edmond, OK 73013`,
            address: `${number} NW 188th Ave`,
            city: 'Edmond',
            state: 'OK',
            zip: '73013'
          },
          {
            id: '3',
            description: `${number} NW 188th Ter, Oklahoma City, OK 73012`,
            address: `${number} NW 188th Ter`,
            city: 'Oklahoma City',
            state: 'OK',
            zip: '73012'
          }
        ];
      } else {
        // General suggestions for other patterns
        mockSuggestions = [
          {
            id: '1',
            description: `${capitalizeDirections(query)} St, Oklahoma City, OK 73102`,
            address: `${capitalizeDirections(query)} St`,
            city: 'Oklahoma City',
            state: 'OK',
            zip: '73102'
          },
          {
            id: '2',
            description: `${capitalizeDirections(query)} Ave, Norman, OK 73069`,
            address: `${capitalizeDirections(query)} Ave`,
            city: 'Norman',
            state: 'OK',
            zip: '73069'
          },
          {
            id: '3',
            description: `${capitalizeDirections(query)} Blvd, Tulsa, OK 74104`,
            address: `${capitalizeDirections(query)} Blvd`,
            city: 'Tulsa',
            state: 'OK',
            zip: '74104'
          }
        ];
      }
    } else {
      // Fallback suggestions for text-only queries
      mockSuggestions = [
        {
          id: '1',
          description: `${capitalizeDirections(query)} Main St, Oklahoma City, OK 73102`,
          address: `${capitalizeDirections(query)} Main St`,
          city: 'Oklahoma City',
          state: 'OK',
          zip: '73102'
        },
        {
          id: '2',
          description: `${capitalizeDirections(query)} Broadway, Norman, OK 73069`,
          address: `${capitalizeDirections(query)} Broadway`,
          city: 'Norman',
          state: 'OK',
          zip: '73069'
        },
        {
          id: '3',
          description: `${capitalizeDirections(query)} University Blvd, Tulsa, OK 74104`,
          address: `${capitalizeDirections(query)} University Blvd`,
          city: 'Tulsa',
          state: 'OK',
          zip: '74104'
        }
      ];
    }
    
    return mockSuggestions.filter(suggestion => 
      suggestion.description.toLowerCase().includes(query.toLowerCase())
    );
  };
  const handleInputChange = async (e) => {
    let newValue = e.target.value;
    
    // Auto-capitalize directions as user types
    const capitalizeDirections = (text) => {
      return text
        .replace(/\bnw\b/gi, 'NW')
        .replace(/\bne\b/gi, 'NE')
        .replace(/\bsw\b/gi, 'SW')
        .replace(/\bse\b/gi, 'SE')
        .replace(/\bn\b/gi, 'N')
        .replace(/\bs\b/gi, 'S')
        .replace(/\be\b/gi, 'E')
        .replace(/\bw\b/gi, 'W');
    };
    
    // Apply capitalization to directions
    const capitalizedValue = capitalizeDirections(newValue);
    
    // Only update if the value actually changed to avoid cursor jumping
    if (capitalizedValue !== newValue) {
      newValue = capitalizedValue;
      // Update the input value
      e.target.value = newValue;
    }
    
    onChange(newValue);
    
    if (newValue.length >= 3) {
      setIsLoading(true);
      try {
        const results = await mockAddressSuggestions(newValue);
        setSuggestions(results);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Address autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Call the callback with parsed address components
    if (onAddressSelect) {
      onAddressSelect({
        address: suggestion.address,
        city: suggestion.city,
        state: suggestion.state,
        zip_code: suggestion.zip
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative">
      {/* Development Mode Warning Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-amber-100 border border-amber-300 text-amber-700 text-xs px-2 py-1 rounded-full shadow-sm">
            DEMO
          </div>
        </div>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "text-sm h-10 border-border/60 bg-background/80 focus:border-primary focus:ring-primary/20 transition-all duration-200 shadow-sm pr-10",
            className
          )}
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto border shadow-lg"
        >
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <Button
                key={suggestion.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left p-3 h-auto rounded-none border-b border-border/50 last:border-b-0",
                  selectedIndex === index && "bg-primary/10"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start gap-2 w-full">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{suggestion.address}</div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.city}, {suggestion.state} {suggestion.zip}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressAutocomplete;
