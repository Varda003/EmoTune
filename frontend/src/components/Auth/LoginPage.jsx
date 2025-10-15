import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code, 3: new password
  const [resetMessage, setResetMessage] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await authAPI.login({
      email: formData.email,
      password: formData.password,
    });

    // if (response.success) {
    //   // FIX: Save token and user BEFORE navigating
    //   localStorage.setItem('access_token', response.access_token);
    //   localStorage.setItem('user', JSON.stringify(response.user));
      
    //   // Small delay to ensure storage completes
    //   setTimeout(() => {
    //     navigate('/app');
    //   }, 100);
    // }
    if (response.success) {
  // Clean the token before saving
  const cleanToken = response.access_token.trim();
  console.log('💾 Saving token, length:', cleanToken.length);
  console.log('💾 Token preview:', cleanToken.substring(0, 30));
  
  localStorage.setItem('access_token', cleanToken);
  localStorage.setItem('user', JSON.stringify(response.user));
  
  // Verify it was saved
  const savedToken = localStorage.getItem('access_token');
  console.log('✅ Token saved successfully:', !!savedToken);
  console.log('✅ Saved token preview:', savedToken.substring(0, 30));
  
  // Navigate after verification
  setTimeout(() => {
    navigate('/app');
  }, 100);
}
  } catch (err) {
    setError(
      err.response?.data?.message || 
      'Login failed. Please check your credentials.'
    );
  } finally {
    setLoading(false);
  }
};
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);

    try {
      if (resetStep === 1) {
        // Send reset code
        const response = await authAPI.forgotPassword(resetEmail);
        if (response.success) {
          setResetMessage('Reset code sent! Check the console (in production, check your email)');
          if (response.reset_code) {
            console.log('🔑 Reset Code:', response.reset_code);
          }
          setResetStep(2);
        }
      } else if (resetStep === 2) {
        // Verify reset code
        const response = await authAPI.verifyResetCode(resetEmail, resetCode);
        if (response.success) {
          setResetMessage('Code verified! Enter your new password.');
          setResetStep(3);
        }
      } else if (resetStep === 3) {
        // Reset password
        const response = await authAPI.resetPassword(resetEmail, resetCode, newPassword);
        if (response.success) {
          setResetMessage('Password reset successful! You can now login.');
          setTimeout(() => {
            setShowForgotPassword(false);
            setResetStep(1);
            setResetEmail('');
            setResetCode('');
            setNewPassword('');
          }, 2000);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Password reset failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="app-container">
        <div className="background-animation">
          <div className="floating-shapes">
            <div className="shape"></div>
            <div className="shape"></div>
            <div className="shape"></div>
            <div className="shape"></div>
          </div>
        </div>

        <div className="container">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h1 className="logo">EmoTune</h1>
            <p className="tagline">Reset Your Password</p>
          </div>

          <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{
              textAlign: 'center',
              marginBottom: '30px',
              background: 'var(--warning-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.8rem'
            }}>
              {resetStep === 1 && 'Enter Your Email'}
              {resetStep === 2 && 'Enter Reset Code'}
              {resetStep === 3 && 'Create New Password'}
            </h2>

            {error && <div className="error-message">{error}</div>}
            {resetMessage && <div className="success-message">{resetMessage}</div>}

            <form onSubmit={handleForgotPassword}>
              {resetStep === 1 && (
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              )}

              {resetStep === 2 && (
                <div className="form-group">
                  <label className="form-label">Reset Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                    maxLength={6}
                  />
                  <small style={{ opacity: 0.7, display: 'block', marginTop: '10px' }}>
                    Check console for reset code (in production, check your email)
                  </small>
                </div>
              )}

              {resetStep === 3 && (
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter new password (min 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span> Processing...
                  </>
                ) : (
                  <>
                    {resetStep === 1 && 'Send Reset Code'}
                    {resetStep === 2 && 'Verify Code'}
                    {resetStep === 3 && 'Reset Password'}
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-20">
              <button
                className="link-button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetStep(1);
                  setError('');
                  setResetMessage('');
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>

      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h1 className="logo">EmoTune</h1>
          <p className="tagline">
            Welcome Back! Login to Continue Your Musical Journey
          </p>
        </div>

        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '30px',
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '2rem'
          }}>
            Login to Your Account
          </h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-envelope"></i> Email Address
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-lock"></i> Password
              </label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: 'pointer',
                opacity: 0.9
              }}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                />
                Remember me
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span> Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Login to EmoTune
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-20">
            <button
              className="link-button"
              onClick={() => setShowForgotPassword(true)}
              style={{ marginBottom: '15px', display: 'block', width: '100%' }}
            >
              Forgot Password?
            </button>
            <p style={{ opacity: 0.8 }}>
              Don't have an account?{' '}
              <button
                className="link-button"
                onClick={() => navigate('/register')}
                style={{ fontSize: '1rem' }}
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;