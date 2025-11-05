const originalIndex = db.findIndex(item =>
item.Budget === r.Budget &&
item.Description === r.Description &&
item.Expenses === r.Expenses &&
item.Date === r.Date
);
