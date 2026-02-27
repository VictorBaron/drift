import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function LoginPage() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.getMe,
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (data) navigate('/dashboard', { replace: true });
  }, [data, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F3EF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Newsreader:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E8E6E1',
          padding: '48px 56px',
          textAlign: 'center',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#1A1A1A',
              letterSpacing: '-0.03em',
            }}
          >
            pulse<span style={{ color: '#FF6B35' }}>.</span>
          </span>
          <div
            style={{
              display: 'inline-block',
              fontSize: 10,
              color: '#666',
              background: '#F0EEED',
              padding: '2px 7px',
              borderRadius: 4,
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginLeft: 6,
              verticalAlign: 'middle',
            }}
          >
            BETA
          </div>
        </div>

        <h1
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 26,
            fontWeight: 400,
            color: '#1A1A1A',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
          }}
        >
          The weekly pulse your team actually reads
        </h1>

        <p style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.6, margin: '0 0 32px' }}>
          Drift reads your Slack, Linear, and Notion to generate the project status your Product &amp; Engineering teams
          share.
        </p>

        <a
          href={`${API_BASE}/auth/slack`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '12px 24px',
            background: '#4A154B',
            color: '#FFFFFF',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="20" height="20" viewBox="0 0 122.8 122.8" aria-hidden="true">
            <path
              d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
              fill="#E01E5A"
            />
            <path
              d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
              fill="#36C5F0"
            />
            <path
              d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"
              fill="#2EB67D"
            />
            <path
              d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
              fill="#ECB22E"
            />
          </svg>
          Add to Slack
        </a>

        <p style={{ fontSize: 12, color: '#A09B94', marginTop: 20 }}>Requires Slack workspace admin permissions</p>
      </div>
    </div>
  );
}
