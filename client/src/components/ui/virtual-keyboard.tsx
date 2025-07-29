import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Delete, ArrowUp, ArrowLeft, ArrowRight, SkipBack, SkipForward, Copy, Clipboard } from 'lucide-react';

interface VirtualKeyboardProps {
  onKey: (key: string) => void;
  onClose: () => void;
  value?: string;
  onChange?: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
}

export default function VirtualKeyboard({ onKey, onClose, value = '', onChange, onSelectionChange }: VirtualKeyboardProps) {
  const [isUppercase, setIsUppercase] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [selectionStart, setSelectionStart] = useState(value.length);
  const [selectionEnd, setSelectionEnd] = useState(value.length);
  const [clipboard, setClipboard] = useState('');
  
  const qwertyRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const handleKeyPress = (key: string) => {
    const char = isUppercase ? key.toUpperCase() : key;
    
    if (onChange && value !== undefined) {
      // Advanced editing mode with cursor support
      const newValue = value.slice(0, cursorPosition) + char + value.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(cursorPosition + 1);
      setSelectionStart(cursorPosition + 1);
      setSelectionEnd(cursorPosition + 1);
    } else {
      // Fallback to simple onKey
      onKey(char);
    }
  };

  const handleBackspace = () => {
    if (onChange && value !== undefined) {
      if (selectionStart !== selectionEnd) {
        // Delete selection
        const newValue = value.slice(0, selectionStart) + value.slice(selectionEnd);
        onChange(newValue);
        setCursorPosition(selectionStart);
        setSelectionStart(selectionStart);
        setSelectionEnd(selectionStart);
      } else if (cursorPosition > 0) {
        // Delete single character
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        onChange(newValue);
        setCursorPosition(cursorPosition - 1);
        setSelectionStart(cursorPosition - 1);
        setSelectionEnd(cursorPosition - 1);
      }
    } else {
      onKey('Backspace');
    }
  };

  const handleCursorMove = (direction: 'left' | 'right' | 'home' | 'end') => {
    if (!onChange || value === undefined) return;
    
    let newPosition = cursorPosition;
    
    switch (direction) {
      case 'left':
        newPosition = Math.max(0, cursorPosition - 1);
        break;
      case 'right':
        newPosition = Math.min(value.length, cursorPosition + 1);
        break;
      case 'home':
        newPosition = 0;
        break;
      case 'end':
        newPosition = value.length;
        break;
    }
    
    setCursorPosition(newPosition);
    setSelectionStart(newPosition);
    setSelectionEnd(newPosition);
    onSelectionChange?.(newPosition, newPosition);
  };

  const handleSelectAll = () => {
    if (!onChange || value === undefined) return;
    
    setSelectionStart(0);
    setSelectionEnd(value.length);
    setCursorPosition(value.length);
    onSelectionChange?.(0, value.length);
  };

  const handleCopy = () => {
    if (!onChange || value === undefined) return;
    
    if (selectionStart !== selectionEnd) {
      const selectedText = value.slice(selectionStart, selectionEnd);
      setClipboard(selectedText);
    }
  };

  const handlePaste = () => {
    if (!onChange || value === undefined || !clipboard) return;
    
    const newValue = value.slice(0, selectionStart) + clipboard + value.slice(selectionEnd);
    onChange(newValue);
    const newPosition = selectionStart + clipboard.length;
    setCursorPosition(newPosition);
    setSelectionStart(newPosition);
    setSelectionEnd(newPosition);
  };

  const handleClear = () => {
    if (onChange && value !== undefined) {
      onChange('');
      setCursorPosition(0);
      setSelectionStart(0);
      setSelectionEnd(0);
    }
  };

  const toggleCase = () => {
    setIsUppercase(!isUppercase);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-[100]">
      <div className="bg-gradient-to-t from-gray-100 to-white rounded-t-3xl p-6 w-full max-w-5xl shadow-2xl border-t-4 border-luxe-gold">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Advanced Keyboard</h3>
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={onClose}
            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Text Display with Cursor */}
        {onChange && value !== undefined && (
          <div className="mb-4 p-4 bg-white border-2 border-gray-300 rounded-xl shadow-inner">
            <div className="min-h-[60px] text-xl text-gray-800 font-medium break-words leading-relaxed">
              {value.split('').map((char, index) => (
                <span 
                  key={index}
                  className={`${
                    index >= selectionStart && index < selectionEnd 
                      ? 'bg-blue-200 text-blue-800' 
                      : ''
                  }`}
                >
                  {char}
                </span>
              ))}
              {value === '' && (
                <span className="text-gray-400 italic">Start typing...</span>
              )}
              {cursorPosition === value.length && (
                <span className="animate-pulse bg-blue-500 w-0.5 h-6 inline-block ml-1"></span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-3 flex justify-between items-center border-t border-gray-200 pt-2">
              <span>Position: {cursorPosition} | Length: {value.length}</span>
              {selectionStart !== selectionEnd && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {selectionEnd - selectionStart} selected
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Editing Controls */}
        {onChange && value !== undefined && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <Button
              variant="outline"
              className="h-12 text-sm font-bold bg-gray-300 hover:bg-gray-400 text-black border-2 border-gray-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={() => handleCursorMove('home')}
            >
              <SkipBack className="h-4 w-4 mr-1" />
              HOME
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm font-bold bg-gray-300 hover:bg-gray-400 text-black border-2 border-gray-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={() => handleCursorMove('left')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm font-bold bg-gray-300 hover:bg-gray-400 text-black border-2 border-gray-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={() => handleCursorMove('right')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm font-bold bg-gray-300 hover:bg-gray-400 text-black border-2 border-gray-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={() => handleCursorMove('end')}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              END
            </Button>
          </div>
        )}
        
        {/* Advanced Functions */}
        {onChange && value !== undefined && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <Button
              variant="outline"
              className="h-12 text-sm font-bold bg-blue-300 hover:bg-blue-400 text-black border-2 border-blue-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={handleSelectAll}
            >
              SELECT ALL
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm font-bold bg-green-300 hover:bg-green-400 text-black border-2 border-green-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={handleCopy}
              disabled={selectionStart === selectionEnd}
            >
              <Copy className="h-4 w-4 mr-1" />
              COPY
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm font-bold bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-yellow-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={handlePaste}
              disabled={!clipboard}
            >
              <Clipboard className="h-4 w-4 mr-1" />
              PASTE
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm font-bold bg-red-300 hover:bg-red-400 text-black border-2 border-red-400 rounded-xl shadow-lg active:scale-95 transition-transform"
              onClick={handleClear}
            >
              CLEAR ALL
            </Button>
          </div>
        )}
        
        {qwertyRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2 mb-3">
            {rowIndex === 2 && (
              <Button
                variant="outline"
                className="h-16 px-6 text-lg font-bold bg-blue-500 hover:bg-blue-600 text-white border-none rounded-xl shadow-lg active:scale-95 transition-transform"
                onClick={toggleCase}
              >
                <ArrowUp className={`h-6 w-6 ${isUppercase ? 'text-yellow-300' : ''}`} />
                <span className="ml-1">SHIFT</span>
              </Button>
            )}
            {row.map((key) => (
              <Button
                key={key}
                variant="outline"
                className="h-16 px-4 text-xl font-bold bg-white hover:bg-luxe-gold hover:text-black border-2 border-gray-300 rounded-xl shadow-lg min-w-[60px] active:scale-95 transition-transform"
                onClick={() => handleKeyPress(key)}
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
                <Delete className="h-6 w-6" />
                <span className="ml-1">DELETE</span>
              </Button>
            )}
          </div>
        ))}
        
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            className="h-16 px-12 text-xl font-bold bg-white hover:bg-luxe-gold hover:text-black border-2 border-gray-300 rounded-xl shadow-lg active:scale-95 transition-transform"
            onClick={() => handleKeyPress(' ')}
          >
            SPACE
          </Button>
          <Button
            variant="outline"
            className="h-16 px-6 text-xl font-bold bg-white hover:bg-luxe-gold hover:text-black border-2 border-gray-300 rounded-xl shadow-lg active:scale-95 transition-transform"
            onClick={() => handleKeyPress('.')}
          >
            .
          </Button>
          <Button
            variant="outline"
            className="h-16 px-6 text-xl font-bold bg-white hover:bg-luxe-gold hover:text-black border-2 border-gray-300 rounded-xl shadow-lg active:scale-95 transition-transform"
            onClick={() => handleKeyPress('@')}
          >
            @
          </Button>
        </div>
      </div>
    </div>
  );
}