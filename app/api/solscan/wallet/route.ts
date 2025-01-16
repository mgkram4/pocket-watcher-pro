import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://public-api.solscan.io/account/transactions?account=${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'token': process.env.SOLSCAN_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Solscan API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
} 