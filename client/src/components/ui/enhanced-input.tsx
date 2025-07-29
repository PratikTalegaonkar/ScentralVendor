import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import VirtualKeyboard from './virtual-keyboard';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

interface EnhancedInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  type?: 'text' | 'number' | 'email';
  label?: string;
}

export default function EnhancedInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  maxLength = 100,
  type = 'text',
  label
}: EnhancedInputProps) {
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setShowKeyboard(true);
  }, [disabled]);

  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Immediately blur to prevent native keyboard
    e.target.blur();
  }, []);

  const handleKeyboardClose = useCallback(() => {
    setShowKeyboard(false);
  }, []);

  // Prevent any form submission events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="relative w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-2 block">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        <Input
          id={id}
          type={type}
          value={value}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${className} cursor-pointer pr-12`}
          inputMode="none"
          disabled={disabled}
          maxLength={maxLength}
          readOnly
          autoComplete="off"
          tabIndex={-1}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 h-8 w-8 p-0 hover:bg-luxe-gold hover:text-black"
          onClick={handleInputClick}
          disabled={disabled}
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>

      {/* Enhanced Virtual Keyboard */}
      {showKeyboard && (
        <VirtualKeyboard
          onKey={(key) => {
            // This is a fallback, but the advanced features will be used
            if (key === 'Backspace') {
              const newValue = value.slice(0, -1);
              onChange(newValue);
            } else {
              const newValue = value + key;
              if (newValue.length <= maxLength) {
                onChange(newValue);
              }
            }
          }}
          onClose={handleKeyboardClose}
          value={value}
          onChange={onChange}
          onSelectionChange={(start, end) => {
            // Handle selection changes for advanced editing
            console.log('Selection changed:', start, end);
          }}
        />
      )}
    </div>
  );
}