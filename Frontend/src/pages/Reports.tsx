import { useEffect, useMemo, useState } from 'react';
import { FileText, File, Download, ChevronDown } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { COLOURS } from '@/constants/colours';
import { getAnomalies } from '@/api/anomalies';
import { generateReport, type SupportedReportFormat } from '@/api/reports';
import type { Anomaly } from '@/api/mockData';

type Format = 'csv' | 'json' | 'pdf';

export default function Reports() {
  const [format, setFormat] = useState<Format>('csv');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loadingAnoms, setLoadingAnoms] = useState(true);
  const [missionId] = useState(() => 'MSN-2026-0143');

  // Filters
  const [includeFilter, setIncludeFilter] = useState<'confirmed' | 'all_reviewed' | 'all'>('confirmed');
  const [fromDate, setFromDate] = useState<string>('2026-08-01');
  const [toDate, setToDate] = useState<string>('2026-08-31');
  const [classFilters, setClassFilters] = useState<Record<string, boolean>>({ ghostnet: true, shipwreck: true, container: true, pipe: true, debris: true });
  const [minConfidence, setMinConfidence] = useState<number>(0);

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ url: string; name: string; format: Format } | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);

  const [pastExports] = useState(() => [
    { name: 'MSN-2026-0143-summary-2026-08-22.csv', format: 'csv' as Format, date: '2026-08-22T15:12:00Z', size: '24 KB' },
    { name: 'MSN-2026-0143-detections-2026-08-20.json', format: 'json' as Format, date: '2026-08-20T09:42:00Z', size: '128 KB' },
    { name: 'MSN-2026-0143-report-2026-08-18.pdf', format: 'pdf' as Format, date: '2026-08-18T13:05:00Z', size: '512 KB' },
  ]);

  useEffect(() => {
    let mounted = true;
    setLoadingAnoms(true);
    // using active mission from API/backend
    getAnomalies(missionId)
      .then((d) => {
        if (!mounted) return;
        setAnomalies(d);
      })
      .catch(() => {})
      .finally(() => mounted && setLoadingAnoms(false));
    return () => { mounted = false; };
  }, [missionId]);

  const classMap = {
    ghostnet: 'unidentified_object',
    shipwreck: 'shipwreck',
    container: 'unidentified_object',
    pipe: 'pipeline_damage',
    debris: 'debris_field',
  } as Record<string, string>;

  const filtered = useMemo(() => {
    return anomalies.filter((a) => {
      // class filter
      const classKey = Object.keys(classMap).find((k) => classMap[k] === a.class_name) ?? 'ghostnet';
      if (!classFilters[classKey]) return false;
      // confidence
      if (a.confidence * 100 < minConfidence) return false;
      // include filter
      if (includeFilter === 'confirmed' && a.status !== 'verified') return false;
      if (includeFilter === 'all_reviewed' && a.status === 'pending_review') return false;
      // date range
      const d = new Date(a.detected_at || a.detected_at || '2026-08-22');
      if (fromDate && new Date(fromDate) > d) return false;
      if (toDate && new Date(toDate) < d) return false;
      return true;
    });
  }, [anomalies, classFilters, minConfidence, includeFilter, fromDate, toDate]);

  const breakdown = useMemo(() => {
    const map = new Map<string, { count: number; avg: number }>();
    for (const a of filtered) {
      const k = a.class_name;
      const cur = map.get(k) ?? { count: 0, avg: 0 };
      cur.count += 1;
      cur.avg += a.confidence;
      map.set(k, cur);
    }
    const out: { cls: string; count: number; avg: number }[] = [];
    for (const [k, v] of map.entries()) out.push({ cls: k, count: v.count, avg: v.avg / v.count });
    return out;
  }, [filtered]);

  function toggleClassFilter(key: string) {
    setClassFilters((s) => ({ ...s, [key]: !s[key] }));
  }

  async function handleGenerate() {
    if (format === 'pdf') {
      setGenerated(null);
      setFormatError('PDF export is not available. Select CSV or JSON.');
      return;
    }

    setGenerating(true);
    setGenerated(null);
    setFormatError(null);
    try {
      const res = await generateReport(missionId, format as SupportedReportFormat);
      if (res && res.url && res.url !== '#') {
        const nameBase = `report-${missionId}-${new Date().toISOString().slice(0, 10)}`;
        const fname = `${nameBase}.${format}`;
        setGenerated({ url: res.url, name: fname, format });
      } else {
        const content = format === 'csv'
          ? ['id,class,confidence,lat,lon,status', ...filtered.map((a) => `${a.id},${a.class_name},${Math.round(a.confidence*100)},${a.latitude},${a.longitude},${a.status}`)].join('\n')
          : JSON.stringify(filtered, null, 2);
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const fname = `report-${missionId}-${new Date().toISOString().slice(0, 10)}.${format}`;
        setGenerated({ url, name: fname, format });
      }
    } catch {
      const content = JSON.stringify(filtered, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      setGenerated({ url: URL.createObjectURL(blob), name: `report-${missionId}.json`, format });
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadGenerated() {
    if (!generated) return;
    const a = document.createElement('a');
    a.href = generated.url;
    a.download = generated.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <PageLayout title="Reports">
      <div style={{ backgroundColor: COLOURS.background }} className="rounded-2xl border p-6">
        <style>{`
          .format-card { transition: transform .18s ease, border .18s ease, background .18s ease; cursor:pointer }
          .format-card.selected { transform: scale(1.02); border: 2px solid ${COLOURS.ocean.light}; background: rgba(55,138,221,0.04); }
          @keyframes waveSweep { 0% { background-position: -200px 0 } 100% { background-position: 200px 0 } }
          .generate-wave { background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 100%); background-size: 400px 100%; animation: waveSweep 1.6s linear infinite; }
          .download-bounce { animation: bounceIn 400ms cubic-bezier(.2,.9,.3,1); }
          @keyframes bounceIn { from { transform: translateY(12px); opacity:0 } to { transform: translateY(0); opacity:1 } }
          .past-row { opacity:0; transform: translateY(8px); animation: fadeUp .4s forwards; }
          @keyframes fadeUp { to { opacity:1; transform: translateY(0); } }
        `}</style>

        <div className="flex gap-6">
          <div style={{ flex: '0 0 55%' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: COLOURS.textPrimary }}>Generate Report</h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {(['csv','json','pdf'] as Format[]).map((f) => (
                <div key={f} onClick={() => setFormat(f)} className={`format-card p-4 rounded-lg border`} style={{ borderColor: format === f ? COLOURS.ocean.light : 'rgba(255,255,255,0.04)', ...(format===f?{boxShadow:`0 0 12px ${COLOURS.ocean.light}22`}:{}), }}>
                  <div className="flex items-center gap-2 mb-2">
                    <File size={18} style={{ color: format === f ? COLOURS.ocean.light : COLOURS.seafloor.light }} />
                    <div className="font-semibold" style={{ color: COLOURS.textPrimary }}>{f.toUpperCase()}</div>
                  </div>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>{f === 'csv' ? 'Spreadsheet compatible' : f === 'json' ? 'API/developer use' : 'Printable summary report'}</div>
                </div>
              ))}
            </div>

            <div className="mb-4 p-4 rounded border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="mb-3 text-sm font-semibold" style={{ color: COLOURS.textPrimary }}>Filters</div>
              <div className="mb-2">
                <label className="mr-3"><input type="radio" name="include" checked={includeFilter==='confirmed'} onChange={() => setIncludeFilter('confirmed')} /> <span style={{ marginLeft:6 }}>Confirmed only</span></label>
                <label className="mr-3"><input type="radio" name="include" checked={includeFilter==='all_reviewed'} onChange={() => setIncludeFilter('all_reviewed')} /> <span style={{ marginLeft:6 }}>All reviewed</span></label>
                <label><input type="radio" name="include" checked={includeFilter==='all'} onChange={() => setIncludeFilter('all')} /> <span style={{ marginLeft:6 }}>All detections</span></label>
              </div>

              <div className="mb-3 flex gap-2 items-center">
                <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>From</div>
                <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="px-2 py-1 rounded" style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.04)', color: COLOURS.textPrimary }} />
                <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>To</div>
                <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="px-2 py-1 rounded" style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.04)', color: COLOURS.textPrimary }} />
              </div>

              <div className="mb-3">
                <div className="text-sm font-semibold mb-2" style={{ color: COLOURS.textPrimary }}>Anomaly Class</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(classMap).map((k) => (
                    <label key={k} className="text-xs px-2 py-1 rounded" style={{ background: classFilters[k] ? 'rgba(255,255,255,0.02)' : 'transparent', color: COLOURS.textPrimary }}>
                      <input type="checkbox" checked={classFilters[k]} onChange={() => toggleClassFilter(k)} style={{ marginRight: 6 }} /> {k}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm font-semibold mb-2" style={{ color: COLOURS.textPrimary }}>Minimum Confidence: <span style={{ color: COLOURS.ocean.light }}>{minConfidence}%</span></div>
                <input type="range" min={0} max={100} value={minConfidence} onChange={(e)=>setMinConfidence(Number(e.target.value))} />
              </div>

              <div>
                {formatError && (
                  <p className="mb-2 text-sm" style={{ color: COLOURS.hazard.base }}>{formatError}</p>
                )}
                {!generated ? (
                  <button onClick={handleGenerate} disabled={generating} className="w-full px-4 py-3 rounded font-semibold" style={{ background: COLOURS.ocean.light, color: COLOURS.white }}>
                    {generating ? <span className="generate-wave" style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6 }}>Generating...</span> : 'Generate Report'}
                  </button>
                ) : (
                  <button onClick={handleDownloadGenerated} className="w-full px-4 py-3 rounded font-semibold download-bounce" style={{ background: COLOURS.reef.base, color: COLOURS.white }}>
                    <Download size={16} /> Download Report
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ flex: '0 0 45%' }}>
            <div className="rounded border p-4 mb-4" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: COLOURS.textPrimary }}>Report Preview</h3>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Summary of export</div>
                </div>
                <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>{new Date().toLocaleString()}</div>
              </div>

              <div className="text-sm mb-2" style={{ color: COLOURS.seafloor.light }}>Mission: {missionId}</div>
              <div className="text-sm mb-2" style={{ color: COLOURS.seafloor.light }}>Date range: {fromDate} → {toDate}</div>
              <div className="text-sm mb-2" style={{ color: COLOURS.textPrimary }}>Total anomalies matching filters: {filtered.length}</div>

              <table className="w-full text-left text-sm" style={{ color: COLOURS.seafloor.light }}>
                <thead>
                  <tr>
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Count</th>
                    <th className="pb-2">Avg Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((b) => (
                    <tr key={b.cls}>
                      <td style={{ color: COLOURS.textPrimary }}>{b.cls.replace(/_/g,' ')}</td>
                      <td>{b.count}</td>
                      <td>{Math.round(b.avg*100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded border p-4" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLOURS.textPrimary }}>Past Exports</h3>
              <div className="space-y-2">
                {pastExports.map((p, i) => (
                  <div key={p.name} className="past-row" style={{ animationDelay: `${i*80}ms`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color: COLOURS.textPrimary }}>{p.name}</div>
                      <div style={{ color: COLOURS.seafloor.light, fontSize:12 }}>{new Date(p.date).toLocaleString()} • {p.size}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div style={{ padding:'4px 8px', borderRadius:999, background: p.format==='csv' ? 'rgba(55,138,221,0.15)' : p.format==='json' ? 'rgba(127,119,221,0.15)' : 'rgba(163,45,45,0.15)', color: p.format==='csv' ? COLOURS.ocean.light : p.format==='json' ? COLOURS.bio.light : COLOURS.hazard.base }}>{p.format.toUpperCase()}</div>
                      <button style={{ background:'transparent', border:'none', color: COLOURS.ocean.light }}><Download size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
