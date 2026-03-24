import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "about-config.json");

interface AboutConfig {
  teamPhoto: string;
}

function getConfig(): AboutConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }
  return { teamPhoto: "" };
}

function saveConfig(config: AboutConfig) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function GET() {
  return NextResponse.json({ success: true, config: getConfig() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = getConfig();
    if (body.teamPhoto !== undefined) config.teamPhoto = body.teamPhoto;
    saveConfig(config);
    return NextResponse.json({ success: true, config });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 400 },
    );
  }
}
