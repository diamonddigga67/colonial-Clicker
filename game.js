let colonials = 0;
let clickPower = 1;

const colonialImg = document.getElementById("colonial-img");

/* GLOBAL MULTIPLIERS / STATE */
let eventMultiplier = 1;          // Planet-Eaters burst
let imperialBonusMultiplier = 1;  // Imperial Serpents
let wormBranchMultiplier = 1;     // Subterranean Empires
let goldenCpsMultiplier = 1;      // Golden events CPS
let wormEventMultiplier = 1;      // Wormquake
let clickEventMultiplier = 1;     // Ophidian Blessing

/* Temporary boosts from Archaeotech */
let tempCpsMultiplier = 1;
let tempClickMultiplier = 1;
let tempGoldenFreqFactor = 1;

/* Permanent Archaeotech buffs */
let archaeotechPermanent = {
    cpsPercent: 0,
    clickPercent: 0,
    goldenDurationPercent: 0,
    branchPercent: 0
};

/* ============================
      BURROW NETWORK MINIGAME
============================ */

const BURROW_SIZE = 6;

const BurrowTileType = {
    HIDDEN: "hidden",
    QUEEN: "queen",
    DIRT: "dirt",
    TUNNEL: "tunnel",
    ROCK: "rock",
    GAS: "gas",
    RESOURCE: "resource",
    ANCIENT: "ancient",
    NURSERY: "nursery",
    STORAGE: "storage",
    QUEEN_HALL: "queenHall"
};

let burrowGame = {
    grid: [],
    worms: 0,
    baseWorms: 3,
    runs: 0,
    permBonusPercent: 0,
    inRun: false,
    selectedTile: null,
    totalResourcesThisRun: 0
};

function initBurrowNetwork() {
    const btn = document.getElementById("btn-burrow-network");
    if (btn) {
        btn.addEventListener("click", () => showMinigamePanel("burrow-panel"));
    }

    const startBtn = document.getElementById("burrow-start-run");
    const endBtn = document.getElementById("burrow-end-run");
    const gridEl = document.getElementById("burrow-grid");
    const buildMenu = document.getElementById("burrow-build-menu");

    if (startBtn) startBtn.addEventListener("click", startBurrowRun);
    if (endBtn) startBtn.addEventListener("click", endBurrowRun);

    if (gridEl) {
        gridEl.addEventListener("click", onBurrowGridClick);
    }

    if (buildMenu) {
        buildMenu.addEventListener("click", onBurrowBuildMenuClick);
    }

    document.addEventListener("click", (e) => {
        const menu = document.getElementById("burrow-build-menu");
        const grid = document.getElementById("burrow-grid");
        if (!menu || !grid) return;
        if (!menu.contains(e.target) && !grid.contains(e.target)) {
            hideBurrowBuildMenu();
        }
    });

    updateBurrowUI();
}

function showMinigamePanel(id) {
    const panels = document.querySelectorAll(".minigame-panel");
    panels.forEach(p => p.style.display = "none");
    const target = document.getElementById(id);
    if (target) target.style.display = "block";
}

function startBurrowRun() {
    if (burrowGame.inRun) return;
    burrowGame.inRun = true;
    burrowGame.worms = burrowGame.baseWorms;
    burrowGame.totalResourcesThisRun = 0;
    burrowGame.grid = createBurrowGrid();
    renderBurrowGrid();
    setBurrowStatus("Run started. Click tiles to dig and expand your network.");
    updateBurrowUI();
}

function endBurrowRun(reason = "Run ended.") {
    if (!burrowGame.inRun) return;
    burrowGame.inRun = false;
    burrowGame.runs++;
    applyBurrowRewards();
    setBurrowStatus(reason);
    renderBurrowGrid();
    updateBurrowUI();
}

function createBurrowGrid() {
    const grid = [];
    for (let y = 0; y < BURROW_SIZE; y++) {
        const row = [];
        for (let x = 0; x < BURROW_SIZE; x++) {
            row.push({
                x,
                y,
                type: BurrowTileType.HIDDEN,
                revealed: false,
                harvested: false
            });
        }
        grid.push(row);
    }

    const cx = Math.floor(BURROW_SIZE / 2);
    const cy = Math.floor(BURROW_SIZE / 2);
    const queenTile = grid[cy][cx];
    queenTile.type = BurrowTileType.QUEEN;
    queenTile.revealed = true;

    const candidates = [];
    for (let y = 0; y < BURROW_SIZE; y++) {
        for (let x = 0; x < BURROW_SIZE; x++) {
            if (x === cx && y === cy) continue;
            candidates.push(grid[y][x]);
        }
    }

    shuffleArray(candidates);

    const numResources = 5;
    const numGas = 3;
    const numRock = 6;
    const numAncient = 2;

    let idx = 0;
    for (let i = 0; i < numResources && idx < candidates.length; i++, idx++) {
        candidates[idx].type = BurrowTileType.RESOURCE;
    }
    for (let i = 0; i < numGas && idx < candidates.length; i++, idx++) {
        candidates[idx].type = BurrowTileType.GAS;
    }
    for (let i = 0; i < numRock && idx < candidates.length; i++, idx++) {
        candidates[idx].type = BurrowTileType.ROCK;
    }
    for (let i = 0; i < numAncient && idx < candidates.length; i++, idx++) {
        candidates[idx].type = BurrowTileType.ANCIENT;
    }

    return grid;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function renderBurrowGrid() {
    const gridEl = document.getElementById("burrow-grid");
    if (!gridEl) return;
    gridEl.innerHTML = "";

    for (let y = 0; y < BURROW_SIZE; y++) {
        for (let x = 0; x < BURROW_SIZE; x++) {
            const tile = burrowGame.grid[y][x];
            const div = document.createElement("div");
            div.classList.add("burrow-tile");
            div.dataset.x = x;
            div.dataset.y = y;

            let cls = BurrowTileType.HIDDEN;
            let label = "";

            if (!tile.revealed && tile.type !== BurrowTileType.QUEEN) {
                cls = BurrowTileType.HIDDEN;
            } else {
                cls = tile.type;
            }

            div.classList.add(cls);

            switch (cls) {
                case BurrowTileType.QUEEN:
                    label = "Q";
                    break;
                case BurrowTileType.DIRT:
                case BurrowTileType.TUNNEL:
                    label = "";
                    break;
                case BurrowTileType.ROCK:
                    label = "⛰";
                    break;
                case BurrowTileType.GAS:
                    label = "☣";
                    break;
                case BurrowTileType.RESOURCE:
                    label = tile.harvested ? "✓" : "✦";
                    break;
                case BurrowTileType.ANCIENT:
                    label = "⌘";
                    break;
                case BurrowTileType.NURSERY:
                    label = "N";
                    break;
                case BurrowTileType.STORAGE:
                    label = "S";
                    break;
                case BurrowTileType.QUEEN_HALL:
                    label = "H";
                    break;
                default:
                    label = "";
            }

            div.textContent = label;
            gridEl.appendChild(div);
        }
    }
}

function onBurrowGridClick(e) {
    if (!burrowGame.inRun) return;
    const tileEl = e.target.closest(".burrow-tile");
    if (!tileEl) return;

    const x = parseInt(tileEl.dataset.x, 10);
    const y = parseInt(tileEl.dataset.y, 10);
    const tile = burrowGame.grid[y][x];

    if (!tile) return;

    if (burrowGame.worms <= 0) {
        setBurrowStatus("No worms left. Run will end.");
        endBurrowRun("No worms left.");
        return;
    }

    if (!tile.revealed && tile.type !== BurrowTileType.QUEEN) {
        burrowDig(tile);
    } else {
        burrowActOnRevealed(tile);
    }

    updateBurrowUI();
    renderBurrowGrid();
}

function burrowDig(tile) {
    burrowGame.worms--;
    tile.revealed = true;

    if (tile.type === BurrowTileType.RESOURCE) {
        setBurrowStatus("You uncovered a resource node. Click it to harvest.");
    } else if (tile.type === BurrowTileType.GAS) {
        setBurrowStatus("Gas pocket! The burrow collapses.");
        endBurrowRun("Gas pocket collapse.");
        return;
    } else if (tile.type === BurrowTileType.ROCK) {
        setBurrowStatus("Rock wall. Impassable.");
    } else if (tile.type === BurrowTileType.ANCIENT) {
        setBurrowStatus("Ancient burrow discovered! Q‑Essence surges.");
        burrowGame.totalResourcesThisRun += 3;
        grantBurrowQEssence(3 + Math.floor(Math.random() * 3));
        tile.type = BurrowTileType.DIRT;
    } else {
        tile.type = BurrowTileType.DIRT;
        setBurrowStatus("Dirt cleared. You can expand a tunnel here.");
    }
}

function burrowActOnRevealed(tile) {
    switch (tile.type) {
        case BurrowTileType.DIRT:
            burrowExpandTunnel(tile);
            break;
        case BurrowTileType.TUNNEL:
            showBurrowBuildMenu(tile);
            break;
        case BurrowTileType.RESOURCE:
            burrowHarvest(tile);
            break;
        case BurrowTileType.NURSERY:
        case BurrowTileType.STORAGE:
        case BurrowTileType.QUEEN_HALL:
            setBurrowStatus("Chamber already built here.");
            break;
        case BurrowTileType.QUEEN:
            setBurrowStatus("The Worm Queen watches your work.");
            break;
        default:
            setBurrowStatus("Nothing more to do here.");
    }
}

function burrowExpandTunnel(tile) {
    burrowGame.worms--;
    tile.type = BurrowTileType.TUNNEL;
    setBurrowStatus("Tunnel expanded. You can build a chamber here.");
}

function burrowHarvest(tile) {
    if (tile.harvested) {
        setBurrowStatus("This node has already been harvested.");
        return;
    }
    burrowGame.worms--;
    tile.harvested = true;
    burrowGame.totalResourcesThisRun += 1;
    setBurrowStatus("Resources harvested. Worm branch grows stronger.");
}

function showBurrowBuildMenu(tile) {
    const menu = document.getElementById("burrow-build-menu");
    const grid = document.getElementById("burrow-grid");
    if (!menu || !grid) return;

    burrowGame.selectedTile = tile;

    const gridRect = grid.getBoundingClientRect();
    const tileIndex = tile.y * BURROW_SIZE + tile.x;
    const tileEl = grid.children[tileIndex];
    if (!tileEl) return;

    const rect = tileEl.getBoundingClientRect();

    menu.style.display = "flex";
    menu.style.left = (rect.left - gridRect.left + rect.width / 2 - 50) + "px";
    menu.style.top = (rect.top - gridRect.top - 60) + "px";
}

function hideBurrowBuildMenu() {
    const menu = document.getElementById("burrow-build-menu");
    if (menu) menu.style.display = "none";
    burrowGame.selectedTile = null;
}

function onBurrowBuildMenuClick(e) {
    const btn = e.target.closest("button[data-build]");
    if (!btn) return;
    const type = btn.dataset.build;
    const tile = burrowGame.selectedTile;
    if (!tile) return;

    burrowGame.worms--;

    if (type === "nursery") {
        tile.type = BurrowTileType.NURSERY;
        burrowGame.worms += 1;
        setBurrowStatus("Nursery built. +1 worm this run.");
    } else if (type === "storage") {
        tile.type = BurrowTileType.STORAGE;
        burrowGame.totalResourcesThisRun += 1;
        setBurrowStatus("Storage built. Resource yield improved.");
    } else if (type === "queenHall") {
        tile.type = BurrowTileType.QUEEN_HALL;
        burrowGame.permBonusPercent += 1;
        setBurrowStatus("Queen’s Hall built. Permanent worm CPS +1%.");
        applyBurrowPermanentBonus();
    }

    hideBurrowBuildMenu();
    renderBurrowGrid();
    updateBurrowUI();
}

function applyBurrowRewards() {
    const gained = burrowGame.totalResourcesThisRun;

    if (gained <= 0) {
        setBurrowStatus("The burrow yields nothing this time.");
        return;
    }

    const duration = 30000;
    const boost = 2;
    setBurrowStatus(`Burrow yields ${gained} resources. Worm CPS x${boost} for 30s.`);
    burrowApplyTemporaryWormBoost(boost, duration);

    const permGain = Math.min(3, gained);
    burrowGame.permBonusPercent += permGain;
    applyBurrowPermanentBonus();
}

function burrowApplyTemporaryWormBoost(multiplier, duration) {
    wormEventMultiplier *= multiplier;
    setTimeout(() => {
        wormEventMultiplier /= multiplier;
    }, duration);
}

function applyBurrowPermanentBonus() {
    // Hook into worm CPS if desired; currently stored in burrowGame.permBonusPercent
}

function grantBurrowQEssence(amount) {
    if (typeof qEssence !== "undefined") {
        qEssence += amount;
        if (typeof updateDisplay === "function") updateDisplay();
    }
}

function updateBurrowUI() {
    const wormsEl = document.getElementById("burrow-worms");
    const runsEl = document.getElementById("burrow-runs");
    const permEl = document.getElementById("burrow-perm");

    if (wormsEl) wormsEl.textContent = `Worms: ${burrowGame.worms}`;
    if (runsEl) runsEl.textContent = `Runs: ${burrowGame.runs}`;
    if (permEl) permEl.textContent = `Perm bonus: ${burrowGame.permBonusPercent}%`;
}

function setBurrowStatus(text) {
    const el = document.getElementById("burrow-status");
    if (el) el.textContent = text;
}

function saveBurrowData() {
    return {
        baseWorms: burrowGame.baseWorms,
        permBonusPercent: burrowGame.permBonusPercent,
        runs: burrowGame.runs
    };
}

function loadBurrowData(data) {
    if (!data) return;
    burrowGame.baseWorms = data.baseWorms ?? burrowGame.baseWorms;
    burrowGame.permBonusPercent = data.permBonusPercent ?? 0;
    burrowGame.runs = data.runs ?? 0;
    updateBurrowUI();
}

/* ============================
      Q‑ESSENCE / Q‑TREE
============================ */

let qEssence = 0;
const qUpgrades = [
    { id: "q_crit",   name: "Quantum Probability", desc: "+5% crit chance",      cost: 5,  bought: false },
    { id: "q_cps",    name: "Gravitic Overcharge", desc: "+10% global CPS",      cost: 5,  bought: false },
    { id: "q_snake",  name: "Serpent Dominion",    desc: "+1% CPS per Snake",    cost: 8,  bought: false },
    { id: "q_worm",   name: "Worm Hive Memory",    desc: "Worms start stronger", cost: 8,  bought: false },
    { id: "q_golden", name: "Cosmic Lure",         desc: "+20% golden events",   cost: 10, bought: false },
    { id: "q_click",  name: "Ascended Touch",      desc: "+200% click power",    cost: 10, bought: false },
];

function isQBought(id) {
    const u = qUpgrades.find(x => x.id === id);
    return u && u.bought;
}

/* CLICK HANDLER WITH SPECIAL ABILITIES */
colonialImg.onclick = (event) => {
    let gain = clickPower * clickEventMultiplier * tempClickMultiplier;
    let isCrit = false;

    const quantum = getBuilding("quantum");
    let critChance = 0.10;
    if (isQBought("q_crit")) critChance += 0.05;

    if (quantum && quantum.owned > 0) {
        if (Math.random() < critChance) {
            gain *= 10;
            isCrit = true;
        }
    }

    if (isQBought("q_click")) gain *= 3;

    const psionic = getBuilding("psionic");
    if (psionic && psionic.owned > 0) {
        gain += Math.floor(getTotalCps());
    }

    colonials += gain;
    updateDisplay();
    spawnFloat(event, gain, isCrit);
};

/* FLOATING TEXT */
function spawnFloat(event, amount, isCrit) {
    const container = document.getElementById("float-container");
    if (!container) return;
    const float = document.createElement("div");
    float.className = "float";
    if (isCrit) float.classList.add("crit");

    float.innerText = isCrit ? `CRIT! +${amount}` : `+${amount}`;

    const rect = colonialImg.getBoundingClientRect();
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 20;

    float.style.left = (event.clientX - rect.left + offsetX) + "px";
    float.style.top = (event.clientY - rect.top + offsetY) + "px";

    container.appendChild(float);
    setTimeout(() => float.remove(), 1000);
}

function showGoldenMessage(text) {
    const msg = document.getElementById("golden-message");
    if (!msg) return;
    msg.innerText = text;
    msg.style.opacity = 1;

    setTimeout(() => {
        msg.style.opacity = 0;
    }, 1800);
}

/* BUILDINGS (EVOLUTIONS) */
const buildings = [
    {
        id: "gravital",
        name: "Gravital Adaptation",
        baseCost: 150,
        cost: 150,
        baseCps: 5,
        owned: 0,
        multiplier: 1,
        branch: "gravital",
        requiresId: null,
        requiresOwned: 0,
        description: "Colonials adapt to crushing gravity."
    },
    {
        id: "worm",
        name: "Worm Children",
        baseCost: 225,
        cost: 225,
        baseCps: 6,
        owned: 0,
        multiplier: 1,
        branch: "worm",
        requiresId: null,
        requiresOwned: 0,
        description: "Colonials devolve into burrowing specialists."
    },
    {
        id: "snake",
        name: "Snake People",
        baseCost: 300,
        cost: 300,
        baseCps: 10,
        owned: 0,
        multiplier: 1,
        branch: "snake",
        requiresId: null,
        requiresOwned: 0,
        description: "Colonials become serpentine posthumans."
    },
    {
        id: "ruin",
        name: "Ruin Haunters",
        baseCost: 1200,
        cost: 1200,
        baseCps: 40,
        owned: 0,
        multiplier: 1,
        branch: "gravital",
        requiresId: "gravital",
        requiresOwned: 1,
        description: "Gravital descendants haunting ruined megastructures."
    },
    {
        id: "blind",
        name: "Blind Folk",
        baseCost: 1800,
        cost: 1800,
        baseCps: 50,
        owned: 0,
        multiplier: 1,
        branch: "gravital",
        requiresId: "gravital",
        requiresOwned: 1,
        description: "Gravital lineages that abandon sight."
    },
    {
        id: "wormPat",
        name: "Worm Patriarchs",
        baseCost: 2400,
        cost: 2400,
        baseCps: 60,
        owned: 0,
        multiplier: 1,
        branch: "worm",
        requiresId: "worm",
        requiresOwned: 1,
        description: "Massive rulers of worm broods."
    },
    {
        id: "wormCity",
        name: "Worm Cities",
        baseCost: 3000,
        cost: 3000,
        baseCps: 75,
        owned: 0,
        multiplier: 1,
        branch: "worm",
        requiresId: "worm",
        requiresOwned: 1,
        description: "Burrowed megastructures of worm civilization."
    },
    {
        id: "coil",
        name: "Coil-Minds",
        baseCost: 3600,
        cost: 3600,
        baseCps: 90,
        owned: 0,
        multiplier: 1,
        branch: "snake",
        requiresId: "snake",
        requiresOwned: 1,
        description: "Serpents whose bodies are living neural nets."
    },
    {
        id: "serpentNoble",
        name: "Serpent Nobles",
        baseCost: 4500,
        cost: 4500,
        baseCps: 100,
        owned: 0,
        multiplier: 1,
        branch: "snake",
        requiresId: "snake",
        requiresOwned: 1,
        description: "Aristocratic ophidian dynasties."
    },
    {
        id: "starDwellers",
        name: "Star-Dwellers",
        baseCost: 24000,
        cost: 24000,
        baseCps: 400,
        owned: 0,
        multiplier: 1,
        branch: "gravital",
        requiresId: "ruin",
        requiresOwned: 1,
        description: "Ruin Haunters that ascend to the stars."
    },
    {
        id: "starBlind",
        name: "Star-Blind Navigators",
        baseCost: 30000,
        cost: 30000,
        baseCps: 450,
        owned: 0,
        multiplier: 1,
        branch: "gravital",
        requiresId: "blind",
        requiresOwned: 1,
        description: "Blind Folk guiding ships by gravity alone."
    },
    {
        id: "hiveKings",
        name: "Hive Kings",
        baseCost: 36000,
        cost: 36000,
        baseCps: 500,
        owned: 0,
        multiplier: 1,
        branch: "worm",
        requiresId: "wormPat",
        requiresOwned: 1,
        description: "Absolute rulers of worm hives."
    },
    {
        id: "burrowedMetros",
        name: "Burrowed Metropolises",
        baseCost: 42000,
        cost: 42000,
        baseCps: 550,
        owned: 0,
        multiplier: 1,
        branch: "worm",
        requiresId: "wormCity",
        requiresOwned: 1,
        description: "Planet-spanning underground cities."
    },
    {
        id: "neuroSerpents",
        name: "Neuro-Serpents",
        baseCost: 48000,
        cost: 48000,
        baseCps: 600,
        owned: 0,
        multiplier: 1,
        branch: "snake",
        requiresId: "coil",
        requiresOwned: 1,
        description: "Serpents optimized for pure cognition."
    },
    {
        id: "crownedOphidians",
        name: "Crowned Ophidians",
        baseCost: 54000,
        cost: 54000,
        baseCps: 650,
        owned: 0,
        multiplier: 1,
        branch: "snake",
        requiresId: "serpentNoble",
        requiresOwned: 1,
        description: "Imperial serpent dynasties."
    },
    {
        id: "voidborne",
        name: "Voidborne Colonials",
        baseCost: 150000,
        cost: 150000,
        baseCps: 2000,
        owned: 0,
        multiplier: 1,
        branch: "gravital",
        requiresId: "starDwellers",
        requiresOwned: 1,
        description: "Colonials adapted to the vacuum of space."
    },
    {
        id: "quantum",
        name: "Quantum Pilgrims",
        baseCost: 180000,
        cost: 180000,
        baseCps: 300,
        owned: 0,
        multiplier: 1,
        branch: "gravital",
        requiresId: "starBlind",
        requiresOwned: 1,
        description: "Pilgrims walking probability itself."
    },
    {
        id: "planetEaters",
        name: "Planet-Eaters",
        baseCost: 210000,
        cost: 210000,
        baseCps: 1500,
        owned: 0,
        multiplier: 1,
        branch: "worm",
        requiresId: "hiveKings",
        requiresOwned: 1,
        description: "Worms that consume entire worlds."
    },
    {
        id: "subterranean",
        name: "Subterranean Empires",
        baseCost: 240000,
        cost: 240000,
        baseCps: 1000,
        owned: 0,
        multiplier: 1,
        branch: "worm",
        requiresId: "burrowedMetros",
        requiresOwned: 1,
        description: "Empires spanning the deep crust."
    },
    {
        id: "psionic",
        name: "Psionic Ophidians",
        baseCost: 270000,
        cost: 270000,
        baseCps: 800,
        owned: 0,
        multiplier: 1,
        branch: "snake",
        requiresId: "neuroSerpents",
        requiresOwned: 1,
        description: "Serpents wielding raw thought as a weapon."
    },
    {
        id: "imperial",
        name: "Imperial Serpents",
        baseCost: 300000,
        cost: 300000,
        baseCps: 1200,
        owned: 0,
        multiplier: 1,
        branch: "snake",
        requiresId: "crownedOphidians",
        requiresOwned: 1,
        description: "Serpents ruling entire star empires."
    }
];

/* COOKIE-CLICKER STYLE BOOSTS */
const boosts = [
    {
        id: "gravital10",
        building: "gravital",
        required: 10,
        multiplier: 3,
        cost: 2000,
        name: "Reinforced Skeletons",
        bought: false
    },
    {
        id: "gravital25",
        building: "gravital",
        required: 25,
        multiplier: 3,
        cost: 8000,
        name: "Hyperdense Bone Matrix",
        bought: false
    },
    {
        id: "worm10",
        building: "worm",
        required: 10,
        multiplier: 3,
        cost: 2500,
        name: "Burrowing Instincts",
        bought: false
    },
    {
        id: "worm25",
        building: "worm",
        required: 25,
        multiplier: 3,
        cost: 9000,
        name: "Segmented Efficiency",
        bought: false
    },
    {
        id: "snake10",
        building: "snake",
        required: 10,
        multiplier: 3,
        cost: 3000,
        name: "Coiled Reflexes",
        bought: false
    },
    {
        id: "snake25",
        building: "snake",
        required: 25,
        multiplier: 3,
        cost: 10000,
        name: "Serpentine Grace",
        bought: false
    }
];

function getBuilding(id) {
    return buildings.find(b => b.id === id);
}

function getTotalCps() {
    let total = 0;

    const subterranean = getBuilding("subterranean");
    wormBranchMultiplier = (subterranean && subterranean.owned > 0) ? 1.5 : 1;

    const imperial = getBuilding("imperial");
    imperialBonusMultiplier = imperial ? (1 + 0.05 * imperial.owned) : 1;

    let qCpsBonus = 1;
    let snakeBonus = 1;

    if (isQBought("q_cps")) qCpsBonus *= 1.10;

    if (isQBought("q_snake")) {
        const snakeOwned = buildings
            .filter(b => b.branch === "snake")
            .reduce((s, b) => s + b.owned, 0);
        snakeBonus *= 1 + 0.01 * snakeOwned;
    }

    buildings.forEach(b => {
        if (b.owned > 0) {
            let branchMult = 1;
            if (b.branch === "worm") {
                branchMult *= wormBranchMultiplier * wormEventMultiplier * (1 + archaeotechPermanent.branchPercent / 100);
            }
            const base = b.baseCps * b.multiplier * b.owned * branchMult;
            total += base;
        }
    });

    total = Math.floor(
        total *
        imperialBonusMultiplier *
        eventMultiplier *
        goldenCpsMultiplier *
        qCpsBonus *
        snakeBonus *
        tempCpsMultiplier *
        (1 + archaeotechPermanent.cpsPercent / 100)
    );
    return total;
}

function updateDisplay() {
    const g = getBuilding("gravital");
    const w = getBuilding("worm");
    const s = getBuilding("snake");

    clickPower = 1;
    if (g && g.owned >= 10) clickPower = 2;
    if (w && w.owned >= 10) clickPower = 3;
    if (s && s.owned >= 10) clickPower = 5;

    clickPower = Math.floor(clickPower * (1 + archaeotechPermanent.clickPercent / 100));

    document.getElementById("counter").innerText = `Colonials: ${colonials}`;
    document.getElementById("cps-counter").innerText = `CPS: ${getTotalCps()}`;
}

function renderBuildings() {
    const container = document.getElementById("buildings");
    if (!container) return;
    container.innerHTML = "";

    buildings.forEach((b, index) => {
        if (b.requiresId) {
            const req = getBuilding(b.requiresId);
            if (!req || req.owned < b.requiresOwned) return;
        }

        const div = document.createElement("div");
        div.className = "upgrade";
        div.innerHTML = `
            <h3>${b.name}</h3>
            <p>${b.description}</p>
            <p>Owned: ${b.owned}</p>
            <p>Cost: ${b.cost}</p>
            <p>CPS each: ${Math.floor(b.baseCps * b.multiplier)}</p>
            <button onclick="buyBuilding(${index})">Evolve</button>
        `;
        container.appendChild(div);
    });
}

function buyBuilding(i) {
    const b = buildings[i];

    if (colonials >= b.cost) {
        colonials -= b.cost;
        b.owned++;
        b.cost = Math.floor(b.baseCost * Math.pow(1.25, b.owned));

        updateDisplay();
        renderBuildings();
        renderBoosts();
        saveGame();
    }
}

function renderBoosts() {
    const container = document.getElementById("boosts");
    if (!container) return;
    container.innerHTML = "";

    boosts.forEach(u => {
        if (u.bought) return;
        const building = getBuilding(u.building);
        if (!building || building.owned < u.required) return;

        const div = document.createElement("div");
        div.className = "boost";
        div.innerHTML = `
            <h3>${u.name}</h3>
            <p>Boosts ${building.name}</p>
            <p>Cost: ${u.cost}</p>
            <button onclick="buyBoost('${u.id}')">Buy Upgrade</button>
        `;
        container.appendChild(div);
    });
}

function buyBoost(id) {
    const u = boosts.find(x => x.id === id);
    const building = getBuilding(u.building);

    if (colonials >= u.cost && !u.bought) {
        colonials -= u.cost;
        u.bought = true;

        building.multiplier *= u.multiplier;

        updateDisplay();
        renderBoosts();
        renderBuildings();
        saveGame();
    }
}

/* SPECIAL ABILITIES TIMERS */

setInterval(() => {
    const voidborne = getBuilding("voidborne");
    if (voidborne && voidborne.owned > 0) {
        colonials += getTotalCps() * 15;
        updateDisplay();
        saveGame();
    }
}, 10000);

setInterval(() => {
    const planetEaters = getBuilding("planetEaters");
    if (planetEaters && planetEaters.owned > 0) {
        eventMultiplier = 4;
        setTimeout(() => {
            eventMultiplier = 1;
        }, 10000);
    }
}, 30000);

setInterval(() => {
    colonials += getTotalCps();
    updateDisplay();
    saveGame();
}, 1000);

const btnGravityNav = document.getElementById("btn-gravity-nav");
if (btnGravityNav) {
    btnGravityNav.addEventListener("click", () => {
        showMinigamePanel("gravity-nav-panel");
    });
}

/* ============================
      GOLDEN EVENTS SYSTEM
============================ */

function spawnGoldenEvent() {
    const layer = document.getElementById("event-layer");
    if (!layer) return;

    if (layer.querySelector(".golden-event")) return;

    const orb = document.createElement("div");
    orb.className = "golden-event";
    orb.innerText = "?";

    const layerRect = layer.getBoundingClientRect();
    const x = Math.random() * (layerRect.width - 80) + 40;
    const y = Math.random() * (layerRect.height - 160) + 80;

    orb.style.left = `${x}px`;
    orb.style.top = `${y}px`;

    orb.onclick = () => {
        triggerRandomEvent();
        orb.remove();
    };

    layer.appendChild(orb);

    setTimeout(() => {
        if (orb.parentElement) orb.remove();
    }, 10000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

function triggerRandomEvent() {
    const roll = Math.random();
    if (roll < 0.16) {
        gravitySurge();
    } else if (roll < 0.32) {
        geneticBloom();
    } else if (roll < 0.48) {
        cosmicVisitor();
    } else if (roll < 0.64) {
        ophidianBlessing();
    } else if (roll < 0.80) {
        wormquake();
    } else {
        qGlimpse();
    }
}

function gravitySurge() {
    showGoldenMessage("Gravity Surge! +500% CPS for 20s");
    goldenCpsMultiplier = 6;
    setTimeout(() => {
        goldenCpsMultiplier = 1;
    }, 20000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

function geneticBloom() {
    let totalOwned = 0;
    buildings.forEach(b => totalOwned += b.owned);

    showGoldenMessage(`Genetic Bloom! +${Math.floor(totalOwned)}% CPS for 30s`);

    goldenCpsMultiplier = 1 + totalOwned * 0.01;
    setTimeout(() => {
        goldenCpsMultiplier = 1;
    }, 30000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

function cosmicVisitor() {
    showGoldenMessage("Cosmic Visitor! Instant 10× CPS");
    colonials += getTotalCps() * 10;
    updateDisplay();
    saveGame();
}

function ophidianBlessing() {
    showGoldenMessage("Ophidian Blessing! 50× click power for 15s");
    clickEventMultiplier = 50;
    setTimeout(() => {
        clickEventMultiplier = 1;
    }, 15000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

function wormquake() {
    showGoldenMessage("Wormquake! Worm CPS massively boosted");
    wormEventMultiplier = 11;
    setTimeout(() => {
        wormEventMultiplier = 1;
    }, 20000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

function qGlimpse() {
    showGoldenMessage("Q Glimpse! Reality shifts…");
    const events = [gravitySurge, geneticBloom, cosmicVisitor, ophidianBlessing, wormquake];
    const fn = events[Math.floor(Math.random() * events.length)];
    fn();
}

function scheduleGoldenEvents() {
    let base = 60000 + Math.random() * 60000;

    if (isQBought("q_golden")) base *= 0.8;
    base = base / tempGoldenFreqFactor;

    setTimeout(() => {
        spawnGoldenEvent();
        scheduleGoldenEvents();
    }, base);
}

/* ============================
      Q‑TREE / PRESTIGE
============================ */

function getTotalColonialsForPrestige() {
    return Math.floor(Math.log10(Math.max(colonials, 1)));
}

function ascend() {
    const gained = getTotalColonialsForPrestige();
    if (gained <= 0) {
        alert("You need more Colonials before ascending.");
        return;
    }

    if (!confirm(`Ascend and gain ${gained} Q‑Essence? This resets your run.`)) return;

    qEssence += gained;

    colonials = 0;
    buildings.forEach(b => {
        b.owned = 0;
        b.cost = b.baseCost;
        b.multiplier = 1;
    });
    boosts.forEach(u => u.bought = false);

    eventMultiplier = 1;
    goldenCpsMultiplier = 1;
    wormEventMultiplier = 1;
    clickEventMultiplier = 1;
    tempCpsMultiplier = 1;
    tempClickMultiplier = 1;
    tempGoldenFreqFactor = 1;

    saveGame();
    renderBuildings();
    renderBoosts();
    updateDisplay();
    renderQTree();
}

function renderQTree() {
    const circle = document.getElementById("qtree-circle");
    const display = document.getElementById("q-essence-display");
    if (!circle || !display) return;

    display.innerText = `Q‑Essence: ${qEssence}`;

    circle.innerHTML = "";
    const radius = 110;
    const center = 130;
    const n = qUpgrades.length;

    qUpgrades.forEach((u, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const x = center + radius * Math.cos(angle) - 23;
        const y = center + radius * Math.sin(angle) - 23;

        const node = document.createElement("div");
        node.className = "q-node";
        if (u.bought) node.classList.add("bought");
        if (!u.bought && u.cost > qEssence) node.classList.add("locked");

        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.title = `${u.name}\n${u.desc}\nCost: ${u.cost} Q‑Essence`;
        node.innerText = u.name.split(" ")[0];

        node.onclick = () => {
            if (u.bought) return;
            if (qEssence < u.cost) {
                alert("Not enough Q‑Essence.");
                return;
            }
            qEssence -= u.cost;
            u.bought = true;
            saveGame();
            renderQTree();
            updateDisplay();
        };

        circle.appendChild(node);
    });
}

/* ============================
   WORM EVOLUTION WEB SYSTEM
============================ */

const wormWebNodes = [
    { id: 1, x: 180, y: 20,  prereq: null },
    { id: 2, x: 80,  y: 120, prereq: 1 },
    { id: 3, x: 280, y: 120, prereq: 1 },
    { id: 4, x: 50,  y: 240, prereq: 2 },
    { id: 5, x: 310, y: 240, prereq: 3 },
    { id: 6, x: 180, y: 300, prereq: [4, 5] }
];

let wormUpgrades = {
    1: "locked",
    2: "locked",
    3: "locked",
    4: "locked",
    5: "locked",
    6: "locked"
};

function initWormWeb() {
    const container = document.getElementById("worm-upgrade-web");
    const svg = document.getElementById("worm-web-lines");
    if (!container || !svg) return;

    document.querySelectorAll(".web-node").forEach(node => {
        const id = parseInt(node.dataset.upg);
        const data = wormWebNodes.find(n => n.id === id);
        node.style.left = data.x + "px";
        node.style.top = data.y + "px";

        node.addEventListener("click", () => tryUnlockWormUpgrade(id));
    });

    wormWebNodes.forEach(n => {
        if (!n.prereq) return;

        const prereqs = Array.isArray(n.prereq) ? n.prereq : [n.prereq];

        prereqs.forEach(p => {
            const parent = wormWebNodes.find(x => x.id === p);

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", parent.x + 30);
            line.setAttribute("y1", parent.y + 30);
            line.setAttribute("x2", n.x + 30);
            line.setAttribute("y2", n.y + 30);
            line.setAttribute("stroke", "#3a5a34");
            line.setAttribute("stroke-width", "3");
            line.setAttribute("stroke-linecap", "round");

            svg.appendChild(line);
        });
    });

    updateWormWebUI();
}

function tryUnlockWormUpgrade(id) {
    const node = wormWebNodes.find(n => n.id === id);

    if (node.prereq) {
        const prereqs = Array.isArray(node.prereq) ? node.prereq : [node.prereq];
        for (const p of prereqs) {
            if (wormUpgrades[p] !== "completed") {
                return;
            }
        }
    }

    wormUpgrades[id] = "completed";
    updateWormWebUI();
}

function updateWormWebUI() {
    document.querySelectorAll(".web-node").forEach(node => {
        const id = parseInt(node.dataset.upg);
        const state = wormUpgrades[id];

        node.classList.remove("locked", "unlocked", "completed");

        if (state === "completed") node.classList.add("completed");
        else if (state === "locked") node.classList.add("locked");
        else node.classList.add("unlocked");
    });
}

/* ============================
      MINIGAME PANELS
============================ */

const miniPanel = document.getElementById("minigame-panel");
const miniTitle = document.getElementById("minigame-title");
const miniContent = document.getElementById("minigame-content");
const qPanel = document.getElementById("qtree-panel");

const btnArch = document.getElementById("btn-archaeotech");
if (btnArch) btnArch.onclick = () => openArchaeotechLab();

const btnGrav = document.getElementById("btn-gravity");
if (btnGrav) btnGrav.onclick = () =>
    openSimpleMinigame("Gravity Navigation",
        "Steer gravity waves to hit targets and gain temporary CPS boosts.");

const btnBurrow = document.getElementById("btn-burrow");
if (btnBurrow) btnBurrow.onclick = () =>
    openSimpleMinigame("Burrow Network",
        "Connect tunnels between nodes to boost Worm branch production.");

const btnNeural = document.getElementById("btn-neural");
if (btnNeural) btnNeural.onclick = () =>
    openSimpleMinigame("Neural Web",
        "Link neurons into circuits for psionic bonuses.");

const btnQTree = document.getElementById("btn-qtree");
if (btnQTree) btnQTree.onclick = () => {
    qPanel.classList.remove("hidden");
    renderQTree();
};

const closeMini = document.getElementById("close-minigame");
if (closeMini) closeMini.onclick = () =>
    miniPanel.classList.add("hidden");

const closeQTree = document.getElementById("close-qtree");
if (closeQTree) closeQTree.onclick = () =>
    qPanel.classList.add("hidden");

const ascendBtn = document.getElementById("ascend-btn");
if (ascendBtn) ascendBtn.onclick = ascend;

function openSimpleMinigame(title, text) {
    miniTitle.innerText = title;
    miniContent.innerHTML = `<p>${text}</p>`;
    miniPanel.classList.remove("hidden");
}

/* ============================
      ARCHAEO TECH LAB MINIGAME
============================ */

const RUIN_SIZE = 6;
const TILE_TYPES = ["empty", "relic", "hazard", "core", "rare", "cache"];

let ruinState = {
    active: false,
    grid: [],
    playerX: 0,
    playerY: 0,
    finished: false,
    message: ""
};

function openArchaeotechLab() {
    miniTitle.innerText = "Archaeotech Lab";
    if (!ruinState.active || ruinState.finished || ruinState.grid.length === 0) {
        startNewRuinRun();
    }
    renderRuinUI();
    miniPanel.classList.remove("hidden");
}

function startNewRuinRun() {
    ruinState.active = true;
    ruinState.finished = false;
    ruinState.message = "Explore the ruins. Avoid hazards, extract relics.";
    ruinState.grid = [];

    for (let y = 0; y < RUIN_SIZE; y++) {
        const row = [];
        for (let x = 0; x < RUIN_SIZE; x++) {
            const r = Math.random();
            let type;
            if (r < 0.40) type = "empty";
            else if (r < 0.65) type = "relic";
            else if (r < 0.80) type = "hazard";
            else if (r < 0.90) type = "core";
            else if (r < 0.95) type = "rare";
            else type = "cache";

            row.push({
                type,
                revealed: false,
                looted: false
            });
        }
        ruinState.grid.push(row);
    }

    let px, py;
    while (true) {
        px = Math.floor(Math.random() * RUIN_SIZE);
        py = Math.floor(Math.random() * RUIN_SIZE);
        if (ruinState.grid[py][px].type !== "hazard") break;
    }
    ruinState.playerX = px;
    ruinState.playerY = py;
    ruinState.grid[py][px].revealed = true;
}

function renderRuinUI() {
    let html = `
        <div class="ruin-controls">
            <div>
                <button onclick="ruinMove('up')">Up</button>
            </div>
            <div>
                <button onclick="ruinMove('left')">Left</button>
                <button onclick="ruinMove('down')">Down</button>
                <button onclick="ruinMove('right')">Right</button>
            </div>
            <div style="margin-top:4px;">
                <button onclick="ruinScan()">Scan</button>
                <button onclick="ruinExtract()">Extract</button>
                <button onclick="startNewRuinRun()">New Run</button>
            </div>
            <div id="ruin-status">${ruinState.message}</div>
        </div>
        <div class="ruin-grid">
    `;

    for (let y = 0; y < RUIN_SIZE; y++) {
        for (let x = 0; x < RUIN_SIZE; x++) {
            const tile = ruinState.grid[y][x];
            const isPlayer = (x === ruinState.playerX && y === ruinState.playerY);
            const classes = ["ruin-tile"];

            if (!tile.revealed) classes.push("hidden");
            else classes.push("revealed");

            if (tile.type === "hazard") classes.push("hazard");
            if (tile.type === "relic") classes.push("relic");
            if (tile.type === "core") classes.push("core");
            if (tile.type === "rare") classes.push("rare");
            if (tile.type === "cache") classes.push("cache");
            if (isPlayer) classes.push("player");

            html += `<div class="${classes.join(" ")}"></div>`;
        }
    }

    html += `</div>`;
    miniContent.innerHTML = html;

    const tiles = miniContent.querySelectorAll(".ruin-tile");
    let idx = 0;
    for (let y = 0; y < RUIN_SIZE; y++) {
        for (let x = 0; x < RUIN_SIZE; x++) {
            const tile = ruinState.grid[y][x];
            const el = tiles[idx++];
            if (tile.revealed) {
                let tip = "";
                if (tile.type === "empty") tip = "Empty chamber";
                if (tile.type === "relic") tip = "Relic fragment (temporary boost)";
                if (tile.type === "hazard") tip = "Hazard! Stepping here ends the run.";
                if (tile.type === "core") tip = "Ancient core (Q‑Essence)";
                if (tile.type === "rare") tip = "Rare relic (permanent buff)";
                if (tile.type === "cache") tip = "Hidden cache (random reward)";
                el.title = tip;
            }
        }
    }
}

function ruinMove(dir) {
    if (!ruinState.active || ruinState.finished) return;

    let nx = ruinState.playerX;
    let ny = ruinState.playerY;

    if (dir === "up") ny--;
    if (dir === "down") ny++;
    if (dir === "left") nx--;
    if (dir === "right") nx++;

    if (nx < 0 || nx >= RUIN_SIZE || ny < 0 || ny >= RUIN_SIZE) {
        ruinState.message = "You can't move outside the ruins.";
        renderRuinUI();
        return;
    }

    ruinState.playerX = nx;
    ruinState.playerY = ny;
    const tile = ruinState.grid[ny][nx];
    tile.revealed = true;

    if (tile.type === "hazard") {
        ruinState.message = "You triggered a hazard. The ruin collapses!";
        ruinState.finished = true;
        ruinState.active = false;
    } else {
        ruinState.message = "You move deeper into the ruins.";
    }

    renderRuinUI();
}

function ruinScan() {
    if (!ruinState.active || ruinState.finished) return;

    const x = ruinState.playerX;
    const y = ruinState.playerY;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < RUIN_SIZE && ny >= 0 && ny < RUIN_SIZE) {
                ruinState.grid[ny][nx].revealed = true;
            }
        }
    }

    ruinState.message = "You scan the surrounding chambers.";
    renderRuinUI();
}

function ruinExtract() {
    if (!ruinState.active || ruinState.finished) return;

    const x = ruinState.playerX;
    const y = ruinState.playerY;
    const tile = ruinState.grid[y][x];

    if (!tile.revealed) {
        ruinState.message = "You must reveal this chamber before extracting.";
        renderRuinUI();
        return;
    }

    if (tile.looted) {
        ruinState.message = "This chamber has already been picked clean.";
        renderRuinUI();
        return;
    }

    tile.looted = true;

    if (tile.type === "relic") {
        applyRelicReward();
        ruinState.message = "You extract a relic fragment. A temporary boost surges through your empire.";
    } else if (tile.type === "core") {
        const gained = 1 + Math.floor(Math.random() * 3);
        qEssence += gained;
        ruinState.message = `You recover an ancient core. +${gained} Q‑Essence.`;
        renderQTree();
    } else if (tile.type === "rare") {
        applyRareRelicReward();
        ruinState.message = "You uncover a rare relic. A permanent bonus is etched into history.";
    } else if (tile.type === "cache") {
        applyCacheReward();
    } else {
        ruinState.message = "Nothing of value here.";
    }

    saveGame();
    updateDisplay();
    renderRuinUI();
}

function applyRelicReward() {
    const roll = Math.random();
    if (roll < 0.33) {
        tempCpsMultiplier *= 3;
        setTimeout(() => {
            tempCpsMultiplier /= 3;
        }, 30000);
    } else if (roll < 0.66) {
        tempClickMultiplier *= 1.5;
        setTimeout(() => {
            tempClickMultiplier /= 1.5;
        }, 60000);
    } else {
        tempGoldenFreqFactor *= 1.5;
        setTimeout(() => {
            tempGoldenFreqFactor /= 1.5;
        }, 45000);
    }
}

function applyRareRelicReward() {
    const roll = Math.random();
    if (roll < 0.25) {
        archaeotechPermanent.cpsPercent += 1;
    } else if (roll < 0.5) {
        archaeotechPermanent.clickPercent += 1;
    } else if (roll < 0.75) {
        archaeotechPermanent.goldenDurationPercent += 1;
    } else {
        archaeotechPermanent.branchPercent += 1;
    }
}

function applyCacheReward() {
    const roll = Math.random();
    if (roll < 0.5) {
        applyRelicReward();
        ruinState.message = "A hidden cache yields a powerful temporary relic.";
    } else if (roll < 0.9) {
        applyRareRelicReward();
        ruinState.message = "A hidden cache reveals a rare relic. Permanent power gained.";
    } else {
        const gained = 5 + Math.floor(Math.random() * 6);
        qEssence += gained;
        archaeotechPermanent.cpsPercent += 2;
        archaeotechPermanent.clickPercent += 2;
        ruinState.message = `You discover a legendary artifact! +${gained} Q‑Essence and strong permanent boosts.`;
        renderQTree();
    }
}

/* ============================
      GRAVITY NAVIGATION
============================ */

let larva = null;
let larvaX = 0;
let larvaY = 0;

let velX = 0;
let velY = 0;

const GRAVITY = 0.25;
const THRUST = 0.35;
const MAX_SPEED = 6;

let thrustLeft = false;
let thrustRight = false;

let gravityNavRunning = false;
let currentLevel = 1;

let collectedLumens = 0;
let collectedNutrients = 0;
let collectedAncientCells = 0;

let evolution = {
    stabilityFins: false,
    pulse: false,
    shield: false,
    memory: false
};

let evolutionPoints = 0;
let pulseCooldown = false;

document.addEventListener("keydown", e => {
    if (!gravityNavRunning || !larva) return;

    if (e.key === "ArrowLeft" || e.key === "a") {
        thrustLeft = true;
        larva.classList.add("larva-thrust-left");
    }
    if (e.key === "ArrowRight" || e.key === "d") {
        thrustRight = true;
        larva.classList.add("larva-thrust-right");
    }

    if (e.key === " " && evolution.pulse && !pulseCooldown) {
        triggerPulse();
    }
});

document.addEventListener("keyup", e => {
    if (!larva) return;
    if (e.key === "ArrowLeft" || e.key === "a") {
        thrustLeft = false;
        larva.classList.remove("larva-thrust-left");
    }
    if (e.key === "ArrowRight" || e.key === "d") {
        thrustRight = false;
        larva.classList.remove("larva-thrust-right");
    }
});

function updateLarvaPhysics() {
    if (!gravityNavRunning || !larva) return;

    const controlBoost = evolution.stabilityFins ? 1.25 : 1;
    const effectiveGravity = evolution.memory ? GRAVITY * 0.9 : GRAVITY;

    velY += effectiveGravity;

    if (thrustLeft) {
        velX -= THRUST * controlBoost;
        velY -= THRUST * 0.2 * controlBoost;
    }
    if (thrustRight) {
        velX += THRUST * controlBoost;
        velY -= THRUST * 0.2 * controlBoost;
    }

    velX = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, velX));
    velY = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, velY));

    larvaX += velX;
    larvaY += velY;

    larva.style.left = larvaX + "px";
    larva.style.top = larvaY + "px";

    applyMagneticForces();
    updateSporeVents();
    updateTendrils();
    checkNutrientCollection();
    checkAncientCellCollection();
    checkLumenCollection();
    checkWallCollisions(currentLevel);
    checkLevelCompletion(currentLevel);

    const depthEl = document.getElementById("gravity-depth");
    if (depthEl) {
        depthEl.textContent = `Depth: ${Math.floor(larvaY)}m`;
    }

    requestAnimationFrame(updateLarvaPhysics);
}

const gravityLevels = {
    1: {
        walls: [
            { x: 0, y: 0, width: 40, height: 2000 },
            { x: 360, y: 0, width: 40, height: 2000 },
            { x: 120, y: 300, width: 80, height: 40 },
            { x: 200, y: 600, width: 100, height: 40 },
            { x: 80,  y: 900, width: 60, height: 40 }
        ],
        magnets: [{ x: 180, y: 500, strength: 0.4 }],
        vents: [{ x: 80, y: 700, direction: 1 }],
        tendrils: [{ x: 220, y: 900, sway: 0.015 }],
        lumens: [
            { x: 140, y: 300 },
            { x: 200, y: 600 },
            { x: 120, y: 900 }
        ],
        nutrients: [{ x: 160, y: 450 }],
        ancient: [],
        exitY: 1800
    },
    2: {
        walls: [
            { x: 0, y: 0, width: 40, height: 2200 },
            { x: 360, y: 0, width: 40, height: 2200 },
            { x: 140, y: 400, width: 60, height: 40 },
            { x: 220, y: 700, width: 80, height: 40 },
            { x: 100, y: 1100, width: 120, height: 40 },
            { x: 180, y: 1500, width: 80, height: 40 }
        ],
        magnets: [
            { x: 150, y: 600, strength: 0.5 },
            { x: 240, y: 1200, strength: 0.6 }
        ],
        vents: [
            { x: 100, y: 900, direction: 1 },
            { x: 260, y: 1400, direction: -1 }
        ],
        tendrils: [{ x: 180, y: 1100, sway: 0.02 }],
        lumens: [
            { x: 140, y: 400 },
            { x: 220, y: 700 },
            { x: 100, y: 1100 }
        ],
        nutrients: [{ x: 200, y: 800 }],
        ancient: [{ x: 180, y: 1500 }],
        exitY: 2000
    },
    3: {
        walls: [
            { x: 0, y: 0, width: 40, height: 2500 },
            { x: 360, y: 0, width: 40, height: 2500 },
            { x: 160, y: 300, width: 80, height: 40 },
            { x: 80,  y: 700, width: 60, height: 40 },
            { x: 220, y: 1100, width: 100, height: 40 },
            { x: 140, y: 1500, width: 80, height: 40 },
            { x: 100, y: 1900, width: 120, height: 40 }
        ],
        magnets: [
            { x: 160, y: 500, strength: 0.6 },
            { x: 240, y: 1300, strength: 0.7 }
        ],
        vents: [
            { x: 80, y: 700, direction: 1 },
            { x: 260, y: 1100, direction: -1 },
            { x: 140, y: 1600, direction: 1 }
        ],
        tendrils: [
            { x: 200, y: 900, sway: 0.025 },
            { x: 120, y: 1400, sway: 0.02 }
        ],
        lumens: [
            { x: 160, y: 300 },
            { x: 80, y: 700 },
            { x: 220, y: 1100 },
            { x: 140, y: 1500 }
        ],
        nutrients: [{ x: 200, y: 1000 }],
        ancient: [{ x: 100, y: 1900 }],
        exitY: 2300
    }
};

function renderLevelWalls(levelNumber) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return;

    viewport.querySelectorAll(".cavern-wall").forEach(w => w.remove());

    const level = gravityLevels[levelNumber];
    if (!level) return;

    level.walls.forEach(w => {
        const wall = document.createElement("div");
        wall.classList.add("cavern-wall");
        wall.style.left = w.x + "px";
        wall.style.top = w.y + "px";
        wall.style.width = w.width + "px";
        wall.style.height = w.height + "px";
        viewport.appendChild(wall);
    });
}

function spawnLarva() {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return;

    if (larva && larva.parentElement) larva.remove();

    larva = document.createElement("div");
    larva.classList.add("larva");

    larvaX = viewport.clientWidth / 2;
    larvaY = 40;
    velX = 0;
    velY = 0;

    larva.style.left = larvaX + "px";
    larva.style.top = larvaY + "px";

    viewport.appendChild(larva);
}

function renderLevel(levelNumber) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return;

    viewport.innerHTML = "";

    const level = gravityLevels[levelNumber];

    renderLevelWalls(levelNumber);

    level.magnets.forEach(m => spawnMagnet(m.x, m.y, m.strength));
    level.vents.forEach(v => spawnSporeVent(v.x, v.y, v.direction));
    level.tendrils.forEach(t => spawnTendril(t.x, t.y, t.sway));
    level.lumens.forEach(l => spawnLumen(l.x, l.y));
    level.nutrients.forEach(n => spawnNutrient(n.x, n.y));
    level.ancient.forEach(a => spawnAncientCell(a.x, a.y));

    spawnExitPlatform(level.exitY);
}

function spawnExitPlatform(y) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return;

    const exit = document.createElement("div");
    exit.classList.add("exit-platform");
    exit.style.left = "100px";
    exit.style.top = y + "px";

    viewport.appendChild(exit);
}

function checkLevelCompletion(levelNumber) {
    const exitY = gravityLevels[levelNumber].exitY;

    if (larvaY > exitY - 40 && larvaY < exitY + 40) {
        completeLevel(levelNumber);
    }
}

function checkWallCollisions(levelNumber) {
    const level = gravityLevels[levelNumber];
    if (!level || !larva) return;

    const walls = level.walls;

    const larvaRect = {
        x: larvaX,
        y: larvaY,
        width: 40,
        height: 80
    };

    for (let w of walls) {
        if (
            larvaRect.x < w.x + w.width &&
            larvaRect.x + larvaRect.width > w.x &&
            larvaRect.y < w.y + w.height &&
            larvaRect.y + larvaRect.height > w.y
        ) {
            handleLarvaCollision();
            return;
        }
    }
}

function handleLarvaCollision() {
    if (!larva) return;

    larva.classList.add("larva-hit");
    setTimeout(() => larva && larva.classList.remove("larva-hit"), 200);

    const impact = Math.abs(velX) + Math.abs(velY);

    if (impact > 6) {
        if (evolution.shield) {
            evolution.shield = false;
            updateEvolutionDisplay();

            larva.style.filter = "brightness(3)";
            setTimeout(() => {
                if (larva) larva.style.filter = "brightness(1)";
            }, 200);

            velX *= -0.3;
            velY *= -0.3;
            return;
        }

        killLarva();
    } else {
        velX *= -0.4;
        velY *= -0.4;
    }
}

function killLarva() {
    gravityNavRunning = false;
    if (!larva) return;

    larva.style.transition = "opacity 0.4s";
    larva.style.opacity = "0";

    setTimeout(() => {
        if (larva && larva.parentElement) larva.remove();
        larva = null;
    }, 400);
}

function spawnMagnet(x, y, strength = 0.4) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return null;

    const m = document.createElement("div");
    m.classList.add("magnet-crystal");
    m.style.left = x + "px";
    m.style.top = y + "px";
    m.dataset.strength = strength;

    viewport.appendChild(m);
    return m;
}

function applyMagneticForces() {
    if (!larva) return;

    const magnets = document.querySelectorAll(".magnet-crystal");

    magnets.forEach(m => {
        const mx = parseFloat(m.style.left) + 20;
        const my = parseFloat(m.style.top) + 20;

        const dx = mx - larvaX;
        const dy = my - larvaY;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 1) {
            const force = parseFloat(m.dataset.strength) / dist;
            velX += dx * force;
            velY += dy * force;
        }
    });
}

function spawnSporeVent(x, y, direction = 1) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return null;

    const vent = document.createElement("div");
    vent.classList.add("spore-vent");
    vent.style.left = x + "px";
    vent.style.top = y + "px";
    vent.dataset.direction = direction;

    viewport.appendChild(vent);
    return vent;
}

function updateSporeVents() {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport || !larva) return;

    const vents = document.querySelectorAll(".spore-vent");

    vents.forEach(v => {
        if (Math.random() < 0.01) {
            const cloud = document.createElement("div");
            cloud.classList.add("spore-cloud");

            const x = parseFloat(v.style.left);
            const y = parseFloat(v.style.top);

            cloud.style.left = (x + 20) + "px";
            cloud.style.top = (y + 10) + "px";

            const dir = parseInt(v.dataset.direction);
            const push = dir * 0.6;

            viewport.appendChild(cloud);

            const interval = setInterval(() => {
                const cx = parseFloat(cloud.style.left);
                cloud.style.left = (cx + dir * 2) + "px";

                if (
                    larvaX > cx &&
                    larvaX < cx + 80 &&
                    larvaY > y &&
                    larvaY < y + 40
                ) {
                    velX += push;
                }
            }, 30);

            setTimeout(() => {
                clearInterval(interval);
                cloud.remove();
            }, 600);
        }
    });
}

function spawnTendril(x, y, swaySpeed = 0.02) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return null;

    const t = document.createElement("div");
    t.classList.add("tendril");
    t.style.left = x + "px";
    t.style.top = y + "px";
    t.dataset.sway = swaySpeed;
    t.dataset.angle = 0;

    viewport.appendChild(t);
    return t;
}

function updateTendrils() {
    if (!larva) return;

    const tendrils = document.querySelectorAll(".tendril");

    tendrils.forEach(t => {
        let angle = parseFloat(t.dataset.angle);
        const sway = parseFloat(t.dataset.sway);

        angle += sway;
        t.dataset.angle = angle;

        const rot = Math.sin(angle) * 25;
        t.style.transform = `rotate(${rot}deg)`;

        const tx = parseFloat(t.style.left);
        const ty = parseFloat(t.style.top);

        if (
            larvaX + 40 > tx &&
            larvaX < tx + 20 &&
            larvaY + 80 > ty &&
            larvaY < ty + 120
        ) {
            handleLarvaCollision();
        }
    });
}

function spawnNutrient(x, y) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return null;

    const n = document.createElement("div");
    n.classList.add("nutrient");
    n.style.left = x + "px";
    n.style.top = y + "px";

    viewport.appendChild(n);
    return n;
}

function checkNutrientCollection() {
    if (!larva) return;

    const nutrients = document.querySelectorAll(".nutrient");

    nutrients.forEach(n => {
        const nx = parseFloat(n.style.left);
        const ny = parseFloat(n.style.top);

        if (
            larvaX + 40 > nx &&
            larvaX < nx + 26 &&
            larvaY + 80 > ny &&
            larvaY < ny + 26
        ) {
            n.remove();
            collectedNutrients++;

            velX *= 0.8;
            velY *= 0.8;
        }
    });
}

function spawnAncientCell(x, y) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return null;

    const a = document.createElement("div");
    a.classList.add("ancient-cell");
    a.style.left = x + "px";
    a.style.top = y + "px";

    viewport.appendChild(a);
    return a;
}

function checkAncientCellCollection() {
    if (!larva) return;

    const cells = document.querySelectorAll(".ancient-cell");

    cells.forEach(c => {
        const cx = parseFloat(c.style.left);
        const cy = parseFloat(c.style.top);

        if (
            larvaX + 40 > cx &&
            larvaX < cx + 30 &&
            larvaY + 80 > cy &&
            larvaY < cy + 30
        ) {
            c.remove();
            collectedAncientCells++;

            const gain = 1 + Math.floor(Math.random() * 2);
            qEssence += gain;
            updateDisplay();
        }
    });
}

function spawnLumen(x, y) {
    const viewport = document.getElementById("gravity-cavern-viewport");
    if (!viewport) return null;

    const l = document.createElement("div");
    l.classList.add("lumen");
    l.style.left = x + "px";
    l.style.top = y + "px";

    viewport.appendChild(l);
    return l;
}

function checkLumenCollection() {
    if (!larva) return;

    const lumens = document.querySelectorAll(".lumen");

    lumens.forEach(l => {
        const lx = parseFloat(l.style.left);
        const ly = parseFloat(l.style.top);

        if (
            larvaX + 40 > lx &&
            larvaX < lx + 18 &&
            larvaY + 80 > ly &&
            larvaY < ly + 18
        ) {
            l.remove();
            collectedLumens++;
        }
    });
}

function triggerPulse() {
    if (!larva) return;
    pulseCooldown = true;

    larva.classList.add("larva-pulse");

    document.querySelectorAll(".magnet-crystal, .spore-vent, .tendril")
        .forEach(h => h.style.opacity = "1");

    setTimeout(() => {
        if (larva) larva.classList.remove("larva-pulse");

        document.querySelectorAll(".magnet-crystal, .spore-vent, .tendril")
            .forEach(h => h.style.opacity = "0.5");

        pulseCooldown = false;
    }, 800);
}

function completeLevel(levelNumber) {
    gravityNavRunning = false;

    if (larva) {
        larva.style.transition = "opacity 0.4s";
        larva.style.opacity = "0";
        setTimeout(() => {
            if (larva && larva.parentElement) larva.remove();
            larva = null;
        }, 400);
    }

    if (levelNumber === 1) {
        evolution.stabilityFins = true;
        evolutionPoints += 1;
    }

    if (levelNumber === 2) {
        evolution.pulse = true;
        evolutionPoints += 2;
    }

    if (levelNumber === 3) {
        evolution.shield = true;
        evolution.memory = true;
        evolutionPoints += 3;
    }

    updateEvolutionDisplay();
    updateLevelButtons();
    saveGame();

    alert(`Level ${levelNumber} complete! Evolution unlocked.`);
}

function startGravityLevel(levelNumber) {
    currentLevel = levelNumber;

    collectedLumens = 0;
    collectedNutrients = 0;
    collectedAncientCells = 0;

    renderLevel(levelNumber);
    spawnLarva();

    gravityNavRunning = true;
    requestAnimationFrame(updateLarvaPhysics);
}

function updateEvolutionDisplay() {
    const box = document.getElementById("gravity-evolution-display");
    if (!box) return;

    box.innerHTML = `
        <h3>Evolution</h3>
        <p>Points: ${evolutionPoints}</p>
        <ul>
            <li>Stability Fins: ${evolution.stabilityFins ? "✓" : "—"}</li>
            <li>Bioluminescent Pulse: ${evolution.pulse ? "✓" : "—"}</li>
            <li>Spore Shield: ${evolution.shield ? "✓" : "—"}</li>
            <li>Mycelial Memory: ${evolution.memory ? "✓" : "—"}</li>
        </ul>
    `;
}

function updateLevelButtons() {
    const buttons = document.querySelectorAll(".gn-level-btn");

    buttons.forEach(btn => {
        const level = parseInt(btn.dataset.level);

        if (level === 1) {
            btn.disabled = false;
        } else if (level === 2) {
            btn.disabled = !(evolution.stabilityFins);
        } else if (level === 3) {
            btn.disabled = !(evolution.pulse);
        }
    });
}

document.querySelectorAll(".gn-level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const level = parseInt(btn.dataset.level);
        startGravityLevel(level);
    });
});

const gravityResetBtn = document.getElementById("gravity-reset-save");
if (gravityResetBtn) {
    gravityResetBtn.addEventListener("click", () => {
        if (confirm("Reset all Gravity Navigation progress?")) {
            evolution = {
                stabilityFins: false,
                pulse: false,
                shield: false,
                memory: false
            };
            evolutionPoints = 0;
            saveGame();
            updateEvolutionDisplay();
            updateLevelButtons();
        }
    });
}

/* ============================
      SAVE / LOAD SYSTEM
============================ */

function saveGame() {
    const saveData = {
        colonials,
        buildings: buildings.map(b => ({
            id: b.id,
            owned: b.owned,
            cost: b.cost,
            multiplier: b.multiplier
        })),
        boosts: boosts.map(u => ({
            id: u.id,
            bought: u.bought
        })),
        qEssence,
        qUpgrades: qUpgrades.map(u => ({
            id: u.id,
            bought: u.bought
        })),
        archaeotechPermanent,
        burrow: saveBurrowData(),
        gravityNav: {
            evolution,
            evolutionPoints
        }
    };

    localStorage.setItem("colonialClickerSave", JSON.stringify(saveData));
}

function loadGame() {
    const raw = localStorage.getItem("colonialClickerSave");
    if (!raw) return;

    try {
        const data = JSON.parse(raw);

        colonials = data.colonials ?? 0;

        data.buildings?.forEach(saved => {
            const b = buildings.find(x => x.id === saved.id);
            if (b) {
                b.owned = saved.owned;
                b.cost = saved.cost;
                b.multiplier = saved.multiplier;
            }
        });

        data.boosts?.forEach(saved => {
            const u = boosts.find(x => x.id === saved.id);
            if (u) u.bought = saved.bought;
        });

        qEssence = data.qEssence ?? 0;
        data.qUpgrades?.forEach(saved => {
            const u = qUpgrades.find(x => x.id === saved.id);
            if (u) u.bought = saved.bought;
        });

        if (data.archaeotechPermanent) {
            archaeotechPermanent = {
                cpsPercent: data.archaeotechPermanent.cpsPercent || 0,
                clickPercent: data.archaeotechPermanent.clickPercent || 0,
                goldenDurationPercent: data.archaeotechPermanent.goldenDurationPercent || 0,
                branchPercent: data.archaeotechPermanent.branchPercent || 0
            };
        }

        if (data.burrow) {
            loadBurrowData(data.burrow);
        }

        if (data.gravityNav) {
            evolution = data.gravityNav.evolution || evolution;
            evolutionPoints = data.gravityNav.evolutionPoints || 0;
        }

    } catch (e) {
        console.error("Save file corrupted:", e);
    }
}

/* MANUAL RESET */
const resetBtn = document.getElementById("reset-btn");
if (resetBtn) {
    resetBtn.onclick = () => {
        if (confirm("Are you sure you want to reset your progress? (This does NOT reset Q‑Essence or Archaeotech permanent relics.)")) {
            colonials = 0;
            buildings.forEach(b => {
                b.owned = 0;
                b.cost = b.baseCost;
                b.multiplier = 1;
            });
            boosts.forEach(u => u.bought = false);

            eventMultiplier = 1;
            goldenCpsMultiplier = 1;
            wormEventMultiplier = 1;
            clickEventMultiplier = 1;
            tempCpsMultiplier = 1;
            tempClickMultiplier = 1;
            tempGoldenFreqFactor = 1;

            saveGame();
            renderBuildings();
            renderBoosts();
            updateDisplay();
        }
    };
}

/* ============================
      GAME INITIALIZATION
============================ */

function initGame() {
    loadGame();
    renderBuildings();
    renderBoosts();
    updateDisplay();
    renderQTree();
    scheduleGoldenEvents();
    initWormWeb();
    initBurrowNetwork();
    updateEvolutionDisplay();
    updateLevelButtons();
}

window.onload = initGame;
