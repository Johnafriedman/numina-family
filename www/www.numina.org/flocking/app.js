// Spatial Partitioning Grid for O(N) boid neighbor lookup
class SpatialHashGrid {
  constructor(width, height, cellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  // Hash function for cell coordinate
  _hash(x, y) {
    const col = Math.floor((x + this.width) % this.width / this.cellSize);
    const row = Math.floor((y + this.height) % this.height / this.cellSize);
    return `${col},${row}`;
  }

  insert(boid) {
    const key = this._hash(boid.x, boid.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(boid);
  }

  // Retrieve boids in own cell and 8 neighboring cells
  getNeighbors(boid) {
    const neighbors = [];
    const colBase = Math.floor((boid.x + this.width) % this.width / this.cellSize);
    const rowBase = Math.floor((boid.y + this.height) % this.height / this.cellSize);

    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        // Handle wrapping boundaries
        const col = (colBase + dc + this.cols) % this.cols;
        const row = (rowBase + dr + this.rows) % this.rows;
        const key = `${col},${row}`;
        const cell = this.grid.get(key);
        if (cell) {
          neighbors.push(...cell);
        }
      }
    }
    return neighbors;
  }
}

// Box-Muller transform for generating Gaussian random variables
function randomGaussian() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// A high-performance, glow-effect real-time canvas chart
class RealTimeChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.dataHistory = []; // Array of arrays for multiple lines
    this.labels = [];
    this.colors = ['#00f2fe', '#ff007f', '#7f00ff'];
    this.maxDataPoints = 300;
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  addData(values) {
    this.dataHistory.push(values);
    if (this.dataHistory.length > this.maxDataPoints) {
      this.dataHistory.shift();
    }
    this.draw();
  }

  clear() {
    this.dataHistory = [];
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.dataHistory.length === 0) return;

    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 20;
    const chartWidth = this.width - paddingLeft - paddingRight;
    const chartHeight = this.height - paddingTop - paddingBottom;

    // Draw grid background lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = paddingTop + (chartHeight * i / gridLines);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(this.width - paddingRight, y);
      ctx.stroke();

      // Y-axis labels (ranges 0 to 1)
      ctx.fillStyle = '#64748b';
      ctx.font = '9px "JetBrains Mono"';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const labelVal = (1.0 - (i / gridLines)).toFixed(1);
      ctx.fillText(labelVal, paddingLeft - 8, y);
    }

    // Draw lines for each series
    const numSeries = this.dataHistory[0].length;
    for (let s = 0; s < numSeries; s++) {
      ctx.strokeStyle = this.colors[s % this.colors.length];
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      // Shadow glow effect
      ctx.shadowColor = this.colors[s % this.colors.length];
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.beginPath();
      for (let i = 0; i < this.dataHistory.length; i++) {
        const val = this.dataHistory[i][s];
        const x = paddingLeft + (chartWidth * i / (this.maxDataPoints - 1));
        const y = paddingTop + chartHeight - (chartHeight * val);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Reset shadow values for next draw calls
    ctx.shadowBlur = 0;
  }
}

// Boid Class definition
class Boid {
  constructor(x, y, theta) {
    this.x = x;
    this.y = y;
    this.theta = theta;
    this.trail = [];
    this.topNeighbors = [];
  }
}

// Simulation Coordinator
class Simulation {
  constructor() {
    this.canvas = document.getElementById('simCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Create persistent trails canvas for Infinite Trails (no erasing)
    this.trailCanvas = document.createElement('canvas');
    this.trailCtx = this.trailCanvas.getContext('2d');
    
    // Setup state variables
    this.isPaused = false;
    this.drawCones = true;
    this.fps = 0;
    this.lastFpsUpdate = 0;
    this.framesThisSecond = 0;
    
    // UI elements references
    this.fpsVal = document.getElementById('val-fps');
    this.primaryMetricVal = document.getElementById('val-primary-metric');
    this.primaryMetricLabel = document.getElementById('stat-primary-label');
    this.activeParticlesVal = document.getElementById('val-active-particles');
    this.playPauseBtn = document.getElementById('btn-play-pause');
    this.infoPanel = document.getElementById('infoPanel');
    
    // Interaction states
    this.mouse = { x: null, y: null };
    this.selectedBoid = null;
    
    // Set up canvas sizing
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      if (this.chart) this.chart.resize();
    });

    // Initialize metrics chart
    this.chart = new RealTimeChart('chartCanvas');
    
    // Bind mouse events
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
      this.selectedBoid = null;
    });

    // Initialize parameters and event listeners
    this.initParams();
    this.bindEvents();
    
    // Set initial simulation mode
    this.resetSimulation();
    
    // Start main game loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;

    // Sync trailCanvas size
    if (this.trailCanvas) {
      this.trailCanvas.width = this.canvas.width;
      this.trailCanvas.height = this.canvas.height;
      this.trailCtx.scale(dpr, dpr);
    }
  }

  initParams() {
    this.boidsParams = {
       count: 150,
       visionAngle: 120, // degrees
       alignment: 1.5,
       noise: 0.10,
       speed: 2.0,
       repulsion: 1.0,
       radius: 40,      // interaction distance
       repRadius: 15,   // repulsion distance
       trailsEnabled: true,
       trailLength: 15,
       infiniteTrails: false,
       modelType: 'vision',
       cohesion: 1.0,
       kInfluential: 1
    };
  }

  bindEvents() {
    // Control parameters bindings
    const bindSlider = (id, paramObj, key, callback) => {
      const slider = document.getElementById(id);
      const label = document.getElementById(`lbl-${id.substring(6)}`);
      slider.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        paramObj[key] = val;
        if (label) {
          if (id.includes('angle')) {
            label.innerHTML = `${val}&deg;`;
          } else if (id.includes('grid')) {
            label.innerHTML = `${val} &times; ${val}`;
          } else if (id.includes('count') || id.includes('length') || id.endsWith('-k')) {
            label.innerHTML = `${Math.round(val)}`;
          } else {
            label.innerHTML = val.toFixed(2);
          }
        }
        if (callback) callback(val);
      });
    };

    // Bind Boids Sliders
    bindSlider('param-boid-count', this.boidsParams, 'count', () => this.resetSimulation());
    bindSlider('param-boid-vision-angle', this.boidsParams, 'visionAngle');
    bindSlider('param-boid-alignment', this.boidsParams, 'alignment');
    bindSlider('param-boid-cohesion', this.boidsParams, 'cohesion');
    bindSlider('param-boid-k', this.boidsParams, 'kInfluential');
    bindSlider('param-boid-noise', this.boidsParams, 'noise');
    bindSlider('param-boid-speed', this.boidsParams, 'speed');
    bindSlider('param-boid-repulsion', this.boidsParams, 'repulsion');
    bindSlider('param-boid-trail-length', this.boidsParams, 'trailLength');

    document.getElementById('param-boid-model-type').addEventListener('change', (e) => {
      this.boidsParams.modelType = e.target.value;
      this.syncModelUI();
      this.resetSimulation();
    });

    document.getElementById('toggle-boid-trails').addEventListener('change', (e) => {
      this.boidsParams.trailsEnabled = e.target.checked;
      if (!e.target.checked) {
        for (const b of this.boids) {
          b.trail = [];
        }
        if (this.trailCtx) {
          this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        }
      }
    });

    document.getElementById('toggle-boid-infinite-trails').addEventListener('change', (e) => {
      this.boidsParams.infiniteTrails = e.target.checked;
      if (this.trailCtx) {
        this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
      }
      const lengthSlider = document.getElementById('param-boid-trail-length');
      if (lengthSlider) {
        lengthSlider.disabled = e.target.checked;
        lengthSlider.parentElement.style.opacity = e.target.checked ? '0.4' : '1';
      }
    });

    // Sidebar Play/Pause & Reset buttons
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    document.getElementById('btn-reset').addEventListener('click', () => this.resetSimulation());
    
    // Canvas Quick Overlay buttons
    document.getElementById('btn-pause-canvas').addEventListener('click', () => this.togglePlayPause());
    document.getElementById('btn-reset-canvas').addEventListener('click', () => this.resetSimulation());

    // Toggle vision cones checkbox
    document.getElementById('toggle-vision-cones').addEventListener('change', (e) => {
      this.drawCones = e.target.checked;
    });

    // Fullscreen control bindings
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
       this.toggleFullscreen();
    });

    this.canvas.addEventListener('dblclick', () => {
      this.toggleFullscreen();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        this.toggleFullscreen();
      }
    });

    const handleFS = () => {
      const doc = document;
      const isFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      const container = document.getElementById('canvasContainer');
      if (isFS) {
        container.classList.add('fullscreen-active');
      } else {
        container.classList.remove('fullscreen-active');
      }
      this.resizeCanvas();
      setTimeout(() => this.resizeCanvas(), 150);
      setTimeout(() => this.resizeCanvas(), 300);
      setTimeout(() => this.resizeCanvas(), 600);
    };

    document.addEventListener('fullscreenchange', handleFS);
    document.addEventListener('webkitfullscreenchange', handleFS);
    document.addEventListener('mozfullscreenchange', handleFS);
    document.addEventListener('MSFullscreenChange', handleFS);
  }

  syncModelUI() {
    const model = this.boidsParams.modelType;
    const cohesionRow = document.getElementById('row-boid-cohesion');
    const cohesionTitle = document.getElementById('title-boid-cohesion');
    const kRow = document.getElementById('row-boid-k');
    const paperBadge = document.getElementById('paper-badge');

    if (kRow) {
      kRow.style.display = (model === 'influential') ? 'flex' : 'none';
    }

    if (cohesionRow) {
      cohesionRow.style.display = (model === 'classic' || model === 'influential') ? 'flex' : 'none';
      if (cohesionTitle) {
        cohesionTitle.innerText = (model === 'influential') ? 'Attraction Strength (γ)' : 'Cohesion Strength';
      }
    }

    if (paperBadge) {
      if (model === 'influential') {
        paperBadge.href = 'https://doi.org/10.1103/18qw-sfyd';
        paperBadge.innerText = 'Kang et al. PRX Life (2026)';
      } else if (model === 'classic') {
        paperBadge.href = 'https://doi.org/10.1145/37401.37406';
        paperBadge.innerText = 'Reynolds SIGGRAPH (1987)';
      } else {
        paperBadge.href = 'https://doi.org/10.1038/s41567-026-03317-0';
        paperBadge.innerText = 'Shi et al. Nature Phys (2026)';
      }
    }

    this.updateInfoPanel();
  }

  updateInfoPanel() {
    const model = this.boidsParams.modelType;
    if (model === 'influential') {
      this.infoPanel.innerHTML = `
        <strong>Most Influential Neighbor (PRX Life 2026):</strong>
        <p style="margin-top: 6px; color: var(--text-secondary);">
          Based on Kang et al., <em>PRX Life</em> 4, 043007 (2026). Rather than averaging across all visible neighbors, each individual ranks pairwise visual interactions by instantaneous influence magnitude <em>I<sub>ij</sub></em> (&radic;(F<sub>&parallel;</sub><sup>2</sup> + F<sub>&perp;</sub><sup>2</sup>)) and responds strictly to its <strong>top k</strong> most influential neighbor(s).
        </p>
        <p style="margin-top: 4px; color: var(--text-muted); font-size: 0.8rem;">
          Hover over any bird to see its vision cone and its currently selected top influencer highlighted in gold.
        </p>
      `;
    } else if (model === 'classic') {
      this.infoPanel.innerHTML = `
        <strong>Classic Boids (Reynolds 1987):</strong>
        <p style="margin-top: 6px; color: var(--text-secondary);">
          Omnidirectional reciprocal flocking model based on three heuristic steering behaviors: <strong>Alignment</strong> (matching average neighbor heading), <strong>Cohesion</strong> (steering toward local center of mass), and <strong>Separation</strong> (short-range repulsion).
        </p>
        <p style="margin-top: 4px; color: var(--text-muted); font-size: 0.8rem;">
          Hover over any boid to inspect its interaction radius.
        </p>
      `;
    } else {
      this.infoPanel.innerHTML = `
        <strong>Non-Reciprocal Vision Cone (Shi et al., 2026):</strong>
        <p style="margin-top: 6px; color: var(--text-secondary);">
          Self-propelled birds flying in continuous 2D space. Non-reciprocal alignment interactions are restricted to forward visual cones (2&Psi;), producing parity-time symmetry breaking and non-reciprocal torque dynamics.
        </p>
        <p style="margin-top: 4px; color: var(--text-muted); font-size: 0.8rem;">
          Hover over any bird to inspect its active vision cone and interacting partners.
        </p>
      `;
    }
  }

  togglePlayPause() {
    this.isPaused = !this.isPaused;
    this.playPauseBtn.innerHTML = this.isPaused ? 'Play' : 'Pause';
    this.playPauseBtn.classList.toggle('btn-primary', this.isPaused);
    document.getElementById('btn-pause-canvas').innerHTML = this.isPaused ? 'Play' : 'Pause';
  }

  toggleFullscreen() {
    const container = document.getElementById('canvasContainer');
    const doc = document;
    const db = container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen;
    const ab = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
    const isFS = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    if (!isFS) {
      if (db) {
        db.call(container).catch(err => {
          console.error(`Fullscreen failed: ${err.message}`);
        });
      }
    } else {
      if (ab) {
        ab.call(doc);
      }
    }
  }

  resetSimulation() {
    this.chart.clear();
    if (this.trailCtx) {
      this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
    }
    
    this.primaryMetricLabel.innerHTML = 'Polarization: <strong id="val-primary-metric">0.00</strong>';
    this.primaryMetricVal = document.getElementById('val-primary-metric');
    document.getElementById('chart-title-text').innerText = 'Polarization (Flock Alignment)';
    this.syncModelUI();
    this.initBoids();
  }

  // --- MODE 1: FLOCKING BOIDS ---
  initBoids() {
    this.boids = [];
    const count = this.boidsParams.count;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const theta = Math.random() * Math.PI * 2;
      this.boids.push(new Boid(x, y, theta));
    }
    this.spatialGrid = new SpatialHashGrid(this.width, this.height, this.boidsParams.radius);
    this.activeParticlesVal.innerText = count;
  }

  updateBoids(dt) {
    if (this.isPaused) return;

    const J = this.boidsParams.alignment;
    const T = this.boidsParams.noise;
    const speed = this.boidsParams.speed;
    const repStrength = this.boidsParams.repulsion;
    const R = this.boidsParams.radius;
    const R_rep = this.boidsParams.repRadius;
    const halfPsi = (this.boidsParams.visionAngle / 2) * (Math.PI / 180);

    // Build spatial partitioning hash grid
    this.spatialGrid.clear();
    for (const b of this.boids) {
      this.spatialGrid.insert(b);
    }

    // Keep track of next state to avoid order bias in step updates
    const nextThetas = new Array(this.boids.length);
    const nextPositions = new Array(this.boids.length);

    for (let i = 0; i < this.boids.length; i++) {
      const b = this.boids[i];
      let torqueAlign = 0;
      let torqueCoh = 0;
      let torqueSocial = 0;
      
      let sumCos = 0;
      let sumSin = 0;
      let sumDx = 0;
      let sumDy = 0;
      let neighborsCount = 0;
      
      // Repulsion force vector (Separation)
      let repForceX = 0;
      let repForceY = 0;
      let neighborsInRep = 0;

      // Candidate list for Influential Neighbor ranking
      const candidates = [];

      // Get spatial grid neighbors (much faster than O(N^2))
      const cellNeighbors = this.spatialGrid.getNeighbors(b);

      for (const n of cellNeighbors) {
        if (n === b) continue;

        // Vector from b to n (with periodic boundaries)
        let dx = n.x - b.x;
        let dy = n.y - b.y;
        if (dx > this.width / 2) dx -= this.width;
        else if (dx < -this.width / 2) dx += this.width;
        if (dy > this.height / 2) dy -= this.height;
        else if (dy < -this.height / 2) dy += this.height;

        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < R) {
          // Calculate heading to neighbor
          const psi_ij = Math.atan2(dy, dx);
          
          // Angle difference between heading and neighbor direction
          let dpsi = psi_ij - b.theta;
          // Normalize to [-PI, PI]
          dpsi = Math.atan2(Math.sin(dpsi), Math.cos(dpsi));

          if (this.boidsParams.modelType === 'vision') {
            // If neighbor lies within the vision cone
            if (Math.abs(dpsi) <= halfPsi) {
              torqueAlign += -J * Math.sin(b.theta - n.theta);
            }
          } else if (this.boidsParams.modelType === 'influential') {
            // Most Influential Neighbor model (Kang et al. PRX Life 2026)
            if (Math.abs(dpsi) <= halfPsi) {
              let dtheta = n.theta - b.theta;
              dtheta = Math.atan2(Math.sin(dtheta), Math.cos(dtheta));
              
              // Alignment force component (Eq. 12)
              const fAli = J * Math.sin(dtheta);
              
              // Attraction force component (Eq. 11, 12):
              const attStrength = this.boidsParams.cohesion;
              const fAtt = (dist > R_rep) ? attStrength * ((dist - R_rep) / (R - R_rep)) : 0;
              
              // Longitudinal and lateral social acceleration components (Eqs. 11 & 12)
              const fParallel = fAtt * Math.cos(dpsi);
              const fPerp = fAtt * Math.sin(dpsi) + fAli;
              
              // Instantaneous influence magnitude I_ij (Eq. 14 in 2D)
              const influence = Math.sqrt(fParallel * fParallel + fPerp * fPerp);
              
              candidates.push({
                neighbor: n,
                dx: dx,
                dy: dy,
                dist: dist,
                dpsi: dpsi,
                fPerp: fPerp,
                fParallel: fParallel,
                influence: influence
              });
            }
          } else {
            // Classic Boids: full 360 degree vision
            sumCos += Math.cos(n.theta);
            sumSin += Math.sin(n.theta);
            sumDx += dx;
            sumDy += dy;
            neighborsCount++;
          }

          // Short-range repulsion steering (repel outwards)
          if (dist < R_rep && dist > 0.01) {
            const force = (1.0 - dist / R_rep);
            repForceX -= (dx / dist) * force;
            repForceY -= (dy / dist) * force;
            neighborsInRep++;
          }
        }
      }

      if (this.boidsParams.modelType === 'influential') {
        // Rank candidates by instantaneous influence magnitude I_ij (Eq. 14)
        candidates.sort((c1, c2) => c2.influence - c1.influence);
        const k = Math.max(1, Math.min(candidates.length, Math.round(this.boidsParams.kInfluential)));
        const topK = candidates.slice(0, k);
        b.topNeighbors = topK.map(c => c.neighbor);

        // Sum lateral steering torque over the top k most influential neighbors (Eq. 12)
        for (const c of topK) {
          torqueSocial += c.fPerp;
        }
      } else if (this.boidsParams.modelType === 'classic' && neighborsCount > 0) {
        // Alignment steering
        const theta_avg = Math.atan2(sumSin, sumCos);
        torqueAlign = -J * Math.sin(b.theta - theta_avg);

        // Cohesion steering (towards center of mass)
        const theta_coh = Math.atan2(sumDy, sumDx);
        torqueCoh = -this.boidsParams.cohesion * Math.sin(b.theta - theta_coh);
      }

      // Repulsion steering torque
      let torqueRep = 0;
      if (neighborsInRep > 0 && repStrength > 0) {
        const theta_rep = Math.atan2(repForceY, repForceX);
        let drep = theta_rep - b.theta;
        drep = Math.atan2(Math.sin(drep), Math.cos(drep));
        torqueRep = -repStrength * Math.sin(b.theta - theta_rep);
      }

      // Angular Langevin update: dTheta = (Torque) * dt + noise
      const totalTorque = torqueAlign + torqueRep + torqueCoh + torqueSocial;
      const noiseTerm = Math.sqrt(2.0 * T * dt) * randomGaussian();
      
      let nextTheta = b.theta + totalTorque * dt + noiseTerm;
      // Wrap theta to [0, 2PI]
      nextTheta = (nextTheta + Math.PI * 2) % (Math.PI * 2);

      // Position Euler update
      let nextX = b.x + speed * Math.cos(b.theta) * (dt * 30); // scale dt slightly for visual speed
      let nextY = b.y + speed * Math.sin(b.theta) * (dt * 30);

      // Periodic boundary wrapping
      if (nextX < 0) nextX += this.width;
      else if (nextX >= this.width) nextX -= this.width;
      if (nextY < 0) nextY += this.height;
      else if (nextY >= this.height) nextY -= this.height;

      nextThetas[i] = nextTheta;
      nextPositions[i] = { x: nextX, y: nextY };
    }

    // Apply updates
    for (let i = 0; i < this.boids.length; i++) {
      const b = this.boids[i];
      const nextX = nextPositions[i].x;
      const nextY = nextPositions[i].y;

      if (this.boidsParams.trailsEnabled) {
        if (this.boidsParams.infiniteTrails) {
          // Draw segment to persistent trailCtx (no erasing)
          const dx = Math.abs(nextX - b.x);
          const dy = Math.abs(nextY - b.y);
          if (dx < this.width / 2 && dy < this.height / 2) {
            const hue = Math.round((b.theta / (Math.PI * 2)) * 360);
            this.trailCtx.strokeStyle = `hsla(${hue}, 85%, 60%, 0.15)`;
            this.trailCtx.lineWidth = 1.5;
            this.trailCtx.beginPath();
            this.trailCtx.moveTo(b.x, b.y);
            this.trailCtx.lineTo(nextX, nextY);
            this.trailCtx.stroke();
          }
        } else {
          b.trail.push({ x: b.x, y: b.y });
          while (b.trail.length > this.boidsParams.trailLength) {
            b.trail.shift();
          }
        }
      }
      b.theta = nextThetas[i];
      b.x = nextX;
      b.y = nextY;
    }
  }

  drawBoids() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw trails if enabled
    if (this.boidsParams.trailsEnabled) {
      if (this.boidsParams.infiniteTrails) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(this.trailCanvas, 0, 0);
        ctx.restore();
      } else {
        for (const b of this.boids) {
          if (b.trail.length < 2) continue;
          const hue = Math.round((b.theta / (Math.PI * 2)) * 360);
          
          for (let k = 1; k < b.trail.length; k++) {
            const p1 = b.trail[k - 1];
            const p2 = b.trail[k];
            
            // Detect wrap-around and don't draw line across boundaries
            const dx = Math.abs(p2.x - p1.x);
            const dy = Math.abs(p2.y - p1.y);
            if (dx < this.width / 2 && dy < this.height / 2) {
              const alpha = (k / b.trail.length) * 0.35; // fade tail out
              ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${alpha})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
    }

    // Find boid under mouse hover
    let hoveredBoid = null;
    if (this.mouse.x !== null && this.mouse.y !== null && this.drawCones) {
      let minDist = 40; // max hover detection distance
      for (const b of this.boids) {
        const dx = b.x - this.mouse.x;
        const dy = b.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          hoveredBoid = b;
        }
      }
      this.selectedBoid = hoveredBoid;
    }

    const halfPsi = (this.boidsParams.visionAngle / 2) * (Math.PI / 180);
    const R = this.boidsParams.radius;

    // Draw vision cone / interaction overlay behind boids
    if (this.selectedBoid) {
      const sb = this.selectedBoid;
      const isInfluential = (this.boidsParams.modelType === 'influential');
      const isClassic = (this.boidsParams.modelType === 'classic');
      
      // Draw highlighted vision cone / interaction radius
      ctx.beginPath();
      ctx.moveTo(sb.x, sb.y);
      if (isClassic) {
        ctx.arc(sb.x, sb.y, R, 0, Math.PI * 2);
      } else {
        ctx.arc(sb.x, sb.y, R, sb.theta - halfPsi, sb.theta + halfPsi);
      }
      ctx.closePath();

      if (isInfluential) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      } else {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
      }
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Highlight neighbors in cone / interaction radius
      const cellNeighbors = this.spatialGrid.getNeighbors(sb);
      for (const n of cellNeighbors) {
        if (n === sb) continue;
        
        let dx = n.x - sb.x;
        let dy = n.y - sb.y;
        if (dx > this.width / 2) dx -= this.width;
        else if (dx < -this.width / 2) dx += this.width;
        if (dy > this.height / 2) dy -= this.height;
        else if (dy < -this.height / 2) dy += this.height;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < R) {
          const psi_ij = Math.atan2(dy, dx);
          let dpsi = psi_ij - sb.theta;
          dpsi = Math.atan2(Math.sin(dpsi), Math.cos(dpsi));

          const inView = isClassic || (Math.abs(dpsi) <= halfPsi);

          if (inView) {
            const isTop = isInfluential && sb.topNeighbors && sb.topNeighbors.includes(n);

            ctx.beginPath();
            ctx.moveTo(sb.x, sb.y);
            ctx.lineTo(sb.x + dx, sb.y + dy);

            if (isTop) {
              // Vibrant golden beam to top influential neighbor
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 2;
              ctx.setLineDash([]);
              ctx.stroke();

              // Glowing amber halo around top influential neighbor
              ctx.beginPath();
              ctx.arc(n.x, n.y, 9, 0, Math.PI * 2);
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 2;
              ctx.shadowColor = '#fbbf24';
              ctx.shadowBlur = 8;
              ctx.stroke();
              ctx.shadowBlur = 0;

              // Top influencer tag
              ctx.fillStyle = '#fbbf24';
              ctx.font = '500 10px "JetBrains Mono", monospace';
              ctx.fillText('Top Influencer', n.x + 10, n.y - 6);
            } else {
              // Faint dashed line to other visible neighbors
              ctx.strokeStyle = isInfluential ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 242, 254, 0.4)';
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 4]);
              ctx.stroke();
              ctx.setLineDash([]);

              if (!isInfluential) {
                // Magenta halo for regular neighbor
                ctx.beginPath();
                ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#ff007f';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            }
          }
        }
      }
    }

    // Draw all boids
    ctx.lineWidth = 1;
    for (const b of this.boids) {
      const isSelected = (b === this.selectedBoid);
      
      // Determine color by heading angle (HSL hue maps to [0, 360])
      const hue = Math.round((b.theta / (Math.PI * 2)) * 360);
      ctx.fillStyle = `hsl(${hue}, 85%, 60%)`;
      ctx.strokeStyle = isSelected ? '#ffffff' : `hsl(${hue}, 85%, 40%)`;

      // Draw arrow-like bird shape
      ctx.beginPath();
      const length = isSelected ? 16 : 11;
      const width = isSelected ? 8 : 5;
      
      // Tip of arrow
      const tx = b.x + length * Math.cos(b.theta);
      const ty = b.y + length * Math.sin(b.theta);
      
      // Left back wing
      const lx = b.x + width * Math.cos(b.theta + Math.PI * 0.8);
      const ly = b.y + width * Math.sin(b.theta + Math.PI * 0.8);
      
      // Right back wing
      const rx = b.x + width * Math.cos(b.theta - Math.PI * 0.8);
      const ry = b.y + width * Math.sin(b.theta - Math.PI * 0.8);

      ctx.moveTo(tx, ty);
      ctx.lineTo(lx, ly);
      ctx.lineTo(b.x, b.y); // center tail point
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Calculate Polarization: polarization order parameter
  calcPolarization() {
    let sumCos = 0;
    let sumSin = 0;
    for (const b of this.boids) {
      sumCos += Math.cos(b.theta);
      sumSin += Math.sin(b.theta);
    }
    const magnitude = Math.sqrt(sumCos * sumCos + sumSin * sumSin);
    return magnitude / this.boids.length;
  }

  // --- MAIN ANIMATION LOOP ---
  loop(time) {
    // Handle visibility/content-visibility skip
    if (this.skipped) {
      this.lastTime = time;
      requestAnimationFrame(this.loop);
      return;
    }

    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Cap delta time to prevent physics explosions when tab goes background
    if (dt > 0.1) dt = 0.1;

    // FPS Counter
    this.framesThisSecond++;
    if (time > this.lastFpsUpdate + 1000) {
      this.fps = Math.round((this.framesThisSecond * 1000) / (time - this.lastFpsUpdate));
      this.fpsVal.innerText = this.fps;
      this.framesThisSecond = 0;
      this.lastFpsUpdate = time;
    }

    // Physics Update and Draw
    this.updateBoids(dt);
    this.drawBoids();
    
    const polarization = this.calcPolarization();
    this.primaryMetricVal.innerText = polarization.toFixed(3);
    
    // Update chart history (only on frames if not paused, to keep it moving)
    if (!this.isPaused) {
      this.chart.addData([polarization]);
    }

    requestAnimationFrame(this.loop);
  }
}

// Initialise the simulation on DOM content loaded
let simCoordinator;
document.addEventListener('DOMContentLoaded', () => {
  simCoordinator = new Simulation();

  // Optimized Performance: Implement content-visibility auto state listening
  const container = document.getElementById('canvasContainer');
  const isCVisSupported = 'contentVisibility' in document.documentElement.style;

  if (isCVisSupported) {
    container.addEventListener('contentvisibilityautostatechange', (event) => {
      simCoordinator.skipped = event.skipped;
      if (event.skipped) {
        console.log('[Performance] Canvas off-screen, simulation loop suspended.');
      } else {
        console.log('[Performance] Canvas on-screen, simulation loop resumed.');
      }
    });
  } else {
    // Fallback using IntersectionObserver for Safari / older browsers
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        simCoordinator.skipped = !entry.isIntersecting;
        if (simCoordinator.skipped) {
          console.log('[Performance Fallback] Canvas off-screen, simulation suspended.');
        } else {
          console.log('[Performance Fallback] Canvas on-screen, simulation resumed.');
        }
      });
    }, {
      rootMargin: '200px' // Pre-render buffer
    });

    observer.observe(container);
  }
});
