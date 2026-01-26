document.addEventListener('DOMContentLoaded', () => {
    const DATA = {
        lbs: {
            bar: { men: 45, women: 33 },
            plates: {
                45: { dia: 17.7, thick: 1.5, color: 'var(--red)', darkTxt: false },
                35: { dia: 14.1, thick: 1.3, color: 'var(--blue)', darkTxt: false },
                25: { dia: 10.9, thick: 1.4, color: 'var(--yellow)', darkTxt: true },
                15: { dia: 9.0, thick: 0.9, color: 'var(--black)', darkTxt: false },
                10: { dia: 9.0, thick: 0.8, color: 'var(--green)', darkTxt: false },
                5: { dia: 7.9, thick: 0.6, color: 'var(--white)', darkTxt: true },
                2.5: { dia: 6.5, thick: 0.5, color: '#666', darkTxt: false }
            },
            list: [45, 35, 25, 15, 10, 5, 2.5]
        },
        kg: {
            bar: { men: 20, women: 15 },
            plates: {
                25: { dia: 17.7, thick: 1.5, color: 'var(--red)', darkTxt: false },
                20: { dia: 17.7, thick: 1.3, color: 'var(--blue)', darkTxt: false },
                15: { dia: 15.7, thick: 1.1, color: 'var(--yellow)', darkTxt: true },
                10: { dia: 12.6, thick: 0.9, color: 'var(--green)', darkTxt: false },
                5: { dia: 9.0, thick: 0.8, color: 'var(--white)', darkTxt: true },
                2.5: { dia: 7.5, thick: 0.6, color: '#222', darkTxt: false },
                1.25: { dia: 6.5, thick: 0.5, color: '#555', darkTxt: false }
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

    // --- Persistence ---
    function save() { localStorage.setItem('barLoaderState', JSON.stringify(state)); }
    function load() {
        const saved = localStorage.getItem('barLoaderState');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
        }
        document.body.className = state.theme;
        refreshSettingsUI();
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

    function renderPlates() {
        const g = document.getElementById('plate-group');
        g.innerHTML = '';
        const config = DATA[state.unit].plates;
        let x = 65;

        state.plates.forEach(w => {
            const p = config[w];
            const svgW = p.thick * 18;
            const svgH = p.dia * 10;
            const y = 125 - (svgH / 2);

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", x); rect.setAttribute("y", y);
            rect.setAttribute("width", svgW); rect.setAttribute("height", svgH);
            rect.setAttribute("fill", p.color); rect.setAttribute("rx", 2);
            rect.setAttribute("stroke", "rgba(0,0,0,0.3)");
            g.appendChild(rect);

            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.setAttribute("x", x + (svgW / 2)); txt.setAttribute("y", 128);
            txt.setAttribute("class", `plate-label ${p.darkTxt ? 'label-dark' : ''}`);
            txt.textContent = w;
            g.appendChild(txt);
            x += svgW + 1;
        });

        const totalWidth = x;
        document.getElementById('barbell-group').setAttribute("transform", `translate(${(500 - totalWidth) / 2}, 0)`);
    }

    function buildControls() {
        const grid = document.getElementById('controls-grid');
        grid.innerHTML = '';
        DATA[state.unit].list.forEach(w => {
            const container = document.createElement('div');
            container.className = 'plate-group';
            const addBtn = document.createElement('button');
            addBtn.className = 'plate-btn';
            addBtn.style.backgroundColor = DATA[state.unit].plates[w].color;
            if(DATA[state.unit].plates[w].darkTxt) addBtn.style.color = '#000';
            addBtn.textContent = w;
            addBtn.onclick = () => { state.plates.push(w); state.plates.sort((a,b)=>b-a); updateUI(); };

            const remBtn = document.createElement('button');
            remBtn.className = 'remove-btn';
            remBtn.textContent = 'Remove';
            remBtn.onclick = () => { const i = state.plates.indexOf(w); if(i > -1) { state.plates.splice(i, 1); updateUI(); } };

            container.append(addBtn, remBtn);
            grid.appendChild(container);
        });
    }

    function renderInventorySettings() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        const currentInv = state.inventory[state.unit];
        
        DATA[state.unit].list.forEach(w => {
            const div = document.createElement('div');
            div.className = 'inv-item';
            div.innerHTML = `<span>${w} ${state.unit}</span>`;
            const input = document.createElement('input');
            input.type = 'number';
            input.value = currentInv[w];
            input.onchange = (e) => {
                state.inventory[state.unit][w] = parseInt(e.target.value) || 0;
                save();
            };
            div.appendChild(input);
            list.appendChild(div);
        });
    }

    function autoLoad() {
        const target = parseFloat(document.getElementById('target-weight-input').value);
        const config = DATA[state.unit];
        const barWeight = config.bar[state.bar];
        if (isNaN(target) || target < barWeight) return;

        let remaining = (target - barWeight) / 2;
        const newPlates = [];
        const tempInv = { ...state.inventory[state.unit] };

        config.list.forEach(w => {
            while (remaining >= w && tempInv[w] > 0) {
                newPlates.push(w);
                remaining = Math.round((remaining - w) * 100) / 100;
                tempInv[w]--;
            }
        });
        state.plates = newPlates;
        updateUI();
    }

    function refreshSettingsUI() {
        document.querySelectorAll('.unit-select').forEach(b => b.classList.toggle('active', b.dataset.unit === state.unit));
        document.querySelectorAll('.bar-select').forEach(b => b.classList.toggle('active', b.dataset.bar === state.bar));
        renderInventorySettings();
    }

    // --- Listeners ---
    document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('close-modal').onclick = () => document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('calc-btn').onclick = autoLoad;
    document.getElementById('clear-btn').onclick = () => { state.plates = []; updateUI(); };
    document.getElementById('theme-toggle').onclick = () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.body.className = state.theme;
        save();
    };

    document.querySelectorAll('.unit-select').forEach(btn => {
        btn.onclick = (e) => {
            state.unit = e.target.dataset.unit;
            state.plates = [];
            buildControls();
            refreshSettingsUI();
            updateUI();
        };
    });

    document.querySelectorAll('.bar-select').forEach(btn => {
        btn.onclick = (e) => {
            state.bar = e.target.dataset.bar;
            refreshSettingsUI();
            updateUI();
        };
    });

    load();
    buildControls();
    updateUI();
});
