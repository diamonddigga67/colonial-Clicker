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
    let gain = clickPower * clickEventMultiplier;
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
            if (b.branch === "worm") branchMult *= wormBranchMultiplier * wormEventMultiplier;
            const base = b.baseCps * b.multiplier * b.owned * branchMult;
            total += base;
        }
    });

    total = Math.floor(total * imperialBonusMultiplier * eventMultiplier * goldenCpsMultiplier * qCpsBonus * snakeBonus);
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
    }, 10000);
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
    goldenCpsMultiplier = 6;
    setTimeout(() => {
        goldenCpsMultiplier = 1;
    }, 20000);
}

/* Genetic Bloom: +1% CPS per building owned for 30s */
function geneticBloom() {
    let totalOwned = 0;
    buildings.forEach(b => totalOwned += b.owned);
    const factor = 1 + totalOwned * 0.01;
    goldenCpsMultiplier = factor;
    setTimeout(() => {
        goldenCpsMultiplier = 1;
    }, 30000);
}

/* Cosmic Visitor: instant 10x CPS */
function cosmicVisitor() {
    colonials += getTotalCps() * 10;
    updateDisplay();
    saveGame();
}

/* Ophidian Blessing: 50x click power for 15s */
function ophidianBlessing() {
    clickEventMultiplier = 50;
    setTimeout(() => {
        clickEventMultiplier = 1;
    }, 15000);
}

/* Wormquake: Worm branch +1000% CPS (x11) for 20s */
function wormquake() {
    wormEventMultiplier = 11;
    setTimeout(() => {
        wormEventMultiplier = 1;
    }, 20000);
}

/* Q Glimpse: random one of the above */
function qGlimpse() {
    const events = [gravitySurge, geneticBloom, cosmicVisitor, ophidianBlessing, wormquake];
    const fn = events[Math.floor(Math.random() * events.length)];
    fn();
}

/* Schedule golden events every 60–120s */
function scheduleGoldenEvents() {
    let base = 60000 + Math.random() * 60000;
    if (isQBought("q_golden")) base *= 0.8; // +20% frequency
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
      MINIGAME PANELS (PLACEHOLDERS)
============================ */

const miniPanel = document.getElementById("minigame-panel");
const miniTitle = document.getElementById("minigame-title");
const miniContent = document.getElementById("minigame-content");
const qPanel = document.getElementById("qtree-panel");

document.getElementById("btn-archaeotech").onclick = () =>
    openMinigame("Archaeotech Lab",
        "Combine ancient relics to unlock permanent buffs. (Minigame placeholder — you can expand this later.)");

document.getElementById("btn-gravity").onclick = () =>
    openMinigame("Gravity Navigation",
        "Steer gravity waves to hit targets and gain temporary CPS boosts. (Placeholder.)");

document.getElementById("btn-burrow").onclick = () =>
    openMinigame("Burrow Network",
        "Connect tunnels between nodes to boost Worm branch production. (Placeholder.)");

document.getElementById("btn-neural").onclick = () =>
    openMinigame("Neural Web",
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

function openMinigame(title, text) {
    miniTitle.innerText = title;
    miniContent.innerHTML = `<p>${text}</p>`;
    miniPanel.classList.remove("hidden");
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
        }))
    };

    localStorage.setItem("colonialClickerSave", JSON.stringify(saveData));
}

function loadGame() {
    const raw = localStorage.getItem("colonialClickerSave");
    if (!raw) return;

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
        if (u) {
            u.bought = saved.bought;
        }
    });

    qEssence = data.qEssence ?? 0;
    data.qUpgrades?.forEach(saved => {
        const u = qUpgrades.find(x => x.id === saved.id);
        if (u) u.bought = saved.bought;
    });
}

/* MANUAL RESET */
document.getElementById("reset-btn").onclick = () => {
    if (confirm("Are you sure you want to reset your progress? (This does NOT reset Q‑Essence.)")) {
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
