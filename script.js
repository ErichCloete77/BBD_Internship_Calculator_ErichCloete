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
                    display.value = 'Error: ' + e.message;
                }
            } else {
                display.value += value;
            }
            display.scrollLeft = display.scrollWidth;
        });
    });

    function insertImplicitMultiplication(expr) {
        // Insert '*' between a number and a function or constant (e.g., '2sin' => '2*sin')
        expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');

        // Insert '*' between a closing parenthesis and a number or function (e.g., ')3' => ')*3', ')sin' => ')*sin')
        expr = expr.replace(/(\))(\d|[a-zA-Z])/g, '$1*$2');

        return expr;
    }

    function evaluateExpression(expr) {
        // Replace symbols with JavaScript operators
        let sanitizedExpr = expr.replace(/÷/g, '/')
                                .replace(/x/g, '*')
                                .replace(/−/g, '-')
                                .replace(/\^/g, '^')
                                .replace(/π/g, 'π') // Keep π as a symbol for now
                                .replace(/sin\(/g, 'sin(')
                                .replace(/cos\(/g, 'cos(')
                                .replace(/tan\(/g, 'tan(')
                                .replace(/ln\(/g, 'ln(')
                                .replace(/log\(/g, 'log(');

        // Replace constants with their numeric values
        sanitizedExpr = sanitizedExpr.replace(/π/g, '3.141592653589793');

        // Insert implicit multiplication where necessary
        sanitizedExpr = insertImplicitMultiplication(sanitizedExpr);

        // Validate the expression: Allow numbers, operators, parentheses, and functions
        if (/[^0-9+\-*/().3.1415926535897932.718281828459045sincostanloglne^*]/.test(sanitizedExpr)) {
            throw new Error('Invalid characters in expression');
        }

        // Compute the result using the custom evaluate function
        return evaluate(sanitizedExpr);
    }

    function evaluate(str) {
        function splitString(str) {
            const tokens = [];
            let numberBuffer = '';
            let funcBuffer = '';

            for (let i = 0; i < str.length; i++) {
                const char = str[i];

                if (/\d|\./.test(char)) { // If the character is a digit or a decimal point
                    numberBuffer += char;
                } else if (/[a-z]/i.test(char)) { // If the character is a letter (function or constant)
                    funcBuffer += char;
                } else if ("+-*/^()".includes(char)) { // If the character is an operator or parenthesis
                    if (numberBuffer) {
                        tokens.push(numberBuffer);
                        numberBuffer = '';
                    }
                    if (funcBuffer) {
                        tokens.push(funcBuffer);
                        funcBuffer = '';
                    }
                    tokens.push(char);
                } else {
                    throw new Error('Invalid character in expression');
                }
            }

            // Push any remaining buffers
            if (numberBuffer) {
                tokens.push(numberBuffer);
            }
            if (funcBuffer) {
                tokens.push(funcBuffer);
            }

            return tokens;
        }

        function parseTokens(tokens) {
            const outputQueue = [];
            const operatorStack = [];
            const operators = {
                '^': { precedence: 4, associativity: 'Right' },
                '*': { precedence: 3, associativity: 'Left' },
                '/': { precedence: 3, associativity: 'Left' },
                '+': { precedence: 2, associativity: 'Left' },
                '-': { precedence: 2, associativity: 'Left' }
            };
            const functions = ['sin', 'cos', 'tan', 'log', 'ln'];

            tokens.forEach(token => {
                if (!isNaN(token)) { // If token is a number
                    outputQueue.push(parseFloat(token));
                } else if (functions.includes(token)) { // If token is a function
                    operatorStack.push(token);
                } else if ("+-*/^".includes(token)) { // If token is an operator
                    while (operatorStack.length) {
                        const top = operatorStack[operatorStack.length - 1];
                        if (
                            ("+-*/^".includes(top) &&
                                ((operators[token].associativity === 'Left' &&
                                    operators[token].precedence <= operators[top].precedence) ||
                                    (operators[token].associativity === 'Right' &&
                                        operators[token].precedence < operators[top].precedence)))
                        ) {
                            outputQueue.push(operatorStack.pop());
                        } else {
                            break;
                        }
                    }
                    operatorStack.push(token);
                } else if (token === '(') { // If token is a left parenthesis
                    operatorStack.push(token);
                } else if (token === ')') { // If token is a right parenthesis
                    while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                        outputQueue.push(operatorStack.pop());
                    }
                    operatorStack.pop(); // Remove '('
                    if (operatorStack.length && functions.includes(operatorStack[operatorStack.length - 1])) {
                        outputQueue.push(operatorStack.pop());
                    }
                }
            });

            while (operatorStack.length) {
                outputQueue.push(operatorStack.pop());
            }

            return outputQueue;
        }

        function evaluateRPN(rpn) {
            const stack = [];
            rpn.forEach(token => {
                if (typeof token === 'number') {
                    stack.push(token);
                } else if (["+", "-", "*", "/", "^"].includes(token)) {
                    const b = stack.pop();
                    const a = stack.pop();
                    if (a === undefined || b === undefined) {
                        throw new Error('Insufficient operands');
                    }
                    switch (token) {
                        case '+': stack.push(a + b); break;
                        case '-': stack.push(a - b); break;
                        case '*': stack.push(a * b); break;
                        case '/': 
                            if (b === 0) {
                                throw new Error('Division by zero');
                            }
                            stack.push(a / b); 
                            break;
                        case '^': stack.push(Math.pow(a, b)); break;
                    }
                } else if (["sin", "cos", "tan", "log", "ln"].includes(token)) {
                    const a = stack.pop();
                    if (a === undefined) {
                        throw new Error(`Insufficient operands for function '${token}'`);
                    }
                    switch (token) {
                        case 'sin': 
                            stack.push(Math.sin(a * Math.PI / 180)); // Convert degrees to radians
                            break;
                        case 'cos': 
                            stack.push(Math.cos(a * Math.PI / 180));
                            break;
                        case 'tan': 
                            stack.push(Math.tan(a * Math.PI / 180));
                            break;
                        case 'log': 
                            if (a <= 0) {
                                throw new Error('Logarithm of non-positive number');
                            }
                            stack.push(Math.log10(a)); 
                            break;
                        case 'ln':
                            if (a <= 0) {
                                throw new Error('Natural logarithm of non-positive number');
                            }
                            stack.push(Math.log(a)); 
                            break;
                    }
                }
            });
            if (stack.length !== 1) {
                throw new Error('Invalid expression');
            }
            return stack[0];
        }

        const tokens = splitString(str);
        const rpn = parseTokens(tokens);
        const result = evaluateRPN(rpn);
        return result;
    }
});
