// Simple CORS test script
async function testCORS() {
    const API_URL = 'https://spirit-scroll-api.rivai22purba.workers.dev/api/check-all';
    
    console.log('Testing CORS for:', API_URL);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:');
        for (let [key, value] of response.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', data);
        } else {
            console.log('Response not OK:', response.statusText);
        }
    } catch (error) {
        console.error('CORS Error:', error.message);
    }
}

testCORS();