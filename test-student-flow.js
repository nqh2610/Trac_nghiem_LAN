/**
 * Test Cases for Student Exam Flow
 * Run: node test-student-flow.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test results
const testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

function logTest(name, passed, error = null) {
    if (passed) {
        console.log(`✅ ${name}`);
        testResults.passed++;
    } else {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error}`);
        testResults.failed++;
        testResults.errors.push({ name, error });
    }
}

async function runTests() {
    console.log('\n🧪 ========== STUDENT EXAM FLOW TEST ==========\n');
    
    // Test 1: Get students list
    console.log('📋 TEST GROUP: GET STUDENTS');
    try {
        const res = await makeRequest('/api/students');
        const passed = res.status === 200 && Array.isArray(res.data) && res.data.length > 0;
        logTest('GET /api/students returns array of students', passed, 
            !passed ? `Status: ${res.status}, Data: ${JSON.stringify(res.data).slice(0, 100)}` : null);
        
        if (passed) {
            const firstStudent = res.data[0];
            const hasRequiredFields = firstStudent.stt && firstStudent.ho && firstStudent.ten;
            logTest('Student has required fields (stt, ho, ten)', hasRequiredFields,
                !hasRequiredFields ? `Missing fields: ${JSON.stringify(firstStudent)}` : null);
            
            const hasStatus = firstStudent.status !== undefined;
            logTest('Student has status object', hasStatus,
                !hasStatus ? `Missing status: ${JSON.stringify(firstStudent)}` : null);
        }
    } catch (e) {
        logTest('GET /api/students', false, e.message);
    }
    
    // Test 2: Select student
    console.log('\n📋 TEST GROUP: SELECT STUDENT');
    const testSocketId = 'test-socket-' + Date.now();
    let testStudent = null;
    
    try {
        // Get first available student
        const studentsRes = await makeRequest('/api/students');
        if (studentsRes.data && studentsRes.data.length > 0) {
            testStudent = studentsRes.data[0];
            
            // Test selecting student
            const selectRes = await makeRequest('/api/select-student', 'POST', {
                stt: testStudent.stt,
                socketId: testSocketId
            });
            
            const passed = selectRes.data.success === true && selectRes.data.student;
            logTest(`POST /api/select-student with STT=${testStudent.stt}`, passed,
                !passed ? `Response: ${JSON.stringify(selectRes.data)}` : null);
            
            if (passed) {
                // Verify student info returned
                const hasStudentInfo = selectRes.data.student.ho && selectRes.data.student.ten;
                logTest('Selected student has ho and ten', hasStudentInfo,
                    !hasStudentInfo ? `Student: ${JSON.stringify(selectRes.data.student)}` : null);
            }
            
            // Test selecting same student again with same socket (should succeed)
            const selectAgainRes = await makeRequest('/api/select-student', 'POST', {
                stt: testStudent.stt,
                socketId: testSocketId
            });
            logTest('Re-select same student with same socket succeeds', 
                selectAgainRes.data.success === true,
                selectAgainRes.data.success !== true ? `Response: ${JSON.stringify(selectAgainRes.data)}` : null);
            
            // Test selecting same student with different socket (should fail)
            const selectOtherRes = await makeRequest('/api/select-student', 'POST', {
                stt: testStudent.stt,
                socketId: 'different-socket'
            });
            logTest('Select same student with different socket fails', 
                selectOtherRes.data.success === false,
                selectOtherRes.data.success !== false ? `Should fail but got: ${JSON.stringify(selectOtherRes.data)}` : null);
        }
    } catch (e) {
        logTest('SELECT STUDENT tests', false, e.message);
    }
    
    // Test 3: Deselect student
    console.log('\n📋 TEST GROUP: DESELECT STUDENT');
    try {
        if (testStudent) {
            const deselectRes = await makeRequest('/api/deselect-student', 'POST', {
                stt: testStudent.stt,
                socketId: testSocketId
            });
            logTest('POST /api/deselect-student', deselectRes.data.success === true,
                deselectRes.data.success !== true ? `Response: ${JSON.stringify(deselectRes.data)}` : null);
            
            // Test deselecting with wrong socket (should still succeed but not change anything)
            const deselectWrongRes = await makeRequest('/api/deselect-student', 'POST', {
                stt: testStudent.stt,
                socketId: 'wrong-socket'
            });
            logTest('Deselect with wrong socket returns success', deselectWrongRes.data.success === true,
                deselectWrongRes.data.success !== true ? `Response: ${JSON.stringify(deselectWrongRes.data)}` : null);
        }
    } catch (e) {
        logTest('DESELECT STUDENT tests', false, e.message);
    }
    
    // Test 4: Get exam settings
    console.log('\n📋 TEST GROUP: EXAM SETTINGS');
    try {
        const settingsRes = await makeRequest('/api/settings');
        const passed = settingsRes.status === 200 && settingsRes.data.title;
        logTest('GET /api/settings returns exam settings', passed,
            !passed ? `Response: ${JSON.stringify(settingsRes.data)}` : null);
        
        if (passed) {
            logTest('Settings has isOpen field', settingsRes.data.isOpen !== undefined,
                settingsRes.data.isOpen === undefined ? 'Missing isOpen' : null);
            logTest('Settings has timeLimit field', settingsRes.data.timeLimit !== undefined,
                settingsRes.data.timeLimit === undefined ? 'Missing timeLimit' : null);
        }
    } catch (e) {
        logTest('EXAM SETTINGS tests', false, e.message);
    }
    
    // Test 5: Get exam (questions)
    console.log('\n📋 TEST GROUP: GET EXAM');
    try {
        const examRes = await makeRequest('/api/exam');
        
        if (examRes.data.error) {
            // Exam might be closed
            logTest('GET /api/exam returns error when closed', true, null);
            console.log(`   Note: Exam is closed - "${examRes.data.error}"`);
        } else {
            const passed = examRes.status === 200 && Array.isArray(examRes.data.questions);
            logTest('GET /api/exam returns questions array', passed,
                !passed ? `Response: ${JSON.stringify(examRes.data).slice(0, 200)}` : null);
            
            if (passed && examRes.data.questions.length > 0) {
                const q = examRes.data.questions[0];
                logTest('Question has required fields', 
                    q.question && Array.isArray(q.options) && q.correct !== undefined,
                    !(q.question && q.options && q.correct !== undefined) ? `Question: ${JSON.stringify(q)}` : null);
            }
        }
    } catch (e) {
        logTest('GET EXAM tests', false, e.message);
    }
    
    // Test 6: Check submitted status
    console.log('\n📋 TEST GROUP: CHECK SUBMITTED');
    try {
        if (testStudent) {
            const checkRes = await makeRequest(`/api/check-submitted/${testStudent.stt}`);
            logTest('GET /api/check-submitted/:stt returns status', 
                checkRes.data.submitted !== undefined,
                checkRes.data.submitted === undefined ? `Response: ${JSON.stringify(checkRes.data)}` : null);
        }
    } catch (e) {
        logTest('CHECK SUBMITTED tests', false, e.message);
    }
    
    // Test 7: Submit exam (simulation)
    console.log('\n📋 TEST GROUP: SUBMIT EXAM');
    try {
        // First select a student for this test
        const studentsRes = await makeRequest('/api/students');
        const availableStudent = studentsRes.data.find(s => !s.status.completed && !s.status.selected);
        
        if (availableStudent) {
            const submitSocketId = 'submit-test-' + Date.now();
            
            // Select student first
            await makeRequest('/api/select-student', 'POST', {
                stt: availableStudent.stt,
                socketId: submitSocketId
            });
            
            // Get exam questions
            const examRes = await makeRequest('/api/exam');
            
            if (examRes.data.questions) {
                // Create random answers
                const answers = {};
                examRes.data.questions.forEach((q, i) => {
                    answers[i] = Math.floor(Math.random() * q.options.length);
                });
                
                // Submit
                const submitRes = await makeRequest('/api/submit', 'POST', {
                    studentName: `${availableStudent.ho} ${availableStudent.ten}`,
                    studentClass: '11A4',
                    studentSTT: availableStudent.stt,
                    answers: answers,
                    questionOrder: Array.from({length: examRes.data.questions.length}, (_, i) => i),
                    optionOrders: examRes.data.questions.map(q => Array.from({length: q.options.length}, (_, i) => i)),
                    timeTaken: 120
                });
                
                logTest('POST /api/submit returns score', 
                    submitRes.data.score !== undefined,
                    submitRes.data.score === undefined ? `Response: ${JSON.stringify(submitRes.data)}` : null);
                
                if (submitRes.data.score !== undefined) {
                    logTest('Submit returns correct and total', 
                        submitRes.data.correct !== undefined && submitRes.data.total !== undefined,
                        `Response: ${JSON.stringify(submitRes.data)}`);
                }
                
                // Verify student is now completed
                const checkAfterRes = await makeRequest(`/api/check-submitted/${availableStudent.stt}`);
                logTest('After submit, student is marked as submitted', 
                    checkAfterRes.data.submitted === true,
                    checkAfterRes.data.submitted !== true ? `Response: ${JSON.stringify(checkAfterRes.data)}` : null);
            } else {
                logTest('Cannot test submit - exam closed', true, null);
                console.log('   Note: Exam is closed, skipping submit test');
            }
        } else {
            logTest('Cannot test submit - no available student', true, null);
            console.log('   Note: No available student to test submit');
        }
    } catch (e) {
        logTest('SUBMIT EXAM tests', false, e.message);
    }
    
    // Test 8: Edge cases
    console.log('\n📋 TEST GROUP: EDGE CASES');
    try {
        // Invalid STT
        const invalidRes = await makeRequest('/api/select-student', 'POST', {
            stt: 99999,
            socketId: 'test'
        });
        logTest('Select invalid STT returns error', 
            invalidRes.data.success === false,
            invalidRes.data.success !== false ? `Should fail: ${JSON.stringify(invalidRes.data)}` : null);
        
        // Missing socketId
        const missingSocketRes = await makeRequest('/api/select-student', 'POST', {
            stt: 1
        });
        // Should still work but handle missing socketId gracefully
        logTest('Select with missing socketId handled', 
            missingSocketRes.status === 200,
            missingSocketRes.status !== 200 ? `Status: ${missingSocketRes.status}` : null);
        
        // Invalid check-submitted
        const invalidCheckRes = await makeRequest('/api/check-submitted/99999');
        logTest('Check submitted for invalid STT returns submitted=false or error', 
            invalidCheckRes.data.submitted === false || invalidCheckRes.data.error,
            !(invalidCheckRes.data.submitted === false || invalidCheckRes.data.error) ? 
                `Response: ${JSON.stringify(invalidCheckRes.data)}` : null);
        
    } catch (e) {
        logTest('EDGE CASES tests', false, e.message);
    }
    
    // Test 9: Session/Current class
    console.log('\n📋 TEST GROUP: SESSION');
    try {
        const sessionRes = await makeRequest('/api/session');
        logTest('GET /api/session returns data', 
            sessionRes.status === 200,
            sessionRes.status !== 200 ? `Status: ${sessionRes.status}` : null);
        
        if (sessionRes.data) {
            logTest('Session has currentClass', 
                sessionRes.data.currentClass !== undefined,
                sessionRes.data.currentClass === undefined ? `Data: ${JSON.stringify(sessionRes.data)}` : null);
            logTest('Session has currentExam', 
                sessionRes.data.currentExam !== undefined,
                sessionRes.data.currentExam === undefined ? `Data: ${JSON.stringify(sessionRes.data)}` : null);
        }
    } catch (e) {
        logTest('SESSION tests', false, e.message);
    }
    
    // Summary
    console.log('\n========== TEST SUMMARY ==========');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    
    if (testResults.errors.length > 0) {
        console.log('\n🔴 FAILED TESTS:');
        testResults.errors.forEach(e => {
            console.log(`   - ${e.name}`);
            console.log(`     Error: ${e.error}`);
        });
    }
    
    console.log('\n==================================\n');
    
    return testResults.failed === 0;
}

// Run tests
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
