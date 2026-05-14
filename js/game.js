const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// RESİMLER
// =====================
const penguinImage = new Image();
penguinImage.src = "assets/images/penguin.png";

const iceCracks = new Image();
iceCracks.src = "assets/images/iceCracks.png";

const waterImage = new Image();
waterImage.src = "assets/images/water.png";

const rockImage = new Image();
rockImage.src = "assets/images/rock.png";

const bearImage = new Image();
bearImage.src = "assets/images/polarBear.png";
let bearImageLoaded = false;
bearImage.onload = () => { bearImageLoaded = true; };

const iceBlockImage = new Image();
iceBlockImage.src = "assets/images/iceBlock.png";
let iceBlockImageLoaded = false;
iceBlockImage.onload = () => { iceBlockImageLoaded = true; };

// Sandık resimleri (yoksa canvas ile çizilir)
const chestClosedImage = new Image();
chestClosedImage.src = "assets/images/chest.png";
let chestClosedLoaded = false;
chestClosedImage.onload = () => { chestClosedLoaded = true; };

const chestOpenImage = new Image();
chestOpenImage.src = "assets/images/chestOpen.png";
let chestOpenLoaded = false;
chestOpenImage.onload = () => { chestOpenLoaded = true; };

// =====================
// SES
// =====================
const bgMusic = new Audio("assets/sounds/bgm.mp3");
bgMusic.loop   = true;
bgMusic.volume = 0.4;

let musicStarted = false;
function startMusic() {
    if (!musicStarted) {
        bgMusic.play().catch(() => {});
        musicStarted = true;
    }
}

function playSound(src, volume = 0.6) {
    const s = new Audio(src);
    s.volume = volume;
    s.play().catch(() => {});
}

// =====================
// OYUN DURUMLARI
// "menu" | "playing" | "win" | "lose"
// =====================
let gameState = "menu";

// Kazanma animasyonu
let winTimer     = 0;
let chestAnim    = 0;
let winParticles = [];

// =====================
// LEVEL SİSTEMİ
// =====================
let currentLevel    = 1;
let levelTransition = false;
let transitionAlpha = 0;
let transitionPhase = "none";
let transitionTimer = 0;

// Her level için toplanan enerji sayısı (level bazlı)
let levelEnergy = 0; // O levelde toplanan enerji

// =====================
// KAR TANELERİ
// =====================
const snowflakes = [];
for (let i = 0; i < 200; i++) {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 5 + 2,
        speed: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.5
    });
}

// =====================
// OYUNCU
// =====================
const player = {
    x: 150, y: 300,
    width: 40, height: 40,
    speed: 0.18, maxSpeed: 4,
    velX: 0, velY: 0,
    friction: 0.85,
    facingRight: true,
    hasAxe: false,
    hasKey: false,
    energy: 0  // Tüm oyun boyunca biriken enerji
};

let nearRock = false;

const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => { keys[e.key] = false; });

// =====================
// LEVEL TANIMLARI
// =====================
function getLevel1() {
    return {
        obstacles: [
            { x: 0,                  y: 0,                   width: canvas.width, height: 55 },
            { x: 0,                  y: canvas.height - 55,  width: canvas.width, height: 55 },
            { x: 0,                  y: 0,                   width: 55,           height: canvas.height },
            { x: canvas.width - 55,  y: 0,                   width: 55,           height: canvas.height },
            { x: 240,  y: 180,  width: 460, height: 55 },
            { x: 645,  y: 180,  width: 55,  height: 330 },
            { x: 410,  y: 455,  width: 290, height: 55 },
            { x: 1000, y: 150,  width: 320, height: 55 },
            { x: 1170, y: 150,  width: 55,  height: 300 },
            { x: 890,  y: 395,  width: 335, height: 55 }
        ],
        waters: [ { x: 400, y: 530, width: 300, height: 220 } ],
        rock: { x: 400, y: 60, width: 100, height: 100, velX: 0, velY: 0, pushPower: 0.4, friction: 0.88 },
        axe:  { x: 1080, y: 280, width: 35, height: 35, collected: false },
        key:  { x: 550,  y: 330, width: 30, height: 30, collected: false },
        iceBlocks: [
            { x: 400, y: 235, width: 55,  height: 220, health: 4, maxHealth: 4, broken: false, cracks: [], vertical: true  },
            { x: 700, y: 400, width: 190, height: 55,  health: 4, maxHealth: 4, broken: false, cracks: [], vertical: false }
        ],
        door: { x: canvas.width - 55, y: canvas.height - 260, width: 55, height: 150, visible: false, open: false },
        energies: [
            { x: 180,  y: 650, radius: 18, collected: false },
            { x: 1020, y: 100, radius: 18, collected: false },
            { x: 1400, y: 100, radius: 18, collected: false },
            { x: 1275, y: 300, radius: 18, collected: false },
            { x: 1020, y: 650, radius: 18, collected: false },
        ],
        bears: [
            { x: 900, y: 65, width: 60, height: 60, speed: 1.8, direction: -1, facingRight: false,
              patrolType: "horizontal", minX: 55, maxX: canvas.width - 55 }
        ],
        chest: null,
        totalEnergies: 5  // Bu levelde toplanabilecek enerji sayısı
    };
}

function getLevel2() {
    const W = canvas.width, H = canvas.height;
    return {
        obstacles: [
            { x: 0,       y: 0,       width: W,   height: 55 },
            { x: 0,       y: H - 55,  width: W,   height: 55 },
            { x: 0,       y: 0,       width: 55,  height: H  },
            { x: W - 55,  y: 0,       width: 55,  height: H  },
            { x: 150,  y: 130,  width: 350, height: 50 },
            { x: 150,  y: 130,  width: 50,  height: 280 },
            { x: 150,  y: 360,  width: 300, height: 50 },
            { x: 250,  y: 220,  width: 200, height: 45 },
            { x: 630,  y: 180,  width: 50,  height: 200 },
            { x: 630,  y: 380,  width: 50,  height: 200 },
            { x: 680,  y: 365,  width: 180, height: 45  },
            { x: 950,  y: 120,  width: 400, height: 50 },
            { x: 950,  y: 120,  width: 50,  height: 200 },
            { x: 1000, y: 270,  width: 250, height: 45 },
            { x: 1250, y: 270,  width: 50,  height: 160 },
            { x: 950,  y: 430,  width: 350, height: 50  },
        ],
        waters: [
            { x: 200,  y: 450, width: 180, height: 160 },
            { x: 700,  y: 180, width: 160, height: 160 },
            { x: 1000, y: 500, width: 200, height: 160 },
        ],
        rock: { x: 250, y: 650, width: 90, height: 90, velX: 0, velY: 0, pushPower: 0.4, friction: 0.88 },
        axe:  { x: 1200, y: 350, width: 35, height: 35, collected: false },
        key:  { x: 1080, y: 200, width: 30, height: 30, collected: false },
        iceBlocks: [
            { x: 450,  y: 180, width: 50, height: 180, health: 4, maxHealth: 4, broken: false, cracks: [], vertical: true },
            { x: 1300, y: 170, width: 50, height: 100, health: 4, maxHealth: 4, broken: false, cracks: [], vertical: true }
        ],
        door: { x: W - 55, y: H - 280, width: 55, height: 150, visible: false, open: false },
        energies: [
            { x: 300,  y: 310, radius: 18, collected: false },
            { x: 900,  y: 220, radius: 18, collected: false },
            { x: 1140, y: 90,  radius: 18, collected: false },
            { x: 1350, y: 350, radius: 18, collected: false },
            { x: 300,  y: 90,  radius: 18, collected: false },
        ],
        bears: [
            { x: 700, y: 55, width: 60, height: 60, speed: 2.0, direction: 1, facingRight: true,
              patrolType: "horizontal", minX: 55, maxX: W - 55 },
            { x: 545, y: 135, width: 50, height: 50, speed: 1.6, direction: 1, facingRight: true,
              patrolType: "vertical", minY: 135, maxY: 355 }
        ],
        chest: null,
        totalEnergies: 5
    };
}

function getLevel3() {
    const W = canvas.width, H = canvas.height;
    return {
        obstacles: [
            { x: 0,       y: 0,       width: W,   height: 55 },
            { x: 0,       y: H - 55,  width: W,   height: 55 },
            { x: 0,       y: 0,       width: 55,  height: H  },
            { x: W - 55,  y: 0,       width: 55,  height: H  },
            { x: 100,  y: 120,  width: 300, height: 50  },
            { x: 100,  y: 120,  width: 50,  height: 220 },
            { x: 100,  y: 290,  width: 200, height: 50  },
            { x: 150,  y: 460,  width: 450, height: 50  },
            { x: 450,  y: 510,  width: 50,  height: 150 },
            { x: 660,  y: 100,  width: 50,  height: 360 },
            { x: 710,  y: 330,  width: 170, height: 50  },
            { x: 830,  y: 100,  width: 50,  height: 180 },
            { x: 600,  y: 460,  width: 200, height: 50  },
            { x: 980,  y: 100,  width: 50,  height: 250 },
            { x: 980,  y: 100,  width: 270, height: 50  },
            { x: 1250, y: 100,  width: 50,  height: 120 },
            { x: 1100, y: 220,  width: 200, height: 45  },
            { x: 980,  y: 310,  width: 150, height: 45  },
            { x: 950,  y: 450,  width: 350, height: 50  },
            { x: 950,  y: 450,  width: 50,  height: 220 },
            { x: 1200, y: 500,  width: 50,  height: 170 },
        ],
        waters: [
            { x: 440,  y: 120, width: 200, height: 120 },
            { x: 620,  y: 520, width: 180, height: 170 },
            { x: 1270, y: 620, width: 190, height: 140 },
        ],
        rock: { x: 70, y: 520, width: 90, height: 90, velX: 0, velY: 0, pushPower: 0.4, friction: 0.88 },
        axe:  { x: 1160, y: 160, width: 35, height: 35, collected: false },
        key:  { x: 1080, y: 530, width: 30, height: 30, collected: false },
        iceBlocks: [
            { x: 250,  y: 340, width: 50,  height: 120, health: 5, maxHealth: 5, broken: false, cracks: [], vertical: true },
            { x: 1000, y: 620, width: 200, height: 50,  health: 5, maxHealth: 5, broken: false, cracks: [], vertical: false },
            { x: 1300, y: 450, width: 170, height: 50,  health: 5, maxHealth: 5, broken: false, cracks: [], vertical: false },
            { x: 950,  y: 670, width: 55,  height: 95,  health: 5, maxHealth: 5, broken: false, cracks: [], vertical: true },
        ],
        door: null,
        // Sandık kapının tam yerine konuluyor (sağ duvar, alt bölge)
        chest: {
            x: W - 115,
            y: H - 300,
            width: 80, height: 70,
            visible: false, open: false
        },
        energies: [
            { x: 710,  y: 720, radius: 18, collected: false },
            { x: 330,  y: 600, radius: 18, collected: false },
            { x: 250,  y: 220, radius: 18, collected: false },
            { x: 740,  y: 150, radius: 18, collected: false },
            { x: 1225, y: 720, radius: 18, collected: false },
        ],
        bears: [
            { x: 55, y: 60, width: 60, height: 60, speed: 2.5, direction: 1, facingRight: true,
              patrolType: "horizontal", minX: 55, maxX: 1100 },
            { x: 720, y: 150, width: 55, height: 55, speed: 2.0, direction: 1, facingRight: true,
              patrolType: "vertical", minY: 100, maxY: 320 },
            { x: 830, y: 55, width: 40, height: 40, speed: 1.8, direction: 1, facingRight: false,
              patrolType: "horizontal", minX: 830, maxX: canvas.width - 55 }
        ],
        totalEnergies: 5
    };
}

// Aktif level
let L = getLevel1();

// =====================
// LEVEL SIFIRLAMA
// Suya/ayıya değince o levelin en başına dön
// Toplanan enerjiler ve eşyalar sıfırlanır
// =====================
function resetCurrentLevel() {
    player.velX = 0; player.velY = 0;
    player.hasAxe = false; player.hasKey = false;
    // O level için toplanan enerjiyi geri al
    player.energy -= levelEnergy;
    levelEnergy = 0;

    if (currentLevel === 1)      L = getLevel1();
    else if (currentLevel === 2) L = getLevel2();
    else if (currentLevel === 3) L = getLevel3();

    player.x = 150; player.y = 300;
    playSound("assets/sounds/fail.mp3", 0.7);
}

// =====================
// ÇARPIŞMA
// =====================
function checkCollision(a, b) {
    return (
        a.x < b.x + b.width  && a.x + a.width  > b.x &&
        a.y < b.y + b.height && a.y + a.height > b.y
    );
}

function resolveCollision(mover, fixed) {
    const oL = (mover.x + mover.width)  - fixed.x;
    const oR = (fixed.x + fixed.width)  - mover.x;
    const oT = (mover.y + mover.height) - fixed.y;
    const oB = (fixed.y + fixed.height) - mover.y;
    const minX = Math.min(oL, oR);
    const minY = Math.min(oT, oB);
    if (minX < minY) {
        mover.x = oL < oR ? fixed.x - mover.width : fixed.x + fixed.width;
        if (mover.velX !== undefined) mover.velX = 0;
    } else {
        mover.y = oT < oB ? fixed.y - mover.height : fixed.y + fixed.height;
        if (mover.velY !== undefined) mover.velY = 0;
    }
}

function resolveRockBearCollision(rock, bear) {
    const oL = (rock.x + rock.width)  - bear.x;
    const oR = (bear.x + bear.width)  - rock.x;
    const oT = (rock.y + rock.height) - bear.y;
    const oB = (bear.y + bear.height) - rock.y;
    const minX = Math.min(oL, oR);
    const minY = Math.min(oT, oB);
    if (minX < minY) { rock.x = oL < oR ? bear.x - rock.width : bear.x + bear.width; rock.velX = 0; }
    else             { rock.y = oT < oB ? bear.y - rock.height : bear.y + bear.height; rock.velY = 0; }
}

// =====================
// LEVEL GEÇİŞİ
// =====================
function startLevelTransition() {
    if (levelTransition) return;
    levelTransition = true;
    transitionPhase = "fadeOut";
    transitionAlpha = 0;
    transitionTimer = 0;
    playSound("assets/sounds/levelUp.mp3");
}

function loadNextLevel() {
    currentLevel++;
    levelEnergy = 0; // Yeni levelde enerji sayacı sıfırla
    player.x = 150; player.y = 300;
    player.velX = 0; player.velY = 0;
    player.hasAxe = false; player.hasKey = false;
    if (currentLevel === 2) L = getLevel2();
    else if (currentLevel === 3) L = getLevel3();
}

// =====================
// KAZANMA
// =====================
function triggerWin() {
    gameState    = "win";
    winTimer     = 0;
    chestAnim    = 0;
    winParticles = [];
    for (let i = 0; i < 80; i++) {
        winParticles.push({
            x: canvas.width / 2, y: canvas.height / 2 - 50,
            vx: (Math.random() - 0.5) * 10,
            vy: -(Math.random() * 8 + 2),
            size: Math.random() * 10 + 3,
            alpha: 1,
            color: ["#FFD700","#FFA500","#FF6600","#FFEC8B"][Math.floor(Math.random()*4)]
        });
    }
    playSound("assets/sounds/levelUp.mp3", 1.0);
}

// =====================
// YENİLGİ — yeterli enerji yok
// =====================
function triggerLose() {
    gameState = "lose";
    playSound("assets/sounds/lose.mp3", 1.0);
}

// =====================
// MOUSE OLAYLARI
// =====================
canvas.addEventListener("click", (e) => {

    // Menü
    if (gameState === "menu") {
        const bx=canvas.width/2-120, by=canvas.height/2+30;
        if (e.clientX>bx && e.clientX<bx+240 && e.clientY>by && e.clientY<by+60) {
            gameState = "playing"; startMusic();
        }
        return;
    }

    // Kazanma — tekrar oyna
    if (gameState === "win") {
        const bx=canvas.width/2-120, by=canvas.height/2+130;
        if (e.clientX>bx && e.clientX<bx+240 && e.clientY>by && e.clientY<by+60) {
            currentLevel=1; levelEnergy=0;
            player.x=150; player.y=300; player.velX=0; player.velY=0;
            player.hasAxe=false; player.hasKey=false; player.energy=0;
            L=getLevel1(); gameState="playing";
        }
        return;
    }

    // Yenilgi — oyunun en başına dön (level 1, her şey sıfır)
    if (gameState === "lose") {
        const bx=canvas.width/2-120, by=canvas.height/2+140;
        if (e.clientX>bx && e.clientX<bx+240 && e.clientY>by && e.clientY<by+60) {
            currentLevel=1; levelEnergy=0;
            player.x=150; player.y=300; player.velX=0; player.velY=0;
            player.hasAxe=false; player.hasKey=false; player.energy=0;
            L=getLevel1(); gameState="playing";
        }
        return;
    }

    // Oyun içi buz kırma
    startMusic();
    if (!player.hasAxe) return;
    const mx=e.clientX, my=e.clientY;
    for (let block of L.iceBlocks) {
        if (block.broken) continue;
        if (mx>block.x && mx<block.x+block.width && my>block.y && my<block.y+block.height) {
            const dist=Math.hypot((player.x+player.width/2)-(block.x+block.width/2),
                                   (player.y+player.height/2)-(block.y+block.height/2));
            if (dist>200) return;
            block.health--;
            playSound("assets/sounds/iceHit.mp3", 1.0);
            for (let i=0;i<4;i++) block.cracks.push({
                x1:Math.random()*block.width, y1:Math.random()*block.height,
                x2:Math.random()*block.width, y2:Math.random()*block.height
            });
            if (block.health<=0) { block.broken=true; playSound("assets/sounds/iceBreak.mp3",1.0); }
        }
    }
});

// =====================
// UPDATE
// =====================
let energyPulse = 0;

function update() {
    if (gameState !== "playing") {
        // Kazanma animasyonu
        if (gameState === "win") {
            winTimer++;
            chestAnim = Math.min(1, chestAnim + 0.025);
            for (let p of winParticles) {
                p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.alpha=Math.max(0,p.alpha-0.007);
            }
        }
        return;
    }

    if (levelTransition) {
        transitionTimer++;
        if (transitionPhase==="fadeOut") {
            transitionAlpha=Math.min(1,transitionTimer/60);
            if (transitionAlpha>=1) { loadNextLevel(); transitionPhase="wait"; transitionTimer=0; }
        } else if (transitionPhase==="wait") {
            if (transitionTimer>80) { transitionPhase="fadeIn"; transitionTimer=0; }
        } else if (transitionPhase==="fadeIn") {
            transitionAlpha=Math.max(0,1-transitionTimer/60);
            if (transitionAlpha<=0) { levelTransition=false; transitionPhase="none"; }
        }
        return;
    }

    energyPulse += 0.05;

    const rockDist=Math.hypot((player.x+player.width/2)-(L.rock.x+L.rock.width/2),
                               (player.y+player.height/2)-(L.rock.y+L.rock.height/2));
    nearRock = rockDist < 120;

    // --- OYUNCU ---
    if (keys["ArrowRight"]||keys["d"]) { player.velX+=player.speed; player.facingRight=true; }
    if (keys["ArrowLeft"] ||keys["a"]) { player.velX-=player.speed; player.facingRight=false; }
    if (keys["ArrowUp"]   ||keys["w"]) { player.velY-=player.speed; }
    if (keys["ArrowDown"] ||keys["s"]) { player.velY+=player.speed; }

    player.velX=Math.max(-player.maxSpeed,Math.min(player.maxSpeed,player.velX));
    player.velY=Math.max(-player.maxSpeed,Math.min(player.maxSpeed,player.velY));
    player.velX*=player.friction; player.velY*=player.friction;
    if (Math.abs(player.velX)<0.05) player.velX=0;
    if (Math.abs(player.velY)<0.05) player.velY=0;

    player.x+=player.velX;
    for (let obs of L.obstacles) { if (checkCollision(player,obs)) resolveCollision(player,obs); }
    player.y+=player.velY;
    for (let obs of L.obstacles) { if (checkCollision(player,obs)) resolveCollision(player,obs); }

    for (let block of L.iceBlocks) {
        if (!block.broken && checkCollision(player,block)) resolveCollision(player,block);
    }
    if (L.door && L.door.visible && !L.door.open && checkCollision(player,L.door)) resolveCollision(player,L.door);
    if (L.chest && L.chest.visible && !L.chest.open) {
        const cr={x:L.chest.x,y:L.chest.y,width:L.chest.width,height:L.chest.height};
        if (checkCollision(player,cr)) resolveCollision(player,cr);
    }

    // --- TAŞ ---
    if (checkCollision(player,L.rock)) {
        if (keys[" "]||keys["Space"]) {
            if (keys["ArrowRight"]||keys["d"]) L.rock.velX+=L.rock.pushPower;
            if (keys["ArrowLeft"] ||keys["a"]) L.rock.velX-=L.rock.pushPower;
            if (keys["ArrowDown"] ||keys["s"]) L.rock.velY+=L.rock.pushPower;
            if (keys["ArrowUp"]   ||keys["w"]) L.rock.velY-=L.rock.pushPower;
        }
        resolveCollision(player,L.rock);
    }
    L.rock.x+=L.rock.velX; L.rock.y+=L.rock.velY;
    L.rock.velX*=L.rock.friction; L.rock.velY*=L.rock.friction;
    if (Math.abs(L.rock.velX)<0.05) L.rock.velX=0;
    if (Math.abs(L.rock.velY)<0.05) L.rock.velY=0;
    for (let obs of L.obstacles) { if (checkCollision(L.rock,obs)) resolveCollision(L.rock,obs); }
    for (let block of L.iceBlocks) {
        if (!block.broken && checkCollision(L.rock,block)) {
            resolveCollision(L.rock,block); L.rock.velX=0; L.rock.velY=0;
        }
    }
    for (let bear of L.bears) { if (checkCollision(L.rock,bear)) resolveRockBearCollision(L.rock,bear); }

    // --- EŞYA TOPLAMA ---
    if (!L.axe.collected && checkCollision(player,L.axe)) {
        L.axe.collected=true; player.hasAxe=true; playSound("assets/sounds/collectItem.mp3",0.9);
    }
    if (!L.key.collected && checkCollision(player,L.key)) {
        L.key.collected=true; player.hasKey=true; playSound("assets/sounds/collectItem.mp3",0.9);
    }

    // --- ENERJİ TOPLAMA ---
    for (let en of L.energies) {
        if (en.collected) continue;
        const dist=Math.hypot((player.x+player.width/2)-en.x,(player.y+player.height/2)-en.y);
        if (dist<en.radius+20) {
            en.collected=true; player.energy++; levelEnergy++;
            playSound("assets/sounds/collectItem.mp3",0.7);
        }
    }

    // --- KAPI (level 1-2) ---
    if (L.door) {
        const allBroken=L.iceBlocks.every(b=>b.broken);
        if (allBroken||(L.iceBlocks.length===2&&L.iceBlocks[0].broken&&L.iceBlocks[1].broken)) L.door.visible=true;
        if (L.door.visible&&!L.door.open&&player.hasKey) {
            const dcx=L.door.x+L.door.width/2, dcy=L.door.y+L.door.height/2;
            const dist=Math.hypot((player.x+player.width/2)-dcx,(player.y+player.height/2)-dcy);
            if (dist<100) { L.door.open=true; startLevelTransition(); }
        }
    }

    // --- HAZİNE SANDIĞI (level 3) ---
    if (L.chest) {
        if (L.iceBlocks.every(b=>b.broken)) L.chest.visible=true;
        if (L.chest.visible && !L.chest.open && player.hasKey) {
            const cx=L.chest.x+L.chest.width/2, cy=L.chest.y+L.chest.height/2;
            const dist=Math.hypot((player.x+player.width/2)-cx,(player.y+player.height/2)-cy);
            if (dist<90) {
                // Tüm enerjiler toplanmış mı? (15 toplam)
                if (player.energy >= 15) {
                    L.chest.open=true; triggerWin();
                } else {
                    // Yeterli enerji yok → yenilgi
                    triggerLose();
                }
            }
        }
    }

    // --- AYILAR ---
    for (let bear of L.bears) {
        if (bear.patrolType==="horizontal") {
            bear.x+=bear.speed*bear.direction; bear.facingRight=bear.direction===1;
            if (bear.x<=bear.minX) { bear.x=bear.minX; bear.direction=1; }
            if (bear.x+bear.width>=bear.maxX) { bear.x=bear.maxX-bear.width; bear.direction=-1; }
            for (let obs of L.obstacles) {
                if (checkCollision(bear,obs)) {
                    if (bear.direction===1) { bear.x=obs.x-bear.width-1; bear.direction=-1; }
                    else                    { bear.x=obs.x+obs.width+1;  bear.direction=1;  }
                    break;
                }
            }
            if (checkCollision(bear,L.rock)) {
                if (bear.direction===1) { bear.x=L.rock.x-bear.width-1; bear.direction=-1; }
                else                    { bear.x=L.rock.x+L.rock.width+1; bear.direction=1; }
            }
        } else if (bear.patrolType==="vertical") {
            bear.facingRight=true;
            const nd={x:bear.x,y:bear.y+bear.speed+2,width:bear.width,height:bear.height};
            const nu={x:bear.x,y:bear.y-bear.speed-2,width:bear.width,height:bear.height};
            if (bear.direction===1  && checkCollision(nd,L.rock)) bear.direction=-1;
            if (bear.direction===-1 && checkCollision(nu,L.rock)) bear.direction=1;
            bear.y+=bear.speed*bear.direction;
            if (bear.y<=bear.minY) { bear.y=bear.minY; bear.direction=1; }
            if (bear.y+bear.height>=bear.maxY) { bear.y=bear.maxY-bear.height; bear.direction=-1; }
            for (let obs of L.obstacles) {
                if (checkCollision(bear,obs)) {
                    if (bear.direction===1) { bear.y=obs.y-bear.height-1; bear.direction=-1; }
                    else                    { bear.y=obs.y+obs.height+1;  bear.direction=1;  }
                    break;
                }
            }
        }
        // Ayıya değince → levelin başına dön, enerjiler sıfırla
        if (checkCollision(player,bear)) { resetCurrentLevel(); }
    }

    // --- KAR ---
    for (let snow of snowflakes) {
        snow.y+=snow.speed; snow.x+=Math.sin(snow.y*0.01)*0.5;
        if (snow.y>canvas.height) { snow.y=-10; snow.x=Math.random()*canvas.width; }
    }

    // --- SU → levelin başına dön ---
    for (let w of L.waters) {
        if (checkCollision(player,w)) { resetCurrentLevel(); }
    }
}

// =====================
// ÇİZİM FONKSİYONLARI
// =====================
function drawIceBlock(block) {
    if (block.broken) return;
    const x=block.x,y=block.y,w=block.width,h=block.height,ratio=block.health/block.maxHealth;
    ctx.save();
    if (iceBlockImageLoaded) {
        if (block.vertical) {
            ctx.translate(x+w/2,y+h/2); ctx.rotate(Math.PI/2);
            ctx.drawImage(iceBlockImage,-h/2,-w/2,h,w);
            ctx.rotate(-Math.PI/2); ctx.translate(-(x+w/2),-(y+h/2));
        } else { ctx.drawImage(iceBlockImage,x,y,w,h); }
        if (ratio<1) { ctx.fillStyle=`rgba(20,60,120,${(1-ratio)*0.45})`; ctx.fillRect(x,y,w,h); }
    } else {
        const grad=ctx.createLinearGradient(x,y,x+w,y+h);
        grad.addColorStop(0,`rgba(80,160,220,${0.7+ratio*0.2})`);
        grad.addColorStop(0.3,`rgba(140,210,255,${0.5+ratio*0.3})`);
        grad.addColorStop(0.6,`rgba(200,235,255,${0.6+ratio*0.2})`);
        grad.addColorStop(1,`rgba(100,180,230,${0.7+ratio*0.2})`);
        ctx.shadowColor="rgba(100,180,255,0.9)"; ctx.shadowBlur=18;
        ctx.fillStyle=grad; ctx.fillRect(x,y,w,h); ctx.shadowBlur=0;
        const shine=ctx.createLinearGradient(x,y,x+w*0.6,y+h*0.6);
        shine.addColorStop(0,"rgba(255,255,255,0.55)"); shine.addColorStop(0.4,"rgba(255,255,255,0.15)"); shine.addColorStop(1,"rgba(255,255,255,0.0)");
        ctx.fillStyle=shine; ctx.fillRect(x+4,y+4,w-8,h-8);
        ctx.strokeStyle="rgba(180,225,255,0.35)"; ctx.lineWidth=1;
        for (let i=1;i<6;i++) {
            ctx.beginPath();
            if (block.vertical) { ctx.moveTo(x+5,y+(h/6)*i); ctx.lineTo(x+w-5,y+(h/6)*i+2); }
            else                 { ctx.moveTo(x+(w/6)*i,y+5); ctx.lineTo(x+(w/6)*i+2,y+h-5); }
            ctx.stroke();
        }
        ctx.strokeStyle=`rgba(210,240,255,${0.7+ratio*0.3})`; ctx.lineWidth=2.5; ctx.strokeRect(x,y,w,h);
        if (ratio<1) { ctx.fillStyle=`rgba(20,60,120,${(1-ratio)*0.35})`; ctx.fillRect(x,y,w,h); }
    }
    ctx.strokeStyle="rgba(255,255,255,0.9)"; ctx.lineWidth=1.5;
    for (let crack of block.cracks) {
        ctx.beginPath(); ctx.moveTo(x+crack.x1,y+crack.y1); ctx.lineTo(x+crack.x2,y+crack.y2); ctx.stroke();
        const mx2=(crack.x1+crack.x2)/2,my2=(crack.y1+crack.y2)/2;
        ctx.beginPath(); ctx.moveTo(x+mx2,y+my2); ctx.lineTo(x+mx2+(Math.random()*10-5),y+my2+(Math.random()*10-5)); ctx.stroke();
    }
    ctx.fillStyle="rgba(30,80,160,0.85)"; ctx.font="bold 13px Arial"; ctx.textAlign="center";
    ctx.fillText(`${block.health}/${block.maxHealth}`,x+w/2,y-6); ctx.textAlign="left";
    ctx.restore();
}

function drawEnergy(en) {
    if (en.collected) return;
    const pulse=Math.sin(energyPulse)*0.3+0.7;
    ctx.save();
    ctx.shadowColor="rgba(100,200,255,0.9)"; ctx.shadowBlur=20*pulse;
    ctx.beginPath(); ctx.arc(en.x,en.y,en.radius*pulse,0,Math.PI*2);
    ctx.fillStyle=`rgba(150,230,255,${0.3*pulse})`; ctx.fill();
    ctx.beginPath();
    for (let i=0;i<6;i++) {
        const angle=(Math.PI/3)*i-Math.PI/6;
        const px=en.x+Math.cos(angle)*en.radius*0.8, py=en.y+Math.sin(angle)*en.radius*0.8;
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();
    const grad=ctx.createRadialGradient(en.x,en.y-4,2,en.x,en.y,en.radius);
    grad.addColorStop(0,`rgba(220,245,255,${pulse})`); grad.addColorStop(0.5,`rgba(80,190,255,${0.9*pulse})`); grad.addColorStop(1,`rgba(30,120,220,${0.8*pulse})`);
    ctx.fillStyle=grad; ctx.fill();
    ctx.strokeStyle=`rgba(200,240,255,${0.9*pulse})`; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(en.x-4,en.y-4,4,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${0.7*pulse})`; ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
}

// Hazine sandığı çizimi
// Resim varsa kullanır, yoksa canvas ile çizer
function drawChest(chest) {
    if (!chest||!chest.visible) return;
    const x=chest.x, y=chest.y, w=chest.width, h=chest.height;

    ctx.save();
    ctx.shadowColor="rgba(255,200,0,0.8)"; ctx.shadowBlur=20;

    if (chest.open) {
        // Açık sandık
        if (chestOpenLoaded) {
            ctx.drawImage(chestOpenImage, x, y, w, h);
        } else {
            // Canvas ile açık sandık
            ctx.fillStyle="#6B3A00"; ctx.fillRect(x, y+h*0.45, w, h*0.55);
            ctx.strokeStyle="#FFD700"; ctx.lineWidth=2; ctx.strokeRect(x+2,y+h*0.45+2,w-4,h*0.55-4);
            // Kapak açık (yukarı)
            ctx.save(); ctx.translate(x+w/2, y+h*0.45);
            ctx.rotate(-Math.PI*0.6);
            ctx.fillStyle="#8B5000";
            ctx.beginPath(); ctx.ellipse(0,0,w/2,h*0.4,0,Math.PI,0); ctx.closePath(); ctx.fill();
            ctx.strokeStyle="#FFD700"; ctx.stroke(); ctx.restore();
            // Altın parıltı
            const gg=ctx.createRadialGradient(x+w/2,y+h*0.45,0,x+w/2,y+h*0.45,60);
            gg.addColorStop(0,"rgba(255,220,0,0.7)"); gg.addColorStop(1,"rgba(255,150,0,0)");
            ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(x+w/2,y+h*0.45,60,0,Math.PI*2); ctx.fill();
        }
    } else {
        // Kapalı sandık
        if (chestClosedLoaded) {
            ctx.drawImage(chestClosedImage, x, y, w, h);
        } else {
            // Canvas ile kapalı sandık — DÜMDÜZ kapak
            // Gövde
            const bg=ctx.createLinearGradient(x,y+h*0.45,x,y+h);
            bg.addColorStop(0,"#A07020"); bg.addColorStop(1,"#6B4010");
            ctx.fillStyle=bg; ctx.fillRect(x,y+h*0.45,w,h*0.55);
            ctx.strokeStyle="#FFD700"; ctx.lineWidth=2; ctx.strokeRect(x+2,y+h*0.47,w-4,h*0.51);
            // Metal çıta
            ctx.fillStyle="rgba(180,130,0,0.5)"; ctx.fillRect(x, y+h*0.45+h*0.25, w, 4);
            // DÜMDÜZ kapak (dikdörtgen)
            const ld=ctx.createLinearGradient(x,y,x,y+h*0.45);
            ld.addColorStop(0,"#C08830"); ld.addColorStop(1,"#8B5E10");
            ctx.fillStyle=ld;
            ctx.fillRect(x, y, w, h*0.45); // düz dikdörtgen
            ctx.strokeStyle="#FFD700"; ctx.lineWidth=2;
            ctx.strokeRect(x+2, y+2, w-4, h*0.43);
            // Kilit
            ctx.fillStyle="#FFD700";
            ctx.fillRect(x+w/2-8,y+h*0.45-5,16,10);
            ctx.beginPath(); ctx.arc(x+w/2,y+h*0.45-2,6,Math.PI,0); ctx.fill();
            // Etiket
            ctx.fillStyle="rgba(255,220,50,0.9)"; ctx.font="bold 11px Arial"; ctx.textAlign="center";
            ctx.fillText("🔑",x+w/2,y-8); ctx.textAlign="left";
        }
    }
    ctx.shadowBlur=0; ctx.restore();
}

function drawDoor() {
    if (!L.door||!L.door.visible) return;
    const x=L.door.x,y=L.door.y,w=L.door.width,h=L.door.height;
    ctx.save();
    if (L.door.open) {
        ctx.shadowColor="rgba(50,255,120,0.8)"; ctx.shadowBlur=20;
        ctx.fillStyle="rgba(50,200,100,0.25)"; ctx.fillRect(x,y,w,h);
        ctx.strokeStyle="#00ff88"; ctx.lineWidth=3; ctx.strokeRect(x,y,w,h); ctx.shadowBlur=0;
    } else {
        ctx.shadowColor="rgba(140,210,255,0.9)"; ctx.shadowBlur=18;
        const grad=ctx.createLinearGradient(x,y,x+w,y+h);
        grad.addColorStop(0,"rgba(60,120,180,0.92)"); grad.addColorStop(0.3,"rgba(100,170,230,0.85)");
        grad.addColorStop(0.6,"rgba(70,140,200,0.88)"); grad.addColorStop(1,"rgba(40,90,160,0.92)");
        ctx.fillStyle=grad; ctx.fillRect(x,y,w,h);
        ctx.strokeStyle="rgba(180,230,255,0.25)"; ctx.lineWidth=1;
        for (let i=1;i<4;i++) { ctx.beginPath(); ctx.moveTo(x+(w/4)*i,y+4); ctx.lineTo(x+(w/4)*i+2,y+h-4); ctx.stroke(); }
        ctx.strokeStyle="rgba(200,240,255,0.95)"; ctx.lineWidth=2.5; ctx.strokeRect(x+2,y+2,w-4,h-4);
        ctx.strokeStyle="rgba(120,190,240,0.5)"; ctx.lineWidth=1; ctx.strokeRect(x+6,y+6,w-12,h-12);
        const shine=ctx.createLinearGradient(x,y,x,y+h*0.4);
        shine.addColorStop(0,"rgba(255,255,255,0.25)"); shine.addColorStop(1,"rgba(255,255,255,0.0)");
        ctx.fillStyle=shine; ctx.fillRect(x+4,y+4,w-8,h*0.4); ctx.shadowBlur=0;
        const cx2=x+w/2,cy2=y+h/2-15;
        ctx.strokeStyle="rgba(200,240,255,0.95)"; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(cx2,cy2,13,Math.PI,0); ctx.stroke();
        const kg=ctx.createLinearGradient(cx2-10,cy2+2,cx2+10,cy2+22);
        kg.addColorStop(0,"rgba(160,220,255,0.9)"); kg.addColorStop(1,"rgba(80,150,220,0.9)");
        ctx.fillStyle=kg; ctx.beginPath(); ctx.roundRect(cx2-10,cy2+2,20,20,3); ctx.fill();
        ctx.strokeStyle="rgba(200,240,255,0.8)"; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle="rgba(30,80,150,0.9)"; ctx.beginPath(); ctx.arc(cx2,cy2+11,4,0,Math.PI*2); ctx.fill();
        ctx.fillRect(cx2-2,cy2+14,4,5);
        if (!player.hasKey) { ctx.fillStyle="rgba(180,230,255,0.9)"; ctx.font="bold 11px Arial"; ctx.textAlign="center"; ctx.fillText("🔑",cx2,y-10); ctx.textAlign="left"; }
    }
    ctx.restore();
}

function drawObstacle(obs) {
    const grad=ctx.createLinearGradient(obs.x,obs.y,obs.x+obs.width,obs.y+obs.height);
    grad.addColorStop(0,"rgba(220,240,255,0.95)"); grad.addColorStop(0.5,"rgba(120,190,255,0.55)"); grad.addColorStop(1,"rgba(220,240,255,0.95)");
    ctx.shadowColor="rgba(180,220,255,0.9)"; ctx.shadowBlur=15; ctx.fillStyle=grad; ctx.fillRect(obs.x,obs.y,obs.width,obs.height);
    ctx.strokeStyle="rgba(255,255,255,0.95)"; ctx.lineWidth=3; ctx.strokeRect(obs.x,obs.y,obs.width,obs.height);
    const shine=ctx.createLinearGradient(obs.x,obs.y,obs.x+obs.width,obs.y);
    shine.addColorStop(0,"rgba(255,255,255,0.35)"); shine.addColorStop(0.5,"rgba(255,255,255,0.05)"); shine.addColorStop(1,"rgba(255,255,255,0.25)");
    ctx.fillStyle=shine; ctx.fillRect(obs.x+5,obs.y+5,obs.width-10,obs.height-10); ctx.shadowBlur=0;
}

function drawBear(bear) {
    ctx.save();
    if (bearImageLoaded) {
        if (!bear.facingRight) { ctx.scale(-1,1); ctx.drawImage(bearImage,-bear.x-bear.width,bear.y,bear.width,bear.height); }
        else { ctx.drawImage(bearImage,bear.x,bear.y,bear.width,bear.height); }
    } else {
        ctx.fillStyle="rgba(255,255,255,0.9)"; ctx.fillRect(bear.x,bear.y,bear.width,bear.height);
        ctx.fillStyle="#336699"; ctx.font="bold 11px Arial"; ctx.fillText("AYISI",bear.x+8,bear.y+36);
    }
    ctx.restore();
}

// =====================
// MENÜ
// =====================
function drawMenu() {
    ctx.fillStyle="#0a1628"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha=0.06; ctx.drawImage(iceCracks,0,0,canvas.width,canvas.height); ctx.globalAlpha=1;
    for (let snow of snowflakes) {
        ctx.beginPath(); ctx.arc(snow.x,snow.y,snow.radius,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${snow.opacity*0.4})`; ctx.fill();
    }
    ctx.save();
    ctx.shadowColor="#aaddff"; ctx.shadowBlur=40;
    ctx.fillStyle="#ffffff"; ctx.font="bold 72px Arial"; ctx.textAlign="center";
    ctx.fillText("Into The Frost",canvas.width/2,canvas.height/2-80);
    ctx.shadowBlur=0; ctx.fillStyle="rgba(150,220,255,0.8)"; ctx.font="22px Arial";
    ctx.fillText("❄ Penguenin buz macerasına hoş geldiniz ❄",canvas.width/2,canvas.height/2-25);
    ctx.restore();
    const bx=canvas.width/2-120, by=canvas.height/2+30;
    ctx.save();
    ctx.shadowColor="rgba(100,200,255,0.8)"; ctx.shadowBlur=20;
    const bg=ctx.createLinearGradient(bx,by,bx,by+60);
    bg.addColorStop(0,"rgba(60,140,220,0.95)"); bg.addColorStop(1,"rgba(30,80,160,0.95)");
    ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(bx,by,240,60,12); ctx.fill();
    ctx.strokeStyle="rgba(180,230,255,0.9)"; ctx.lineWidth=2; ctx.stroke(); ctx.shadowBlur=0;
    ctx.fillStyle="#ffffff"; ctx.font="bold 24px Arial"; ctx.textAlign="center";
    ctx.fillText("▶  OYUNA BAŞLA",canvas.width/2,by+38); ctx.restore();
    ctx.fillStyle="rgba(150,200,255,0.6)"; ctx.font="14px Arial"; ctx.textAlign="center";
    ctx.fillText("Yön tuşları: Hareket  |  SPACE+Yön: Taş it  |  Mouse tıkla: Buz kır",canvas.width/2,canvas.height/2+120);
}

// =====================
// KAZANMA EKRANI
// =====================
function drawWin() {
    ctx.fillStyle="rgba(0,0,0,0.8)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    for (let p of winParticles) {
        ctx.save(); ctx.globalAlpha=p.alpha; ctx.fillStyle=p.color;
        ctx.shadowColor=p.color; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    const cx=canvas.width/2, cy=canvas.height/2;

    // Büyük açık sandık resmi ortada
    const cw=160, ch=140;
    if (chestOpenLoaded) {
        ctx.save(); ctx.shadowColor="rgba(255,200,0,0.9)"; ctx.shadowBlur=50;
        ctx.drawImage(chestOpenImage, cx-cw/2, cy-ch-150, cw, ch); ctx.restore();
    } else {
        // Canvas ile büyük açık sandık
        ctx.save(); ctx.shadowColor="rgba(255,200,0,0.9)"; ctx.shadowBlur=50;
        ctx.fillStyle="#6B3A00"; ctx.fillRect(cx-80,cy-150,160,70);
        ctx.strokeStyle="#FFD700"; ctx.lineWidth=3; ctx.strokeRect(cx-78,cy-150,156,66);
        ctx.save(); ctx.translate(cx,cy-150); ctx.rotate(-Math.PI*0.7);
        ctx.fillStyle="#A07020";
        ctx.beginPath(); ctx.ellipse(0,0,80,55,0,Math.PI,0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle="#FFD700"; ctx.lineWidth=3; ctx.stroke(); ctx.restore();
        const gg=ctx.createRadialGradient(cx,cy-150,0,cx,cy-50,100);
        gg.addColorStop(0,"rgba(255,220,0,0.8)"); gg.addColorStop(1,"rgba(255,150,0,0)");
        ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(cx,cy-150,100,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }

    ctx.save();
    ctx.shadowColor="#FFD700"; ctx.shadowBlur=30;
    ctx.fillStyle="#FFD700"; ctx.font="bold 52px Arial"; ctx.textAlign="center";
    ctx.fillText("🏆 Hazineyi Buldunuz! 🏆",cx,cy+30);
    ctx.shadowBlur=0; ctx.fillStyle="rgba(220,245,255,0.9)"; ctx.font="24px Arial";
    ctx.fillText("Tüm bölümleri tamamladınız!",cx,cy+70);
    ctx.fillStyle="rgba(180,220,255,0.7)"; ctx.font="18px Arial";
    ctx.fillText(`Toplanan enerji: ⚡ ${player.energy}/15`,cx,cy+100); ctx.restore();

    const bx=cx-120, by=cy+130;
    ctx.save();
    ctx.shadowColor="rgba(255,200,0,0.8)"; ctx.shadowBlur=20;
    const bg=ctx.createLinearGradient(bx,by,bx,by+60);
    bg.addColorStop(0,"rgba(180,120,20,0.95)"); bg.addColorStop(1,"rgba(120,70,10,0.95)");
    ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(bx,by,240,60,12); ctx.fill();
    ctx.strokeStyle="#FFD700"; ctx.lineWidth=2; ctx.stroke(); ctx.shadowBlur=0;
    ctx.fillStyle="#ffffff"; ctx.font="bold 22px Arial"; ctx.textAlign="center";
    ctx.fillText("↩ Tekrar Oyna",cx,by+38); ctx.restore();
}

// =====================
// YENİLGİ EKRANI
// =====================
function drawLose() {
    ctx.fillStyle="rgba(0,0,0,0.85)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    const cx=canvas.width/2, cy=canvas.height/2;

    // Kapalı sandık — daha büyük, düz kapak
    const cw=200, ch=160;
    const sx=cx-cw/2, sy=cy-ch-30;

    if (chestClosedLoaded) {
        ctx.save(); ctx.globalAlpha=0.75;
        ctx.shadowColor="rgba(100,80,50,0.6)"; ctx.shadowBlur=25;
        ctx.drawImage(chestClosedImage, sx, sy, cw, ch);
        ctx.restore();
    } else {
        ctx.save(); ctx.globalAlpha=0.8;

        // Sandık gövdesi
        const bodyGrad=ctx.createLinearGradient(sx, sy+ch*0.45, sx, sy+ch);
        bodyGrad.addColorStop(0,"#7A4818"); bodyGrad.addColorStop(1,"#4A2808");
        ctx.fillStyle=bodyGrad; ctx.fillRect(sx, sy+ch*0.45, cw, ch*0.55);
        ctx.strokeStyle="#666"; ctx.lineWidth=2;
        ctx.strokeRect(sx+2, sy+ch*0.47, cw-4, ch*0.51);

        // Metal çıta yatay
        ctx.fillStyle="#555"; ctx.fillRect(sx, sy+ch*0.45+ch*0.25, cw, 6);

        // DÜMDÜZ kapak (dikdörtgen, oval değil)
        const lidGrad=ctx.createLinearGradient(sx, sy, sx, sy+ch*0.45);
        lidGrad.addColorStop(0,"#9A6020"); lidGrad.addColorStop(1,"#6A3A10");
        ctx.fillStyle=lidGrad;
        ctx.fillRect(sx, sy, cw, ch*0.45); // düz dikdörtgen kapak
        ctx.strokeStyle="#666"; ctx.lineWidth=2;
        ctx.strokeRect(sx+2, sy+2, cw-4, ch*0.43);

        // Kilit
        ctx.fillStyle="#555";
        ctx.fillRect(cx-10, sy+ch*0.45-6, 20, 14);
        ctx.beginPath(); ctx.arc(cx, sy+ch*0.45-4, 8, Math.PI, 0); ctx.fill();
        ctx.fillStyle="#777";
        ctx.beginPath(); ctx.arc(cx, sy+ch*0.45, 4, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    }

    ctx.save();
    ctx.shadowColor="#ff4444"; ctx.shadowBlur=20;
    ctx.fillStyle="#ff6666"; ctx.font="bold 46px Arial"; ctx.textAlign="center";
    ctx.fillText("😔 Hazine Açılamadı",cx,cy+20);
    ctx.shadowBlur=0; ctx.fillStyle="rgba(255,180,180,0.9)"; ctx.font="22px Arial";
    ctx.fillText("Yeterli enerjiniz yok!",cx,cy+58);
    ctx.fillStyle="rgba(255,150,150,0.7)"; ctx.font="18px Arial";
    ctx.fillText(`Enerjiniz: ⚡ ${player.energy}/15 — Tüm enerjileri toplayın!`,cx,cy+90); ctx.restore();

    // Buton — by değeri sandığın altına göre ayarlandı
    const bx=cx-120, by=cy+115;
    ctx.save();
    ctx.shadowColor="rgba(200,50,50,0.8)"; ctx.shadowBlur=15;
    const bg=ctx.createLinearGradient(bx,by,bx,by+55);
    bg.addColorStop(0,"rgba(160,40,40,0.95)"); bg.addColorStop(1,"rgba(100,20,20,0.95)");
    ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(bx,by,240,55,12); ctx.fill();
    ctx.strokeStyle="rgba(255,120,120,0.8)"; ctx.lineWidth=2; ctx.stroke(); ctx.shadowBlur=0;
    ctx.fillStyle="#ffffff"; ctx.font="bold 20px Arial"; ctx.textAlign="center";
    ctx.fillText("↩ Baştan Oyna",cx,by+35); ctx.restore();
}

// =====================
// ANA ÇİZİM
// =====================
function draw() {
    if (gameState==="menu") { drawMenu(); return; }
    if (gameState==="win")  { drawWin();  return; }
    if (gameState==="lose") { drawLose(); return; }

    // Oyun sahası
    ctx.fillStyle="#dff4ff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha=0.08; ctx.drawImage(iceCracks,0,0,canvas.width,canvas.height); ctx.globalAlpha=1;

    for (let snow of snowflakes) {
        ctx.beginPath(); ctx.arc(snow.x,snow.y,snow.radius,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${snow.opacity})`; ctx.fill();
    }

    for (let obs of L.obstacles) { drawObstacle(obs); }
    for (let block of L.iceBlocks) { drawIceBlock(block); }
    drawDoor();
    if (L.chest) drawChest(L.chest);
    for (let en of L.energies) { drawEnergy(en); }

    for (let w of L.waters) {
        ctx.globalAlpha=0.6; ctx.drawImage(waterImage,w.x,w.y,w.width,w.height); ctx.globalAlpha=1;
    }

    ctx.drawImage(rockImage,L.rock.x,L.rock.y,L.rock.width,L.rock.height);

    // Balta
    if (!L.axe.collected) {
        ctx.save();
        ctx.fillStyle="#6B3A1F"; ctx.fillRect(L.axe.x+15,L.axe.y+2,6,L.axe.height-2);
        ctx.fillStyle="#B8C8D8"; ctx.beginPath();
        ctx.moveTo(L.axe.x,L.axe.y+4); ctx.lineTo(L.axe.x+18,L.axe.y); ctx.lineTo(L.axe.x+18,L.axe.y+18);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle="#7090a0"; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
        ctx.fillStyle="#1a4a7a"; ctx.font="bold 11px Arial"; ctx.textAlign="center";
        ctx.fillText("BALTA",L.axe.x+L.axe.width/2,L.axe.y+L.axe.height+14); ctx.textAlign="left";
    }

    // Anahtar
    if (!L.key.collected) {
        ctx.save(); ctx.shadowColor="#FFD700"; ctx.shadowBlur=12;
        ctx.strokeStyle="rgba(200,240,255,0.95)"; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(L.key.x+10,L.key.y+10,8,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle="rgba(180,230,255,0.9)";
        ctx.beginPath(); ctx.arc(L.key.x+10,L.key.y+10,3,0,Math.PI*2); ctx.fill();
        ctx.fillRect(L.key.x+10,L.key.y+16,18,4); ctx.fillRect(L.key.x+20,L.key.y+20,4,5); ctx.fillRect(L.key.x+26,L.key.y+20,4,4);
        ctx.shadowBlur=0; ctx.restore();
        ctx.fillStyle="#8B6914"; ctx.font="bold 11px Arial"; ctx.textAlign="center";
        ctx.fillText("ANAHTAR",L.key.x+15,L.key.y+L.key.height+14); ctx.textAlign="left";
    }

    for (let bear of L.bears) { drawBear(bear); }

    // Penguen
    ctx.save();
    if (player.facingRight) { ctx.drawImage(penguinImage,player.x,player.y,player.width,player.height); }
    else { ctx.scale(-1,1); ctx.drawImage(penguinImage,-player.x-player.width,player.y,player.width,player.height); }
    ctx.restore();

    // HUD
    ctx.fillStyle="rgba(0,30,70,0.45)"; ctx.fillRect(8,8,280,68);
    ctx.fillStyle="#FFD700"; ctx.font="bold 12px Arial"; ctx.fillText(`LEVEL ${currentLevel}`,15,24);
    ctx.fillStyle="rgba(255,255,255,0.9)"; ctx.font="12px Arial";
    ctx.fillText(player.hasAxe?"🪓 Balta: VAR":"🪓 Balta: YOK",15,40);
    ctx.fillText(player.hasKey?"🔑 Anahtar: VAR":"🔑 Anahtar: YOK",15,54);

    // Enerji barı
    const barW=160,barH=10,barX=15,barY=60;
    ctx.fillStyle="rgba(0,15,50,0.7)"; ctx.fillRect(barX,barY,barW,barH);
    if (player.energy>0) {
        const fillW=Math.min(1,player.energy/15)*barW;
        const bg=ctx.createLinearGradient(barX,barY,barX+fillW,barY);
        bg.addColorStop(0,"#00aaff"); bg.addColorStop(0.5,"#66ddff"); bg.addColorStop(1,"#00ffcc");
        ctx.fillStyle=bg; ctx.fillRect(barX,barY,fillW,barH);
        ctx.fillStyle="rgba(255,255,255,0.2)"; ctx.fillRect(barX,barY,fillW,barH/2);
    }
    ctx.strokeStyle="rgba(100,180,255,0.7)"; ctx.lineWidth=1; ctx.strokeRect(barX,barY,barW,barH);
    ctx.fillStyle="rgba(170,220,255,0.9)"; ctx.font="bold 10px Arial";
    ctx.fillText(`⚡ ${player.energy}/15`,barX+barW+6,barY+9);

    // Dinamik ipuçları
    let tipY=88;
    if (nearRock) {
        ctx.fillStyle="rgba(0,30,70,0.45)"; ctx.fillRect(8,tipY,270,18);
        ctx.fillStyle="rgba(255,220,100,0.95)"; ctx.font="11px Arial";
        ctx.fillText("🪨 SPACE + yön tuşu → taşı it",14,tipY+13); tipY+=22;
    }
    if (player.hasAxe) {
        ctx.fillStyle="rgba(0,30,70,0.45)"; ctx.fillRect(8,tipY,270,18);
        ctx.fillStyle="rgba(170,220,255,0.95)"; ctx.font="11px Arial";
        ctx.fillText("🪓 Buz kütlesine yaklaş + tıkla → kır",14,tipY+13); tipY+=22;
    }
    if ((L.door&&L.door.visible&&!L.door.open)||(L.chest&&L.chest.visible&&!L.chest.open)) {
        ctx.fillStyle="rgba(0,30,70,0.45)"; ctx.fillRect(8,tipY,260,18);
        ctx.fillStyle="rgba(255,215,0,0.95)"; ctx.font="11px Arial";
        ctx.fillText(L.chest?"🏆 Sandık belirdi! Anahtarla aç →":"🔑 Kapı belirdi! Anahtarla aç →",14,tipY+13);
    }

    // Level geçiş
    if (levelTransition) {
        ctx.fillStyle=`rgba(0,0,0,${transitionAlpha})`; ctx.fillRect(0,0,canvas.width,canvas.height);
        if (transitionPhase==="wait") {
            ctx.save(); ctx.globalAlpha=1; ctx.shadowColor="#aaddff"; ctx.shadowBlur=30;
            ctx.fillStyle="#ffffff"; ctx.font="bold 60px Arial"; ctx.textAlign="center";
            ctx.fillText(`LEVEL ${currentLevel}`,canvas.width/2,canvas.height/2-20);
            ctx.shadowBlur=0; ctx.fillStyle="#aaddff"; ctx.font="24px Arial";
            ctx.fillText("Hazır ol!",canvas.width/2,canvas.height/2+30);
            ctx.textAlign="left"; ctx.restore();
        }
    }
}

// =====================
// OYUN DÖNGÜSÜ
// =====================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();