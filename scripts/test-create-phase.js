/**
 * Test script to verify backend receives and processes roadmap phase creation
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function testCreatePhase() {
    console.log('🧪 Testing Roadmap Phase Creation...\n');

    // Step 1: Login to get auth token
    console.log('Step 1: Logging in as manager...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'manager@jobpromax.com',
            password: 'manager123'
        })
    });

    if (!loginResponse.ok) {
        console.error('❌ Login failed:', loginResponse.status, loginResponse.statusText);
        const errorText = await loginResponse.text();
        console.error('Error details:', errorText);
        return;
    }

    // Extract cookie from response
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    console.log('Cookie received:', setCookieHeader ? 'Yes' : 'No');

    // Step 2: Create a test phase
    console.log('\nStep 2: Creating test roadmap phase...');
    const testPhase = {
        phase: 'Test Phase',
        date: 'Q1 2024',
        title: 'Backend Test Phase',
        description: 'This is a test phase created by the verification script.',
        status: 'upcoming',
        deliverables: [
            { text: 'Test deliverable 1', status: 'pending' },
            { text: 'Test deliverable 2', status: 'pending' }
        ]
    };

    console.log('Sending phase data:', JSON.stringify(testPhase, null, 2));

    const createResponse = await fetch(`${BASE_URL}/roadmap`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': setCookieHeader || ''
        },
        body: JSON.stringify(testPhase)
    });

    console.log('\nResponse status:', createResponse.status, createResponse.statusText);

    if (!createResponse.ok) {
        console.error('❌ Phase creation failed');
        const errorText = await createResponse.text();
        console.error('Error details:', errorText);
        return;
    }

    const createdPhase = await createResponse.json();
    console.log('✅ Phase created successfully!');
    console.log('\nCreated phase data:');
    console.log(JSON.stringify(createdPhase, null, 2));

    // Step 3: Verify the phase was saved by fetching all phases
    console.log('\nStep 3: Verifying phase was saved...');
    const getAllResponse = await fetch(`${BASE_URL}/roadmap`, {
        headers: {
            'Cookie': setCookieHeader || ''
        }
    });

    if (!getAllResponse.ok) {
        console.error('❌ Failed to fetch roadmap');
        return;
    }

    const allPhases = await getAllResponse.json();
    console.log(`✅ Found ${allPhases.length} total phase(s) in roadmap`);

    const foundPhase = allPhases.find(p => p.title === 'Backend Test Phase');
    if (foundPhase) {
        console.log('✅ Test phase found in roadmap!');
        console.log('Phase ID:', foundPhase.id);
        console.log('Phase has MongoDB ObjectId:', foundPhase.id && foundPhase.id.length === 24);
    } else {
        console.log('⚠️  Test phase not found in roadmap');
    }

    console.log('\n✨ Backend verification complete!');
}

// Run the test
testCreatePhase().catch(error => {
    console.error('❌ Test failed with error:', error.message);
    console.error(error);
});
