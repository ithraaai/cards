import { THEME } from '../data/theme.js';

export function Card({ children, style = {}, padding = 20, className = '' }) {
  return (
    <div className={className} style={{
      background: THEME.colors.surface,
      borderRadius: THEME.radius.lg,
      border: `1px solid ${THEME.colors.border}`,
      padding,
      boxShadow: THEME.shadows.sm,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'gray', style = {} }) {
  const colors = {
    gray: { bg: '#EEEAE1', fg: '#444441' },
    success: { bg: THEME.colors.successSoft, fg: THEME.colors.success },
    warning: { bg: THEME.colors.warningSoft, fg: THEME.colors.warning },
    danger: { bg: THEME.colors.dangerSoft, fg: THEME.colors.danger },
    info: { bg: THEME.colors.infoSoft, fg: THEME.colors.info },
    accent: { bg: '#F3EADA', fg: '#8B6F3D' },
    purple: { bg: THEME.colors.purpleSoft, fg: THEME.colors.purple },
  };
  const c = colors[color] || colors.gray;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      borderRadius: THEME.radius.full,
      background: c.bg,
      color: c.fg,
      fontSize: 12,
      fontWeight: 600,
      ...style,
    }}>
      {children}
    </span>
  );
}
