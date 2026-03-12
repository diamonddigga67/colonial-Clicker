let colonials = 0;
let cps = 0;

const colonialImg = document.getElementById("colonial-img");

/* CLICK HANDLER WITH FLOATING +1 */
colonialImg.onclick = (event) => {
    colonials++;
    updateDisplay();
    spawnFloat(event);
};

/* FLOATING +1 EFFECT */
function spawnFloat(event) {
    const container = document.getElementById("float-container");
    const float = document.createElement("div");
    float.className = "float";
    float.innerText = "+1";

    const rect = colonialImg.getBoundingClientRect();
    float.style.left = (event.clientX - rect.left) + "px";
    float.style.top = (event.clientY - rect.top) + "px";

    container.appendChild(float);
    setTimeout(() => float.remove(), 1000);
}

/* DISPLAY UPDATE */
function updateDisplay() {
    document.getElementById("counter").innerText = `Colonials: ${colonials}`;
    document.getElementById("cps-counter").innerText = `CPS: ${cps}`;
}

/* EVOLUTION TREE (UPGRADES) */
const upgrades = [
    {
        name: "Gravital Adaptation",
        baseCost: 50,
        cost: 50,
        cps: 1,
        bought: 0,
        description: "Colonials adapt to crushing gravity."
    },
    {
        name: "Worm Child Divergence",
        baseCost: 200,
        cost: 200,
        cps: 5,
        bought: 0,
        description: "A lineage collapses into burrowing specialists."
    },
    {
        name: "Snake People Evolution",
        baseCost: 1000,
        cost: 1000,
        cps: 20,
        bought: 0,
        description: "A serpentine future takes shape."
    },
    {
        name: "Q Interference",
        baseCost: 5000,
        cost: 5000,
        cps: 100,
        bought: 0,
        description: "A godlike species reshapes your destiny."
    }
];

/* RENDER UPGRADE LIST */
function renderUpgrades() {
    const container = document.getElementById("upgrades");
    container.innerHTML = "";

    upgrades.forEach((u, index) => {
        const div = document.createElement("div");
        div.className = "upgrade";
        div.innerHTML = `
            <h3>${u.name}</h3>
            <p>${u.description}</p>
            <p>Owned: ${u.bought}</p>
            <p>Cost: ${u.cost}</p>
            <button onclick="buyUpgrade(${index})">Evolve</button>
        `;
        container.appendChild(div);
    });
}

/* BUY UPGRADE */
function buyUpgrade(i) {
    const u = upgrades[i];

    if (colonials >= u.cost) {
        colonials -= u.cost;
        cps += u.cps;
        u.bought++;

        // Price increases by 20% each purchase
        u.cost = Math.floor(u.baseCost * Math.pow(1.2, u.bought));

        updateDisplay();
        renderUpgrades();
    }
}

/* AUTO-GENERATE COLONIALS */
setInterval(() => {
    colonials += cps;
    updateDisplay();
}, 1000);

renderUpgrades();
