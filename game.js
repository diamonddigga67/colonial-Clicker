let colonials = 0;
let cps = 0; // Colonials per second

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

document.getElementById("clicker").onclick = () => {
    colonials++;
    updateDisplay();
};

function updateDisplay() {
    document.getElementById("counter").innerText = `Colonials: ${colonials}`;
}

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

function buyUpgrade(i) {
    const u = upgrades[i];
    if (colonials >= u.cost) {
        colonials -= u.cost;
        cps += u.cps;
        updateDisplay();
    }
}

setInterval(() => {
    colonials += cps;
    updateDisplay();
}, 1000);

renderUpgrades();
