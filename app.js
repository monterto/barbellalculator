// ============================================
// APP LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const DATA = {
        standard: {
            bar: { men: 45, women: 33, zero: 0 },
            plates: {
                45: { dia: 17.7, thick: 2.2, color: 'var(--red)', darkTxt: false },
                35: { dia: 14.1, thick: 2.0, color: 'var(--blue)', darkTxt: false },
                25: { dia: 10.9, thick: 1.8, color: 'var(--yellow)', darkTxt: true },
                15: { dia: 9.0, thick: 1.4, color: 'var(--black)', darkTxt: false },
                10: { dia: 9.0, thick: 1.2, color: 'var(--green)', darkTxt: false },
                5: { dia: 7.9, thick: 1.0, color: 'var(--white)', darkTxt: true },
                2.5: { dia: 6.5, thick: 0.8, color: '#777', darkTxt: false }
            },
            list: [45, 35, 25, 15, 10, 5, 2.5]
        },
        olympic: {
            bar: { men: 20, women: 15, zero: 0 },
            plates: {
                25: { dia: 17.7, thick: 2.2, color: 'var(--red)', darkTxt: false },
                20: { dia: 17.7, thick: 2.0, color: 'var(--blue)', darkTxt: false },
                15: { dia: 15.7, thick: 1.8, color: 'var(--yellow)', darkTxt: true },
                10: { dia: 12.6, thick: 1.5, color: 'var(--green)', darkTxt: false },
                5: { dia: 9.0, thick: 1.2, color: 'var(--white)', darkTxt: true },
                2.5: { dia: 7.5, thick: 1.0, color: '#222', darkTxt: false },
                1.25: { dia: 6.5, thick: 0.8, color: '#555', darkTxt: false }
            },
            list: [25, 20, 15, 10, 5, 2.5, 1.25]
        }
    };

    const INFO_CONTENT = {
        'plate-type': {
            title: 'Plate Type',
            body: `
                <p><strong>Standard:</strong> Commercial standard equipment commonly found in gyms. Uses pound-based plate weights (45, 35, 25, 15, 10, 5, 2.5 lbs).</p>
                <p><strong>Olympic:</strong> Follows Olympic weightlifting standards. Uses kilogram-based plate weights (25, 20, 15, 10, 5, 2.5, 1.25 kg).</p>
            `
        },
        'barbell-type': {
            title: 'Barbell Type',
            body: `
                <p><strong>Men's Bar:</strong> Standard men's barbell (45 lbs / 20 kg)</p>
                <p><strong>Women's Bar:</strong> Standard women's barbell (33 lbs / 15 kg)</p>
                <p><strong>No Bar:</strong> Calculate plates only without barbell weight</p>
            `
        },
        'display-units': {
            title: 'Display Units',
            body: `
                <p>This setting converts all displayed weights between pounds (lbs) and kilograms (kg).</p>
                <p>Choose your preferred unit for viewing weights, regardless of the plate type you've selected. The conversion will be applied automatically.</p>
            `
        }
    };

    let state = {
        plateType: 'standard',
        bar: 'men', 
        displayUnit: 'lbs',
        theme: 'dark',
        plates: [],
        addedWeightMode: 'per-side',
        inventory: {
            standard: { 45: 10, 35: 2, 25: 2, 15: 2, 10: 4, 5: 4, 2.5: 2 },
            olympic: { 25: 10, 20: 2, 15: 2, 10: 2, 5: 2, 2.5: 2, 1.25: 2 }
        }
    };

    // Conversion helpers
    const LBS_TO_KG = 0.453592;
    const KG_TO_LBS = 2.20462;

    function convert(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        if (fromUnit === 'lbs' && toUnit === 'kg') return value * LBS_TO_KG;
        if (fromUnit === 'kg' && toUnit === 'lbs') return value * KG_TO_LBS;
        return value;
    }

    function getPlateNativeUnit() {
        return state.plateType === 'standard' ? 'lbs' : 'kg';
    }

    function save() { localStorage.setItem('barLoaderPro_v4', JSON.stringify(state)); }
    
    function load() {
        const saved = localStorage.getItem('barLoaderPro_v4');
        if (saved) {
            const loaded = JSON.parse(saved);
            state = { ...state, ...loaded };
        }
        document.body.className = state.theme;
    }

    function updateSettingsHighlights() {
        document.querySelectorAll('.plate-type-select').forEach(btn => 
            btn.classList.toggle('active', btn.dataset.plateType === state.plateType));
        document.querySelectorAll('.bar-select').forEach(btn => 
            btn.classList.toggle('active', btn.dataset.bar === state.bar));
        document.querySelectorAll('.unit-select').forEach(btn => 
            btn.classList.toggle('active', btn.dataset.unit === state.displayUnit));
    }

    function renderPlates() {
        const g = document.getElementById('plate-group');
        g.innerHTML = '';
        const config = DATA[state.plateType].plates;
        const weightList = DATA[state.plateType].list;
        const maxWeight = Math.max(...weightList);
        const nativeUnit = getPlateNativeUnit();
        
        let xOffset = 135; 
        const centerY = 140; 

        state.plates.forEach(w => {
            const p = config[w];
            
            const thicknessBase = 48; 
            let svgW = (w / maxWeight) * thicknessBase;
            
            if (w <= 5) svgW = Math.max(svgW, 18);

            const maxDia = 240; 
            const isHeavy = w >= 10;
            
            let svgH = isHeavy ? maxDia : (p.dia * 14);
            if (w <= 5) svgH = Math.max(svgH, 90);

            const y = centerY - (svgH / 2);

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", xOffset); rect.setAttribute("y", y);
            rect.setAttribute("width", svgW); rect.setAttribute("height", svgH);
            rect.setAttribute("fill", p.color); rect.setAttribute("rx", 4);
            rect.setAttribute("stroke", "rgba(0,0,0,0.4)");
            rect.setAttribute("stroke-width", "1.5");
            g.appendChild(rect);

            // Display weight in current display unit
            const displayWeight = convert(w, nativeUnit, state.displayUnit);
            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.setAttribute("x", xOffset + (svgW / 2)); 
            txt.setAttribute("y", centerY + 7);
            txt.setAttribute("class", `plate-label ${p.darkTxt ? 'label-dark' : ''}`);
            
            const fontSize = svgW < 20 ? 11 : 16;
            txt.style.fontSize = `${fontSize}px`;
            txt.style.fontWeight = "bold";
            txt.textContent = displayWeight.toFixed(displayWeight < 10 ? 2 : 1);
            g.appendChild(txt);

            xOffset += svgW + 3;
        });
    }

    function updateUI() {
        const config = DATA[state.plateType];
        const nativeUnit = getPlateNativeUnit();
        
        // Calculate in native units
        const barWeightNative = config.bar[state.bar];
        const sideWeightNative = state.plates.reduce((a, b) => a + b, 0);
        const totalAddedWeightNative = sideWeightNative * 2;
        const totalNative = barWeightNative + totalAddedWeightNative;

        // Convert to display units
        const total = convert(totalNative, nativeUnit, state.displayUnit);
        const sideWeight = convert(sideWeightNative, nativeUnit, state.displayUnit);
        const totalAddedWeight = convert(totalAddedWeightNative, nativeUnit, state.displayUnit);

        document.getElementById('total-weight').textContent = total.toFixed(1);
        document.getElementById('unit-label').textContent = state.displayUnit;
        document.querySelectorAll('.unit-sm').forEach(el => el.textContent = state.displayUnit);

        const labelEl = document.getElementById('added-weight-label');
        const weightEl = document.getElementById('side-weight');

        if (state.addedWeightMode === 'total') {
            labelEl.textContent = "Added Weight (Total)";
            weightEl.textContent = totalAddedWeight.toFixed(1);
        } else {
            labelEl.textContent = "Added Weight (Per Side)";
            weightEl.textContent = sideWeight.toFixed(1);
        }

        updateSettingsHighlights();
        renderPlates();
        save();
    }

    document.getElementById('added-weight-toggle').onclick = () => {
        state.addedWeightMode = state.addedWeightMode === 'per-side' ? 'total' : 'per-side';
        updateUI();
    };

    function buildControls() {
        const grid = document.getElementById('controls-grid');
        grid.innerHTML = '';
        const nativeUnit = getPlateNativeUnit();
        
        DATA[state.plateType].list.forEach(w => {
            const div = document.createElement('div');
            div.className = 'plate-group';
            const btn = document.createElement('button');
            btn.className = 'plate-btn';
            btn.style.backgroundColor = DATA[state.plateType].plates[w].color;
            if(DATA[state.plateType].plates[w].darkTxt) btn.style.color = '#111';
            
            // Show weight in display units
            const displayWeight = convert(w, nativeUnit, state.displayUnit);
            btn.textContent = displayWeight.toFixed(displayWeight < 10 ? 2 : 1);
            
            btn.onclick = () => { 
                state.plates.push(w); 
                state.plates.sort((a,b)=>b-a); 
                updateUI(); 
            };
            
            const rem = document.createElement('button');
            rem.className = 'remove-btn'; 
            rem.textContent = 'Remove';
            rem.onclick = () => { 
                const i = state.plates.indexOf(w); 
                if(i>-1){
                    state.plates.splice(i,1); 
                    updateUI();
                } 
            };
            
            div.append(btn, rem);
            grid.appendChild(div);
        });
    }

    function renderInventory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        const nativeUnit = getPlateNativeUnit();
        
        DATA[state.plateType].list.forEach(w => {
            const div = document.createElement('div'); 
            div.className = 'inv-item';
            
            const displayWeight = convert(w, nativeUnit, state.displayUnit);
            const label = `${displayWeight.toFixed(displayWeight < 10 ? 2 : 1)} ${state.displayUnit}`;
            div.innerHTML = `<span>${label}</span>`;
            
            const input = document.createElement('input');
            input.type = 'number'; 
            input.value = state.inventory[state.plateType][w];
            input.onchange = (e) => { 
                state.inventory[state.plateType][w] = parseInt(e.target.value) || 0; 
                save(); 
            };
            div.appendChild(input); 
            list.appendChild(div);
        });
    }

    // Info modal handlers
    function showInfo(infoKey) {
        const info = INFO_CONTENT[infoKey];
        if (!info) return;
        
        document.getElementById('info-title').textContent = info.title;
        document.getElementById('info-body').innerHTML = info.body;
        document.getElementById('info-modal').classList.remove('hidden');
    }

    function hideInfo() {
        document.getElementById('info-modal').classList.add('hidden');
    }

    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.onclick = () => showInfo(btn.dataset.info);
    });

    document.getElementById('close-info-modal').onclick = hideInfo;
    document.getElementById('info-ok-btn').onclick = hideInfo;

    // Settings modal
    document.getElementById('settings-btn').onclick = () => {
        renderInventory();
        updateSettingsHighlights();
        document.getElementById('settings-modal').classList.remove('hidden');
    };
    
    document.getElementById('close-modal').onclick = () => {
        document.getElementById('settings-modal').classList.add('hidden');
    };
    
    // Calculate button
    document.getElementById('calc-btn').onclick = () => {
        const targetDisplay = parseFloat(document.getElementById('target-weight-input').value);
        if (isNaN(targetDisplay)) return;
        
        const nativeUnit = getPlateNativeUnit();
        const config = DATA[state.plateType];
        
        // Convert target from display units to native units
        const target = convert(targetDisplay, state.displayUnit, nativeUnit);
        const bar = config.bar[state.bar];
        
        if (target < bar) return;
        
        let rem = (target - bar) / 2;
        const result = [];
        const inv = { ...state.inventory[state.plateType] };
        
        DATA[state.plateType].list.forEach(w => {
            while (rem >= w && inv[w] > 0) { 
                result.push(w); 
                rem = Math.round((rem-w)*100)/100; 
                inv[w]--; 
            }
        });
        
        state.plates = result; 
        updateUI();
    };

    // Theme togglea
    document.getElementById('theme-toggle').onclick = () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.body.className = state.theme; 
        save();
    };

    // Plate type selection
    document.querySelectorAll('.plate-type-select').forEach(b => b.onclick = (e) => {
        const newPlateType = e.target.dataset.plateType;
        const oldNativeUnit = getPlateNativeUnit();
        
        state.plateType = newPlateType;
        const newNativeUnit = getPlateNativeUnit();
        
        // Auto-switch display unit to match new plate type default
        state.displayUnit = newNativeUnit;
        
        state.plates = [];
        buildControls(); 
        renderInventory(); 
        updateUI();
    });

    // Display unit selection
    document.querySelectorAll('.unit-select').forEach(b => b.onclick = (e) => {
        state.displayUnit = e.target.dataset.unit;
        buildControls();
        renderInventory();
        updateUI();
    });

    // Barbell type selection
    document.querySelectorAll('.bar-select').forEach(b => b.onclick = (e) => {
        state.bar = e.target.dataset.bar;
        updateUI();
    });

    // Clear button
    document.getElementById('clear-btn').onclick = () => { 
        state.plates = []; 
        updateUI(); 
    };

    // Initialize
    load();
    buildControls();
    updateUI();
});
