import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatNumber(amount: number, digits: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(amount || 0);
}

/**
 * Resilient number parser that handles formatted Excel numbers,
 * currency signs ($ € £ ₹ AED), commas (thousands or European decimal),
 * units (ct, cts, kg, g), and whitespace.
 */
export function parseNumericValue(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }

  let str = String(val).trim();
  if (!str) return fallback;

  // Clean out currency symbols and alphabetic characters (like ct, cts, usd, aed, kg, etc.)
  // Keep only digits, dots, commas, minus
  str = str.replace(/[^\d.,-]/g, '');
  if (!str) return fallback;

  // Handle commas and dots:
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // European format (e.g. 15.000,50): dot is thousand, comma is decimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Standard format (e.g. 15,000.50): comma is thousand, dot is decimal
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    // If only 1 comma and parts[1] is not 3 digits, likely a decimal separator (e.g. "1,5" or "1,50")
    if (parts.length === 2 && parts[1].length !== 3) {
      str = parts[0] + '.' + parts[1];
    } else {
      // Thousand separator (e.g. "15,000" or "1,200,000")
      str = str.replace(/,/g, '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

export function exportToCsv(filename: string, rows: object[]) {
  if (!rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Data');
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : filename.replace(/\.csv$/, '.xlsx'));
}

// 7 Exact Columns for Gold
export function downloadExcelGoldTemplate() {
  const data = [
    {
      'TAG NUMBER': 'AU-LDN-001',
      'ITEM': 'Bullion Bar 24K',
      'CERTIFICATE NUMBER': 'GIA-GLD-998241',
      'DESCRIPTION': '999.9 Fine Gold Bar Standard Assay',
      'BRAND': 'PAMP Suisse',
      'WEIGHT': 12.400,
      'BRANCH': 'London Mayfair Vault'
    },
    {
      'TAG NUMBER': 'AU-GVA-104',
      'ITEM': 'Minted Sovereign Coin',
      'CERTIFICATE NUMBER': 'VAL-882901',
      'DESCRIPTION': '22K Collector Coin Box 50x',
      'BRAND': 'Valcambi',
      'WEIGHT': 1.555,
      'BRANCH': 'Geneva Safe 3'
    },
    {
      'TAG NUMBER': 'AU-NY-089',
      'ITEM': 'Gold Casting Grain',
      'CERTIFICATE NUMBER': 'PRT-332901',
      'DESCRIPTION': '24K Sealed Pure Investment Grain',
      'BRAND': 'Perth Mint',
      'WEIGHT': 5.200,
      'BRANCH': 'New York 5th Avenue'
    },
    {
      'TAG NUMBER': 'AU-DXB-012',
      'ITEM': 'Bullion Bar 1kg',
      'CERTIFICATE NUMBER': 'ARG-771203',
      'DESCRIPTION': '24K Cast Bullion Bar Fine Assay',
      'BRAND': 'Argor-Heraeus',
      'WEIGHT': 1.000,
      'BRANCH': 'Dubai Gold Souk'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Formatting exact column widths
  worksheet['!cols'] = [
    { wch: 16 }, // 1. TAG NUMBER
    { wch: 24 }, // 2. ITEM
    { wch: 22 }, // 3. CERTIFICATE NUMBER
    { wch: 38 }, // 4. DESCRIPTION
    { wch: 18 }, // 5. BRAND
    { wch: 14 }, // 6. WEIGHT
    { wch: 24 }  // 7. BRANCH
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gold Inventory');
  XLSX.writeFile(workbook, 'SHINE_GOLD_TEMPLATE.xlsx');
}

// 10 Exact Columns for Diamond
export function downloadExcelDiamondTemplate() {
  const data = [
    {
      'TAG NUMBER': 'DIA-9124',
      'ITEM': 'Diamond Solitaire Ring',
      'CERTIFICATE NUMBER': 'GIA-64291882',
      'DESCRIPTION': 'Natural Round Brilliant Triple Ex Cut',
      'BRANCH': 'Geneva Vault A',
      'CARAT': 3.20,
      'CLARITY': 'VVS1',
      'SHAPE': 'Round Brilliant',
      'COLOUR': 'D',
      'TAG PRICE': 124500
    },
    {
      'TAG NUMBER': 'DIA-8321',
      'ITEM': 'Emerald Cut Diamond',
      'CERTIFICATE NUMBER': 'IGI-LG5882910',
      'DESCRIPTION': 'Lab Grown CVD Certified Zero Fluorescence',
      'BRANCH': 'New York Showroom',
      'CARAT': 5.05,
      'CLARITY': 'VVS2',
      'SHAPE': 'Emerald Cut',
      'COLOUR': 'E',
      'TAG PRICE': 22000
    },
    {
      'TAG NUMBER': 'DIA-7742',
      'ITEM': 'Oval Diamond Pendant',
      'CERTIFICATE NUMBER': 'GIA-22190844',
      'DESCRIPTION': 'Internally Flawless Rare Natural Oval',
      'BRANCH': 'London Mayfair Vault',
      'CARAT': 1.50,
      'CLARITY': 'IF',
      'SHAPE': 'Oval',
      'COLOUR': 'D',
      'TAG PRICE': 18200
    },
    {
      'TAG NUMBER': 'DIA-6511',
      'ITEM': 'Pear Cut Diamond Specimen',
      'CERTIFICATE NUMBER': 'GIA-11983021',
      'DESCRIPTION': 'Flawless High Fire Collector Diamond',
      'BRANCH': 'Dubai Hub',
      'CARAT': 4.12,
      'CLARITY': 'FL',
      'SHAPE': 'Pear',
      'COLOUR': 'D',
      'TAG PRICE': 210000
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Formatting exact column widths
  worksheet['!cols'] = [
    { wch: 16 }, // 1. TAG NUMBER
    { wch: 26 }, // 2. ITEM
    { wch: 22 }, // 3. CERTIFICATE NUMBER
    { wch: 40 }, // 4. DESCRIPTION
    { wch: 24 }, // 5. BRANCH
    { wch: 12 }, // 6. CARAT
    { wch: 12 }, // 7. CLARITY
    { wch: 18 }, // 8. SHAPE
    { wch: 12 }, // 9. COLOUR
    { wch: 16 }  // 10. TAG PRICE
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Diamond Inventory');
  XLSX.writeFile(workbook, 'SHINE_DIAMOND_TEMPLATE.xlsx');
}
