import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import SimpleKeyboard from './simple-keyboard';

interface VirtualInputLoginProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

export default function VirtualInputLogin({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  maxLength = 50
}: VirtualInputLoginProps) {
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

  const handleKeyboardChange = useCallback((newValue: string) => {
    onChange(newValue);
  }, [onChange]);

  // Prevent any form submission events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        value={value}
        onClick={handleInputClick}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} cursor-pointer`}
        inputMode="none"
        disabled={disabled}
        maxLength={maxLength}
        readOnly
        autoComplete="off"
        tabIndex={-1}
      />

      {/* Simple Keyboard */}
      {showKeyboard && (
        <SimpleKeyboard
          onConfirm={(text) => {
            onChange(text);
            setShowKeyboard(false);
          }}
          onClose={handleKeyboardClose}
          initialValue={value}
          placeholder={placeholder}
          title="Enter Text"
          maxLength={maxLength}
        />
      )}
    </div>
  );
}