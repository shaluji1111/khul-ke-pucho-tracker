import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function verify() {
    try {
        console.log('1. Verifying Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            name: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        console.log('2. Verifying Health Check...');
        const healthRes = await axios.get(`${API_URL}/health`);
        console.log('Health check:', healthRes.data);

        console.log('3. Verifying User List (Auth Required)...');
        const usersRes = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Fetched ${usersRes.data.length} users.`);

        console.log('4. Verifying Task Creation...');
        const taskRes = await axios.post(`${API_URL}/tasks`, {
            title: 'Test Task',
            description: 'This is a test task',
            type: 'miscellaneous',
            assigned_to: loginRes.data.user.id
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Task created with ID:', taskRes.data.id);

        console.log('5. Verifying Metrics (SQL Injection Fix)...');
        const metricsRes = await axios.get(`${API_URL}/tasks/metrics`, {
            params: { startDate: '2024-01-01', endDate: '2024-12-31' },
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Metrics fetched successfully.');

        console.log('All basic functionality verified.');

    } catch (error: any) {
        console.error('Verification failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

verify();
