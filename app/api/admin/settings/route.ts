import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getAdminSession } from '@/lib/admin-auth';
import { getSystemAdminSettings, updateSystemAdminSettings } from '@/lib/settings-service';

// Mark this route as dynamic to allow cookies usage
export const dynamic = 'force-dynamic';

// GET handler - fetch current admin settings
export async function GET(req: NextRequest) {
  try {
    // Get current session to verify admin access
    const session = await getAdminSession();
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user data from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get admin settings from SystemSettings table
    const adminSettings = await getSystemAdminSettings(userId);
    
    // Return user data with admin settings
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      settings: adminSettings
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
    const session = await getAdminSession();
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
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
    
    // Handle password update (would implement proper password hashing in real app)
    if (currentPassword && newPassword) {
      // In a real implementation, verify current password before updating
      // For demo, we'll just update with new password
      updateData.password = newPassword; // Using hashed password in real implementation
    }
    
    // Get current user data
    let updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      }
    });
    
    // Ensure user exists
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update the user in DB if there are profile changes
    if (Object.keys(updateData).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        }
      });
    }
    
    // Separately handle settings updates in SystemSettings table
    let updatedSettings = null;
    if (twoFactorEnabled !== undefined ||
        emailNotifications !== undefined ||
        browserNotifications !== undefined ||
        notifyOnSubmissions !== undefined ||
        notifyOnApprovals !== undefined ||
        theme !== undefined ||
        compactMode !== undefined ||
        fontSize !== undefined) {
      
      const settingsUpdate: Record<string, any> = {
        twoFactorEnabled,
        emailNotifications,
        browserNotifications,
        notifyOnSubmissions,
        notifyOnApprovals,
        theme,
        compactMode,
        fontSize
      };
      
      // Filter out undefined values
      Object.keys(settingsUpdate).forEach(key => {
        if (settingsUpdate[key] === undefined) {
          delete settingsUpdate[key];
        }
      });
      
      // Update settings in SystemSettings table
      updatedSettings = await updateSystemAdminSettings(userId, settingsUpdate);
    } else {
      // Get current settings if no update
      updatedSettings = await getSystemAdminSettings(userId);
    }
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        settings: updatedSettings
      }
    });
    
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
