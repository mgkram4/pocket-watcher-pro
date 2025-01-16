import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const signature = searchParams.get('signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://public-api.solscan.io/transaction/${signature}`,
      {
        headers: {
          'Accept': 'application/json',
          'token': process.env.SOLSCAN_API_KEY || '',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorMessage = response.status === 404 
        ? 'Transaction not found on Solscan' 
        : `Solscan API returned ${response.status}`;
      
      console.log(`Solscan API error for signature ${signature}:`, errorMessage);
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const text = await response.text();
    
    // Check if the response is empty
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Empty response from Solscan API' },
        { status: 500 }
      );
    }

    try {
      const data = JSON.parse(text);
      
      // Validate that we have the expected data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse Solscan response:', text);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from Solscan API',
          details: (parseError as Error).message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle timeout and network errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Solscan API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch transaction data',
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}