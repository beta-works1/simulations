/**
 * Wire titles into Ch9–12 SimShell usages + themed clearCanvas calls.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src/simulations')

const titles = {
  'laws-of-reflection': {
    title: 'Laws of Reflection',
    subtitle: 'Angle of incidence equals angle of reflection',
  },
  'regular-vs-diffuse': {
    title: 'Regular vs Diffuse Reflection',
    subtitle: 'Smooth surfaces vs rough scatter',
  },
  'plane-mirror-periscope': {
    title: 'Plane Mirror & Periscope',
    subtitle: 'Virtual images and two-mirror sight lines',
  },
  'refraction-media': {
    title: 'Refraction Through Media',
    subtitle: 'Light bending with Snell’s law',
  },
  'rainbow-dispersion': {
    title: 'Rainbow Formation',
    subtitle: 'Dispersion of white light in a droplet',
  },
  'curved-mirrors': {
    title: 'Concave & Convex Mirrors',
    subtitle: 'Image type changes with object distance',
  },
  'ohm-law-circuit': {
    title: "Ohm's Law Circuit",
    subtitle: 'Voltage, current, and resistance together',
  },
  'series-parallel': {
    title: 'Series vs Parallel Circuits',
    subtitle: 'Compare current paths and brightness',
  },
  'short-circuit-fuse': {
    title: 'Short Circuit & Fuse',
    subtitle: 'Overload protection in action',
  },
  'electric-motor': {
    title: 'Electric Motor',
    subtitle: 'Current in a magnetic field produces torque',
  },
  'speaker-mechanism': {
    title: 'Speaker Mechanism',
    subtitle: 'Oscillating coil drives sound waves',
  },
  'solar-cooker': {
    title: 'Solar Cooker',
    subtitle: 'Focus sunlight to raise pot temperature',
  },
  'wind-turbine': {
    title: 'Wind Turbine',
    subtitle: 'Wind energy to mechanical to electrical',
  },
  'star-life-cycle': {
    title: 'Star Life Cycle',
    subtitle: 'From nebula to remnant stages',
  },
  'galaxy-types': {
    title: 'Galaxy Types',
    subtitle: 'Spiral, elliptical, and irregular',
  },
  'black-hole': {
    title: 'Black Hole & Light Bending',
    subtitle: 'Collapse, horizon, and curved light paths',
  },
  'solar-system-timeline': {
    title: 'Solar System Timeline',
    subtitle: 'Cosmic time and exploration milestones',
  },
}

const themeByFolder = {
  'laws-of-reflection': 'optics',
  'regular-vs-diffuse': 'optics',
  'plane-mirror-periscope': 'optics',
  'refraction-media': 'optics',
  'rainbow-dispersion': 'optics',
  'curved-mirrors': 'optics',
}

for (const [folder, meta] of Object.entries(titles)) {
  const dir = path.join(root, folder)
  if (!fs.existsSync(dir)) continue
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.tsx')) continue
    const fp = path.join(dir, file)
    let src = fs.readFileSync(fp, 'utf8')
    if (!src.includes('<SimShell')) continue
    if (!src.includes('title=')) {
      src = src.replace(
        /<SimShell(\s+)/,
        `<SimShell\n      title="${meta.title}"\n      subtitle="${meta.subtitle}"$1`,
      )
      fs.writeFileSync(fp, src)
      console.log('titled', folder, file)
    }
  }

  const model = path.join(dir, 'model.ts')
  if (fs.existsSync(model) && themeByFolder[folder]) {
    let m = fs.readFileSync(model, 'utf8')
    const theme = themeByFolder[folder]
    if (m.includes('clearCanvas(ctx, w, h)') && !m.includes(`clearCanvas(ctx, w, h, '`)) {
      m = m.replaceAll('clearCanvas(ctx, w, h)', `clearCanvas(ctx, w, h, '${theme}')`)
      fs.writeFileSync(model, m)
      console.log('themed clear', folder)
    }
  }
}

console.log('done')
