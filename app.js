document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Data ---
    const BAR_WEIGHT = 45;
    // SVG scaling factor: arbitrarily decided that 20 SVG units = 1 inch for this viewbox
    const SCALE_FACTOR = 20; 
    // X-coordinate where the loadable sleeve begins on our SVG
    const SLEEVE_START_X = 65; 
    const SVG_CENTER_Y = 150;
    const MAX_SLEEVE_LENGTH_INCHES = 16.5;

    // Plate Dimensions (Diameter & Thickness in inches) based on user request
    const PLATE_DATA = {
        45: { dia: 17.71, thick: 1.45, className: 'plate-45' },
        35: { dia: 14.13, thick: 1.33, className: 'plate-35' },
        25: { dia: 10.94, thick: 1.41, className: 'plate-25' },
        // Note: User requested 15lb have same dims as 10lb
        15: { dia: 9.01, thick: 0.88, className: 'plate-15' },
        10: { dia: 9.01, thick: 0.88, className: 'plate-10' },
        5: { dia: 7.91, thick: 0.55, className: 'plate-5' },
        2.5: { dia: 6.45, thick: 0.43, className: 'plate-2.5' }
    };
    
    const AVAILABLE_WEIGHTS = [45, 35, 25, 15, 10, 5, 2.5];

    // --- State ---
    let platesOnOneSide = []; // Stores weight values, e.g., [45, 25, 10]

    // --- DOM Elements ---
    const totalWeightEl = document.getElementById('total-weight');
    const sideWeightEl = document.getElementById('side-weight');
    const controlsGrid = document.querySelector('.controls-grid');
    const plateGroupSvg = document.getElementById('plate-group');
    const themeToggle = document.getElementById('theme-toggle');
    const clearBtn = document.getElementById('clear-btn');

    // --- Initialization ---
    initControls();
    initTheme();
    updateUI();

    // --- Functions ---

    function initControls() {
        AVAILABLE_WEIGHTS.forEach(weight => {
            const btn = document.createElement('button');
            btn.innerText = weight;
            // Handle the "2.5" class name escaping for CSS
            const className = `btn-${weight.toString().replace('.', '\\.')}`;
            btn.classList.add('plate-btn', className);
            btn.addEventListener('click', () => addPlate(weight));
            controlsGrid.appendChild(btn);
        });

        clearBtn.addEventListener('click', () => {
            platesOnOneSide = [];
            updateUI();
        });
    }

    function addPlate(weight) {
        // Calculate current loaded thickness to prevent overloading sleeve
        let currentThicknessInches = platesOnOneSide.reduce((acc, w) => acc + PLATE_DATA[w].thick, 0);
        let newThickness = currentThicknessInches + PLATE_DATA[weight].thick;

        if (newThickness > MAX_SLEEVE_LENGTH_INCHES) {
            alert("Sleeve is full! Cannot add more plates.");
            return;
        }
        platesOnOneSide.push(weight);
        // Sort descending so biggest plates are inside (standard loading)
        platesOnOneSide.sort((a, b) => b - a);
        updateUI();
    }

    function updateUI() {
        // 1. Calculate Weights
        const sideTotal = platesOnOneSide.reduce((sum, w) => sum + w, 0);
        const total = BAR_WEIGHT + (sideTotal * 2);

        // 2. Update Text
        totalWeightEl.textContent = total;
        sideWeightEl.textContent = sideTotal;

        // 3. Redraw SVG Visualization
        redrawSVG();
    }

    function redrawSVG() {
        // Clear existing plates
        plateGroupSvg.innerHTML = '';

        let currentXPosition = SLEEVE_START_X;

        platesOnOneSide.forEach(weight => {
            const data = PLATE_DATA[weight];
            
            // Convert real dimensions to SVG units
            const svgWidth = data.thick * SCALE_FACTOR;
            const svgHeight = data.dia * SCALE_FACTOR;
            
            // Calculate Y to center the plate vertically on the bar center
            const svgY = SVG_CENTER_Y - (svgHeight / 2);

            // Create SVG Rectangle
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", currentXPosition);
            rect.setAttribute("y", svgY);
            rect.setAttribute("width", svgWidth);
            rect.setAttribute("height", svgHeight);
            rect.setAttribute("rx", "2"); // Slight rounded corner
            rect.classList.add('viz-plate', data.className);

            plateGroupSvg.appendChild(rect);

            // Move X position for the next plate, plus a tiny gap
            currentXPosition += svgWidth + 1; 
        });
    }

    // --- Theme Handling ---
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        }
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        });
    }
});

// --- Service Worker Registration (for PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW Registered!', reg.scope))
        .catch(err => console.log('SW Failed', err));
    });
}
