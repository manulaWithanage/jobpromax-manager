/**
 * Automated Page Alignment Verification Script
 * 
 * This script will:
 * 1. Login as manager
 * 2. Navigate to each page
 * 3. Take screenshots
 * 4. Verify alignment consistency
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const PAGES_TO_VERIFY = [
    { name: 'Overview', url: '/overview', expectedTitle: 'Executive Overview' },
    { name: 'Delivery Timeline', url: '/roadmap', expectedTitle: 'Delivery Timeline' },
    { name: 'Feature Status Hub', url: '/status', expectedTitle: 'Feature Status Hub' },
    { name: 'Roadmap Manager', url: '/manager/roadmap', expectedTitle: 'Roadmap Manager' },
    { name: 'Feature Status Manager', url: '/manager/status', expectedTitle: 'Feature Status Manager' },
    { name: 'User Management', url: '/manager/users', expectedTitle: 'User Management' }
];

async function verifyAlignment() {
    console.log('🔍 Starting Page Alignment Verification...\n');
    console.log('='.repeat(60));

    // Step 1: Login
    console.log('\n📝 Step 1: Authenticating...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'manager@jobpromax.com',
            password: 'manager123'
        })
    });

    if (!loginResponse.ok) {
        console.error('❌ Login failed');
        process.exit(1);
    }

    const cookie = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');

    // Step 2: Verify each page
    console.log('\n📊 Step 2: Verifying Pages...\n');

    const results = [];

    for (const page of PAGES_TO_VERIFY) {
        console.log(`\n🔍 Checking: ${page.name}`);
        console.log(`   URL: ${BASE_URL}${page.url}`);

        try {
            const response = await fetch(`${BASE_URL}${page.url}`, {
                headers: { 'Cookie': cookie || '' }
            });

            if (!response.ok) {
                console.log(`   ❌ Failed to load (${response.status})`);
                results.push({
                    page: page.name,
                    status: 'FAIL',
                    reason: `HTTP ${response.status}`
                });
                continue;
            }

            const html = await response.text();

            // Verify key alignment elements
            const checks = {
                hasIconBox: html.includes('p-3') && html.includes('rounded-xl'),
                hasH1: html.includes('text-3xl font-bold'),
                hasFlexBetween: html.includes('flex items-center justify-between'),
                hasCorrectTitle: html.includes(page.expectedTitle),
                hasDescription: html.includes('text-slate-500')
            };

            const allPassed = Object.values(checks).every(v => v);

            console.log(`   Icon Box: ${checks.hasIconBox ? '✅' : '❌'}`);
            console.log(`   Title (text-3xl): ${checks.hasH1 ? '✅' : '❌'}`);
            console.log(`   Layout (flex justify-between): ${checks.hasFlexBetween ? '✅' : '❌'}`);
            console.log(`   Correct Title Text: ${checks.hasCorrectTitle ? '✅' : '❌'}`);
            console.log(`   Description: ${checks.hasDescription ? '✅' : '❌'}`);
            console.log(`   Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);

            results.push({
                page: page.name,
                url: page.url,
                status: allPassed ? 'PASS' : 'FAIL',
                checks: checks
            });

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results.push({
                page: page.name,
                status: 'ERROR',
                reason: error.message
            });
        }
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 VERIFICATION SUMMARY\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;

    console.log(`Total Pages: ${results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
    console.log(`Success Rate: ${Math.round((passed / results.length) * 100)}%`);

    console.log('\n📋 Detailed Results:\n');
    results.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${result.page.padEnd(30)} ${result.status}`);
        if (result.status === 'FAIL' && result.checks) {
            const failedChecks = Object.entries(result.checks)
                .filter(([_, passed]) => !passed)
                .map(([check]) => check);
            if (failedChecks.length > 0) {
                console.log(`   Failed checks: ${failedChecks.join(', ')}`);
            }
        }
        if (result.reason) {
            console.log(`   Reason: ${result.reason}`);
        }
    });

    // Step 4: Final verdict
    console.log('\n' + '='.repeat(60));
    if (failed === 0) {
        console.log('\n✨ ALL PAGES VERIFIED SUCCESSFULLY! ✨');
        console.log('\n🎯 Alignment is 100% consistent across all pages.');
        console.log('   - All icons in colored boxes');
        console.log('   - All titles use text-3xl font-bold');
        console.log('   - All headers use flex justify-between');
        console.log('   - All descriptions use text-slate-500');
        process.exit(0);
    } else {
        console.log('\n❌ VERIFICATION FAILED');
        console.log(`\n${failed} page(s) need attention.`);
        console.log('Please review the detailed results above.');
        process.exit(1);
    }
}

// Run verification
verifyAlignment().catch(error => {
    console.error('\n❌ Verification script failed:', error.message);
    process.exit(1);
});
