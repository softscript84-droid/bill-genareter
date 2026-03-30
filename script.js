document.addEventListener('DOMContentLoaded', () => {
    const itemsBody = document.getElementById('items-body');
    const addRowBtn = document.getElementById('add-row');
    const resetBillBtn = document.getElementById('reset-bill');
    const printBillBtn = document.getElementById('print-bill');
    
    // Inputs
    const billDatePicker = document.getElementById('bill-date');
    const billToInput = document.getElementById('bill-to');
    const billRemarks = document.getElementById('bill-remarks');
    const discountInput = document.getElementById('discount-val');
    
    // Displays
    const subTotalDisplay = document.getElementById('sub-total');
    const grandTotalDisplay = document.getElementById('grand-total-val');
    const billNumberSpan = document.getElementById('bill-number');

    // Default Date to Today
    const today = new Date().toISOString().split('T')[0];
    billDatePicker.value = today;

    // Generate random bill number (like the 085 in image)
    const generateBillNumber = () => {
        const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        billNumberSpan.innerText = num;
    };
    generateBillNumber();

    // Default rows from photo
    const defaultItems = [
        "බත්තරමුල්ල",
        "කඩුවෙල",
        "නුගේගොඩ",
        "මාළඹේ",
        "රාජගිරිය",
        "කිරිබත්ගොඩ",
        "වැලිසර"
    ];

    // Template row
    const createRow = (desc = '', rate = '', qty = '', amountVal = '', fixed = false) => {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.innerHTML = `
            <td class="col-desc"><input type="text" class="desc-input" value="${desc}" placeholder="Description" ${fixed ? 'readonly' : ''}>${fixed ? '<span class="lock-icon">🔒</span>' : ''}</td>
            <td class="col-rate"><input type="number" class="rate-input" value="${rate}" placeholder="0.00" min="0" step="0.01"></td>
            <td class="col-qty"><input type="number" class="qty-input" value="${qty}" placeholder="0" min="0" step="0.1"></td>
            <td class="col-amount"><span class="amount-display">${amountVal || '0.00'}</span></td>
            <td class="col-action">${fixed ? '' : '<button class="btn-remove">×</button>'}</td>
        `;
        
        const rateInp = tr.querySelector('.rate-input');
        const qtyInp = tr.querySelector('.qty-input');
        const removeBtn = tr.querySelector('.btn-remove');
        const amountDisplay = tr.querySelector('.amount-display');
        
        const updateRowTotal = () => {
            const r = parseFloat(rateInp.value) || 0;
            const q = parseFloat(qtyInp.value) || 0;
            const amt = r * q;
            amountDisplay.innerText = amt.toLocaleString('en-US', { minimumFractionDigits: 2 });
            calculateGrandTotal();
        };

        rateInp.addEventListener('input', updateRowTotal);
        qtyInp.addEventListener('input', updateRowTotal);
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                tr.remove();
                calculateGrandTotal();
            });
        }

        itemsBody.appendChild(tr);
    };

    const calculateGrandTotal = () => {
        let subtotal = 0;
        document.querySelectorAll('.item-row').forEach(row => {
            const r = parseFloat(row.querySelector('.rate-input').value) || 0;
            const q = parseFloat(row.querySelector('.qty-input').value) || 0;
            subtotal += (r * q);
        });

        const discount = parseFloat(discountInput.value) || 0;
        const grandTotal = subtotal - discount;

        subTotalDisplay.innerText = subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 });
        grandTotalDisplay.innerText = grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 });
        
        saveData();
    };

    const saveData = () => {
        const rows = [];
        document.querySelectorAll('.item-row').forEach(row => {
            const isFixed = row.querySelector('.desc-input').hasAttribute('readonly');
            rows.push({
                desc: row.querySelector('.desc-input').value,
                rate: row.querySelector('.rate-input').value,
                qty: row.querySelector('.qty-input').value,
                amount: row.querySelector('.amount-display').innerText,
                fixed: isFixed
            });
        });

        const data = {
            billTo: billToInput.value,
            date: billDatePicker.value,
            remarks: billRemarks.value,
            discount: discountInput.value,
            rows: rows
        };
        localStorage.setItem('cached_bill', JSON.stringify(data));
    };

    const loadData = () => {
        const saved = localStorage.getItem('cached_bill');
        if (saved) {
            const data = JSON.parse(saved);
            billToInput.value = data.billTo || '';
            billDatePicker.value = data.date || today;
            billRemarks.value = data.remarks || '';
            discountInput.value = data.discount || 0;
            
            if (data.rows && data.rows.length > 0) {
                itemsBody.innerHTML = '';
                data.rows.forEach(r => createRow(r.desc, r.rate, r.qty, r.amount, r.fixed));
            } else {
                defaultItems.forEach(name => createRow(name, '', '', '', true));
            }
        } else {
            defaultItems.forEach(name => createRow(name, '', '', '', true));
        }
        calculateGrandTotal();
    };

    // Actions
    addRowBtn.addEventListener('click', () => {
        createRow();
    });

    resetBillBtn.addEventListener('click', () => {
        if (confirm('Clear entire bill?')) {
            itemsBody.innerHTML = '';
            billToInput.value = '';
            billRemarks.value = '';
            discountInput.value = 0;
            billDatePicker.value = today;
            generateBillNumber();
            createRow();
            calculateGrandTotal();
            localStorage.removeItem('cached_bill');
        }
    });

    printBillBtn.addEventListener('click', () => {
        window.print();
    });

    discountInput.addEventListener('input', calculateGrandTotal);
    billToInput.addEventListener('input', saveData);
    billRemarks.addEventListener('input', saveData);
    billDatePicker.addEventListener('change', saveData);

    // Meal Selector Logic
    const setMealType = (type, rate) => {
        billToInput.value = type;
        document.querySelectorAll('.item-row').forEach(row => {
            const rateInp = row.querySelector('.rate-input');
            const qtyInp = row.querySelector('.qty-input');
            rateInp.value = rate;
            
            // Recalculate each row's display
            const r = parseFloat(rateInp.value) || 0;
            const q = parseFloat(qtyInp.value) || 0;
            const amt = r * q;
            row.querySelector('.amount-display').innerText = amt.toLocaleString('en-US', { minimumFractionDigits: 2 });
        });
        calculateGrandTotal();
        saveData();
    };

    document.getElementById('set-diner').addEventListener('click', () => setMealType('Diner', 200));
    document.getElementById('set-lunch').addEventListener('click', () => setMealType('Lunch', 250));

    loadData();
});
