import fs from 'node:fs'

const p = 'src/data/simulations.ts'
let s = fs.readFileSync(p, 'utf8')
const ids = [...s.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1])
const missing = ids.filter((id) => !s.includes(`image: '/covers/${id}.svg'`))
console.log('missing', missing)

for (const id of missing) {
  const cover = `public/covers/${id}.svg`
  if (!fs.existsSync(cover)) {
    fs.writeFileSync(
      cover,
      `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="340" viewBox="0 0 520 340"><rect width="520" height="340" rx="18" fill="#922b21"/><text x="260" y="180" text-anchor="middle" fill="#fff" font-family="Arial" font-size="28" font-weight="700">${id}</text></svg>`,
    )
  }
  const re = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?accent:\\s*'[^']+',)(?!\\s*image:)`)
  s = s.replace(re, `$1\n    image: '/covers/${id}.svg',`)
}

fs.writeFileSync(p, s)
const still = ids.filter((id) => !fs.readFileSync(p, 'utf8').includes(`image: '/covers/${id}.svg'`))
console.log('still missing', still)
