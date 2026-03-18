import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { license_key } = await req.json();
    if (!license_key) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const data = await redis.get<any>(`license:${license_key}`);
    
    if (data && data.status === 'active') {
      return NextResponse.json({ valid: true, data });
    }

    return NextResponse.json({ valid: false });
  } catch (err) {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
