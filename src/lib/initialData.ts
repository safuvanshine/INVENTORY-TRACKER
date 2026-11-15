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
    branch: 'HO',
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
    branch: 'In Transit',
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
    branch: 'S1',
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
    branch: 'S2',
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
    branch: 'S3',
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
    branch: 'HO',
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
    branch: 'S4',
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
    branch: 'S5',
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
    branch: 'S6',
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
    branch: 'S7',
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
    branch: 'HO',
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
    branch: 'S8',
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
    branch: 'S4',
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
    branch: 'S9',
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
    id: 'branch-ho',
    code: 'HO',
    name: 'HO',
    city: 'Head Office',
    country: 'India',
    region: 'Head Office',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 5000.0,
    securityStatus: 'Maximum Security',
    manager: 'Safuwan'
  },
  {
    id: 'branch-s1',
    code: 'S1',
    name: 'S1',
    city: 'Branch S1',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s2',
    code: 'S2',
    name: 'S2',
    city: 'Branch S2',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s3',
    code: 'S3',
    name: 'S3',
    city: 'Branch S3',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s4',
    code: 'S4',
    name: 'S4',
    city: 'Branch S4',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s5',
    code: 'S5',
    name: 'S5',
    city: 'Branch S5',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s6',
    code: 'S6',
    name: 'S6',
    city: 'Branch S6',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s7',
    code: 'S7',
    name: 'S7',
    city: 'Branch S7',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s8',
    code: 'S8',
    name: 'S8',
    city: 'Branch S8',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s9',
    code: 'S9',
    name: 'S9',
    city: 'Branch S9',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s10',
    code: 'S10',
    name: 'S10',
    city: 'Branch S10',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s11',
    code: 'S11',
    name: 'S11',
    city: 'Branch S11',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s12',
    code: 'S12',
    name: 'S12',
    city: 'Branch S12',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  },
  {
    id: 'branch-s13',
    code: 'S13',
    name: 'S13',
    city: 'Branch S13',
    country: 'India',
    region: 'Branch',
    totalGoldKg: 0,
    totalDiamondCarats: 0,
    activeVaults: 1,
    totalVaultCapacityKg: 1000.0,
    securityStatus: 'Standard Secure',
    manager: ''
  }
];

export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alt-1',
    title: 'Low Stock: 24k Bars',
    description: '15 High-value bars below minimum threshold in S3 branch vault.',
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
    description: 'Failed to automatically verify 12 GIA certified stones in S4 batch.',
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
    user: 'Safuwan',
    action: 'Vault Deposit Verified',
    itemTag: 'AU-LDN-001',
    category: 'Gold',
    branch: 'HO',
    timestamp: '10 mins ago',
    details: 'Verified physical weight 12.400 kg against PAMP assay cert #GIA-GLD-998241.'
  },
  {
    id: 'log-2',
    user: 'Staff S1',
    action: 'Dispatch Transferred',
    itemTag: 'AU-LDN-002',
    category: 'Gold',
    branch: 'S1',
    timestamp: '25 mins ago',
    details: 'Initiated secure transit to S2 via Brinks Armored Service.'
  },
  {
    id: 'log-3',
    user: 'Staff S2',
    action: 'Certificate Re-Indexed',
    itemTag: 'DIA-9124',
    category: 'Diamond',
    branch: 'S2',
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
    branch: 'HO',
    activeStatus: 'Active',
    lastActive: 'Now'
  },
  {
    id: 'usr-2',
    name: 'Staff S1',
    initials: 'S1',
    email: 's1@shinegold.luxury',
    role: 'Vault Manager',
    branch: 'S1',
    activeStatus: 'Active',
    lastActive: '5 mins ago'
  },
  {
    id: 'usr-3',
    name: 'Staff S2',
    initials: 'S2',
    email: 's2@shinegold.luxury',
    role: 'Vault Manager',
    branch: 'S2',
    activeStatus: 'Active',
    lastActive: '12 mins ago'
  },
  {
    id: 'usr-4',
    name: 'Staff S3',
    initials: 'S3',
    email: 's3@shinegold.luxury',
    role: 'Vault Manager',
    branch: 'S3',
    activeStatus: 'Idle',
    lastActive: '45 mins ago'
  }
];

export const INITIAL_TICKER_MOVEMENTS: TickerMovement[] = [
  { id: 't-1', type: 'IN', tagNo: 'AU-7742', description: 'Gold Bar 12.4kg (HO)', timeAgo: '2m ago' },
  { id: 't-2', type: 'IN', tagNo: 'AU-9011', description: 'Minted Coin 1oz x50 (S1)', timeAgo: '8m ago' },
  { id: 't-3', type: 'TR', tagNo: 'AU-3329', description: 'Gold Grain 5.2kg (S1 to S2)', timeAgo: '15m ago' },
  { id: 't-4', type: 'OUT', tagNo: 'AU-8821', description: 'Bullion Bar 1kg (S3)', timeAgo: '22m ago' },
  { id: 't-5', type: 'PRICE', tagNo: 'LBMA SPOT', description: 'Gold $66.82/g (+$0.45 24h)', timeAgo: 'Live' },
  { id: 't-6', type: 'IN', tagNo: 'DIA-9124', description: 'Round Brilliant 3.20ct ($124,500)', timeAgo: '40m ago' },
  { id: 't-7', type: 'IN', tagNo: 'DIA-8321', description: 'Emerald Cut 5.05ct ($22,000)', timeAgo: '55m ago' }
];

export const GOLD_SPOT_PRICE_PER_GRAM = 66.82;
