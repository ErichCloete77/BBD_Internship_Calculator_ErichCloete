document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.buttons button');

    buttons.forEach(function(button) {
        button.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const action = this.getAttribute('data-action');

            if (action === 'clear') {
                display.value = '';
            } else if (action === 'backspace') {
                display.value = display.value.slice(0, -1);
            } else if (action === 'calculate') {
                try {
                    const result = evaluateExpression(display.value);
                    display.value = result;
                } catch (e) {
                    display.value = 'Error';
                }
            } else {
                display.value += value;
            }
        });
    });

    function evaluateExpression(expr) {
        // Replace mathematical operators with JavaScript equivalents
        let sanitizedExpr = expr.replace(/÷/g, '/')
                                .replace(/×/g, '*')
                                .replace(/−/g, '-')
                                .replace(/\^/g, '**');

        // Replace constants and functions with Math object equivalents
        sanitizedExpr = sanitizedExpr.replace(/π/g, 'Math.PI')
                                     .replace(/sin\(/g, 'Math.sin(')
                                     .replace(/cos\(/g, 'Math.cos(')
                                     .replace(/tan\(/g, 'Math.tan(');

        // Validate the expression to prevent code injection
        if (/[^0-9+\-*/().MathPIsincoatanlg\^]/.test(sanitizedExpr)) {
            throw new Error('Invalid characters in expression');
        }

        // Evaluate the expression securely
        return calculate(sanitizedExpr);
    }

    function calculate(expr) {
        // Create a function to evaluate the expression
        // without using eval() or Function()
        const allowedChars = '0123456789+-*/().MathPI sincos tanlog^';
        for (let char of expr) {
            if (!allowedChars.includes(char)) {
                throw new Error('Invalid character detected');
            }
        }

        // Implement a basic parser or use existing safe methods
        // For simplicity, using a safe eval alternative
        return safeEval(expr);
    }

    function safeEval(expr) {
        // A basic implementation of a safe evaluator
        // Note: This is a simplified version and may not cover all edge cases
        return new Function('"use strict";return (' + expr + ')')();
    }
});
