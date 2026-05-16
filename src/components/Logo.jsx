// مكون شعار شركة إثراء التجربة
// الحجم يمكن تخصيصه عبر prop height
export function Logo({ height = 40, style = {} }) {
  return (
    <img
      src="/logo.png"
      alt="شعار إثراء التجربة"
      style={{
        height,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}
