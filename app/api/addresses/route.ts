import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("Missing API_BASE_URL environment variable");
}
// Achievement levels mapping
const ACHIEVEMENTS = {
  10: { name: "Cedomis Bronze NFT" },
  25: { name: "Cedomis Silver NFT" },
  50: { name: "Cedomis Gold NFT" },
  80: { name: "Cedomis Diamond NFT" },
  100: { name: "Cedomis Legendary NFT" },
};

// POST - Submit a new wallet address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, nftLevel } = body;

    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.ip || null;

    const nftName = ACHIEVEMENTS[nftLevel as keyof typeof ACHIEVEMENTS].name;
    const bodyData = {
      wallet_address: walletAddress,
      nft_level: nftLevel,
      nft_name: nftName,
      ip_address: ipAddress,
    };
    console.log("Submitting address with data:", bodyData);

    const response = await fetch(`${API_BASE_URL}/user/games/puzzle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(errorData ?? { message: "Failed to submit address" }, {
        status: response.status,
      });
    }

    const result = await response.json();

    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.log(" Error submitting address:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    );
  }
}
