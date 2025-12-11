// IMMEDIATE FIX TEST
// Run this in browser console while on /manager/roadmap page

console.log('🔍 Checking if handleDelete exists...');

// Try to find if React component has the function
const checkReactComponent = () => {
    // Get the DOM element
    const deleteButtons = document.querySelectorAll('button');
    console.log(`Found ${deleteButtons.length} buttons on page`);

    // Find delete button
    let deleteBtn = null;
    deleteButtons.forEach(btn => {
        if (btn.textContent.includes('Delete')) {
            console.log('Found Delete button:', btn);
            deleteBtn = btn;
        }
    });

    if (!deleteBtn) {
        console.error('❌ No Delete button found!');
        console.log('Make sure you clicked Edit first to open the edit form');
        return;
    }

    // Check if it has onClick
    console.log('Button element:', deleteBtn);
    console.log('Has onclick?', deleteBtn.onclick);

    // Try clicking programmatically
    console.log('\n🖱️ Attempting programmatic click...');
    deleteBtn.click();
};

checkReactComponent();
