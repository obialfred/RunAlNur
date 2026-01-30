import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api/auth';

// POST /api/notifications/register - Register a device for push notifications
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId, supabase } = context;

  try {
    const body = await request.json();
    const { token, subscription, platform } = body;
    
    // Validate required fields
    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required (ios, android, or web)' },
        { status: 400 }
      );
    }

    if (!token && !subscription) {
      return NextResponse.json(
        { success: false, error: 'Token or subscription is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    // Upsert device token
    const db = supabase as unknown as { from: (t: string) => any };
    const { error } = await db
      .from('device_tokens')
      .upsert({
        tenant_id: tenantId,
        user_id: user.id,
        token: token || JSON.stringify(subscription),
        platform,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,user_id,platform',
      });
    
    if (error) {
      console.error('Failed to save device token:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to register device' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Device registered for ${platform} push notifications`,
    });
    
  } catch (error) {
    console.error('Notification registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/register - Unregister a device
export async function DELETE(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId, supabase } = context;

  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    
    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    // Delete device token
    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('platform', platform);
    
    if (error) {
      console.error('Failed to delete device token:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to unregister device' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Device unregistered from ${platform} push notifications`,
    });
    
  } catch (error) {
    console.error('Notification unregistration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
