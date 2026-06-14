import React from 'react';
import { Github, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';

const Login = ({ onLogin, error }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md w-full glass p-8 rounded-2xl shadow-xl space-y-8 fade-in">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full" style={{ backgroundColor: 'rgba(88, 166, 255, 0.1)' }}>
            <Github size={64} className="text-github-blue" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-github-blue">GitHub Analytics</h1>
          <p className="text-github-secondary">Personalized insights for your repositories</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border-red-500/50 text-github-red p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="flex flex-col items-center p-3 rounded-xl card">
            <BarChart3 className="text-github-blue mb-2" size={24} />
            <span className="text-xs">Visualizations</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl card text-github-green">
            <TrendingUp className="mb-2" size={24} style={{ color: 'var(--github-green)' }} />
            <span className="text-xs text-github-text">Insights</span>
          </div>
        </div>

        <button 
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 btn-primary transition-all active:scale-95"
          style={{ padding: '1rem' }}
        >
          <Github size={24} />
          Sign in with GitHub
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-github-secondary pt-4">
          <ShieldCheck size={14} />
          <span>Secure OAuth Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
