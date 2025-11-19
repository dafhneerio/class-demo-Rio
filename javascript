// Key for localStorage
const DB_KEY = 'students_db_v1';
let db = [];

// Show/hide sections
function showSection(sectionId, clickedElement) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden-section');
    });
    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) selectedSection.classList.remove('hidden-section');

    document.querySelectorAll('.sidebar ul li a').forEach(link => link.classList.remove('active'));
    if (clickedElement) clickedElement.classList.add('active');

    if (sectionId === 'trackerSection' || sectionId === 'summarySection') {
        displayRecords();
    }
}

// Load database from localStorage
function loadDB() {
    const raw = localStorage.getItem(DB_KEY);
    db = raw ? JSON.parse(raw) : [];

    const trackerLink = document.querySelector('.sidebar ul li a[onclick*="trackerSection"]');
    if (trackerLink) {
        showSection('trackerSection', trackerLink);
    } else {
        showSection('homeSection', document.querySelector('.sidebar ul li a'));
    }
}

// Save database to localStorage
function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Calculate total budget, expenses, and remaining balance
function calculateBalance() {
    let totalBudget = 0;
    let totalExpenses = 0;

    db.forEach(r => {
        totalBudget += parseFloat(r.Budget || 0);
        totalExpenses += parseFloat(r.Expenses || 0);
    });

    const remaining = totalBudget - totalExpenses;
    return { totalBudget, totalExpenses, remaining };
}

// Automatically generate End Date based on Start Date and Period Type
function autoSetEndDate() {
    const type = document.getElementById("periodType").value;
    const start = document.getElementById("startDateInput").value;
    const endInput = document.getElementById("endDateInput");

    if (!start || !type) return;

    const startDate = new Date(start);
    let endDate = new Date(start);

    if (type === "daily") {
        endDate = startDate;
    } else if (type === "weekly") {
        endDate.setDate(startDate.getDate() + 6);
    } else if (type === "monthly") {
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(startDate.getDate() - 1);
    } else if (type === "yearly") {
        endDate.setFullYear(startDate.getFullYear() + 1);
        endDate.setDate(startDate.getDate() - 1);
    } else if (type === "custom") {
        return; // do nothing, user will set manually
    }

    endInput.value = endDate.toISOString().split("T")[0];
}

// Display all records in summary
function displayRecords() {
    const summaryTable = document.getElementById('summaryTable');
    summaryTable.innerHTML = '<tr><th>Budget</th><th>Description</th><th>Category</th><th>Spending</th><th>Period</th><th>Start</th><th>End</th><th>Action</th></tr>';

    const { totalBudget, totalExpenses, remaining } = calculateBalance();

    const sortedDb = [...db].sort((a, b) => new Date(b.StartDate) - new Date(a.StartDate));

    sortedDb.forEach((r) => {
        const originalIndex = db.findIndex(item =>
            item.Budget === r.Budget &&
            item.Description === r.Description &&
            item.Expenses === r.Expenses &&
            item.StartDate === r.StartDate &&
            item.EndDate === r.EndDate
        );

        const rowHTML = `<tr>
            <td>₱${parseFloat(r.Budget || 0).toFixed(2)}</td>
            <td>${r.Description}</td>
            <td>${r.Category}</td>
            <td>₱${parseFloat(r.Expenses || 0).toFixed(2)}</td>
            <td>${r.PeriodType}</td>
            <td>${r.StartDate}</td>
            <td>${r.EndDate}</td>
            <td>
                <button onclick="editRecord(${originalIndex})">Edit</button>
                <button onclick="deleteRecord(${originalIndex})">Delete</button>
            </td>
        </tr>`;

        summaryTable.innerHTML += rowHTML;
    });

    document.getElementById('currentBalanceAmount').innerText = remaining.toFixed(2);

    document.getElementById('quickSummary').innerHTML = `
        <p>Total Budget: ₱${totalBudget.toFixed(2)} | Total Expenses: ₱${totalExpenses.toFixed(2)}</p>
        <p>Remaining Balance: ₱${remaining.toFixed(2)}</p>
    `;

    document.getElementById('summaryTable').style.display = db.length > 0 ? 'table' : 'none';
}

// Save a new record
function saveRecord() {
    const Budget = parseFloat(document.getElementById('budgetInput').value);
    const Description = document.getElementById('descriptionInput').value.trim();
    const Category = document.getElementById('categoryInput').value;
    const Expenses = parseFloat(document.getElementById('expensesInput').value);
    const PeriodType = document.getElementById('periodType').value;
    const StartDate = document.getElementById('startDateInput').value;
    const EndDate = document.getElementById('endDateInput').value;

    if (!Description || !Category || isNaN(Expenses) || !PeriodType || !StartDate || !EndDate) {
        alert("Please complete all fields including budget period and dates.");
        return;
    }

    if (isNaN(Budget)) {
        alert("Please enter a valid budget.");
        return;
    }

    if (new Date(StartDate) > new Date(EndDate)) {
        alert("Start date cannot be later than end date.");
        return;
    }

    // Check if expense is greater than budget
    if (Expenses > Budget) {
        alert("Expense cannot be greater than Budget!");
        return;
    }

    const newRecord = {
        Budget: Budget.toFixed(2),
        Description,
        Category,
        Expenses: Expenses.toFixed(2),
        PeriodType,
        StartDate,
        EndDate
    };

    db.push(newRecord);
    saveDB();
    document.getElementById('recordForm').reset();
    displayRecords();
}

// Edit existing record
function editRecord(index) {
    const record = db[index];
    document.getElementById('budgetInput').value = record.Budget;
    document.getElementById('descriptionInput').value = record.Description;
    document.getElementById('categoryInput').value = record.Category;
    document.getElementById('expensesInput').value = record.Expenses;
    document.getElementById('periodType').value = record.PeriodType;
    document.getElementById('startDateInput').value = record.StartDate;
    document.getElementById('endDateInput').value = record.EndDate;

    if (confirm("Editing this record will remove it from history. Continue?")) {
        db.splice(index, 1);
        saveDB();
        displayRecords();
    }
}

// Delete a record
function deleteRecord(index) {
    if (!confirm("Delete this record?")) return;
    db.splice(index, 1);
    saveDB();
    displayRecords();
}

// Setup input validation to prevent expense > budget immediately
function setupInputValidation() {
    const budgetInput = document.getElementById('budgetInput');
    const expensesInput = document.getElementById('expensesInput');

    expensesInput.addEventListener('input', () => {
        const budgetValue = parseFloat(budgetInput.value) || 0;
        const expenseValue = parseFloat(expensesInput.value) || 0;

        if (expenseValue > budgetValue) {
            alert("Expense cannot be greater than Budget!");
            expensesInput.value = "";  // Clear invalid input
        }
    });
}

// Initialize after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    loadDB();
    setupInputValidation();
});
