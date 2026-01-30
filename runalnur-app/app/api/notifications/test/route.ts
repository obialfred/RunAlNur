import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth';

// POST /api/notifications/test - Send a test notification to the current user
export async function POST(request: NextRequest) {
  // Get authenticated user
  const authResult = await getAuthenticatedUser();
  if (!authResult.user) {
    return unauthorizedResponse(authResult.error || undefined);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    // Get user's registered devices
    const { data: devices, error: fetchError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', authResult.user.id);

    if (fetchError) {
      console.error('Failed to fetch device tokens:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch registered devices' },
        { status: 500 }
      );
    }

    // Track results for each device
    const results: { platform: string; success: boolean; error?: string }[] = [];

    // If user has web push subscriptions, try to send
    const webDevices = devices?.filter(d => d.platform === 'web') || [];
    
    for (const device of webDevices) {
      try {
        // Parse the subscription
        JSON.parse(device.token);
        
        // Check if VAPID keys are configured
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
        
        if (!vapidPublicKey || !vapidPrivateKey) {
          results.push({
            platform: 'web',
            success: false,
            error: 'VAPID keys not configured. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to environment.',
          });
          continue;
        }

        // Web Push requires the web-push library or a custom implementation
        // For now, mark as pending implementation
        results.push({
          platform: 'web',
          success: false,
          error: 'Web push delivery requires additional server setup',
        });
      } catch (err) {
        console.error('Web push error:', err);
        results.push({
          platform: 'web',
          success: false,
          error: err instanceof Error ? err.message : 'Failed to send',
        });
      }
    }

    // Native push devices
    const nativeDevices = devices?.filter(d => d.platform !== 'web') || [];
    for (const device of nativeDevices) {
      results.push({
        platform: device.platform,
        success: false,
        error: `${device.platform} push requires FCM/APNs setup`,
      });
    }

    // Always create an in-app notification (this works regardless of push status)
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: authResult.user.id,
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification from Empire OS!',
      read: false,
    });

    if (notifError) {
      console.error('Failed to create in-app notification:', notifError);
    }

    // Report results
    const deviceCount = devices?.length || 0;
    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: true,
      message: deviceCount === 0 
        ? 'In-app notification created. No devices registered for push notifications.'
        : `Push attempted to ${deviceCount} device(s). In-app notification created.`,
      inAppCreated: !notifError,
      pushResults: results,
      devicesRegistered: deviceCount,
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
