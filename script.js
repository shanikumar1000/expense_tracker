// Daily Micro-Expense Tracker - Main Script
// Storage key for localStorage
const STORAGE_KEY = 'dailyExpenses';

// Get all expenses from localStorage
function getExpenses() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Save expenses to localStorage
function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// Format currency in INR
function formatCurrency(amount) {
    return `₹${parseFloat(amount).toFixed(2)}`;
}

// Get formatted date string (DD MMM YYYY)
function formatDate(date) {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// Get month-year string (MMM YYYY)
function formatMonth(date) {
    const options = { month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// Get date string for comparison (YYYY-MM-DD)
function getDateString(date) {
    return date.toISOString().split('T')[0];
}

// Get month-year string for comparison (YYYY-MM)
function getMonthString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Check if two dates are the same day
function isSameDay(date1, date2) {
    return getDateString(date1) === getDateString(date2);
}

// Check if date is in current month
function isCurrentMonth(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    return getMonthString(date) === getMonthString(today);
}

// Update header with current date and month
function updateHeader() {
    const today = new Date();
    document.getElementById('todayDate').textContent = formatDate(today);
    document.getElementById('currentMonth').textContent = formatMonth(today);
}

// Add new expense
function addExpense(name, amount, category) {
    const expenses = getExpenses();
    const expense = {
        id: Date.now(),
        name: name.trim(),
        amount: parseFloat(amount),
        category: category,
        date: getDateString(new Date()),
        timestamp: new Date().toISOString()
    };
    expenses.push(expense);
    saveExpenses(expenses);
    return expense;
}

// Delete expense by ID
function deleteExpense(id) {
    const expenses = getExpenses();
    const filtered = expenses.filter(exp => exp.id !== id);
    saveExpenses(filtered);
}

// Get today's expenses
function getTodayExpenses() {
    const expenses = getExpenses();
    const today = new Date();
    return expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return isSameDay(expDate, today);
    });
}

// Get current month expenses
function getCurrentMonthExpenses() {
    const expenses = getExpenses();
    return expenses.filter(exp => isCurrentMonth(exp.date));
}

// Calculate total amount
function calculateTotal(expenses) {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}

// Render today's ledger
function renderTodayLedger() {
    const todayExpenses = getTodayExpenses();
    const tbody = document.getElementById('ledgerBody');
    const todayTotal = document.getElementById('todayTotal');

    if (todayExpenses.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="4">No expenses recorded today</td></tr>';
        todayTotal.textContent = formatCurrency(0);
        return;
    }

    const total = calculateTotal(todayExpenses);
    todayTotal.textContent = formatCurrency(total);

    tbody.innerHTML = todayExpenses.map(exp => `
        <tr>
            <td>${exp.name}</td>
            <td><span class="category-badge category-${exp.category}">${exp.category}</span></td>
            <td><strong>${formatCurrency(exp.amount)}</strong></td>
            <td><button class="btn-delete" onclick="handleDelete(${exp.id})">Delete</button></td>
        </tr>
    `).join('');
}

// Calculate monthly summary
function renderMonthlySummary() {
    const monthExpenses = getCurrentMonthExpenses();
    const total = calculateTotal(monthExpenses);

    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const avgDaily = currentDay > 0 ? total / currentDay : 0;
    const projected = avgDaily * daysInMonth;

    document.getElementById('monthTotal').textContent = formatCurrency(total);
    document.getElementById('avgDaily').textContent = formatCurrency(avgDaily);
    document.getElementById('projected').textContent = formatCurrency(projected);

    if (total > 0) {
        document.getElementById('projectionText').textContent =
            `At this rate, your estimated monthly spend is ${formatCurrency(projected)}.`;
    } else {
        document.getElementById('projectionText').textContent = '';
    }
}

// Render category breakdown
function renderCategoryBreakdown() {
    const monthExpenses = getCurrentMonthExpenses();
    const container = document.getElementById('categoryBreakdown');

    if (monthExpenses.length === 0) {
        container.innerHTML = '<p class="empty-state">No expenses recorded this month</p>';
        return;
    }

    const categoryTotals = {};
    monthExpenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const highestCategory = categories[0][0];

    container.innerHTML = categories.map(([category, total]) => {
        const isHighest = category === highestCategory;
        return `
            <div class="category-item ${isHighest ? 'highest' : ''}">
                <span class="category-name">
                    <span class="category-badge category-${category}">${category}</span>
                    ${isHighest ? '<span class="highest-badge">HIGHEST</span>' : ''}
                </span>
                <span class="category-amount">${formatCurrency(total)}</span>
            </div>
        `;
    }).join('');
}

// Generate red-flag insights
function renderInsights() {
    const todayExpenses = getTodayExpenses();
    const monthExpenses = getCurrentMonthExpenses();
    const container = document.getElementById('insightsContainer');
    const insights = [];

    if (monthExpenses.length === 0) {
        container.innerHTML = '<p class="empty-state">No insights yet. Start tracking expenses!</p>';
        return;
    }

    const todayTotal = calculateTotal(todayExpenses);
    const monthTotal = calculateTotal(monthExpenses);
    const today = new Date();
    const currentDay = today.getDate();
    const avgDaily = currentDay > 0 ? monthTotal / currentDay : 0;

    if (todayTotal > avgDaily && avgDaily > 0) {
        insights.push('You spent more than your daily average today.');
    }

    const categoryTotals = {};
    monthExpenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (categories.length > 0) {
        insights.push(`${categories[0][0]} expenses are your highest spending category.`);
    }

    const expensesByDate = {};
    monthExpenses.forEach(exp => {
        expensesByDate[exp.date] = (expensesByDate[exp.date] || 0) + exp.amount;
    });

    const highSpendingDays = Object.entries(expensesByDate).filter(([date, total]) =>
        total > avgDaily * 1.5
    );

    if (highSpendingDays.length >= 3) {
        insights.push('High spending detected on multiple days this month.');
    }

    if (todayTotal > 500) {
        insights.push('Today\'s spending exceeds ₹500.');
    }

    if (insights.length === 0) {
        insights.push('Your spending is under control. Keep tracking!');
    }

    container.innerHTML = insights.map(insight =>
        `<div class="insight-item">${insight}</div>`
    ).join('');
}

// Refresh all UI components
function refreshUI() {
    renderTodayLedger();
    renderMonthlySummary();
    renderCategoryBreakdown();
    renderInsights();
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('expenseName').value;
    const amount = document.getElementById('expenseAmount').value;
    const category = document.getElementById('expenseCategory').value;

    if (!name || !amount || parseFloat(amount) <= 0) {
        alert('Please enter valid expense details');
        return;
    }

    addExpense(name, amount, category);
    e.target.reset();
    refreshUI();
}

// Handle delete expense
function handleDelete(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        deleteExpense(id);
        refreshUI();
    }
}

// Initialize app
function init() {
    updateHeader();
    refreshUI();

    const form = document.getElementById('expenseForm');
    form.addEventListener('submit', handleFormSubmit);
}

document.addEventListener('DOMContentLoaded', init);
