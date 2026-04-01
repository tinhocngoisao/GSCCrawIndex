import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteUrl, inspectionUrl } = body;

    if (!siteUrl || !inspectionUrl) {
      return NextResponse.json({ error: 'Missing siteUrl or inspectionUrl' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('gsc_access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: inspectionUrl,
        siteUrl: siteUrl,
        languageCode: 'en-US'
      }
    });

    return NextResponse.json({ result: res.data.inspectionResult });
  } catch (error: any) {
    console.error('Error inspecting URL:', error);
    return NextResponse.json({ error: error.message || 'Failed to inspect URL' }, { status: 500 });
  }
}
