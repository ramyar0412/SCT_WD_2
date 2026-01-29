class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.history = [];
        this.soundEnabled = true;
        this.reset();
        this.loadHistory();
    }

    reset() {
        this.currentOperand = '';
        this.previousOperand = '';
        this.operation = undefined;
    }

    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        this.playSound(600, 0.1);
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        this.currentOperand = this.currentOperand.toString() + number.toString();
        this.playSound(800, 0.1);
    }

    selectOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
        this.playSound(1000, 0.15);
    }

    compute() {
        let result;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        const expression = `${this.previousOperand} ${this.operation} ${this.currentOperand}`;
        
        switch (this.operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '×':
                result = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    this.showError('Cannot divide by zero');
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }
        
        result = Math.round(result * 100000000) / 100000000;
        this.addToHistory(expression, result);
        this.currentOperand = result;
        this.operation = undefined;
        this.previousOperand = '';
        this.playSound(1200, 0.2);
        this.celebrate();
    }

    showError(message) {
        const originalText = this.currentOperandElement.textContent;
        this.currentOperandElement.textContent = 'Error';
        this.currentOperandElement.style.color = '#fc8181';
        this.playSound(200, 0.3);
        
        setTimeout(() => {
            alert(message);
            this.reset();
            this.updateDisplay();
            this.currentOperandElement.style.color = '#fff';
        }, 100);
    }

    celebrate() {
        this.currentOperandElement.style.animation = 'none';
        setTimeout(() => {
            this.currentOperandElement.style.animation = 'fadeIn 0.3s ease';
        }, 10);
    }

    playSound(frequency, duration) {
        if (!this.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    addToHistory(expression, result) {
        const historyItem = {
            expression,
            result,
            timestamp: new Date().toLocaleTimeString()
        };
        this.history.unshift(historyItem);
        
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        this.saveHistory();
        this.updateHistoryDisplay();
    }

    saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('calculatorHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No calculations yet</div>';
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item" data-result="${item.result}">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${this.formatDisplayNumber(item.result)}</div>
            </div>
        `).join('');
        
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentOperand = item.dataset.result;
                this.updateDisplay();
                this.playSound(900, 0.15);
            });
        });
    }

    formatDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', {
                maximumFractionDigits: 0
            });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandElement.textContent = 
            this.currentOperand === '' ? '0' : this.formatDisplayNumber(this.currentOperand);
        
        if (this.operation != null) {
            this.previousOperandElement.textContent = 
                `${this.formatDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.textContent = '';
        }
    }
}

// Initialize calculator
const previousOperandElement = document.getElementById('previousOperand');
const currentOperandElement = document.getElementById('currentOperand');
const calc = new Calculator(previousOperandElement, currentOperandElement);

// Get all buttons
const numberButtons = document.querySelectorAll('[data-number]');
const operatorButtons = document.querySelectorAll('[data-operator]');
const clearButton = document.querySelector('[data-action="clear"]');
const deleteButton = document.querySelector('[data-action="delete"]');
const equalsButton = document.querySelector('[data-action="equals"]');

// Button animation function
function addButtonAnimation(button) {
    button.classList.add('pressed');
    setTimeout(() => button.classList.remove('pressed'), 300);
}

// Number button event listeners
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calc.appendNumber(button.dataset.number);
        calc.updateDisplay();
        addButtonAnimation(button);
    });
});

// Operator button event listeners
operatorButtons.forEach(button => {
    button.addEventListener('click', () => {
        calc.selectOperation(button.dataset.operator);
        calc.updateDisplay();
        addButtonAnimation(button);
    });
});

// Clear button event listener
clearButton.addEventListener('click', () => {
    calc.reset();
    calc.updateDisplay();
    calc.playSound(400, 0.2);
    addButtonAnimation(clearButton);
});

// Delete button event listener
deleteButton.addEventListener('click', () => {
    calc.delete();
    calc.updateDisplay();
    addButtonAnimation(deleteButton);
});

// Equals button event listener
equalsButton.addEventListener('click', () => {
    calc.compute();
    calc.updateDisplay();
    addButtonAnimation(equalsButton);
});

// Clear history button event listener
document.getElementById('clearHistory').addEventListener('click', () => {
    calc.clearHistory();
    calc.playSound(500, 0.2);
});

// Sound toggle event listener
const soundToggle = document.getElementById('soundToggle');
soundToggle.addEventListener('click', () => {
    calc.soundEnabled = !calc.soundEnabled;
    soundToggle.textContent = calc.soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
    if (calc.soundEnabled) {
        calc.playSound(800, 0.15);
    }
});

// Theme switcher event listeners
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.body.className = theme === 'purple' ? '' : theme;
        
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        calc.playSound(1000, 0.15);
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9' || e.key === '.') {
        calc.appendNumber(e.key);
        calc.updateDisplay();
        const btn = document.querySelector(`[data-number="${e.key}"]`);
        if (btn) addButtonAnimation(btn);
    } else if (e.key === '+' || e.key === '-') {
        calc.selectOperation(e.key);
        calc.updateDisplay();
        const btn = document.querySelector(`[data-operator="${e.key}"]`);
        if (btn) addButtonAnimation(btn);
    } else if (e.key === '*') {
        calc.selectOperation('×');
        calc.updateDisplay();
        const btn = document.querySelector(`[data-operator="×"]`);
        if (btn) addButtonAnimation(btn);
    } else if (e.key === '/') {
        e.preventDefault();
        calc.selectOperation('÷');
        calc.updateDisplay();
        const btn = document.querySelector(`[data-operator="÷"]`);
        if (btn) addButtonAnimation(btn);
    } else if (e.key === 'Enter' || e.key === '=') {
        calc.compute();
        calc.updateDisplay();
        addButtonAnimation(equalsButton);
    } else if (e.key === 'Escape') {
        calc.reset();
        calc.updateDisplay();
        calc.playSound(400, 0.2);
        addButtonAnimation(clearButton);
    } else if (e.key === 'Backspace') {
        calc.delete();
        calc.updateDisplay();
        addButtonAnimation(deleteButton);
    }
});

// Initialize display
calc.updateDisplay();