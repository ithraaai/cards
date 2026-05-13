import { useState } from 'react';
import { THEME } from '../data/theme.js';

export function Button({ variant = 'primary', size = 'md', icon: Icon, children, onClick, disabled, type = 'button', fullWidth, style = {} }) {
  const [hover, setHover] = useState(false);

  const sizes = {
    sm: { p: '8px 14px', fs: 13, h: 36, is: 16, g: 6 },
    md: { p: '11px 20px', fs: 14, h: 44, is: 18, g: 8 },
    lg: { p: '14px 26px', fs: 15, h: 52, is: 20, g: 10 },
  };

  const variants = {
    primary: { bg: hover ? THEME.colors.primaryHover : THEME.colors.primary, c: '#fff' },
    accent: { bg: hover ? THEME.colors.accentHover : THEME.colors.accent, c: '#fff' },
    outline: { bg: hover ? THEME.colors.bgSecondary : THEME.colors.surface, c: THEME.colors.text, b: `1px solid ${THEME.colors.border}` },
    ghost: { bg: hover ? THEME.colors.bgSecondary : 'transparent', c: THEME.colors.textSecondary },
    danger: { bg: hover ? '#8B2727' : THEME.colors.danger, c: '#fff' },
    success: { bg: hover ? '#245638' : THEME.colors.success, c: '#fff' },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: v.bg,
        color: v.c,
        border: v.b || 'none',
        padding: s.p,
        fontSize: s.fs,
        fontWeight: 600,
        borderRadius: THEME.radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.g,
        height: s.h,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {Icon && <Icon size={s.is} strokeWidth={2.2} />}
      {children}
    </button>
  );
}
