import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('gsc_access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
    const res = await searchconsole.sites.list();

    return NextResponse.json({ sites: res.data.siteEntry || [] });
  } catch (error: any) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sites' }, { status: 500 });
  }
}
