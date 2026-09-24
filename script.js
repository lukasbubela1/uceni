const GITHUB_USER = "lukasbubela1";
const GITHUB_REPO = "uceni";

const SUBJECTS_FOLDER = "subjects";

const SUBJECTS = {
    CJL: "Český jazyk a literatura",
    ANJ: "Angličtina",
    DEJ: "Dějepis",
    FYZ: "Fyzika",
    CHE: "Chemie",
    ELO: "Ekologie",
    MAT: "Matematika",
    SAP: "Software a aplikace",
    TVY: "Technické vybavení",
    KYB: "Kybernetická bezpečnost",
    PVA: "Programování a vývoj aplikací",
    ELE: "Elektrotechnika",
    TEA: "Technika administrativy",
    PCV: "Prakt. cvičení I (HW + SW)"
};

let currentSubject = "";
let currentTopic = "";
let currentText = "";

let questions = [];
let currentQuestion = 0;
let score = 0;


/* VYTVÁŘENÍ PŘEDMĚTŮ */

function loadSubjects() {

    const container = document.getElementById("subjects");

    if (!container) {
        console.error("Element #subjects nebyl nalezen.");
        return;
    }

    container.innerHTML = "";

    for (const code in SUBJECTS) {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <span class="subject-code">${code}</span>
            <h3>${SUBJECTS[code]}</h3>
            <p>Otevřít předmět →</p>
        `;

        card.onclick = () => openSubject(code);

        container.appendChild(card);
    }
}


/* GITHUB */

async function github(path) {

    const url =
        `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `GitHub chyba ${response.status}: ${response.statusText}`
        );
    }

    return await response.json();
}


/* OTEVŘENÍ PŘEDMĚTU */

async function openSubject(subject) {

    currentSubject = subject;

    showScreen("topicsScreen");

    document.getElementById("subjectTitle").textContent =
        `${SUBJECTS[subject]} (${subject})`;

    const container = document.getElementById("topics");

    container.innerHTML =
        `<div class="loading">Načítám učivo...</div>`;

    try {

        const files =
            await github(`${SUBJECTS_FOLDER}/${subject}`);

        container.innerHTML = "";

        const textFiles = files.filter(file =>
            file.type === "file" &&
            file.name.toLowerCase().endsWith(".txt")
        );

        for (const file of textFiles) {

            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <h3>📖 ${formatName(file.name)}</h3>
                <p>Otevřít učivo →</p>
            `;

            card.onclick = () => openLesson(file);

            container.appendChild(card);
        }

        if (textFiles.length === 0) {

            container.innerHTML = `
                <div class="error">
                    V tomto předmětu zatím není žádný .txt soubor.
                </div>
            `;
        }

    } catch (error) {

        container.innerHTML = `
            <div class="error">
                ${error.message}
                <br><br>
                Zkontroluj, jestli na GitHubu existuje:
                <br>
                <code>subjects/${subject}/</code>
            </div>
        `;
    }
}


/* UČIVO */

async function openLesson(file) {

    currentTopic = file.name;

    showScreen("lessonScreen");

    document.getElementById("lessonTitle").textContent =
        formatName(file.name);

    document.getElementById("lessonText").textContent =
        "Načítám učivo...";

    try {

        const response = await fetch(file.download_url);

        currentText = await response.text();

        document.getElementById("lessonText").textContent =
            currentText;

    } catch (error) {

        document.getElementById("lessonText").textContent =
            "Nepodařilo se načíst učivo.";
    }
}


/* NAVIGACE */

function showScreen(id) {

    document.querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    document.getElementById(id)
        .classList.add("active");
}


function showSubjects() {
    showScreen("subjectsScreen");
    loadSubjects();
}


function backToTopics() {
    openSubject(currentSubject);
}


function backToLesson() {
    showScreen("lessonScreen");
}


/* POMOCNÉ FUNKCE */

function formatName(name) {

    return name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}


/* START */

loadSubjects();
