import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { ResearchSession, ResearchSessionSummary } from "@/types/research";

const DATA_DIR = path.join(process.cwd(), "data");
const RESEARCH_DIR = path.join(DATA_DIR, "research");

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    if (!sessionData.id || !sessionData.startTime) {
      return NextResponse.json({ error: "Missing required session data" }, { status: 400 });
    }

    await ensureDir(RESEARCH_DIR);
    
    const sessionDir = path.join(RESEARCH_DIR, sessionData.id);
    await ensureDir(sessionDir);
    
    // Save session metadata
    const sessionFile = path.join(sessionDir, "session.json");
    await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2), "utf8");
    
    // Update sessions index
    const indexFile = path.join(RESEARCH_DIR, "sessions.json");
    let sessions = [];
    try {
      const existingData = await fs.readFile(indexFile, "utf8");
      sessions = JSON.parse(existingData);
    } catch {
      // File doesn't exist, start with empty array
    }
    
    // Add or update session in index
    const existingIndex = sessions.findIndex(s => s.id === sessionData.id);
    const sessionSummary = {
      id: sessionData.id,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      totalSearches: sessionData.totalSearches || 0,
      totalClicks: sessionData.totalClicks || 0,
      totalTimeSpent: sessionData.totalTimeSpent || 0,
      activityCount: sessionData.activities?.length || 0,
    };
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionSummary;
    } else {
      sessions.push(sessionSummary);
    }
    
    // Sort by start time (newest first)
    sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    await fs.writeFile(indexFile, JSON.stringify(sessions, null, 2), "utf8");
    
    return NextResponse.json({ success: true, sessionId: sessionData.id });
  } catch (error) {
    console.error("Error saving research session:", error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    
    if (sessionId) {
      // Get specific session
      const sessionDir = path.join(RESEARCH_DIR, sessionId);
      const sessionFile = path.join(sessionDir, "session.json");
      
      try {
        const sessionData = await fs.readFile(sessionFile, "utf8");
        const session = JSON.parse(sessionData);
        
        // Also get activities
        const activitiesFile = path.join(sessionDir, "activities.json");
        let activities = [];
        try {
          const activitiesData = await fs.readFile(activitiesFile, "utf8");
          activities = JSON.parse(activitiesData);
        } catch {
          // No activities file
        }
        
        return NextResponse.json({ session: { ...session, activities } });
      } catch {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
    } else {
      // Get all sessions
      const indexFile = path.join(RESEARCH_DIR, "sessions.json");
      
      try {
        const sessionsData = await fs.readFile(indexFile, "utf8");
        const sessions = JSON.parse(sessionsData);
        return NextResponse.json({ sessions });
      } catch {
        return NextResponse.json({ sessions: [] });
      }
    }
  } catch (error) {
    console.error("Error fetching research sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
