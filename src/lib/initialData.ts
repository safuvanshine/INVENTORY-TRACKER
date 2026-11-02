import { GoldItem, DiamondItem, Branch, SystemAlert, AuditLogEntry, UserAccount, TickerMovement } from './types';

export const INITIAL_GOLD_ITEMS: GoldItem[] = [
  {
    id: 'gld-1',
    tagNo: 'AU-LDN-001',
    item: 'Bullion Bar 24K',
    certificateNo: 'GIA-GLD-998241',
    description: '999.9 Fine Gold Bar Standard Assay',
    brand: 'PAMP Suisse',
    weight: 12.400,
    branch: 'London Mayfair Vault',
    purity: '24K',
    status: 'In Vault',
    estValueUsd: 828568,
    lastUpdated: '10 mins ago'
  },
  {
    id: 'gld-2',
    tagNo: 'AU-LDN-002',
    item: 'Bullion Bar 24K',
    certificateNo: 'VAL-882901',
    description: 'Armored courier transport dispatch',
    brand: 'Valcambi',
    weight: 12.400,
    branch: 'In Transit (LDN -> GVA)',
    purity: '24K',
    status: 'In Transit',
    estValueUsd: 828568,
    lastUpdated: '25 mins ago'
  },
  {
    id: 'gld-3',
    tagNo: 'AU-GVA-104',
    item: 'Minted Sovereign Coin',
    certificateNo: 'EMR-554109',
    description: '22K Collector Coin Box 50x count',
    brand: 'Emirates Gold',
    weight: 1.555,
    branch: 'Geneva Safe 3',
    purity: '22K',
    status: 'In Vault',
    estValueUsd: 95200,
    lastUpdated: '1 hour ago'
  },
  {
    id: 'gld-4',
    tagNo: 'AU-NY-089',
    item: 'Gold Casting Grain',
    certificateNo: 'PRT-332901',
    description: '24K Sealed Pure Investment Grain',
    brand: 'Perth Mint',
    weight: 5.200,
    branch: 'New York 5th Avenue',
    purity: '24K',
    status: 'In Vault',
    estValueUsd: 347464,
    lastUpdated: '2 hours ago'
  },
  {
    id: 'gld-5',
    tagNo: 'AU-DXB-012',
    item: 'Bullion Bar 1kg',
    certificateNo: 'ARG-771203',
    description: '24K Cast Bullion Bar Fine Assay',
    brand: 'Argor-Heraeus',
    weight: 1.000,
    branch: 'Dubai Gold Souk',
    purity: '24K',
    status: 'Reserved',
    estValueUsd: 66820,
    lastUpdated: '3 hours ago'
  },
  {
    id: 'gld-6',
    tagNo: 'AU-LDN-045',
    item: 'Gold Grain Container',
    certificateNo: 'PMP-441092',
    description: 'Investment grade grain sealed container',
    brand: 'PAMP Suisse',
    weight: 5.000,
    branch: 'London Mayfair Vault',
    purity: '24K',
    status: 'In Vault',
    estValueUsd: 334100,
    lastUpdated: '4 hours ago'
  },
  {
    id: 'gld-7',
    tagNo: 'AU-PAR-022',
    item: 'Cast Bar 18K',
    certificateNo: 'HER-119834',
    description: '18K Yellow Gold alloy for jewelry production',
    brand: 'Heraeus',
    weight: 3.750,
    branch: 'Paris Place Vendôme',
    purity: '18K',
    status: 'In Vault',
    estValueUsd: 187900,
    lastUpdated: '5 hours ago'
  },
  {
    id: 'gld-8',
    tagNo: 'AU-ZUR-301',
    item: 'Bullion Bar 24K',
    certificateNo: 'UBS-884102',
    description: 'Standard London Good Delivery accredited bar',
    brand: 'Valcambi',
    weight: 10.000,
    branch: 'Zurich Bahnhofstrasse',
    purity: '24K',
    status: 'In Vault',
    estValueUsd: 668200,
    lastUpdated: '6 hours ago'
  }
];

export const INITIAL_DIAMOND_ITEMS: DiamondItem[] = [
  {
    id: 'dia-1',
    tagNo: 'DIA-9124',
    item: 'Diamond Solitaire Ring',
    certificateNo: 'GIA-64291882',
    description: 'Natural Round Brilliant Triple Ex Cut',
    branch: 'Geneva Vault A',
    carat: 3.20,
    clarity: 'VVS1',
    shape: 'Round Brilliant',
    colour: 'D',
    tagPrice: 124500,
    stoneType: 'Natural',
    status: 'In Vault',
    lastUpdated: '12 mins ago'
  },
  {
    id: 'dia-2',
    tagNo: 'DIA-8321',
    item: 'Emerald Cut Diamond',
    certificateNo: 'IGI-LG5882910',
    description: 'Lab Grown CVD Certified Zero Fluorescence',
    branch: 'New York Showroom',
    carat: 5.05,
    clarity: 'VVS2',
    shape: 'Emerald Cut',
    colour: 'E',
    tagPrice: 22000,
    stoneType: 'Lab Grown',
    status: 'In Vault',
    lastUpdated: '35 mins ago'
  },
  {
    id: 'dia-3',
    tagNo: 'DIA-7742',
    item: 'Oval Diamond Pendant',
    certificateNo: 'GIA-22190844',
    description: 'Internally Flawless Rare Natural Oval',
    branch: 'London Mayfair Vault',
    carat: 1.50,
    clarity: 'IF',
    shape: 'Oval',
    colour: 'D',
    tagPrice: 18200,
    stoneType: 'Natural',
    status: 'Processing',
    lastUpdated: '1 hour ago'
  },
  {
    id: 'dia-4',
    tagNo: 'DIA-6511',
    item: 'Pear Cut Diamond Specimen',
    certificateNo: 'GIA-11983021',
    description: 'Flawless High Fire Collector Diamond',
    branch: 'Geneva Vault B',
    carat: 4.12,
    clarity: 'FL',
    shape: 'Pear',
    colour: 'D',
    tagPrice: 210000,
    stoneType: 'Natural',
    status: 'In Vault',
    lastUpdated: '2 hours ago'
  },
  {
    id: 'dia-5',
    tagNo: 'DIA-5932',
    item: 'Radiant Cut Diamond Ring',
    certificateNo: 'IGI-LG4991024',
    description: 'Lab Grown Radiant Brilliant Finish',
    branch: 'Paris Place Vendôme',
    carat: 2.80,
    clarity: 'VS1',
    shape: 'Radiant',
    colour: 'F',
    tagPrice: 8400,
    stoneType: 'Lab Grown',
    status: 'In Transit',
    lastUpdated: '3 hours ago'
  },
  {
    id: 'dia-6',
    tagNo: 'DIA-4428',
    item: 'Emerald Cut Diamond',
    certificateNo: 'GIA-99812401',
    description: 'Natural Clean Emerald Cut High Clarity',
    branch: 'Dubai Hub',
    carat: 2.50,
    clarity: 'VVS2',
    shape: 'Emerald Cut',
    colour: 'D',
    tagPrice: 21000,
    stoneType: 'Natural',
    status: 'Reserved',
    lastUpdated: '4 hours ago'
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-ldn',
    code: 'S1',
    name: 'London Mayfair Vault',
    city: 'London',
    country: 'United Kingdom',
    region: 'Europe',
    totalGoldKg: 1245.0,
    totalDiamondCarats: 2100.5,
    activeVaults: 3,
    totalVaultCapacityKg: 2500.0,
    securityStatus: 'Maximum Security',
    manager: 'Jonathan Smith'
  },
  {
    id: 'branch-par',
    code: 'S2',
    name: 'Paris Place Vendôme',
    city: 'Paris',
    country: 'France',
    region: 'Europe',
    totalGoldKg: 680.4,
    totalDiamondCarats: 1850.0,
    activeVaults: 2,
    totalVaultCapacityKg: 1500.0,
    securityStatus: 'Maximum Security',
    manager: 'Éléonore Dubois'
  },
  {
    id: 'branch-gva',
    code: 'S3',
    name: 'Geneva FreePort & Safe',
    city: 'Geneva',
    country: 'Switzerland',
    region: 'Europe',
    totalGoldKg: 1890.2,
    totalDiamondCarats: 3400.0,
    activeVaults: 4,
    totalVaultCapacityKg: 3000.0,
    securityStatus: 'Maximum Security',
    manager: 'Marc Zimmerman'
  },
  {
    id: 'branch-ny',
    code: 'S4',
    name: 'New York 5th Avenue',
    city: 'New York',
    country: 'United States',
    region: 'Americas',
    totalGoldKg: 850.0,
    totalDiamondCarats: 2950.0,
    activeVaults: 2,
    totalVaultCapacityKg: 2000.0,
    securityStatus: 'Standard Secure',
    manager: 'Catherine Vanderbilt'
  },
  {
    id: 'branch-dxb',
    code: 'S5',
    name: 'Dubai Gold Souk Hub',
    city: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    totalGoldKg: 1420.5,
    totalDiamondCarats: 1620.0,
    activeVaults: 3,
    totalVaultCapacityKg: 2500.0,
    securityStatus: 'Maximum Security',
    manager: 'Tariq Al-Mansoor'
  },
  {
    id: 'branch-zur',
    code: 'S6',
    name: 'Zurich Bahnhofstrasse',
    city: 'Zurich',
    country: 'Switzerland',
    region: 'Europe',
    totalGoldKg: 950.0,
    totalDiamondCarats: 1200.0,
    activeVaults: 2,
    totalVaultCapacityKg: 1800.0,
    securityStatus: 'Maximum Security',
    manager: 'Stefan Weber'
  },
  {
    id: 'branch-mil',
    code: 'S7',
    name: 'Milan Via Montenapoleone',
    city: 'Milan',
    country: 'Italy',
    region: 'Europe',
    totalGoldKg: 540.0,
    totalDiamondCarats: 890.0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: 'Marco Rossi'
  },
  {
    id: 'branch-tok',
    code: 'S8',
    name: 'Tokyo Ginza High-Asset Vault',
    city: 'Tokyo',
    country: 'Japan',
    region: 'Asia Pacific',
    totalGoldKg: 780.0,
    totalDiamondCarats: 1450.0,
    activeVaults: 2,
    totalVaultCapacityKg: 1500.0,
    securityStatus: 'Maximum Security',
    manager: 'Kenji Takahashi'
  }
];

export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alt-1',
    title: 'Low Stock: 24k Bars',
    description: '15 High-value bars below minimum threshold in Dubai branch vault #2.',
    category: 'Gold',
    priority: 'High Priority',
    timestamp: '14 mins ago',
    read: false,
    actionLabel: 'Review Gold Stock'
  },
  {
    id: 'alt-2',
    title: 'Price Volatility Alert',
    description: 'Gold spot price fluctuation exceeds 2.14% threshold on LBMA exchange ($66.82/g).',
    category: 'Gold',
    priority: 'Action Req',
    timestamp: '42 mins ago',
    read: false,
    actionLabel: 'Update Rates'
  },
  {
    id: 'alt-3',
    title: 'GIA Sync Discrepancy',
    description: 'Failed to automatically verify 12 GIA certified stones in Paris Place Vendôme batch.',
    category: 'Diamond',
    priority: 'Critical',
    timestamp: '1 hour ago',
    read: false,
    actionLabel: 'Diagnose GIA Link'
  },
  {
    id: 'alt-4',
    title: 'New Certification Batch',
    description: '8 high-clarity natural stones ready for final gemological appraisal review.',
    category: 'Diamond',
    priority: 'Info',
    timestamp: '2 hours ago',
    read: false,
    actionLabel: 'View Batch'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    user: 'Jonathan Smith',
    action: 'Vault Deposit Verified',
    itemTag: 'AU-LDN-001',
    category: 'Gold',
    branch: 'London Mayfair Vault',
    timestamp: '10 mins ago',
    details: 'Verified physical weight 12.400 kg against PAMP assay cert #GIA-GLD-998241.'
  },
  {
    id: 'log-2',
    user: 'Éléonore Dubois',
    action: 'Dispatch Transferred',
    itemTag: 'AU-LDN-002',
    category: 'Gold',
    branch: 'Paris Place Vendôme',
    timestamp: '25 mins ago',
    details: 'Initiated secure transit to Geneva Freeport via Brinks Armored Service.'
  },
  {
    id: 'log-3',
    user: 'Marc Zimmerman',
    action: 'Certificate Re-Indexed',
    itemTag: 'DIA-9124',
    category: 'Diamond',
    branch: 'Geneva Freeport',
    timestamp: '1 hour ago',
    details: 'Re-indexed GIA report #64291882 for 3.20ct D-VVS1 natural specimen.'
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Safuwan',
    initials: 'SF',
    email: 'safuwan@shinegold.luxury',
    role: 'Master Admin',
    branch: 'Dubai DIFC',
    activeStatus: 'Active',
    lastActive: 'Now'
  },
  {
    id: 'usr-2',
    name: 'Éléonore Dubois',
    initials: 'ED',
    email: 'e.dubois@shinegold.luxury',
    role: 'Vault Manager',
    branch: 'Paris Vendôme',
    activeStatus: 'Active',
    lastActive: '5 mins ago'
  },
  {
    id: 'usr-3',
    name: 'Marco Rossi',
    initials: 'MR',
    email: 'm.rossi@shinegold.luxury',
    role: 'Compliance Officer',
    branch: 'Milan Atelier',
    activeStatus: 'Active',
    lastActive: '12 mins ago'
  },
  {
    id: 'usr-4',
    name: 'Tariq Al-Mansoor',
    initials: 'TM',
    email: 't.mansoor@shinegold.luxury',
    role: 'Vault Manager',
    branch: 'Dubai DIFC',
    activeStatus: 'Idle',
    lastActive: '45 mins ago'
  }
];

export const INITIAL_TICKER_MOVEMENTS: TickerMovement[] = [
  { id: 't-1', type: 'IN', tagNo: 'AU-7742', description: 'Gold Bar 12.4kg (London)', timeAgo: '2m ago' },
  { id: 't-2', type: 'IN', tagNo: 'AU-9011', description: 'Minted Coin 1oz x50 (Geneva)', timeAgo: '8m ago' },
  { id: 't-3', type: 'TR', tagNo: 'AU-3329', description: 'Gold Grain 5.2kg (Paris to NY)', timeAgo: '15m ago' },
  { id: 't-4', type: 'OUT', tagNo: 'AU-8821', description: 'Bullion Bar 1kg (Dubai)', timeAgo: '22m ago' },
  { id: 't-5', type: 'PRICE', tagNo: 'LBMA SPOT', description: 'Gold $66.82/g (+$0.45 24h)', timeAgo: 'Live' },
  { id: 't-6', type: 'IN', tagNo: 'DIA-9124', description: 'Round Brilliant 3.20ct ($124,500)', timeAgo: '40m ago' },
  { id: 't-7', type: 'IN', tagNo: 'DIA-8321', description: 'Emerald Cut 5.05ct ($22,000)', timeAgo: '55m ago' }
];

export const GOLD_SPOT_PRICE_PER_GRAM = 66.82;
