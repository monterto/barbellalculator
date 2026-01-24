document.addEventListener('DOMContentLoaded', () => {
    
    // --- Configuration Data ---
    const CONFIG = {
        lbs: {
            bar: { men: 45, women: 33 },
            // Colors: Red(45), Blue(35), Yellow(25), Black(15), Green(10)
            plates: {
                45:  { dia: 17.71, thick: 1.45, colorClass: 'fill-red', btnClass: 'btn-red' },
                35:  { dia: 14.13, thick: 1.33, colorClass: 'fill-blue', btnClass: 'btn-blue' },
                25:  { dia: 10.94, thick: 1.41, colorClass: 'fill-yellow', btnClass: 'btn-yellow' },
                15:  { dia: 9.01,  thick: 0.88, colorClass: 'fill-black', btnClass: 'btn-black' },
                10:  { dia: 9.01,  thick: 0.88, colorClass: 'fill-green', btnClass: 'btn-green' },
                5:   { dia: 7.91,  thick: 0.55, colorClass: 'fill-gray', btnClass: 'btn-gray' },
                2.5: { dia: 6.45,  thick: 0.43, colorClass: 'fill-lightgray', btnClass: 'btn-lightgray' }
            },
            weights: [45, 35, 25, 15, 10, 5, 2.5]
        },
        kg: {
            bar: { men: 20, women: 15 },
            // IWF Colors: Red(25), Blue(20), Yellow(15), Green(10), White(5)
            plates: {
                25:   { dia: 17.71, thick: 1.50, colorClass: 'fill-red', btnClass: 'btn-red' },
                20:   { dia: 17.71, thick: 1.30, colorClass: 'fill-blue', btnClass: 'btn-blue' },
                15:   { dia: 15.75, thick: 1.10, colorClass: 'fill-yellow', btnClass: 'btn-yellow' },
                10:   { dia: 12.60, thick: 0.90, colorClass: 'fill-green', btnClass: 'btn-green' },
                5:    { dia: 9.05,  thick: 0.80, colorClass: 'fill-white', btnClass: 'btn-white' },
                2.5:  { dia: 7.48,  thick: 0.60, colorClass: 'fill-black', btnClass: 'btn-black' },
                2:    { dia: 7.00,  thick: 0.50, colorClass: 'fill-gray', btnClass: 'btn-gray' },
                1.5:  { dia: 6.50,  thick: 0.45, colorClass: 'fill-gray', btnClass: 'btn-gray' },
                1:    { dia: 6.00,  thick: 0.40, colorClass: 'fill-lightgray', btnClass: 'btn-lightgray' },
                0.5:  { dia: 5.31,  thick: 0.35, colorClass: 'fill-lightgray', btnClass: 'btn-lightgray' }
            },
            weights: [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1, 0.5]
        }
    };

    // --- State ---
    let appState = {
        unit: 'lbs',      // 'lbs' or 'kg'
        barType: 'men',   // 'men' or 'women'
        theme: 'light',
        platesOnOneSide: [] 
    };

    // --- DOM Elements ---
    const els = {
        totalWeight: document.getElementById('total-weight'),
        sideWeight: document.getElementById('side-weight'),
        unitLabels: document.querySelectorAll('#unit-label, #unit-label-sm'),
        controlsGrid: document.getElementById('controls-grid'),
        plateGroup: document.getElementById('plate-group'),
        clearBtn: document.getElementById('clear-btn'),
        // Settings
        settingsBtn: document.getElementById('settings-btn'),
        modal: document.getElementById('settings-modal'),
        closeModal: document.getElementById('close-modal'),
        themeToggle: document.getElementById('theme-toggle'),
        unitBtns: document.querySelectorAll('.unit-select'),
        barBtns: document.querySelectorAll('.bar-select')
    };

    // --- Initialization ---
    init();

    function init() {
        loadSettings();
        applyTheme();
        initListeners();
        renderControls(); // Draws buttons based on units
        updateUI();       // Calculates math and draws SVG
    }

    // --- Core Logic ---

    function getPlateConfig() {
        return CONFIG[appState.unit].plates;
    }

    function getBarWeight() {
        return CONFIG[appState.unit].bar[appState.barType];
    }

    function addPlate(weight) {
        const plates = getPlateConfig();
        const maxLen = 16.5; // sleeve length in inches (approx same for kg bars)
        const scale = 1; // thickness already in inches in config
        
        // Check thickness
        const currentThick = appState.platesOnOneSide.reduce((acc, w) => acc + plates[w].thick, 0);
        if (currentThick + plates[weight].thick > maxLen) {
            alert("Sleeve is full!");
            return;
        }

        appState.platesOnOneSide.push(weight);
        appState.platesOnOneSide.sort((a, b) => b - a); // Keep heavy inside
        updateUI();
    }

    function removePlate(weight) {
        const idx = appState.platesOnOneSide.indexOf(weight);
        if (idx > -1) {
            appState.platesOnOneSide.splice(idx, 1);
            appState.platesOnOneSide.sort((a, b) => b - a);
            updateUI();
        }
    }

    function updateUI() {
        // 1. Math
        const sideTotal = appState.platesOnOneSide.reduce((acc, w) => acc + w, 0);
        const barWeight = getBarWeight();
        const total = barWeight + (sideTotal * 2);

        // 2. Text
        els.totalWeight.textContent = total % 1 !== 0 ? total.toFixed(1) : total;
        els.sideWeight.textContent = sideTotal % 1 !== 0 ? sideTotal.toFixed(1) : sideTotal;
        
        // Update unit labels text
        els.unitLabels.forEach(el => el.textContent = appState.unit);

        // 3. SVG Drawing
        drawBar();
    }

    function drawBar() {
        const plates = getPlateConfig();
        els.plateGroup.innerHTML = '';
        
        let currentX = 65; // Sleeve start X
        const centerY = 150;
        const scaleFactor = 20; // visual scale

        appState.platesOnOneSide.forEach(weight => {
            const data = plates[weight];
            const w = data.thick * scaleFactor;
            const h = data.dia * scaleFactor;
            const y = centerY - (h / 2);

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", currentX);
            rect.setAttribute("y", y);
            rect.setAttribute("width", w);
            rect.setAttribute("height", h);
            rect.setAttribute("rx", "2");
            rect.setAttribute("class", `viz-plate ${data.colorClass}`);
            
            els.plateGroup.appendChild(rect);
            currentX += w + 1; // 1 unit gap
        });
    }

    function renderControls() {
        els.controlsGrid.innerHTML = '';
        const weightList = CONFIG[appState.unit].weights;
        const plateConf = getPlateConfig();

        weightList.forEach(w => {
            const wrapper = document.createElement('div');
            wrapper.className = 'plate-control-group';

            // Add Button
            const addBtn = document.createElement('button');
            addBtn.innerText = w;
            addBtn.className = `plate-btn ${plateConf[w].btnClass}`;
            addBtn.onclick = () => addPlate(w);

            // Remove Button
            const remBtn = document.createElement('button');
            remBtn.innerHTML = '▼';
            remBtn.className = 'remove-btn';
            remBtn.onclick = () => removePlate(w);

            wrapper.append(addBtn, remBtn);
            els.controlsGrid.appendChild(wrapper);
        });
    }

    // --- Settings & Persistence ---

    function loadSettings() {
        const saved = localStorage.getItem('barcalc-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            appState.unit = parsed.unit || 'lbs';
            appState.barType = parsed.barType || 'men';
            appState.theme = parsed.theme || 'light';
        }
        updateSettingsUI();
    }

    function saveSettings() {
        localStorage.setItem('barcalc-settings', JSON.stringify({
            unit: appState.unit,
            barType: appState.barType,
            theme: appState.theme
        }));
    }

    function updateSettingsUI() {
        // Theme Button Text
        els.themeToggle.innerText = `Dark Mode: ${appState.theme === 'dark' ? 'On' : 'Off'}`;
        
        // Unit Buttons Active State
        els.unitBtns.forEach(btn => {
            if(btn.dataset.unit === appState.unit) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Bar Buttons Active State
        els.barBtns.forEach(btn => {
            if(btn.dataset.bar === appState.barType) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    function applyTheme() {
        if (appState.theme === 'dark') document.body.classList.add('dark');
        else document.body.classList.remove('dark');
    }

    // --- Event Listeners ---

    function initListeners() {
        // Clear
        els.clearBtn.onclick = () => {
            appState.platesOnOneSide = [];
            updateUI();
        };

        // Modal Open/Close
        els.settingsBtn.onclick = () => els.modal.classList.remove('hidden');
        els.closeModal.onclick = () => els.modal.classList.add('hidden');
        
        // Close modal if clicking outside content
        els.modal.onclick = (e) => {
            if (e.target === els.modal) els.modal.classList.add('hidden');
        };

        // Theme Toggle
        els.themeToggle.onclick = () => {
            appState.theme = appState.theme === 'light' ? 'dark' : 'light';
            applyTheme();
            updateSettingsUI();
            saveSettings();
        };

        // Unit Selection
        els.unitBtns.forEach(btn => {
            btn.onclick = () => {
                const newUnit = btn.dataset.unit;
                if (newUnit !== appState.unit) {
                    appState.unit = newUnit;
                    appState.platesOnOneSide = []; // Reset plates on unit switch
                    renderControls(); // Re-render buttons
                    updateSettingsUI();
                    saveSettings();
                    updateUI();
                }
            };
        });

        // Bar Type Selection
        els.barBtns.forEach(btn => {
            btn.onclick = () => {
                appState.barType = btn.dataset.bar;
                updateSettingsUI();
                saveSettings();
                updateUI();
            };
        });
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}
