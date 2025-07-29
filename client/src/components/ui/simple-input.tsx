import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import SimpleKeyboard from './simple-keyboard';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

interface SimpleInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  label?: string;
  keyboardTitle?: string;
}

export default function SimpleInput({
  id,
  value,
  onChange,
  placeholder = 'Tap to type...',
  className,
  disabled = false,
  maxLength = 100,
  label,
  keyboardTitle = 'Enter Text'
}: SimpleInputProps) {
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

  const handleKeyboardConfirm = useCallback((text: string) => {
    onChange(text);
    setShowKeyboard(false);
  }, [onChange]);

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
          type="text"
          value={value}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${className} cursor-pointer pr-12 text-lg h-12`}
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

      {/* Simple Keyboard */}
      {showKeyboard && (
        <SimpleKeyboard
          onConfirm={handleKeyboardConfirm}
          onClose={handleKeyboardClose}
          initialValue={value}
          placeholder={placeholder}
          title={keyboardTitle}
          maxLength={maxLength}
        />
      )}
    </div>
  );
}