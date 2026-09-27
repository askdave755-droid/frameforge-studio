import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRender, getRender, hasRenderApi } from './api.js'

const ASSET_BASE = import.meta.env.BASE_URL

const NAV_ITEMS = [
  { id: 'studio', label: 'Studio', icon: 'sparkle' },
  { id: 'projects', label: 'Projects', icon: 'folder', count: '12' },
  { id: 'voices', label: 'Voice library', icon: 'mic' },
  { id: 'templates', label: 'Templates', icon: 'layers' },
]

const VOICES = [
  { id: 'maya', name: 'Maya', role: 'Warm storyteller', language: 'English', accent: 'US / neutral', tone: 'Warm · intimate', color: '#f0a57a', bars: [3, 6, 8, 5, 9, 4, 7, 3, 8, 5, 6, 4] },
  { id: 'jonah', name: 'Jonah', role: 'Documentary calm', language: 'English', accent: 'UK / soft', tone: 'Measured · clear', color: '#8bb8f4', bars: [7, 4, 5, 8, 3, 7, 9, 4, 6, 8, 5, 7] },
  { id: 'sora', name: 'Sora', role: 'Bright guide', language: 'English', accent: 'AU / light', tone: 'Curious · bright', color: '#b6a2f5', bars: [4, 7, 5, 9, 5, 8, 4, 6, 8, 4, 7, 5] },
  { id: 'luis', name: 'Luis', role: 'Conversational', language: 'Spanish', accent: 'MX / natural', tone: 'Friendly · vivid', color: '#7bc4b1', bars: [5, 4, 8, 6, 9, 5, 7, 4, 8, 6, 5, 9] },
]

const SCENES = [
  { id: 1, name: 'Opening', time: '0:00 — 0:03', image: `${ASSET_BASE}assets/hero-still.svg`, caption: 'A question worth following.' },
  { id: 2, name: 'The reveal', time: '0:03 — 0:07', image: `${ASSET_BASE}assets/scene-2.svg`, caption: 'Let the image breathe.' },
  { id: 3, name: 'Closing thought', time: '0:07 — 0:10', image: `${ASSET_BASE}assets/scene-3.svg`, caption: 'Leave them somewhere new.' },
]

const STYLE_OPTIONS = [
  { id: 'cinematic', label: 'Cinematic', note: 'Slow, filmic movement' },
  { id: 'documentary', label: 'Documentary', note: 'Natural handheld energy' },
  { id: 'dreamy', label: 'Dreamy', note: 'Soft light and float' },
]

function Icon({ name, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 1.8 }) {
  const paths = {
    sparkle: <><path d="M12 2.8 13.7 8.3 19.2 10l-5.5 1.7L12 17.2l-1.7-5.5L4.8 10l5.5-1.7L12 2.8Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    grid: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><rect x="14" y="14" width="6.5" height="6.5" rx="1" /></>,
    film: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 5v14M16 5v14M3 9h5M16 9h5M3 15h5M16 15h5" /></>,
    folder: <><path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2h6.9a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V6.5Z" /><path d="M2.5 9h17.8" /></>,
    mic: <><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7" /></>,
    layers: <><path d="m12 3 9 4.8-9 4.8-9-4.8L12 3Z" /><path d="m3 12 9 4.8 9-4.8M3 16.2l9 4.8 9-4.8" /></>,
    settings: <><path d="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z" /><path d="m19.3 13.5 1.2 1-.9 2.2-1.6-.1a7.5 7.5 0 0 1-1.7 1.5l-.2 1.6-2.3.7-.9-1.3a7.6 7.6 0 0 1-2.2 0l-.9 1.3-2.3-.7-.2-1.6a7.5 7.5 0 0 1-1.7-1.5l-1.6.1-.9-2.2 1.2-1a7.6 7.6 0 0 1 0-2.2l-1.2-1 .9-2.2 1.6.1a7.5 7.5 0 0 1 1.7-1.5l.2-1.6 2.3-.7.9 1.3a7.6 7.6 0 0 1 2.2 0l.9-1.3 2.3.7.2 1.6a7.5 7.5 0 0 1 1.7 1.5l1.6-.1.9 2.2-1.2 1a7.6 7.6 0 0 1 0 2.2Z" /></>,
    upload: <><path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M4 14.5v3A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-3" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 4.8-4.8 3.5 3.5 2.5-2.5L20 17.7" /></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="var(--panel)" /><circle cx="15" cy="12" r="2" fill="var(--panel)" /><circle cx="11" cy="18" r="2" fill="var(--panel)" /></>,
    play: <path d="m9 6 9 6-9 6V6Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 6v12M16 6v12" strokeWidth="2.5" /></>,
    check: <path d="m5 12 4.2 4.2L19 6.5" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    arrow: <><path d="M5 12h13M13 6l6 6-6 6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></>,
    volume: <><path d="M4 10v4h3l4 3V7l-4 3H4Z" /><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.3 7.3 0 0 1 0 10" /></>,
    download: <><path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M4 20h16" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></>,
    wand: <><path d="m4 20 12.5-12.5M14 4l1.5 1.5M18.5 6.5 20 8M16 2.5l.5 2M20 12l-2 .5" /><path d="m6 4 .6 2.4L9 7l-2.4.6L6 10l-.6-2.4L3 7l2.4-.6L6 4Z" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9.5a2.3 2.3 0 1 1 3.8 1.7c-1.1.9-1.6 1.2-1.6 2.5M12 17.3v.1" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.sparkle}</svg>
}

function Waveform({ voice, active = false, small = false }) {
  return <div className={`waveform ${small ? 'small' : ''} ${active ? 'active' : ''}`} aria-hidden="true">
    {voice.bars.map((height, i) => <i key={i} style={{ height: `${height * (small ? 1.5 : 2.2)}px`, backgroundColor: active ? voice.color : undefined }} />)}
  </div>
}

function Logo() {
  return <div className="brand">
    <div className="brand-mark"><span></span><span></span><span></span></div>
    <div><div className="brand-name">frameforge</div><div className="brand-kicker">motion studio</div></div>
  </div>
}

function Sidebar({ activeNav, setActiveNav }) {
  return <aside className="sidebar">
    <Logo />
    <div className="workspace-switcher"><div className="workspace-avatar">A</div><div className="workspace-copy"><strong>Atlas workspace</strong><span>Personal studio</span></div><Icon name="chevronDown" size={14} /></div>
    <div className="side-label">Workspace</div>
    <nav className="side-nav">
      {NAV_ITEMS.map(item => <button key={item.id} className={`side-nav-item ${activeNav === item.id ? 'active' : ''}`} onClick={() => setActiveNav(item.id)}><Icon name={item.icon} size={17} /><span>{item.label}</span>{item.count && <em>{item.count}</em>}</button>)}
    </nav>
    <div className="side-label settings-label">Manage</div>
    <nav className="side-nav">
      <button className={`side-nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')}><Icon name="settings" size={17} /><span>Settings</span></button>
      <button className={`side-nav-item ${activeNav === 'help' ? 'active' : ''}`} onClick={() => setActiveNav('help')}><Icon name="help" size={17} /><span>Help center</span></button>
    </nav>
    <div className="sidebar-spacer" />
    <div className="usage-card"><div className="usage-top"><span>Monthly renders</span><span>7 / 20</span></div><div className="usage-bar"><span style={{ width: '35%' }} /></div><div className="usage-foot"><span>Resets in 18 days</span><button>Upgrade <Icon name="arrow" size={12} /></button></div></div>
    <div className="profile"><div className="profile-avatar">AM</div><div><strong>Alex Morgan</strong><span>Creator plan</span></div><Icon name="more" size={18} /></div>
  </aside>
}

function Topbar({ onRender, rendering, onDownload }) {
  return <header className="topbar">
    <div className="crumbs"><span>Studio</span><Icon name="chevron" size={14} /><strong>Untitled story</strong><span className="unsaved">Unsaved</span></div>
    <div className="top-actions"><button className="icon-button subtle" aria-label="Help"><Icon name="help" size={17} /></button><button className="icon-button subtle" aria-label="More"><Icon name="more" size={18} /></button><div className="top-divider" /><button className="button secondary" onClick={onDownload}><Icon name="download" size={15} /> Export</button><button className="button primary" onClick={onRender} disabled={rendering}><Icon name={rendering ? 'clock' : 'sparkle'} size={15} /> {rendering ? 'Rendering…' : 'Render video'}</button></div>
  </header>
}

function SectionHeader({ eyebrow, title, note, action }) {
  return <div className="section-header"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{note && <p>{note}</p>}</div>{action}</div>
}

function SourceCard({ imageSrc, imageName, onPickImage }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  function useFile(file) { if (file && file.type.startsWith('image/')) onPickImage(URL.createObjectURL(file), file.name, file) }
  return <div className="source-card panel">
    <div className="panel-heading"><div><div className="eyebrow">01 / source frame</div><h3>Start with an image</h3></div><span className="status-dot"><i /> Ready</span></div>
    <div className={`dropzone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); useFile(e.dataTransfer.files[0]) }}>
      <img src={imageSrc} alt="Current source frame" />
      <div className="drop-overlay"><div className="drop-icon"><Icon name="upload" size={19} /></div><strong>Drop a new image</strong><span>or click to browse · JPG, PNG up to 20MB</span></div>
      <button className="replace-button" onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>Replace</button>
    </div>
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => useFile(e.target.files?.[0])} />
    <div className="source-meta"><div className="mini-thumb"><img src={imageSrc} alt="" /></div><div><strong>{imageName}</strong><span>1600 × 1000 · source frame</span></div><button className="icon-button subtle"><Icon name="more" size={17} /></button></div>
  </div>
}

function MotionControls({ prompt, setPrompt, aspect, setAspect, duration, setDuration, style, setStyle, intensity, setIntensity }) {
  return <div className="controls-card panel">
    <div className="panel-heading"><div><div className="eyebrow">02 / direction</div><h3>Describe the motion</h3></div><span className="ai-chip"><Icon name="wand" size={13} /> AI assisted</span></div>
    <div className="field-group"><div className="field-label"><label htmlFor="prompt">Motion prompt</label><span>{prompt.length} / 500</span></div><textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe how the scene should move…" /><div className="prompt-hint"><Icon name="sparkle" size={13} /><span>Try: “Slow push in as the light shifts across the face”</span></div></div>
    <div className="control-grid">
      <div className="field-group"><div className="field-label"><label>Aspect ratio</label></div><div className="segmented">{['9:16', '1:1', '16:9'].map(value => <button key={value} className={aspect === value ? 'selected' : ''} onClick={() => setAspect(value)}>{value}</button>)}</div></div>
      <div className="field-group"><div className="field-label"><label>Duration</label></div><div className="segmented">{['5s', '10s', '15s'].map(value => <button key={value} className={duration === value ? 'selected' : ''} onClick={() => setDuration(value)}>{value}</button>)}</div></div>
    </div>
    <div className="control-grid">
      <div className="field-group"><div className="field-label"><label>Visual style</label></div><div className="select-wrap"><select value={style} onChange={e => setStyle(e.target.value)}>{STYLE_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select><Icon name="chevronDown" size={15} /></div></div>
      <div className="field-group"><div className="field-label"><label>Motion intensity</label><span>{intensity}%</span></div><input className="range" type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(Number(e.target.value))} style={{ '--value': `${intensity}%` }} /></div>
    </div>
  </div>
}

function VoiceCard({ voice, selected, playing, onSelect, onPlay }) {
  return <div className={`voice-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(voice.id)}>
    <div className="voice-avatar" style={{ background: `linear-gradient(135deg, ${voice.color}, #2b2b3c)` }}>{voice.name.slice(0, 1)}</div>
    <div className="voice-info"><div className="voice-name-row"><strong>{voice.name}</strong>{selected && <span className="selected-check"><Icon name="check" size={11} /></span>}</div><span>{voice.role}</span><div className="voice-tags"><em>{voice.accent}</em><em>{voice.tone.split(' · ')[0]}</em></div></div>
    <div className="voice-actions"><button className={`play-voice ${playing ? 'playing' : ''}`} onClick={e => { e.stopPropagation(); onPlay(voice.id) }} aria-label={`Preview ${voice.name}`}><Icon name={playing ? 'pause' : 'play'} size={13} /></button><Waveform voice={voice} active={selected} small /></div>
  </div>
}

function VoiceSection({ selectedVoice, setSelectedVoice, narration, setNarration }) {
  const [playingVoice, setPlayingVoice] = useState(null)
  const [query, setQuery] = useState('')
  const visibleVoices = useMemo(() => VOICES.filter(v => `${v.name} ${v.role} ${v.accent}`.toLowerCase().includes(query.toLowerCase())), [query])
  useEffect(() => { if (!playingVoice) return; const timer = setTimeout(() => setPlayingVoice(null), 1800); return () => clearTimeout(timer) }, [playingVoice])
  return <section className="voice-section panel">
    <SectionHeader eyebrow="03 / narration" title="Give it a voice" note="Add a voiceover to make the moment feel intentional." action={<div className="voice-actions-header"><div className="search-field"><Icon name="search" size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search voices" /></div><button className="button secondary compact"><Icon name="plus" size={14} /> Clone voice</button></div>} />
    <div className="voice-subbar"><div className="voice-toggle"><span className="toggle on"><i /></span><span>Voiceover enabled</span></div><div className="voice-note"><Icon name="volume" size={14} /> This script becomes the audio track</div></div>
    <div className="voice-script-wrap"><div className="field-label"><label htmlFor="narration">Narration script</label><span>{narration.length} / 2,000</span></div><textarea id="narration" className="voice-script" value={narration} onChange={e => setNarration(e.target.value)} placeholder="Write what the selected voice should say…" /></div>
    <div className="voices-grid">{visibleVoices.map(voice => <VoiceCard key={voice.id} voice={voice} selected={selectedVoice === voice.id} playing={playingVoice === voice.id} onSelect={setSelectedVoice} onPlay={id => setPlayingVoice(playingVoice === id ? null : id)} />)}</div>
    <div className="voice-footer"><span>Showing {visibleVoices.length} of 24 voices</span><button className="text-button">Browse full library <Icon name="arrow" size={13} /></button></div>
  </section>
}

function PreviewCard({ imageSrc, videoUrl, prompt, rendering, progress, selectedVoice, duration }) {
  return <div className="preview-card panel">
    <div className="preview-header"><div><div className="eyebrow">Live preview</div><h3>{rendering ? 'Rendering your scene' : videoUrl ? 'Rendered video' : 'Motion preview'}</h3></div><div className={`preview-status ${rendering ? 'rendering' : 'ready'}`}><i /> {rendering ? `${progress}%` : videoUrl ? 'Video ready' : 'Preview ready'}</div></div>
    <div className={`preview-stage ${rendering ? 'is-rendering' : ''}`}>{videoUrl && !rendering ? <video className="preview-video" src={videoUrl} controls autoPlay loop playsInline /> : <img className="preview-image" src={imageSrc} alt="Motion preview" />}<div className="preview-vignette" /><div className="scanline" />{rendering && <div className="render-progress"><div className="render-spinner"><Icon name="sparkle" size={20} /></div><strong>Building movement</strong><span>Generating depth, light, and camera motion</span><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>}{!rendering && !videoUrl && <button className="preview-play"><Icon name="play" size={22} /></button>}<div className="preview-caption"><span>SCENE 01</span><strong>{selectedVoice ? `${VOICES.find(v => v.id === selectedVoice)?.name}'s voice` : 'No voice selected'}</strong></div></div>
    <div className="preview-timeline"><span>0:00</span><div className="timeline-track"><span className="timeline-fill" style={{ width: rendering ? `${Math.max(progress, 14)}%` : videoUrl ? '100%' : '31%' }} /><i style={{ left: rendering ? `${progress}%` : videoUrl ? '100%' : '31%' }} /></div><span>0:{duration.replace('s', '').padStart(2, '0')}</span></div>
    <div className="preview-meta"><div><span>Camera</span><strong>Slow push in</strong></div><div><span>Style</span><strong>Natural film grain</strong></div><div><span>Audio</span><strong>{selectedVoice ? 'Voice + ambience' : 'Add a voice'}</strong></div></div>
  </div>
}

function Storyboard({ selectedScene, setSelectedScene }) {
  return <section className="storyboard panel"><div className="storyboard-top"><div><div className="eyebrow">Story sequence</div><h3>Storyboard <span>3 scenes · 10 seconds</span></h3></div><button className="button secondary compact"><Icon name="plus" size={14} /> Add scene</button></div><div className="scene-list">{SCENES.map((scene, index) => <button key={scene.id} className={`scene-card ${selectedScene === scene.id ? 'selected' : ''}`} onClick={() => setSelectedScene(scene.id)}><div className="scene-thumb"><img src={scene.image} alt="" /><span>{index + 1}</span>{selectedScene === scene.id && <i className="scene-selected"><Icon name="check" size={10} /></i>}</div><div className="scene-copy"><div><strong>{scene.name}</strong><span>{scene.time}</span></div><p>{scene.caption}</p></div><Icon name="more" size={16} /></button>)}</div></section>
}

function ActivityCard({ rendering, progress, selectedVoice, onRender }) {
  return <div className="activity panel"><div className="activity-heading"><div><div className="eyebrow">Project health</div><h3>Ready to render</h3></div><span className="health-icon"><Icon name="check" size={16} /></span></div><div className="health-row"><span>Source image</span><strong className="good"><Icon name="check" size={13} /> Added</strong></div><div className="health-row"><span>Motion direction</span><strong className="good"><Icon name="check" size={13} /> Added</strong></div><div className="health-row"><span>Voiceover</span><strong className={selectedVoice ? 'good' : 'pending'}>{selectedVoice ? <><Icon name="check" size={13} /> Selected</> : 'Optional'}</strong></div><div className="activity-divider" /><div className="render-estimate"><div><span>Estimated render</span><strong>{rendering ? `${progress}% complete` : 'About 45 sec'}</strong></div><div className="estimate-orb"><Icon name="sparkle" size={15} /></div></div><button className="full-button" onClick={onRender} disabled={rendering}><Icon name="sparkle" size={15} /> {rendering ? 'Rendering in progress…' : 'Render this story'}</button></div>
}

function Toast({ toast }) { if (!toast) return null; return <div className="toast"><span className="toast-icon"><Icon name={toast.type === 'success' ? 'check' : 'sparkle'} size={14} /></span><div><strong>{toast.title}</strong><span>{toast.message}</span></div></div> }

export default function App() {
  const [activeNav, setActiveNav] = useState('studio')
  const [prompt, setPrompt] = useState('Slow cinematic push-in. Let the warm sunset light move across her face while the water glimmers softly in the background.')
  const [imageSrc, setImageSrc] = useState(`${ASSET_BASE}assets/hero-still.svg`)
  const [imageName, setImageName] = useState('sunset-portrait.jpg')
  const [imageFile, setImageFile] = useState(null)
  const [aspect, setAspect] = useState('9:16')
  const [duration, setDuration] = useState('10s')
  const [style, setStyle] = useState('cinematic')
  const [intensity, setIntensity] = useState(38)
  const [selectedVoice, setSelectedVoice] = useState('maya')
  const [narration, setNarration] = useState('Every image holds a moment. Give it room to move, and let the light tell the rest of the story.')
  const [selectedScene, setSelectedScene] = useState(1)
  const [rendering, setRendering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3600); return () => clearTimeout(timer) }, [toast])

  function showToast(title, message, type = 'success') { setToast({ title, message, type }) }
  function handlePickImage(url, name, file) { setImageSrc(url); setImageName(name || 'uploaded-image.jpg'); setImageFile(file || null); setVideoUrl(''); showToast('Image added', 'Your new source frame is ready to animate.') }
  async function getSourceFile() {
    if (imageFile) return imageFile
    const response = await fetch(imageSrc)
    const blob = await response.blob()
    return new File([blob], imageName || 'source-image.jpg', { type: blob.type || 'image/jpeg' })
  }
  async function pollRender(jobId) {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000))
      const job = await getRender(jobId)
      setProgress(job.progress || 0)
      if (job.status === 'completed') return job
      if (job.status === 'failed') throw new Error(job.error || 'Render failed')
    }
  }
  async function runRender() {
    if (rendering) return
    clearInterval(intervalRef.current)
    setRendering(true); setProgress(8); setVideoUrl('')
    if (!hasRenderApi) {
      let value = 8
      intervalRef.current = setInterval(() => {
        value += Math.round(Math.random() * 10) + 4
        if (value >= 100) { value = 100; clearInterval(intervalRef.current); setProgress(value); setTimeout(() => { setRendering(false); showToast('Demo render complete', 'Add VITE_API_URL to connect a real video provider.') }, 450) }
        setProgress(value)
      }, 380)
      return
    }
    try {
      const job = await createRender({ image: await getSourceFile(), prompt, narration, duration, aspect, style, intensity, voiceId: selectedVoice })
      const completed = await pollRender(job.jobId)
      setVideoUrl(completed.videoUrl)
      showToast('Video rendered', completed.message || 'Your video is ready to export.')
    } catch (error) {
      showToast('Render failed', error.message, 'error')
    } finally {
      setRendering(false)
    }
  }
  function handleDownload() {
    if (!videoUrl) return showToast('Nothing to export yet', 'Render the story first, then export the MP4.', 'error')
    const link = document.createElement('a'); link.href = videoUrl; link.download = 'frameforge-story.mp4'; link.target = '_blank'; link.click()
  }

  return <div className="app-shell">
    <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
    <div className="main-shell"><Topbar onRender={runRender} rendering={rendering} onDownload={handleDownload} />
      <main className="main-content">
        <div className="hero-row"><div><div className="eyebrow hero-eyebrow"><span className="live-dot" /> image to video studio</div><h1>Turn a still into a story<span className="period">.</span></h1><p className="hero-copy">Bring a single frame to life with directed motion, atmosphere, and a voice that feels human.</p></div><div className="hero-side"><div className="last-saved"><span>Last saved</span><strong>just now</strong></div><div className="avatar-stack"><span className="stack-avatar one">AM</span><span className="stack-avatar two">+</span></div></div></div>
        <div className="workspace-grid"><div className="workflow-column"><SourceCard imageSrc={imageSrc} imageName={imageName} onPickImage={handlePickImage} /><MotionControls prompt={prompt} setPrompt={setPrompt} aspect={aspect} setAspect={setAspect} duration={duration} setDuration={setDuration} style={style} setStyle={setStyle} intensity={intensity} setIntensity={setIntensity} /></div><div className="preview-column"><PreviewCard imageSrc={imageSrc} videoUrl={videoUrl} prompt={prompt} rendering={rendering} progress={progress} selectedVoice={selectedVoice} duration={duration} /><ActivityCard rendering={rendering} progress={progress} selectedVoice={selectedVoice} onRender={runRender} /></div></div>
        <VoiceSection selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} narration={narration} setNarration={setNarration} />
        <Storyboard selectedScene={selectedScene} setSelectedScene={setSelectedScene} />
        <div className="bottom-note"><span><Icon name="wand" size={14} /> Generated with Frameforge motion engine</span><span>All renders are private by default <Icon name="help" size={13} /></span></div>
      </main>
    </div>
    <Toast toast={toast} />
  </div>
}
