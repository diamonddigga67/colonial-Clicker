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
    if (endBtn) endBtn.addEventListener("click", endBurrowRun);

    if (gridEl) {
        gridEl.addEventListener("click", onBurrowGridClick);
    }

    if (buildMenu) {
        buildMenu.addEventListener("click", onBurrowBuildMenuClick);
    }

    // Close popup when clicking outside
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

/* Run lifecycle */

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

/* Grid generation */

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

    // Randomly seed hidden special tiles
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

    // All others remain "hidden" but will reveal as dirt
    return grid;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/* Rendering */

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
                    label = "";
                    break;
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

/* Click handling */

function onBurrowGridClick(e) {
    if (!burrowGame.inRun) return;
    const tileEl = e.target.closest(".burrow-tile");
    if (!tileEl) return;

    const x = parseInt(tileEl.dataset.x, 10);
    const y = parseInt(tileEl.dataset.y, 10);
    const tile = burrowGame.grid[y][x];

    if (!tile) return;

    // Each action costs 1 worm
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

    // Reveal tile
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
        // Turn it into dirt for further expansion
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

/* Build menu */

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
        burrowGame.baseWorms += 0; // permanent handled separately if you want
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

/* Rewards */

function applyBurrowRewards() {
    const gained = burrowGame.totalResourcesThisRun;

    if (gained <= 0) {
        setBurrowStatus("The burrow yields nothing this time.");
        return;
    }

    // Temporary worm CPS boost
    const duration = 30000;
    const boost = 2;
    setBurrowStatus(`Burrow yields ${gained} resources. Worm CPS x${boost} for 30s.`);
    burrowApplyTemporaryWormBoost(boost, duration);

    // Small permanent bonus
    const permGain = Math.min(3, gained);
    burrowGame.permBonusPercent += permGain;
    applyBurrowPermanentBonus();
}

function burrowApplyTemporaryWormBoost(multiplier, duration) {
    // Reuse wormEventMultiplier if you already have it
    if (typeof wormEventMultiplier === "undefined") return;
    wormEventMultiplier *= multiplier;
    setTimeout(() => {
        wormEventMultiplier /= multiplier;
    }, duration);
}

function applyBurrowPermanentBonus() {
    // Hook this into your worm branch CPS calculation
    // Example: store in a global used in getWormCps()
    // Here we just keep it on burrowGame.permBonusPercent
}

/* Q‑Essence hook (optional) */

function grantBurrowQEssence(amount) {
    if (typeof qEssence !== "undefined") {
        qEssence += amount;
        updateDisplay && updateDisplay();
    }
}

/* UI helpers */

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

/* Save / load hooks */

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

/* Q‑Essence / Q‑Tree */
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

    // Quantum Pilgrims: 10% chance for 10x click (+5% if Q_crit)
    const quantum = getBuilding("quantum");
    let critChance = 0.10;
    if (isQBought("q_crit")) critChance += 0.05;

    if (quantum && quantum.owned > 0) {
        if (Math.random() < critChance) {
            gain *= 10;
            isCrit = true;
        }
    }

    // Ascended Touch
    if (isQBought("q_click")) gain *= 3;

    // Psionic Ophidians: extra CPS-based click gain (1x CPS)
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
    msg.innerText = text;
    msg.style.opacity = 1;

    setTimeout(() => {
        msg.style.opacity = 0;
    }, 1800);
}

/* BUILDINGS (EVOLUTIONS) */
const buildings = [
    // TIER 1
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

    // TIER 2
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

    // TIER 3
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

    // TIER 4 (SPECIAL ABILITIES)
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

/* HELPERS */
function getBuilding(id) {
    return buildings.find(b => b.id === id);
}

/* TOTAL CPS CALCULATION */
function getTotalCps() {
    let total = 0;

    // Worm branch multiplier from Subterranean Empires (+50%)
    const subterranean = getBuilding("subterranean");
    wormBranchMultiplier = (subterranean && subterranean.owned > 0) ? 1.5 : 1;

    // Imperial Serpents global bonus (+5% per)
    const imperial = getBuilding("imperial");
    imperialBonusMultiplier = imperial ? (1 + 0.05 * imperial.owned) : 1;

    let qCpsBonus = 1;
    let snakeBonus = 1;

    // Gravitic Overcharge
    if (isQBought("q_cps")) qCpsBonus *= 1.10;

    // Serpent Dominion
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

/* UPDATE DISPLAY + CLICK POWER SCALING */
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

/* RENDER BUILDINGS */
function renderBuildings() {
    const container = document.getElementById("buildings");
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

/* BUY BUILDING */
function buyBuilding(i) {
    const b = buildings[i];

    if (colonials >= b.cost) {
        colonials -= b.cost;
        b.owned++;

        // Price increases by 25% each purchase
        b.cost = Math.floor(b.baseCost * Math.pow(1.25, b.owned));

        updateDisplay();
        renderBuildings();
        renderBoosts();
        saveGame();
    }
}

/* RENDER BOOSTS */
function renderBoosts() {
    const container = document.getElementById("boosts");
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

/* BUY BOOST */
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

/* Voidborne Colonials: Gravity Well (every 10s, +15x CPS burst) */
setInterval(() => {
    const voidborne = getBuilding("voidborne");
    if (voidborne && voidborne.owned > 0) {
        colonials += getTotalCps() * 15;
        updateDisplay();
        saveGame();
    }
}, 10000);

/* Planet-Eaters: Consumption Cycle (every 30s, CPS x4 for 10s) */
setInterval(() => {
    const planetEaters = getBuilding("planetEaters");
    if (planetEaters && planetEaters.owned > 0) {
        eventMultiplier = 4;
        setTimeout(() => {
            eventMultiplier = 1;
        }, 10000);
    }
}, 30000);

/* AUTO-GENERATE COLONIALS */
setInterval(() => {
    colonials += getTotalCps();
    updateDisplay();
    saveGame();
}, 1000);

/* ============================
      GOLDEN EVENTS SYSTEM
============================ */
/* ============================
      GOLDEN EVENTS SYSTEM
============================ */

function showGoldenMessage(text) {
    const msg = document.getElementById("golden-message");
    msg.innerText = text;
    msg.style.opacity = 1;

    setTimeout(() => {
        msg.style.opacity = 0;
    }, 1800);
}

function spawnGoldenEvent() {
    const layer = document.getElementById("event-layer");
    if (!layer) return;

    // Avoid multiple at once
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

/* Gravity Surge: +500% CPS (x6) for 20s */
function gravitySurge() {
    showGoldenMessage("Gravity Surge! +500% CPS for 20s");
    goldenCpsMultiplier = 6;
    setTimeout(() => {
        goldenCpsMultiplier = 1;
    }, 20000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

/* Genetic Bloom: +1% CPS per building owned for 30s */
function geneticBloom() {
    let totalOwned = 0;
    buildings.forEach(b => totalOwned += b.owned);

    showGoldenMessage(`Genetic Bloom! +${Math.floor(totalOwned)}% CPS for 30s`);

    goldenCpsMultiplier = 1 + totalOwned * 0.01;
    setTimeout(() => {
        goldenCpsMultiplier = 1;
    }, 30000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

/* Cosmic Visitor: instant 10x CPS */
function cosmicVisitor() {
    showGoldenMessage("Cosmic Visitor! Instant 10× CPS");
    colonials += getTotalCps() * 10;
    updateDisplay();
    saveGame();
}

/* Ophidian Blessing: 50x click power for 15s */
function ophidianBlessing() {
    showGoldenMessage("Ophidian Blessing! 50× click power for 15s");
    clickEventMultiplier = 50;
    setTimeout(() => {
        clickEventMultiplier = 1;
    }, 15000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

/* Wormquake: Worm branch +1000% CPS (x11) for 20s */
function wormquake() {
    showGoldenMessage("Wormquake! Worm CPS massively boosted");
    wormEventMultiplier = 11;
    setTimeout(() => {
        wormEventMultiplier = 1;
    }, 20000 * (1 + archaeotechPermanent.goldenDurationPercent / 100));
}

/* Q Glimpse: random one of the above */
function qGlimpse() {
    showGoldenMessage("Q Glimpse! Reality shifts…");
    const events = [gravitySurge, geneticBloom, cosmicVisitor, ophidianBlessing, wormquake];
    const fn = events[Math.floor(Math.random() * events.length)];
    fn();
}

/* Schedule golden events every 60–120s */
function scheduleGoldenEvents() {
    let base = 60000 + Math.random() * 60000;

    if (isQBought("q_golden")) base *= 0.8; // +20% frequency
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
    // Simple log-based formula
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

    // Reset run state
    colonials = 0;
    buildings.forEach(b => {
        b.owned = 0;
        b.cost = b.baseCost;
        b.multiplier = 1;
    });
    boosts.forEach(u => u.bought = false);

    // Clear temporary multipliers
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
    if (!circle) return;

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
      MINIGAME PANELS
============================ */

const miniPanel = document.getElementById("minigame-panel");
const miniTitle = document.getElementById("minigame-title");
const miniContent = document.getElementById("minigame-content");
const qPanel = document.getElementById("qtree-panel");

document.getElementById("btn-archaeotech").onclick = () => openArchaeotechLab();

document.getElementById("btn-gravity").onclick = () =>
    openSimpleMinigame("Gravity Navigation",
        "Steer gravity waves to hit targets and gain temporary CPS boosts. (Placeholder.)");

document.getElementById("btn-burrow").onclick = () =>
    openSimpleMinigame("Burrow Network",
        "Connect tunnels between nodes to boost Worm branch production. (Placeholder.)");

document.getElementById("btn-neural").onclick = () =>
    openSimpleMinigame("Neural Web",
        "Link neurons into circuits for psionic bonuses. (Placeholder.)");

document.getElementById("btn-qtree").onclick = () => {
    qPanel.classList.remove("hidden");
    renderQTree();
};

document.getElementById("close-minigame").onclick = () =>
    miniPanel.classList.add("hidden");

document.getElementById("close-qtree").onclick = () =>
    qPanel.classList.add("hidden");

document.getElementById("ascend-btn").onclick = ascend;

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

    // Balanced distribution: 40% empty, 25% relic, 15% hazard, 10% core, 5% rare, 5% cache
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

    // Place player on a safe tile
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

            let symbol = "";
            if (tile.revealed) {
                if (tile.type === "empty") symbol = "";
                if (tile.type === "relic") symbol = "R";
                if (tile.type === "hazard") symbol = "!";
                if (tile.type === "core") symbol = "C";
                if (tile.type === "rare") symbol = "★";
                if (tile.type === "cache") symbol = "?";
            }

            html += `<div class="${classes.join(" ")}"></div>`;
        }
    }

    html += `</div>`;
    miniContent.innerHTML = html;

    // Add tooltips after DOM insert
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
        // CPS boost
        tempCpsMultiplier *= 3;
        setTimeout(() => {
            tempCpsMultiplier /= 3;
        }, 30000);
    } else if (roll < 0.66) {
        // Click boost
        tempClickMultiplier *= 1.5;
        setTimeout(() => {
            tempClickMultiplier /= 1.5;
        }, 60000);
    } else {
        // Golden frequency
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
        // Legendary: big Q‑Essence + permanent buff
        const gained = 5 + Math.floor(Math.random() * 6);
        qEssence += gained;
        archaeotechPermanent.cpsPercent += 2;
        archaeotechPermanent.clickPercent += 2;
        ruinState.message = `You discover a legendary artifact! +${gained} Q‑Essence and strong permanent boosts.`;
        renderQTree();
    }
}

/* ============================
      SAVE / LOAD SYSTEM
============================ */

function saveGame() {
    const saveData = {
        colonials: colonials,
        buildings: buildings.map(b => ({
            id: b.id,
            owned: b.owned,
            cost: b.cost,
            burrow: saveBurrowData(),
            multiplier: b.multiplier
        })),
        boosts: boosts.map(u => ({
            id: u.id,
            bought: u.bought
        })),
        qEssence: qEssence,
        qUpgrades: qUpgrades.map(u => ({
            id: u.id,
            bought: u.bought
        })),
        archaeotechPermanent: archaeotechPermanent
    };

    localStorage.setItem("colonialClickerSave", JSON.stringify(saveData));
}

function loadGame() {
    const raw = localStorage.getItem("colonialClickerSave");
    if (!raw) return;

    const data = JSON.parse(raw);

    if (data.burrow) loadBurrowData(data.burrow);

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
        if (u) {
            u.bought = saved.bought;
        }
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
}

/* MANUAL RESET */
document.getElementById("reset-btn").onclick = () => {
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

/* INITIALIZE */
loadGame();
renderBuildings();
renderBoosts();
updateDisplay();
renderQTree();
scheduleGoldenEvents();
