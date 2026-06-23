// Повністю чисті дані без жодних дефолтних класів (наприклад, без Klasse 5A)
let appData = JSON.parse(localStorage.getItem('teacherRandomizerData'));

if (!appData || !appData.profiles) {
    appData = {
        currentProfile: '', // Порожній поточний профіль
        profiles: {}        // Жодного класу в базі немає
    };
    localStorage.setItem('teacherRandomizerData', JSON.stringify(appData));
}

// DOM-Elemente
const profileSelect = document.getElementById('profile-select');
const newProfileInput = document.getElementById('new-profile-name');
const createProfileBtn = document.getElementById('create-profile-btn');
const nameInput = document.getElementById('name-input');
const addNameBtn = document.getElementById('add-name-btn');
const namesList = document.getElementById('names-list');
const groupSizeInput = document.getElementById('group-size');
const generateBtn = document.getElementById('generate-btn');

const massInput = document.getElementById('mass-input');
const importBtn = document.getElementById('import-btn');

const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const loaderScreen = document.getElementById('loader-screen');
const resultScreen = document.getElementById('result-screen');
const resultsGrid = document.getElementById('results-grid');
const closeOverlayBtn = document.getElementById('close-overlay-btn');

function saveData() {
    localStorage.setItem('teacherRandomizerData', JSON.stringify(appData));
}

function updateProfileDropdown() {
    profileSelect.innerHTML = '';
    Object.keys(appData.profiles).forEach(pName => {
        const option = document.createElement('option');
        option.value = pName;
        option.textContent = `📁 ${pName}`;
        if (pName === appData.currentProfile) option.selected = true;
        profileSelect.appendChild(option);
    });
}

// Schülerliste anzeigen
function renderNames() {
    namesList.innerHTML = '';
    
    // Перевірка: якщо немає активного класу або взагалі немає профілів
    if (!appData.currentProfile || !appData.profiles[appData.currentProfile]) {
        namesList.innerHTML = '<p class="hint">Erstellen Sie zuerst eine neue Klasse mit dem "+" Button oben rechts.</p>';
        return;
    }

    const currentStudents = appData.profiles[appData.currentProfile] || [];

    if (currentStudents.length === 0) {
    namesList.innerHTML = '<p class="hint">Die Liste ist leer. Bitte Namen oben eingeben oder einfügen.</p>';
    return;
}

    currentStudents.forEach((student, index) => {
        const card = document.createElement('div');
        card.className = `student-card ${student.present ? '' : 'absent'}`;
        
        card.innerHTML = `
            <span class="student-name">${student.name}</span>
            <button class="permanent-delete" title="Vollständig löschen">&times;</button>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('permanent-delete')) {
                appData.profiles[appData.currentProfile].splice(index, 1);
            } else {
                student.present = !student.present;
            }
            saveData();
            renderNames();
        });

        namesList.appendChild(card);
    });
}

// Funktion für Massenimport (z.B. 15 Namen auf einmal)
function importMassList() {
    const text = massInput.value.trim();
    if (!text) return;

    const rawNames = text.split(/[\n,]+/);
    const list = appData.profiles[appData.currentProfile];

    rawNames.forEach(rawName => {
        const name = rawName.trim();
        if (name && !list.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            list.push({ name: name, present: true });
        }
    });

    massInput.value = '';
    saveData();
    renderNames();
}

importBtn.addEventListener('click', importMassList);

// Einzelnen Schüler hinzufügen
function addStudent() {
    const name = nameInput.value.trim();
    if (!name) return;

    const list = appData.profiles[appData.currentProfile];
    if (list.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert('Dieser Name existiert bereits in der Liste!');
        return;
    }

    list.push({ name: name, present: true });
    nameInput.value = '';
    saveData();
    renderNames();
}

addNameBtn.addEventListener('click', addStudent);
nameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addStudent(); });

// Neues Profil (Klasse) erstellen
createProfileBtn.addEventListener('click', () => {
    const pName = newProfileInput.value.trim();
    if (!pName) return;
    if (appData.profiles[pName]) { alert('Diese Klasse existiert bereits!'); return; }

    appData.profiles[pName] = [];
    appData.currentProfile = pName;
    newProfileInput.value = '';
    saveData();
    updateProfileDropdown();
    renderNames();
});

profileSelect.addEventListener('change', (e) => {
    appData.currentProfile = e.target.value;
    saveData();
    renderNames();
});

// ZUFALLSLOGIK & ANIMATION (VOLLBILD)
generateBtn.addEventListener('click', () => {
    const activeStudents = appData.profiles[appData.currentProfile]
        .filter(s => s.present)
        .map(s => s.name);

    const size = parseInt(groupSizeInput.value);

    if (activeStudents.length === 0) {
    alert('Es gibt keine anwesenden Teilnehmer für die Einteilung!');
    return;
}
    if (isNaN(size) || size < 1) {
        alert('Bitte geben Sie eine gültige Gruppengröße ein!');
        return;
    }

    // 1. Overlay anzeigen und Animation starten
    fullscreenOverlay.classList.remove('hidden');
    loaderScreen.classList.remove('hidden');
    resultScreen.classList.add('hidden');

    // Fisher-Yates Shuffle (Zufallsmix)
    for (let i = activeStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeStudents[i], activeStudents[j]] = [activeStudents[j], activeStudents[i]];
    }

    // 2. Timer für 1.5 Sekunden (1500ms)
    setTimeout(() => {
        resultsGrid.innerHTML = '';
        let groupIndex = 1;

        for (let i = 0; i < activeStudents.length; i += size) {
            const groupChunk = activeStudents.slice(i, i + size);

            const card = document.createElement('div');
            card.className = 'group-giant-card';
            
            // HTML-Struktur für Namen untereinander (Spalte)
            let namesHTML = '<div class="group-names-list">';
            groupChunk.forEach(name => {
                namesHTML += `<div class="group-student-name">${name}</div>`;
            });
            namesHTML += '</div>';

            card.innerHTML = `
                <h3>Gruppe ${groupIndex}</h3>
                ${namesHTML}
            `;
            resultsGrid.appendChild(card);
            groupIndex++;
        }

        // Loader ausblenden, Ergebnisse einblenden
        loaderScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    }, 1500);
});

// Schließen des Overlays
closeOverlayBtn.addEventListener('click', () => {
    fullscreenOverlay.classList.add('hidden');
});

// System starten
updateProfileDropdown();
renderNames();