# Flocking Simulations: Non-Reciprocal Dynamics & Selective Attention

An interactive web-based collective animal behavior simulation comparing modern non-reciprocal and selective-attention interaction theories with classic flocking models in continuous 2D space.

## Features

- **Most Influential Neighbor Model (Kang et al., *PRX LIFE* 2026)**
  - Implements the selective attention mechanism where animals prevent sensory overload by responding strictly to their top $k$ most influential neighbor(s) ($I_{ij} = \sqrt{F_\parallel^2 + F_\perp^2}$).
  - Live interactive hover shows real-time dynamic switching of the primary influencer via golden target beams.
  - DOI: [10.1103/18qw-sfyd](https://doi.org/10.1103/18qw-sfyd)

- **Non-Reciprocal Vision Cone Model (Shi et al., *Nature Physics* 2026)**
  - Implements asymmetric forward vision cones ($2\Psi$) that produce non-reciprocal torques, spontaneous V-formation flocking, and parity-time symmetry breaking.
  - DOI: [10.1038/s41567-026-03317-0](https://doi.org/10.1038/s41567-026-03317-0)

- **Classic Boids (Reynolds 1987)**
  - Omnidirectional $360^\circ$ reciprocal steering (Alignment, Cohesion, Separation).
  - DOI: [10.1145/37401.37406](https://doi.org/10.1145/37401.37406)

- **Real-Time Order Parameter Charting**
  - Plots polarization $P(t) = \frac{1}{N} \|\sum_i \mathbf{e}_i(t)\|$ continuously on an embedded glow chart.

- **Visual Modes & Controls**
  - Clean Fullscreen presentation mode (press `F` or double-click).
  - Dynamic trajectory trails and persistent canvas heat-mapping ("Infinite Trails").
  - Spatial hash grid optimization for smooth $O(N)$ real-time performance at 60 FPS.

## Running Locally

Simply serve the folder using any static web server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node / npx
npx serve .
```

Open `http://localhost:8000` in your browser.
