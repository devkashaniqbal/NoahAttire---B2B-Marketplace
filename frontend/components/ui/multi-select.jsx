'use client';
import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MultiSelect({ options, value = [], onChange, placeholder = 'Select...', disabled = false, emptyText = 'No options available' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (val) => {
    if (value.includes(val)) onChange(value.filter((v) => v !== val));
    else onChange([...value, val]);
  };

  const remove = (val, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const selectedLabels = options.filter((o) => value.includes(o.value));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50'
        )}
      >
        {selectedLabels.length === 0 ? (
          <span className="text-gray-400">{disabled ? emptyText : placeholder}</span>
        ) : (
          <span className="flex flex-wrap gap-1 py-0.5">
            {selectedLabels.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 rounded bg-alibaba-50 text-alibaba-700 px-1.5 py-0.5 text-xs font-medium"
              >
                {o.label}
                <X className="h-3 w-3 cursor-pointer hover:text-alibaba-900" onClick={(e) => remove(o.value, e)} />
              </span>
            ))}
          </span>
        )}
        <ChevronDown className={cn('h-4 w-4 flex-shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg py-1">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">{emptyText}</p>
          ) : (
            options.map((o) => {
              const checked = value.includes(o.value);
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-50"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border',
                      checked ? 'bg-alibaba-600 border-alibaba-600' : 'border-gray-300'
                    )}
                  >
                    {checked && <Check className="h-3 w-3 text-white" />}
                  </span>
                  {o.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
