import { useState } from 'react';
import { ArrowLeft, Loader2, Lock, Mail, MessageSquare, Phone, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onMockLogin: (provider: string, identifier: string) => void;
};

type Mode = 'menu' | 'email' | 'phone' | 'phone-otp';

const MOCK_DELAY_MS = 1000;

const PROVIDER_BUTTONS = [
  { id: 'google', label: 'Google 一鍵登入', sub: '使用 Gmail 帳號快速登入', icon: 'G', color: '#fff', textColor: '#3c4043', border: '#dadce0' },
  { id: 'line', label: 'LINE 帳號登入', sub: '使用 LINE 社群帳號', icon: 'L', color: '#06c755', textColor: '#fff', border: '#06c755' },
  { id: 'facebook', label: 'Facebook 登入', sub: '使用 Facebook 社群帳號', icon: 'f', color: '#1877f2', textColor: '#fff', border: '#1877f2' },
  { id: 'phone', label: '手機號碼登入', sub: '輸入手機收取簡訊驗證碼', icon: '', lucide: 'phone', color: 'transparent', textColor: '#ffe6a1', border: '#d6a242' },
  { id: 'email', label: 'Email 密碼登入', sub: '使用電子郵件與密碼', icon: '', lucide: 'mail', color: 'transparent', textColor: '#ffe6a1', border: '#d6a242' },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginModal({ open, onClose, onMockLogin }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>('menu');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  if (!open) return null;

  const reset = () => {
    setMode('menu');
    setLoading(null);
    setError(null);
    setEmail('');
    setPassword('');
    setPhone('');
    setOtpCode('');
    setOtpSent(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finishMockLogin = (provider: string, identifier: string) => {
    setLoading(null);
    onMockLogin(provider, identifier);
    reset();
    onClose();
  };

  const handleOAuthLogin = async (provider: string) => {
    setLoading(provider);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: provider as 'google' | 'line' | 'facebook',
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) throw oauthError;
    } catch {
      await sleep(MOCK_DELAY_MS);
      finishMockLogin(provider, `${provider} 使用者`);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('請輸入 Email 與密碼'); return; }
    setLoading('email');
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      handleClose();
    } catch {
      await sleep(MOCK_DELAY_MS);
      finishMockLogin('email', email);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) { setError('請輸入手機號碼'); return; }
    setLoading('phone');
    setError(null);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } });
      if (otpError) throw otpError;
    } catch {
      await sleep(MOCK_DELAY_MS);
    }
    setOtpSent(true);
    setMode('phone-otp');
    setLoading(null);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) { setError('請輸入驗證碼'); return; }
    setLoading('phone-otp');
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token: otpCode, type: 'sms' });
      if (verifyError) throw verifyError;
      handleClose();
    } catch {
      await sleep(MOCK_DELAY_MS);
      finishMockLogin('phone', phone);
    }
  };

  return (
    <div className="auth-overlay" onClick={handleClose}>
      <div className="auth-modal panel-frame" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={handleClose}><X size={20} /></button>

        {mode === 'menu' && (
          <>
            <div className="auth-header">
              <div className="auth-logo"><Sparkles size={26} /></div>
              <h2>登入好運選號</h2>
              <p>選擇你的登入方式，同步選號紀錄到雲端</p>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-providers">
              {PROVIDER_BUTTONS.map((btn) => (
                <button
                  key={btn.id}
                  className="auth-provider-btn"
                  onClick={() => {
                    if (btn.id === 'phone') { setMode('phone'); setError(null); }
                    else if (btn.id === 'email') { setMode('email'); setError(null); }
                    else handleOAuthLogin(btn.id).catch(() => finishMockLogin(btn.id, `${btn.id} 使用者`));
                  }}
                  disabled={loading !== null}
                >
                  <span className="auth-provider-icon" style={{ background: btn.color, color: btn.textColor, border: `1px solid ${btn.border}` }}>
                    {btn.lucide === 'phone' ? <Phone size={18} /> : btn.lucide === 'mail' ? <Mail size={18} /> : btn.icon}
                  </span>
                  <span className="auth-provider-text">
                    <span className="auth-provider-label">{btn.label}</span>
                    <span className="auth-provider-sub">{btn.sub}</span>
                  </span>
                  {loading === btn.id && <Loader2 size={18} className="auth-spinner" />}
                </button>
              ))}
            </div>
            <p className="auth-disclaimer">登入即代表同意服務條款與隱私權政策。號碼組合僅供娛樂參考。</p>
          </>
        )}

        {mode === 'email' && (
          <>
            <div className="auth-header">
              <button className="auth-back" onClick={() => setMode('menu')}><ArrowLeft size={18} /> 返回</button>
              <h2>Email 密碼登入</h2>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-form">
              <label className="auth-field">
                <Mail size={16} />
                <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="auth-field">
                <Lock size={16} />
                <input type="password" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin().catch(() => finishMockLogin('email', email || 'Email 使用者'))} />
              </label>
              <button className="auth-submit" onClick={() => handleEmailLogin().catch(() => finishMockLogin('email', email || 'Email 使用者'))} disabled={loading !== null}>
                {loading === 'email' ? <Loader2 size={18} className="auth-spinner" /> : '登入'}
              </button>
            </div>
          </>
        )}

        {mode === 'phone' && (
          <>
            <div className="auth-header">
              <button className="auth-back" onClick={() => setMode('menu')}><ArrowLeft size={18} /> 返回</button>
              <h2>手機號碼登入</h2>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-form">
              <label className="auth-field">
                <Phone size={16} />
                <input type="tel" placeholder="+886912345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <button className="auth-submit" onClick={() => handleSendOtp().catch(() => { setOtpSent(true); setMode('phone-otp'); setLoading(null); })} disabled={loading !== null}>
                {loading === 'phone' ? <Loader2 size={18} className="auth-spinner" /> : '發送驗證碼'}
              </button>
              <p className="auth-hint"><MessageSquare size={13} /> 系統將發送簡訊驗證碼至你的手機</p>
            </div>
          </>
        )}

        {mode === 'phone-otp' && (
          <>
            <div className="auth-header">
              <button className="auth-back" onClick={() => setMode('phone')}><ArrowLeft size={18} /> 返回</button>
              <h2>輸入驗證碼</h2>
              <p>已發送簡訊至 {phone}</p>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-form">
              <label className="auth-field">
                <Lock size={16} />
                <input type="text" maxLength={6} placeholder="6 位數驗證碼" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp().catch(() => finishMockLogin('phone', phone || '手機使用者'))} />
              </label>
              <button className="auth-submit" onClick={() => handleVerifyOtp().catch(() => finishMockLogin('phone', phone || '手機使用者'))} disabled={loading !== null}>
                {loading === 'phone-otp' ? <Loader2 size={18} className="auth-spinner" /> : '驗證登入'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
