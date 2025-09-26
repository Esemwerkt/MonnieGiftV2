import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
    
    // Test basic database connection
    const { data: gifts, error } = await supabase
      .from('gifts')
      .select('id')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('✅ Database query successful, gift count:', gifts?.length || 0);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      giftCount: gifts?.length || 0,
      supabaseUrl: process.env.SUPABASE_URL ? 'Set' : 'Not set',
      supabaseKey: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set'
    });
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Supabase connection failed',
        details: error instanceof Error ? error.message : String(error),
        supabaseUrl: process.env.SUPABASE_URL ? 'Set' : 'Not set',
        supabaseKey: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set'
      },
      { status: 500 }
    );
  }
}
