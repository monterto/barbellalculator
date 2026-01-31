// ============================================
// APP LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Configuration constants
    const SVG_CONFIG = {
        PLATE_START_X: 135,
        CENTER_Y: 140,
        THICKNESS_BASE: 48,
        MAX_DIAMETER: 240,
        PLATE_SPACING: 3,
        MIN_SMALL_PLATE_WIDTH: 18,
        MIN_SMALL_PLATE_HEIGHT: 90,
        SMALL_PLATE_THRESHOLD: 5
    };
    
    const VALIDATION = {
        MAX_CUSTOM_BAR_WEIGHT: 1000,
        MIN_CUSTOM_BAR_WEIGHT: 0.1,
        MAX_INVENTORY: 999,
        FLOATING_POINT_EPSILON: 0.001
    };
    
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
        theme: 'dark', // Will be set by load() based on saved preference or system
        plates: [],
        inventory: {
            lbs: { 45: 99, 35: 99, 25: 99, 15: 99, 10: 99, 5: 99, 2.5: 99 },
            kg: { 25: 99, 20: 99, 15: 99, 10: 99, 5: 99, 2.5: 99, 1.25: 99 }
        },
        customBars: [],
        highPrecision: false
    };
    
    // Counter for generating unique custom bar IDs
    let customBarIdCounter = 0;

    function getPreferredTheme() {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function save() {
        try {
            localStorage.setItem('barLoaderPro_v3', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save state:', error);
            // Could add user notification here if needed
        }
    }
    
    function load() {
        try {
            const saved = localStorage.getItem('barLoaderPro_v3');
            if (saved) {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
            } else {
                // First time user - use system theme preference
                state.theme = getPreferredTheme();
            }
        } catch (error) {
            console.error('Failed to load state, using defaults:', error);
            // Use system theme preference as fallback
            state.theme = getPreferredTheme();
        }
        
        // Apply theme using classList to avoid overwriting other classes
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(state.theme);
    }

    // Weight conversion functions with precision rounding
    function lbsToKg(lbs) {
        const kg = lbs / 2.20462;
        if (state.highPrecision) {
            // High precision: 0.1 kg increments
            return Math.round(kg * 10) / 10;
        } else {
            // Standard: 0.25 kg increments (practical for weightlifting)
            return Math.round(kg * 4) / 4;
        }
    }

    function kgToLbs(kg) {
        const lbs = kg * 2.20462;
        if (state.highPrecision) {
            // High precision: 0.1 lb increments
            return Math.round(lbs * 10) / 10;
        } else {
            // Standard: 0.5 lb increments (practical for weightlifting)
            return Math.round(lbs * 2) / 2;
        }
    }

    function getCustomBarWeight(customBar, targetUnit) {
        // Custom bars store weight in their original unit
        if (customBar.unit === targetUnit) {
            return customBar.weight;
        }
        // Convert if different unit
        if (targetUnit === 'kg' && customBar.unit === 'lbs') {
            return lbsToKg(customBar.weight);
        }
        if (targetUnit === 'lbs' && customBar.unit === 'kg') {
            return kgToLbs(customBar.weight);
        }
        return customBar.weight;
    }

    function getCurrentBarName() {
        if (state.bar.startsWith('custom-')) {
            const customBar = state.customBars.find(b => b.id === state.bar);
            if (!customBar) {
                // Bar was deleted, reset to default
                console.warn('Selected custom bar not found, resetting to default');
                state.bar = 'men';
                save();
                return getCurrentBarName(); // Recursive call with valid bar
            }
            const weight = getCustomBarWeight(customBar, state.unit);
            return `${customBar.name} (${weight.toFixed(1)} ${state.unit})`;
        }
        
        const barNames = {
            men: state.unit === 'lbs' ? "Men's Bar (45 lbs)" : "Men's Bar (20 kg)",
            women: state.unit === 'lbs' ? "Women's Bar (33 lbs)" : "Women's Bar (15 kg)",
            zero: "No Bar (0)"
        };
        
        return barNames[state.bar] || "Men's Bar (45 lbs)"; // Fallback to default
    }

    function updateSettingsHighlights() {
        document.querySelectorAll('.unit-select').forEach(btn => btn.classList.toggle('active', btn.dataset.unit === state.unit));
        document.querySelectorAll('.theme-select').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === state.theme));
        document.querySelectorAll('.precision-select').forEach(btn => btn.classList.toggle('active', btn.dataset.precision === state.highPrecision.toString()));
        
        // Update bar options
        document.querySelectorAll('.bar-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.bar === state.bar);
        });
        
        // Update bar type label on viz
        const barLabel = document.getElementById('bar-type-label');
        if (barLabel) {
            barLabel.textContent = getCurrentBarName();
        }
    }

    function renderPlates() {
        const g = document.getElementById('plate-group');
        g.innerHTML = '';
        const config = DATA[state.unit].plates;
        const weightList = DATA[state.unit].list;
        const maxWeight = Math.max(...weightList);
        
        let xOffset = SVG_CONFIG.PLATE_START_X; 
        const centerY = SVG_CONFIG.CENTER_Y; 

        state.plates.forEach(w => {
            const p = config[w];
            
            // Validate plate exists in config
            if (!p) {
                console.error(`Invalid plate weight: ${w} for unit ${state.unit}`);
                return; // Skip this plate
            }
            
            // Scaled up thickness base for better visibility
            let svgW = (w / maxWeight) * SVG_CONFIG.THICKNESS_BASE;
            
            // Make 10 the same width as 15 for better text readability
            if (w === 10) {
                const fifteenWeight = state.unit === 'lbs' ? 15 : 10;
                svgW = (fifteenWeight / maxWeight) * SVG_CONFIG.THICKNESS_BASE;
            }
            
            // Readability: Clamp minimum width for smaller plates
            if (w <= SVG_CONFIG.SMALL_PLATE_THRESHOLD) {
                svgW = Math.max(svgW, SVG_CONFIG.MIN_SMALL_PLATE_WIDTH);
            }

            const isHeavy = w >= 10;
            
            // Readability: Clamp minimum height for smaller plates
            let svgH = isHeavy ? SVG_CONFIG.MAX_DIAMETER : (p.dia * 14);
            if (w <= SVG_CONFIG.SMALL_PLATE_THRESHOLD) {
                svgH = Math.max(svgH, SVG_CONFIG.MIN_SMALL_PLATE_HEIGHT);
            }

            const y = centerY - (svgH / 2);

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", xOffset); 
            rect.setAttribute("y", y);
            rect.setAttribute("width", svgW); 
            rect.setAttribute("height", svgH);
            rect.setAttribute("fill", p.color); 
            rect.setAttribute("rx", 4);
            
            // Enhanced contrast for dark plates (black and gray)
            if (p.color === 'var(--black)' || p.color === '#777' || p.color === '#222' || p.color === '#555') {
                rect.setAttribute("stroke", "rgba(255, 255, 255, 0.3)");
                rect.setAttribute("stroke-width", "1.5");
            } else {
                rect.setAttribute("stroke", "rgba(0,0,0,0.4)");
                rect.setAttribute("stroke-width", "1.5");
            }
            
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

            xOffset += svgW + SVG_CONFIG.PLATE_SPACING;
        });
    }

    function updateControlStates() {
        // Update button states without rebuilding entire DOM (performance improvement)
        DATA[state.unit].list.forEach(w => {
            const onBar = state.plates.filter(p => p === w).length * 2;
            const available = state.inventory[state.unit][w] - onBar;
            
            // Find the button for this weight using data attribute
            const btn = document.querySelector(`.plate-btn[data-weight="${w}"]`);
            if (btn) {
                if (available < 2) {
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.disabled = true;
                } else {
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                    btn.disabled = false;
                }
            }
        });
    }

    function updateUI(rebuildControls = false) {
        const config = DATA[state.unit];
        let barWeight;
        
        // Validate bar type exists
        if (state.bar.startsWith('custom-')) {
            const customBar = state.customBars.find(b => b.id === state.bar);
            if (!customBar) {
                console.warn('Selected custom bar not found, resetting to default');
                state.bar = 'men';
            }
            barWeight = customBar ? getCustomBarWeight(customBar, state.unit) : config.bar['men'];
        } else {
            // Validate standard bar exists
            if (config.bar[state.bar] === undefined) {
                console.error(`Invalid bar type: ${state.bar}, resetting to default`);
                state.bar = 'men';
            }
            barWeight = config.bar[state.bar];
        }
        
        const sideWeight = state.plates.reduce((a, b) => a + b, 0);
        const totalAddedWeight = sideWeight * 2;
        const total = barWeight + totalAddedWeight;

        document.getElementById('total-weight').textContent = total.toFixed(1);
        document.getElementById('unit-label').textContent = state.unit;
        document.getElementById('side-weight').textContent = totalAddedWeight.toFixed(1);

        updateSettingsHighlights();
        
        // Only rebuild controls when necessary (performance improvement)
        if (rebuildControls) {
            buildControls();
        } else {
            updateControlStates();
        }
        
        renderPlates();
        save();
    }

    function renderCustomBars() {
        const list = document.getElementById('custom-bar-list');
        list.innerHTML = '';
        
        state.customBars.forEach(preset => {
            const div = document.createElement('div');
            div.className = `bar-option ${state.bar === preset.id ? 'active' : ''}`;
            div.dataset.bar = preset.id;
            
            const radio = document.createElement('div');
            radio.className = 'radio-circle';
            
            const info = document.createElement('div');
            info.className = 'bar-info';
            info.onclick = () => {
                state.bar = preset.id;
                state.plates = [];
                updateUI();
            };
            
            const name = document.createElement('span');
            name.className = 'bar-name';
            name.textContent = preset.name;
            
            const weight = document.createElement('span');
            weight.className = 'bar-weight';
            // Show weight in current unit with live conversion
            const displayWeight = getCustomBarWeight(preset, state.unit);
            weight.textContent = `${displayWeight.toFixed(1)} ${state.unit}`;
            
            info.appendChild(name);
            info.appendChild(weight);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-bar-btn';
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
            
            div.appendChild(radio);
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
            btn.dataset.weight = w; // Add data attribute for easier finding
            btn.style.backgroundColor = DATA[state.unit].plates[w].color;
            if(DATA[state.unit].plates[w].darkTxt) btn.style.color = '#111';
            btn.textContent = w;
            
            // Count how many of this plate are currently on the bar (both sides)
            const onBar = state.plates.filter(p => p === w).length * 2;
            // Check if at least 2 plates available (need a pair)
            const available = state.inventory[state.unit][w] - onBar;
            
            btn.onclick = () => { 
                if (available >= 2) {
                    state.plates.push(w); 
                    state.plates.sort((a,b)=>b-a); 
                    updateUI(); // Don't rebuild controls, just update states
                }
            };
            
            // Disable button if less than 2 available
            if (available < 2) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.disabled = true;
            }
            
            const rem = document.createElement('button');
            rem.className = 'remove-btn'; rem.textContent = 'Remove';
            rem.onclick = () => { 
                const i = state.plates.indexOf(w); 
                if(i>-1){
                    state.plates.splice(i,1); 
                    updateUI(); // Don't rebuild controls, just update states
                }
            };
            
            div.append(btn, rem);
            grid.appendChild(div);
        });
    }

    function renderInventory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        DATA[state.unit].list.forEach(w => {
            const div = document.createElement('div'); 
            div.className = 'inv-item';
            div.innerHTML = `<span>${w} ${state.unit}</span>`;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = String(VALIDATION.MAX_INVENTORY);
            input.value = state.inventory[state.unit][w];
            
            input.onchange = (e) => {
                let value = parseInt(e.target.value);
                
                // Validate and clamp value
                if (isNaN(value) || value < 0) {
                    value = 0;
                }
                if (value > VALIDATION.MAX_INVENTORY) {
                    value = VALIDATION.MAX_INVENTORY;
                }
                
                state.inventory[state.unit][w] = value;
                input.value = value; // Update display with clamped value
                save();
                updateControlStates(); // Update button states based on new inventory
            };
            
            div.appendChild(input); 
            list.appendChild(div);
        });
    }

    document.getElementById('settings-btn').onclick = () => {
        renderInventory();
        renderCustomBars();
        updateSettingsHighlights();
        document.getElementById('settings-modal').classList.remove('hidden');
        document.body.classList.add('settings-open');
        
        // Focus first button for keyboard accessibility
        setTimeout(() => {
            const firstButton = document.querySelector('#settings-modal .unit-select');
            if (firstButton) firstButton.focus();
        }, 100);
        
        // Push state for back button support
        window.history.pushState({ modal: 'settings' }, '');
    };
    
    function closeSettingsModal() {
        document.getElementById('settings-modal').classList.add('hidden');
        document.body.classList.remove('settings-open');
    }
    
    document.getElementById('close-modal').onclick = () => {
        closeSettingsModal();
        // Go back in history if we pushed a state
        if (window.history.state && window.history.state.modal) {
            window.history.back();
        }
    };
    
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
    
    // Custom bar modal handlers
    let selectedCustomBarUnit = 'lbs';
    
    document.getElementById('add-custom-bar-btn').onclick = () => {
        selectedCustomBarUnit = state.unit; // Default to current unit
        document.getElementById('custom-bar-modal').classList.remove('hidden');
        document.getElementById('custom-bar-name-input').value = '';
        document.getElementById('custom-bar-weight-input').value = '';
        
        // Update unit selection and ARIA states
        document.querySelectorAll('.custom-bar-unit-select').forEach(btn => {
            const isActive = btn.dataset.unit === selectedCustomBarUnit;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive.toString());
        });
        
        // Focus first input for accessibility
        setTimeout(() => {
            document.getElementById('custom-bar-name-input').focus();
        }, 100);
        
        // Push state for back button support
        window.history.pushState({ modal: 'customBar' }, '');
    };
    
    function closeCustomBarModal() {
        document.getElementById('custom-bar-modal').classList.add('hidden');
    }
    
    document.getElementById('close-custom-bar-modal').onclick = () => {
        closeCustomBarModal();
        // Go back in history if we pushed a state
        if (window.history.state && window.history.state.modal) {
            window.history.back();
        }
    };
    
    // Handle browser back button
    window.addEventListener('popstate', (event) => {
        // Check what's open and close in order
        const settingsModal = document.getElementById('settings-modal');
        const customBarModal = document.getElementById('custom-bar-modal');
        const infoDialog = document.getElementById('info-dialog');
        
        // If info dialog is open, close it (it doesn't participate in history)
        // and don't process the back action further - let the modal stay open
        if (!infoDialog.classList.contains('hidden')) {
            closeInfoDialog();
            // Re-push the current modal state since back button removed it
            if (!customBarModal.classList.contains('hidden')) {
                window.history.pushState({ modal: 'customBar' }, '');
            } else if (!settingsModal.classList.contains('hidden')) {
                window.history.pushState({ modal: 'settings' }, '');
            }
            return; // Don't close the modal
        }
        
        // If info dialog wasn't open, proceed with normal back button behavior
        if (!customBarModal.classList.contains('hidden')) {
            closeCustomBarModal();
        } else if (!settingsModal.classList.contains('hidden')) {
            closeSettingsModal();
        }
    });
    
    document.querySelectorAll('.custom-bar-unit-select').forEach(btn => {
        btn.onclick = () => {
            selectedCustomBarUnit = btn.dataset.unit;
            document.querySelectorAll('.custom-bar-unit-select').forEach(b => {
                const isActive = b.dataset.unit === selectedCustomBarUnit;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-checked', isActive.toString());
            });
        };
    });
    
    document.getElementById('save-custom-bar-modal').onclick = () => {
        const name = document.getElementById('custom-bar-name-input').value.trim();
        const weight = parseFloat(document.getElementById('custom-bar-weight-input').value);
        
        // Validate name
        if (!name) {
            alert('Please enter a bar name');
            document.getElementById('custom-bar-name-input').focus();
            return;
        }
        
        if (name.length > 20) {
            alert('Bar name must be 20 characters or less');
            document.getElementById('custom-bar-name-input').focus();
            return;
        }
        
        // Check for duplicate names (case-insensitive)
        if (state.customBars.some(b => b.name.toLowerCase() === name.toLowerCase())) {
            alert('A bar with this name already exists. Please choose a different name.');
            document.getElementById('custom-bar-name-input').focus();
            return;
        }
        
        // Validate weight
        if (isNaN(weight)) {
            alert('Please enter a valid weight');
            document.getElementById('custom-bar-weight-input').focus();
            return;
        }
        
        if (weight <= VALIDATION.MIN_CUSTOM_BAR_WEIGHT) {
            alert(`Weight must be greater than ${VALIDATION.MIN_CUSTOM_BAR_WEIGHT}`);
            document.getElementById('custom-bar-weight-input').focus();
            return;
        }
        
        if (weight > VALIDATION.MAX_CUSTOM_BAR_WEIGHT) {
            alert(`Weight must be ${VALIDATION.MAX_CUSTOM_BAR_WEIGHT} or less`);
            document.getElementById('custom-bar-weight-input').focus();
            return;
        }
        
        // Create preset with unique ID
        const preset = {
            id: `custom-${Date.now()}-${customBarIdCounter++}`,
            name: name,
            weight: weight,
            unit: selectedCustomBarUnit
        };
        
        state.customBars.push(preset);
        save();
        renderCustomBars();
        
        // Close modal and clear history if needed
        document.getElementById('custom-bar-modal').classList.add('hidden');
        if (window.history.state && window.history.state.modal === 'customBar') {
            window.history.back();
        }
    };
    
    document.getElementById('calc-btn').onclick = () => {
        const target = parseFloat(document.getElementById('target-weight-input').value);
        
        let barWeight;
        if (state.bar.startsWith('custom-')) {
            const customBar = state.customBars.find(b => b.id === state.bar);
            barWeight = customBar ? getCustomBarWeight(customBar, state.unit) : 0;
        } else {
            barWeight = DATA[state.unit].bar[state.bar];
        }
        
        if (isNaN(target) || target < barWeight) return;
        
        let rem = (target - barWeight) / 2;
        const result = [];
        const inv = { ...state.inventory[state.unit] };
        
        DATA[state.unit].list.forEach(w => {
            // Only add plates if we have at least 2 available (for both sides)
            // Use epsilon for floating point comparison
            while (rem >= w - VALIDATION.FLOATING_POINT_EPSILON && inv[w] >= 2) { 
                result.push(w); 
                rem = Math.round((rem - w) * 1000) / 1000; // Higher precision rounding
                inv[w] -= 2; // Remove a pair
            }
        });
        
        state.plates = result; 
        updateUI();
    };

    document.querySelectorAll('.unit-select').forEach(b => b.onclick = (e) => {
        state.unit = e.target.dataset.unit; 
        state.plates = [];
        renderInventory(); 
        renderCustomBars(); // Re-render to show live-updated weights
        updateUI(true); // Rebuild controls since unit changed
    });

    document.querySelectorAll('.theme-select').forEach(b => b.onclick = (e) => {
        state.theme = e.target.dataset.theme;
        // Use classList to avoid overwriting other classes like 'settings-open'
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(state.theme);
        updateSettingsHighlights();
        save();
    });

    // Info dialog system
    const infoMessages = {
        unit: {
            title: "Plate & Barbell Type",
            message: "<strong>KG</strong> follows Olympic weightlifting standards for barbells and plates.<br><br><strong>LBS</strong> follows commercial gym standards for barbells and plates."
        },
        standardBar: {
            title: "Standard Barbells",
            message: "<strong>Men's:</strong> 45 lbs / 20 kg<br><br><strong>Women's:</strong> 33 lbs / 15 kg<br><br><strong>No Bar:</strong> 0 lbs / 0 kg"
        },
        customBar: {
            title: "Custom Barbells",
            message: "Custom bars automatically convert between units. A 60 lb bar will show as 27.25 kg when switching to KG mode (or 27.2 kg with Higher Precision enabled)."
        },
        precision: {
            title: "Higher Precision",
            message: "<strong>Off:</strong> Rounds to nearest 0.5 lb / 0.25 kg (practical for most gym plates)<br><br><strong>On:</strong> Shows 0.1 lb / 0.1 kg precision (useful for exact conversions)"
        }
    };

    function showInfoDialog(title, message) {
        const dialog = document.getElementById('info-dialog');
        const titleEl = document.getElementById('info-dialog-title');
        const messageEl = document.getElementById('info-dialog-message');
        
        titleEl.textContent = title;
        messageEl.innerHTML = message;
        dialog.classList.remove('hidden');
        
        // Focus the OK button for keyboard accessibility
        setTimeout(() => {
            document.getElementById('info-dialog-ok').focus();
        }, 100);
        
        // Don't push history state - info dialog is just a simple overlay
        // that should close without affecting navigation
    }

    function closeInfoDialog() {
        document.getElementById('info-dialog').classList.add('hidden');
    }

    // Trap focus within modals for accessibility
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            } else if (e.key === 'Escape') {
                // Close modal on Escape key
                if (element.id === 'settings-modal') {
                    closeSettingsModal();
                    if (window.history.state && window.history.state.modal) {
                        window.history.back();
                    }
                } else if (element.id === 'custom-bar-modal') {
                    closeCustomBarModal();
                    if (window.history.state && window.history.state.modal) {
                        window.history.back();
                    }
                } else if (element.id === 'info-dialog') {
                    closeInfoDialog();
                }
            }
        };

        element.addEventListener('keydown', handleTabKey);
    }

    // Enable focus trapping for all modals
    trapFocus(document.getElementById('settings-modal'));
    trapFocus(document.getElementById('custom-bar-modal'));
    trapFocus(document.getElementById('info-dialog'));

    document.getElementById('close-info-dialog').onclick = () => {
        closeInfoDialog();
    };

    document.getElementById('info-dialog-ok').onclick = () => {
        closeInfoDialog();
    };

    document.getElementById('unit-info-btn').onclick = () => {
        showInfoDialog(infoMessages.unit.title, infoMessages.unit.message);
    };

    document.getElementById('precision-info-btn').onclick = () => {
        showInfoDialog(infoMessages.precision.title, infoMessages.precision.message);
    };

    document.getElementById('standard-bar-info-btn').onclick = () => {
        showInfoDialog(infoMessages.standardBar.title, infoMessages.standardBar.message);
    };

    document.getElementById('custom-bar-info-btn').onclick = () => {
        showInfoDialog(infoMessages.customBar.title, infoMessages.customBar.message);
    };

    // Bar selection click handler - scoped to settings modal for performance
    const settingsModal = document.getElementById('settings-modal');
    settingsModal.addEventListener('click', (e) => {
        const barOption = e.target.closest('.bar-option');
        if (barOption && !e.target.classList.contains('delete-bar-btn')) {
            const barId = barOption.dataset.bar;
            
            // Validate bar exists before selecting
            if (barId) {
                const isValidStandardBar = DATA[state.unit].bar[barId] !== undefined;
                const isValidCustomBar = state.customBars.some(b => b.id === barId);
                
                if (isValidStandardBar || isValidCustomBar) {
                    state.bar = barId;
                    state.plates = [];
                    updateUI();
                } else {
                    console.warn(`Invalid bar selected: ${barId}`);
                }
            }
        }
    });

    document.querySelectorAll('.precision-select').forEach(b => b.onclick = (e) => {
        state.highPrecision = e.target.dataset.precision === 'true';
        renderCustomBars(); // Re-render to update displayed weights
        updateUI();
    });

    document.getElementById('clear-btn').onclick = () => { state.plates = []; updateUI(); };

    // Register service worker for offline support (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

    // Initialize app
    load();
    updateUI(true); // Initial render - this will call buildControls()
});
