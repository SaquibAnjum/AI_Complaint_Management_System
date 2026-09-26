/**
 * DEPRECATED — redirects to /signup
 * This file is kept as a safety fallback; the route in App.jsx redirects /register → /signup.
 */
import { Navigate } from 'react-router-dom';
const Register = () => <Navigate to="/signup" replace />;
export default Register;
