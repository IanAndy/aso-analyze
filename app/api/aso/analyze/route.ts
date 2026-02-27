import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering and Node.js runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache control for better performance
const CACHE_MAX_AGE = 3600; // 1 hour
const CACHE_STALE_WHILE_REVALIDATE = 7200; // 2 hours

/**
 * POST /api/aso/analyze
 * Analyzes a keyword for Google Play Store ASO
 * Body: { keyword: string }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON body');
    });

    const { keyword } = body;

    // Validate input
    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        {
          error: 'Keyword is required and must be a string',
          code: 'INVALID_INPUT'
        },
        { status: 400 }
      );
    }

    // Sanitize keyword (remove extra spaces, lowercase)
    const sanitizedKeyword = keyword.trim().toLowerCase();

    if (sanitizedKeyword.length === 0) {
      return NextResponse.json(
        {
          error: 'Keyword cannot be empty',
          code: 'EMPTY_KEYWORD'
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Analyzing keyword: "${sanitizedKeyword}"`);

    // Dynamically import aso-v2 (only runs on server)
    const ASO = (await import('aso-v2')).default;

    // Initialize Google Play ASO analyzer
    const gplay = new ASO('gplay');

    // Analyze the keyword
    const analysis = await gplay.analyzeKeyword(sanitizedKeyword);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Analysis complete for "${sanitizedKeyword}" in ${processingTime}ms`);

    // Return with cache headers
    return NextResponse.json(analysis, {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
        'X-Processing-Time': `${processingTime}ms`,
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Log the full error for debugging
    console.error('❌ API Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${processingTime}ms`
    });

    // Determine if it's an aso-v2 specific error or general error
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze keyword';
    const isRateLimit = errorMessage.toLowerCase().includes('rate limit') ||
                        errorMessage.toLowerCase().includes('too many requests');
    const isTimeout = errorMessage.toLowerCase().includes('timeout') ||
                      errorMessage.toLowerCase().includes('timed out');

    // Return appropriate error response
    return NextResponse.json(
      {
        error: errorMessage,
        code: isRateLimit ? 'RATE_LIMITED' :
              isTimeout ? 'TIMEOUT' :
              'ANALYSIS_FAILED',
        details: process.env.NODE_ENV === 'development' ?
                 (error instanceof Error ? error.stack : undefined) :
                 undefined
      },
      {
        status: isRateLimit ? 429 :
                isTimeout ? 504 :
                500
      }
    );
  }
}

/**
 * GET /api/aso/analyze?keyword=...
 * Simple GET endpoint for testing and quick lookups
 */
export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json(
      {
        error: 'Keyword parameter is required',
        code: 'MISSING_PARAMETER'
      },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 GET request for keyword: "${keyword}"`);

    // Reuse the same logic as POST
    const ASO = (await import('aso-v2')).default;
    const gplay = new ASO('gplay');
    const analysis = await gplay.analyzeKeyword(keyword);

    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
      },
    });

  } catch (error) {
    console.error('❌ GET Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze keyword',
        code: 'ANALYSIS_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/aso/analyze
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

/**
 * Helper function to validate and sanitize input
 */
function validateKeyword(keyword: any): { isValid: boolean; sanitized?: string; error?: string } {
  if (!keyword) {
    return { isValid: false, error: 'Keyword is required' };
  }

  if (typeof keyword !== 'string') {
    return { isValid: false, error: 'Keyword must be a string' };
  }

  const sanitized = keyword.trim().toLowerCase();

  if (sanitized.length === 0) {
    return { isValid: false, error: 'Keyword cannot be empty' };
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: 'Keyword is too long (max 100 characters)' };
  }

  return { isValid: true, sanitized };
}