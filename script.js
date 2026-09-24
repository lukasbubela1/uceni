const GITHUB_USER = "lukasbubela1";
const GITHUB_REPO = "uceni";
const GITHUB_BRANCH = "main";

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


// ==============================
// NAČTENÍ PŘEDMĚTŮ
// ==============================

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

            <h3>
                ${SUBJECTS[code]}
            </h3>

            <p>
                Otevřít předmět →
            </p>
        `;

        card.onclick = () => openSubject(code);

        container.appendChild(card);
    }
}


// ==============================
// GITHUB API
// ==============================

async function github(path) {

    const url =
        `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;

    console.log("Načítám GitHub:", url);

    const response = await fetch(url);

    console.log(
        "GitHub status:",
        response.status,
        response.statusText
    );

    if (!response.ok) {

        const errorText = await response.text();

        console.error(
            "GitHub chyba:",
            errorText
        );

        throw new Error(
            `GitHub chyba ${response.status}: ${response.statusText}`
        );
    }

    return await response.json();
}


// ==============================
// OTEVŘENÍ PŘEDMĚTU
// ==============================

async function openSubject(subject) {

    currentSubject = subject;

    showScreen("topicsScreen");

    document.getElementById("subjectTitle").textContent =
        `${SUBJECTS[subject]} (${subject})`;

    const container =
        document.getElementById("topics");

    container.innerHTML =
        `<div class="loading">Načítám učivo...</div>`;

    try {

        const path =
            `${SUBJECTS_FOLDER}/${subject}`;

        console.log(
            "Načítám předmět:",
            path
        );

        const files =
            await github(path);

        console.log(
            "GitHub data:",
            files
        );

        container.innerHTML = "";

        if (!Array.isArray(files)) {

            throw new Error(
                "GitHub nevrátil seznam souborů."
            );
        }

        const textFiles =
            files.filter(file =>
                file.type === "file" &&
                file.name
                    .toLowerCase()
                    .endsWith(".txt")
            );

        console.log(
            "TXT soubory:",
            textFiles
        );

        for (const file of textFiles) {

            const card =
                document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <h3>
                    📖 ${formatName(file.name)}
                </h3>

                <p>
                    Otevřít učivo →
                </p>
            `;

            card.onclick =
                () => openLesson(file);

            container.appendChild(card);
        }

        if (textFiles.length === 0) {

            container.innerHTML = `
                <div class="error">
                    V tomto předmětu zatím není
                    žádný .txt soubor.
                </div>
            `;
        }

    } catch (error) {

        console.error(
            "Chyba při načítání předmětu:",
            error
        );

        container.innerHTML = `
            <div class="error">

                Nepodařilo se načíst učivo.

                <br><br>

                <b>Chyba:</b>
                ${escapeHTML(error.message)}

                <br><br>

                Kontrolovaná cesta:

                <br>

                <code>
                    subjects/${subject}
                </code>

            </div>
        `;
    }
}


// ==============================
// OTEVŘENÍ UČIVA
// ==============================

async function openLesson(file) {

    currentTopic = file.name;

    showScreen("lessonScreen");

    document.getElementById("lessonTitle")
        .textContent =
        formatName(file.name);

    document.getElementById("lessonText")
        .textContent =
        "Načítám učivo...";

    try {

        console.log(
            "Načítám soubor:",
            file.download_url
        );

        const response =
            await fetch(file.download_url);

        if (!response.ok) {

            throw new Error(
                `Nepodařilo se načíst soubor (${response.status})`
            );
        }

        currentText =
            await response.text();

        console.log(
            "Učivo načteno."
        );

        document.getElementById("lessonText")
            .textContent =
            currentText;

    } catch (error) {

        console.error(
            "Chyba při načítání učiva:",
            error
        );

        document.getElementById("lessonText")
            .textContent =
            "Nepodařilo se načíst učivo.";
    }
}


// ==============================
// VYTVOŘENÍ OTÁZEK
// ==============================

function generateQuestions(text) {

    const lines =
        text
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);

    const result = [];

    for (const line of lines) {

        if (!line.includes("|"))
            continue;

        const parts =
            line.split("|");

        const question =
            parts[0].trim();

        const answer =
            parts
                .slice(1)
                .join("|")
                .trim();

        if (question && answer) {

            result.push({
                question,
                answer
            });
        }
    }

    return result;
}


// ==============================
// SPUŠTĚNÍ KVÍZU
// ==============================

function startQuiz() {

    questions =
        generateQuestions(currentText);

    currentQuestion = 0;
    score = 0;

    showScreen("quizScreen");

    document.getElementById("quizTitle")
        .textContent =
        formatName(
            currentTopic.replace(
                /\.[^/.]+$/,
                ""
            )
        );

    document.getElementById("result")
        .innerHTML = "";

    if (questions.length === 0) {

        document.getElementById("quiz")
            .innerHTML = `

                <div class="error">

                    Z tohoto souboru se zatím
                    nepodařilo vytvořit otázky.

                    <br><br>

                    Použij formát:

                    <br><br>

                    <code>
                        Otázka | Odpověď
                    </code>

                    <br><br>

                    Například:

                    <br>

                    <code>
                        Co je bit? | Nejmenší jednotka informace.
                    </code>

                </div>

            `;

        return;
    }

    shuffle(questions);

    showQuestion();
}


// ==============================
// ZOBRAZENÍ OTÁZKY
// ==============================

function showQuestion() {

    const container =
        document.getElementById("quiz");

    if (currentQuestion >= questions.length) {

        finishQuiz();

        return;
    }

    const q =
        questions[currentQuestion];

    container.innerHTML = `

        <div class="question">

            <p style="
                color:#9da7c5;
                margin-bottom:10px;
            ">

                Otázka
                ${currentQuestion + 1}
                z
                ${questions.length}

            </p>

            <h3>
                ${escapeHTML(q.question)}
            </h3>

            <div style="margin-top:20px;">

                <input
                    id="answerInput"
                    type="text"
                    placeholder="Napiš odpověď..."
                    style="
                        width:100%;
                        padding:14px;
                        border-radius:9px;
                        border:1px solid #323d61;
                        background:#0b1020;
                        color:white;
                        font-size:16px;
                    "
                    onkeydown="
                        if(event.key === 'Enter')
                            checkAnswer()
                    "
                >

            </div>

            <button
                onclick="checkAnswer()"
                style="margin-top:15px;"
            >
                Zkontrolovat
            </button>

            <div
                id="feedback"
                style="margin-top:15px;"
            ></div>

        </div>

    `;

    document
        .getElementById("answerInput")
        .focus();
}


// ==============================
// KONTROLA ODPOVĚDI
// ==============================

function checkAnswer() {

    const input =
        document.getElementById("answerInput");

    const userAnswer =
        input.value
            .trim()
            .toLowerCase();

    const correctAnswer =
        questions[currentQuestion]
            .answer
            .trim()
            .toLowerCase();

    const feedback =
        document.getElementById("feedback");

    if (!userAnswer) {

        feedback.innerHTML = `

            <span style="color:#ffcc66;">
                Napiš nejdříve odpověď.
            </span>

        `;

        return;
    }

    const correctWords =
        correctAnswer
            .split(/\s+/)
            .filter(word =>
                word.length > 2
            );

    let matches = 0;

    for (const word of correctWords) {

        if (userAnswer.includes(word)) {
            matches++;
        }
    }

    const ratio =
        correctWords.length === 0
            ? 0
            : matches / correctWords.length;

    if (ratio >= 0.5) {

        score++;

        feedback.innerHTML = `

            <span style="color:#63d9a4;">
                ✓ Správně!
            </span>

        `;

    } else {

        feedback.innerHTML = `

            <span style="color:#ff7588;">
                ✗ Tohle není úplně správně.
            </span>

            <br><br>

            Správná odpověď:

            <b>
                ${escapeHTML(
                    questions[currentQuestion].answer
                )}
            </b>

        `;
    }

    input.disabled = true;

    setTimeout(() => {

        currentQuestion++;

        showQuestion();

    }, 1800);
}


// ==============================
// VÝSLEDEK
// ==============================

function finishQuiz() {

    document.getElementById("quiz")
        .innerHTML = "";

    const percentage =
        Math.round(
            (score / questions.length) * 100
        );

    document.getElementById("result")
        .innerHTML = `

        <div class="lesson">

            <div class="score">

                Výsledek:
                ${score}
                /
                ${questions.length}

            </div>

            <p style="
                color:#aeb7d0;
                margin-bottom:20px;
            ">

                Úspěšnost:
                ${percentage} %

            </p>

            <button
                onclick="startQuiz()"
            >
                🔄 Zkusit znovu
            </button>

            <button
                class="secondary"
                onclick="backToLesson()"
                style="margin-left:8px;"
            >
                📖 Zpět k učivu
            </button>

        </div>

    `;
}


// ==============================
// PŘEPÍNÁNÍ OBRAZOVEK
// ==============================

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.remove("active");

        });

    const screen =
        document.getElementById(id);

    if (!screen) {

        console.error(
            `Obrazovka #${id} nebyla nalezena.`
        );

        return;
    }

    screen.classList.add("active");
}


// ==============================
// NAVIGACE
// ==============================

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


// ==============================
// FORMÁTOVÁNÍ NÁZVŮ
// ==============================

function formatName(name) {

    return name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );
}


// ==============================
// ZAMÍCHÁNÍ OTÁZEK
// ==============================

function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];
    }

    return array;
}


// ==============================
// OCHRANA HTML
// ==============================

function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==============================
// START
// ==============================

loadSubjects();
