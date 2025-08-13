const sentences = [
    "typing quickly and accurately is a valuable skill that can save time and improve productivity by practicing regularly you can increase your speed reduce errors and develop better focus good posture proper hand placement and staying relaxed while typing are all important habits to maintain whether you are writing emails coding or creating reports efficient typing can make your work more enjoyable and less stressful",

    "the internet has revolutionized the way we communicate learn and work information is now available at our fingertips allowing us to explore topics in depth without leaving our homes however this convenience also comes with challenges such as the spread of misinformation and the need for digital literacy by staying critical and verifying sources we can make better use of this powerful tool",

    "healthy living is more than just eating nutritious foods and exercising regularly it also involves getting enough sleep managing stress and building strong social connections small daily habits like staying hydrated and taking short breaks during work can greatly improve your well being over time consistency is key to creating a sustainable healthy lifestyle",

    "traveling to new places can open your mind to different cultures and ways of life it allows you to see the world from new perspectives experience unique traditions and try unfamiliar foods even short trips can provide valuable memories and lessons whether you travel far or near the experiences can shape your worldview in meaningful ways",

    "learning a new skill takes time patience and practice at first progress may feel slow but each small step builds a foundation for greater understanding setting realistic goals and celebrating milestones can keep motivation high over time persistence pays off and what once felt challenging becomes second nature"
];

const form = document.getElementById("gameForm");
const nameSection = document.getElementById("name-section");
const gameSection = document.getElementById("game-section");
const sentenceEl = document.getElementById("sentence");
const progressEl = document.getElementById("progress");
const rankEl = document.getElementById("rank");
const navbar = document.getElementById("navbar-nav");
const restartBtn = document.getElementById("restartBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");


const leaderboardSection = document.getElementById("leaderboard-section");
const leaderboardBody = document.getElementById("leaderboard-body");

let sentence = "";
let currentIndex = 0;
let startTime;
let timerInterval;
let typedChars = [];
let countdown = 3;
let playerName = "";

// Calculate WPM/Accuracy like Monkeytype
function calculateWPM(typedChars, sentence, elapsedTimeSec) {
    const minutes = elapsedTimeSec / 60;

    // Raw WPM = total typed characters / 5
    const rawWPM = minutes > 0 ? (typedChars.length / 5) / minutes : 0;

    // Net WPM = correct characters / 5
    let correctChars = 0;
    for (let i = 0; i < typedChars.length && i < sentence.length; i++) {
        if (typedChars[i] === sentence[i]) correctChars++;
    }
    const netWPM = minutes > 0 ? (correctChars / 5) / minutes : 0;

    const accuracy = typedChars.length > 0
        ? (correctChars / typedChars.length) * 100
        : 0;

    return {
        rawWPM: Number(rawWPM.toFixed(2)),
        netWPM: Number(netWPM.toFixed(2)),
        accuracy: Number(accuracy.toFixed(2))
    };
}

function resetGame() {
    // Reset variables
    currentIndex = 0;
    typedChars = [];
    countdown = 3;
    clearInterval(timerInterval);
    startTime = null;

    // Hide leaderboard and other UI elements
    leaderboardSection.classList.add("d-none");
    sentenceEl.classList.remove("d-none");
    document.getElementById("time").classList.add("d-none");
    restartBtn.classList.add("d-none");
    tryAgainBtn.classList.add("d-none");
    navbar.classList.add("d-none");
    progressEl.textContent = "";
    const imgCat = document.getElementById("img-cat");
    imgCat.classList.add("d-none");

    // Rebuild a new sentence and render it
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    sentence = shuffled.join(" ");
    renderSentence();

    // Re-add the typing event listener
    document.addEventListener("keydown", handleTyping);
}

// Attach the same function to both buttons
restartBtn.addEventListener("click", resetGame);
tryAgainBtn.addEventListener("click", resetGame);

form.addEventListener("submit", function (e) {
    e.preventDefault();

    playerName = document.getElementById("playerName").value.trim() || "Anonymous";

    nameSection.classList.add("d-none");
    gameSection.classList.remove("d-none");

    // Pick a long sentence by combining several from the list
    const shuffled = [...sentences].sort(() => Math.random() - 0.5); // shuffle
    sentence = shuffled.join(" "); // join all into one long text

    currentIndex = 0;
    startTime = null;
    typedChars = [];
    countdown = 3;
    clearInterval(timerInterval);
    renderSentence();
    document.addEventListener("keydown", handleTyping);
});

function renderSentence() {
    let html = "";
    for (let i = 0; i < sentence.length; i++) {
        if (i < typedChars.length) {
            html += typedChars[i] === sentence[i]
                ? `<span class="correct">${sentence[i]}</span>`
                : `<span class="incorrect">${sentence[i]}</span>`;
        } else if (i === typedChars.length) {
            html += `<span class="current">${sentence[i]}</span>`;
        } else {
            html += `<span class="remaining">${sentence[i]}</span>`;
        }
    }

    sentenceEl.innerHTML = `<div id="sentence-inner">${html}</div>`;
    const inner = document.getElementById("sentence-inner");

    const currentCharEl = inner.querySelector(".current") || inner.lastElementChild;
    if (currentCharEl) {
        const containerTop = sentenceEl.getBoundingClientRect().top;
        const currentTop = currentCharEl.getBoundingClientRect().top;
        const lineHeightPx = parseFloat(getComputedStyle(sentenceEl).lineHeight) || 24;
        const currentLine = Math.floor((currentTop - containerTop) / lineHeightPx);

        let shiftLines = 0;
        if (currentLine >= 2) {
            shiftLines = currentLine - 1;
        }
        inner.style.transform = `translateY(${-shiftLines * lineHeightPx}px)`;
    } else {
        inner.style.transform = "";
    }
}

function handleTyping(e) {
    if (!startTime) {
        startTime = Date.now();
        navbar.classList.add("d-none");

        const restartBtn = document.getElementById("restartBtn");
        restartBtn.classList.remove("d-none");

        const timeEl = document.getElementById("time");
        if (timeEl) timeEl.classList.remove("d-none");

        const updateTime = () => {
            countdown--;
            const min = Math.floor(countdown / 60);
            const sec = countdown % 60;
            if (timeEl) timeEl.textContent = `${min}:${sec.toString().padStart(2, "0")}`;

            if (countdown <= 0) {
                endGame(true);
            }
        };

        updateTime();
        timerInterval = setInterval(updateTime, 1000);
    }

    if (countdown <= 0) return;

    if (e.key === "Backspace") {
        if (typedChars.length > 0) {
            typedChars.pop();
            currentIndex = Math.max(0, currentIndex - 1);
            renderSentence();
        }
    } else if (e.key.length === 1) {
        typedChars.push(e.key);
        currentIndex++;
        renderSentence();
    }

    // Live stats update
    if (startTime) {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const { rawWPM, netWPM, accuracy } = calculateWPM(typedChars, sentence, elapsedSec);
        progressEl.textContent = `Raw: ${rawWPM} | Net: ${netWPM} | Acc: ${accuracy}%`;
    }
}

function endGame(timerExpired = false) {
    clearInterval(timerInterval);
    const elapsedSec = startTime ? ((Date.now() - startTime) / 1000) : 0;
    const timeTaken = timerExpired ? 60 : Number(elapsedSec.toFixed(2));

    const { rawWPM, netWPM, accuracy } = calculateWPM(typedChars, sentence, timeTaken);

    let errors = 0;
    for (let i = 0; i < typedChars.length && i < sentence.length; i++) {
        if (typedChars[i] !== sentence[i]) errors++;
    }

    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    const newEntry = {
        name: playerName,
        time: timeTaken,
        wpm: netWPM,
        rawWPM,
        accuracy,
        errors,
        text: sentence
    };
    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.wpm - a.wpm);

    const rank = leaderboard.findIndex(entry =>
        entry.name === playerName &&
        entry.time === timeTaken &&
        entry.wpm === netWPM
    ) + 1;

    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

    progressEl.innerHTML = timerExpired
        ? `Time's up!<br>${rank <= 10 ? `Congratulations! You ranked #${rank}` : `You ranked below 10`}`
        : `Completed in ${timeTaken}s<br>Net WPM: ${netWPM}<br>${rank <= 10 ? `Rank: #${rank}` : `You ranked below 10`}`;

    rankEl.textContent = ``;
    document.removeEventListener("keydown", handleTyping);
    showLeaderboard();
}

function showLeaderboard() {
    const timeClass = document.getElementById("time");
    timeClass.classList.add("d-none");
    restartBtn.classList.add("d-none");
    tryAgainBtn.classList.remove("d-none");

    navbar.classList.remove("d-none");

    const sentenceClass = document.getElementById("sentence");
    sentenceClass.classList.add("d-none");

    const imgCat = document.getElementById("img-cat");
    imgCat.classList.remove("d-none");

    leaderboardBody.innerHTML = "";
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

    leaderboard.sort((a, b) => b.wpm - a.wpm);
    leaderboard = leaderboard.slice(0, 5);

    const rows = leaderboard.map((entry, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.time.toFixed(2)}</td>
            <td>${entry.wpm}</td>
            <td>${entry.errors}</td>
        </tr>
    `).join("");

    leaderboardBody.innerHTML = rows;
    leaderboardSection.classList.remove("d-none");
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
