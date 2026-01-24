document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const BAR_WEIGHT = 45;
    const SCALE_FACTOR = 20; 
    const SLEEVE_START_X = 65; 
    const SVG_CENTER_Y = 150;
    const MAX_SLEEVE_LENGTH_INCHES = 16.5;

    // Dimensions
    const PLATE_DATA = {
        45: { dia: 17.71, thick: 1.45, className: 'plate-45' },
        35: { dia: 14.13, thick: 1.33, className: 'plate-35' },
        25: { dia: 10.94, thick: 1.41, className: 'plate-25' },
        15: { dia: 9.01, thick: 0.88, className: 'plate-15' },
        10: { dia: 9.01, thick: 0.88, className: 'plate-10' },
        5: { dia: 7.91, thick: 0.55, className: 'plate-5' },
        2.5: { dia: 6.45, thick: 0.43, className: 'plate-2.5' }
    };
    
    const AVAILABLE_WEIGHTS = [45, 35, 25, 15, 10, 5, 2.5];

    // --- State ---
    let platesOnOneSide = []; 

    // --- DOM ---
    const totalWeightEl = document.getElementById('total-weight');
    const sideWeightEl = document.getElementById('side-weight');
    const controlsGrid = document.getElementById('controls-grid');
    const plateGroupSvg = document.getElementById('plate-group');
    const themeToggle = document.getElementById('theme-toggle');
    const clearBtn = document.getElementById('clear-btn');

    // --- Init ---
    initControls();
    initTheme();
    updateUI();

    // --- Control Generation ---
    function initControls() {
        controlsGrid.innerHTML = ''; // Clear just in case
        
        AVAILABLE_WEIGHTS.forEach(weight => {
            // Create a wrapper div for the stack
            const wrapper = document.createElement('div');
            wrapper.className = 'plate-control-group';

            // 1. ADD Button
            const addBtn = document.createElement('button');
            addBtn.innerText = weight;
            const cssClass = `btn-${weight.toString().replace('.', '\\.')}`;
            addBtn.classList.add('plate-btn', cssClass);
            addBtn.setAttribute('aria-label', `Add ${weight} lbs`);
            addBtn.addEventListener('click', () => addPlate(weight));

            // 2. REMOVE Button (Arrow)
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '▼'; // Down arrow symbol
            removeBtn.classList.add('remove-btn');
            removeBtn.setAttribute('aria-label', `Remove one ${weight} lb plate`);
            removeBtn.addEventListener('click', () => removePlate(weight));

            wrapper.appendChild(addBtn);
            wrapper.appendChild(removeBtn);
            controlsGrid.appendChild(wrapper);
        });

        clearBtn.addEventListener('click', () => {
            platesOnOneSide = [];
            updateUI();
        });
    }

    // --- Logic ---
    function addPlate(weight) {
        let currentThickness = platesOnOneSide.reduce((acc, w) => acc + PLATE_DATA[w].thick, 0);
        let newThickness = currentThickness + PLATE_DATA[weight].thick;

        if (newThickness > MAX_SLEEVE_LENGTH_INCHES) {
            alert("Sleeve is full! Cannot add more plates.");
            return;
        }
        platesOnOneSide.push(weight);
        sortPlates();
        updateUI();
    }

    function removePlate(weight) {
        // Find index of the first instance of this weight
        const index = platesOnOneSide.indexOf(weight);
        if (index > -1) {
            platesOnOneSide.splice(index, 1);
            sortPlates(); // Keep sorted (though splice usually preserves order, good safety)
            updateUI();
        }
    }

    function sortPlates() {
        // Standard loading: Heaviest inside
        platesOnOneSide.sort((a, b) => b - a);
    }

    function updateUI() {
        const sideTotal = platesOnOneSide.reduce((sum, w) => sum + w, 0);
        const total = BAR_WEIGHT + (sideTotal * 2);

        totalWeightEl.textContent = total;
        sideWeightEl.textContent = sideTotal;

        redrawSVG();
    }

    function redrawSVG() {
        plateGroupSvg.innerHTML = '';
        let currentX = SLEEVE_START_X;

        platesOnOneSide.forEach(weight => {
            const data = PLATE_DATA[weight];
            const svgWidth = data.thick * SCALE_FACTOR;
            const svgHeight = data.dia * SCALE_FACTOR;
            const svgY = SVG_CENTER_Y - (svgHeight / 2);

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", currentX);
            rect.setAttribute("y", svgY);
            rect.setAttribute("width", svgWidth);
            rect.setAttribute("height", svgHeight);
            rect.setAttribute("rx", "2"); 
            rect.classList.add('viz-plate', data.className);

            plateGroupSvg.appendChild(rect);
            currentX += svgWidth + 1; // 1 unit gap
        });
    }

    // --- Theme Persistence ---
    function initTheme() {
        // Check localStorage
        const savedTheme = localStorage.getItem('barcalc-theme');
        
        // Apply saved theme
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        } else if (savedTheme === 'light') {
            document.body.classList.remove('dark');
        } else {
            // Default to system preference if no save
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark');
            }
        }

        // Toggle Listener
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('barcalc-theme', isDark ? 'dark' : 'light');
        });
    }
});

// Service Worker (Unchanged but included for completeness)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}
