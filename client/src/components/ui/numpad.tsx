import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Delete } from 'lucide-react';

interface NumpadProps {
  onNumberClick: (num: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onClose: () => void;
  showDecimal?: boolean;
  maxValue?: number;
  currentValue?: string;
  title?: string;
}

export default function Numpad({ onNumberClick, onBackspace, onClear, onClose, showDecimal = false, maxValue, currentValue = '', title = 'Number Pad' }: NumpadProps) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  const handleNumberClick = (num: string) => {
    if (maxValue !== undefined) {
      const newValue = currentValue + num;
      const numericValue = parseInt(newValue);
      if (numericValue > maxValue) {
        return; // Don't allow input that exceeds max value
      }
    }
    onNumberClick(num);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-gradient-to-b from-gray-100 to-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 border-4 border-luxe-gold">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
            {maxValue !== undefined && (
              <p className="text-sm text-gray-600">Max: {maxValue}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={onClose}
            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-none"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Number Preview */}
        <div className="mb-6 p-4 bg-white border-2 border-gray-300 rounded-xl shadow-inner">
          <div className="min-h-[60px] text-xl text-gray-800 font-medium break-words leading-relaxed">
            {currentValue || (
              <span className="text-gray-400 italic">Enter number...</span>
            )}
            <span className="animate-pulse bg-blue-500 w-0.5 h-6 inline-block ml-1"></span>
          </div>
          <div className="text-sm text-gray-500 mt-3 border-t border-gray-200 pt-2">
            Length: {currentValue.length} characters
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {numbers.map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-20 text-3xl font-bold bg-white hover:bg-blue-500 hover:text-white border-3 border-gray-400 rounded-2xl shadow-lg active:scale-95 transition-transform"
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </Button>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-20 text-xl font-bold bg-red-500 hover:bg-red-600 text-white border-none rounded-2xl shadow-lg active:scale-95 transition-transform"
            onClick={onClear}
          >
            CLEAR
          </Button>
          <Button
            variant="outline"
            className="h-20 text-3xl font-bold bg-white hover:bg-blue-500 hover:text-white border-3 border-gray-400 rounded-2xl shadow-lg active:scale-95 transition-transform"
            onClick={() => handleNumberClick('0')}
          >
            0
          </Button>
          {showDecimal ? (
            <Button
              variant="outline"
              className="h-20 text-3xl font-bold bg-white hover:bg-blue-500 hover:text-white border-3 border-gray-400 rounded-2xl shadow-lg active:scale-95 transition-transform"
              onClick={() => handleNumberClick('.')}
            >
              .
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-20 text-lg font-bold bg-red-500 hover:bg-red-600 text-white border-none rounded-2xl shadow-lg active:scale-95 transition-transform"
              onClick={onBackspace}
            >
              <Delete className="h-6 w-6" />
            </Button>
          )}
        </div>
        
        {/* Done Button */}
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full h-16 text-xl font-bold bg-green-500 hover:bg-green-600 text-white border-none rounded-2xl shadow-lg active:scale-95 transition-transform"
            onClick={onClose}
          >
            DONE
          </Button>
        </div>
      </div>
    </div>
  );
}