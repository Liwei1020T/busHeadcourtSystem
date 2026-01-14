import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Option = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export default function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const selectedCount = value.length;
  
  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between bg-gray-50/50 h-9 px-3 font-normal"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {selectedCount === 0 
            ? <span className="text-gray-500">{placeholder}</span>
            : selectedCount === options.length
                ? "All Selected" 
                : `${selectedCount} selected`
          }
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
           <div className="px-2 py-1.5 border-b mb-1 flex items-center justify-between sticky top-0 bg-white z-10">
              <span className="text-xs text-gray-400 font-medium">{options.length} options</span>
              {selectedCount > 0 && (
                  <button 
                    className="text-xs text-red-500 hover:text-red-700" 
                    onClick={(e) => { e.stopPropagation(); onChange([]); }}
                  >
                    Clear
                  </button>
              )}
           </div>
           {options.map((option) => {
             const isSelected = value.includes(option.value);
             return (
               <div
                 key={option.value}
                 className={cn(
                   "relative flex cursor-default select-none items-center py-1.5 pl-2 pr-2 outline-none hover:bg-emerald-50 transition-colors cursor-pointer",
                 )}
                 onClick={() => handleToggle(option.value)}
               >
                 <div className="flex items-center flex-1 gap-2">
                   <div className={`flex h-4 w-4 items-center justify-center rounded border ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'}`}>
                      {isSelected && <Check className="h-3 w-3" />}
                   </div>
                   <span className={cn("block truncate", isSelected && "font-medium text-emerald-900")}>
                     {option.label}
                   </span>
                 </div>
               </div>
             )
           })}
        </div>
      )}
    </div>
  );
}
