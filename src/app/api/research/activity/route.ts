import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { ResearchActivity } from "@/types/research";

const DATA_DIR = path.join(process.cwd(), "data");
const RESEARCH_DIR = path.join(DATA_DIR, "research");

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, activity } = await request.json();

    if (!sessionId || !activity) {
      return NextResponse.json({ error: "Missing sessionId or activity" }, { status: 400 });
    }

    await ensureDir(RESEARCH_DIR);
    
    const sessionDir = path.join(RESEARCH_DIR, sessionId);
    await ensureDir(sessionDir);
    
    const activitiesFile = path.join(sessionDir, "activities.json");
    
    // Read existing activities or create new array
    let activities = [];
    try {
      const existingData = await fs.readFile(activitiesFile, "utf8");
      activities = JSON.parse(existingData);
    } catch {
      // File doesn't exist, start with empty array
    }
    
    // Add new activity
    activities.push(activity);
    
    // Save updated activities
    await fs.writeFile(activitiesFile, JSON.stringify(activities, null, 2), "utf8");
    
    return NextResponse.json({ success: true, activityId: activity.id });
  } catch (error) {
    console.error("Error logging research activity:", error);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }
    
    const sessionDir = path.join(RESEARCH_DIR, sessionId);
    const activitiesFile = path.join(sessionDir, "activities.json");
    
    try {
      const activitiesData = await fs.readFile(activitiesFile, "utf8");
      const activities = JSON.parse(activitiesData);
      return NextResponse.json({ activities });
    } catch {
      return NextResponse.json({ activities: [] });
    }
  } catch (error) {
    console.error("Error fetching research activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
