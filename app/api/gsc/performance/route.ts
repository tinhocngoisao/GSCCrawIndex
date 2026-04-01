import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { subDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get('siteUrl');

    if (!siteUrl) {
      return NextResponse.json({ error: 'Missing siteUrl parameter' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('gsc_access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
    
    // Fetch last 30 days of data
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const res = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
        rowLimit: 30
      }
    });

    return NextResponse.json({ rows: res.data.rows || [] });
  } catch (error: any) {
    console.error('Error fetching performance:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch performance data' }, { status: 500 });
  }
}
