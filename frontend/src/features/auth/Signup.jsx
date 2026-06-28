import React, { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Signup.css';

const Signup = ({ onSwitchToLogin }) => {
    const { signup } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await signup({ firstName, lastName, email, password });
            // signup auto-logs-in; AuthContext flips status and App leaves this screen
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            {/* Background Decor */}
            <div className="glob glob-purple"></div>
            <div className="glob glob-pink"></div>

            <div className="signup-content">
                <div className="header-section">
                    <h1 className="signup-title">Create Account</h1>
                    <p className="signup-subtitle">Join the Texter community today</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="input-label">First Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Last Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Last Name (optional)"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input-field"
                                placeholder="Create a password"
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
                    </div>

                    <div className="form-group">
                        <label className="input-label">Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="input-field"
                                placeholder="Repeat your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <div className="password-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
                                {password && confirmPassword && password === confirmPassword && (
                                    <Check size={20} color="#10B981" />
                                )}
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{ position: 'static', transform: 'none', padding: 0 }}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="signup-button" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="terms-text">
                    By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </p>

                <div className="login-link">
                    Already have an account? <span onClick={onSwitchToLogin}>Log In</span>
                </div>
            </div>
        </div>
    );
};

export default Signup;
