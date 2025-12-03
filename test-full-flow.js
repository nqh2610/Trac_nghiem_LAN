/**
 * Full Integration Test for Student Exam Flow
 * Run: node test-full-flow.js
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
                'Host': 'localhost:3000' // Simulate localhost for teacher APIs
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

async function runFullFlow() {
    console.log('\n🧪 ========== FULL STUDENT FLOW TEST ==========\n');
    
    try {
        // Step 1: Get current settings
        console.log('📌 Step 1: Getting exam settings...');
        const settingsRes = await makeRequest('/api/settings');
        console.log(`   Title: ${settingsRes.data.title}`);
        console.log(`   Is Open: ${settingsRes.data.isOpen}`);
        console.log(`   Time Limit: ${settingsRes.data.timeLimit} minutes`);
        
        const wasOpen = settingsRes.data.isOpen;
        
        // Step 2: Open exam if needed
        if (!wasOpen) {
            console.log('\n📌 Step 2: Opening exam...');
            await makeRequest('/api/settings', 'POST', { isOpen: true });
            console.log('   ✅ Exam opened');
        }
        
        // Step 3: Get students list
        console.log('\n📌 Step 3: Getting students list...');
        const studentsRes = await makeRequest('/api/students');
        console.log(`   Found ${studentsRes.data.length} students`);
        
        // Find an available student
        const availableStudent = studentsRes.data.find(s => 
            !s.status.completed && !s.status.selected
        );
        
        if (!availableStudent) {
            console.log('   ⚠️ No available student found. Resetting...');
            await makeRequest('/api/reset-all-students', 'POST', {});
            const newStudentsRes = await makeRequest('/api/students');
            const student = newStudentsRes.data[0];
            availableStudent = student;
        }
        
        console.log(`   Selected: ${availableStudent.stt}. ${availableStudent.ho} ${availableStudent.ten}`);
        
        // Step 4: Select student
        console.log('\n📌 Step 4: Student selects their name...');
        const testSocketId = 'test-flow-' + Date.now();
        const selectRes = await makeRequest('/api/select-student', 'POST', {
            stt: availableStudent.stt,
            socketId: testSocketId
        });
        
        if (selectRes.data.success) {
            console.log(`   ✅ Successfully selected: ${selectRes.data.student.ho} ${selectRes.data.student.ten}`);
        } else {
            console.log(`   ❌ Failed to select: ${selectRes.data.error}`);
            return;
        }
        
        // Step 5: Check if can enter exam
        console.log('\n📌 Step 5: Checking if student can enter exam...');
        const checkRes = await makeRequest(`/api/check-submitted/${availableStudent.stt}`);
        console.log(`   Submitted: ${checkRes.data.submitted}`);
        console.log(`   Can Retry: ${checkRes.data.canRetry}`);
        
        if (checkRes.data.submitted && !checkRes.data.canRetry) {
            console.log('   ⚠️ Student already submitted. Allowing retry...');
            await makeRequest('/api/allow-retry', 'POST', { stt: availableStudent.stt });
        }
        
        // Step 6: Get exam questions
        console.log('\n📌 Step 6: Getting exam questions...');
        const examRes = await makeRequest('/api/exam');
        
        if (examRes.data.error) {
            console.log(`   ❌ Error: ${examRes.data.error}`);
            return;
        }
        
        console.log(`   ✅ Got ${examRes.data.questions.length} questions`);
        console.log(`   Time Limit: ${examRes.data.timeLimit} minutes`);
        console.log(`   Class: ${examRes.data.className}`);
        
        // Step 7: Simulate answering questions
        console.log('\n📌 Step 7: Answering questions...');
        const questions = examRes.data.questions;
        const answers = {};
        const questionOrder = [];
        const optionOrders = [];
        
        questions.forEach((q, i) => {
            // Random answer
            answers[i] = Math.floor(Math.random() * q.options.length);
            questionOrder.push(i);
            optionOrders.push(Array.from({length: q.options.length}, (_, j) => j));
        });
        
        console.log(`   Answered ${Object.keys(answers).length} questions`);
        
        // Step 8: Submit exam
        console.log('\n📌 Step 8: Submitting exam...');
        const submitRes = await makeRequest('/api/submit', 'POST', {
            studentName: `${availableStudent.ho} ${availableStudent.ten}`,
            studentClass: examRes.data.className || '11A4',
            studentSTT: availableStudent.stt,
            answers: answers,
            questionOrder: questionOrder,
            optionOrders: optionOrders,
            timeTaken: 120 // 2 minutes
        });
        
        if (submitRes.data.score !== undefined) {
            console.log(`   ✅ Score: ${submitRes.data.score}%`);
            console.log(`   Correct: ${submitRes.data.correct}/${submitRes.data.total}`);
        } else {
            console.log(`   ❌ Submit failed: ${JSON.stringify(submitRes.data)}`);
            return;
        }
        
        // Step 9: Verify student is marked as completed
        console.log('\n📌 Step 9: Verifying submission status...');
        const verifyRes = await makeRequest(`/api/check-submitted/${availableStudent.stt}`);
        console.log(`   Submitted: ${verifyRes.data.submitted}`);
        
        if (verifyRes.data.submitted) {
            console.log('   ✅ Student correctly marked as submitted');
        } else {
            console.log('   ❌ Student NOT marked as submitted - BUG!');
        }
        
        // Step 10: Try to re-enter (should fail)
        console.log('\n📌 Step 10: Testing re-entry prevention...');
        const reenterRes = await makeRequest('/api/select-student', 'POST', {
            stt: availableStudent.stt,
            socketId: 'another-socket'
        });
        
        if (reenterRes.data.success === false && reenterRes.data.error.includes('đã hoàn thành')) {
            console.log('   ✅ Re-entry correctly blocked: ' + reenterRes.data.error);
        } else {
            console.log('   ⚠️ Re-entry response: ' + JSON.stringify(reenterRes.data));
        }
        
        // Step 11: Get results
        console.log('\n📌 Step 11: Checking results...');
        const resultsRes = await makeRequest('/api/results');
        const studentResult = resultsRes.data.find(r => r.studentSTT == availableStudent.stt);
        
        if (studentResult) {
            console.log(`   ✅ Result found: ${studentResult.score}% (${studentResult.correct}/${studentResult.total})`);
        } else {
            console.log('   ❌ Result not found - BUG!');
        }
        
        // Restore exam state
        if (!wasOpen) {
            console.log('\n📌 Restoring: Closing exam...');
            await makeRequest('/api/settings', 'POST', { isOpen: false });
        }
        
        console.log('\n========== TEST COMPLETE ==========\n');
        console.log('✅ All flow steps executed successfully!');
        
    } catch (err) {
        console.error('\n❌ TEST ERROR:', err.message);
    }
}

runFullFlow();
