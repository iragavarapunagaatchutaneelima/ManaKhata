async function run() {
  try {
    const res = await fetch('http://localhost:8080/api/expenses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: 100,
            description: 'Test',
            category: 'FOOD',
            expenseType: 'VARIABLE',
            expenseDate: '2024-05-22'
        })
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
run();
