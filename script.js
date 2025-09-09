// Wave Rider Lite — self-contained, DPR-aware, keyboard input, animation loop

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CSS_WIDTH = 800;
const CSS_HEIGHT = 600;

// device pixel ratio setup
function setupCanvasForDPR(cvs, context, cssW = CSS_WIDTH, cssH = CSS_HEIGHT) {
    cvs.style.width = cssW + 'px';
    cvs.style.height = cssH + 'px';
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    cvs.width = Math.floor(cssW * dpr);
    cvs.height = Math.floor(cssH * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to CSS pixels
    context.imageSmoothingEnabled = false;
}
setupCanvasForDPR(canvas, ctx);

// game state
let lastTime = 0;
let running = true;
let score = 100;

const RIDE_THRESHOLD = 28;      // pixels from wave considered "riding"
const SCORE_PER_SECOND = 45;    // points gained per second while riding
const FALL_PENALTY_PER_SECOND = 18; // points lost per second while falling

// player's physics tuning — replaced abrupt "set vy" behavior with smooth control
const player = {
    x: 160,
    y: CSS_HEIGHT / 2,
    w: 28,
    h: 18,
    vy: 0,
    // tuned values for smoother control
    thrustAccel: -900,     // continuous upward acceleration while held (px/s^2)
    initialImpulse: -160,  // single impulse added on press (px/s) - smaller than before
    maxUpVy: -360,         // cap upward velocity (px/s)
    maxDownVy: 520,        // cap downward velocity (px/s)
    gravity: 520,          // px/s^2 (reduced gravity)
    color: '#7fff3c',
    onWave: false
};

// old wave object replaced with richer, time-aware wave
const wave = {
    amplitude: 60,
    frequency: 0.012,   // spatial frequency
    speed: 0.9,         // controls phase advance (higher => faster travel)
    phase: 0,
    t: 0                // global time for modulation
};

// input state — track rising edge for single impulse
const keys = { space: false, spaceStart: false };

window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!keys.space) keys.spaceStart = true;
        keys.space = true;
    }
});
window.addEventListener('keyup', function(e) {
    if (e.code === 'Space') {
        keys.space = false;
        keys.spaceStart = false;
    }
});

// helper: sample wave y at given x (CSS pixels) — richer multi-component wave
function waveY(x, phase, t) {
    const center = CSS_HEIGHT * 0.4;
    // base traveling sine
    const base = Math.sin(x * wave.frequency + phase);
    // higher-frequency detail
    const detail = Math.sin(x * (wave.frequency * 1.8) + phase * 0.6 + t * 0.6) * 0.35;
    // slow amplitude modulation that "alternates" the character of the wave
    const ampMod = 0.6 + 0.4 * Math.sin(t * 0.5);
    // gentle vertical offset wobble (makes wave pulse)
    const verticalWobble = Math.sin(t * 0.25) * 8;
    return center + wave.amplitude * (base * ampMod + detail) + verticalWobble;
}

// update loop (modify wave/time updates)
function update(dt) {
    // advance internal clock & traveling phase
    wave.t += dt;
    wave.phase += wave.speed * dt * 2.0; // steady traveling motion

    // horizontal player movement (unchanged)
    player.x += 60 * dt;

    // --- vertical control: gentler impulse + continuous thrust ---
    if (keys.spaceStart) {
        // add a modest impulse (additive, not overwrite)
        player.vy += player.initialImpulse;
        keys.spaceStart = false;
    }

    if (keys.space) {
        // continuous upward acceleration while space is held
        player.vy += player.thrustAccel * dt;
    } else {
        // gravity when not holding
        player.vy += player.gravity * dt;
    }

    // --- damping to reduce oscillation/jitter (simple exponential damping) ---
    const damping = 4.0; // increase to make motion more "sticky"
    player.vy += -player.vy * Math.min(1, damping * dt);

    // --- soft auto-assist: small proportional force toward the wave Y ---
    // set assistEnabled = false to turn off auto-assist for pure skill
    const assistEnabled = true;
    if (assistEnabled) {
        const targetY = waveY(player.x, wave.phase, wave.t);
        // proportional controller
        const assistK = 6.0;          // responsiveness (increase to make stronger)
        const maxAssistAcc = 700;     // clamp assist acceleration
        const acc = Math.max(-maxAssistAcc, Math.min(maxAssistAcc, (targetY - player.y) * assistK));
        player.vy += acc * dt;
    }

    // clamp velocities to avoid runaway
    if (player.vy < player.maxUpVy) player.vy = player.maxUpVy;
    if (player.vy > player.maxDownVy) player.vy = player.maxDownVy;

    // integrate vertical position
    player.y += player.vy * dt;

    // compute nearest wave Y at player's x and scoring (existing logic)
    const nearestY = waveY(player.x, wave.phase, wave.t);
    const dist = Math.abs(player.y - nearestY);
    if (dist < RIDE_THRESHOLD) {
        score += SCORE_PER_SECOND * dt;
        player.onWave = true;
    } else {
        score -= FALL_PENALTY_PER_SECOND * dt;
        player.onWave = false;
    }
    if (score <= -5) {
        gameOver = true;
        gameRunning = false;
        showRestartAndHome();
    }

    // clamp vertical to canvas bounds
    if (player.y < 8) { player.y = 8; player.vy = 0; }
    if (player.y > CSS_HEIGHT - player.h - 8) { player.y = CSS_HEIGHT - player.h - 8; player.vy = 0; }

    // wrap logic to keep player centered while wave scrolls by
    if (player.x > CSS_WIDTH * 0.6) {
        const overflow = player.x - CSS_WIDTH * 0.6;
        player.x = CSS_WIDTH * 0.6 - overflow * 0.2;
        wave.phase += overflow * 0.03; // keep forward feel
    }
}

// draw wave with glow and layered strokes
function drawWave(ctx, phase, t) {
    ctx.save();

    // faint glow band
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#57f3ff';
    ctx.beginPath();
    for (let x = 0; x <= CSS_WIDTH; x += 4) {
        const y = waveY(x, phase, t);
        if (x === 0) ctx.moveTo(x, y + 18);
        else ctx.lineTo(x, y + 18);
    }
    ctx.lineTo(CSS_WIDTH, CSS_HEIGHT);
    ctx.lineTo(0, CSS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // main stroke (neon)
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(87,243,255,0.95)';
    ctx.shadowColor = 'rgba(87,243,255,0.35)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let x = 0; x <= CSS_WIDTH; x += 2) {
        const y = waveY(x, phase, t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // subtle second stroke for depth
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    for (let x = 0; x <= CSS_WIDTH; x += 6) {
        const y = waveY(x, phase, t) + 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.restore();
}

// draw the player as a triangle "ship" with thruster and glow
function drawPlayer(ctx, p) {
    ctx.save();

    // ship points (triangle pointing right)
    const cx = p.x;
    const cy = p.y;
    const w = p.w;
    const h = p.h;
    const angle = 0; // could tilt based on vy if desired

    // compute rotated points (no rotation currently)
    const nose = { x: cx + w * 0.6, y: cy };
    const rearTop = { x: cx - w * 0.5, y: cy - h * 0.6 };
    const rearBot = { x: cx - w * 0.5, y: cy + h * 0.6 };

    // glow
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(nose.x, nose.y);
    ctx.lineTo(rearTop.x, rearTop.y);
    ctx.lineTo(rearBot.x, rearBot.y);
    ctx.closePath();
    ctx.fill();

    // main stroke
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();

    // cockpit highlight
    ctx.fillStyle = 'rgba(10,10,12,0.6)';
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.05, cy - h * 0.08, w * 0.18, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // thruster flame when space pressed
    if (keys.space) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const flameGradient = ctx.createLinearGradient(nose.x - w * 0.6, cy, rearTop.x, cy);
        flameGradient.addColorStop(0, 'rgba(255,200,60,0.95)');
        flameGradient.addColorStop(1, 'rgba(255,60,120,0.2)');
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.moveTo(rearTop.x, rearTop.y);
        ctx.lineTo(rearTop.x - w * 0.5 - Math.random() * 6, cy);
        ctx.lineTo(rearBot.x, rearBot.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}

function drawHUD(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '18px Inter, Arial';
    ctx.fillText('Score: ' + Math.floor(score), 12, 26);
    ctx.fillStyle = player.onWave ? '#7fff3c' : '#ff6b6b';
    ctx.fillText(player.onWave ? 'Riding' : 'Falling', 12, 50);
    ctx.restore();
}

let gameOver = false;
let gameRunning = true;

// show restart/home buttons
function showRestartAndHome() {
    const restartBtn = document.getElementById('restartBtn');
    const homeBtn = document.getElementById('homeBtn');
    if (restartBtn) restartBtn.style.display = 'block';
    if (homeBtn) homeBtn.style.display = 'block';
}

// hide restart/home buttons
function hideRestartAndHome() {
    const restartBtn = document.getElementById('restartBtn');
    const homeBtn = document.getElementById('homeBtn');
    if (restartBtn) restartBtn.style.display = 'none';
    if (homeBtn) homeBtn.style.display = 'none';
}

// draw game over screen
function drawGameOver(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CSS_WIDTH, CSS_HEIGHT);
    ctx.fillStyle = 'rgba(255,20,20,1)';
    ctx.font = '56px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CSS_WIDTH / 2, CSS_HEIGHT / 2 - 20);
    ctx.font = '18px Inter, Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('Score: ' + Math.floor(score), CSS_WIDTH / 2, CSS_HEIGHT / 2 + 26);
    ctx.restore();
}

// reset game state
function resetGame() {
    player.x = 160;
    player.y = CSS_HEIGHT / 2;
    player.vy = 0;
    score = 100;
    wave.phase = 0;
    wave.t = 0;
    gameOver = false;
    gameRunning = true;
    hideRestartAndHome();
    lastTime = performance.now();
    requestAnimationFrame(loop);
}

// restart button handler
const restartBtnEl = document.getElementById('restartBtn');
if (restartBtnEl) restartBtnEl.addEventListener('click', function() {
    resetGame();
});

// home button handler
const homeBtnEl = document.getElementById('homeBtn');
if (homeBtnEl) homeBtnEl.addEventListener('click', function() {
    window.location.href = 'index.html';
});

// main loop
function loop(ts) {
    if (!running) return;
    const dt = lastTime ? Math.min(0.033, (ts - lastTime) / 1000) : 0;
    lastTime = ts;

    // clear (reset transforms first)
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update(dt);

    // draw scene
    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, CSS_HEIGHT);
    g.addColorStop(0, '#2b2b12');
    g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CSS_WIDTH, CSS_HEIGHT);

    drawWave(ctx, wave.phase, wave.t);
    drawPlayer(ctx, player);
    drawHUD(ctx);
    if (gameOver) {
        drawGameOver(ctx);
        return;
    }
    if (gameRunning) requestAnimationFrame(loop);
}

// start
lastTime = performance.now();
requestAnimationFrame(loop);

// helpers for older browsers: small polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'undefined') r = 4;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        this.fill();
    };
}