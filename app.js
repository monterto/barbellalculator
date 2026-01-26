document.addEventListener('DOMContentLoaded', () => {
    const DATA = {
        lbs: {
            bar: { men: 45, women: 33 },
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
            bar: { men: 20, women: 15 },
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
        unit: 'lbs', bar: 'men', theme: 'light', plates: [],
        inventory: {
            lbs: { 45: 10, 35: 2, 25: 2, 15: 2, 10: 4, 5: 4, 2.5: 2 },
            kg: { 25: 10, 20: 2, 15: 2, 10: 2, 5: 2, 2.5: 2, 1.25: 2 }
        }
    };

    function save() { localStorage.setItem('barLoaderPro_v3', JSON.stringify(state)); }
    function load() {
        const saved = localStorage.getItem('barLoaderPro_v3');
        if (saved) state = { ...state, ...JSON.parse(saved) };
        document.body.className = state.theme;
    }

    function renderPlates() {
        const g = document.getElementById('plate-group');
        g.innerHTML = '';
        const config = DATA[state.unit].plates;
        
        // Locked Collar is at X=155 (140 + 15 width)
        let xOffset = 155; 
        const centerY = 100;

        state.plates.forEach(w => {
            const p = config[w];
            const svgW = p.thick * 12; // Thicker visual plates
            const svgH = p.dia * 6.5; // Larger height scale
            const y = centerY - (svgH / 2);

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", xOffset); rect.setAttribute("y", y);
            rect.setAttribute("width", svgW); rect.setAttribute("height", svgH);
            rect.setAttribute("fill", p.color); rect.setAttribute("rx", 4);
            rect.setAttribute("stroke", "rgba(0,0,0,0.4)");
            rect.setAttribute("stroke-width", "1.5");
            g.appendChild(rect);

            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.setAttribute("x", xOffset + (svgW / 2)); txt.setAttribute("y", centerY + 4);
            txt.setAttribute("class", `plate-label ${p.darkTxt ? 'label-dark' : ''}`);
            txt.textContent = w;
            g.appendChild(txt);
            xOffset += svgW + 1;
        });
    }

    function updateUI() {
        const config = DATA[state.unit];
        const barWeight = config.bar[state.bar];
        const sideWeight = state.plates.reduce((a, b) => a + b, 0);
        const total = barWeight + (sideWeight * 2);

        document.getElementById('total-weight').textContent = total.toFixed(1);
        document.getElementById('side-weight').textContent = sideWeight.toFixed(1);
        document.getElementById('unit-label').textContent = state.unit;
        renderPlates();
        save();
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

    // --- Controls ---
    document.getElementById('settings-btn').onclick = () => {
        renderInventory();
        document.getElementById('settings-modal').classList.remove('hidden');
    };
    document.getElementById('close-modal').onclick = () => document.getElementById('settings-modal').classList.add('hidden');
    
    document.getElementById('calc-btn').onclick = () => {
        const target = parseFloat(document.getElementById('target-weight-input').value);
        const bar = DATA[state.unit].bar[state.bar];
        if (isNaN(target) || target < bar) return;
        let rem = (target - bar) / 2;
        const result = [];
        const inv = { ...state.inventory[state.unit] };
        DATA[state.unit].list.forEach(w => {
            while (rem >= w && inv[w] > 0) { result.push(w); rem = Math.round((rem-w)*100)/100; inv[w]--; }
        });
        state.plates = result; updateUI();
    };

    document.getElementById('theme-toggle').onclick = () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.body.className = state.theme; save();
    };

    document.querySelectorAll('.unit-select').forEach(b => b.onclick = (e) => {
        state.unit = e.target.dataset.unit; state.plates = [];
        document.querySelectorAll('.unit-select').forEach(x => x.classList.remove('active'));
        e.target.classList.add('active'); buildControls(); renderInventory(); updateUI();
    });

    document.querySelectorAll('.bar-select').forEach(b => b.onclick = (e) => {
        state.bar = e.target.dataset.bar;
        document.querySelectorAll('.bar-select').forEach(x => x.classList.remove('active'));
        e.target.classList.add('active'); updateUI();
    });

    document.getElementById('clear-btn').onclick = () => { state.plates = []; updateUI(); };

    load();
    buildControls();
    updateUI();
});
