import { NextRequest, NextResponse } from "next/server";
import { getGuruClient, GuruClient } from "@/lib/integrations/guru";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

// GET /api/guru/cards - Get Guru cards
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);

  const credentials = await getApiKey(context.tenantId, context.user.id, "guru");
  const client = credentials ? new GuruClient(credentials) : (process.env.DEMO_MODE === "true" ? getGuruClient() : null);
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Guru not connected. Connect via Settings page." },
      { status: 400 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const collectionId = searchParams.get("collection") || undefined;
    
    let cards;
    if (collectionId) {
      // Get cards from a specific collection - use search with collection filter
      // The /collections/:id/cards endpoint returns 404, so we use search
      const allCards = await client.getAllCards();
      cards = allCards.filter(c => c.collection?.id === collectionId);
    } else if (query) {
      // Search cards
      cards = await client.searchCards(query);
    } else {
      // Get all cards
      cards = await client.getAllCards();
    }
    
    // Normalize card data to consistent shape
    const normalizedCards = cards.map(card => ({
      id: card.id,
      title: card.preferredPhrase,
      content: card.content,
      collection: card.collection,
      updatedAt: card.lastModified,
      createdAt: card.dateCreated,
      verificationState: card.verificationState,
      owner: card.owner,
      tags: card.tags,
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: normalizedCards,
      count: normalizedCards.length,
    });
  } catch (error) {
    console.error("Guru cards error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch Guru cards" 
      },
      { status: 500 }
    );
  }
}
