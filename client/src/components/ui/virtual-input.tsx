import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import VirtualNumpad from './virtual-numpad';
import VirtualKeyboard from './virtual-keyboard';

interface VirtualInputProps {
  type?: 'text' | 'number' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  maxLength?: number;
  allowDecimal?: boolean;
  inputMode?: 'text' | 'numeric' | 'url' | 'email';
  disabled?: boolean;
  rows?: number;
}

export default function VirtualInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  id,
  maxLength,
  allowDecimal = false,
  inputMode,
  disabled = false,
  rows = 3
}: VirtualInputProps) {
  const [showNumpad, setShowNumpad] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleInputClick = () => {
    if (disabled) return;
    
    if (type === 'number' || inputMode === 'numeric') {
      setShowNumpad(true);
    } else {
      setShowKeyboard(true);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Prevent default keyboard from showing on mobile
    (e.target as HTMLInputElement | HTMLTextAreaElement).blur();
    handleInputClick();
  };

  return (
    <div className="relative">
      {type === 'textarea' ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`${className} cursor-pointer`}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          readOnly
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`${className} cursor-pointer`}
          inputMode="none"
          disabled={disabled}
          maxLength={maxLength}
          readOnly
        />
      )}

      {/* Virtual Numpad */}
      {showNumpad && (
        <VirtualNumpad
          value={value}
          onChange={onChange}
          onClose={() => setShowNumpad(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          allowDecimal={allowDecimal}
          title={placeholder || 'Enter Number'}
        />
      )}

      {/* Virtual Keyboard */}
      {showKeyboard && (
        <VirtualKeyboard
          value={value}
          onChange={onChange}
          onClose={() => setShowKeyboard(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          title={placeholder || 'Enter Text'}
          multiline={type === 'textarea'}
        />
      )}
    </div>
  );
}