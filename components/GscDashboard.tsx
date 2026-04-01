'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LogIn, LogOut, Search, Globe, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function GscDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Inspection state
  const [inspectUrl, setInspectUrl] = useState('');
  const [inspectResult, setInspectResult] = useState<any>(null);
  const [inspecting, setInspecting] = useState(false);

  useEffect(() => {
    checkAuthStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuthStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSites();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedSite) {
      fetchPerformance(selectedSite);
      setInspectResult(null);
      setInspectUrl('');
    }
  }, [selectedSite]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsLoggedIn(data.authenticated);
    } catch (e) {
      setIsLoggedIn(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups to connect your Google account.');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setSites([]);
    setSelectedSite('');
    setPerformanceData([]);
  };

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gsc/sites');
      const data = await res.json();
      if (data.sites) {
        setSites(data.sites);
        if (data.sites.length > 0) {
          setSelectedSite(data.sites[0].siteUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async (siteUrl: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gsc/performance?siteUrl=${encodeURIComponent(siteUrl)}`);
      const data = await res.json();
      if (data.rows) {
        const formattedData = data.rows.map((row: any) => ({
          date: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: (row.ctr * 100).toFixed(2),
          position: row.position.toFixed(1)
        }));
        setPerformanceData(formattedData);
      } else {
        setPerformanceData([]);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectUrl || !selectedSite) return;

    setInspecting(true);
    setInspectResult(null);
    try {
      const res = await fetch('/api/gsc/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: selectedSite,
          inspectionUrl: inspectUrl
        })
      });
      const data = await res.json();
      if (data.result) {
        setInspectResult(data.result);
      } else {
        alert(data.error || 'Failed to inspect URL');
      }
    } catch (error) {
      console.error('Error inspecting URL:', error);
    } finally {
      setInspecting(false);
    }
  };

  if (isLoggedIn === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Google Search Console</h1>
          <p className="text-gray-500 mb-8">Connect your Google account to view performance and inspect URLs.</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Connect Google Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">GSC Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-50 border"
            >
              {sites.map((site) => (
                <option key={site.siteUrl} value={site.siteUrl}>
                  {site.siteUrl.replace('sc-domain:', '')}
                </option>
              ))}
            </select>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && performanceData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Clicks (30d)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {performanceData.reduce((sum, row) => sum + row.clicks, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Impressions (30d)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {performanceData.reduce((sum, row) => sum + row.impressions, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Search className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avg. CTR</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {performanceData.length > 0 
                        ? (performanceData.reduce((sum, row) => sum + parseFloat(row.ctr), 0) / performanceData.length).toFixed(2) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Performance (Last 30 Days)</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} stroke="#9CA3AF" />
                    <YAxis yAxisId="left" tick={{fontSize: 12}} stroke="#9CA3AF" />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="impressions" name="Impressions" stroke="#9333EA" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* URL Inspection Tool */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">URL Inspection Tool</h2>
              <p className="text-sm text-gray-500 mb-6">Check the current index status of a specific URL on this property.</p>
              
              <form onSubmit={handleInspect} className="flex gap-4 mb-8">
                <input
                  type="url"
                  value={inspectUrl}
                  onChange={(e) => setInspectUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={inspecting}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {inspecting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Inspect URL
                </button>
              </form>

              {inspectResult && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Inspection Result</h3>
                    {inspectResult.indexStatusResult?.verdict === 'PASS' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" /> Indexed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" /> Not Indexed
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Coverage State</p>
                        <p className="text-sm text-gray-900 mt-1">{inspectResult.indexStatusResult?.coverageState || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Crawl Time</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {inspectResult.indexStatusResult?.lastCrawlTime 
                            ? new Date(inspectResult.indexStatusResult.lastCrawlTime).toLocaleString() 
                            : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Crawled As</p>
                        <p className="text-sm text-gray-900 mt-1">{inspectResult.indexStatusResult?.crawledAs || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Page Fetch State</p>
                        <p className="text-sm text-gray-900 mt-1">{inspectResult.indexStatusResult?.pageFetchState || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
