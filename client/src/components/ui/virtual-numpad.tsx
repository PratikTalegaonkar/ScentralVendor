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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-end justify-center">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-lg mb-0"
      >
        <Card className="bg-white/98 backdrop-blur-sm border-luxe-gold/50 rounded-t-3xl rounded-b-none shadow-2xl border-b-0">
          <CardContent className="p-8 pb-10">
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
            <div className="bg-gray-100 rounded-xl p-6 mb-8 min-h-20 flex items-center shadow-inner">
              <div className="w-full text-right">
                <div className="text-3xl font-mono text-charcoal min-h-[1.2em]">
                  {currentValue || placeholder}
                </div>
                {currentValue && (
                  <div className="text-sm text-gray-500 mt-2">
                    {currentValue.length}/{maxLength} characters
                  </div>
                )}
              </div>
            </div>

            {/* Numpad Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {numberButtons.slice(0, 9).map((num, index) => (
                <Button
                  key={num}
                  onClick={() => handleNumber(num)}
                  className="h-20 text-3xl font-semibold bg-white hover:bg-gray-50 text-charcoal border-2 border-gray-300 hover:border-luxe-gold/50 touch-target rounded-xl shadow-sm transition-all duration-200"
                  variant="outline"
                >
                  {num}
                </Button>
              ))}
              
              {/* Bottom row */}
              {allowDecimal && (
                <Button
                  onClick={() => handleNumber('.')}
                  className="h-20 text-3xl font-semibold bg-white hover:bg-gray-50 text-charcoal border-2 border-gray-300 hover:border-luxe-gold/50 touch-target rounded-xl shadow-sm transition-all duration-200"
                  variant="outline"
                  disabled={currentValue.includes('.')}
                >
                  .
                </Button>
              )}
              
              <Button
                onClick={() => handleNumber('0')}
                className={`h-20 text-3xl font-semibold bg-white hover:bg-gray-50 text-charcoal border-2 border-gray-300 hover:border-luxe-gold/50 touch-target rounded-xl shadow-sm transition-all duration-200 ${
                  !allowDecimal ? 'col-span-2' : ''
                }`}
                variant="outline"
              >
                0
              </Button>
              
              {allowDecimal && (
                <Button
                  onClick={handleBackspace}
                  className="h-20 text-xl font-semibold bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-300 hover:border-red-400 touch-target rounded-xl shadow-sm transition-all duration-200"
                  variant="outline"
                >
                  <Delete className="h-6 w-6" />
                </Button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1 h-16 text-lg text-gray-600 hover:text-gray-800 border-2 border-gray-300 hover:border-gray-400 touch-target rounded-xl shadow-sm transition-all duration-200"
              >
                <RotateCcw className="mr-3 h-5 w-5" />
                Clear
              </Button>
              
              {!allowDecimal && (
                <Button
                  onClick={handleBackspace}
                  variant="outline"
                  className="flex-1 h-16 text-lg bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-300 hover:border-red-400 touch-target rounded-xl shadow-sm transition-all duration-200"
                >
                  <Delete className="mr-3 h-5 w-5" />
                  Delete
                </Button>
              )}
              
              <Button
                onClick={handleClose}
                className="flex-1 h-16 text-lg bg-luxe-gold hover:bg-yellow-600 text-charcoal touch-target rounded-xl shadow-sm transition-all duration-200 font-semibold"
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