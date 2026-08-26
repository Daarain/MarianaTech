import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Waves,
  Upload,
  File as FileIcon,
  X,
  Check,
  Save,
  AlertCircle,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { COLOURS } from '@/constants/colours';
import { useAuth } from '@/hooks/useAuth';
import { createMission, type CreateMissionPayload } from '@/api/missions';

type FileStatus = 'queued' | 'validating' | 'ready' | 'error';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
}

const ACCEPTED_EXT = ['.xtf', '.jsf', '.png', '.tiff'];
const MAX_SIZE = 500 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_CHIP_COLOURS: Record<FileStatus, { bg: string; text: string }> = {
  queued: { bg: 'rgba(136, 135, 128, 0.2)', text: COLOURS.seafloor.light },
  validating: { bg: 'rgba(83, 74, 183, 0.2)', text: COLOURS.bio.light },
  ready: { bg: 'rgba(15, 110, 86, 0.2)', text: COLOURS.reef.light },
  error: { bg: 'rgba(163, 45, 45, 0.2)', text: COLOURS.hazard.light },
};

const SONAR_TYPES = ['Side-Scan Sonar', 'Multibeam', 'Sub-bottom Profiler'];

const BUBBLES = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 6,
  left: 10 + Math.random() * 80,
  duration: 4 + Math.random() * 4,
  delay: Math.random() * 4,
  drift: `${(Math.random() - 0.5) * 40}px`,
}));

export default function MissionUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    missionName: '',
    date: new Date().toISOString().slice(0, 10),
    vessel: '',
    location: '',
    depthMin: '',
    depthMax: '',
    sonarType: SONAR_TYPES[0],
    notes: '',
    operatorName: user?.user ?? '',
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'missionName' && value) setNameError(false);
  };

  const simulateProgress = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'validating' } : f))
    );
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'ready', progress: 100 } : f
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress } : f
          )
        );
      }
    }, 200);
  }, []);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      setFileError(null);
      const newFiles: UploadedFile[] = [];
      const arr = Array.from(fileList);
      arr.forEach((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ACCEPTED_EXT.includes(ext)) return;
        if (file.size > MAX_SIZE) return;
        newFiles.push({
          id: `${Date.now()}-${file.name}-${Math.random()}`,
          name: file.name,
          size: file.size,
          status: 'queued',
          progress: 0,
        });
      });
      if (newFiles.length === 0) {
        setFileError('No valid files. Supported: .xtf, .jsf, .png, .tiff (max 500MB)');
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
      newFiles.forEach((f, i) => {
        setTimeout(() => simulateProgress(f.id), i * 200);
      });
    },
    [simulateProgress]
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      setRipple(true);
      setTimeout(() => setRipple(false), 800);
      addFiles(e.dataTransfer.files);
    }
  };

  const handleBrowse = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRipple(true);
      setTimeout(() => setRipple(false), 800);
      addFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const isFormValid =
    form.missionName.trim() !== '' &&
    form.location.trim() !== '' &&
    files.some((f) => f.status === 'ready');

  const handleSubmit = async () => {
    if (files.length === 0) {
      setFileError('At least one sonar file is required');
      return;
    }
    if (!form.missionName.trim()) {
      setNameError(true);
      return;
    }

    setSubmitting(true);
    const payload: CreateMissionPayload = {
      missionName: form.missionName,
      date: form.date,
      vessel: form.vessel,
      location: form.location,
      depthMin: Number(form.depthMin) || 0,
      depthMax: Number(form.depthMax) || 0,
      sonarType: form.sonarType,
      notes: form.notes,
      operatorName: form.operatorName,
      files: files.map((f) => ({ name: f.name, size: f.size })),
    };

    try {
      const result = await createMission(payload);
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/missions/${result.id}/status`);
      }, 1200);
    } catch {
      setFileError('Failed to create mission. Please try again.');
      setSubmitting(false);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    backgroundColor: 'rgba(12, 68, 124, 0.08)',
    border: `1px solid ${hasError ? COLOURS.hazard.base : 'rgba(255,255,255,0.1)'}`,
    color: COLOURS.textPrimary,
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.3s',
  });

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: COLOURS.seafloor.light,
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <PageLayout title="Mission Upload">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left column — 60% */}
        <div className="lg:col-span-3 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300"
            style={{
              border: `2px dashed ${isDragOver ? COLOURS.bio.light : isHover ? COLOURS.bio.light : COLOURS.ocean.light}`,
              backgroundColor: isDragOver
                ? 'rgba(83, 74, 183, 0.10)'
                : isHover
                ? 'rgba(83, 74, 183, 0.06)'
                : 'rgba(12, 68, 124, 0.10)',
              animation: isDragOver
                ? 'borderSpin 1.5s linear infinite'
                : undefined,
              backgroundSize: isDragOver ? '200% 100%' : undefined,
            }}
          >
            {/* Bubble particles */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {BUBBLES.map((b) => (
                <span
                  key={b.id}
                  className="absolute bottom-0 rounded-full"
                  style={{
                    width: b.size,
                    height: b.size,
                    left: `${b.left}%`,
                    backgroundColor: 'rgba(55, 138, 221, 0.20)',
                    animation: `bubbleRise ${b.duration}s ease-in infinite`,
                    animationDelay: `${b.delay}s`,
                    ['--drift' as string]: b.drift,
                  }}
                />
              ))}
            </div>

            {/* Ripple on drop */}
            {ripple && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  border: `3px solid ${COLOURS.bio.light}`,
                  animation: 'dropRipple 0.8s ease-out forwards',
                }}
              />
            )}

            <div className="relative flex flex-col items-center justify-center py-12 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${COLOURS.ocean.base}33`,
                  color: COLOURS.ocean.light,
                }}
              >
                <Waves size={32} strokeWidth={1.8} />
              </div>
              <p className="text-lg font-semibold" style={{ color: COLOURS.textPrimary }}>
                Drop sonar files here
              </p>
              <p className="mt-1 text-xs" style={{ color: COLOURS.seafloor.light }}>
                Supports .xtf, .jsf, .png, .tiff — max 500MB per file
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: COLOURS.ocean.base, color: COLOURS.white }}
              >
                Browse files
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xtf,.jsf,.png,.tiff"
              onChange={handleBrowse}
              className="hidden"
            />
          </div>

          {/* File error */}
          {fileError && (
            <div className="flex items-center gap-2 text-sm" style={{ color: COLOURS.hazard.light }}>
              <AlertCircle size={16} />
              {fileError}
            </div>
          )}

          {/* Uploaded files list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLOURS.seafloor.light }}>
                Uploaded Files ({files.length})
              </p>
              {files.map((f) => {
                const chip = STATUS_CHIP_COLOURS[f.status];
                return (
                  <div
                    key={f.id}
                    className="rounded-xl border p-3"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.06)',
                      animation: 'fileSlideIn 0.3s ease-out forwards',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${COLOURS.ocean.base}22`, color: COLOURS.ocean.light }}
                      >
                        <FileIcon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: COLOURS.textPrimary }}>
                          {f.name}
                        </p>
                        <p className="text-xs" style={{ color: COLOURS.seafloor.light }}>
                          {formatBytes(f.size)}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: chip.bg, color: chip.text }}
                      >
                        {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                      </span>
                      <button
                        onClick={() => removeFile(f.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                        style={{ color: COLOURS.seafloor.light }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {/* Progress bar with shimmer */}
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="relative h-full rounded-full overflow-hidden transition-all duration-200"
                        style={{
                          width: `${f.progress}%`,
                          backgroundColor: f.status === 'ready' ? COLOURS.reef.light : COLOURS.ocean.light,
                        }}
                      >
                        {f.status === 'validating' && (
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${COLOURS.reef.tint}80, transparent)`,
                              animation: 'progressShimmer 1.5s linear infinite',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — 40% */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: COLOURS.seafloor.light }}>
              Mission Metadata
            </h3>
            <div className="space-y-4">
              {/* Mission Name */}
              <div>
                <label style={labelStyle}>Mission Name</label>
                <input
                  type="text"
                  value={form.missionName}
                  onChange={(e) => updateField('missionName', e.target.value)}
                  placeholder="e.g. Chagos Trench Survey"
                  style={inputStyle(nameError)}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOURS.bio.base;
                    e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = nameError ? COLOURS.hazard.base : 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {nameError && (
                  <p className="mt-1 text-xs" style={{ color: COLOURS.hazard.light }}>
                    Mission name is required
                  </p>
                )}
              </div>

              {/* Mission Date */}
              <div>
                <label style={labelStyle}>Mission Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  style={inputStyle()}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOURS.bio.base;
                    e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Vessel */}
              <div>
                <label style={labelStyle}>Vessel / Platform</label>
                <input
                  type="text"
                  value={form.vessel}
                  onChange={(e) => updateField('vessel', e.target.value)}
                  placeholder="e.g. RV Sagar Nidhi"
                  style={inputStyle()}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOURS.bio.base;
                    e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Location */}
              <div>
                <label style={labelStyle}>Survey Area / Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Gulf of Mannar, India"
                  style={inputStyle()}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOURS.bio.base;
                    e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Depth range */}
              <div>
                <label style={labelStyle}>Water Depth Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.depthMin}
                    onChange={(e) => updateField('depthMin', e.target.value)}
                    placeholder="Min"
                    style={inputStyle()}
                    onFocus={(e) => {
                      e.target.style.borderColor = COLOURS.bio.base;
                      e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <span style={{ color: COLOURS.seafloor.light }} className="text-sm">—</span>
                  <input
                    type="number"
                    value={form.depthMax}
                    onChange={(e) => updateField('depthMax', e.target.value)}
                    placeholder="Max"
                    style={inputStyle()}
                    onFocus={(e) => {
                      e.target.style.borderColor = COLOURS.bio.base;
                      e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: COLOURS.seafloor.light }}>metres</p>
              </div>

              {/* Sonar Type */}
              <div>
                <label style={labelStyle}>Sonar Type</label>
                <select
                  value={form.sonarType}
                  onChange={(e) => updateField('sonarType', e.target.value)}
                  style={inputStyle()}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOURS.bio.base;
                    e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {SONAR_TYPES.map((t) => (
                    <option key={t} value={t} style={{ backgroundColor: '#0A1628' }}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes / Description</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Additional mission context..."
                  style={{ ...inputStyle(), resize: 'vertical' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOURS.bio.base;
                    e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Operator */}
              <div>
                <label style={labelStyle}>Operator Name</label>
                <input
                  type="text"
                  value={form.operatorName}
                  onChange={(e) => updateField('operatorName', e.target.value)}
                  style={inputStyle()}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOURS.bio.base;
                    e.target.style.boxShadow = '0 0 0 3px rgba(83, 74, 183, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 space-y-3">
              <div className="relative overflow-hidden rounded-xl">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="relative w-full overflow-hidden rounded-xl py-3 text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: showSuccess ? COLOURS.reef.base : COLOURS.ocean.base,
                    color: COLOURS.white,
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting && !showSuccess) {
                      const wave = e.currentTarget.querySelector('[data-wave]') as HTMLElement;
                      if (wave) wave.style.animation = 'buttonWave 1.5s ease-in-out infinite';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const wave = e.currentTarget.querySelector('[data-wave]') as HTMLElement;
                    if (wave) wave.style.animation = 'none';
                  }}
                >
                  {/* Wave overlay */}
                  <span
                    data-wave
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${COLOURS.ocean.light}40, transparent)`,
                      animation: 'none',
                    }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    {showSuccess ? (
                      <>
                        <Check size={18} /> Mission Created
                      </>
                    ) : submitting ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLOURS.white, animation: 'sonarDot 1.2s ease-in-out infinite' }} />
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLOURS.white, animation: 'sonarDot 1.2s ease-in-out 0.2s infinite' }} />
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLOURS.white, animation: 'sonarDot 1.2s ease-in-out 0.4s infinite' }} />
                      </span>
                    ) : (
                      <>
                        <Upload size={16} /> Start Mission
                      </>
                    )}
                  </span>
                </button>
              </div>

              <button
                onClick={() => {
                  setForm((prev) => ({ ...prev, missionName: '', vessel: '', location: '', notes: '', depthMin: '', depthMax: '' }));
                  setFiles([]);
                  setFileError(null);
                  setNameError(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                style={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: COLOURS.seafloor.light,
                }}
              >
                <Save size={16} /> Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
