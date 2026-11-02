import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vault_data.json');
const TMP_FILE = path.join(os.tmpdir(), 'vault_data.json');
const DEFAULT_ADMIN_PASSWORD = 'shine123';

let memoryPassword: string | null = null;

async function getStoredPassword(): Promise<string> {
  if (memoryPassword) return memoryPassword;

  if (fs.existsSync(TMP_FILE)) {
    try {
      const content = await fs.promises.readFile(TMP_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data.adminPassword) return data.adminPassword;
    } catch {}
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = await fs.promises.readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      return data.adminPassword || DEFAULT_ADMIN_PASSWORD;
    } catch {}
  }
  return DEFAULT_ADMIN_PASSWORD;
}

async function setStoredPassword(newPass: string) {
  memoryPassword = newPass;

  let data: any = {};
  if (fs.existsSync(TMP_FILE)) {
    try {
      data = JSON.parse(await fs.promises.readFile(TMP_FILE, 'utf-8'));
    } catch {}
  } else if (fs.existsSync(DATA_FILE)) {
    try {
      data = JSON.parse(await fs.promises.readFile(DATA_FILE, 'utf-8'));
    } catch {}
  }

  data.adminPassword = newPass;
  data.lastUpdated = new Date().toISOString();
  const content = JSON.stringify(data, null, 2);

  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, content, 'utf-8');
  } catch {
    try {
      await fs.promises.writeFile(TMP_FILE, content, 'utf-8');
    } catch {}
  }
}

export async function POST(req: Request) {
  try {
    const { action, password, currentPassword, newPassword } = await req.json();
    const storedPassword = await getStoredPassword();

    // 1. Verify password
    if (action === 'verify') {
      if (!password) {
        return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
      }

      const isValid = password.trim() === storedPassword.trim();
      if (isValid) {
        return NextResponse.json({ success: true, message: 'Authentication successful' });
      } else {
        return NextResponse.json({ success: false, error: 'Incorrect Master Password' }, { status: 401 });
      }
    }

    // 2. Change / Reset password
    if (action === 'change_password') {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ success: false, error: 'Current and new passwords are required' }, { status: 400 });
      }

      if (currentPassword.trim() !== storedPassword.trim()) {
        return NextResponse.json({ success: false, error: 'Current password does not match' }, { status: 400 });
      }

      if (newPassword.trim().length < 4) {
        return NextResponse.json({ success: false, error: 'New password must be at least 4 characters' }, { status: 400 });
      }

      await setStoredPassword(newPassword.trim());
      return NextResponse.json({ success: true, message: 'Admin password updated successfully' });
    }

    // 3. Reset to default
    if (action === 'reset_to_default') {
      await setStoredPassword(DEFAULT_ADMIN_PASSWORD);
      return NextResponse.json({ success: true, message: 'Password reset to default (shine123)' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
