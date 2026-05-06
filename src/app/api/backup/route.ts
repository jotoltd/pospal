import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const backupDir = path.join(process.cwd(), "data", "backups");
const dbPath = path.join(process.cwd(), "data", "pos.db");

function ensureBackupDir() {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
}

function listBackups() {
  ensureBackupDir();
  return fs.readdirSync(backupDir)
    .filter(f => f.startsWith("backup-") && f.endsWith(".db"))
    .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time)
    .map(f => f.name);
}

// GET - list backups OR download a specific one OR create a new backup
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const file = searchParams.get("file");

  // Download a specific backup file
  if (action === "download" && file) {
    const filePath = path.join(backupDir, file);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    });
  }

  // Create a new backup
  if (action === "create" || !action) {
    try {
      ensureBackupDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupDir, `backup-${timestamp}.db`);
      fs.copyFileSync(dbPath, backupPath);

      // Keep last 10 only
      const all = listBackups();
      if (all.length > 10) {
        all.slice(10).forEach(f => { try { fs.unlinkSync(path.join(backupDir, f)); } catch {} });
      }

      return NextResponse.json({ success: true, message: "Backup created", file: `backup-${timestamp}.db`, backups: listBackups() });
    } catch {
      return NextResponse.json({ success: false, error: "Backup failed" }, { status: 500 });
    }
  }

  // List backups
  return NextResponse.json({ success: true, backups: listBackups() });
}

// POST - restore from backup
export async function POST(req: Request) {
  try {
    const { file } = await req.json();
    const backupPath = path.join(process.cwd(), "data", "backups", file);
    
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        { success: false, error: "Backup not found" },
        { status: 404 }
      );
    }
    
    // Create safety backup first
    const safetyBackup = path.join(
      process.cwd(),
      "data",
      `safety-${Date.now()}.db`
    );
    fs.copyFileSync(dbPath, safetyBackup);
    
    // Restore
    fs.copyFileSync(backupPath, dbPath);
    
    return NextResponse.json({
      success: true,
      message: "Database restored",
      safetyBackup,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Restore failed" },
      { status: 500 }
    );
  }
}
