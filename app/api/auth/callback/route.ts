import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new NextResponse('Missing code', { status: 400 });
  }

  try {
    const baseUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    let redirectUri = `${baseUrl}/api/auth/callback`;
    
    if (!baseUrl) {
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      redirectUri = `${protocol}://${host}/api/auth/callback`;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    const cookieStore = await cookies();
    cookieStore.set('gsc_access_token', tokens.access_token!, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 3600 // 1 hour
    });

    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new NextResponse('Authentication failed', { status: 500 });
  }
}
