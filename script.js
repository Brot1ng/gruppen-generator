
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

// Funktion für Massenimport 
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
let generatedGroups = [];

generateBtn.addEventListener('click', () => {
    let activeStudents = appData.profiles[appData.currentProfile]
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

 
    fullscreenOverlay.classList.remove('hidden');
    loaderScreen.classList.remove('hidden');
    resultScreen.classList.add('hidden');

    // Fisher-Yates Shuffle
    for (let i = activeStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeStudents[i], activeStudents[j]] = [activeStudents[j], activeStudents[i]];
    }

    // Таймер на 1.5 секунди
    setTimeout(() => {
        generatedGroups = []; // Очищаємо попередні групи

        // Замість створення HTML, спочатку просто нарізаємо масив на групи
        while (activeStudents.length > 0) {
            const groupChunk = activeStudents.splice(0, size);
            generatedGroups.push(groupChunk);
        }

        
        renderGeneratedGroups();

        
        loaderScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    }, 1500);
});


function renderGeneratedGroups() {
    resultsGrid.innerHTML = '';

    generatedGroups.forEach((group, groupIndex) => {
        // Якщо група пуста — не рендеримо її
        if (group.length === 0) return;

        const card = document.createElement('div');
        card.className = 'group-giant-card';
        card.setAttribute('data-group-index', groupIndex);
        
       
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            
            const fromGroupIndex = parseInt(e.dataTransfer.getData('text/from-group'));
            const studentIndex = parseInt(e.dataTransfer.getData('text/student-index'));
            const toGroupIndex = groupIndex;

            if (fromGroupIndex === toGroupIndex) return;

            
            const [student] = generatedGroups[fromGroupIndex].splice(studentIndex, 1);
            generatedGroups[toGroupIndex].push(student);

            
            if (generatedGroups[fromGroupIndex].length === 0) {
                generatedGroups.splice(fromGroupIndex, 1);
            }

            
            renderGeneratedGroups();
        });
        
        let namesHTML = '<div class="group-names-list">';
        group.forEach((name, studentIndex) => {
            const elementId = `drag-${groupIndex}-${studentIndex}`;
            namesHTML += `
                <div class="group-student-name" 
                     draggable="true" 
                     id="${elementId}"
                     data-group="${groupIndex}" 
                     data-index="${studentIndex}">
                    <span class="drag-handle">☰</span>
                    <span class="student-text-name">${name}</span>
                </div>
            `;
        });
        namesHTML += '</div>';

        card.innerHTML = `
            <h3>Gruppe ${groupIndex + 1}</h3>
            ${namesHTML}
        `;
        
        resultsGrid.appendChild(card);
        
        
        card.querySelectorAll('.group-student-name').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/from-group', item.getAttribute('data-group'));
                e.dataTransfer.setData('text/student-index', item.getAttribute('data-index'));
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });
    });
}

// Schließen des Overlays
closeOverlayBtn.addEventListener('click', () => {
    fullscreenOverlay.classList.add('hidden');
});

// System starten
updateProfileDropdown();
renderNames();
