import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ActivityCallout,
  Checkbox,
  ClassifyDropZone,
  HotspotLabel,
  KeyPointsCard,
  ReadoutBadge,
  Slider,
  StepperScrubber,
  ToggleSwitch,
} from '../index'
import '../../app/gs8.css'

/** Isolated UI playground — no real curriculum sim required. */
export function Gs8UiPlaygroundPage() {
  const [slider, setSlider] = useState(40)
  const [on, setOn] = useState(true)
  const [checked, setChecked] = useState(false)
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hot, setHot] = useState('A')
  const [dropped, setDropped] = useState<string[]>([])

  return (
    <div className="gs8-library" style={{ maxWidth: 720 }}>
      <p>
        <Link to="/gs8">← GS8 library</Link>
      </p>
      <h1>UI playground</h1>
      <p>Sanity-check shared primitives without a full simulation.</p>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <Slider label="Demo slider" value={slider} min={0} max={100} onChange={setSlider} unit="%" />
        <ToggleSwitch label="Demo toggle" checked={on} onChange={setOn} />
        <Checkbox label="Demo checkbox" checked={checked} onChange={setChecked} />
        <ReadoutBadge label="Live value" value={`${slider}`} />
        <ActivityCallout title="Activity X.X">Callout styled like the book.</ActivityCallout>
        <HotspotLabel label="Region A" active={hot === 'A'} onClick={() => setHot('A')} />
        <HotspotLabel label="Region B" active={hot === 'B'} onClick={() => setHot('B')} />
        <StepperScrubber
          stageIndex={stage}
          stageLabels={['One', 'Two', 'Three']}
          playing={playing}
          onPlayPause={() => setPlaying((p) => !p)}
          onStep={(d) => setStage((s) => Math.max(0, Math.min(2, s + d)))}
          onSelect={setStage}
        />
        <ClassifyDropZone label="Drop zone" onDropId={(id) => setDropped((d) => [...d, id])}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Dropped: {dropped.join(', ') || 'none'}</p>
        </ClassifyDropZone>
        <KeyPointsCard points={['Shared primitives live in /src/ui', 'Shell chrome lives in /src/shell']} />
      </div>
    </div>
  )
}
