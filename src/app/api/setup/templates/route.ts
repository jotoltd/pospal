import { NextResponse } from "next/server";
import { takeawayTemplates } from "@/lib/templates";

export async function GET() {
  const summaries = takeawayTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    description: t.description,
    category_count: t.categories.length,
    item_count: t.categories.reduce((sum, c) => sum + c.items.length, 0),
  }));
  return NextResponse.json(summaries);
}
