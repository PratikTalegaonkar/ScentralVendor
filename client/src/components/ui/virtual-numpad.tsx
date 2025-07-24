import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Delete, RotateCcw } from 'lucide-react';

interface VirtualNumpadProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
  maxLength?: number;
  allowDecimal?: boolean;
  title?: string;
}

export default function VirtualNumpad({
  value,
  onChange,
  onClose,
  placeholder = "Enter number",
  maxLength = 10,
  allowDecimal = false,
  title = "Enter Number"
}: VirtualNumpadProps) {
  const [currentValue, setCurrentValue] = useState(value || '');

  useEffect(() => {
    setCurrentValue(value || '');
  }, [value]);

  const handleNumber = (num: string) => {
    if (currentValue.length >= maxLength) return;
    
    // Prevent multiple decimal points
    if (num === '.' && currentValue.includes('.')) return;
    
    const newValue = currentValue + num;
    setCurrentValue(newValue);
    onChange(newValue);
  };

  const handleBackspace = () => {
    const newValue = currentValue.slice(0, -1);
    setCurrentValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setCurrentValue('');
    onChange('');
  };

  const handleClose = () => {
    onClose();
  };

  const numberButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <Card className="bg-white/95 backdrop-blur-sm border-luxe-gold/50">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-charcoal text-lg">{title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Display */}
            <div className="bg-gray-100 rounded-lg p-4 mb-4 min-h-16 flex items-center">
              <div className="w-full text-right">
                <div className="text-2xl font-mono text-charcoal">
                  {currentValue || placeholder}
                </div>
                {currentValue && (
                  <div className="text-sm text-gray-500 mt-1">
                    {currentValue.length}/{maxLength} characters
                  </div>
                )}
              </div>
            </div>

            {/* Numpad Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {numberButtons.slice(0, 9).map((num, index) => (
                <Button
                  key={num}
                  onClick={() => handleNumber(num)}
                  className="h-14 text-xl font-semibold bg-white hover:bg-gray-100 text-charcoal border border-gray-300 touch-target"
                  variant="outline"
                >
                  {num}
                </Button>
              ))}
              
              {/* Bottom row */}
              {allowDecimal && (
                <Button
                  onClick={() => handleNumber('.')}
                  className="h-14 text-xl font-semibold bg-white hover:bg-gray-100 text-charcoal border border-gray-300 touch-target"
                  variant="outline"
                  disabled={currentValue.includes('.')}
                >
                  .
                </Button>
              )}
              
              <Button
                onClick={() => handleNumber('0')}
                className={`h-14 text-xl font-semibold bg-white hover:bg-gray-100 text-charcoal border border-gray-300 touch-target ${
                  !allowDecimal ? 'col-span-2' : ''
                }`}
                variant="outline"
              >
                0
              </Button>
              
              {allowDecimal && (
                <Button
                  onClick={handleBackspace}
                  className="h-14 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 touch-target"
                  variant="outline"
                >
                  <Delete className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1 h-12 text-gray-600 hover:text-gray-800 border-gray-300 touch-target"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear
              </Button>
              
              {!allowDecimal && (
                <Button
                  onClick={handleBackspace}
                  variant="outline"
                  className="flex-1 h-12 bg-red-100 hover:bg-red-200 text-red-700 border-red-300 touch-target"
                >
                  <Delete className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              
              <Button
                onClick={handleClose}
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