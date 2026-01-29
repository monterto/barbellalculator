// ============================================
// APP LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const DATA = {
        lbs: {
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
        kg: {
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

    let state = {
        unit: 'lbs', 
        bar: 'men', 
        theme: 'dark', // Defaulting state to dark
        plates: [],
        inventory: {
            lbs: { 45: 10, 35: 2, 25: 2, 15: 2, 10: 4, 5: 4, 2.5: 2 },
            kg: { 25: 10, 20: 2, 15: 2, 10: 2, 5: 2, 2.5: 2, 1.25: 2 }
        },
        customBars: []
    };

    function save() { localStorage.setItem('barLoaderPro_v3', JSON.stringify(state)); }
    function load() {
        const saved = localStorage.getItem('barLoaderPro_v3');
        if (saved) state = { ...state, ...JSON.parse(saved) };
        document.body.className = state.theme;
    }

    function updateSettingsHighlights() {
        document.querySelectorAll('.unit-select').forEach(btn => btn.classList.toggle('active', btn.dataset.unit === state.unit));
        document.querySelectorAll('.bar-select').forEach(btn => btn.classList.toggle('active', btn.dataset.bar === state.bar));
        document.querySelectorAll('.theme-select').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === state.theme));
    }

    function renderPlates() {
        const g = document.getElementById('plate-group');
        g.innerHTML = '';
        const config = DATA[state.unit].plates;
        const weightList = DATA[state.unit].list;
        const maxWeight = Math.max(...weightList);
        
        let xOffset = 135; 
        const centerY = 140; 

        state.plates.forEach(w => {
            const p = config[w];
            
            // Scaled up thickness base for better visibility
            const thicknessBase = 48; 
            let svgW = (w / maxWeight) * thicknessBase;
            
            // Make 10 the same width as 15 for better text readability
            if (w === 10) {
                const fifteenWeight = state.unit === 'lbs' ? 15 : 10;
                svgW = (fifteenWeight / maxWeight) * thicknessBase;
            }
            
            // Readability: Clamp minimum width for smaller plates
            if (w <= 5) svgW = Math.max(svgW, 18);

            const maxDia = 240; 
            const isHeavy = w >= 10;
            
            // Readability: Clamp minimum height for smaller plates
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

            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.setAttribute("x", xOffset + (svgW / 2)); 
            txt.setAttribute("y", centerY + 7);
            txt.setAttribute("class", `plate-label ${p.darkTxt ? 'label-dark' : ''}`);
            
            // Increased text scale for better readability
            const fontSize = svgW < 20 ? 14 : 20;
            txt.style.fontSize = `${fontSize}px`;
            txt.style.fontWeight = "bold";
            txt.textContent = w;
            g.appendChild(txt);

            xOffset += svgW + 3;
        });
    }

    function updateUI() {
        const config = DATA[state.unit];
        let barWeight;
        
        // Check if custom bar is selected
        if (state.bar.startsWith('custom-')) {
            const customBar = state.customBars.find(b => b.id === state.bar);
            barWeight = customBar ? customBar.weight : 0;
        } else {
            barWeight = config.bar[state.bar];
        }
        
        const sideWeight = state.plates.reduce((a, b) => a + b, 0);
        const totalAddedWeight = sideWeight * 2;
        const total = barWeight + totalAddedWeight;

        document.getElementById('total-weight').textContent = total.toFixed(1);
        document.getElementById('unit-label').textContent = state.unit;
        document.getElementById('side-weight').textContent = totalAddedWeight.toFixed(1);

        updateSettingsHighlights();
        renderPlates();
        save();
    }

    function renderCustomBars() {
        const list = document.getElementById('custom-bar-list');
        list.innerHTML = '';
        
        state.customBars.forEach(preset => {
            const div = document.createElement('div');
            div.className = `custom-bar-preset ${state.bar === preset.id ? 'active' : ''}`;
            
            const info = document.createElement('div');
            info.className = 'preset-info';
            info.onclick = () => {
                state.bar = preset.id;
                state.plates = [];
                updateUI();
                renderCustomBars();
            };
            
            const name = document.createElement('div');
            name.className = 'preset-name';
            name.textContent = preset.name;
            
            const weight = document.createElement('div');
            weight.className = 'preset-weight';
            weight.textContent = `${preset.weight} ${preset.unit}`;
            
            info.appendChild(name);
            info.appendChild(weight);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-preset-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                state.customBars = state.customBars.filter(b => b.id !== preset.id);
                if (state.bar === preset.id) {
                    state.bar = 'men';
                }
                save();
                renderCustomBars();
                updateUI();
            };
            
            div.appendChild(info);
            div.appendChild(deleteBtn);
            list.appendChild(div);
        });
    }

    function buildControls() {
        const grid = document.getElementById('controls-grid');
        grid.innerHTML = '';
        DATA[state.unit].list.forEach(w => {
            const div = document.createElement('div');
            div.className = 'plate-group';
            const btn = document.createElement('button');
            btn.className = 'plate-btn';
            btn.style.backgroundColor = DATA[state.unit].plates[w].color;
            if(DATA[state.unit].plates[w].darkTxt) btn.style.color = '#111';
            btn.textContent = w;
            btn.onclick = () => { state.plates.push(w); state.plates.sort((a,b)=>b-a); updateUI(); };
            
            const rem = document.createElement('button');
            rem.className = 'remove-btn'; rem.textContent = 'Remove';
            rem.onclick = () => { const i = state.plates.indexOf(w); if(i>-1){state.plates.splice(i,1); updateUI();} };
            
            div.append(btn, rem);
            grid.appendChild(div);
        });
    }

    function renderInventory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        DATA[state.unit].list.forEach(w => {
            const div = document.createElement('div'); div.className = 'inv-item';
            div.innerHTML = `<span>${w} ${state.unit}</span>`;
            const input = document.createElement('input');
            input.type = 'number'; input.value = state.inventory[state.unit][w];
            input.onchange = (e) => { state.inventory[state.unit][w] = parseInt(e.target.value) || 0; save(); };
            div.appendChild(input); list.appendChild(div);
        });
    }

    document.getElementById('settings-btn').onclick = () => {
        renderInventory();
        renderCustomBars();
        updateSettingsHighlights();
        document.getElementById('settings-modal').classList.remove('hidden');
    };
    document.getElementById('close-modal').onclick = () => document.getElementById('settings-modal').classList.add('hidden');
    
    document.getElementById('inventory-toggle').onclick = function() {
        const content = document.getElementById('inventory-section');
        const isHidden = content.classList.contains('hidden');
        
        if (isHidden) {
            content.classList.remove('hidden');
            content.classList.add('show');
            this.classList.add('active');
        } else {
            content.classList.remove('show');
            content.classList.add('hidden');
            this.classList.remove('active');
        }
    };
    
    document.getElementById('save-custom-bar').onclick = () => {
        const name = document.getElementById('custom-bar-name').value.trim();
        const weight = parseFloat(document.getElementById('custom-bar-weight').value);
        
        if (!name || isNaN(weight) || weight < 0) {
            return;
        }
        
        const preset = {
            id: 'custom-' + Date.now(),
            name: name,
            weight: weight,
            unit: state.unit
        };
        
        state.customBars.push(preset);
        save();
        renderCustomBars();
        
        // Clear inputs
        document.getElementById('custom-bar-name').value = '';
        document.getElementById('custom-bar-weight').value = '';
    };
    
    document.getElementById('calc-btn').onclick = () => {
        const target = parseFloat(document.getElementById('target-weight-input').value);
        
        let barWeight;
        if (state.bar.startsWith('custom-')) {
            const customBar = state.customBars.find(b => b.id === state.bar);
            barWeight = customBar ? customBar.weight : 0;
        } else {
            barWeight = DATA[state.unit].bar[state.bar];
        }
        
        if (isNaN(target) || target < barWeight) return;
        let rem = (target - barWeight) / 2;
        const result = [];
        const inv = { ...state.inventory[state.unit] };
        DATA[state.unit].list.forEach(w => {
            while (rem >= w && inv[w] > 0) { result.push(w); rem = Math.round((rem-w)*100)/100; inv[w]--; }
        });
        state.plates = result; updateUI();
    };

    document.querySelectorAll('.unit-select').forEach(b => b.onclick = (e) => {
        state.unit = e.target.dataset.unit; state.plates = [];
        buildControls(); renderInventory(); updateUI();
    });

    document.querySelectorAll('.bar-select').forEach(b => b.onclick = (e) => {
        state.bar = e.target.dataset.bar;
        updateUI();
    });

    document.querySelectorAll('.theme-select').forEach(b => b.onclick = (e) => {
        state.theme = e.target.dataset.theme;
        document.body.className = state.theme;
        updateSettingsHighlights();
        save();
    });

    document.getElementById('unit-info-btn').onclick = () => {
        const infoMsg = document.getElementById('unit-info-message');
        infoMsg.classList.toggle('show');
    };

    document.getElementById('barbell-info-btn').onclick = () => {
        const infoMsg = document.getElementById('barbell-info-message');
        infoMsg.classList.toggle('show');
    };

    document.getElementById('clear-btn').onclick = () => { state.plates = []; updateUI(); };

    load();
    buildControls();
    updateUI();
});
