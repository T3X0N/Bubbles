// Mängu olekud ja muutujad
let playerName = "Mängija";
let score = 0;
let timeLeft = 180; 
let currentLevel = 1;
let gameInterval;
let timerInterval;
let isPlaying = false;

// Saavutuste loogika olekud
let achievements = { 
    firstScore: false, 
    combo: false,
    level2: false, 
    level4: false,
    score500: false,
    speedrun: false
};

// Mänguvälja (Canvas) seaded
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const BUBBLE_RADIUS = 20;
const ALL_COLORS = ["#ff4d6d", "#00fff0", "#ffb703", "#9d4edd", "#10b981", "#f97316"]; 

let grid = []; 
let bullet = null; 
let nextColor = "#ffffff"; 
let mousePos = { x: canvas.width / 2, y: 0 }; 

const cannon = { x: canvas.width / 2, y: canvas.height - 40 };

// --- 1. VAATED JA MENÜÜD ---
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");

document.getElementById("start-btn").addEventListener("click", () => {
    const inputName = document.getElementById("player-name-input").value.trim();
    if (inputName !== "") playerName = inputName;
    
    document.getElementById("display-name").innerText = playerName;
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    
    startGame();
});

document.getElementById("restart-btn").addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
});

// --- 2. MÄNGU ALUSTAMINE JA LOOGIKA ---
function startGame() {
    score = 0;
    timeLeft = 180; 
    currentLevel = 1;
    isPlaying = true;
    
    // Lähtesta saavutused
    achievements = { 
        firstScore: false, 
        combo: false,
        level2: false, 
        level4: false,
        score500: false,
        speedrun: false
    };
    
    // Lähtesta saavutuste visuaal HTML-is
    let keyMap = {
        firstScore: "ach-first",
        combo: "ach-combo",
        level2: "ach-level2",
        level4: "ach-level4",
        score500: "ach-score500",
        speedrun: "ach-speedrun"
    };
    Object.keys(keyMap).forEach(id => {
        document.getElementById(keyMap[id]).className = "locked";
    });
    
    updateDOM();
    initGrid();
    nextColor = getAvailableRandomColor();
    spawnBullet();

    if (gameInterval) clearInterval(gameInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    gameInterval = setInterval(updateGame, 1000 / 60); 
    timerInterval = setInterval(updateTimer, 1000); 
}

function updateDOM() {
    document.getElementById("score-display").innerText = score;
    document.getElementById("timer-display").innerText = timeLeft;
    document.getElementById("level-display").innerText = currentLevel;
}

function updateTimer() {
    if (!isPlaying) return;
    timeLeft--;
    document.getElementById("timer-display").innerText = timeLeft;

    if (timeLeft <= 0) {
        endGame();
    }
}

function getAvailableRandomColor(isInitializingGrid = false) {
    let maxColorsForLevel = Math.min(3 + (currentLevel - 1), ALL_COLORS.length);
    let allowedColors = ALL_COLORS.slice(0, maxColorsForLevel);

    if (isInitializingGrid) {
        return allowedColors[Math.floor(Math.random() * allowedColors.length)];
    }

    if (grid.length > 0) {
        let activeColorsOnGrid = new Set();
        grid.forEach(b => {
            if (b.active) activeColorsOnGrid.add(b.color);
        });

        if (activeColorsOnGrid.size > 0) {
            let availableColors = allowedColors.filter(c => activeColorsOnGrid.has(c));
            if (availableColors.length > 0) {
                return availableColors[Math.floor(Math.random() * availableColors.length)];
            }
        }
    }
    return allowedColors[Math.floor(Math.random() * allowedColors.length)];
}

function validateBulletColors() {
    if (!isPlaying || grid.length === 0) return;
    
    let activeColorsOnGrid = new Set();
    grid.forEach(b => {
        if (b.active) activeColorsOnGrid.add(b.color);
    });

    if (activeColorsOnGrid.size > 0) {
        if (bullet && bullet.vx === 0 && bullet.vy === 0 && !activeColorsOnGrid.has(bullet.color)) {
            bullet.color = getAvailableRandomColor();
        }
        if (!activeColorsOnGrid.has(nextColor)) {
            nextColor = getAvailableRandomColor();
        }
    }
}

function initGrid() {
    grid = [];
    let rows = 4 + Math.min(currentLevel, 3); 
    let cols = Math.floor(canvas.width / (BUBBLE_RADIUS * 2));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            grid.push({
                id: r * cols + c,
                x: c * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS,
                y: r * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + 20,
                color: getAvailableRandomColor(true), 
                active: true
            });
        }
    }
}

function spawnBullet() {
    // Tulistamise kiirus suureneb iga tasemega dünaamiliselt
    let currentSpeed = 9 + (currentLevel * 1.5);

    bullet = {
        x: cannon.x,
        y: cannon.y - 20,
        color: nextColor,
        vx: 0,
        vy: 0,
        speed: currentSpeed
    };
    nextColor = getAvailableRandomColor();
    validateBulletColors(); 
}

// --- 3. JUHTIMINE ---
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
});

canvas.addEventListener("click", (e) => {
    if (!isPlaying || bullet.vx !== 0 || bullet.vy !== 0) return;

    const angle = Math.atan2(mousePos.y - bullet.y, mousePos.x - bullet.x);
    if (mousePos.y >= cannon.y - 10) return;

    bullet.vx = Math.cos(angle) * bullet.speed;
    bullet.vy = Math.sin(angle) * bullet.speed;
});

// --- 4. TRAJEKTÖÖRI JOONISTAMINE ---
function drawTrajectory() {
    if (bullet.vx !== 0 || bullet.vy !== 0) return; 

    let trajX = cannon.x;
    let trajY = cannon.y - 20;
    
    const angle = Math.atan2(mousePos.y - trajY, mousePos.x - trajX);
    if (mousePos.y >= cannon.y - 10) return; 

    let tVx = Math.cos(angle) * 5;
    let tVy = Math.sin(angle) * 5;

    ctx.save();
    ctx.setLineDash([5, 5]); 
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)"; 
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(trajX, trajY);

    for (let i = 0; i < 150; i++) {
        trajX += tVx;
        trajY += tVy;

        if (trajX - BUBBLE_RADIUS <= 0 || trajX + BUBBLE_RADIUS >= canvas.width) {
            tVx *= -1;
        }

        ctx.lineTo(trajX, trajY);

        if (trajY - BUBBLE_RADIUS <= 0) break;
        
        let hit = false;
        for (let b of grid) {
            if (b.active && Math.hypot(trajX - b.x, trajY - b.y) < BUBBLE_RADIUS * 2) {
                hit = true;
                break;
            }
        }
        if (hit) break;
    }
    ctx.stroke();
    ctx.restore();
}

// --- 5. UUENDAMINE JA JOONISTAMINE ---
function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isPlaying) {
        drawTrajectory();
    }

    // Joonista kahur
    ctx.beginPath();
    ctx.arc(cannon.x, cannon.y, 25, 0, Math.PI, true);
    ctx.fillStyle = "#4b5563";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(cannon.x, cannon.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = nextColor;
    ctx.fill();
    ctx.closePath();

    // Joonista paigalolevad mullid
    let activeBubblesLeft = false;
    grid.forEach(b => {
        if (b.active) {
            activeBubblesLeft = true;
            drawBubble(b.x, b.y, b.color);
            
            if (b.y >= cannon.y - 40) {
                endGame();
            }
        }
    });

    // UUE TASEME LAADIMINE
    if (!activeBubblesLeft && isPlaying) {
        currentLevel++;
        timeLeft += 60; 
        updateDOM();
        initGrid(); 
        nextColor = getAvailableRandomColor(); 
        spawnBullet(); 
        checkAchievements(0); 
    }

    // Uuenda ja joonista lendavat mulli
    if (bullet) {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x - BUBBLE_RADIUS <= 0 || bullet.x + BUBBLE_RADIUS >= canvas.width) {
            bullet.vx *= -1;
        }

        let collided = false;
        if (bullet.y - BUBBLE_RADIUS <= 0) {
            collided = true;
        } else {
            for (let b of grid) {
                if (b.active && Math.hypot(bullet.x - b.x, bullet.y - b.y) < BUBBLE_RADIUS * 2) {
                    collided = true;
                    break;
                }
            }
        }

        if (collided) {
            lockAndPopBullet();
        } else {
            drawBubble(bullet.x, bullet.y, bullet.color);
        }
    }
}

function drawBubble(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x - 6, y - 6, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fill();
    ctx.closePath();
}

// --- 6. LÕHKUMISE ALGORITM ---
function lockAndPopBullet() {
    let newBubble = {
        id: grid.length,
        x: bullet.x,
        y: bullet.y,
        color: bullet.color,
        active: true
    };
    grid.push(newBubble);

    let matches = [];
    let queue = [newBubble];
    let visited = new Set();
    visited.add(newBubble.id);

    while (queue.length > 0) {
        let current = queue.shift();
        matches.push(current);

        grid.forEach(b => {
            if (b.active && !visited.has(b.id) && b.color === newBubble.color) {
                let dist = Math.hypot(current.x - b.x, current.y - b.y);
                if (dist <= BUBBLE_RADIUS * 2.3) { 
                    visited.add(b.id);
                    queue.push(b);
                }
            }
        });
    }

    if (matches.length >= 1) {
        matches.forEach(b => {
            b.active = false;
        });
        score += matches.length * 10;
        updateDOM();
        checkAchievements(matches.length); 
    }

    validateBulletColors();
    spawnBullet();
}

// --- 7. SAAVUTUSTE KONTROLL ---
function checkAchievements(lastHitCount) {
    // 1. Esimesed punktid (Sinine)
    if (score >= 10 && !achievements.firstScore) {
        achievements.firstScore = true;
        const el = document.getElementById("ach-first");
        el.className = "unlocked ach-blue";
    }
    
    // 2. Combo saavutus (Lilla)
    if (lastHitCount >= 5 && !achievements.combo) {
        achievements.combo = true;
        const el = document.getElementById("ach-combo");
        el.className = "unlocked ach-purple";
    }

    // 3. Jõua tasemele 2 (Roheline)
    if (currentLevel >= 2 && !achievements.level2) {
        achievements.level2 = true;
        const el = document.getElementById("ach-level2");
        el.className = "unlocked ach-green";
    }

    // 4. Jõua tasemele 4 (Oranž)
    if (currentLevel >= 4 && !achievements.level4) {
        achievements.level4 = true;
        const el = document.getElementById("ach-level4");
        el.className = "unlocked ach-orange";
    }

    // 5. Kogu 500 punkti (Kollane)
    if (score >= 500 && !achievements.score500) {
        achievements.score500 = true;
        const el = document.getElementById("ach-score500");
        el.className = "unlocked ach-yellow";
    }

    // 6. Kiirusmäng (Tsüaan)
    if (score >= 200 && timeLeft > 150 && !achievements.speedrun) {
        achievements.speedrun = true;
        const el = document.getElementById("ach-speedrun");
        el.className = "unlocked ach-cyan";
    }
}

function endGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);

    document.getElementById("final-name").innerText = playerName;
    document.getElementById("final-score").innerText = score;
    document.getElementById("final-level").innerText = currentLevel;

    gameScreen.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");
}