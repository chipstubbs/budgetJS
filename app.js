const budgetController = (function() {
    
    const Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
       return this.percentage;
    };
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    const Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    const calculateTotal = (type) => {
        let sum = 0;
        data.items[type].forEach(item => {
            sum += item.value;
        });

        data.totals[type] = sum;
    };

    const data = {
        items: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percent: -1
    };

    return {
        addItem: (type, desc, val) => {
            let newItem, ID;

            // Create unique ID
            if (data.items[type].length > 0) {
                ID = data.items[type][data.items[type].length - 1].id + 1;
            } else { ID = 0 }
            
            // Create new Item for exp||inc
            if (type === 'exp') {
                newItem = new Expense(ID, desc, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, desc, val);
            }
            
            // Add to our data structure
            data.items[type].push(newItem);

            // Return the added item
            return newItem;
        },
        deleteItem: (type, id) => {
            let idToDelete = data.items[type].findIndex(item => item.id === id);
            data.items[type].splice(idToDelete,1);
        },
        calculateBudget: () => {
            // Calculate Budget
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate percentage of income exp/inc
            data.percent = (data.totals.inc > 0) ? Math.round((data.totals.exp / data.totals.inc) * 100) : -1;

        },
        calculatePercentages: () => {
            data.items.exp.forEach(exp => {
                exp.calcPercentage(data.totals.inc);
            });
        },
        getPercentages: () => {
            let allPerc = data.items.exp.map(expense => {
                return expense.getPercentage();
            });
            return allPerc;
        },
        getBudget: () => {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },
        testing: () => { return data }
    };
})();

const UIController = (function() {
    const DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputButton: '.add__btn',
        incomeList: '.income__list',
        expenseList: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        month: '.budget__title--month'
    };


    return {
        getInput: function() {
            const type = document.querySelector(DOMstrings.inputType).value; // inc || exp
            const desc = document.querySelector(DOMstrings.inputDescription).value;
            const value = parseFloat(document.querySelector(DOMstrings.inputValue).value);

            return { type, desc, value };
        },
        addListItem: (obj, type) => {
            let html, element;
            // Create HTML string with placeholder
            if (type === 'inc') {
                element = DOMstrings.incomeList;
                html = `
                <div class="item clearfix" id="inc-${obj.id}">
                    <div class="item__description">${obj.description}</div>
                    <div class="right clearfix">
                        <div class="item__value">${obj.value}</div>
                        <div class="item__delete">
                            <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                        </div>
                    </div>
                </div>`;
            } else if (type === 'exp') {
                element = DOMstrings.expenseList;
                html = `
                <div class="item clearfix" id="exp-${obj.id}">
                    <div class="item__description">${obj.description}</div>
                    <div class="right clearfix">
                        <div class="item__value">${obj.value}</div>
                        <div class="item__percentage">21%</div>
                        <div class="item__delete">
                            <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                        </div>
                    </div>
                </div>`;
            }

            document.querySelector(element).insertAdjacentHTML('beforeend', html);
        },
        deleteListItem: (elementID) => {
            document.getElementById(elementID).remove();
            // Polyfill available on mozilla (parentNode.removeChild(element)) for IE
        },
        clearFields: () => {
            let fields = document.querySelectorAll(DOMstrings.inputDescription + ',' + DOMstrings.inputValue);
            fields.forEach(field => {
                field.value = '';
            });
            // Put cursor focus back on description
            fields[0].focus();
        },
        updateUI: (budget) => {
            document.querySelector(DOMstrings.budgetLabel).textContent = (budget.budget).toFixed(2);
            document.querySelector(DOMstrings.incomeLabel).textContent = (budget.totalInc).toFixed(2);
            document.querySelector(DOMstrings.expenseLabel).textContent = (budget.totalExp).toFixed(2);
            document.querySelector(DOMstrings.percentageLabel).textContent = (budget.percentage > 0) ? budget.percentage + '%' : '---';
        },
        setMonth: () => {
            document.querySelector(DOMstrings.month).textContent = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
        },
        getDOMstrings: () => { return DOMstrings; }
    };
})();

const controller = (function(budgetCtrl, UICtrl) {  
    const setupEventListeners = function() {
        const DOM = UICtrl.getDOMstrings();
        const checkButton = document.querySelector(DOM.inputButton);

        // Event listeners
        checkButton.addEventListener('click', ctrlAddItem);
        document.addEventListener('keypress', (e) => {
            if (e.key !== 'Enter' || event.which !== 13) return;
            ctrlAddItem();
        });
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
    };
    

    // Logic
    const updateBudget = () => {
        // Calculate the budget
        budgetCtrl.calculateBudget();

        // Return the budget
        const budget = budgetCtrl.getBudget();

        // Display to UI
        UICtrl.updateUI(budget);
    };

    const updatePercentages = () => {
        // Calculate
        budgetCtrl.calculatePercentages();

        // Read them from budget controller
        let percentages = budgetCtrl.getPercentages();

        // Update UI
        console.log('percentage', percentages);
    };

    const ctrlAddItem = function() {
        // Get input data from UI controller
        const input = UICtrl.getInput();
        
        if (input.desc !== '' && !isNaN(input.value) && input.value > 0) {
            // Add items to budget controller
            const newItem = budgetCtrl.addItem(input.type, input.desc, input.value);

            // Add item to UI
            UICtrl.addListItem(newItem, input.type);
            UICtrl.clearFields();

            // Update budget
            updateBudget();
            updatePercentages();
        }

        
    };

    const ctrlDeleteItem = event => {
        const itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if (!itemID) return;
        const type = itemID.split('-')[0];
        const ID = parseInt(itemID.split('-')[1]);

        // Delete from our data 
        budgetCtrl.deleteItem(type, ID);
        // Update List UI 
        UICtrl.deleteListItem(itemID);
        // Upate Budget UI
        updateBudget();
    }
    
    
    return {
        init: () => {
            setupEventListeners();
            UICtrl.setMonth();
            UICtrl.updateUI({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
        }
    };

})(budgetController, UIController);

controller.init();