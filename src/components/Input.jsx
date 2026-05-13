import { useState } from 'react';
import { THEME } from '../data/theme.js';

export function Input({ label, icon: Icon, error, hint, type = 'text', id, ...rest }) {
  const [focus, setFocus] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: THEME.colors.textTertiary, pointerEvents: 'none' }}>
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          type={type}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            padding: Icon ? '12px 44px 12px 14px' : '12px 14px',
            fontSize: 15,
            borderRadius: THEME.radius.md,
            border: `1.5px solid ${error ? THEME.colors.danger : focus ? THEME.colors.accent : THEME.colors.border}`,
            background: THEME.colors.surface,
            outline: 'none',
            direction: 'rtl',
            boxSizing: 'border-box',
            minHeight: 48,
            boxShadow: focus ? THEME.shadows.focus : 'none',
          }}
          {...rest}
        />
      </div>
      {hint && !error && <div style={{ fontSize: 12, color: THEME.colors.textTertiary, marginTop: 4 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: THEME.colors.danger, marginTop: 4, fontWeight: 600 }}>{error}</div>}
    </div>
  );
}
