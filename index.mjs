import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const generatedDir = path.join(__dirname, 'generated')
const port = Number(process.env.PORT || 8787)
const jobs = new Map()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

await mkdir(generatedDir, { recursive: true })

const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(value => value.trim()).filter(Boolean)
const app = express()
app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins }))
app.use(express.json({ limit: '1mb' }))
app.use('/generated', express.static(generatedDir, { maxAge: '1h' }))

function publicUrl(relativePath) {
  const base = (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, '')
  return `${base}/${relativePath.replace(/^\//, '')}`
}

function setJob(job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() })
  jobs.set(job.id, job)
}

function asAspect(value) {
  return ['9:16', '1:1', '16:9'].includes(value) ? value : '9:16'
}

function asSeconds(value) {
  const seconds = Number.parseInt(String(value || '10').replace('s', ''), 10)
  return Math.max(5, Math.min(15, Number.isFinite(seconds) ? seconds : 10))
}

function resolveVoiceId(requested) {
  const map = {
    maya: process.env.VOICE_MAYA_ID,
    jonah: process.env.VOICE_JONAH_ID,
    sora: process.env.VOICE_SORA_ID,
    luis: process.env.VOICE_LUIS_ID,
  }
  return map[requested] || (requested && requested.length > 10 ? requested : '')
}

function extractUrl(output) {
  if (typeof output === 'string') return output
  if (Array.isArray(output)) return output.find(item => typeof item === 'string') || ''
  if (output && typeof output.url === 'string') return output.url
  return ''
}

async function runwarePrediction({ imageDataUrl, prompt, aspect, seconds, style, intensity }) {
  const apiKey = process.env.RUNWARE_API_KEY
  if (!apiKey) throw new Error('RUNWARE_API_KEY is missing')

  const model = process.env.RUNWARE_MODEL || 'minimax:h3@max-turbo'
  const taskUUID = randomUUID()
  const request = [{
    taskType: 'videoInference',
    taskUUID,
    model,
    positivePrompt: `${prompt}. ${style} visual style. Motion intensity: ${intensity} percent. Use the supplied image as the first frame.`,
    inputs: { frameImages: [{ image: imageDataUrl, frame: 'first' }] },
    resolution: process.env.RUNWARE_RESOLUTION || '480p',
    duration: seconds,
    outputType: 'URL',
    deliveryMethod: 'async',
    numberResults: 1,
    includeCost: true,
  }]

  const createResponse = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const created = await createResponse.json()
  if (!createResponse.ok || created.errors?.length) {
    throw new Error(created.errors?.[0]?.message || 'Runware could not start the prediction')
  }

  const deadline = Date.now() + 15 * 60 * 1000
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 4000))
    const pollResponse = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ taskType: 'getResponse', taskUUID }]),
    })
    const result = await pollResponse.json()
    if (!pollResponse.ok || result.errors?.length) {
      throw new Error(result.errors?.[0]?.message || 'Runware polling failed')
    }
    const task = [...(result.data || [])].reverse().find(item => item.taskUUID === taskUUID)
    if (!task || task.status === 'processing') continue
    if (task.status === 'error') throw new Error(task.error?.message || 'Runware video generation failed')
    if (task.status === 'success') {
      if (!task.videoURL) throw new Error('Runware returned no video URL')
      return { url: task.videoURL, cost: task.cost }
    }
  }
  throw new Error('Runware video generation timed out')
}

async function makeVoiceover({ text, voiceKey, jobId }) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = resolveVoiceId(voiceKey)
  if (!apiKey || !voiceId || !text?.trim()) return null

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
    }),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(`ElevenLabs error: ${message.slice(0, 240)}`)
  }
  const audioPath = path.join(generatedDir, `${jobId}.voice.mp3`)
  await writeFile(audioPath, Buffer.from(await response.arrayBuffer()))
  return audioPath
}

async function downloadTo(url, destination) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not download generated video (${response.status})`)
  await writeFile(destination, Buffer.from(await response.arrayBuffer()))
}

async function muxAudio(videoPath, audioPath, finalPath) {
  if (!ffmpegPath) throw new Error('ffmpeg is not available on this server')
  await execFileAsync(ffmpegPath, [
    '-y', '-i', videoPath, '-i', audioPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-shortest', finalPath,
  ], { timeout: 180000 })
}

async function processJob(job, request) {
  try {
    setJob(job, { status: 'processing', progress: 10, message: 'Preparing source image' })
    const [targetWidth, targetHeight] = request.aspect === '9:16' ? [480, 854] : request.aspect === '1:1' ? [480, 480] : [854, 480]
    const jpeg = await sharp(request.image).resize(targetWidth, targetHeight, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer()
    const imageDataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`
    setJob(job, { progress: 18, message: 'Sending image and prompt to video model' })

    const prediction = await runwarePrediction({
      imageDataUrl,
      prompt: request.prompt,
      aspect: asAspect(request.aspect),
      seconds: asSeconds(request.duration),
      style: request.style || 'cinematic',
      intensity: request.intensity || '38',
    })
    if (!prediction?.url) throw new Error('The video model returned no video URL')
    const videoUrl = prediction.url
    setJob(job, { progress: 76, message: 'Video generated; preparing voiceover', sourceVideoUrl: videoUrl, cost: prediction.cost })

    const rawVideoPath = path.join(generatedDir, `${job.id}.raw.mp4`)
    const finalVideoPath = path.join(generatedDir, `${job.id}.mp4`)
    await downloadTo(videoUrl, rawVideoPath)

    let audioPath = null
    try {
      audioPath = await makeVoiceover({ text: request.narration, voiceKey: request.voiceId, jobId: job.id })
    } catch (voiceError) {
      setJob(job, { message: `Video ready; voiceover skipped: ${voiceError.message}` })
    }

    if (audioPath) {
      setJob(job, { progress: 88, message: 'Mixing selected voice into video' })
      await muxAudio(rawVideoPath, audioPath, finalVideoPath)
      await unlink(rawVideoPath).catch(() => {})
      await unlink(audioPath).catch(() => {})
    } else {
      await writeFile(finalVideoPath, await readFile(rawVideoPath))
      await unlink(rawVideoPath).catch(() => {})
    }

    setJob(job, {
      status: 'completed',
      progress: 100,
      message: audioPath ? 'Video and voiceover are ready' : 'Video is ready; configure ElevenLabs for voiceover',
      videoUrl: publicUrl(`generated/${job.id}.mp4`),
    })
  } catch (error) {
    console.error(`[render ${job.id}]`, error)
    setJob(job, { status: 'failed', progress: 0, error: error.message || 'Render failed', message: 'Render failed' })
  }
}

app.get('/health', (_req, res) => res.json({
  status: 'ok',
  videoProvider: process.env.RUNWARE_API_KEY ? `runware:${process.env.RUNWARE_MODEL || 'minimax:h3@max-turbo'}` : 'not configured',
  voiceProvider: process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'not configured',
}))

app.post('/api/render', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'An image file is required' })
  if (!req.body.prompt?.trim()) return res.status(400).json({ error: 'A motion prompt is required' })

  const job = {
    id: randomUUID(),
    status: 'queued',
    progress: 4,
    message: 'Render queued',
    createdAt: new Date().toISOString(),
  }
  jobs.set(job.id, job)
  processJob(job, {
    image: req.file.buffer,
    prompt: req.body.prompt,
    narration: req.body.narration,
    duration: req.body.duration,
    aspect: req.body.aspect,
    style: req.body.style,
    intensity: req.body.intensity,
    voiceId: req.body.voiceId,
  })
  return res.status(202).json({ jobId: job.id, status: job.status })
})

app.get('/api/render/:id', (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) return res.status(404).json({ error: 'Render job not found' })
  return res.json(job)
})

app.listen(port, () => console.log(`Frameforge render API listening on :${port}`))
