import React, { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateOtp, resetPassword } from '../../services/authService';
import './Settings.css';

// Password reset for the logged-in user via the email-OTP flow:
// send a code to their address, then submit code + new password.
const ResetPassword = ({ onBack }) => {
    const { user } = useAuth();
    const email = user?.email || '';
    const [step, setStep] = useState('request'); // 'request' | 'verify'
    const [otp, setOtp] = useState('');
    const [pw, setPw] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'ok' | 'err', text }

    const sendCode = async () => {
        try {
            setBusy(true);
            setMessage(null);
            await generateOtp(email);
            setStep('verify');
            setMessage({ type: 'ok', text: `We sent a 6-digit code to ${email}. It expires in 5 minutes.` });
        } catch (err) {
            setMessage({ type: 'err', text: err.message });
        } finally {
            setBusy(false);
        }
    };

    const submit = async () => {
        if (!/^\d{6}$/.test(otp.trim())) {
            setMessage({ type: 'err', text: 'Enter the 6-digit code from your email.' });
            return;
        }
        if (pw.length < 8) {
            setMessage({ type: 'err', text: 'New password must be at least 8 characters.' });
            return;
        }
        if (pw !== confirm) {
            setMessage({ type: 'err', text: 'Passwords do not match.' });
            return;
        }
        try {
            setBusy(true);
            setMessage(null);
            await resetPassword(email, otp.trim(), pw);
            setOtp('');
            setPw('');
            setConfirm('');
            setStep('request');
            setMessage({ type: 'ok', text: 'Password reset successfully. Use it the next time you log in.' });
        } catch (err) {
            setMessage({ type: 'err', text: err.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="settings-screen">
            <header className="settings-header">
                <div className="settings-bar-inner">
                    <button className="back-button" onClick={onBack} aria-label="Back"><ArrowLeft size={24} /></button>
                    <h2>Reset Password</h2>
                </div>
            </header>

            <div className="settings-body">
              <div className="settings-content">
                {message && (
                    <div className={`settings-message ${message.type}`}>{message.text}</div>
                )}

                {step === 'request' ? (
                    <section className="settings-section">
                        <p className="settings-hint" style={{ marginTop: 0 }}>
                            We'll email a verification code to <strong>{email}</strong>. Enter it on the next
                            step along with your new password.
                        </p>
                        <div className="settings-row-actions">
                            <button className="settings-btn primary" onClick={sendCode} disabled={busy || !email}>
                                <Lock size={16} /> {busy ? 'Sending...' : 'Send code'}
                            </button>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="settings-section">
                            <label className="settings-label">Verification code</label>
                            <input
                                className="settings-input"
                                value={otp}
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="6-digit code"
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            />
                        </section>

                        <section className="settings-section">
                            <label className="settings-label">New password</label>
                            <input
                                className="settings-input"
                                type="password"
                                value={pw}
                                placeholder="At least 8 characters"
                                onChange={(e) => setPw(e.target.value)}
                            />
                        </section>

                        <section className="settings-section">
                            <label className="settings-label">Confirm new password</label>
                            <input
                                className="settings-input"
                                type="password"
                                value={confirm}
                                placeholder="Re-enter new password"
                                onChange={(e) => setConfirm(e.target.value)}
                            />
                        </section>

                        <div className="settings-row-actions">
                            <button className="settings-btn primary" onClick={submit} disabled={busy}>
                                {busy ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button className="settings-btn" onClick={sendCode} disabled={busy}>
                                Resend code
                            </button>
                        </div>
                        <p className="settings-hint">Code sent to {email}. It expires in 5 minutes.</p>
                    </>
                )}
              </div>
            </div>
        </div>
    );
};

export default ResetPassword;
