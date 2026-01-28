import React, { useState } from 'react';
import api from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';
import { STORAGE_KEYS, API_ENDPOINTS } from '../../constants/config';
import './Login.css';

const Login = ({ onLogin, onSwitchToSignup }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, formData);
            localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.access_token);
            localStorage.setItem(STORAGE_KEYS.USERNAME, username);
            onLogin(username);
        } catch (err) {
            console.error(err);
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background Decor */}
            <div className="glob glob-blue"></div>
            <div className="glob glob-green"></div>

            <div className="login-content">
                <h1 className="brand-title">Texter</h1>
                <p className="brand-subtitle">Welcome back!</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div className="form-group">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="input-field"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <div className="forgot-password">
                        <span onClick={onSwitchToSignup}>Create an account</span>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <div className="signup-link">
                    Don't have an account? <span onClick={onSwitchToSignup}>Join the fun</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
