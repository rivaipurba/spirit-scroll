// Test creating a new media entry
const API_BASE = 'https://spirit-scroll-api.rivai22purba.workers.dev/api';

async function testCreateEntry() {
    console.log('Testing media entry creation...\n');
    
    const testEntry = {
        title: "Test Entry " + Date.now(),
        type: "MANHUA",
        currentChapter: 1,
        totalChapters: 100,
        status: "READING"
    };
    
    try {
        console.log('Creating entry:', testEntry);
        
        const response = await fetch(`${API_BASE}/media`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testEntry)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (response.ok) {
            try {
                const result = JSON.parse(responseText);
                console.log('✅ Entry created successfully:', result);
            } catch (e) {
                console.log('Response is not valid JSON but status is OK');
            }
        } else {
            console.log('❌ Failed to create entry');
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testCreateEntry();