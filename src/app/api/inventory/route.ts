import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vault_data.json');
const TMP_FILE = path.join(os.tmpdir(), 'vault_data.json');

// Memory cache fallback for serverless environments
let memoryStore: any = null;

async function readVaultData(): Promise<any | null> {
  if (fs.existsSync(TMP_FILE)) {
    try {
      const content = await fs.promises.readFile(TMP_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {}
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = await fs.promises.readFile(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {}
  }

  return memoryStore;
}

async function writeVaultData(data: any): Promise<void> {
  memoryStore = data;
  const content = JSON.stringify(data, null, 2);

  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, content, 'utf-8');
    return;
  } catch {
    // On serverless environments with read-only root, use tmp
    try {
      await fs.promises.writeFile(TMP_FILE, content, 'utf-8');
    } catch {}
  }
}

export async function GET() {
  try {
    const data = await readVaultData();
    if (data) {
      return NextResponse.json({ success: true, data, source: 'server' });
    }
    return NextResponse.json({ success: true, data: null, source: 'uninitialized' });
  } catch (error: any) {
    console.error('Failed to read server vault data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const existing = (await readVaultData()) || {};

    const payload = {
      goldItems: body.goldItems !== undefined ? body.goldItems : existing.goldItems,
      diamondItems: body.diamondItems !== undefined ? body.diamondItems : existing.diamondItems,
      alerts: body.alerts !== undefined ? body.alerts : existing.alerts,
      auditLogs: body.auditLogs !== undefined ? body.auditLogs : existing.auditLogs,
      users: body.users !== undefined ? body.users : existing.users,
      goldSpotPrice: body.goldSpotPrice !== undefined ? body.goldSpotPrice : existing.goldSpotPrice,
      adminPassword: existing.adminPassword || 'shine123',
      lastSynced: new Date().toISOString()
    };

    await writeVaultData(payload);

    return NextResponse.json({
      success: true,
      message: 'Vault inventory synced to central server repository',
      lastSynced: payload.lastSynced
    });
  } catch (error: any) {
    console.error('Failed to save server vault data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
