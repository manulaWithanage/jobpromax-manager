/**
 * COMPREHENSIVE DELETE VERIFICATION TEST
 * This will delete ALL roadmap phases one by one and verify each deletion
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function comprehensiveDeleteTest() {
    console.log('\n' + '='.repeat(80));
    console.log('🔥 COMPREHENSIVE DELETE VERIFICATION TEST');
    console.log('='.repeat(80) + '\n');

    try {
        // Step 1: Login
        console.log('📝 STEP 1: Authentication');
        console.log('-'.repeat(80));
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
        console.log('✅ Logged in as manager\n');

        // Step 2: Get ALL current phases
        console.log('📊 STEP 2: Fetching all current phases');
        console.log('-'.repeat(80));

        const getInitialRes = await fetch(`${BASE_URL}/roadmap`, {
            headers: { 'Cookie': cookie || '' }
        });

        if (!getInitialRes.ok) {
            throw new Error(`Failed to fetch roadmap: ${getInitialRes.status}`);
        }

        let phases = await getInitialRes.json();
        const initialCount = phases.length;

        console.log(`📌 Initial phase count: ${initialCount}`);
        console.log('\nPhases found:');
        phases.forEach((phase, index) => {
            const phaseId = phase.id || phase._id;
            console.log(`  ${index + 1}. "${phase.title}" (ID: ${phaseId})`);
        });
        console.log();

        if (initialCount === 0) {
            console.log('⚠️  No phases to delete. Test complete (nothing to verify).\n');
            return true;
        }

        // Step 3: Delete each phase one by one
        console.log('🗑️  STEP 3: Deleting all phases one by one');
        console.log('-'.repeat(80));

        let deletedCount = 0;
        const deletionResults = [];

        for (let i = 0; i < initialCount; i++) {
            console.log(`\n🔹 Deleting phase ${i + 1} of ${initialCount}`);

            // Re-fetch to get current list
            const getCurrentRes = await fetch(`${BASE_URL}/roadmap`, {
                headers: { 'Cookie': cookie || '' }
            });

            const currentPhases = await getCurrentRes.json();

            if (currentPhases.length === 0) {
                console.log('✅ All phases deleted!');
                break;
            }

            const phaseToDelete = currentPhases[0]; // Always delete the first one
            const phaseId = phaseToDelete.id || phaseToDelete._id;

            console.log(`   Title: "${phaseToDelete.title}"`);
            console.log(`   ID: ${phaseId}`);
            console.log(`   Current count: ${currentPhases.length}`);

            // DELETE request
            console.log(`   📤 Sending DELETE request...`);
            const deleteRes = await fetch(`${BASE_URL}/roadmap/${phaseId}`, {
                method: 'DELETE',
                headers: { 'Cookie': cookie || '' }
            });

            console.log(`   📥 Response: ${deleteRes.status} ${deleteRes.statusText}`);

            if (!deleteRes.ok) {
                const errorText = await deleteRes.text();
                console.error(`   ❌ DELETE failed!`);
                console.error(`   Error: ${errorText}`);
                deletionResults.push({
                    phase: phaseToDelete.title,
                    id: phaseId,
                    status: 'FAILED',
                    error: errorText
                });
                continue;
            }

            console.log(`   ✅ DELETE successful`);

            // Verify deletion
            console.log(`   🔍 Verifying deletion...`);
            const verifyRes = await fetch(`${BASE_URL}/roadmap`, {
                headers: { 'Cookie': cookie || '' }
            });

            const phasesAfterDelete = await verifyRes.json();
            const stillExists = phasesAfterDelete.find(p =>
                (p.id || p._id) === phaseId
            );

            if (stillExists) {
                console.log(`   ❌ VERIFICATION FAILED: Phase still exists!`);
                deletionResults.push({
                    phase: phaseToDelete.title,
                    id: phaseId,
                    status: 'FAILED',
                    error: 'Phase still in database after delete'
                });
            } else {
                console.log(`   ✅ VERIFIED: Phase removed from database`);
                console.log(`   📊 Remaining phases: ${phasesAfterDelete.length}`);
                deletedCount++;
                deletionResults.push({
                    phase: phaseToDelete.title,
                    id: phaseId,
                    status: 'SUCCESS'
                });
            }

            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Step 4: Final verification
        console.log('\n' + '='.repeat(80));
        console.log('📊 STEP 4: Final Verification');
        console.log('-'.repeat(80));

        const finalRes = await fetch(`${BASE_URL}/roadmap`, {
            headers: { 'Cookie': cookie || '' }
        });

        const finalPhases = await finalRes.json();
        const finalCount = finalPhases.length;

        console.log(`\n📌 Initial phase count: ${initialCount}`);
        console.log(`🗑️  Successfully deleted: ${deletedCount}`);
        console.log(`📌 Final phase count: ${finalCount}`);
        console.log(`📉 Total reduction: ${initialCount - finalCount}\n`);

        // Step 5: Summary
        console.log('='.repeat(80));
        console.log('📋 SUMMARY');
        console.log('='.repeat(80) + '\n');

        console.log('Deletion Results:');
        deletionResults.forEach((result, index) => {
            const icon = result.status === 'SUCCESS' ? '✅' : '❌';
            console.log(`  ${icon} ${index + 1}. "${result.phase}"`);
            if (result.error) {
                console.log(`     Error: ${result.error}`);
            }
        });

        console.log();

        if (finalCount === 0) {
            console.log('🎉 SUCCESS: ALL PHASES DELETED!');
            console.log('✅ Database is now empty');
            console.log('✅ Delete functionality is FULLY WORKING\n');
            return true;
        } else if (deletedCount > 0) {
            console.log(`⚠️  PARTIAL SUCCESS: ${deletedCount} phases deleted`);
            console.log(`⚠️  ${finalCount} phases remain`);
            console.log('\nRemaining phases:');
            finalPhases.forEach((phase, index) => {
                console.log(`  ${index + 1}. "${phase.title}" (ID: ${phase.id || phase._id})`);
            });
            console.log();
            return false;
        } else {
            console.log('❌ FAILURE: No phases were deleted');
            console.log('❌ Delete functionality is NOT working\n');
            return false;
        }

    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ TEST FAILED WITH ERROR');
        console.error('='.repeat(80));
        console.error('\nError:', error.message);
        console.error('\nStack trace:');
        console.error(error.stack);
        return false;
    }
}

// Run the comprehensive test
console.log('\n🚀 Starting comprehensive delete verification...\n');
comprehensiveDeleteTest().then(success => {
    console.log('='.repeat(80));
    if (success) {
        console.log('✅ TEST PASSED - All phases successfully deleted');
    } else {
        console.log('❌ TEST FAILED - Some phases could not be deleted');
    }
    console.log('='.repeat(80) + '\n');
    process.exit(success ? 0 : 1);
});
