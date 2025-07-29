import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Delete, ArrowUp } from 'lucide-react';

interface SimpleKeyboardProps {
  onConfirm: (text: string) => void;
  onClose: () => void;
  initialValue?: string;
  placeholder?: string;
  title?: string;
  maxLength?: number;
}

export default function SimpleKeyboard({ 
  onConfirm, 
  onClose, 
  initialValue = '', 
  placeholder = 'Enter text...',
  title = 'Enter Text',
  maxLength = 100
}: SimpleKeyboardProps) {
  const [text, setText] = useState(initialValue);
  const [isUppercase, setIsUppercase] = useState(false);
  
  const qwertyRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const handleKeyPress = (key: string) => {
    if (text.length >= maxLength) return;
    
    const char = isUppercase ? key.toUpperCase() : key;
    setText(prev => prev + char);
  };

  const handleBackspace = () => {
    setText(prev => prev.slice(0, -1));
  };

  const handleSpace = () => {
    if (text.length >= maxLength) return;
    setText(prev => prev + ' ');
  };

  const handleClear = () => {
    setText('');
  };

  const toggleCase = () => {
    setIsUppercase(!isUppercase);
  };

  const handleDone = () => {
    onConfirm(text);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-gradient-to-b from-gray-100 to-white rounded-3xl p-6 w-full max-w-4xl mx-4 shadow-2xl border-4 border-luxe-gold">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={onClose}
            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-none"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Text Preview */}
        <div className="mb-6 p-4 bg-white border-2 border-gray-300 rounded-xl shadow-inner">
          <div className="min-h-[60px] text-xl text-gray-800 font-medium break-words leading-relaxed">
            {text || (
              <span className="text-gray-400 italic">{placeholder}</span>
            )}
            <span className="animate-pulse bg-blue-500 w-0.5 h-6 inline-block ml-1"></span>
          </div>
          <div className="text-sm text-gray-500 mt-3 flex justify-between items-center border-t border-gray-200 pt-2">
            <span>{text.length}/{maxLength} characters</span>
            <span className={`px-2 py-1 rounded text-xs ${
              isUppercase 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isUppercase ? 'CAPS' : 'lowercase'}
            </span>
          </div>
        </div>
        
        {/* QWERTY Keyboard */}
        <div className="space-y-3 mb-6">
          {qwertyRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2">
              {rowIndex === 2 && (
                <Button
                  variant="outline"
                  className={`h-16 px-6 text-lg font-bold border-none rounded-xl shadow-lg active:scale-95 transition-transform ${
                    isUppercase 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  onClick={toggleCase}
                >
                  <ArrowUp className={`h-5 w-5 mr-1 ${isUppercase ? 'text-black' : 'text-white'}`} />
                  SHIFT
                </Button>
              )}
              {row.map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-16 px-4 text-xl font-bold bg-white hover:bg-blue-500 hover:text-white border-3 border-gray-400 rounded-xl shadow-lg min-w-[60px] active:scale-95 transition-transform"
                  onClick={() => handleKeyPress(key)}
                  disabled={text.length >= maxLength}
                >
                  {isUppercase ? key.toUpperCase() : key}
                </Button>
              ))}
              {rowIndex === 2 && (
                <Button
                  variant="outline"
                  className="h-16 px-6 text-lg font-bold bg-red-500 hover:bg-red-600 text-white border-none rounded-xl shadow-lg active:scale-95 transition-transform"
                  onClick={handleBackspace}
                >
                  <Delete className="h-5 w-5 mr-1" />
                  DEL
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {/* Bottom Controls */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            className="h-16 px-8 text-lg font-bold bg-gray-400 hover:bg-gray-500 text-white border-none rounded-xl shadow-lg active:scale-95 transition-transform"
            onClick={handleClear}
          >
            CLEAR
          </Button>
          <Button
            variant="outline"
            className="h-16 px-16 text-xl font-bold bg-white hover:bg-blue-500 hover:text-white border-3 border-gray-400 rounded-xl shadow-lg active:scale-95 transition-transform"
            onClick={handleSpace}
            disabled={text.length >= maxLength}
          >
            SPACE
          </Button>
          <Button
            className="h-16 px-12 text-xl font-bold bg-green-600 hover:bg-green-700 text-white border-none rounded-xl shadow-lg active:scale-95 transition-transform"
            onClick={handleDone}
          >
            ✓ DONE
          </Button>
        </div>
        
        {/* Special Characters Row */}
        <div className="flex justify-center gap-2 mt-4">
          {['.', ',', '?', '!', '@', '-', '_'].map((char) => (
            <Button
              key={char}
              variant="outline"
              className="h-12 px-4 text-lg font-bold bg-white hover:bg-blue-500 hover:text-white border-2 border-gray-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={() => handleKeyPress(char)}
              disabled={text.length >= maxLength}
            >
              {char}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}