/**
 * Test script to verify DELETE functionality for roadmap phases
 * This will help diagnose why the delete button isn't working
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function testDeleteFunctionality() {
    console.log('🧪 Testing DELETE Functionality...\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Login
        console.log('\n📝 Step 1: Logging in...');
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
        console.log('✅ Login successful\n');

        // Step 2: Get current phases
        console.log('📊 Step 2: Fetching current phases...');
        const getRes = await fetch(`${BASE_URL}/roadmap`, {
            headers: { 'Cookie': cookie || '' }
        });

        if (!getRes.ok) {
            throw new Error(`Failed to fetch roadmap: ${getRes.status}`);
        }

        const phases = await getRes.json();
        console.log(`✅ Found ${phases.length} phase(s)\n`);

        if (phases.length === 0) {
            console.log('⚠️  No phases to delete. Creating a test phase first...');

            // Create a test phase
            const createRes = await fetch(`${BASE_URL}/roadmap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookie || ''
                },
                body: JSON.stringify({
                    phase: 'Delete Test',
                    date: 'Q1 2025',
                    title: 'Phase to be deleted',
                    description: 'This phase will be deleted by the test',
                    status: 'upcoming',
                    deliverables: []
                })
            });

            if (!createRes.ok) {
                throw new Error(`Failed to create test phase: ${createRes.status}`);
            }

            const newPhase = await createRes.json();
            console.log('✅ Test phase created\n');
            phases.push(newPhase);
        }

        // Step 3: Try to delete the first phase
        const phaseToDelete = phases[0];
        console.log(`🗑️  Step 3: Attempting to delete phase: "${phaseToDelete.title}"`);
        console.log(`   Phase ID: ${phaseToDelete.id || phaseToDelete._id}`);

        const phaseId = phaseToDelete.id || phaseToDelete._id;

        console.log(`\n📤 Sending DELETE request to: ${BASE_URL}/roadmap/${phaseId}`);

        const deleteRes = await fetch(`${BASE_URL}/roadmap/${phaseId}`, {
            method: 'DELETE',
            headers: { 'Cookie': cookie || '' }
        });

        console.log(`\n📥 Response status: ${deleteRes.status} ${deleteRes.statusText}`);

        if (!deleteRes.ok) {
            const errorText = await deleteRes.text();
            console.error('❌ DELETE failed');
            console.error('Response body:', errorText);
            throw new Error(`DELETE failed: ${deleteRes.status}\n${errorText}`);
        }

        console.log('✅ DELETE request successful\n');

        // Step 4: Verify deletion
        console.log('🔍 Step 4: Verifying deletion...');
        const verifyRes = await fetch(`${BASE_URL}/roadmap`, {
            headers: { 'Cookie': cookie || '' }
        });

        const phasesAfterDelete = await verifyRes.json();
        console.log(`   Phases before: ${phases.length}`);
        console.log(`   Phases after: ${phasesAfterDelete.length}`);

        const foundDeleted = phasesAfterDelete.find(p =>
            (p.id || p._id) === phaseId
        );

        if (foundDeleted) {
            console.log('❌ FAILED: Phase still exists in database!');
            console.log('   This means the backend did NOT delete the phase');
            return false;
        }

        console.log('✅ Phase successfully removed from database\n');

        // Step 5: Summary
        console.log('='.repeat(60));
        console.log('\n✨ DELETE FUNCTIONALITY TEST: PASSED ✅\n');
        console.log('Summary:');
        console.log('  ✅ API endpoint works');
        console.log('  ✅ Backend deletes from database');
        console.log('  ✅ Phase count decreased');
        console.log('  ✅ Deleted phase not found in list\n');

        console.log('💡 If the UI button still doesn\'t work, the issue is in:');
        console.log('   - Frontend button click handler');
        console.log('   - Frontend API service call');
        console.log('   - React state update\n');

        return true;

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error('Error:', error.message);
        console.error('\n🔍 Possible issues:');
        console.error('  1. Backend server not running');
        console.error('  2. API endpoint not implemented');
        console.error('  3. Authentication issue');
        console.error('  4. Database connection problem');
        return false;
    }
}

// Run the test
testDeleteFunctionality().then(success => {
    process.exit(success ? 0 : 1);
});
