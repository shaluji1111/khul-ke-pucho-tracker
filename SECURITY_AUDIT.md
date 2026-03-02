# Security Audit Findings

## 1. SQL Injection Vulnerability
- **Location**: `backend/src/routes/tasks.ts` in the `/metrics` route.
- **Description**: The `startDate` and `endDate` query parameters are directly embedded into the SQL query using template literals. This allows an attacker to inject arbitrary SQL commands.
- **Impact**: Unauthorized access to database data, potential data modification or deletion.

## 2. Insecure ID Generation
- **Location**: `backend/src/routes/auth.ts`, `backend/src/routes/users.ts`, `backend/src/routes/tasks.ts`.
- **Description**: The `generateId` function uses `Math.random()`, which is not cryptographically secure and could lead to predictable IDs.
- **Impact**: Predictable resource IDs, potential for ID enumeration or collision.

## 3. Weak Default JWT Secret
- **Location**: `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`.
- **Description**: The `JWT_SECRET` has a hardcoded default value of `'supersecret'`.
- **Impact**: If the application is deployed without setting an environment variable, an attacker can easily forge JWT tokens.

## 4. Permissive CORS Configuration
- **Location**: `backend/src/index.ts`.
- **Description**: `app.use(cors())` allows all origins to access the API.
- **Impact**: Cross-Origin Resource Sharing (CORS) should be restricted to trusted domains to prevent unauthorized cross-origin requests.

## 5. Lack of Input Validation
- **Location**: Multiple routes in the backend.
- **Description**: Many routes accept user input without thorough validation or sanitization beyond basic presence checks.
- **Impact**: Potential for various injection attacks, denial of service via large inputs, or unexpected application behavior.
