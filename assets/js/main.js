const sentences = [
    "Typing quickly and accurately is a valuable skill that can save time and improve productivity. By practicing regularly, you can increase your speed, reduce errors, and develop better focus."
];

// const sentences = [
//     "Try only",
// ]

const form = document.getElementById("gameForm");
const nameSection = document.getElementById("name-section");
const gameSection = document.getElementById("game-section");
const sentenceEl = document.getElementById("sentence");
const progressEl = document.getElementById("progress");
const rankEl = document.getElementById("rank");

const leaderboardSection = document.getElementById("leaderboard-section"); // NEW
const leaderboardBody = document.getElementById("leaderboard-body"); // NEW

let sentence = "";
let currentIndex = 0;
let startTime;
let timerInterval;
let typedChars = [];

form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Assuming you have an input with id="playerName"
    playerName = document.getElementById("playerName").value.trim() || "Anonymous"; // NEW

    nameSection.classList.add("d-none");
    gameSection.classList.remove("d-none");

    sentence = sentences[0];
    currentIndex = 0;
    startTime = null;
    typedChars = [];
    clearInterval(timerInterval);
    renderSentence();
    document.addEventListener("keydown", handleTyping);
});

function renderSentence() {
    let html = "";
    for (let i = 0; i < sentence.length; i++) {
        if (i < typedChars.length) {
            if (typedChars[i] === sentence[i]) {
                html += `<span class="correct">${sentence[i]}</span>`;
            } else {
                html += `<span class="incorrect">${sentence[i]}</span>`;
            }
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

    const progressCount = Math.min(typedChars.length, sentence.length);
    progressEl.textContent = `${progressCount}/${sentence.length}`;
}

function handleTyping(e) {
    if (!startTime) {
        startTime = Date.now();

        const timeEl = document.getElementById("time");
        if (timeEl) timeEl.classList.remove("d-none");

        const updateTime = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const min = Math.floor(elapsed / 60);
            const sec = elapsed % 60;
            if (timeEl) timeEl.textContent = `${min}:${sec.toString().padStart(2, "0")}`;
        };

        updateTime();
        timerInterval = setInterval(updateTime, 1000);
    }

    if (e.key === "Backspace") {
        if (typedChars.length > 0) {
            typedChars.pop();
            currentIndex = Math.max(0, currentIndex - 1);
            renderSentence();
        }
        return;
    }

    if (e.key.length !== 1) return;

    if (typedChars.length >= sentence.length) return;

    typedChars.push(e.key);
    currentIndex++;

    renderSentence();

    if (typedChars.length === sentence.length) {
        endGame();
    }
}

function endGame() {
    clearInterval(timerInterval);
    const timeTakenSec = startTime ? ((Date.now() - startTime) / 1000) : 0;
    const timeTaken = Number(timeTakenSec.toFixed(2));

    // Count errors
    let errors = 0;
    for (let i = 0; i < sentence.length; i++) {
        if (typedChars[i] !== sentence[i]) errors++;
    }

    // Calculate WPM
    const wordsCount = sentence.trim().length === 0 ? 0 : sentence.trim().split(/\s+/).length;
    const minutes = timeTakenSec / 60;
    let wpm = minutes > 0 ? Number((wordsCount / minutes).toFixed(2)) : 0;
    wpm = Math.min(wpm, 100);

    // Save temporary entry to compute rank
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    const newEntry = { name: playerName, time: timeTaken, wpm, errors, text: sentence };
    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => a.time - b.time);

    // Rank is index + 1
    const rank = leaderboard.findIndex(entry =>
        entry.name === playerName &&
        entry.time === timeTaken &&
        entry.wpm === wpm &&
        entry.errors === errors
    ) + 1;

    // Save updated leaderboard (top 10)
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));


    // Show summary with rank
    progressEl.innerHTML = `Completed in ${timeTaken}s <br> Congratulations! You ranked #${rank}`;
    rankEl.textContent = ``;
    document.removeEventListener("keydown", handleTyping);

    showLeaderboard();
}


// Save result to localStorage (store numbers + the sentence text)
function saveToLeaderboard(name, time, wpm, errors, text) {
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    leaderboard.push({
        name: name || "Anonymous",
        time: Number(time),
        wpm: Number(wpm),
        errors: Number(errors),
        text: text || ""
    });

    // Sort by fastest time (change if you prefer sorting by WPM)
    leaderboard.sort((a, b) => a.time - b.time);

    // Keep some reasonable number in storage (you only show top 5)
    leaderboard = leaderboard.slice(0, 20);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
    const timeClass = document.getElementById("time");
    timeClass.classList.add("d-none");

    const sentenceClass = document.getElementById("sentence");
    sentenceClass.classList.add("d-none");

    const imgCat = document.getElementById("img-cat");
    imgCat.classList.remove("d-none");

    leaderboardBody.innerHTML = "";
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

    // Upgrade old entries to include wpm/errors if missing
    leaderboard = leaderboard.map(entry => {
        if (!entry.text) return entry;

        // Compute errors if missing
        if (typeof entry.errors !== "number") {
            let errors = 0;
            for (let i = 0; i < entry.text.length; i++) {
                if (!entry.typed || entry.typed[i] !== entry.text[i]) errors++;
            }
            entry.errors = errors;
        }

        // Compute wpm if missing
        if (typeof entry.wpm !== "number" && entry.time) {
            const words = entry.text.trim().length === 0 ? 0 : entry.text.trim().split(/\s+/).length;
            const minutes = entry.time / 60;
            entry.wpm = minutes > 0 ? Number((words / minutes).toFixed(2)) : 0;
        }

        return entry;
    });

    leaderboard.sort((a, b) => a.time - b.time);
    leaderboard = leaderboard.slice(0, 5);

    const rows = leaderboard.map((entry, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry.name}</td>
                    <td>${entry.time.toFixed(2)}</td>
                    <td>${entry.wpm ?? "—"}</td>
                    <td>${entry.errors ?? "—"}</td>
                </tr>
                
            `).join("");

    leaderboardBody.innerHTML = rows;
    leaderboardSection.classList.remove("d-none");
}


// small helper to avoid HTML injection in names
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
