import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Delete, RotateCcw, Space, ArrowUp, ArrowLeft, ArrowRight, Undo2, Redo2 } from 'lucide-react';

interface VirtualKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
  maxLength?: number;
  title?: string;
  multiline?: boolean;
}

export default function VirtualKeyboard({
  value,
  onChange,
  onClose,
  placeholder = "Enter text",
  maxLength = 100,
  title = "Enter Text",
  multiline = false
}: VirtualKeyboardProps) {
  const [currentValue, setCurrentValue] = useState(value || '');
  const [cursorPosition, setCursorPosition] = useState(currentValue.length);
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  const [history, setHistory] = useState<string[]>([value || '']);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setCurrentValue(value || '');
    setCursorPosition((value || '').length);
  }, [value]);

  const addToHistory = (newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleInput = (char: string) => {
    if (currentValue.length >= maxLength) return;
    
    const beforeCursor = currentValue.slice(0, cursorPosition);
    const afterCursor = currentValue.slice(cursorPosition);
    
    let finalChar = char;
    if (isShift || isCaps) {
      finalChar = char.toUpperCase();
      if (isShift) setIsShift(false); // Reset shift after use
    }
    
    const newValue = beforeCursor + finalChar + afterCursor;
    setCurrentValue(newValue);
    onChange(newValue);
    setCursorPosition(cursorPosition + 1);
    addToHistory(newValue);
  };

  const handleBackspace = () => {
    if (cursorPosition === 0) return;
    
    const beforeCursor = currentValue.slice(0, cursorPosition - 1);
    const afterCursor = currentValue.slice(cursorPosition);
    const newValue = beforeCursor + afterCursor;
    
    setCurrentValue(newValue);
    onChange(newValue);
    setCursorPosition(cursorPosition - 1);
    addToHistory(newValue);
  };

  const handleSpace = () => {
    handleInput(' ');
  };

  const handleEnter = () => {
    if (multiline) {
      handleInput('\n');
    }
  };

  const handleClear = () => {
    setCurrentValue('');
    onChange('');
    setCursorPosition(0);
    addToHistory('');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const newValue = history[newIndex];
      setCurrentValue(newValue);
      onChange(newValue);
      setCursorPosition(newValue.length);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const newValue = history[newIndex];
      setCurrentValue(newValue);
      onChange(newValue);
      setCursorPosition(newValue.length);
      setHistoryIndex(newIndex);
    }
  };

  const handleCursorMove = (direction: 'left' | 'right') => {
    if (direction === 'left' && cursorPosition > 0) {
      setCursorPosition(cursorPosition - 1);
    } else if (direction === 'right' && cursorPosition < currentValue.length) {
      setCursorPosition(cursorPosition + 1);
    }
  };

  const qwertyRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const symbolRow = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];

  const getDisplayValue = () => {
    if (!currentValue) return placeholder;
    const beforeCursor = currentValue.slice(0, cursorPosition);
    const afterCursor = currentValue.slice(cursorPosition);
    return beforeCursor + '|' + afterCursor;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/95 backdrop-blur-sm border-luxe-gold/50">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-charcoal text-lg">{title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Display */}
            <div className="bg-gray-100 rounded-lg p-4 mb-4 min-h-20 max-h-32 overflow-y-auto">
              <div className="font-mono text-lg text-charcoal whitespace-pre-wrap break-words">
                {getDisplayValue()}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {currentValue.length}/{maxLength} characters
              </div>
            </div>

            {/* Editing Controls */}
            <div className="flex space-x-2 mb-4">
              <Button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                variant="outline"
                size="sm"
                className="touch-target"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                variant="outline"
                size="sm"
                className="touch-target"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleCursorMove('left')}
                variant="outline"
                size="sm"
                className="touch-target"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleCursorMove('right')}
                variant="outline"
                size="sm"
                className="touch-target"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 touch-target"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Number Row */}
            <div className="grid grid-cols-10 gap-1 mb-2">
              {(isShift ? symbolRow : numberRow).map((char, index) => (
                <Button
                  key={`num-${index}`}
                  onClick={() => handleInput(char)}
                  className="h-10 text-sm bg-white hover:bg-gray-100 text-charcoal border border-gray-300 touch-target"
                  variant="outline"
                >
                  {char}
                </Button>
              ))}
            </div>

            {/* QWERTY Rows */}
            {qwertyRows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex justify-center mb-2">
                <div className={`grid gap-1 ${row.length === 10 ? 'grid-cols-10' : row.length === 9 ? 'grid-cols-9' : 'grid-cols-7'}`}>
                  {row.map((char) => (
                    <Button
                      key={char}
                      onClick={() => handleInput(char)}
                      className="h-10 text-sm bg-white hover:bg-gray-100 text-charcoal border border-gray-300 touch-target"
                      variant="outline"
                    >
                      {isShift || isCaps ? char.toUpperCase() : char}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {/* Bottom Controls */}
            <div className="flex space-x-2 mt-4">
              <Button
                onClick={() => setIsShift(!isShift)}
                variant="outline"
                className={`h-10 touch-target ${isShift ? 'bg-blue-100 text-blue-700' : ''}`}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setIsCaps(!isCaps)}
                variant="outline"
                className={`h-10 touch-target ${isCaps ? 'bg-blue-100 text-blue-700' : ''}`}
              >
                CAPS
              </Button>
              <Button
                onClick={handleSpace}
                className="flex-1 h-10 bg-white hover:bg-gray-100 text-charcoal border border-gray-300 touch-target"
                variant="outline"
              >
                <Space className="mr-2 h-4 w-4" />
                Space
              </Button>
              {multiline && (
                <Button
                  onClick={handleEnter}
                  variant="outline"
                  className="h-10 touch-target"
                >
                  Enter
                </Button>
              )}
              <Button
                onClick={handleBackspace}
                className="h-10 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 touch-target"
                variant="outline"
              >
                <Delete className="h-4 w-4" />
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 mt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 h-12 touch-target"
              >
                Cancel
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 h-12 bg-luxe-gold hover:bg-yellow-600 text-charcoal touch-target"
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}