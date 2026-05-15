'use strict';

// ── canvas helpers ─────────────────────────────────────────────────────────
function oval(ctx, x1, y1, x2, y2, fill, stroke, lw) {
  const cx = (x1+x2)/2, cy = (y1+y2)/2, rx = (x2-x1)/2, ry = (y2-y1)/2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI*2);
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||1; ctx.stroke(); }
}

function rect(ctx, x1, y1, x2, y2, fill, stroke, lw) {
  if (fill)   { ctx.fillStyle = fill; ctx.fillRect(x1, y1, x2-x1, y2-y1); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||1; ctx.strokeRect(x1+.5, y1+.5, x2-x1-1, y2-y1-1); }
}

function poly(ctx, pts, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i=2; i<pts.length; i+=2) ctx.lineTo(pts[i], pts[i+1]);
  ctx.closePath();
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||1; ctx.stroke(); }
}

function line(ctx, x1, y1, x2, y2, color, lw, cap) {
  ctx.strokeStyle = color; ctx.lineWidth = lw||1;
  ctx.lineCap = cap || 'butt';
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.lineCap = 'butt';
}

// tkinter arc: start/extent in degrees, CCW from east → same in JS canvas (CW from east, y-down)
function arc(ctx, x1, y1, x2, y2, start, extent, color, lw) {
  const cx = (x1+x2)/2, cy = (y1+y2)/2, rx = (x2-x1)/2, ry = (y2-y1)/2;
  const s = start * Math.PI/180, e = (start+extent) * Math.PI/180;
  ctx.strokeStyle = color; ctx.lineWidth = lw||1;
  ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, s, e); ctx.stroke();
}

function txt(ctx, x, y, text, color, size, bold) {
  ctx.fillStyle = color;
  ctx.font = `${bold?'bold ':''}${size||11}px "Courier New"`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 4;
  ctx.fillText(text, x, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// ── draw Mr. Krabs ─────────────────────────────────────────────────────────
function drawKrabs(ctx, cx, gy, action) {
  const Y=gy, RED='#d63000', DRK='#8b1e00';

  // legs
  for (let i=0; i<3; i++) {
    const sp=14+i*9, dr=4+i*3;
    line(ctx, cx-18, Y-22+i*4, cx-sp, Y-dr, RED, 2);
    line(ctx, cx+18, Y-22+i*4, cx+sp, Y-dr, RED, 2);
  }
  // body
  oval(ctx, cx-22, Y-56, cx+22, Y-18, RED, DRK, 2);

  // eye stalks
  for (const [ex,dir] of [[-8,-1],[8,1]]) {
    line(ctx, cx+ex, Y-54, cx+ex+dir*2, Y-68, RED, 3);
    oval(ctx, cx+ex+dir*2-7, Y-76, cx+ex+dir*2+7, Y-62, RED, DRK, 1);
    if (action==='shocked') {
      oval(ctx, cx+ex+dir*2-5, Y-74, cx+ex+dir*2+5, Y-64, 'white', null);
      oval(ctx, cx+ex+dir*2-2, Y-72, cx+ex+dir*2+2, Y-67, 'black', null);
    } else {
      oval(ctx, cx+ex+dir*2-3, Y-72, cx+ex+dir*2+3, Y-66, 'black', null);
    }
  }

  // mouth
  if (action==='shocked') {
    oval(ctx, cx-5, Y-40, cx+5, Y-30, '#ff9999', DRK, 2);
  } else {
    arc(ctx, cx-10, Y-44, cx+10, Y-30, 200, 140, DRK, 2);
  }

  // claws
  if (action==='count') {
    oval(ctx, cx-46, Y-50, cx-24, Y-32, RED, DRK, 2);
    arc(ctx, cx-46, Y-50, cx-24, Y-32, 20, 70, DRK, 2);
    oval(ctx, cx-40, Y-46, cx-30, Y-36, '#f5c842', '#c8a820', 1);
    txt(ctx, cx-35, Y-41, '$', '#8B6914', 9, true);
    oval(ctx, cx+24, Y-50, cx+46, Y-32, RED, DRK, 2);
    arc(ctx, cx+24, Y-50, cx+46, Y-32, 110, 70, DRK, 2);
  } else if (action==='shocked') {
    for (const [bx,sa] of [[cx-35,20],[cx+35,110]]) {
      oval(ctx, bx-11, Y-68, bx+11, Y-46, RED, DRK, 2);
      arc(ctx, bx-11, Y-68, bx+11, Y-46, sa, 70, DRK, 2);
    }
  } else { // empty
    oval(ctx, cx-44, Y-40, cx-22, Y-22, RED, DRK, 2);
    arc(ctx, cx-44, Y-40, cx-22, Y-22, 20, 70, DRK, 2);
    oval(ctx, cx+22, Y-40, cx+44, Y-22, RED, DRK, 2);
    arc(ctx, cx+22, Y-40, cx+44, Y-22, 110, 70, DRK, 2);
  }
}

// ── draw SpongeBob ─────────────────────────────────────────────────────────
function drawSpongebob(ctx, cx, gy, action, coin) {
  const Y=gy, YEL='#f5c518', DYEL='#c8a010', BRN='#7a5230', WHT='#f0f0f0';
  const lox = action==='run1' ? -5 : action==='run2' ? 5 : 0;

  // shoes
  oval(ctx, cx-11+lox, Y-5, cx,       Y,   '#111', null);
  oval(ctx, cx,        Y-5, cx+11-lox, Y,  '#111', null);
  // legs
  rect(ctx, cx-9+lox, Y-13, cx-3+lox,  Y-4, YEL, null);
  rect(ctx, cx+3-lox, Y-13, cx+9-lox,  Y-4, YEL, null);
  // pants
  rect(ctx, cx-20, Y-24, cx+20, Y-11, BRN, DYEL, 1);
  rect(ctx, cx-20, Y-26, cx+20, Y-23, '#3a2010', null);
  rect(ctx, cx-3,  Y-28, cx+3,  Y-22, DYEL, null);
  // body
  rect(ctx, cx-20, Y-52, cx+20, Y-21, YEL, DYEL, 2);
  for (const [hx,hy] of [[-11,-44],[8,-36],[-4,-30],[11,-47],[1,-40]])
    oval(ctx, cx+hx-3, Y+hy-3, cx+hx+3, Y+hy+3, DYEL, null);
  // collar + tie
  rect(ctx, cx-4, Y-55, cx+4, Y-50, WHT, null);
  poly(ctx, [cx,Y-54, cx-4,Y-44, cx,Y-38, cx+4,Y-44], '#cc2200', null);
  // head
  rect(ctx, cx-19, Y-68, cx+19, Y-50, YEL, DYEL, 2);
  // eyes
  for (const ex of [-8,8]) {
    oval(ctx, cx+ex-7, Y-67, cx+ex+7, Y-53, WHT, '#444', 1);
    oval(ctx, cx+ex-4, Y-65, cx+ex+3, Y-57, '#3af', null);
    oval(ctx, cx+ex-2, Y-63, cx+ex+1, Y-59, '#111', null);
  }
  for (const [ex,xd] of [[-8,-1],[8,1]])
    for (let i=0; i<3; i++) {
      const lx = cx+ex-4+i*4;
      line(ctx, lx, Y-67, lx+xd, Y-71, '#444', 1);
    }
  // nose
  oval(ctx, cx-2, Y-60, cx+2, Y-56, DYEL, null);
  // mouth + teeth
  const ab = action==='happy' ? Y-51 : Y-53;
  arc(ctx, cx-10, Y-59, cx+10, ab, 200, 140, '#444', 2);
  rect(ctx, cx-7, Y-58, cx-2, Y-54, WHT, '#bbb', 1);
  rect(ctx, cx+2, Y-58, cx+7, Y-54, WHT, '#bbb', 1);
  // arms
  if (['stand','run1','run2'].includes(action)) {
    line(ctx, cx-20,Y-44, cx-32,Y-35, YEL,4,'round');
    line(ctx, cx+20,Y-44, cx+32,Y-35, YEL,4,'round');
  } else if (action==='grab') {
    line(ctx, cx-20,Y-44, cx-36,Y-42, YEL,4,'round');
    line(ctx, cx+20,Y-44, cx+36,Y-42, YEL,4,'round');
  } else if (['flee','happy'].includes(action)) {
    line(ctx, cx-20,Y-44, cx-28,Y-54, YEL,4,'round');
    line(ctx, cx+20,Y-44, cx+30,Y-35, YEL,4,'round');
  }
  // coin
  if (coin) {
    oval(ctx, cx-30,Y-62, cx-18,Y-50, '#f5c842','#c8a820',2);
    txt(ctx, cx-24, Y-56, '$', '#8B6914', 10, true);
  }
}

// ── draw Patrick ───────────────────────────────────────────────────────────
function drawPatrick(ctx, cx, gy) {
  const Y=gy, PINK='#ff9eb5', DPK='#c4607a';
  const cy=Y-32, R=24, r=11;

  // star body
  const pts=[];
  for (let i=0; i<10; i++) {
    const a = Math.PI*i/5 - Math.PI/2;
    const rad = i%2===0 ? R : r;
    pts.push(cx+rad*Math.cos(a), cy+rad*Math.sin(a));
  }
  poly(ctx, pts, PINK, DPK, 1);

  // shorts
  rect(ctx, cx-13, Y-18, cx+13, Y-7, '#5a3a8a', '#3a1a6a', 1);
  oval(ctx, cx-3, Y-16, cx+3, Y-10, '#f5c518', null);

  // face
  const fy=cy-2;
  for (const ex of [-6,6]) {
    oval(ctx, cx+ex-4, fy-4, cx+ex+4, fy+4, 'white','#444',1);
    oval(ctx, cx+ex-2, fy-2, cx+ex+2, fy+2, '#111', null);
  }
  arc(ctx, cx-7, fy+3, cx+7, fy+10, 200, 140, '#444', 1);
}

// ── robbery animation ──────────────────────────────────────────────────────
let _animTimer = null;

function robberyFrame(ctx, W, GY, f, amount) {
  ctx.clearRect(0, 0, W, GY+10);
  const kx=100, px=310;

  // ground
  ctx.strokeStyle='#2e2e40'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke();

  const run = f%6<3 ? 'run1' : 'run2';

  // Patrick always visible
  drawPatrick(ctx, px, GY+2);

  if (f<=24) {
    const sx = Math.round(340 - (340-200)*f/24);
    drawKrabs(ctx, kx, GY, 'count');
    drawSpongebob(ctx, sx, GY, run, false);
  } else if (f<=42) {
    const p=(f-25)/17;
    drawKrabs(ctx, kx, GY, p>0.5?'shocked':'count');
    drawSpongebob(ctx, 200, GY, 'grab', false);
    if (p>0.4) txt(ctx, 185, 18, 'GIVE ME THE MONEY!!', '#f76a6a', 14, true);
  } else if (f<=58) {
    const p=(f-43)/15;
    drawKrabs(ctx, kx, GY, 'shocked');
    drawSpongebob(ctx, 200, GY, 'grab', false);
    for (const [i,[dy,sz]] of [[0,[0,11]],[1,[-14,9]],[2,[10,8]]]) {
      const t2=Math.min(p*1.6-i*0.3, 1);
      if (t2>0) {
        const fx=Math.round((kx-35)+(178-(kx-35))*t2);
        const fy=Math.round(GY-41+dy-22*t2);
        oval(ctx, fx-sz/2, fy-sz/2, fx+sz/2, fy+sz/2, '#f5c842','#c8a820',1);
        txt(ctx, fx, fy, '$', '#8B6914', 10, true);
      }
    }
    txt(ctx, kx, GY-90, 'ME MONEY!!!', '#d63000', 14, true);
  } else if (f<=78) {
    const p=(f-59)/20;
    const sx=Math.round(200-230*p);
    drawKrabs(ctx, kx, GY, 'empty');
    drawSpongebob(ctx, sx, GY, f%6<3?'flee':'happy', true);
    txt(ctx, Math.max(sx,10), GY-82, "I'M READY!", '#f7c96a', 14, true);
  } else {
    drawKrabs(ctx, kx, GY, 'empty');
    txt(ctx, kx, GY-90, 'me money...', '#7a7890', 13);
    for (const [tx,ty] of [[kx-10,GY-68],[kx+10,GY-68]]) {
      const dr=Math.min((f-79)*3,18);
      oval(ctx, tx-2, ty, tx+2, ty+dr, '#4ecb8d', null);
    }
  }
}

function paydayFrame(ctx, W, GY, f, amount) {
  ctx.clearRect(0, 0, W, GY+10);
  const kx=110, sx=255, px=320;

  ctx.strokeStyle='#2e2e40'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke();

  drawPatrick(ctx, px, GY+2);

  if (f<=20) {
    const p=f/20;
    drawKrabs(ctx, kx, GY, 'count');
    drawSpongebob(ctx, sx, GY, 'stand', false);
    if (p>0.5) txt(ctx, sx, GY-82, 'is it Friday?', '#7a7890', 13);
  } else if (f<=42) {
    const p=(f-21)/21;
    drawKrabs(ctx, kx, GY, 'shocked');
    drawSpongebob(ctx, sx, GY, 'grab', false);
    txt(ctx, kx, GY-90, p>0.5 ? 'me money... :((' : 'fine... FINE...', '#d63000', 14, true);
  } else if (f<=58) {
    const p=(f-43)/15;
    drawKrabs(ctx, kx, GY, 'shocked');
    drawSpongebob(ctx, sx, GY, 'grab', false);
    for (const [i,[dy,sz]] of [[0,[0,11]],[1,[-10,9]],[2,[8,8]]]) {
      const t2=Math.min(p*1.6-i*0.3,1);
      if (t2>0) {
        const fx=Math.round((kx-35)+(sx-20-(kx-35))*t2);
        const fy=Math.round(GY-41+dy-22*t2);
        oval(ctx, fx-sz/2, fy-sz/2, fx+sz/2, fy+sz/2, '#f5c842','#c8a820',1);
        txt(ctx, fx, fy, '$', '#8B6914', 10, true);
      }
    }
  } else if (f<=76) {
    drawKrabs(ctx, kx, GY, 'empty');
    drawSpongebob(ctx, sx, GY, f%8<4?'happy':'flee', true);
    txt(ctx, sx, GY-82, 'PAYDAY!!!', '#4ecb8d', 15, true);
    txt(ctx, kx, GY-90, 'me money...', '#d63000', 13);
    for (const [tx,ty] of [[kx-10,GY-68],[kx+10,GY-68]]) {
      const dr=Math.min((f-59)*3,18);
      oval(ctx, tx-2, ty, tx+2, ty+dr, '#4ecb8d', null);
    }
  } else {
    drawKrabs(ctx, kx, GY, 'empty');
    drawSpongebob(ctx, sx, GY, 'happy', true);
    txt(ctx, sx, GY-82, 'PAYDAY!!!', '#4ecb8d', 15, true);
    for (const [tx,ty] of [[kx-10,GY-68],[kx+10,GY-68]])
      oval(ctx, tx-2, ty, tx+2, ty+18, '#4ecb8d', null);
  }
}

// ── overlay control ────────────────────────────────────────────────────────
function runAnim(title, titleColor, frameFn, amount) {
  if (_animTimer) { clearTimeout(_animTimer); _animTimer=null; }

  const overlay  = document.getElementById('anim-overlay');
  const titleEl  = document.getElementById('anim-title');
  const canvas   = document.getElementById('anim-canvas');
  const dismiss  = document.getElementById('anim-dismiss');
  const ctx      = canvas.getContext('2d');
  const W=340, GY=128;

  // HiDPI fix — makes text crisp on retina/phone screens
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = W   * dpr;
  canvas.height = (GY + 10) * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = (GY + 10) + 'px';
  ctx.scale(dpr, dpr);

  titleEl.textContent  = title;
  titleEl.style.color  = titleColor;
  overlay.querySelector('.anim-card').style.borderTopColor = titleColor;
  const dismissLabels = { expense: ['rip 💸', 'ouch 🤕', 'there it goes...', 'my wallet...'], income: ["let's go 💰", 'cha-ching! 🤑', 'get money 💵', 'bag secured 🎒'] };
  const pool = titleColor === '#f76a6a' ? dismissLabels.expense : dismissLabels.income;
  dismiss.textContent  = pool[Math.floor(Math.random() * pool.length)];
  overlay.classList.remove('hidden');

  let f=0;
  function step() {
    frameFn(ctx, W, GY, f, amount);
    if (f<90) {
      _animTimer = setTimeout(() => { f++; step(); }, 45);
    } else {
      _animTimer = setTimeout(() => overlay.classList.add('hidden'), 2000);
    }
  }
  step();

  dismiss.onclick = () => {
    if (_animTimer) { clearTimeout(_animTimer); _animTimer=null; }
    overlay.classList.add('hidden');
  };
}

// ── balance milestone ──────────────────────────────────────────────────────
function showBalanceMilestone() {
  const palette = ['#4ecb8d','#7c6af7','#f7c96a','#f7936a','#ff9eb5'];
  const particles = [...Array(40)].map(() => ({
    x:  170 + Math.random() * 20 - 10,
    y:  80  + Math.random() * 20 - 10,
    vx: Math.random() * 8 - 4,
    vy: Math.random() * -8 - 2,
    color: palette[Math.floor(Math.random() * palette.length)],
    size: Math.random() * 5 + 3,
  }));

  function balanceMilestoneFrame(ctx, W, GY, f) {
    ctx.clearRect(0, 0, W, GY + 10);
    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.4;
      oval(ctx, p.x - p.size / 2, p.y - p.size / 2, p.x + p.size / 2, p.y + p.size / 2, p.color, null);
    });
    txt(ctx, W / 2, 20, 'POSITIVE BALANCE!', '#4ecb8d', 15, true);
  }

  runAnim('Balance is positive! 🎉', '#4ecb8d', (ctx, W, GY, f) => balanceMilestoneFrame(ctx, W, GY, f), 0);
}

// ── week win ───────────────────────────────────────────────────────────────
function showWeekWin() {
  function weekWinFrame(ctx, W, GY, f) {
    ctx.clearRect(0, 0, W, GY + 10);
    drawSpongebob(ctx, W / 2, GY, 'happy', false);
    txt(ctx, W / 2, GY - 90, 'UNDER BUDGET!', '#4ecb8d', 15, true);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4 + f * 0.1;
      const cx = W / 2 + 60 * Math.cos(angle);
      const cy = GY   + 60 * Math.sin(angle);
      oval(ctx, cx - 5, cy - 5, cx + 5, cy + 5, '#4ecb8d', null);
    }
  }
  runAnim('Week under budget! 🏆', '#4ecb8d', weekWinFrame, 0);
}

// ── Gengar draw ────────────────────────────────────────────────────────────
function drawGengar(ctx, cx, gy, action) {
  const Y = gy;
  const PRP = '#7b3fb5', DRK = '#4a1878', LPRP = '#b060e8', RED = '#f03030', WHT = '#f8f0ff';

  // spiky bottom hem
  const spikes = 5, bx = cx - 26, bw = 52, by = Y - 14;
  ctx.beginPath(); ctx.moveTo(bx, by);
  for (let i = 0; i < spikes; i++) {
    const x1 = bx + (i + 0.5) * (bw / spikes);
    const x2 = bx + (i + 1)   * (bw / spikes);
    ctx.lineTo(x1, Y + 4); ctx.lineTo(x2, by);
  }
  ctx.fillStyle = PRP; ctx.fill();

  // body
  oval(ctx, cx - 26, Y - 60, cx + 26, Y - 12, PRP, DRK, 2);

  // ears / horn spikes on head
  poly(ctx, [cx - 22, Y - 60, cx - 32, Y - 80, cx - 12, Y - 64], PRP, DRK, 1);
  poly(ctx, [cx + 22, Y - 60, cx + 32, Y - 80, cx + 12, Y - 64], PRP, DRK, 1);

  // eyes — red with white gleam
  for (const ex of [-9, 9]) {
    oval(ctx, cx + ex - 7, Y - 72, cx + ex + 7, Y - 58, RED, '#800', 1);
    oval(ctx, cx + ex - 3, Y - 69, cx + ex + 1, Y - 65, WHT, null);
  }

  // mouth / grin
  if (action === 'scare') {
    ctx.beginPath();
    ctx.arc(cx, Y - 42, 13, 0, Math.PI);
    ctx.fillStyle = '#200830'; ctx.fill();
    ctx.strokeStyle = DRK; ctx.lineWidth = 1.5; ctx.stroke();
    // fangs
    poly(ctx, [cx - 10, Y - 42, cx - 6, Y - 34, cx - 2, Y - 42], WHT, null);
    poly(ctx, [cx + 2,  Y - 42, cx + 6, Y - 34, cx + 10, Y - 42], WHT, null);
  } else {
    // normal grin
    arc(ctx, cx - 12, Y - 52, cx + 12, Y - 36, 10, 160, DRK, 2);
    poly(ctx, [cx - 8, Y - 44, cx - 4, Y - 38, cx, Y - 44], WHT, null);
    poly(ctx, [cx,     Y - 44, cx + 4, Y - 38, cx + 8, Y - 44], WHT, null);
  }

  // stubby arms
  if (action === 'grab' || action === 'reach') {
    oval(ctx, cx - 46, Y - 48, cx - 24, Y - 34, PRP, DRK, 2);
    oval(ctx, cx + 24, Y - 48, cx + 46, Y - 34, PRP, DRK, 2);
  } else {
    oval(ctx, cx - 40, Y - 42, cx - 20, Y - 30, PRP, DRK, 2);
    oval(ctx, cx + 20, Y - 42, cx + 40, Y - 30, PRP, DRK, 2);
  }

  // ghost shadow glow
  ctx.save();
  ctx.globalAlpha = 0.18;
  oval(ctx, cx - 22, Y - 8, cx + 22, Y, LPRP, null);
  ctx.restore();
}

// ── T-Rex draw ─────────────────────────────────────────────────────────────
function drawTRex(ctx, cx, gy, action) {
  const Y = gy;
  const GRN = '#3a6e28', DGRN = '#224416', SKIN = '#4e8a38', EYE = '#f0d840';

  // tail
  poly(ctx, [cx + 22, Y - 38, cx + 60, Y - 20, cx + 58, Y - 12, cx + 22, Y - 28], GRN, DGRN, 1);

  // body
  oval(ctx, cx - 18, Y - 52, cx + 28, Y - 18, GRN, DGRN, 2);

  // upper leg + foot
  rect(ctx, cx - 6, Y - 22, cx + 6, Y - 6, DGRN, null);
  oval(ctx, cx - 12, Y - 8, cx + 10, Y, GRN, DGRN, 1);

  // tiny arms
  if (action === 'roar') {
    line(ctx, cx - 18, Y - 44, cx - 30, Y - 52, SKIN, 4, 'round');
    line(ctx, cx - 30, Y - 52, cx - 28, Y - 44, SKIN, 3, 'round');
  } else {
    line(ctx, cx - 18, Y - 44, cx - 28, Y - 46, SKIN, 4, 'round');
    line(ctx, cx - 28, Y - 46, cx - 26, Y - 40, SKIN, 3, 'round');
  }

  // neck + head
  poly(ctx, [cx - 14, Y - 50, cx - 10, Y - 72, cx + 8, Y - 72, cx + 10, Y - 50], GRN, DGRN, 1);

  // head (big snout)
  oval(ctx, cx - 18, Y - 90, cx + 24, Y - 60, GRN, DGRN, 2);

  // eye
  oval(ctx, cx - 6, Y - 88, cx + 4, Y - 80, EYE, '#806000', 1);
  oval(ctx, cx - 3, Y - 86, cx + 1, Y - 82, '#111', null);

  // jaw
  if (action === 'roar' || action === 'chomp') {
    // open jaw
    poly(ctx, [cx - 18, Y - 66, cx + 24, Y - 66, cx + 24, Y - 56, cx - 18, Y - 56], DGRN, DGRN, 1);
    poly(ctx, [cx - 16, Y - 66, cx + 22, Y - 66, cx + 20, Y - 58, cx - 16, Y - 58], '#c04040', null);
    // teeth
    for (let i = 0; i < 5; i++) {
      const tx = cx - 14 + i * 9;
      poly(ctx, [tx, Y - 66, tx + 4, Y - 72, tx + 8, Y - 66], '#f0f0d8', null);
      poly(ctx, [tx, Y - 58, tx + 4, Y - 52, tx + 8, Y - 58], '#f0f0d8', null);
    }
  } else {
    // closed mouth line
    line(ctx, cx - 16, Y - 62, cx + 22, Y - 62, DGRN, 2);
    for (let i = 0; i < 4; i++) {
      poly(ctx, [cx - 12 + i * 10, Y - 62, cx - 8 + i * 10, Y - 68, cx - 4 + i * 10, Y - 62], '#f0f0d8', null);
    }
  }

  // JP stripes
  for (let i = 0; i < 3; i++) {
    line(ctx, cx - 6 + i * 6, Y - 50, cx - 4 + i * 6, Y - 30, DGRN, 2);
  }
}

// ── Gengar animations ──────────────────────────────────────────────────────
function gengarExpenseFrame(ctx, W, GY, f) {
  ctx.clearRect(0, 0, W, GY + 10);
  ctx.strokeStyle = '#2e2840'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();

  const bob = Math.sin(f * 0.2) * 5; // ghost floating

  if (f <= 20) {
    drawGengar(ctx, W / 2, GY - 10 + bob, 'normal');
    txt(ctx, W / 2, GY - 100, 'ooOOoo...', '#9b5fc7', 13);
  } else if (f <= 45) {
    const p = (f - 21) / 24;
    drawGengar(ctx, W / 2, GY - 10 + bob, 'reach');
    if (p > 0.4) txt(ctx, W / 2, GY - 100, 'YOUR WALLET... MINE! 👻', '#c45f9b', 14, true);
    // coins flying toward Gengar
    for (const [i, [dy, sz]] of [[0,[0,10]],[1,[-12,8]],[2,[10,7]]].entries()) {
      const t2 = Math.min(p * 1.5 - i * 0.2, 1);
      if (t2 > 0) {
        const fx = Math.round(60 + (W / 2 - 20 - 60) * t2);
        const fy = Math.round(GY - 36 + dy - 20 * t2);
        oval(ctx, fx - sz/2, fy - sz/2, fx + sz/2, fy + sz/2, '#f5c842', '#c8a820', 1);
        txt(ctx, fx, fy, '$', '#8B6914', 9, true);
      }
    }
  } else if (f <= 70) {
    drawGengar(ctx, W / 2, GY - 10 + bob, 'scare');
    txt(ctx, W / 2, GY - 100, 'CONSUMED! 💸', '#f76a6a', 15, true);
    // purple sparkles
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + f * 0.1;
      const r = 30 + Math.sin(f * 0.3 + i) * 8;
      oval(ctx, W/2 + Math.cos(a)*r - 4, GY - 38 + Math.sin(a)*r - 4,
               W/2 + Math.cos(a)*r + 4, GY - 38 + Math.sin(a)*r + 4, '#b060e8', null);
    }
  } else {
    drawGengar(ctx, W / 2, GY - 10 + bob, 'normal');
    txt(ctx, W / 2, GY - 100, 'rip your money...', '#9080b8', 13);
  }
}

function gengarIncomeFrame(ctx, W, GY, f) {
  ctx.clearRect(0, 0, W, GY + 10);
  ctx.strokeStyle = '#2e2840'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();

  const bob = Math.sin(f * 0.22) * 6;

  if (f <= 25) {
    drawGengar(ctx, W / 2, GY - 10 + bob, 'normal');
    txt(ctx, W / 2, GY - 100, 'something incoming...', '#9b5fc7', 12);
  } else if (f <= 55) {
    const p = (f - 26) / 29;
    drawGengar(ctx, W / 2, GY - 10 + bob, 'reach');
    txt(ctx, W / 2, GY - 100, p > 0.5 ? 'YOINK! 👻' : 'ooh ooh ooh...', '#9b5fc7', 14, true);
    for (const [i, [dy, sz]] of [[0,[0,11]],[1,[-10,9]],[2,[8,8]]].entries()) {
      const t2 = Math.min(p * 1.5 - i * 0.3, 1);
      if (t2 > 0) {
        const fx = Math.round(W - 40 - (W - 40 - (W/2 - 10)) * t2);
        const fy = Math.round(GY - 20 + dy - 25 * t2);
        oval(ctx, fx-sz/2, fy-sz/2, fx+sz/2, fy+sz/2, '#f5c842', '#c8a820', 1);
        txt(ctx, fx, fy, '$', '#8B6914', 10, true);
      }
    }
  } else {
    drawGengar(ctx, W / 2, GY - 10 + bob, 'scare');
    txt(ctx, W / 2, GY - 100, 'GHOST GOT PAID! 👻', '#9b5fc7', 15, true);
    // celebration sparkles
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + f * 0.08;
      const r = 36 + Math.sin(f * 0.25 + i) * 10;
      const c = i % 2 === 0 ? '#9b5fc7' : '#c45f9b';
      oval(ctx, W/2+Math.cos(a)*r-3, GY-40+Math.sin(a)*r-3,
               W/2+Math.cos(a)*r+3, GY-40+Math.sin(a)*r+3, c, null);
    }
  }
}

// ── T-Rex animations ───────────────────────────────────────────────────────
function trexExpenseFrame(ctx, W, GY, f) {
  ctx.clearRect(0, 0, W, GY + 10);
  // JP amber ground line
  ctx.strokeStyle = '#3a2e10'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();

  if (f <= 20) {
    drawTRex(ctx, W / 2 - 10, GY, 'normal');
    txt(ctx, W / 2, 18, '...objects in mirror...', '#c8a020', 12);
  } else if (f <= 44) {
    const p = (f - 21) / 23;
    drawTRex(ctx, W / 2 - 10, GY, 'roar');
    txt(ctx, W / 2, 18, p > 0.5 ? 'ROAAARRR!! 🦖' : 'hold onto your wallet!', '#c84030', 14, true);
    // coins flying in
    for (const [i, [dy, sz]] of [[0,[0,10]],[1,[-10,8]],[2,[8,7]]].entries()) {
      const t2 = Math.min(p * 1.6 - i * 0.25, 1);
      if (t2 > 0) {
        const fx = Math.round(W - 30 - (W - 30 - (W/2 + 10)) * t2);
        const fy = Math.round(GY - 30 + dy - 25 * t2);
        oval(ctx, fx-sz/2, fy-sz/2, fx+sz/2, fy+sz/2, '#f5c842', '#c8a820', 1);
        txt(ctx, fx, fy, '$', '#8B6914', 9, true);
      }
    }
  } else if (f <= 70) {
    drawTRex(ctx, W / 2 - 10, GY, 'chomp');
    txt(ctx, W / 2, 18, 'LIFE, uh... FINDS A WAY 💸', '#c84030', 13, true);
    // impact lines
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const r1 = 15, r2 = 28;
      line(ctx, W/2+Math.cos(a)*r1, GY-70+Math.sin(a)*r1,
               W/2+Math.cos(a)*r2, GY-70+Math.sin(a)*r2, '#c8a020', 2);
    }
  } else {
    drawTRex(ctx, W / 2 - 10, GY, 'normal');
    txt(ctx, W / 2, 18, 'wallet... gone...', '#7a9460', 13);
  }
}

function trexIncomeFrame(ctx, W, GY, f) {
  ctx.clearRect(0, 0, W, GY + 10);
  ctx.strokeStyle = '#3a2e10'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();

  if (f <= 22) {
    drawTRex(ctx, W / 2 - 10, GY, 'normal');
    txt(ctx, W / 2, 18, 'clever girl...', '#c8a020', 13);
  } else if (f <= 50) {
    const p = (f - 23) / 27;
    drawTRex(ctx, W / 2 - 10, GY, 'roar');
    txt(ctx, W / 2, 18, p > 0.5 ? 'PAYDAY!! 🦖💰' : 'ohhh yes yes yes...', '#c8a020', 14, true);
    for (const [i, [dy, sz]] of [[0,[0,11]],[1,[-12,9]],[2,[9,8]]].entries()) {
      const t2 = Math.min(p * 1.5 - i * 0.3, 1);
      if (t2 > 0) {
        const fx = Math.round(30 + (W/2 - 15 - 30) * t2);
        const fy = Math.round(GY - 30 + dy - 28 * t2);
        oval(ctx, fx-sz/2, fy-sz/2, fx+sz/2, fy+sz/2, '#f5c842', '#c8a820', 1);
        txt(ctx, fx, fy, '$', '#8B6914', 10, true);
      }
    }
  } else {
    drawTRex(ctx, W / 2 - 10, GY, 'roar');
    txt(ctx, W / 2, 18, 'FEED THE REX! 🌿', '#5aaa40', 15, true);
    // amber sparkle burst
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + f * 0.07;
      const r = 34 + Math.sin(f * 0.2 + i) * 8;
      const c = i % 2 === 0 ? '#c8a020' : '#5aaa40';
      oval(ctx, W/2+Math.cos(a)*r-3, GY-55+Math.sin(a)*r-3,
               W/2+Math.cos(a)*r+3, GY-55+Math.sin(a)*r+3, c, null);
    }
  }
}

// ── theme helper ────────────────────────────────────────────────────────────
function _activeTheme() {
  try { return JSON.parse(localStorage.getItem('slawminyaw_settings') || '{}').theme || 'dark'; } catch(e) { return 'dark'; }
}

function showRobbery(amount) {
  const fmt = amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const theme = _activeTheme();
  if (theme === 'gengar') {
    runAnim(`Gengar ate $${fmt}... 👻`, '#c45f9b', gengarExpenseFrame, amount);
  } else if (theme === 'jurassicpark') {
    runAnim(`T-Rex chomped $${fmt} 🦖`, '#c84030', trexExpenseFrame, amount);
  } else {
    runAnim(`SpongeBob stole $${fmt}`, '#f76a6a', robberyFrame, amount);
  }
}

function showPayday(amount) {
  const fmt = amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const theme = _activeTheme();
  if (theme === 'gengar') {
    runAnim(`Gengar snagged $${fmt}! 👻`, '#9b5fc7', gengarIncomeFrame, amount);
  } else if (theme === 'jurassicpark') {
    runAnim(`Payday! +$${fmt} 🌿`, '#c8a020', trexIncomeFrame, amount);
  } else {
    runAnim(`payday!  +$${fmt}`, '#4ecb8d', paydayFrame, amount);
  }
}
