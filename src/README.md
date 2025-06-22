
# Gym Management App (Momentum)

This is a React-based web application for managing a gym, built with Vite, TailwindCSS, shadcn/ui, and Framer Motion.

## Project Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Development Server:**
    ```bash
    npm run dev
    ```

3.  **Build for Production:**
    ```bash
    npm run build
    ```

## Supabase Integration & Security

This application is designed for client-only access to Supabase. It is **CRITICAL** that you:

1.  **Complete Supabase Project Setup:**
    *   Create a Supabase project at [supabase.com](https://supabase.com).
    *   Obtain your Project URL and Anon Key.
    *   Update `src/lib/supabaseClient.js` with these credentials if you are setting it up manually (though this is typically handled by the Hostinger Horizons environment integration).

2.  **Enable Row-Level Security (RLS):**
    *   For **ALL** tables in your Supabase database, enable Row-Level Security (RLS).
    *   Define appropriate RLS policies for each table to control data access. Policies should be based on `auth.uid()` for user-specific data or `auth.role()` for role-based access.
    *   **DO NOT** rely solely on client-side checks for security. RLS is essential for protecting your data.

    **Example RLS Policy (Conceptual):**
    For a `members` table, you might have policies like:
    *   Allow authenticated users to select their own record:
        ```sql
        CREATE POLICY "Allow individual read access"
        ON members FOR SELECT
        USING (auth.uid() = user_id); 
        ```
        (Assuming `user_id` column in `members` table stores the `auth.uid()` of the user)
    *   Allow staff members to select all records:
        ```sql
        CREATE POLICY "Allow staff to read all members"
        ON members FOR SELECT
        USING (auth.role() = 'staff'); 
        ```
        (This requires custom claims or a separate roles table linked to `auth.users`)

    **Refer to Supabase RLS documentation for detailed instructions.**

## Seed Data

Initial data for entities like staff roles, membership types, classes, etc., is located in `src/scripts/seedData/`.

**Using Seed Data with Supabase:**

*   **Manual Entry:** For small datasets, you can manually enter this data via the Supabase dashboard.
*   **CSV Import:** Convert the JavaScript arrays into CSV files and use Supabase's CSV import feature.
*   **Custom Scripts:** For more complex seeding or automation, you can write Node.js scripts using the `supabase-js` library to insert this data. This is recommended for larger or more relational datasets. Ensure your script authenticates with service_role key for bypassing RLS during seeding (use with extreme caution and never expose this key on the client-side).

## Testing (Vitest)

This project uses Vitest for unit and component testing.

1.  **Run Tests:**
    ```bash
    npm test
    ```

2.  **Run Tests with UI:**
    ```bash
    npm run test:ui
    ```

**Vite Configuration for Vitest:**
To enable Vitest, your `vite.config.js` file should include a `test` configuration block. If you are managing this file manually, ensure it looks something like this:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: { // Vitest configuration
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js', // Optional: if you have a setup file
    // you might want to disable it, if you don't have tests that rely on CSS
    // since parsing CSS is slow
    css: true, 
  },
});
```
**Note:** The Hostinger Horizons environment manages `vite.config.js`. The above is for reference if manual setup is needed outside this environment.

## Key Technologies

*   Vite
*   React 18
*   React Router 6
*   TailwindCSS
*   shadcn/ui
*   Framer Motion
*   Lucide React
*   Supabase (as backend via client-side SDK)
*   Vitest (for testing)

## Folder Structure Highlights

*   `src/components/`: Reusable UI components.
    *   `src/components/ui/`: shadcn/ui components.
*   `src/contexts/`: React context providers (e.g., `AuthContext.jsx`).
*   `src/hooks/`: Custom React hooks.
*   `src/layouts/`: Layout components for different parts of the app.
*   `src/lib/`: Core logic, utilities, and initial data.
    *   `src/lib/utils/`: Utility functions.
    *   `src/lib/initialData/`: Initial data for development and testing.
*   `src/services/`: API service layer.
    *   `src/services/apiService.js`: Centralized API service for all database operations.
*   `src/pages/`: Page components mapped to routes.
*   `src/lib/initialData/`: Initial data for development and testing.
*   `src/test/`: Test files and setup.
