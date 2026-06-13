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

      // Y-axis labels (ranges 0 to 1 normally, or -1 to 1 for chase order parameter)
      ctx.fillStyle = '#64748b';
      ctx.font = '9px "JetBrains Mono"';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const isChaseMode = this.dataHistory[0].length > 1;
      let labelVal;
      if (isChaseMode) {
        labelVal = (1.0 - (2.0 * i / gridLines)).toFixed(1);
      } else {
        labelVal = (1.0 - (i / gridLines)).toFixed(1);
      }
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
        
        const isChaseMode = numSeries > 1;
        let y;
        if (isChaseMode) {
          // Map [-1, 1] to chartHeight
          const normalizedVal = (val + 1.0) / 2.0; // [0, 1]
          y = paddingTop + chartHeight - (chartHeight * normalizedVal);
        } else {
          // Map [0, 1] to chartHeight
          y = paddingTop + chartHeight - (chartHeight * val);
        }

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
    this.mode = 'boids'; // 'boids' | 'lattice' | 'chase'
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
    this.selectedSpin = null;
    
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
      this.selectedSpin = null;
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
    // Mode 1: Boids parameters
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
      infiniteTrails: false
    };

    // Mode 2: Lattice parameters
    this.latticeParams = {
      L: 32,
      visionAngle: 306, // degrees
      coupling: 1.0,
      temp: 0.40,
      glauber: true
    };

    // Mode 3: Chase & Run parameters
    this.chaseParams = {
      L: 40,
      jr: 1.0,
      jl: -0.99,
      jrec: 1.5,
      temp: 0.08
    };
  }

  bindEvents() {
    // Tab switching
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        // Hide all control sidebars
        document.querySelectorAll('.active-mode-controls').forEach(el => el.style.display = 'none');
        
        // Show active controls sidebar
        this.mode = e.target.dataset.tab;
        document.getElementById(`controls-${this.mode}`).style.display = 'flex';
        
        this.resetSimulation();
      });
    });

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
    bindSlider('param-boid-noise', this.boidsParams, 'noise');
    bindSlider('param-boid-speed', this.boidsParams, 'speed');
    bindSlider('param-boid-repulsion', this.boidsParams, 'repulsion');
    bindSlider('param-boid-trail-length', this.boidsParams, 'trailLength');
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

    // Bind Lattice Sliders
    bindSlider('param-lat-grid', this.latticeParams, 'L', () => this.resetSimulation());
    bindSlider('param-lat-vision-angle', this.latticeParams, 'visionAngle');
    bindSlider('param-lat-coupling', this.latticeParams, 'coupling');
    bindSlider('param-lat-temp', this.latticeParams, 'temp');
    document.getElementById('toggle-lat-glauber').addEventListener('change', (e) => {
      this.latticeParams.glauber = e.target.checked;
    });

    // Bind Chase & Run Sliders
    bindSlider('param-chase-grid', this.chaseParams, 'L', () => this.resetSimulation());
    bindSlider('param-chase-jr', this.chaseParams, 'jr');
    bindSlider('param-chase-jl', this.chaseParams, 'jl');
    bindSlider('param-chase-jrec', this.chaseParams, 'jrec');
    bindSlider('param-chase-temp', this.chaseParams, 'temp');
    document.getElementById('btn-chase-stripes').addEventListener('click', () => {
      this.initChaseStripes();
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

    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = !!document.fullscreenElement;
      const container = document.getElementById('canvasContainer');
      if (isFullscreen) {
        container.classList.add('fullscreen-active');
      } else {
        container.classList.remove('fullscreen-active');
      }
      setTimeout(() => {
        this.resizeCanvas();
      }, 50);
    });
  }

  togglePlayPause() {
    this.isPaused = !this.isPaused;
    this.playPauseBtn.innerHTML = this.isPaused ? 'Play' : 'Pause';
    this.playPauseBtn.classList.toggle('btn-primary', this.isPaused);
    document.getElementById('btn-pause-canvas').innerHTML = this.isPaused ? 'Play' : 'Pause';
  }

  toggleFullscreen() {
    const container = document.getElementById('canvasContainer');
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  resetSimulation() {
    this.chart.clear();
    if (this.trailCtx) {
      this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
    }
    
    if (this.mode === 'boids') {
      this.primaryMetricLabel.innerHTML = 'Polarization: <strong id="val-primary-metric">0.00</strong>';
      this.primaryMetricVal = document.getElementById('val-primary-metric');
      document.getElementById('chart-title-text').innerText = 'Polarization (Flock Alignment)';
      this.infoPanel.innerHTML = `
        <strong>Flocking Boids Mode:</strong>
        <p style="margin-top: 6px; color: var(--text-secondary);">
          Self-propelled agents flying in continuous 2D space. Alignment updates are based on Itô Langevin equations. 
          Hovering shows a boid's <code>Vision Angle</code>. A narrow angle makes interaction non-reciprocal.
        </p>
      `;
      this.initBoids();
    } else if (this.mode === 'lattice') {
      this.primaryMetricLabel.innerHTML = 'Magnetization: <strong id="val-primary-metric">0.00</strong>';
      this.primaryMetricVal = document.getElementById('val-primary-metric');
      document.getElementById('chart-title-text').innerText = 'Magnetization Order Parameter (m)';
      this.infoPanel.innerHTML = `
        <strong>Lattice XY Spins:</strong>
        <p style="margin-top: 6px; color: var(--text-secondary);">
          Spins fixed on a 2D grid. Dynamics can run via continuous Langevin equations or the paper's equivalent 
          Hamiltonian-embedded <strong>Glauber Monte Carlo</strong>. High temperature destroys order.
        </p>
      `;
      this.initLatticeSpins();
    } else if (this.mode === 'chase') {
      this.primaryMetricLabel.innerHTML = 'Order Parameter Re(O): <strong id="val-primary-metric">0.00</strong>';
      this.primaryMetricVal = document.getElementById('val-primary-metric');
      document.getElementById('chart-title-text').innerText = 'Column Order Parameter O(t) [Re: Blue, Im: Pink]';
      this.infoPanel.innerHTML = `
        <strong>Chase & Run Stripes:</strong>
        <p style="margin-top: 6px; color: var(--text-secondary);">
          Non-reciprocal interactions along X (<code>J<sub>&larr;</sub> &ne; J<sub>&rarr;</sub></code>) and reciprocal along Y. 
          When <code>J<sub>&larr;</sub> &approx; -J<sub>&rarr;</sub></code>, it forces stripe boundaries to shift, causing wave-like propagation.
        </p>
      `;
      this.initChaseSpes();
    }
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
      
      // Repulsion force vector
      let repForceX = 0;
      let repForceY = 0;
      let neighborsInRep = 0;

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

          // If neighbor lies within the vision cone
          if (Math.abs(dpsi) <= halfPsi) {
            torqueAlign += -J * Math.sin(b.theta - n.theta);
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

      // Repulsion steering torque
      let torqueRep = 0;
      if (neighborsInRep > 0 && repStrength > 0) {
        const theta_rep = Math.atan2(repForceY, repForceX);
        let drep = theta_rep - b.theta;
        drep = Math.atan2(Math.sin(drep), Math.cos(drep));
        torqueRep = -repStrength * Math.sin(b.theta - theta_rep);
      }

      // Angular Langevin update: dTheta = (Torque) * dt + noise
      const totalTorque = torqueAlign + torqueRep;
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

    // Draw vision cone overlay behind boids
    if (this.selectedBoid) {
      const sb = this.selectedBoid;
      
      // Draw highlighted vision cone
      ctx.beginPath();
      ctx.moveTo(sb.x, sb.y);
      ctx.arc(sb.x, sb.y, R, sb.theta - halfPsi, sb.theta + halfPsi);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Highlight neighbors in cone
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

          if (Math.abs(dpsi) <= halfPsi) {
            // Draw link line
            ctx.beginPath();
            ctx.moveTo(sb.x, sb.y);
            // Draw line towards neighboring coordinates (corrected for periodic wraparound drawing)
            ctx.lineTo(sb.x + dx, sb.y + dy);
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw glowing halo around neighbor
            ctx.beginPath();
            ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 1.5;
            ctx.stroke();
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

  // --- MODE 2: LATTICE XY SPINS ---
  initLatticeSpins() {
    const L = this.latticeParams.L;
    this.spins = new Float32Array(L * L);
    // Initialize with randomized angles
    for (let i = 0; i < L * L; i++) {
      this.spins[i] = Math.random() * Math.PI * 2;
    }
    this.activeParticlesVal.innerText = L * L;
  }

  updateLatticeSpins(dt) {
    if (this.isPaused) return;

    const L = this.latticeParams.L;
    const J = this.latticeParams.coupling;
    const T = this.latticeParams.temp;
    const halfPsi = (this.latticeParams.visionAngle / 2) * (Math.PI / 180);

    if (this.latticeParams.glauber) {
      // Glauber Dynamics based on Hamiltonian Embedding (Paper Eq 6 / Eq 13 / Eq 15)
      // Run L*L random updates (one full sweep) per call
      const sweeps = 2; // sweep multiplier
      const maxDelta = 0.5; // size of spin proposal angle (radians)

      for (let s = 0; s < sweeps * L * L; s++) {
        // Pick a spin at random
        const idx = Math.floor(Math.random() * L * L);
        const y = Math.floor(idx / L);
        const x = idx % L;

        const theta = this.spins[idx];
        const proposal = theta + (Math.random() * 2 - 1) * maxDelta;
        
        // Define neighbors (periodic boundary conditions)
        const neighbors = [
          { index: y * L + ((x + 1) % L), psi: 0 },         // Right
          { index: ((y + 1) % L) * L + x, psi: Math.PI/2 },  // Up
          { index: y * L + ((x - 1 + L) % L), psi: Math.PI },// Left
          { index: ((y - 1 + L) % L) * L + x, psi: -Math.PI/2 } // Down
        ];

        // Compute Hamiltonian embedding energy difference dE (Eq 6)
        let dE = 0;
        for (const n of neighbors) {
          const theta_n = this.spins[n.index];

          // Check if neighbor is in vision cone at current state
          let dpsi_curr = n.psi - theta;
          dpsi_curr = Math.atan2(Math.sin(dpsi_curr), Math.cos(dpsi_curr));
          const J_curr = Math.abs(dpsi_curr) <= halfPsi ? J : 0;

          // Check if neighbor is in vision cone at proposed state
          let dpsi_prop = n.psi - proposal;
          dpsi_prop = Math.atan2(Math.sin(dpsi_prop), Math.cos(dpsi_prop));
          const J_prop = Math.abs(dpsi_prop) <= halfPsi ? J : 0;

          // Sum over bonds: -1/2 * (J_prop + J_curr) * [cos(theta' - theta_n) - cos(theta - theta_n)]
          const cosDiff = Math.cos(proposal - theta_n) - Math.cos(theta - theta_n);
          dE += -0.5 * (J_prop + J_curr) * cosDiff;
        }

        // Glauber acceptance rate: w = 1/2 * (1 - tanh(dE / (2T)))
        const rate = 0.5 * (1.0 - Math.tanh(dE / (2.0 * T)));
        if (Math.random() < rate) {
          this.spins[idx] = (proposal + Math.PI * 2) % (Math.PI * 2);
        }
      }
    } else {
      // Direct Langevin Dynamics for comparison
      const nextSpins = new Float32Array(L * L);
      
      for (let y = 0; y < L; y++) {
        for (let x = 0; x < L; x++) {
          const idx = y * L + x;
          const theta = this.spins[idx];
          
          const neighbors = [
            { index: y * L + ((x + 1) % L), psi: 0 },
            { index: ((y + 1) % L) * L + x, psi: Math.PI/2 },
            { index: y * L + ((x - 1 + L) % L), psi: Math.PI },
            { index: ((y - 1 + L) % L) * L + x, psi: -Math.PI/2 }
          ];

          let torque = 0;
          for (const n of neighbors) {
            const theta_n = this.spins[n.index];
            let dpsi = n.psi - theta;
            dpsi = Math.atan2(Math.sin(dpsi), Math.cos(dpsi));
            
            if (Math.abs(dpsi) <= halfPsi) {
              torque += -J * Math.sin(theta - theta_n);
            }
          }

          const noise = Math.sqrt(2.0 * T * dt) * randomGaussian();
          let nextTheta = theta + torque * dt + noise;
          nextSpins[idx] = (nextTheta + Math.PI * 2) % (Math.PI * 2);
        }
      }
      this.spins.set(nextSpins);
    }
  }

  drawLatticeSpins() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    const L = this.latticeParams.L;
    const cellWidth = this.width / L;
    const cellHeight = this.height / L;

    // Detect hovered cell
    let hoverX = null, hoverY = null;
    if (this.mouse.x !== null && this.mouse.y !== null && this.drawCones) {
      hoverX = Math.floor(this.mouse.x / cellWidth);
      hoverY = Math.floor(this.mouse.y / cellHeight);
      if (hoverX >= 0 && hoverX < L && hoverY >= 0 && hoverY < L) {
        this.selectedSpin = { x: hoverX, y: hoverY };
      }
    } else {
      this.selectedSpin = null;
    }

    const halfPsi = (this.latticeParams.visionAngle / 2) * (Math.PI / 180);

    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const idx = y * L + x;
        const theta = this.spins[idx];
        const cx = (x + 0.5) * cellWidth;
        const cy = (y + 0.5) * cellHeight;

        // Draw color block
        const hue = Math.round((theta / (Math.PI * 2)) * 360);
        ctx.fillStyle = `hsl(${hue}, 80%, 45%)`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

        // Draw arrow indicator inside cell if grid elements are large enough
        if (cellWidth > 15) {
          ctx.beginPath();
          ctx.moveTo(cx - (cellWidth * 0.3) * Math.cos(theta), cy - (cellHeight * 0.3) * Math.sin(theta));
          ctx.lineTo(cx + (cellWidth * 0.3) * Math.cos(theta), cy + (cellHeight * 0.3) * Math.sin(theta));
          
          // Arrow head
          const arrowHeadX = cx + (cellWidth * 0.3) * Math.cos(theta);
          const arrowHeadY = cy + (cellHeight * 0.3) * Math.sin(theta);
          ctx.moveTo(arrowHeadX, arrowHeadY);
          ctx.lineTo(arrowHeadX - 4 * Math.cos(theta - 0.5), arrowHeadY - 4 * Math.sin(theta - 0.5));
          ctx.moveTo(arrowHeadX, arrowHeadY);
          ctx.lineTo(arrowHeadX - 4 * Math.cos(theta + 0.5), arrowHeadY - 4 * Math.sin(theta + 0.5));
          
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    // Draw grid border lines if grid elements are visible
    if (cellWidth > 8) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= L; x++) {
        ctx.moveTo(x * cellWidth, 0);
        ctx.lineTo(x * cellWidth, this.height);
      }
      for (let y = 0; y <= L; y++) {
        ctx.moveTo(0, y * cellHeight);
        ctx.lineTo(this.width, y * cellHeight);
      }
      ctx.stroke();
    }

    // Highlight hovered spin and its vision cone interactions
    if (this.selectedSpin) {
      const { x, y } = this.selectedSpin;
      const idx = y * L + x;
      const theta = this.spins[idx];
      const cx = (x + 0.5) * cellWidth;
      const cy = (y + 0.5) * cellHeight;

      // Draw highlighted cell border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

      // Draw vision cone arc
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const radius = Math.max(cellWidth * 2.5, 40);
      ctx.arc(cx, cy, radius, theta - halfPsi, theta + halfPsi);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.stroke();

      // Show neighbor interactions
      const neighbors = [
        { x: (x + 1) % L, y: y, psi: 0 },
        { x: x, y: (y + 1) % L, psi: Math.PI/2 },
        { x: (x - 1 + L) % L, y: y, psi: Math.PI },
        { x: x, y: (y - 1 + L) % L, psi: -Math.PI/2 }
      ];

      for (const n of neighbors) {
        let dpsi = n.psi - theta;
        dpsi = Math.atan2(Math.sin(dpsi), Math.cos(dpsi));
        const inVision = Math.abs(dpsi) <= halfPsi;

        if (inVision) {
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(n.x * cellWidth, n.y * cellHeight, cellWidth, cellHeight);
        }
      }
    }
  }

  // Calculate grid magnetization: m = 1/N * |Sum(exp(i*theta))|
  calcMagnetization() {
    let sumCos = 0;
    let sumSin = 0;
    const L = this.latticeParams.L;
    for (let i = 0; i < L * L; i++) {
      sumCos += Math.cos(this.spins[i]);
      sumSin += Math.sin(this.spins[i]);
    }
    const mag = Math.sqrt(sumCos * sumCos + sumSin * sumSin);
    return mag / (L * L);
  }

  // --- MODE 3: CHASE & RUN ---
  initChaseSpes() {
    const L = this.chaseParams.L;
    this.chaseSpins = new Float32Array(L * L);
    this.initChaseStripes();
    this.activeParticlesVal.innerText = L * L;
  }

  initChaseStripes() {
    const L = this.chaseParams.L;
    // Perfect stripe initialization (Paper Page 12, Eq 24)
    // theta = 0 for x in [L/4, 3L/4), and PI/2 otherwise
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const idx = y * L + x;
        if (x >= Math.floor(L / 4) && x < Math.floor(3 * L / 4)) {
          this.chaseSpins[idx] = 0;
        } else {
          this.chaseSpins[idx] = Math.PI / 2;
        }
      }
    }
    this.chart.clear();
  }

  updateChaseSpins(dt) {
    if (this.isPaused) return;

    const L = this.chaseParams.L;
    const jr = this.chaseParams.jr;
    const jl = this.chaseParams.jl;
    const jrec = this.chaseParams.jrec;
    const T = this.chaseParams.temp;

    const nextSpins = new Float32Array(L * L);

    // Langevin integration for Chase & Run spins (Paper Eq 23)
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const idx = y * L + x;
        const theta = this.chaseSpins[idx];

        // Periodic boundaries neighbors
        const r_idx = y * L + ((x + 1) % L);
        const l_idx = y * L + ((x - 1 + L) % L);
        const u_idx = ((y + 1) % L) * L + x;
        const d_idx = ((y - 1 + L) % L) * L + x;

        const theta_r = this.chaseSpins[r_idx];
        const theta_l = this.chaseSpins[l_idx];
        const theta_u = this.chaseSpins[u_idx];
        const theta_d = this.chaseSpins[d_idx];

        // Equation: -jr*sin(theta - theta_r) - jl*sin(theta - theta_l) - jrec*(sin(theta - theta_u) + sin(theta - theta_d))
        const torque = -jr * Math.sin(theta - theta_r) 
                       - jl * Math.sin(theta - theta_l) 
                       - jrec * (Math.sin(theta - theta_u) + Math.sin(theta - theta_d));

        // Scale noise to keep it stable
        const noise = Math.sqrt(2.0 * T * dt) * randomGaussian();
        
        let nextTheta = theta + torque * dt + noise;
        nextSpins[idx] = (nextTheta + Math.PI * 4) % (Math.PI * 2);
      }
    }

    this.chaseSpins.set(nextSpins);
  }

  drawChaseSpins() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    const L = this.chaseParams.L;
    const cellWidth = this.width / L;
    const cellHeight = this.height / L;

    // Render cells using HSL hue based on spin angle
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const idx = y * L + x;
        const theta = this.chaseSpins[idx];
        const hue = Math.round((theta / (Math.PI * 2)) * 360);
        
        ctx.fillStyle = `hsl(${hue}, 80%, 45%)`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
      }
    }

    // Draw grid overlay lines
    if (cellWidth > 8) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= L; x++) {
        ctx.moveTo(x * cellWidth, 0);
        ctx.lineTo(x * cellWidth, this.height);
      }
      for (let y = 0; y <= L; y++) {
        ctx.moveTo(0, y * cellHeight);
        ctx.lineTo(this.width, y * cellHeight);
      }
      ctx.stroke();
    }
  }

  // Calculate Order Parameter for X=1 column (Paper Page 5: O(t) = 1/L * Sum(exp(i * theta_1,y)))
  calcChaseOrderParameter() {
    const L = this.chaseParams.L;
    let sumCos = 0;
    let sumSin = 0;
    
    // Sum over first column (x = 0)
    for (let y = 0; y < L; y++) {
      const idx = y * L + 0; // x = 0 index
      sumCos += Math.cos(this.chaseSpins[idx]);
      sumSin += Math.sin(this.chaseSpins[idx]);
    }
    
    return {
      re: sumCos / L,
      im: sumSin / L
    };
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
    if (this.mode === 'boids') {
      this.updateBoids(dt);
      this.drawBoids();
      
      const polarization = this.calcPolarization();
      this.primaryMetricVal.innerText = polarization.toFixed(3);
      
      // Update chart history (only on frames if not paused, to keep it moving)
      if (!this.isPaused) {
        this.chart.addData([polarization]);
      }
    } else if (this.mode === 'lattice') {
      this.updateLatticeSpins(dt);
      this.drawLatticeSpins();
      
      const magnetization = this.calcMagnetization();
      this.primaryMetricVal.innerText = magnetization.toFixed(3);
      
      if (!this.isPaused) {
        this.chart.addData([magnetization]);
      }
    } else if (this.mode === 'chase') {
      // Small fixed physics timestep to keep Langevin wave smooth
      const subSteps = 5;
      const subDt = dt / subSteps;
      for (let i = 0; i < subSteps; i++) {
        this.updateChaseSpins(subDt);
      }
      this.drawChaseSpins();
      
      const op = this.calcChaseOrderParameter();
      this.primaryMetricVal.innerText = op.re.toFixed(3);
      
      if (!this.isPaused) {
        // Plot both Real and Imaginary parts (two line chart)
        this.chart.addData([op.re, op.im]);
      }
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
