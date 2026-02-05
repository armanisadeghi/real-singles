import { NextResponse } from "next/server";

/**
 * PERFORMANCE STANDARDS IMPLEMENTATION
 * See /PERFORMANCE-STANDARDS.md for full requirements
 *
 * Edge runtime for lowest latency health checks
 * No revalidation needed - health is real-time
 */
export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "realsingles-api",
  });
}
