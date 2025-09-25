import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';

// This file handles profile picture updates

export async function PUT(request: NextRequest) {
  try {
    const { profilePicture } = await request.json();
    console.log('Profile picture update request:', { profilePicture });
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);
    
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate profile picture path
    if (!profilePicture || typeof profilePicture !== 'string') {
      return NextResponse.json({ error: 'Valid profile picture path required' }, { status: 400 });
    }

    // Handle prefixed paths (character:male/1.png) or direct paths (male/1.png)
    const cleanPath = profilePicture.startsWith('character:') 
      ? profilePicture.replace('character:', '') 
      : profilePicture;

    // Validate that the path is one of the allowed character images
    const validPaths = [
      ...Array.from({length: 11}, (_, i) => `male/${i + 1}.png`),
      ...Array.from({length: 11}, (_, i) => `female/${i + 1}.png`)
    ];

    console.log('Valid paths:', validPaths);
    console.log('Profile picture path validation:', { 
      originalPath: profilePicture, 
      cleanPath: cleanPath, 
      isValid: validPaths.includes(cleanPath) 
    });
    
    if (!validPaths.includes(cleanPath)) {
      return NextResponse.json({ error: 'Invalid profile picture path' }, { status: 400 });
    }

    // Check if user exists first
    const existingUser = await (prisma as any).user.findUnique({
      where: { email: decoded.email },
      select: { id: true, email: true, profilePicture: true }
    });
    
    if (!existingUser) {
      console.error('User not found in database:', decoded.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found in database:', existingUser);
    console.log('Updating user profile picture in database:', { email: decoded.email, profilePicture: cleanPath });
    
    try {
      const updatedUser = await (prisma as any).user.update({
        where: { email: decoded.email },
        data: { profilePicture: cleanPath },
        select: {
          id: true,
          email: true,
          name: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log('Database update successful:', updatedUser);
      
      if (!updatedUser) {
        throw new Error('User not found or update failed');
      }
      
      return NextResponse.json({
        success: true,
        user: updatedUser
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      throw new Error(`Database update failed: ${dbError}`);
    }

  } catch (error) {
    console.error('Profile picture update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile picture' },
      { status: 500 }
    );
  }
}
