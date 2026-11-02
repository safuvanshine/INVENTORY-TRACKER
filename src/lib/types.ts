export type GoldPurity = '24K' | '22K' | '18K' | '14K';
export type GoldStatus = 'In Vault' | 'In Transit' | 'Reserved' | 'Processing';

export interface GoldItem {
  id: string;
  tagNo: string;           // 1. TAG NUMBER
  item: string;            // 2. ITEM
  certificateNo: string;   // 3. CERTIFICATE NUMBER
  description: string;     // 4. DESCRIPTION
  brand: string;           // 5. BRAND
  weight: number;          // 6. WEIGHT (kg or g)
  branch: string;          // 7. BRANCH
  // System attributes
  purity?: GoldPurity;
  status?: GoldStatus;
  estValueUsd?: number;
  lastUpdated: string;
}

export type DiamondType = 'Natural' | 'Lab Grown';
export type DiamondShape = string;
export type DiamondClarity = string;
export type DiamondColor = string;
export type DiamondStatus = 'In Vault' | 'In Transit' | 'Reserved' | 'Processing';

export interface DiamondItem {
  id: string;
  tagNo: string;           // 1. TAG NUMBER
  item: string;            // 2. ITEM
  certificateNo: string;   // 3. CERTIFICATE NUMBER
  description: string;     // 4. DESCRIPTION
  branch: string;          // 5. BRANCH
  carat: number;           // 6. CARAT
  clarity: DiamondClarity; // 7. CLARITY
  shape: DiamondShape;     // 8. SHAPE
  colour: DiamondColor;    // 9. COLOUR
  tagPrice: number;        // 10. TAG PRICE
  // System attributes
  stoneType?: DiamondType;
  status?: DiamondStatus;
  lastUpdated: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  region: 'Europe' | 'Middle East' | 'Americas' | 'Asia Pacific';
  totalGoldKg: number;
  totalDiamondCarats: number;
  activeVaults: number;
  totalVaultCapacityKg: number;
  securityStatus: 'Maximum Security' | 'Standard Secure' | 'Transit Mode';
  manager: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  category: 'Gold' | 'Diamond' | 'System' | 'Security';
  priority: 'Critical' | 'High Priority' | 'Action Req' | 'Info';
  timestamp: string;
  read: boolean;
  actionLabel?: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  itemTag: string;
  category: 'Gold' | 'Diamond' | 'User' | 'System';
  branch: string;
  timestamp: string;
  details: string;
}

export interface UserAccount {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: 'Master Admin' | 'Vault Manager' | 'Compliance Officer' | 'Auditor' | 'Operator';
  branch: string;
  activeStatus: 'Active' | 'Idle' | 'Offline';
  lastActive: string;
}

export interface TickerMovement {
  id: string;
  type: 'IN' | 'OUT' | 'TR' | 'PRICE';
  tagNo: string;
  description: string;
  timeAgo: string;
}
