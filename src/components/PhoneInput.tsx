import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface Country {
  code: string;
  nameKey: string;
  flag: string;
  dialCode: string;
  mask: string;
  placeholder: string;
}

const countries: Country[] = [
  { code: 'UZ', nameKey: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998', mask: '(99) 999-99-99', placeholder: '(90) 123-45-67' },
  { code: 'US', nameKey: 'United States', flag: '🇺🇸', dialCode: '+1', mask: '(999) 999-9999', placeholder: '(201) 555-0123' },
  { code: 'RU', nameKey: 'Russia', flag: '🇷🇺', dialCode: '+7', mask: '(999) 999-99-99', placeholder: '(900) 123-45-67' },
  { code: 'TR', nameKey: 'Turkey', flag: '🇹🇷', dialCode: '+90', mask: '(999) 999-9999', placeholder: '(500) 123-4567' },
];

interface PhoneInputProps {
  value: string; // Stores full number: e.g. "+998901234567"
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  isRequired?: boolean;
  name?: string;
}

export function PhoneInput({
  value = '',
  onChange,
  error,
  label,
  isRequired = false,
  name
}: PhoneInputProps) {
  const { t } = useTranslation();
  
  // Find which country matches the current value prefix
  const initialCountry = countries.find(c => value.startsWith(c.dialCode)) || countries[0];
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract digits that belong to the phone body
  const dialCode = selectedCountry.dialCode;
  const digitsOnly = value.startsWith(dialCode) 
    ? value.slice(dialCode.length).replace(/\D/g, '')
    : value.replace(/\D/g, '');

  // Helper to count expected digits in mask
  const getMaxDigits = (mask: string) => (mask.match(/9/g) || []).length;

  // Formatting function
  const formatPhone = (digits: string, mask: string): string => {
    let formatted = '';
    let digitIndex = 0;
    for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
      if (mask[i] === '9') {
        formatted += digits[digitIndex++];
      } else {
        formatted += mask[i];
      }
    }
    return formatted;
  };

  const displayValue = formatPhone(digitsOnly, selectedCountry.mask);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const inputDigits = rawInput.replace(/\D/g, '');
    const maxDigits = getMaxDigits(selectedCountry.mask);
    const trimmedDigits = inputDigits.slice(0, maxDigits);
    onChange(selectedCountry.dialCode + trimmedDigits);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    // Preserving digits if possible, otherwise starting clean
    const maxDigits = getMaxDigits(country.mask);
    const trimmedDigits = digitsOnly.slice(0, maxDigits);
    onChange(country.dialCode + trimmedDigits);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-brand-navy dark:text-neutral-200">
          {label || t('phoneNumber')}
          {isRequired && <span className="text-danger ml-1">*</span>}
        </label>
      </div>

      <div 
        ref={dropdownRef}
        className={`relative flex items-center h-11 w-full rounded-lg border bg-white dark:bg-night-field px-3 transition-all duration-200 
          ${error 
            ? 'border-danger ring-1 ring-danger/20' 
            : 'border-neutral-300 dark:border-border focus-within:border-brand-royal dark:focus-within:border-night-royal focus-within:ring-2 focus-within:ring-brand-royal/20 dark:focus-within:ring-night-royal/25 focus-within:shadow-sm'
          }`}
      >
        {/* Country Selector Dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 h-full pr-3 border-r border-neutral-100 dark:border-border hover:text-brand-royal-hover dark:hover:text-night-gold text-brand-navy dark:text-neutral-200 text-sm font-semibold select-none focus:outline-none"
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.nameKey}>
            {selectedCountry.flag}
          </span>
          <span>{selectedCountry.dialCode}</span>
          <ChevronDown className={`size-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-neutral-600 dark:text-neutral-400`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-neutral-100 dark:border-border bg-white dark:bg-overlay shadow-lg z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountrySelect(c)}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-night-elevated transition-colors
                  ${selectedCountry.code === c.code 
                    ? 'bg-brand-gold-soft/40 dark:bg-default text-brand-royal dark:text-brand-gold font-semibold' 
                    : 'text-brand-navy dark:text-neutral-200'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" role="img" aria-label={c.nameKey}>{c.flag}</span>
                  <span>{c.nameKey}</span>
                </div>
                <span className="text-neutral-600 dark:text-neutral-400 text-xs font-medium">{c.dialCode}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hidden inputs to make form submit work natively */}
        <input type="hidden" name={name} value={value} />

        {/* Formatted Phone Input Field */}
        <input
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={selectedCountry.placeholder}
          required={isRequired}
          className="flex-1 h-full pl-3 text-sm text-brand-navy dark:text-neutral-200 bg-transparent outline-none border-none placeholder-neutral-600 dark:placeholder-neutral-400 focus:ring-0 focus:border-none focus:outline-none"
        />
      </div>

      {error && (
        <span className="text-xs text-danger animate-in fade-in duration-200">
          {error}
        </span>
      )}
    </div>
  );
}
