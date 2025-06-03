import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET handler - fetch current admin settings
export async function GET(req: NextRequest) {
  try {
    // Get current session to verify admin access
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get admin settings from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        adminSettings: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return user data with admin settings
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      settings: user.adminSettings || {
        twoFactorEnabled: false,
        emailNotifications: true,
        browserNotifications: true,
        notifyOnSubmissions: true,
        notifyOnApprovals: true,
        theme: 'system',
        compactMode: false,
        fontSize: 'medium'
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'Failed to fetch admin settings' }, { status: 500 });
  }
}

// PUT handler - update admin settings
export async function PUT(req: NextRequest) {
  try {
    // Get current session to verify admin access
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await req.json();
    
    const {
      firstName,
      lastName,
      email,
      twoFactorEnabled,
      emailNotifications,
      browserNotifications,
      notifyOnSubmissions,
      notifyOnApprovals,
      theme,
      compactMode,
      fontSize,
      currentPassword,
      newPassword
    } = body;
    
    // Update basic profile data
    const updateData: any = {};
    
    // Handle profile updates
    if (firstName || lastName || email) {
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
    }
    
    // Handle admin settings updates
    if (twoFactorEnabled !== undefined ||
        emailNotifications !== undefined ||
        browserNotifications !== undefined ||
        notifyOnSubmissions !== undefined ||
        notifyOnApprovals !== undefined ||
        theme !== undefined ||
        compactMode !== undefined ||
        fontSize !== undefined) {
      
      updateData.adminSettings = {
        twoFactorEnabled: twoFactorEnabled,
        emailNotifications: emailNotifications,
        browserNotifications: browserNotifications,
        notifyOnSubmissions: notifyOnSubmissions,
        notifyOnApprovals: notifyOnApprovals,
        theme: theme,
        compactMode: compactMode,
        fontSize: fontSize
      };
    }
    
    // Handle password update (would implement proper password hashing in real app)
    if (currentPassword && newPassword) {
      // In a real implementation, verify current password before updating
      // For demo, we'll just update with new password
      updateData.password = newPassword; // Using hashed password in real implementation
    }
    
    // Update the user in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        adminSettings: true,
      }
    });
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        settings: updatedUser.adminSettings
      }
    });
    
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
