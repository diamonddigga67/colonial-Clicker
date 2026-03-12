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
}

/* UPGRADE DATA */
const upgrades = [
    {
        name: "Gravital Adaptation",
        cost: 50,
        cps: 1,
        description: "Your Colonials adapt to crushing gravity."
    },
    {
        name: "Worm Child Divergence",
        cost: 200,
        cps: 5,
        description: "A lineage collapses into burrowing specialists."
    },
    {
        name: "Snake People Evolution",
        cost: 1000,
        cps: 20,
        description: "A serpentine future takes shape."
    },
    {
        name: "Q Interference",
        cost: 5000,
        cps: 100,
        description: "A godlike species reshapes your destiny."
    }
];

/* RENDER UPGRADE LIST */
function renderUpgrades() {
    const container = document.getElementById("upgrades");
    upgrades.forEach((u, index) => {
        const div = document.createElement("div");
        div.className = "upgrade";
        div.innerHTML = `
            <h3>${u.name}</h3>
            <p>${u.description}</p>
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
        updateDisplay();
    }
}

/* AUTO-GENERATE COLONIALS */
setInterval(() => {
    colonials += cps;
    updateDisplay();
}, 1000);

renderUpgrades();
