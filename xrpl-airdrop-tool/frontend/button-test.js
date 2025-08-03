// Test if the connect button exists and can be clicked
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Testing button availability...');
    
    const connectBtn = document.getElementById('connect-xaman');
    console.log('Connect button element:', connectBtn);
    
    if (connectBtn) {
        console.log('✅ Connect button found, adding click listener...');
        connectBtn.addEventListener('click', function() {
            console.log('🎯 Connect button clicked!');
            alert('Button click detected! This means the element exists and is clickable.');
        });
    } else {
        console.log('❌ Connect button NOT found');
    }
});
