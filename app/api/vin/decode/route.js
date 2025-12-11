/**
 * VIN Decode API Route
 * 
 * Decodes a VIN and returns vehicle information.
 * Uses NHTSA's free API.
 */

import { NextResponse } from 'next/server';
import { decodeVIN, isValidVIN, cleanVIN } from '@/lib/vinDecoder';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get('vin');

  if (!vin) {
    return NextResponse.json(
      { success: false, error: 'VIN is required' },
      { status: 400 }
    );
  }

  const cleanedVin = cleanVIN(vin);

  if (!isValidVIN(cleanedVin)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid VIN format. VIN must be 17 alphanumeric characters (excluding I, O, Q).',
        vin: cleanedVin,
      },
      { status: 400 }
    );
  }

  try {
    const decoded = await decodeVIN(cleanedVin);
    
    if (!decoded.success) {
      return NextResponse.json(decoded, { status: 422 });
    }

    return NextResponse.json(decoded);
  } catch (err) {
    console.error('[VIN Decode API] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to decode VIN' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { vin } = body;

    if (!vin) {
      return NextResponse.json(
        { success: false, error: 'VIN is required' },
        { status: 400 }
      );
    }

    const cleanedVin = cleanVIN(vin);

    if (!isValidVIN(cleanedVin)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid VIN format. VIN must be 17 alphanumeric characters (excluding I, O, Q).',
          vin: cleanedVin,
        },
        { status: 400 }
      );
    }

    const decoded = await decodeVIN(cleanedVin);
    
    if (!decoded.success) {
      return NextResponse.json(decoded, { status: 422 });
    }

    return NextResponse.json(decoded);
  } catch (err) {
    console.error('[VIN Decode API] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to decode VIN' },
      { status: 500 }
    );
  }
}
