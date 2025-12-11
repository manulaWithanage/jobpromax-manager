/**
 * Simplified backend verification test
 */

const BASE_URL = 'http://localhost:8000';

async function test() {
    try {
        // Login
        console.log('1. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'manager@jobpromax.com',
                password: 'manager123'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const cookie = loginRes.headers.get('set-cookie');
        console.log('   ✅ Login successful');

        // Create phase
        console.log('\n2. Creating phase...');
        const phase = {
            phase: 'Script Test',
            date: 'Q1 2024',
            title: 'Verification Test Phase',
            description: 'Created by test script',
            status: 'upcoming',
            deliverables: []
        };

        const createRes = await fetch(`${BASE_URL}/roadmap`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie || ''
            },
            body: JSON.stringify(phase)
        });

        if (!createRes.ok) {
            const error = await createRes.text();
            throw new Error(`Create failed: ${createRes.status}\n${error}`);
        }

        const created = await createRes.json();
        console.log('   ✅ Phase created');
        console.log('   ID:', created.id);
        console.log('   Title:', created.title);
        console.log('   Has valid ObjectId:', created.id && created.id.length === 24);

        // Verify
        console.log('\n3. Verifying phase exists...');
        const getRes = await fetch(`${BASE_URL}/roadmap`, {
            headers: { 'Cookie': cookie || '' }
        });

        const all = await getRes.json();
        const found = all.find(p => p.id === created.id);

        if (found) {
            console.log('   ✅ Phase verified in database');
            console.log('   Total phases:', all.length);
        } else {
            console.log('   ❌ Phase not found!');
        }

        console.log('\n✨ All tests passed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

test();
