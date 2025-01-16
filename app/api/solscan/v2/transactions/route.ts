import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const limit = searchParams.get('limit') || '10';
  const before = searchParams.get('before');

  if (!address) {
    return NextResponse.json(
      { success: false, errors: { message: 'Address is required' } },
      { status: 400 }
    );
  }

  const url = new URL('https://pro-api.solscan.io/v2.0/account/transactions');
  url.searchParams.set('address', address);
  url.searchParams.set('limit', limit);
  if (before) url.searchParams.set('before', before);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Token': process.env.SOLSCAN_API_KEY || '', // Make sure to set this in your env
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Solscan API error:', error);
    return NextResponse.json(
      { success: false, errors: { message: 'Failed to fetch data from Solscan' } },
      { status: 500 }
    );
  }
} 