export interface CountryData {
  iso2: string;
  name: string;
  nameUz?: string;
  nameRu?: string;
  dialCode: string;
  format: string; // '.' represents digit slot, other characters are formatting mask
  placeholder: string;
  lengths: number[]; // valid national number lengths
  priority?: number;
  areaCodes?: string[];
}

/**
 * Standard list of countries with dial codes, national mask formats, and translations.
 */
export const COUNTRIES: CountryData[] = [
  // CIS & Central Asia (Primary regions)
  {
    iso2: 'UZ',
    name: 'Uzbekistan',
    nameUz: "O'zbekiston",
    nameRu: 'Узбекистан',
    dialCode: '+998',
    format: '(..) ...-..-..',
    placeholder: '(90) 123-45-67',
    lengths: [9],
    priority: 1,
  },
  {
    iso2: 'KZ',
    name: 'Kazakhstan',
    nameUz: "Qozog'iston",
    nameRu: 'Казахстан',
    dialCode: '+7',
    format: '(...) ...-..-..',
    placeholder: '(701) 123-45-67',
    lengths: [10],
    priority: 2,
    areaCodes: ['7', '6'],
  },
  {
    iso2: 'RU',
    name: 'Russia',
    nameUz: 'Rossiya',
    nameRu: 'Россия',
    dialCode: '+7',
    format: '(...) ...-..-..',
    placeholder: '(900) 123-45-67',
    lengths: [10],
    priority: 1,
    areaCodes: ['9', '3', '4', '8'],
  },
  {
    iso2: 'KG',
    name: 'Kyrgyzstan',
    nameUz: "Qirg'iziston",
    nameRu: 'Кыргызстан',
    dialCode: '+996',
    format: '(...) ..-..-..',
    placeholder: '(555) 12-34-56',
    lengths: [9],
  },
  {
    iso2: 'TJ',
    name: 'Tajikistan',
    nameUz: 'Tojikiston',
    nameRu: 'Таджикистан',
    dialCode: '+992',
    format: '(..) ...-..-..',
    placeholder: '(92) 123-45-67',
    lengths: [9],
  },
  {
    iso2: 'TM',
    name: 'Turkmenistan',
    nameUz: 'Turkmaniston',
    nameRu: 'Туркменистан',
    dialCode: '+993',
    format: '(..) ...-...',
    placeholder: '(65) 123-456',
    lengths: [8],
  },
  {
    iso2: 'AZ',
    name: 'Azerbaijan',
    nameUz: 'Ozarbayjon',
    nameRu: 'Азербайджан',
    dialCode: '+994',
    format: '(..) ...-..-..',
    placeholder: '(50) 123-45-67',
    lengths: [9],
  },
  {
    iso2: 'AM',
    name: 'Armenia',
    nameUz: 'Armaniston',
    nameRu: 'Армения',
    dialCode: '+374',
    format: '(..) ...-...',
    placeholder: '(91) 123-456',
    lengths: [8],
  },
  {
    iso2: 'BY',
    name: 'Belarus',
    nameUz: 'Belarus',
    nameRu: 'Беларусь',
    dialCode: '+375',
    format: '(..) ...-..-..',
    placeholder: '(29) 123-45-67',
    lengths: [9],
  },
  {
    iso2: 'GE',
    name: 'Georgia',
    nameUz: 'Gruziya',
    nameRu: 'Грузия',
    dialCode: '+995',
    format: '(...) ...-...',
    placeholder: '(599) 123-456',
    lengths: [9],
  },
  {
    iso2: 'UA',
    name: 'Ukraine',
    nameUz: 'Ukraina',
    nameRu: 'Украина',
    dialCode: '+380',
    format: '(..) ...-..-..',
    placeholder: '(50) 123-45-67',
    lengths: [9],
  },
  {
    iso2: 'MD',
    name: 'Moldova',
    nameUz: 'Moldova',
    nameRu: 'Молдова',
    dialCode: '+373',
    format: '(..) ...-...',
    placeholder: '(68) 123-456',
    lengths: [8],
  },

  // Middle East & Key Trade Hubs
  {
    iso2: 'TR',
    name: 'Turkey',
    nameUz: 'Turkiya',
    nameRu: 'Турция',
    dialCode: '+90',
    format: '(...) ...-....',
    placeholder: '(500) 123-4567',
    lengths: [10],
  },
  {
    iso2: 'AE',
    name: 'United Arab Emirates',
    nameUz: 'BAA (Dubay)',
    nameRu: 'ОАЭ',
    dialCode: '+971',
    format: '(..) ...-....',
    placeholder: '(50) 123-4567',
    lengths: [9],
  },
  {
    iso2: 'SA',
    name: 'Saudi Arabia',
    nameUz: 'Saudiya Arabistoni',
    nameRu: 'Саудовская Аравия',
    dialCode: '+966',
    format: '(..) ...-....',
    placeholder: '(50) 123-4567',
    lengths: [9],
  },
  {
    iso2: 'QA',
    name: 'Qatar',
    nameUz: 'Qatar',
    nameRu: 'Катар',
    dialCode: '+974',
    format: '.... ....',
    placeholder: '3312 3456',
    lengths: [8],
  },
  {
    iso2: 'KW',
    name: 'Kuwait',
    nameUz: 'Quvayt',
    nameRu: 'Кувейт',
    dialCode: '+965',
    format: '.... ....',
    placeholder: '9123 4567',
    lengths: [8],
  },
  {
    iso2: 'OM',
    name: 'Oman',
    nameUz: 'Ummon',
    nameRu: 'Оман',
    dialCode: '+968',
    format: '.... ....',
    placeholder: '9123 4567',
    lengths: [8],
  },
  {
    iso2: 'CN',
    name: 'China',
    nameUz: 'Xitoy',
    nameRu: 'Китай',
    dialCode: '+86',
    format: '... .... ....',
    placeholder: '138 0000 0000',
    lengths: [11],
  },
  {
    iso2: 'KR',
    name: 'South Korea',
    nameUz: 'Janubiy Koreya',
    nameRu: 'Южная Корея',
    dialCode: '+82',
    format: '(..) ....-....',
    placeholder: '(10) 1234-5678',
    lengths: [10],
  },
  {
    iso2: 'JP',
    name: 'Japan',
    nameUz: 'Yaponiya',
    nameRu: 'Япония',
    dialCode: '+81',
    format: '(..) ....-....',
    placeholder: '(90) 1234-5678',
    lengths: [10],
  },
  {
    iso2: 'IN',
    name: 'India',
    nameUz: 'Hindiston',
    nameRu: 'Индия',
    dialCode: '+91',
    format: '..... .....',
    placeholder: '98765 43210',
    lengths: [10],
  },
  {
    iso2: 'PK',
    name: 'Pakistan',
    nameUz: 'Pokiston',
    nameRu: 'Пакистан',
    dialCode: '+92',
    format: '(...) .......',
    placeholder: '(300) 1234567',
    lengths: [10],
  },
  {
    iso2: 'AF',
    name: 'Afghanistan',
    nameUz: 'Afgʻoniston',
    nameRu: 'Афганистан',
    dialCode: '+93',
    format: '(..) ...-....',
    placeholder: '(70) 123-4567',
    lengths: [9],
  },
  {
    iso2: 'IR',
    name: 'Iran',
    nameUz: 'Eron',
    nameRu: 'Иран',
    dialCode: '+98',
    format: '(...) ...-....',
    placeholder: '(912) 123-4567',
    lengths: [10],
  },
  {
    iso2: 'SG',
    name: 'Singapore',
    nameUz: 'Singapur',
    nameRu: 'Сингапур',
    dialCode: '+65',
    format: '.... ....',
    placeholder: '9123 4567',
    lengths: [8],
  },
  {
    iso2: 'MY',
    name: 'Malaysia',
    nameUz: 'Malayziya',
    nameRu: 'Малайзия',
    dialCode: '+60',
    format: '(..) ....-....',
    placeholder: '(12) 345-6789',
    lengths: [9, 10],
  },
  {
    iso2: 'ID',
    name: 'Indonesia',
    nameUz: 'Indoneziya',
    nameRu: 'Индонезия',
    dialCode: '+62',
    format: '...-....-....',
    placeholder: '812-3456-7890',
    lengths: [10, 11, 12],
  },
  {
    iso2: 'TH',
    name: 'Thailand',
    nameUz: 'Tailand',
    nameRu: 'Таиланд',
    dialCode: '+66',
    format: '(..) ...-....',
    placeholder: '(81) 234-5678',
    lengths: [9],
  },
  {
    iso2: 'VN',
    name: 'Vietnam',
    nameUz: 'Vyetnam',
    nameRu: 'Вьетнам',
    dialCode: '+84',
    format: '(..) ....-....',
    placeholder: '(91) 234-5678',
    lengths: [9, 10],
  },
  {
    iso2: 'IL',
    name: 'Israel',
    nameUz: 'Isroil',
    nameRu: 'Израиль',
    dialCode: '+972',
    format: '(..) ...-....',
    placeholder: '(50) 123-4567',
    lengths: [9],
  },

  // Americas & Europe
  {
    iso2: 'US',
    name: 'United States',
    nameUz: 'AQSH',
    nameRu: 'США',
    dialCode: '+1',
    format: '(...) ...-....',
    placeholder: '(201) 555-0123',
    lengths: [10],
    priority: 1,
  },
  {
    iso2: 'CA',
    name: 'Canada',
    nameUz: 'Kanada',
    nameRu: 'Канада',
    dialCode: '+1',
    format: '(...) ...-....',
    placeholder: '(416) 555-0123',
    lengths: [10],
    priority: 2,
  },
  {
    iso2: 'GB',
    name: 'United Kingdom',
    nameUz: 'Buyuk Britaniya',
    nameRu: 'Великобритания',
    dialCode: '+44',
    format: '.... ......',
    placeholder: '7911 123456',
    lengths: [10],
  },
  {
    iso2: 'DE',
    name: 'Germany',
    nameUz: 'Germaniya',
    nameRu: 'Германия',
    dialCode: '+49',
    format: '(...) .......',
    placeholder: '(151) 1234567',
    lengths: [10, 11],
  },
  {
    iso2: 'FR',
    name: 'France',
    nameUz: 'Fransiya',
    nameRu: 'Франция',
    dialCode: '+33',
    format: '. .. .. .. ..',
    placeholder: '6 12 34 56 78',
    lengths: [9],
  },
  {
    iso2: 'IT',
    name: 'Italy',
    nameUz: 'Italiya',
    nameRu: 'Италия',
    dialCode: '+39',
    format: '... .......',
    placeholder: '312 3456789',
    lengths: [10],
  },
  {
    iso2: 'ES',
    name: 'Spain',
    nameUz: 'Ispaniya',
    nameRu: 'Испания',
    dialCode: '+34',
    format: '... .. .. ..',
    placeholder: '612 34 56 78',
    lengths: [9],
  },
  {
    iso2: 'PL',
    name: 'Poland',
    nameUz: 'Polsha',
    nameRu: 'Польша',
    dialCode: '+48',
    format: '... ... ...',
    placeholder: '512 345 678',
    lengths: [9],
  },
  {
    iso2: 'NL',
    name: 'Netherlands',
    nameUz: 'Niderlandiya',
    nameRu: 'Нидерланды',
    dialCode: '+31',
    format: '. .. .. .. ..',
    placeholder: '6 12 34 56 78',
    lengths: [9],
  },
  {
    iso2: 'BE',
    name: 'Belgium',
    nameUz: 'Belgiya',
    nameRu: 'Бельгия',
    dialCode: '+32',
    format: '... .. .. ..',
    placeholder: '470 12 34 56',
    lengths: [9],
  },
  {
    iso2: 'CH',
    name: 'Switzerland',
    nameUz: 'Shveytsariya',
    nameRu: 'Швейцария',
    dialCode: '+41',
    format: '(..) ... .. ..',
    placeholder: '(78) 123 45 67',
    lengths: [9],
  },
  {
    iso2: 'AT',
    name: 'Austria',
    nameUz: 'Avstriya',
    nameRu: 'Австрия',
    dialCode: '+43',
    format: '(...) .......',
    placeholder: '(664) 1234567',
    lengths: [10, 11],
  },
  {
    iso2: 'SE',
    name: 'Sweden',
    nameUz: 'Shvetsiya',
    nameRu: 'Швеция',
    dialCode: '+46',
    format: '(..) ... .. ..',
    placeholder: '(70) 123 45 67',
    lengths: [9],
  },
  {
    iso2: 'NO',
    name: 'Norway',
    nameUz: 'Norvegiya',
    nameRu: 'Норвегия',
    dialCode: '+47',
    format: '... .. ...',
    placeholder: '412 34 567',
    lengths: [8],
  },
  {
    iso2: 'FI',
    name: 'Finland',
    nameUz: 'Finlandiya',
    nameRu: 'Финляндия',
    dialCode: '+358',
    format: '(..) ... .. ..',
    placeholder: '(40) 123 45 67',
    lengths: [9, 10],
  },
  {
    iso2: 'DK',
    name: 'Denmark',
    nameUz: 'Daniya',
    nameRu: 'Дания',
    dialCode: '+45',
    format: '.. .. .. ..',
    placeholder: '20 12 34 56',
    lengths: [8],
  },
  {
    iso2: 'CZ',
    name: 'Czech Republic',
    nameUz: 'Chexiya',
    nameRu: 'Чехия',
    dialCode: '+420',
    format: '... ... ...',
    placeholder: '601 123 456',
    lengths: [9],
  },
  {
    iso2: 'SK',
    name: 'Slovakia',
    nameUz: 'Slovakiya',
    nameRu: 'Словакия',
    dialCode: '+421',
    format: '... ... ...',
    placeholder: '901 123 456',
    lengths: [9],
  },
  {
    iso2: 'HU',
    name: 'Hungary',
    nameUz: 'Vengriya',
    nameRu: 'Венгрия',
    dialCode: '+36',
    format: '(..) ...-....',
    placeholder: '(20) 123-4567',
    lengths: [9],
  },
  {
    iso2: 'RO',
    name: 'Romania',
    nameUz: 'Ruminiya',
    nameRu: 'Румыния',
    dialCode: '+40',
    format: '(...) ...-...',
    placeholder: '(712) 345-678',
    lengths: [9],
  },
  {
    iso2: 'BG',
    name: 'Bulgaria',
    nameUz: 'Bolgariya',
    nameRu: 'Болгария',
    dialCode: '+359',
    format: '(...) ...-...',
    placeholder: '(87) 123-4567',
    lengths: [9],
  },
  {
    iso2: 'GR',
    name: 'Greece',
    nameUz: 'Gretsiya',
    nameRu: 'Греция',
    dialCode: '+30',
    format: '... .......',
    placeholder: '691 2345678',
    lengths: [10],
  },
  {
    iso2: 'PT',
    name: 'Portugal',
    nameUz: 'Portugaliya',
    nameRu: 'Португалия',
    dialCode: '+351',
    format: '... ... ...',
    placeholder: '912 345 678',
    lengths: [9],
  },
  {
    iso2: 'IE',
    name: 'Ireland',
    nameUz: 'Irlandiya',
    nameRu: 'Ирландия',
    dialCode: '+353',
    format: '(..) ...-....',
    placeholder: '(83) 123-4567',
    lengths: [9],
  },
  {
    iso2: 'BR',
    name: 'Brazil',
    nameUz: 'Braziliya',
    nameRu: 'Бразилия',
    dialCode: '+55',
    format: '(..) .....-....',
    placeholder: '(11) 91234-5678',
    lengths: [11],
  },
  {
    iso2: 'MX',
    name: 'Mexico',
    nameUz: 'Meksika',
    nameRu: 'Мексика',
    dialCode: '+52',
    format: '(...) ...-....',
    placeholder: '(55) 1234-5678',
    lengths: [10],
  },
  {
    iso2: 'AR',
    name: 'Argentina',
    nameUz: 'Argentina',
    nameRu: 'Аргентина',
    dialCode: '+54',
    format: '(..) ....-....',
    placeholder: '(11) 1234-5678',
    lengths: [10],
  },
  {
    iso2: 'AU',
    name: 'Australia',
    nameUz: 'Avstraliya',
    nameRu: 'Австралия',
    dialCode: '+61',
    format: '... ... ...',
    placeholder: '412 345 678',
    lengths: [9],
  },
  {
    iso2: 'NZ',
    name: 'New Zealand',
    nameUz: 'Yangi Zelandiya',
    nameRu: 'Новая Зеландия',
    dialCode: '+64',
    format: '(..) ...-....',
    placeholder: '(21) 123-4567',
    lengths: [9, 10],
  },
  {
    iso2: 'EG',
    name: 'Egypt',
    nameUz: 'Misr',
    nameRu: 'Египет',
    dialCode: '+20',
    format: '(...) ...-....',
    placeholder: '(100) 123-4567',
    lengths: [10],
  },
  {
    iso2: 'ZA',
    name: 'South Africa',
    nameUz: 'Janubiy Afrika',
    nameRu: 'ЮАР',
    dialCode: '+27',
    format: '(..) ...-....',
    placeholder: '(71) 123-4567',
    lengths: [9],
  },
  {
    iso2: 'NG',
    name: 'Nigeria',
    nameUz: 'Nigeriya',
    nameRu: 'Нигерия',
    dialCode: '+234',
    format: '(...) ...-....',
    placeholder: '(802) 123-4567',
    lengths: [10],
  },
  {
    iso2: 'KE',
    name: 'Kenya',
    nameUz: 'Keniya',
    nameRu: 'Кения',
    dialCode: '+254',
    format: '... ......',
    placeholder: '712 345678',
    lengths: [9],
  },
];

/**
 * Returns country flag emoji for an ISO2 code.
 */
export function getCountryFlag(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🌐';
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Strips all non-digit characters from the input.
 */
export function extractDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(/\D/g, '');
}

/**
 * Finds country by ISO 2 code (case-insensitive).
 */
export function findCountryByIso(iso2: string): CountryData {
  const upper = (iso2 || '').toUpperCase();
  const match = COUNTRIES.find((c) => c.iso2 === upper);
  return match || COUNTRIES[0];
}

/**
 * Detects the country from a raw phone string (e.g. "+998901234567", "998901234567", "+77011234567").
 */
export function detectCountryFromPhone(
  phone: string,
  preferredCountryIso?: string
): { country: CountryData; nationalDigits: string } {
  const preferred = preferredCountryIso ? findCountryByIso(preferredCountryIso) : COUNTRIES[0];

  if (!phone) {
    return { country: preferred, nationalDigits: '' };
  }

  const digits = extractDigits(phone);
  if (!digits) {
    return { country: preferred, nationalDigits: '' };
  }

  const rawTrimmed = String(phone).trim();
  const hasPlus = rawTrimmed.startsWith('+');
  const prefCodeDigits = preferred.dialCode.replace(/\D/g, '');
  const prefMaxLen = preferred.lengths?.length > 0 ? Math.max(...preferred.lengths) : 15;

  // 1. If no leading '+', check preferred country first
  if (!hasPlus) {
    // If digits start with preferred country dial code AND total length exceeds national length,
    // it's a full international number for the preferred country (e.g. "998330094112" for UZ)
    if (
      digits.startsWith(prefCodeDigits) &&
      digits.length > prefCodeDigits.length &&
      digits.length > prefMaxLen
    ) {
      const national = digits.slice(prefCodeDigits.length);
      return { country: preferred, nationalDigits: national.slice(0, prefMaxLen) };
    }

    // If digits length is within the preferred country's national length,
    // treat it as national digits for preferred country (e.g. "330094112" for UZ)
    if (digits.length <= prefMaxLen) {
      return { country: preferred, nationalDigits: digits };
    }
  }

  // 2. International detection: Match against country dial codes
  // Sort candidate countries by dial code length descending for longest prefix matching
  const sortedCountries = [...COUNTRIES].sort((a, b) => {
    const lenA = a.dialCode.replace(/\D/g, '').length;
    const lenB = b.dialCode.replace(/\D/g, '').length;
    if (lenB !== lenA) return lenB - lenA;

    // Prefer preferred country if dial code lengths match
    if (a.iso2 === preferred.iso2) return -1;
    if (b.iso2 === preferred.iso2) return 1;

    return (a.priority || 99) - (b.priority || 99);
  });

  for (const c of sortedCountries) {
    const codeDigits = c.dialCode.replace(/\D/g, '');
    if (digits.startsWith(codeDigits)) {
      const remaining = digits.slice(codeDigits.length);

      // Handle shared dial codes (e.g. +7 KZ vs RU, +1 US vs CA)
      if (c.areaCodes && c.areaCodes.length > 0) {
        if (remaining.length > 0) {
          const firstAreaDigit = remaining[0];
          if (c.areaCodes.includes(firstAreaDigit)) {
            const countryMax = c.lengths?.length > 0 ? Math.max(...c.lengths) : 15;
            return { country: c, nationalDigits: remaining.slice(0, countryMax) };
          }
          // If area code didn't match, continue checking other candidate countries
          continue;
        }
      }

      const countryMax = c.lengths?.length > 0 ? Math.max(...c.lengths) : 15;
      return { country: c, nationalDigits: remaining.slice(0, countryMax) };
    }
  }

  // 3. Fallback: return preferred country with digits capped at its max length
  return { country: preferred, nationalDigits: digits.slice(0, prefMaxLen) };
}

/**
 * Universal formatter for national digits given a country format mask.
 * Automatically slices to max allowed length and formats without trailing mask punctuation.
 */
export function formatNationalNumber(digits: string, country: CountryData): string {
  const clean = extractDigits(digits);
  if (!clean) return '';

  const maxLen = country.lengths?.length > 0 ? Math.max(...country.lengths) : 15;
  const trimmed = clean.slice(0, maxLen);
  const mask = country.format;

  let formatted = '';
  let digitIdx = 0;
  let lastFilledIndex = -1;

  for (let i = 0; i < mask.length && digitIdx < trimmed.length; i++) {
    const maskChar = mask[i];
    if (maskChar === '.') {
      formatted += trimmed[digitIdx++];
      lastFilledIndex = formatted.length - 1;
    } else {
      formatted += maskChar;
    }
  }

  // If there are more digits than placeholders in mask, append remainder cleanly with spaces
  if (digitIdx < trimmed.length) {
    const extra = trimmed.slice(digitIdx);
    formatted += (formatted ? ' ' : '') + extra;
    lastFilledIndex = formatted.length - 1;
  }

  // Trim trailing decoration (e.g. open brackets, hyphens, spaces) that haven't been filled yet
  if (lastFilledIndex >= 0) {
    let result = formatted.slice(0, lastFilledIndex + 1);
    // Don't leave an open bracket like "(" with no digits if user typed nothing
    if (result.endsWith('(')) {
      result = result.slice(0, -1).trim();
    }
    return result;
  }

  return '';
}

/**
 * Formats a generic international number if no specific mask is available.
 */
export function formatGenericInternational(dialCode: string, nationalDigits: string): string {
  const clean = extractDigits(nationalDigits);
  if (!clean) return dialCode;

  // Group generic numbers in blocks: 3-3-4 or 3-4-4
  const parts: string[] = [];
  let remaining = clean;
  while (remaining.length > 0) {
    if (remaining.length > 4) {
      parts.push(remaining.slice(0, 3));
      remaining = remaining.slice(3);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return `${dialCode} ${parts.join(' ')}`.trim();
}

/**
 * Formats full phone number string into international presentation (e.g. "+998 (90) 123-45-67").
 */
export function formatFullInternational(
  value: string,
  preferredCountryIso?: string
): {
  e164: string;
  formatted: string;
  country: CountryData;
  nationalDigits: string;
  isValid: boolean;
} {
  if (!value) {
    const country = preferredCountryIso ? findCountryByIso(preferredCountryIso) : COUNTRIES[0];
    return {
      e164: '',
      formatted: '',
      country,
      nationalDigits: '',
      isValid: false,
    };
  }

  const { country, nationalDigits } = detectCountryFromPhone(value, preferredCountryIso);
  const formattedNational = formatNationalNumber(nationalDigits, country);
  const formatted = formattedNational
    ? `${country.dialCode} ${formattedNational}`
    : country.dialCode;
  const e164 = nationalDigits ? `${country.dialCode}${nationalDigits}` : '';
  const isValid = country.lengths.includes(nationalDigits.length);

  return {
    e164,
    formatted,
    country,
    nationalDigits,
    isValid,
  };
}

/**
 * Checks whether a keypress is valid for entering phone numbers.
 * Blocks all letters, symbols, punctuation, etc.
 */
export function isAllowedPhoneKey(
  e: React.KeyboardEvent<HTMLInputElement>,
  _currentVal: string
): boolean {
  // Allow standard control and navigation keys
  const controlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown',
  ];

  if (controlKeys.includes(e.key)) {
    return true;
  }

  // Allow standard keyboard shortcuts (Ctrl/Cmd + A, C, V, X, Z, Y)
  if (e.ctrlKey || e.metaKey) {
    const allowed = ['a', 'c', 'v', 'x', 'z', 'y', 'r'];
    if (allowed.includes(e.key.toLowerCase())) {
      return true;
    }
  }

  // Allow numeric digits (0-9)
  if (/^[0-9]$/.test(e.key)) {
    return true;
  }

  // Allow '+' sign (useful if typing full international prefix)
  if (e.key === '+') {
    return true;
  }

  // Block everything else
  return false;
}

/**
 * Calculates updated caret/cursor position after phone number formatting.
 */
export function calculatePhoneCursorPosition(
  oldFormatted: string,
  newFormatted: string,
  oldCursor: number
): number {
  if (oldCursor <= 0) return 0;
  if (oldCursor >= oldFormatted.length) return newFormatted.length;

  // Count raw digits before the cursor in the old formatted string
  let rawCount = 0;
  for (let i = 0; i < oldCursor; i++) {
    if (/\d/.test(oldFormatted[i])) {
      rawCount++;
    }
  }

  // Find corresponding position in new formatted string
  let newCursor = 0;
  let currentRawCount = 0;
  while (newCursor < newFormatted.length && currentRawCount < rawCount) {
    if (/\d/.test(newFormatted[newCursor])) {
      currentRawCount++;
    }
    newCursor++;
  }

  // If next char is a formatting character, advance cursor past it
  while (newCursor < newFormatted.length && !/\d/.test(newFormatted[newCursor])) {
    newCursor++;
  }

  return newCursor;
}
