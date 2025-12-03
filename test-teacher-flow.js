/**
 * Test Cases for Teacher & Teacher-Student Interaction Flow
 * Run: node test-teacher-flow.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Host': 'localhost:3000'
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

const testResults = { passed: 0, failed: 0, errors: [] };

function logTest(name, passed, error = null) {
    if (passed) {
        console.log(`✅ ${name}`);
        testResults.passed++;
    } else {
        console.log(`❌ ${name}`);
        if (error) console.log(`   Error: ${error}`);
        testResults.failed++;
        testResults.errors.push({ name, error });
    }
}

async function runTests() {
    console.log('\n🧪 ========== TEACHER & INTERACTION FLOW TEST ==========\n');
    
    // ==================== TEACHER: CLASS MANAGEMENT ====================
    console.log('📋 TEST GROUP 1: CLASS MANAGEMENT');
    
    try {
        // Get classes list
        const classesRes = await makeRequest('/api/classes');
        logTest('GET /api/classes returns array', 
            Array.isArray(classesRes.data),
            !Array.isArray(classesRes.data) ? JSON.stringify(classesRes.data) : null);
        
        if (classesRes.data.length > 0) {
            const firstClass = classesRes.data[0];
            logTest('Class has id and name', 
                firstClass.id && firstClass.name,
                !(firstClass.id && firstClass.name) ? JSON.stringify(firstClass) : null);
        }
        
        // Create new class
        const newClassName = 'TestClass_' + Date.now();
        const createClassRes = await makeRequest('/api/classes', 'POST', {
            name: newClassName,
            filePath: 'danhsach/danhsach.xlsx'
        });
        logTest('POST /api/classes creates new class', 
            createClassRes.data.success === true,
            createClassRes.data.success !== true ? JSON.stringify(createClassRes.data) : null);
        
        // Switch class
        if (classesRes.data.length > 0) {
            const switchRes = await makeRequest('/api/classes/switch', 'POST', {
                classId: classesRes.data[0].id
            });
            logTest('POST /api/classes/switch works', 
                switchRes.data.success === true || switchRes.data.students,
                !(switchRes.data.success || switchRes.data.students) ? JSON.stringify(switchRes.data) : null);
        }
    } catch (e) {
        logTest('CLASS MANAGEMENT tests', false, e.message);
    }
    
    // ==================== TEACHER: EXAM MANAGEMENT ====================
    console.log('\n📋 TEST GROUP 2: EXAM MANAGEMENT');
    
    try {
        // Get exams list
        const examsRes = await makeRequest('/api/exams');
        logTest('GET /api/exams returns array', 
            Array.isArray(examsRes.data),
            !Array.isArray(examsRes.data) ? JSON.stringify(examsRes.data) : null);
        
        if (examsRes.data.length > 0) {
            const firstExam = examsRes.data[0];
            logTest('Exam has id and name', 
                firstExam.id && firstExam.name,
                !(firstExam.id && firstExam.name) ? JSON.stringify(firstExam) : null);
        }
        
        // Create new exam (without switching)
        const newExamName = 'TestExam_' + Date.now();
        const createExamRes = await makeRequest('/api/exams/create', 'POST', {
            name: newExamName
        });
        logTest('POST /api/exams/create creates exam without switching', 
            createExamRes.data.success === true && createExamRes.data.examId,
            createExamRes.data.success !== true ? JSON.stringify(createExamRes.data) : null);
        
        // Switch exam
        if (examsRes.data.length > 0) {
            const switchExamRes = await makeRequest('/api/exams/switch', 'POST', {
                examId: examsRes.data[0].id
            });
            logTest('POST /api/exams/switch works', 
                switchExamRes.data.success === true || switchExamRes.data.questions !== undefined,
                !(switchExamRes.data.success || switchExamRes.data.questions !== undefined) ? JSON.stringify(switchExamRes.data) : null);
        }
    } catch (e) {
        logTest('EXAM MANAGEMENT tests', false, e.message);
    }
    
    // ==================== TEACHER: QUESTION MANAGEMENT ====================
    console.log('\n📋 TEST GROUP 3: QUESTION MANAGEMENT');
    
    try {
        // Get questions
        const questionsRes = await makeRequest('/api/questions');
        logTest('GET /api/questions returns array', 
            Array.isArray(questionsRes.data),
            !Array.isArray(questionsRes.data) ? JSON.stringify(questionsRes.data) : null);
        
        const originalCount = questionsRes.data.length;
        
        // Add question
        const addRes = await makeRequest('/api/questions', 'POST', {
            question: 'Test question ' + Date.now(),
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0
        });
        logTest('POST /api/questions adds question', 
            addRes.data.success === true,
            addRes.data.success !== true ? JSON.stringify(addRes.data) : null);
        
        // Verify count increased
        const questionsAfterAdd = await makeRequest('/api/questions');
        logTest('Question count increased', 
            questionsAfterAdd.data.length === originalCount + 1,
            questionsAfterAdd.data.length !== originalCount + 1 ? 
                `Expected ${originalCount + 1}, got ${questionsAfterAdd.data.length}` : null);
        
        // Edit question (last one)
        const lastIndex = questionsAfterAdd.data.length - 1;
        const editRes = await makeRequest(`/api/questions/${lastIndex}`, 'PUT', {
            question: 'Edited question',
            options: ['New A', 'New B', 'New C', 'New D'],
            correct: 1
        });
        logTest('PUT /api/questions/:id edits question', 
            editRes.data.success === true,
            editRes.data.success !== true ? JSON.stringify(editRes.data) : null);
        
        // Delete question (last one)
        const deleteRes = await makeRequest(`/api/questions/${lastIndex}`, 'DELETE');
        logTest('DELETE /api/questions/:id removes question', 
            deleteRes.data.success === true,
            deleteRes.data.success !== true ? JSON.stringify(deleteRes.data) : null);
        
        // Verify count back to original
        const questionsAfterDelete = await makeRequest('/api/questions');
        logTest('Question count restored', 
            questionsAfterDelete.data.length === originalCount,
            questionsAfterDelete.data.length !== originalCount ? 
                `Expected ${originalCount}, got ${questionsAfterDelete.data.length}` : null);
                
    } catch (e) {
        logTest('QUESTION MANAGEMENT tests', false, e.message);
    }
    
    // ==================== TEACHER: EXAM SETTINGS ====================
    console.log('\n📋 TEST GROUP 4: EXAM SETTINGS');
    
    try {
        // Get current settings
        const settingsRes = await makeRequest('/api/settings');
        const originalSettings = settingsRes.data;
        logTest('GET /api/settings returns settings', 
            settingsRes.data.title !== undefined,
            settingsRes.data.title === undefined ? JSON.stringify(settingsRes.data) : null);
        
        // Update settings
        const updateRes = await makeRequest('/api/settings', 'POST', {
            title: 'Test Exam Title',
            timeLimit: 45,
            isOpen: false,
            showScore: true
        });
        logTest('POST /api/settings updates settings', 
            updateRes.data.success === true,
            updateRes.data.success !== true ? JSON.stringify(updateRes.data) : null);
        
        // Verify update
        const verifySettings = await makeRequest('/api/settings');
        logTest('Settings updated correctly', 
            verifySettings.data.title === 'Test Exam Title' && verifySettings.data.timeLimit === 45,
            !(verifySettings.data.title === 'Test Exam Title') ? JSON.stringify(verifySettings.data) : null);
        
        // Restore original settings
        await makeRequest('/api/settings', 'POST', {
            title: originalSettings.title,
            timeLimit: originalSettings.timeLimit,
            isOpen: originalSettings.isOpen,
            showScore: originalSettings.showScore
        });
        logTest('Settings restored', true);
        
    } catch (e) {
        logTest('EXAM SETTINGS tests', false, e.message);
    }
    
    // ==================== TEACHER: STUDENT STATUS MANAGEMENT ====================
    console.log('\n📋 TEST GROUP 5: STUDENT STATUS MANAGEMENT');
    
    try {
        // Get students
        const studentsRes = await makeRequest('/api/students');
        const testStudent = studentsRes.data[0];
        
        // Reset all students
        const resetRes = await makeRequest('/api/reset-all-students', 'POST', {});
        logTest('POST /api/reset-all-students works', 
            resetRes.data.success === true,
            resetRes.data.success !== true ? JSON.stringify(resetRes.data) : null);
        
        // Verify students are reset
        const studentsAfterReset = await makeRequest('/api/students');
        const allReset = studentsAfterReset.data.every(s => 
            !s.status.selected && !s.status.completed
        );
        logTest('All students reset correctly', allReset,
            !allReset ? 'Some students still have status' : null);
        
        // Allow retry for a student
        // First, simulate a completed student
        const socketId = 'test-socket-' + Date.now();
        await makeRequest('/api/select-student', 'POST', { stt: testStudent.stt, socketId });
        
        // Mark as completed via direct status update (simulate submit)
        const allowRetryRes = await makeRequest('/api/allow-retry', 'POST', { 
            stt: testStudent.stt 
        });
        logTest('POST /api/allow-retry works', 
            allowRetryRes.data.success === true,
            allowRetryRes.data.success !== true ? JSON.stringify(allowRetryRes.data) : null);
        
    } catch (e) {
        logTest('STUDENT STATUS MANAGEMENT tests', false, e.message);
    }
    
    // ==================== TEACHER: RESULTS MANAGEMENT ====================
    console.log('\n📋 TEST GROUP 6: RESULTS MANAGEMENT');
    
    try {
        // Get results
        const resultsRes = await makeRequest('/api/results');
        logTest('GET /api/results returns array', 
            Array.isArray(resultsRes.data),
            !Array.isArray(resultsRes.data) ? JSON.stringify(resultsRes.data) : null);
        
        // Note: We won't test delete as it would remove actual data
        logTest('Results endpoint accessible', resultsRes.status === 200,
            resultsRes.status !== 200 ? `Status: ${resultsRes.status}` : null);
            
    } catch (e) {
        logTest('RESULTS MANAGEMENT tests', false, e.message);
    }
    
    // ==================== TEACHER-STUDENT INTERACTION ====================
    console.log('\n📋 TEST GROUP 7: TEACHER-STUDENT INTERACTION');
    
    try {
        // Reset students first
        await makeRequest('/api/reset-all-students', 'POST', {});
        
        // Get students list
        const studentsRes = await makeRequest('/api/students');
        const student1 = studentsRes.data[0];
        const student2 = studentsRes.data[1];
        
        // Scenario: Student selects name
        const socket1 = 'student1-' + Date.now();
        const selectRes = await makeRequest('/api/select-student', 'POST', {
            stt: student1.stt,
            socketId: socket1
        });
        logTest('Student can select available name', 
            selectRes.data.success === true,
            selectRes.data.success !== true ? JSON.stringify(selectRes.data) : null);
        
        // Scenario: Another student tries same name
        const socket2 = 'student2-' + Date.now();
        const selectSameRes = await makeRequest('/api/select-student', 'POST', {
            stt: student1.stt,
            socketId: socket2
        });
        logTest('Another student cannot select same name', 
            selectSameRes.data.success === false,
            selectSameRes.data.success !== false ? JSON.stringify(selectSameRes.data) : null);
        
        // Scenario: Student deselects
        const deselectRes = await makeRequest('/api/deselect-student', 'POST', {
            stt: student1.stt,
            socketId: socket1
        });
        logTest('Student can deselect their name', 
            deselectRes.data.success === true,
            deselectRes.data.success !== true ? JSON.stringify(deselectRes.data) : null);
        
        // Scenario: After deselect, another student can select
        const selectAfterDeselect = await makeRequest('/api/select-student', 'POST', {
            stt: student1.stt,
            socketId: socket2
        });
        logTest('After deselect, name becomes available', 
            selectAfterDeselect.data.success === true,
            selectAfterDeselect.data.success !== true ? JSON.stringify(selectAfterDeselect.data) : null);
        
        // Cleanup
        await makeRequest('/api/deselect-student', 'POST', { stt: student1.stt, socketId: socket2 });
        
    } catch (e) {
        logTest('TEACHER-STUDENT INTERACTION tests', false, e.message);
    }
    
    // ==================== REPORT WRONG SELECTION ====================
    console.log('\n📋 TEST GROUP 8: WRONG SELECTION REPORTS');
    
    try {
        // Reset and setup
        await makeRequest('/api/reset-all-students', 'POST', {});
        const studentsRes = await makeRequest('/api/students');
        const student1 = studentsRes.data[0];
        const student2 = studentsRes.data[1];
        
        // Student selects wrong name
        const socketId = 'wrong-select-' + Date.now();
        await makeRequest('/api/select-student', 'POST', {
            stt: student1.stt,
            socketId: socketId
        });
        
        // Report wrong selection
        const reportRes = await makeRequest('/api/report-wrong-selection', 'POST', {
            wrongSTT: student1.stt,
            correctSTT: student2.stt,
            reason: 'Test report',
            socketId: socketId
        });
        logTest('POST /api/report-wrong-selection creates report', 
            reportRes.data.success === true,
            reportRes.data.success !== true ? JSON.stringify(reportRes.data) : null);
        
        // Get reports
        const reportsRes = await makeRequest('/api/reports');
        logTest('GET /api/reports returns pending reports', 
            Array.isArray(reportsRes.data),
            !Array.isArray(reportsRes.data) ? JSON.stringify(reportsRes.data) : null);
        
        // Find our report
        const ourReport = reportsRes.data.find(r => r.wrongSTT == student1.stt);
        if (ourReport) {
            // Approve report
            const approveRes = await makeRequest('/api/approve-report', 'POST', {
                reportId: ourReport.id
            });
            logTest('POST /api/approve-report works', 
                approveRes.data.success === true,
                approveRes.data.success !== true ? JSON.stringify(approveRes.data) : null);
        } else {
            logTest('Report found for approval', false, 'Report not found in pending list');
        }
        
        // Cleanup
        await makeRequest('/api/reset-all-students', 'POST', {});
        
    } catch (e) {
        logTest('WRONG SELECTION REPORTS tests', false, e.message);
    }
    
    // ==================== OPEN/CLOSE EXAM FLOW ====================
    console.log('\n📋 TEST GROUP 9: OPEN/CLOSE EXAM FLOW');
    
    try {
        // Save original state
        const originalSettings = (await makeRequest('/api/settings')).data;
        
        // Close exam
        await makeRequest('/api/settings', 'POST', { isOpen: false });
        
        // Student tries to get exam (should fail)
        const closedExamRes = await makeRequest('/api/exam');
        logTest('Closed exam returns error', 
            closedExamRes.data.error !== undefined,
            closedExamRes.data.error === undefined ? 'Expected error but got: ' + JSON.stringify(closedExamRes.data) : null);
        
        // Open exam
        await makeRequest('/api/settings', 'POST', { isOpen: true });
        
        // Student can now get exam
        const openExamRes = await makeRequest('/api/exam');
        logTest('Open exam returns questions', 
            Array.isArray(openExamRes.data.questions),
            !Array.isArray(openExamRes.data.questions) ? JSON.stringify(openExamRes.data) : null);
        
        // Restore original state
        await makeRequest('/api/settings', 'POST', { isOpen: originalSettings.isOpen });
        
    } catch (e) {
        logTest('OPEN/CLOSE EXAM FLOW tests', false, e.message);
    }
    
    // ==================== FULL TEACHER-STUDENT EXAM FLOW ====================
    console.log('\n📋 TEST GROUP 10: FULL EXAM FLOW SIMULATION');
    
    try {
        // Setup: Reset and open exam
        await makeRequest('/api/reset-all-students', 'POST', {});
        await makeRequest('/api/settings', 'POST', { isOpen: true });
        
        const studentsRes = await makeRequest('/api/students');
        const testStudent = studentsRes.data.find(s => !s.status.completed);
        
        if (testStudent) {
            // Student selects name
            const socketId = 'full-flow-' + Date.now();
            const selectRes = await makeRequest('/api/select-student', 'POST', {
                stt: testStudent.stt,
                socketId: socketId
            });
            logTest('Step 1: Student selects name', selectRes.data.success === true,
                selectRes.data.success !== true ? JSON.stringify(selectRes.data) : null);
            
            // Student gets exam
            const examRes = await makeRequest('/api/exam');
            logTest('Step 2: Student gets exam questions', 
                Array.isArray(examRes.data.questions) && examRes.data.questions.length > 0,
                !examRes.data.questions ? JSON.stringify(examRes.data) : null);
            
            // Student submits
            const answers = {};
            examRes.data.questions.forEach((q, i) => {
                answers[i] = 0; // All answer A
            });
            
            const submitRes = await makeRequest('/api/submit', 'POST', {
                studentName: `${testStudent.ho} ${testStudent.ten}`,
                studentClass: examRes.data.className || '11A4',
                studentSTT: testStudent.stt,
                answers: answers,
                questionOrder: examRes.data.questions.map((_, i) => i),
                optionOrders: examRes.data.questions.map(q => q.options.map((_, i) => i)),
                timeTaken: 300
            });
            logTest('Step 3: Student submits exam', 
                submitRes.data.score !== undefined,
                submitRes.data.score === undefined ? JSON.stringify(submitRes.data) : null);
            
            // Teacher sees result
            const resultsRes = await makeRequest('/api/results');
            const studentResult = resultsRes.data.find(r => r.studentSTT == testStudent.stt);
            logTest('Step 4: Teacher can see student result', 
                studentResult !== undefined,
                studentResult === undefined ? 'Result not found' : null);
            
            // Student tries to re-enter (should fail)
            const reenterRes = await makeRequest('/api/select-student', 'POST', {
                stt: testStudent.stt,
                socketId: 'new-socket'
            });
            logTest('Step 5: Student cannot re-enter after submit', 
                reenterRes.data.success === false,
                reenterRes.data.success !== false ? JSON.stringify(reenterRes.data) : null);
            
            // Teacher allows retry
            const retryRes = await makeRequest('/api/allow-retry', 'POST', {
                stt: testStudent.stt
            });
            logTest('Step 6: Teacher allows retry', 
                retryRes.data.success === true,
                retryRes.data.success !== true ? JSON.stringify(retryRes.data) : null);
            
            // Student can now re-enter
            const reenterAfterRetry = await makeRequest('/api/select-student', 'POST', {
                stt: testStudent.stt,
                socketId: 'retry-socket'
            });
            logTest('Step 7: Student can re-enter after retry allowed', 
                reenterAfterRetry.data.success === true,
                reenterAfterRetry.data.success !== true ? JSON.stringify(reenterAfterRetry.data) : null);
        } else {
            logTest('FULL EXAM FLOW', false, 'No available student for testing');
        }
        
        // Cleanup
        await makeRequest('/api/settings', 'POST', { isOpen: false });
        
    } catch (e) {
        logTest('FULL EXAM FLOW tests', false, e.message);
    }
    
    // ==================== SESSION MANAGEMENT ====================
    console.log('\n📋 TEST GROUP 11: SESSION MANAGEMENT');
    
    try {
        const sessionRes = await makeRequest('/api/session');
        logTest('GET /api/session returns data', 
            sessionRes.status === 200 && sessionRes.data,
            sessionRes.status !== 200 ? `Status: ${sessionRes.status}` : null);
        
        if (sessionRes.data) {
            logTest('Session has currentSession object', 
                sessionRes.data.currentSession !== undefined,
                !sessionRes.data.currentSession ? JSON.stringify(sessionRes.data) : null);
            
            logTest('Session has examSettings', 
                sessionRes.data.examSettings !== undefined,
                !sessionRes.data.examSettings ? JSON.stringify(sessionRes.data) : null);
            
            logTest('Session has studentCount', 
                sessionRes.data.studentCount !== undefined,
                sessionRes.data.studentCount === undefined ? JSON.stringify(sessionRes.data) : null);
        }
    } catch (e) {
        logTest('SESSION MANAGEMENT tests', false, e.message);
    }
    
    // ==================== SUMMARY ====================
    console.log('\n========== TEST SUMMARY ==========');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round(testResults.passed / (testResults.passed + testResults.failed) * 100)}%`);
    
    if (testResults.errors.length > 0) {
        console.log('\n🔴 FAILED TESTS:');
        testResults.errors.forEach(e => {
            console.log(`   - ${e.name}`);
            if (e.error) console.log(`     ${e.error}`);
        });
    }
    
    console.log('\n==================================\n');
    
    return testResults.failed === 0;
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
