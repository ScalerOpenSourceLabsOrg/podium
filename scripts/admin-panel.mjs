#!/usr/bin/env node
/**
 * PODIUM CROSS-PLATFORM PROCESS SUPERVISOR & ADMIN WEB PANEL
 * Works seamlessly on Linux, macOS, and Windows.
 * Zero external npm dependencies (pure Node.js standard library).
 */

import http from "node:http";
import net from "node:net";
import crypto from "node:crypto";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { spawn, exec } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

let prisma = null;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

async function getUsersList() {
  const p = getPrisma();
  const users = await p.user.findMany({
    include: {
      memberships: { include: { event: { select: { slug: true, name: true } } } },
      registrations: { include: { event: { select: { slug: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    roles: [
      ...u.memberships.map((m) => ({ role: m.role, slug: m.event.slug, name: m.event.name })),
      ...u.registrations.map((r) => ({ role: "REGISTRANT", slug: r.event.slug, name: r.event.name })),
    ],
  }));
}

async function addUserRole(email, role, slug, name) {
  const p = getPrisma();
  const event = await p.event.findUnique({ where: { slug } });
  if (!event) throw new Error(`Event '${slug}' not found.`);

  const cleanEmail = email.trim().toLowerCase();
  const user = await p.user.upsert({
    where: { email: cleanEmail },
    update: name ? { name } : {},
    create: { email: cleanEmail, name: name || cleanEmail.split("@")[0] },
  });

  if (role === "ORGANIZER" || role === "JUDGE") {
    await p.eventMembership.upsert({
      where: { eventId_userId_role: { eventId: event.id, userId: user.id, role } },
      update: {},
      create: { eventId: event.id, userId: user.id, role },
    });
  } else if (role === "REGISTRANT") {
    await p.registration.upsert({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
      update: {},
      create: { eventId: event.id, userId: user.id },
    });
  }
  return { ok: true, message: `Assigned ${role} role to ${cleanEmail} on ${slug}` };
}

async function removeUserRole(userId, role, slug) {
  const p = getPrisma();
  const event = await p.event.findUnique({ where: { slug } });
  if (!event) throw new Error(`Event '${slug}' not found.`);

  if (role === "ORGANIZER") {
    const count = await p.eventMembership.count({
      where: { eventId: event.id, role: "ORGANIZER" },
    });
    if (count <= 1) {
      throw new Error("Cannot remove the last organizer from the event.");
    }
  }

  if (role === "ORGANIZER" || role === "JUDGE") {
    await p.eventMembership.deleteMany({
      where: { eventId: event.id, userId, role },
    });
  } else if (role === "REGISTRANT") {
    await p.registration.deleteMany({
      where: { eventId: event.id, userId },
    });
  }
  return { ok: true, message: `Removed ${role} role from user on ${slug}` };
}

// ─── Ephemeral Dynamic Credentials ──────────────────────────────────────────
const RAND_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
const PASS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";

function generateUsername() {
  let rand = "";
  for (let i = 0; i < 7; i++) {
    rand += RAND_CHARS[crypto.randomInt(0, RAND_CHARS.length)];
  }
  return `admin_${rand}`;
}

function generatePassword() {
  let pass = "";
  for (let i = 0; i < 16; i++) {
    pass += PASS_CHARS[crypto.randomInt(0, PASS_CHARS.length)];
  }
  return pass;
}

const ADMIN_USER = generateUsername();
const ADMIN_PASS = generatePassword();
const activeSessions = new Set();
const failedAttempts = new Map(); // ip -> { count, lockedUntil }

// ─── Circular Log Buffer ────────────────────────────────────────────────────
const MAX_LOG_LINES = 2000;
const logBuffer = [];
const sseClients = new Set();

function broadcastLog(line) {
  const timestamp = new Date().toISOString().substring(11, 19);
  const entry = { time: timestamp, text: line };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_LINES) logBuffer.shift();

  const data = `data: ${JSON.stringify(entry)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

// ─── Child Process Manager (Next.js) ────────────────────────────────────────
let nextProcess = null;
let appState = "STOPPED"; // "RUNNING" | "STOPPED" | "STARTING"
let appStartTime = null;

function appendSystemLog(msg) {
  console.log(`[PODIUM-SUPERVISOR] ${msg}`);
  broadcastLog(`[SYSTEM] ${msg}`);
}

function startNextServer() {
  if (appState === "RUNNING" || appState === "STARTING") {
    return { ok: false, message: "Server is already active." };
  }

  appState = "STARTING";
  appendSystemLog("Initiating Next.js application server (turbopack mode)...");

  const isWin = process.platform === "win32";
  const cmd = isWin ? "npm.cmd run dev" : "npm";
  const args = isWin ? [] : ["run", "dev"];

  nextProcess = spawn(cmd, args, {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: "3000" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: !isWin,
    shell: isWin,
  });

  appStartTime = Date.now();

  nextProcess.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text); // Terminal backup
    for (const line of text.split(/\r?\n/)) {
      if (line.trim()) {
        broadcastLog(line);
        if (line.includes("Ready in") || line.includes("Local:") || line.includes("http://localhost:3000")) {
          appState = "RUNNING";
        }
      }
    }
  });

  nextProcess.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    process.stderr.write(text); // Terminal backup
    for (const line of text.split(/\r?\n/)) {
      if (line.trim()) broadcastLog(`[STDERR] ${line}`);
    }
  });

  nextProcess.on("exit", (code, signal) => {
    appendSystemLog(`Next.js process terminated (code: ${code}, signal: ${signal})`);
    appState = "STOPPED";
    nextProcess = null;
    appStartTime = null;
  });

  // Fallback state update after initial boot window
  setTimeout(() => {
    if (appState === "STARTING" && nextProcess) {
      appState = "RUNNING";
    }
  }, 4000);

  return { ok: true, message: "Next.js server launch initiated." };
}

function stopNextServer() {
  if (!nextProcess || appState === "STOPPED") {
    appState = "STOPPED";
    return { ok: true, message: "Server is not running." };
  }

  appendSystemLog("Stopping Next.js application server...");
  const pid = nextProcess.pid;

  if (process.platform === "win32") {
    exec(`taskkill /pid ${pid} /T /F`, (err) => {
      if (err) appendSystemLog(`Warning during taskkill: ${err.message}`);
    });
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        nextProcess.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    }
  }

  appState = "STOPPED";
  nextProcess = null;
  appStartTime = null;
  return { ok: true, message: "Server stopped." };
}

function restartNextServer() {
  stopNextServer();
  setTimeout(() => {
    startNextServer();
  }, 1200);
  return { ok: true, message: "Restarting server..." };
}

// ─── Autonomous Process Execution ───────────────────────────────────────────
function runCommand(command, args = []) {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    let cmd = command;
    const cmdArgs = args;

    if (isWin) {
      if (command === "npm") cmd = "npm.cmd";
      else if (command === "npx") cmd = "npx.cmd";
    }

    const proc = spawn(cmd, cmdArgs, {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: isWin,
    });

    let output = "";
    proc.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      for (const line of text.split(/\r?\n/)) {
        if (line.trim()) {
          console.log(`[AUTONOMOUS] ${line}`);
          broadcastLog(`[SETUP] ${line}`);
        }
      }
    });

    proc.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      for (const line of text.split(/\r?\n/)) {
        if (line.trim()) {
          console.error(`[AUTONOMOUS] ${line}`);
          broadcastLog(`[SETUP] ${line}`);
        }
      }
    });

    proc.on("close", (code) => {
      resolve({ code: code ?? 0, output });
    });

    proc.on("error", (err) => {
      appendSystemLog(`Command execution error: ${err.message}`);
      resolve({ code: 1, output: err.message });
    });
  });
}

async function ensureDatabaseAndData() {
  appendSystemLog("[AUTONOMOUS] Checking PostgreSQL database connectivity (port 5432)...");
  let dbOnline = await checkTcpPort("127.0.0.1", 5432, 1000);

  if (!dbOnline) {
    appendSystemLog("[AUTONOMOUS] PostgreSQL port 5432 is down. Auto-starting Docker container ('docker compose up -d db')...");
    await runCommand("docker", ["compose", "up", "-d", "db"]);

    // Poll for up to 20 seconds
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      dbOnline = await checkTcpPort("127.0.0.1", 5432, 1000);
      if (dbOnline) break;
    }
  }

  if (dbOnline) {
    appendSystemLog("[AUTONOMOUS] PostgreSQL is online and accepting connections.");

    // Check if database needs seeding or schema push
    const checkRes = await runCommand("node", ["scripts/check-seed.mjs"]);
    if (checkRes.code !== 0) {
      appendSystemLog("[AUTONOMOUS] Synchronizing database schema with Prisma ('prisma db push')...");
      await runCommand("npx", ["prisma", "db", "push", "--skip-generate"]);

      appendSystemLog("[AUTONOMOUS] Database has no event data. Automatically seeding initial dataset ('npm run seed')...");
      await runCommand("npm", ["run", "seed"]);
      appendSystemLog("[AUTONOMOUS] Automatic database setup and seeding complete!");
    } else {
      appendSystemLog("[AUTONOMOUS] Database verified: active events found. Ready for connections.");
    }
  } else {
    appendSystemLog("[WARNING] Could not connect to PostgreSQL on 127.0.0.1:5432. Please ensure Docker is running.");
  }
}

// ─── Health Checks & Diagnostics Engine ─────────────────────────────────────
function checkTcpPort(host, port, timeout = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function checkDockerContainer() {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    let cmd = 'docker ps --filter "name=db" --format "{{.Names}} ({{.Status}})"';
    if (isWin && process.env.LOCALAPPDATA) {
      const winDockerPath = path.join(
        process.env.LOCALAPPDATA,
        "Programs",
        "DockerDesktop",
        "resources",
        "bin",
        "docker.exe"
      );
      if (fs.existsSync(winDockerPath)) {
        cmd = `"${winDockerPath}" ps --filter "name=db" --format "{{.Names}} ({{.Status}})"`;
      }
    }

    exec(cmd, { timeout: 3000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({ online: false, info: "Container stopped or Docker offline" });
      } else {
        resolve({ online: true, info: stdout.trim() });
      }
    });
  });
}

function getDiskMetrics() {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      const psCmd = `powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem | Select-Object Root, Free, Used | ConvertTo-Json"`;
      exec(psCmd, { timeout: 3500 }, (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve({ totalGb: 0, usedGb: 0, freeGb: 0, percentUsed: 0 });
          return;
        }
        try {
          let data = JSON.parse(stdout);
          if (Array.isArray(data)) data = data[0];
          const free = Number(data.Free) || 0;
          const used = Number(data.Used) || 0;
          const total = free + used;
          const totalGb = Math.round((total / (1024 * 1024 * 1024)) * 10) / 10;
          const usedGb = Math.round((used / (1024 * 1024 * 1024)) * 10) / 10;
          const freeGb = Math.round((free / (1024 * 1024 * 1024)) * 10) / 10;
          const percentUsed = total > 0 ? Math.round((used / total) * 100) : 0;
          resolve({ totalGb, usedGb, freeGb, percentUsed });
        } catch {
          resolve({ totalGb: 0, usedGb: 0, freeGb: 0, percentUsed: 0 });
        }
      });
    } else {
      exec("df -kP .", { timeout: 2500 }, (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve({ totalGb: 0, usedGb: 0, freeGb: 0, percentUsed: 0 });
          return;
        }
        try {
          const lines = stdout.trim().split("\n");
          if (lines.length > 1) {
            const parts = lines[1].trim().split(/\s+/);
            const total = parseInt(parts[1], 10) * 1024;
            const used = parseInt(parts[2], 10) * 1024;
            const free = parseInt(parts[3], 10) * 1024;
            const totalGb = Math.round((total / (1024 * 1024 * 1024)) * 10) / 10;
            const usedGb = Math.round((used / (1024 * 1024 * 1024)) * 10) / 10;
            const freeGb = Math.round((free / (1024 * 1024 * 1024)) * 10) / 10;
            const percentUsed = total > 0 ? Math.round((used / total) * 100) : 0;
            resolve({ totalGb, usedGb, freeGb, percentUsed });
            return;
          }
        } catch {
          /* fallback */
        }
        resolve({ totalGb: 0, usedGb: 0, freeGb: 0, percentUsed: 0 });
      });
    }
  });
}

async function collectDiagnostics() {
  const [dbOnline, appPortOpen, containerStatus, disk] = await Promise.all([
    checkTcpPort("127.0.0.1", 5432),
    checkTcpPort("127.0.0.1", 3000),
    checkDockerContainer(),
    getDiskMetrics(),
  ]);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsedPercent = Math.round((usedMem / totalMem) * 100);

  const errors = [];
  if (!dbOnline) {
    errors.push({ code: "ERR_DB_501", level: "critical", msg: "PostgreSQL port 5432 is offline." });
  }
  if (!containerStatus.online) {
    errors.push({ code: "ERR_DOCKER_502", level: "warning", msg: "Database Docker container is not detected." });
  }
  if (appState === "STOPPED" && !appPortOpen) {
    errors.push({ code: "ERR_APP_401", level: "info", msg: "Next.js application server is stopped." });
  }
  if (disk.percentUsed > 90) {
    errors.push({ code: "ERR_DISK_507", level: "warning", msg: "Low host disk space (>90% full)." });
  }
  if (memUsedPercent > 92) {
    errors.push({ code: "ERR_MEM_508", level: "warning", msg: "High host memory usage (>92% RAM)." });
  }

  return {
    timestamp: new Date().toISOString(),
    status: errors.filter((e) => e.level === "critical").length === 0 ? "HEALTHY" : "DEGRADED",
    errors,
    services: {
      nextjs: {
        state: appState,
        port: 3000,
        portActive: appPortOpen,
        uptimeSeconds: appStartTime ? Math.floor((Date.now() - appStartTime) / 1000) : 0,
      },
      postgres: {
        online: dbOnline,
        port: 5432,
      },
      docker: {
        online: containerStatus.online,
        info: containerStatus.info,
      },
    },
    system: {
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      uptimeSeconds: Math.floor(os.uptime()),
      cpuCount: os.cpus().length,
      loadAvg: os.loadavg().map((n) => Math.round(n * 100) / 100),
      memory: {
        totalGb: Math.round((totalMem / (1024 * 1024 * 1024)) * 10) / 10,
        usedGb: Math.round((usedMem / (1024 * 1024 * 1024)) * 10) / 10,
        freeGb: Math.round((freeMem / (1024 * 1024 * 1024)) * 10) / 10,
        percentUsed: memUsedPercent,
      },
      disk,
    },
  };
}

// ─── Authentication Helpers ─────────────────────────────────────────────────
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });
  }
  return list;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return cookies.podium_panel_session && activeSessions.has(cookies.podium_panel_session);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) req.destroy();
    });
    req.on("end", () => resolve(body));
  });
}

// ─── HTML Template Rendering ────────────────────────────────────────────────
function renderLoginPage(errorMessage = "") {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Podium Server Admin // Login</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    body { background: #070709; color: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #0d0e12; border: 1px solid #1f222e; border-radius: 16px; padding: 32px; width: 100%; max-width: 420px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
    .title { font-size: 16px; font-weight: bold; color: #fff; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; display: inline-block; }
    .subtitle { font-size: 11px; color: #6b7280; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 10px; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
    input { width: 100%; background: #000; border: 1px solid #27272a; border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 13px; font-family: inherit; }
    input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.2); }
    button { width: 100%; background: #10b981; color: #000; font-weight: bold; border: none; border-radius: 8px; padding: 12px; font-size: 12px; cursor: pointer; transition: background 0.15s; margin-top: 8px; }
    button:hover { background: #059669; }
    .error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; font-size: 11px; padding: 10px; border-radius: 8px; margin-bottom: 16px; }
    .notice { font-size: 10px; color: #6b7280; margin-top: 20px; text-align: center; border-top: 1px solid #1f222e; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title"><span class="pulse"></span> PODIUM // SERVER ADMIN</div>
    <div class="subtitle">Enter the ephemeral credentials printed in your terminal.</div>
    ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}
    <form method="POST" action="/login">
      <div class="form-group">
        <label>Username</label>
        <input type="text" name="username" required autocomplete="off" placeholder="admin_xxxxxxx" autofocus>
      </div>
      <div class="form-group">
        <label>Password (16 characters)</label>
        <input type="password" name="password" required autocomplete="off" placeholder="••••••••••••••••">
      </div>
      <button type="submit">[ AUTHENTICATE PANEL &rarr; ]</button>
    </form>
    <div class="notice">Credentials are regenerated each time the supervisor starts.</div>
  </div>
</body>
</html>`;
}

function renderDashboardPage(panelPort) {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Podium Server Operations Console</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    body { background: #070709; color: #d1d5db; min-height: 100vh; padding: 24px; }
    .container { max-width: 1300px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f222e; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: bold; color: #fff; }
    .pulse-dot { width: 9px; height: 9px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
    .top-actions { display: flex; gap: 12px; align-items: center; }
    .btn-logout { background: #1f222e; color: #9ca3af; border: 1px solid #2d3142; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; text-decoration: none; }
    .btn-logout:hover { background: #27272a; color: #fff; }
    
    /* Diagnostics Error Codes Bar */
    .diag-banner { background: #0d0e12; border: 1px solid #1f222e; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .diag-title { font-size: 11px; font-weight: bold; color: #9ca3af; text-transform: uppercase; }
    .diag-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .tag { font-size: 10px; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
    .tag-healthy { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
    .tag-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
    .tag-critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

    /* Grid cards */
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 18px; margin-bottom: 24px; }
    .card { background: #0d0e12; border: 1px solid #1f222e; border-radius: 12px; padding: 18px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #16171d; padding-bottom: 10px; }
    .card-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #9ca3af; }
    .status-badge { font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
    .status-online { background: #064e3b; color: #34d399; }
    .status-offline { background: #7f1d1d; color: #f87171; }
    .status-starting { background: #78350f; color: #fbbf24; }

    .btn-group { display: flex; gap: 8px; margin-top: 14px; }
    .btn { padding: 8px 14px; font-size: 11px; font-weight: bold; border-radius: 6px; border: none; cursor: pointer; transition: 0.15s; font-family: inherit; }
    .btn-start { background: #10b981; color: #000; }
    .btn-start:hover { background: #059669; }
    .btn-stop { background: #ef4444; color: #fff; }
    .btn-stop:hover { background: #dc2626; }
    .btn-restart { background: #3b82f6; color: #fff; }
    .btn-restart:hover { background: #2563eb; }

    .metric-row { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid #121318; }
    .metric-label { color: #6b7280; }
    .metric-val { color: #fff; font-weight: 500; }

    /* Progress bar */
    .bar-bg { width: 100%; height: 6px; background: #1c1d24; border-radius: 3px; overflow: hidden; margin-top: 6px; }
    .bar-fill { height: 100%; background: #10b981; transition: width 0.3s; }

    /* Terminal Console */
    .console-card { background: #0d0e12; border: 1px solid #1f222e; border-radius: 12px; overflow: hidden; }
    .console-header { display: flex; justify-content: space-between; align-items: center; background: #13151b; padding: 12px 18px; border-bottom: 1px solid #1f222e; }
    .console-actions { display: flex; gap: 10px; align-items: center; }
    .console-input { background: #000; border: 1px solid #27272a; color: #fff; font-size: 11px; padding: 4px 8px; border-radius: 4px; font-family: inherit; }
    .btn-sm { background: #1c1d24; color: #9ca3af; border: 1px solid #27272a; padding: 4px 8px; font-size: 10px; border-radius: 4px; cursor: pointer; }
    .btn-sm:hover { color: #fff; background: #27272a; }
    #logBox { height: 420px; overflow-y: auto; background: #050507; padding: 14px 18px; font-size: 11px; line-height: 1.6; color: #9ca3af; scroll-behavior: smooth; }
    .log-line { white-space: pre-wrap; word-break: break-all; }
    .log-time { color: #4b5563; margin-right: 8px; user-select: none; }
    .log-sys { color: #38bdf8; font-weight: bold; }
    .log-err { color: #f87171; }

    /* Navigation Tabs */
    .nav-tab { background: #181920; color: #9ca3af; border: 1px solid #27272a; font-weight: bold; font-size: 11px; padding: 8px 18px; border-radius: 6px; cursor: pointer; transition: 0.15s; font-family: inherit; }
    .nav-tab:hover { color: #fff; background: #22242e; }
    .nav-tab.active { background: #10b981; color: #000; border-color: #10b981; }
    .ext-link { background: #13151c; color: #93c5fd; border: 1px solid #1e293b; padding: 6px 12px; border-radius: 6px; font-size: 11px; text-decoration: none; font-weight: 500; }
    .ext-link:hover { background: #1e293b; color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <span class="pulse-dot"></span>
        <span>PODIUM // OPERATIONS SUPERVISOR</span>
        <span style="font-size: 11px; color: #6b7280; font-weight: normal;">(Port: ${panelPort})</span>
      </div>
      <div class="top-actions">
        <a href="http://localhost:3000" target="_blank" class="btn-logout" style="color: #34d399;">Launch App (3000) &nearr;</a>
        <a href="/logout" class="btn-logout">Sign Out</a>
      </div>
    </header>

    <!-- Top-Level Navigation Tabs -->
    <div class="nav-tabs" style="display: flex; gap: 10px; margin-bottom: 24px; border-bottom: 1px solid #1f222e; padding-bottom: 14px; align-items: center; flex-wrap: wrap;">
      <button class="nav-tab active" id="tabOps" onclick="switchNavTab('ops')">🖥️ SYSTEM & OPERATIONS</button>
      <button class="nav-tab" id="tabUsers" onclick="switchNavTab('users')">👥 PODIUM USERS & ROLES</button>
      <div style="flex-grow: 1;"></div>
      <a href="http://localhost:3000/admin/hackday-26/users" target="_blank" class="ext-link">👥 Next.js User Panel &nearr;</a>
      <a href="http://localhost:3000/admin/hackday-26" target="_blank" class="ext-link">🏆 Event Organizer Panel &nearr;</a>
    </div>

    <!-- Operations View -->
    <div id="viewOps">
      <!-- Diagnostics Banner -->
      <div class="diag-banner">
        <div>
          <div class="diag-title">SYSTEM HEALTH & DIAGNOSTIC CODES</div>
          <div id="diagSubtitle" style="font-size: 11px; color: #6b7280; margin-top: 2px;">Evaluating live metrics...</div>
        </div>
        <div class="diag-tags" id="diagTags">
          <span class="tag tag-healthy">CODE_200 // INITIALIZING</span>
        </div>
      </div>

      <!-- Metrics & Services Grid -->
      <div class="grid">
        <!-- App Server Service -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Next.js App Server</span>
            <span class="status-badge" id="appStatus">CHECKING</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Target Port</span>
            <span class="metric-val">http://localhost:3000</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Execution Mode</span>
            <span class="metric-val">next dev --turbo</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Uptime</span>
            <span class="metric-val" id="appUptime">--</span>
          </div>
          <div class="btn-group">
            <button class="btn btn-start" onclick="controlServer('start')">START</button>
            <button class="btn btn-restart" onclick="controlServer('restart')">RESTART</button>
            <button class="btn btn-stop" onclick="controlServer('stop')">STOP</button>
          </div>
        </div>

        <!-- Database & Container -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Database & Container</span>
            <span class="status-badge" id="dbStatus">CHECKING</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">PostgreSQL Socket</span>
            <span class="metric-val" id="dbPortVal">127.0.0.1:5432</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Docker Container</span>
            <span class="metric-val" id="dockerStatus">CHECKING</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Container Info</span>
            <span class="metric-val" id="dockerInfo" style="font-size: 10px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">--</span>
          </div>
          <div class="btn-group" style="margin-top: 10px;">
            <button class="btn btn-start" onclick="dbAction('start')">START DB</button>
            <button class="btn btn-restart" onclick="dbAction('seed')">SEED DEMO DATA</button>
          </div>
        </div>

        <!-- Host Storage & Telemetry -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Host Resources & Storage</span>
            <span class="status-badge status-online">TELEMETRY</span>
          </div>
          <div>
            <div class="metric-row" style="border: none;">
              <span class="metric-label">Disk Used</span>
              <span class="metric-val" id="diskText">-- GB / -- GB</span>
            </div>
            <div class="bar-bg"><div class="bar-fill" id="diskBar" style="width: 0%;"></div></div>
          </div>
          <div style="margin-top: 10px;">
            <div class="metric-row" style="border: none;">
              <span class="metric-label">RAM Usage</span>
              <span class="metric-val" id="ramText">-- GB / -- GB</span>
            </div>
            <div class="bar-bg"><div class="bar-fill" id="ramBar" style="width: 0%; background: #38bdf8;"></div></div>
          </div>
          <div class="metric-row" style="margin-top: 10px;">
            <span class="metric-label">CPU Cores / Load</span>
            <span class="metric-val" id="cpuText">--</span>
          </div>
        </div>
      </div>

      <!-- Live Console -->
      <div class="console-card">
        <div class="console-header">
          <div style="font-size: 11px; font-weight: bold; color: #fff;">LIVE SERVER LOGS & TERMINAL STREAM</div>
          <div class="console-actions">
            <input type="text" id="filterInput" class="console-input" placeholder="Filter logs..." oninput="filterLogs()">
            <button class="btn-sm" id="btnAutoScroll" onclick="toggleAutoScroll()">Auto-Scroll: ON</button>
            <button class="btn-sm" onclick="clearLogs()">Clear</button>
          </div>
        </div>
        <div id="logBox"></div>
      </div>
    </div>

    <!-- Podium Users View -->
    <div id="viewUsers" style="display: none;">
      <!-- Stats bar -->
      <div style="display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap;">
        <div class="card" style="flex: 1; min-width: 180px; padding: 14px;">
          <div style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold;">Total Users</div>
          <div style="font-size: 24px; font-weight: bold; color: #fff; margin-top: 4px;" id="statTotalUsers">0</div>
        </div>
        <div class="card" style="flex: 1; min-width: 180px; padding: 14px;">
          <div style="font-size: 10px; color: #a78bfa; text-transform: uppercase; font-weight: bold;">Podium Admins / Organizers</div>
          <div style="font-size: 24px; font-weight: bold; color: #a78bfa; margin-top: 4px;" id="statOrganizers">0</div>
        </div>
        <div class="card" style="flex: 1; min-width: 180px; padding: 14px;">
          <div style="font-size: 10px; color: #f59e0b; text-transform: uppercase; font-weight: bold;">Judges / Evaluators</div>
          <div style="font-size: 24px; font-weight: bold; color: #f59e0b; margin-top: 4px;" id="statJudges">0</div>
        </div>
        <div class="card" style="flex: 1; min-width: 180px; padding: 14px;">
          <div style="font-size: 10px; color: #06b6d4; text-transform: uppercase; font-weight: bold;">Registrants / Participants</div>
          <div style="font-size: 24px; font-weight: bold; color: #06b6d4; margin-top: 4px;" id="statRegistrants">0</div>
        </div>
      </div>

      <!-- Action & Filter Bar -->
      <div class="card" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
        <div style="display: flex; gap: 10px; align-items: center; flex: 1; min-width: 280px;">
          <input type="text" id="userSearchInput" class="console-input" style="flex: 1; padding: 8px 12px; font-size: 12px;" placeholder="Search users by name or email..." oninput="filterUsersTable()">
          <select id="userRoleFilter" class="console-input" style="padding: 8px 12px; font-size: 12px; cursor: pointer;" onchange="filterUsersTable()">
            <option value="ALL">All Roles</option>
            <option value="ORGANIZER">Admins / Organizers</option>
            <option value="JUDGE">Judges</option>
            <option value="REGISTRANT">Registrants</option>
          </select>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-restart" style="padding: 8px 14px;" onclick="loadUsersTable()">↻ Refresh</button>
          <button class="btn btn-start" style="padding: 8px 14px;" onclick="openAddUserModal()">+ Assign User Role</button>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="card" style="overflow-x: auto; padding: 0;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 1px solid #1f222e; background: #13151b; color: #9ca3af; text-transform: uppercase; font-size: 10px;">
              <th style="padding: 12px 16px;">User</th>
              <th style="padding: 12px 16px;">Assigned Roles & Events</th>
              <th style="padding: 12px 16px;">Created</th>
              <th style="padding: 12px 16px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <tr>
              <td colspan="4" style="padding: 24px; text-align: center; color: #6b7280;">Loading users...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add User Modal -->
    <div id="addUserModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center;">
      <div class="card" style="max-width: 440px; width: 90%; background: #0e1017; border: 1px solid #2d3142; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #1f222e; padding-bottom: 10px;">
          <div style="font-size: 13px; font-weight: bold; color: #fff;">Assign Podium User Role</div>
          <button onclick="closeAddUserModal()" style="background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer;">&times;</button>
        </div>
        <form onsubmit="submitAddUserRole(event)" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 4px;">User Email *</label>
            <input type="email" id="modalEmail" required placeholder="user@podium.test" class="console-input" style="width: 100%; padding: 8px 10px;">
          </div>
          <div>
            <label style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 4px;">Display Name (Optional)</label>
            <input type="text" id="modalName" placeholder="Ada Lovelace" class="console-input" style="width: 100%; padding: 8px 10px;">
          </div>
          <div>
            <label style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 4px;">Target Role *</label>
            <select id="modalRole" required class="console-input" style="width: 100%; padding: 8px 10px;">
              <option value="ORGANIZER">Podium Admin / Organizer</option>
              <option value="JUDGE">Judge / Evaluator</option>
              <option value="REGISTRANT">Registrant / Participant</option>
            </select>
          </div>
          <div>
            <label style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 4px;">Event Slug *</label>
            <input type="text" id="modalSlug" required value="hackday-26" class="console-input" style="width: 100%; padding: 8px 10px;">
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" onclick="closeAddUserModal()" class="btn btn-stop" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn-start" style="flex: 1;">Assign Role</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script>
    let autoScroll = true;
    let rawLogs = [];

    function toggleAutoScroll() {
      autoScroll = !autoScroll;
      document.getElementById('btnAutoScroll').innerText = 'Auto-Scroll: ' + (autoScroll ? 'ON' : 'OFF');
    }

    function clearLogs() {
      rawLogs = [];
      document.getElementById('logBox').innerHTML = '';
    }

    function appendLog(entry) {
      rawLogs.push(entry);
      if (rawLogs.length > 2000) rawLogs.shift();
      const filter = document.getElementById('filterInput').value.toLowerCase();
      if (!filter || entry.text.toLowerCase().includes(filter)) {
        renderLine(entry);
      }
    }

    function renderLine(entry) {
      const box = document.getElementById('logBox');
      const div = document.createElement('div');
      div.className = 'log-line';
      let cls = '';
      if (entry.text.includes('[SYSTEM]')) cls = 'log-sys';
      if (entry.text.includes('Error') || entry.text.includes('ERR') || entry.text.includes('[STDERR]')) cls = 'log-err';
      div.innerHTML = '<span class="log-time">' + entry.time + '</span><span class="' + cls + '">' + escapeHtml(entry.text) + '</span>';
      box.appendChild(div);
      if (autoScroll) box.scrollTop = box.scrollHeight;
    }

    function filterLogs() {
      const box = document.getElementById('logBox');
      box.innerHTML = '';
      const filter = document.getElementById('filterInput').value.toLowerCase();
      for (const entry of rawLogs) {
        if (!filter || entry.text.toLowerCase().includes(filter)) {
          renderLine(entry);
        }
      }
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Server-Sent Events setup
    const evtSource = new EventSource('/api/logs/stream');
    evtSource.onmessage = function(e) {
      try {
        const entry = JSON.parse(e.data);
        appendLog(entry);
      } catch {}
    };

    // Diagnostics Polling
    async function refreshDiagnostics() {
      try {
        const res = await fetch('/api/diagnostics');
        const data = await res.json();
        
        // App State
        const appBadge = document.getElementById('appStatus');
        appBadge.innerText = data.services.nextjs.state;
        appBadge.className = 'status-badge ' + (data.services.nextjs.state === 'RUNNING' ? 'status-online' : (data.services.nextjs.state === 'STARTING' ? 'status-starting' : 'status-offline'));
        document.getElementById('appUptime').innerText = data.services.nextjs.uptimeSeconds > 0 ? (data.services.nextjs.uptimeSeconds + 's') : '--';

        // DB State
        const dbBadge = document.getElementById('dbStatus');
        dbBadge.innerText = data.services.postgres.online ? 'ONLINE' : 'OFFLINE';
        dbBadge.className = 'status-badge ' + (data.services.postgres.online ? 'status-online' : 'status-offline');

        // Docker
        const dockerBadge = document.getElementById('dockerStatus');
        dockerBadge.innerText = data.services.docker.online ? 'ONLINE' : 'STOPPED';
        dockerBadge.className = 'status-badge ' + (data.services.docker.online ? 'status-online' : 'status-offline');
        document.getElementById('dockerInfo').innerText = data.services.docker.info;

        // Disk & RAM
        document.getElementById('diskText').innerText = data.system.disk.usedGb + ' GB / ' + data.system.disk.totalGb + ' GB (' + data.system.disk.percentUsed + '%)';
        document.getElementById('diskBar').style.width = data.system.disk.percentUsed + '%';
        if (data.system.disk.percentUsed > 85) document.getElementById('diskBar').style.background = '#ef4444';

        document.getElementById('ramText').innerText = data.system.memory.usedGb + ' GB / ' + data.system.memory.totalGb + ' GB (' + data.system.memory.percentUsed + '%)';
        document.getElementById('ramBar').style.width = data.system.memory.percentUsed + '%';

        document.getElementById('cpuText').innerText = data.system.cpuCount + ' Cores | Load: ' + data.system.loadAvg.join(', ');

        // Diag Banner
        const tagsContainer = document.getElementById('diagTags');
        tagsContainer.innerHTML = '';
        if (data.errors.length === 0) {
          tagsContainer.innerHTML = '<span class="tag tag-healthy">CODE_200 // ALL SYSTEMS OPERATIONAL</span>';
          document.getElementById('diagSubtitle').innerText = 'All services online and telemetry within safe thresholds.';
        } else {
          document.getElementById('diagSubtitle').innerText = data.errors.length + ' active operational notification(s) detected:';
          data.errors.forEach(err => {
            const span = document.createElement('span');
            span.className = 'tag ' + (err.level === 'critical' ? 'tag-critical' : 'tag-warning');
            span.innerText = err.code + ': ' + err.msg;
            tagsContainer.appendChild(span);
          });
        }
      } catch (e) {
        console.error('Diag poll failed', e);
      }
    }

    async function controlServer(action) {
      try {
        await fetch('/api/server/' + action, { method: 'POST' });
        setTimeout(refreshDiagnostics, 500);
      } catch (e) {
        alert('Action failed: ' + e.message);
      }
    }

    async function dbAction(action) {
      try {
        const btn = event.target;
        const oldText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'WORKING...';
        const res = await fetch('/api/db/' + action, { method: 'POST' });
        const data = await res.json();
        btn.disabled = false;
        btn.innerText = oldText;
        alert(data.message || 'Operation completed.');
        setTimeout(refreshDiagnostics, 500);
      } catch (err) {
        alert('Database action failed: ' + err.message);
      }
    }

    // Tab Switching & User Management Panel
    let cachedUsers = [];

    function switchNavTab(tab) {
      const isOps = tab === 'ops';
      document.getElementById('viewOps').style.display = isOps ? 'block' : 'none';
      document.getElementById('viewUsers').style.display = isOps ? 'none' : 'block';
      document.getElementById('tabOps').className = 'nav-tab ' + (isOps ? 'active' : '');
      document.getElementById('tabUsers').className = 'nav-tab ' + (isOps ? '' : 'active');
      if (!isOps) {
        loadUsersTable();
      }
    }

    async function loadUsersTable() {
      try {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #6b7280;">Loading users...</td></tr>';
        const res = await fetch('/api/users');
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Failed to load users');
        cachedUsers = data.users || [];
        updateUserStats();
        renderUsersTable(cachedUsers);
      } catch (err) {
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #ef4444;">Error: ' + err.message + '</td></tr>';
      }
    }

    function updateUserStats() {
      document.getElementById('statTotalUsers').innerText = cachedUsers.length;
      let orgCount = 0;
      let judgeCount = 0;
      let regCount = 0;
      cachedUsers.forEach(u => {
        u.roles.forEach(r => {
          if (r.role === 'ORGANIZER') orgCount++;
          if (r.role === 'JUDGE') judgeCount++;
          if (r.role === 'REGISTRANT') regCount++;
        });
      });
      document.getElementById('statOrganizers').innerText = orgCount;
      document.getElementById('statJudges').innerText = judgeCount;
      document.getElementById('statRegistrants').innerText = regCount;
    }

    function filterUsersTable() {
      const q = (document.getElementById('userSearchInput').value || '').toLowerCase().trim();
      const roleFilter = document.getElementById('userRoleFilter').value;
      const filtered = cachedUsers.filter(u => {
        const matchText = (u.name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRole = roleFilter === 'ALL' || u.roles.some(r => r.role === roleFilter);
        return matchText && matchRole;
      });
      renderUsersTable(filtered);
    }

    function renderUsersTable(users) {
      const tbody = document.getElementById('usersTableBody');
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #6b7280;">No users match your criteria.</td></tr>';
        return;
      }
      tbody.innerHTML = users.map(u => {
        const rolesHtml = u.roles.length === 0
          ? '<span style="color: #6b7280; font-size: 11px;">No active roles</span>'
          : u.roles.map(r => {
              let badgeStyle = 'background: #064e3b; color: #34d399;';
              let roleName = r.role;
              if (r.role === 'ORGANIZER') {
                badgeStyle = 'background: #3b2d60; color: #c4b5fd; border: 1px solid #5b21b6;';
                roleName = 'ADMIN / ORGANIZER';
              } else if (r.role === 'JUDGE') {
                badgeStyle = 'background: #451a03; color: #fde68a; border: 1px solid #b45309;';
                roleName = 'JUDGE';
              } else if (r.role === 'REGISTRANT') {
                badgeStyle = 'background: #164e63; color: #a5f3fc; border: 1px solid #0891b2;';
                roleName = 'REGISTRANT';
              }
              return '<span style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin: 2px; ' + badgeStyle + '">' +
                roleName + ' (' + r.slug + ') ' +
                '<button onclick="removeUserRole(\'' + u.id + '\', \'' + r.role + '\', \'' + r.slug + '\')" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 12px; margin-left: 4px; line-height: 1;" title="Revoke role">&times;</button>' +
              '</span>';
            }).join('');

        const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '--';
        const displayName = u.name || u.email.split('@')[0];
        return '<tr style="border-bottom: 1px solid #16171d;">' +
          '<td style="padding: 12px 16px;">' +
            '<div style="font-weight: bold; color: #fff;">' + displayName + '</div>' +
            '<div style="font-size: 11px; color: #6b7280;">' + u.email + '</div>' +
          '</td>' +
          '<td style="padding: 12px 16px;">' + rolesHtml + '</td>' +
          '<td style="padding: 12px 16px; color: #6b7280; font-size: 11px;">' + dateStr + '</td>' +
          '<td style="padding: 12px 16px; text-align: right;">' +
            '<a href="http://localhost:3000/admin/hackday-26/users" target="_blank" style="font-size: 11px; color: #38bdf8; text-decoration: none;">View in Next.js &nearr;</a>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    function openAddUserModal() {
      document.getElementById('addUserModal').style.display = 'flex';
    }

    function closeAddUserModal() {
      document.getElementById('addUserModal').style.display = 'none';
    }

    async function submitAddUserRole(e) {
      e.preventDefault();
      const email = document.getElementById('modalEmail').value.trim();
      const name = document.getElementById('modalName').value.trim();
      const role = document.getElementById('modalRole').value;
      const slug = document.getElementById('modalSlug').value.trim();
      if (!email || !role || !slug) return;

      try {
        const res = await fetch('/api/users/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, role, slug }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Failed to add role');
        closeAddUserModal();
        alert(data.message);
        loadUsersTable();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function removeUserRole(userId, role, slug) {
      if (!confirm('Are you sure you want to revoke the ' + role + ' role from this user on ' + slug + '?')) return;
      try {
        const res = await fetch('/api/users/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role, slug }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Failed to remove role');
        alert(data.message);
        loadUsersTable();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    setInterval(refreshDiagnostics, 2500);
    refreshDiagnostics();
  </script>
</body>
</html>`;
}

// ─── Dynamic Port Allocation ────────────────────────────────────────────────
function findAvailablePort(startPort, maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    function tryNext() {
      if (attempts >= maxAttempts) {
        return reject(new Error(`Unable to find an available port starting from ${startPort}`));
      }

      const server = net.createServer();
      server.unref();

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE" || err.code === "EACCES") {
          attempts++;
          currentPort++;
          tryNext();
        } else {
          reject(err);
        }
      });

      server.listen(currentPort, "0.0.0.0", () => {
        server.close(() => {
          resolve(currentPort);
        });
      });
    }

    tryNext();
  });
}

// ─── Supervisor HTTP Server ─────────────────────────────────────────────────
async function bootstrap() {
  const panelPort = await findAvailablePort(3001);

  const server = http.createServer(async (req, res) => {
    const ip = req.socket.remoteAddress || "127.0.0.1";
    const url = new URL(req.url, `http://localhost:${panelPort}`);
    const pathname = url.pathname;

    // Static / Unauthenticated routes
    if (pathname === "/login" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderLoginPage());
      return;
    }

    if (pathname === "/login" && req.method === "POST") {
      // Brute-force rate limiting check
      const attempt = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
      if (attempt.lockedUntil > Date.now()) {
        const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
        res.writeHead(429, { "Content-Type": "text/html" });
        res.end(renderLoginPage(`Rate limit exceeded. Try again in ${remaining}s.`));
        return;
      }

      const bodyText = await parseBody(req);
      const params = new URLSearchParams(bodyText);
      const user = params.get("username") || "";
      const pass = params.get("password") || "";

      const userMatches = user.trim() === ADMIN_USER;
      const passMatches = pass.trim() === ADMIN_PASS;

      if (userMatches && passMatches) {
        failedAttempts.delete(ip);
        const sessionToken = crypto.randomBytes(32).toString("hex");
        activeSessions.add(sessionToken);

        res.writeHead(302, {
          "Set-Cookie": `podium_panel_session=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`,
          Location: "/",
        });
        res.end();
        return;
      } else {
        attempt.count = (attempt.count || 0) + 1;
        if (attempt.count >= 5) {
          attempt.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 min lockout
        }
        failedAttempts.set(ip, attempt);
        res.writeHead(401, { "Content-Type": "text/html" });
        res.end(renderLoginPage("Invalid username or password. Check terminal output."));
        return;
      }
    }

    if (pathname === "/logout") {
      const cookies = parseCookies(req);
      if (cookies.podium_panel_session) {
        activeSessions.delete(cookies.podium_panel_session);
      }
      res.writeHead(302, {
        "Set-Cookie": `podium_panel_session=; HttpOnly; Max-Age=0; Path=/`,
        Location: "/login",
      });
      res.end();
      return;
    }

    // Require Auth for all other routes
    if (!isAuthenticated(req)) {
      res.writeHead(302, { Location: "/login" });
      res.end();
      return;
    }

    // Dashboard Home
    if (pathname === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderDashboardPage(panelPort));
      return;
    }

    // Server-Sent Events Log Streaming
    if (pathname === "/api/logs/stream") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      // Send last 100 buffered logs immediately upon connection
      const initialLogs = logBuffer.slice(-100);
      for (const entry of initialLogs) {
        res.write(`data: ${JSON.stringify(entry)}\n\n`);
      }

      sseClients.add(res);
      req.on("close", () => sseClients.delete(res));
      return;
    }

    // Diagnostics JSON API
    if (pathname === "/api/diagnostics") {
      const diag = await collectDiagnostics();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(diag));
      return;
    }

    // Process Actions API
    if (pathname === "/api/server/start" && req.method === "POST") {
      const result = startNextServer();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    if (pathname === "/api/server/stop" && req.method === "POST") {
      const result = stopNextServer();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    if (pathname === "/api/server/restart" && req.method === "POST") {
      const result = restartNextServer();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    // Database Actions API
    if (pathname === "/api/db/start" && req.method === "POST") {
      appendSystemLog("Received request to start database container...");
      await runCommand("docker", ["compose", "up", "-d", "db"]);
      let dbOnline = false;
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        dbOnline = await checkTcpPort("127.0.0.1", 5432, 1000);
        if (dbOnline) break;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: dbOnline, message: dbOnline ? "Database online!" : "Database failed to start." }));
      return;
    }

    if (pathname === "/api/db/seed" && req.method === "POST") {
      appendSystemLog("Received request to re-seed database...");
      const resSeed = await runCommand("npm", ["run", "seed"]);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: resSeed.code === 0,
          message: resSeed.code === 0 ? "Database seeded successfully!" : "Seeding failed.",
        })
      );
      return;
    }

    // Users Management API
    if (pathname === "/api/users" && req.method === "GET") {
      try {
        const users = await getUsersList();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, users }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    if (pathname === "/api/users/add" && req.method === "POST") {
      try {
        const bodyText = await parseBody(req);
        const data = JSON.parse(bodyText);
        if (!data.email || !data.role || !data.slug) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Missing required fields." }));
          return;
        }
        const result = await addUserRole(data.email, data.role, data.slug, data.name);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    if (pathname === "/api/users/remove" && req.method === "POST") {
      try {
        const bodyText = await parseBody(req);
        const data = JSON.parse(bodyText);
        if (!data.userId || !data.role || !data.slug) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Missing required fields." }));
          return;
        }
        const result = await removeUserRole(data.userId, data.role, data.slug);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(panelPort, "0.0.0.0", async () => {
    const banner = `
================================================================================
  PODIUM // LINUX & WINDOWS ADMIN OPERATIONS PANEL
================================================================================
  Web Panel URL:  http://localhost:${panelPort}
  Admin Username: ${ADMIN_USER}
  Admin Password: ${ADMIN_PASS}
--------------------------------------------------------------------------------
  Logs are streamed above and retained in this terminal console.
  Open the URL in your browser to start, stop, or monitor the Next.js server.
================================================================================
`;
    console.log(banner);
    appendSystemLog(`Supervisor initialized. Admin Web Panel listening on http://localhost:${panelPort}`);

    // Autonomous Database & Seed Initialization
    await ensureDatabaseAndData();

    // Auto-boot Next.js app server initially
    startNextServer();
  });
}

bootstrap().catch((err) => {
  console.error("[CRITICAL] Failed to initialize supervisor:", err);
  process.exit(1);
});
