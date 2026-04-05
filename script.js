const palette = [
    '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff',
    '#e8baff', '#e2f0cb', '#ffdac1', '#c7ceea', '#b5ead7',
    '#ff9aa2', '#e0bbe4', '#957dad', '#d291bc', '#fec8d8',
    '#ffdfd3', '#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5'
];

const theorySlots = {
    'MON': ['A1', 'F1', 'D1', 'TB1', 'TG1'], 'TUE': ['B1', 'G1', 'E1', 'TC1', 'TAA1'],
    'WED': ['C1', 'A1', 'F1', 'V1', 'V2'], 'THU': ['D1', 'B1', 'G1', 'TE1', 'TCC1'],
    'FRI': ['E1', 'C1', 'TA1', 'TF1', 'TD1']
};

const eveningTheorySlots = {
    'MON': ['A2', 'F2', 'D2', 'TB2', 'TG2'], 'TUE': ['B2', 'G2', 'E2', 'TC2', 'TAA2'],
    'WED': ['C2', 'A2', 'F2', 'TD2', 'TBB2'], 'THU': ['D2', 'B2', 'G2', 'TE2', 'TCC2'],
    'FRI': ['E2', 'C2', 'TA2', 'TF2', 'TDD2']
};

const morningLabs = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19', 'L20', 'L21', 'L22', 'L23', 'L24', 'L25', 'L26', 'L27', 'L28', 'L29', 'L30'];
const eveningLabs = ['L31', 'L32', 'L33', 'L34', 'L35', 'L36', 'L37', 'L38', 'L39', 'L40', 'L41', 'L42', 'L43', 'L44', 'L45', 'L46', 'L47', 'L48', 'L49', 'L50', 'L51', 'L52', 'L53', 'L54', 'L55', 'L56', 'L57', 'L58', 'L59', 'L60'];

const appState = {
    courseDatabase: {},
    slotToCourse: {},
    courseMetadata: {},
    currentCourseCode: null,
    studentName: "",
    sessionPref: "evening", /* morning or evening */
    timetableDataRaw: "",
    liveInterval: null,
    errorTimeout: null
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadState();
    attachGlobalListeners();
});

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
}

function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// --- STATE MANAGEMENT ---
function loadState() {
    appState.timetableDataRaw = localStorage.getItem('timetable_data') || "";
    appState.studentName = localStorage.getItem('student_name') || "";
    appState.sessionPref = localStorage.getItem('session_pref') || "evening";

    const savedMeta = localStorage.getItem('course_metadata');
    if (savedMeta) {
        try { appState.courseMetadata = JSON.parse(savedMeta); } catch (e) { console.error(e); }
    }

    if (appState.sessionPref === 'morning') document.getElementById('mornTheory').checked = true;
    else document.getElementById('mornLab').checked = true;

    if (appState.timetableDataRaw && appState.studentName) {
        document.getElementById('courseInput').value = appState.timetableDataRaw;
        document.getElementById('studentName').value = appState.studentName;
        generateTimetable();
    } else {
        showView('input');
    }
}

function saveMeta() {
    localStorage.setItem('course_metadata', JSON.stringify(appState.courseMetadata));
}

// --- EVENT LISTENERS ---
function attachGlobalListeners() {
    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Form Generate
    document.getElementById('input-view').addEventListener('submit', (e) => {
        e.preventDefault();
        generateTimetable();
    });

    // Reset App
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to completely reset? This will clear your timetable, all marks, assignments, and syllabus entries.")) {
            localStorage.removeItem('timetable_data');
            localStorage.removeItem('student_name');
            localStorage.removeItem('session_pref');
            localStorage.removeItem('course_metadata');

            appState.courseDatabase = {};
            appState.slotToCourse = {};
            appState.courseMetadata = {};
            appState.currentCourseCode = null;
            appState.studentName = "";
            appState.timetableDataRaw = "";

            document.getElementById('courseInput').value = '';
            document.getElementById('studentName').value = '';
            showView('input');
        }
    });

    // Modal Close
    const modal = document.getElementById('detailModal');
    const closeBtn = document.getElementById('close-modal-btn');
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Syllabus
    document.getElementById('add-syllabus-btn').addEventListener('click', addSyllabus);
    document.getElementById('newTopic').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addSyllabus();
    });

    // Assignments
    document.getElementById('add-assign-btn').addEventListener('click', addAssignment);
    document.getElementById('newAssign').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addAssignment();
    });

    // Marks Real-Time Validation and Calculation
    const markInputs = document.querySelectorAll('.mark-input');
    markInputs.forEach(input => {
        input.addEventListener('input', handleMarksInput);
    });

    // Notes auto-save
    document.getElementById('courseNotes').addEventListener('input', () => {
        if (appState.currentCourseCode && appState.courseMetadata[appState.currentCourseCode]) {
            appState.courseMetadata[appState.currentCourseCode].notes = document.getElementById('courseNotes').value;
            saveMeta();
        }
    });
}

function showView(view) {
    if (view === 'input') {
        document.getElementById('input-view').classList.remove('hidden');
        document.getElementById('output-view').classList.add('hidden');
        document.title = "University Timetable - Setup";
        stopLiveIndicator();
    } else {
        document.getElementById('input-view').classList.add('hidden');
        document.getElementById('output-view').classList.remove('hidden');
        document.getElementById('display-name').innerText = appState.studentName;
        document.title = `Timetable - ${appState.studentName}`;
        startLiveIndicator();
    }
}

// --- LOGIC ---
function generateTimetable() {
    const input = document.getElementById('courseInput').value;
    const name = document.getElementById('studentName').value.trim();
    const isMT = document.getElementById('mornTheory').checked;

    if (!name || !input.trim()) return;

    appState.timetableDataRaw = input;
    appState.studentName = name;
    appState.sessionPref = isMT ? 'morning' : 'evening';

    localStorage.setItem('timetable_data', input);
    localStorage.setItem('student_name', name);
    localStorage.setItem('session_pref', appState.sessionPref);

    const normalized = input.replace(/\s+/g, ' ');
    const blocks = normalized.split(/(\d+)\s+General\s+\(Semester\)/);

    appState.slotToCourse = {};
    appState.courseDatabase = {};

    blocks.forEach(block => {
        if (!block.trim()) return;
        const codeMatch = block.match(/([A-Z]{4}\d{3}[A-Z])\s*-\s*([^(\n]+)/);
        const slotMatch = block.match(/([A-Z0-9\+]+)\s*-\s*([A-Z]{2,6}[G]?\d*)/);
        const facultyMatch = block.match(/([A-Z\s\(\).]+)\s*-\s*(SCOPE|SAS|SENSE|SSL|SASIT|SCORE|SELECT)/);

        if (codeMatch && slotMatch) {
            const code = codeMatch[1];
            const faculty = facultyMatch ? facultyMatch[1].trim() : "Faculty TBD";
            const venue = slotMatch[2];
            const newSlots = slotMatch[1];

            if (appState.courseDatabase[code]) {
                appState.courseDatabase[code].slots += '+' + newSlots;
            } else {
                appState.courseDatabase[code] = {
                    name: codeMatch[2].trim(), code, venue, faculty,
                    slots: newSlots, school: facultyMatch ? facultyMatch[2] : "N/A"
                };
            }

            const slotsList = newSlots.split('+').map(s => s.trim());
            slotsList.forEach(s => appState.slotToCourse[s] = code);
        }
    });

    if (Object.keys(appState.courseDatabase).length === 0) {
        alert("No courses parsed! Please ensure valid data.");
        return;
    }

    renderTable();
    showView('output');
}

function getColor(code) {
    let hash = 0;
    for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
    // Darken colors slightly if in light mode, but mostly rely on the vibrant hex array
    return palette[Math.abs(hash % palette.length)];
}

function renderTable() {
    const isMT = appState.sessionPref === 'morning';
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

    // Exact mapping for Live Indicator
    const mTimes = isMT ?
        ["08:00-08:50", "09:00-09:50", "10:00-10:50", "11:00-11:50", "12:00-12:50"] :
        ["08:00-08:50", "08:51-09:40", "09:51-10:40", "10:41-11:30", "11:40-12:30", "12:31-13:20"];

    const eTimes = isMT ?
        ["14:00-14:50", "14:51-15:40", "15:51-16:40", "16:41-17:30", "17:40-18:30", "18:31-19:20"] :
        ["14:00-14:50", "15:00-15:50", "16:00-16:50", "17:00-17:50", "18:00-18:50"];

    let headerHtml = `<tr><th style="border-top-left-radius: 16px;">DAY</th>`;
    mTimes.forEach(t => headerHtml += `<th data-time="${t}">${t.replace('-', ' - ')}</th>`);
    headerHtml += `<th class="lunch-col-header" style="width: 80px;">LUNCH</th>`;
    eTimes.forEach((t, i) => {
        const rad = (i === eTimes.length - 1) ? 'style="border-top-right-radius: 16px;"' : '';
        headerHtml += `<th ${rad} data-time="${t}">${t.replace('-', ' - ')}</th>`;
    });
    headerHtml += `</tr>`;
    document.getElementById('head').innerHTML = headerHtml;

    let bHtml = "";
    days.forEach((day, index) => {
        let row = `<tr data-day="${day}"><td>${day}</td>`;

        if (isMT) theorySlots[day].forEach(s => row += createCell(s));
        else morningLabs.slice(index * 6, (index * 6) + 6).forEach(s => row += createCell(s));

        row += `<td class="lunch-col">LUNCH</td>`;

        if (isMT) eveningLabs.slice(index * 6, (index * 6) + 6).forEach(s => row += createCell(s));
        else eveningTheorySlots[day].forEach(s => row += createCell(s));

        bHtml += row + "</tr>";
    });
    document.getElementById('body').innerHTML = bHtml;

    // Attach click listeners to cells
    const cells = document.querySelectorAll('.course-cell');
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            openDetails(cell.getAttribute('data-code'));
        });
    });
}

function createCell(slot) {
    const code = appState.slotToCourse[slot];
    if (!code) return `<td class="empty-cell"></td>`;
    const c = appState.courseDatabase[code];
    const color = getColor(code);
    return `<td class="course-cell" style="background-color: ${color}; color: #111827;" data-code="${code}">
            <span class="course-code">${code}</span>
            <span class="venue-badge">${c.venue}</span>
            <span class="faculty-name">${c.faculty}</span>
        </td>`;
}

// --- LIVE INDICATOR ---
function startLiveIndicator() {
    updateLiveIndicator();
    if (appState.liveInterval) clearInterval(appState.liveInterval);
    appState.liveInterval = setInterval(updateLiveIndicator, 60000);
}

function stopLiveIndicator() {
    if (appState.liveInterval) clearInterval(appState.liveInterval);
}

function updateLiveIndicator() {
    // Clear old highlights
    document.querySelectorAll('.active-day').forEach(el => el.classList.remove('active-day'));
    document.querySelectorAll('.live-class').forEach(el => el.classList.remove('live-class'));

    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDayStr = days[now.getDay()];

    // Mocks for testing 
    // now.setHours(9); now.setMinutes(10); const currentDayStr = "MON";

    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeNum = parseInt(hh + mm, 10);

    const activeRow = document.querySelector(`tr[data-day="${currentDayStr}"]`);
    if (activeRow) {
        activeRow.classList.add('active-day');
    }

    const ths = document.querySelectorAll('th[data-time]');
    let activeColIndex = -1;
    let isActiveClass = false;

    ths.forEach((th, idx) => {
        const range = th.getAttribute('data-time').split('-');
        if (range.length === 2) {
            const start = parseInt(range[0].replace(':', ''), 10);
            const end = parseInt(range[1].replace(':', ''), 10);
            if (timeNum >= start && timeNum <= end) {
                activeColIndex = idx + 1; // +1 because first col is DAY
                isActiveClass = true;
            }
        }
    });

    const statusEl = document.getElementById('live-status');
    if (activeRow && activeColIndex !== -1) {
        // Adjust index to skip lunch if necessary
        const cells = activeRow.children;
        if (cells[activeColIndex]) {
            if (cells[activeColIndex].classList.contains('lunch-col')) {
                statusEl.innerText = "🟢 Lunch Break";
            } else if (cells[activeColIndex].classList.contains('course-cell')) {
                cells[activeColIndex].classList.add('live-class');
                const code = cells[activeColIndex].getAttribute('data-code');
                statusEl.innerText = `🟢 Live: ${code}`;
            } else {
                statusEl.innerText = "🟢 Free Slot";
            }
        }
    } else {
        statusEl.innerText = activeRow ? "🟢 Outside hours" : "🟢 No classes today";
    }
}

// --- MODAL ---
function isLabCourse(code) {
    const c = appState.courseDatabase[code];
    if (!c || !c.slots) return false;
    return c.slots.split(/[+,]/).some(s => s.trim().startsWith('L'));
}

function openDetails(code) {
    appState.currentCourseCode = code;
    const c = appState.courseDatabase[code];
    if (!c) return;

    if (!appState.courseMetadata[code]) {
        appState.courseMetadata[code] = {
            syllabus: [], assignments: [],
            marks: { cat1: '', cat2: '', internal: '', fat: '' }, notes: ''
        };
    }

    document.getElementById('courseName').innerText = c.name;
    document.getElementById('courseCode').innerText = c.code;
    document.getElementById('facultyName').innerText = c.faculty;
    document.getElementById('venueName').innerText = c.venue;
    document.getElementById('slotList').innerText = c.slots;
    document.getElementById('schoolName').innerText = c.school;

    document.getElementById('modalHeader').style.background = getColor(code);

    setupMarksUI(code);
    renderSyllabus();
    renderAssignments();
    renderMarks();

    switchTab('overview');
    document.getElementById('detailModal').classList.add('active');
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
}

// --- SYLLABUS ---
function addSyllabus() {
    const topic = document.getElementById('newTopic').value.trim();
    if (!topic) return;
    appState.courseMetadata[appState.currentCourseCode].syllabus.push({ text: topic, done: false });
    saveMeta();
    renderSyllabus();
    document.getElementById('newTopic').value = '';
}

function renderSyllabus() {
    const list = document.getElementById('syllabusList');
    list.innerHTML = '';
    const data = appState.courseMetadata[appState.currentCourseCode].syllabus || [];

    data.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${item.done ? 'completed' : ''}`;

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = item.done;
        chk.style.cursor = 'pointer';
        chk.addEventListener('change', () => {
            item.done = !item.done;
            saveMeta(); renderSyllabus();
        });

        const span = document.createElement('span');
        span.style.flex = '1';
        span.innerText = item.text;

        const del = document.createElement('span');
        del.className = 'delete-icon';
        del.innerText = '🗑️';
        del.addEventListener('click', () => {
            data.splice(index, 1);
            saveMeta(); renderSyllabus();
        });

        li.appendChild(chk); li.appendChild(span); li.appendChild(del);
        list.appendChild(li);
    });
}

// --- ASSIGNMENTS ---
function addAssignment() {
    const title = document.getElementById('newAssign').value.trim();
    const date = document.getElementById('newAssignDate').value;
    if (!title) return;

    appState.courseMetadata[appState.currentCourseCode].assignments.push({ title, date, done: false });
    saveMeta();
    renderAssignments();
    document.getElementById('newAssign').value = '';
}

function renderAssignments() {
    const list = document.getElementById('assignList');
    list.innerHTML = '';
    const data = appState.courseMetadata[appState.currentCourseCode].assignments || [];

    // Sort assignments: Incomplete first, then by date, No Date at bottom
    data.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;

        let valA = Infinity;
        let valB = Infinity;
        if (a.date) {
            const [ya, ma, da] = a.date.split('-');
            valA = new Date(ya, ma - 1, da).getTime();
        }
        if (b.date) {
            const [yb, mb, db] = b.date.split('-');
            valB = new Date(yb, mb - 1, db).getTime();
        }
        return valA - valB;
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    data.forEach((item, index) => {
        let isDueSoon = false;
        let isOverdue = false;
        let dueLabel = "";

        let dueLocalStr = 'No Date';
        if (item.date) {
            const [y, m, d] = item.date.split('-');
            const due = new Date(y, m - 1, d);
            dueLocalStr = due.toLocaleDateString();

            if (!item.done) {
                const diffTime = Math.round((due - now) / (1000 * 60 * 60 * 24));

                if (diffTime < 0) {
                    isOverdue = true;
                    dueLabel = "Overdue";
                } else if (diffTime === 0) {
                    isDueSoon = true;
                    dueLabel = "Due Today";
                } else if (diffTime === 1) {
                    isDueSoon = true;
                    dueLabel = "Due Tomorrow";
                } else if (diffTime <= 2) {
                    isDueSoon = true;
                    dueLabel = `Due in ${diffTime} days`;
                }
            }
        }

        const li = document.createElement('li');
        li.className = `task-item ${item.done ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${isDueSoon ? 'due-soon' : ''}`;

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = item.done;
        chk.style.cursor = 'pointer';
        chk.addEventListener('change', () => {
            item.done = !item.done;
            saveMeta(); renderAssignments();
        });

        const div = document.createElement('div');
        div.style.flex = '1';
        div.style.display = 'flex'; div.style.flexDirection = 'column';

        let titleHtml = `<span style="font-weight:500;">${item.title}</span>`;
        if (isOverdue || isDueSoon) titleHtml += ` <span class="due-badge ${isOverdue ? 'badge-overdue' : 'badge-soon'}">${dueLabel}</span>`;

        div.innerHTML = `
            <div>${titleHtml}</div>
            <span style="font-size:0.8rem; opacity:0.6; margin-top:4px;">${dueLocalStr}</span>
        `;

        const del = document.createElement('span');
        del.className = 'delete-icon';
        del.innerText = '🗑️';
        del.addEventListener('click', () => {
            data.splice(index, 1);
            saveMeta(); renderAssignments();
        });

        li.appendChild(chk); li.appendChild(div); li.appendChild(del);
        list.appendChild(li);
    });
}

// --- MARKS ---
function setupMarksUI(code) {
    const isLab = isLabCourse(code);
    const isBSTS = code.toLowerCase().startsWith('bsts');

    document.getElementById('group-cat1').style.display = isLab ? 'none' : 'block';
    document.getElementById('group-cat2').style.display = isLab ? 'none' : 'block';

    document.getElementById('label-cat1').innerText = isBSTS ? "CAT 1 (30)" : "CAT 1 (50)";
    document.getElementById('label-cat2').innerText = isBSTS ? "CAT 2 (30)" : "CAT 2 (50)";
    document.getElementById('label-internal').innerText = isLab ? "INTERNAL (60)" : "INTERNAL (30)";
    document.getElementById('label-fat').innerText = isLab ? "FAT (50)" : (isBSTS ? "FAT (50)" : "FAT (100)");

    // Set Maxes
    document.getElementById('mark-cat1').max = isBSTS ? 30 : 50;
    document.getElementById('mark-cat2').max = isBSTS ? 30 : 50;
    document.getElementById('mark-internal').max = isLab ? 60 : 30;
    document.getElementById('mark-fat').max = isLab ? 50 : (isBSTS ? 50 : 100);
}

function handleMarksInput(e) {
    const input = e.target;
    let rawStr = input.value;
    let val;
    const max = parseFloat(input.max);

    const errorEl = document.getElementById('marksError');
    let hasError = false;

    if (rawStr === '') {
        val = ''; // allow empty
    } else {
        val = parseFloat(rawStr);
        if (isNaN(val)) {
            errorEl.innerText = "Please enter a valid numerical value.";
            hasError = true;
            val = '';
            input.value = '';
        } else if (val < 0) {
            errorEl.innerText = `Negative marks are not allowed (0 - ${max}).`;
            hasError = true;
            val = '';
            input.value = '';
        } else if (val > max) {
            errorEl.innerText = `Maximum marks allowed is ${max}. You entered ${val}.`;
            hasError = true;
            val = '';
            input.value = '';
        }
    }

    if (hasError) {
        errorEl.classList.remove('hidden');
        if (appState.errorTimeout) clearTimeout(appState.errorTimeout);
        appState.errorTimeout = setTimeout(() => {
            errorEl.classList.add('hidden');
        }, 3500);
    } else {
        errorEl.classList.add('hidden');
    }

    // Save
    const m = appState.courseMetadata[appState.currentCourseCode].marks;
    if (input.id === 'mark-cat1') m.cat1 = val;
    if (input.id === 'mark-cat2') m.cat2 = val;
    if (input.id === 'mark-internal') m.internal = val;
    if (input.id === 'mark-fat') m.fat = val;

    saveMeta();
    calculateMarks();
}

function renderMarks() {
    const m = appState.courseMetadata[appState.currentCourseCode].marks;

    document.getElementById('mark-cat1').value = m.cat1 !== undefined ? m.cat1 : '';
    document.getElementById('mark-cat2').value = m.cat2 !== undefined ? m.cat2 : '';
    document.getElementById('mark-internal').value = m.internal !== undefined ? m.internal : '';
    document.getElementById('mark-fat').value = m.fat !== undefined ? m.fat : '';
    document.getElementById('courseNotes').value = appState.courseMetadata[appState.currentCourseCode].notes || '';

    calculateMarks();
}

function calculateMarks() {
    const m = appState.courseMetadata[appState.currentCourseCode].marks;
    const isLab = isLabCourse(appState.currentCourseCode);
    const isBSTS = appState.currentCourseCode.toLowerCase().startsWith('bsts');

    let total = 0;
    const intScore = parseFloat(m.internal) || 0;
    const fatScore = parseFloat(m.fat) || 0;

    if (isLab) {
        // Lab: Internal + (FAT/50 * 40)
        total = intScore + (fatScore / 50) * 40;
    } else if (isBSTS) {
        // BSTS: CATs 30->15, FAT 50->40
        const c1 = parseFloat(m.cat1) || 0;
        const c2 = parseFloat(m.cat2) || 0;
        total = ((c1 / 30) * 15) + ((c2 / 30) * 15) + intScore + ((fatScore / 50) * 40);
    } else {
        // Theory: Standard
        const c1 = parseFloat(m.cat1) || 0;
        const c2 = parseFloat(m.cat2) || 0;
        total = ((c1 / 50) * 15) + ((c2 / 50) * 15) + intScore + ((fatScore / 100) * 40);
    }

    document.getElementById('totalMarks').innerText = total.toFixed(1);
}
