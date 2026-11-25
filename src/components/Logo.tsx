export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Pioneer Smart Innovate logo mark">
      <rect width="48" height="48" rx="11" fill="#E8720C" />
      <path
        d="M12 33V15h9.2c4.6 0 7.4 2.6 7.4 6.8 0 4.2-2.9 6.9-7.5 6.9h-4.6V33H12Zm4.5-7.9h4.1c2.3 0 3.6-1.3 3.6-3.3 0-2-1.3-3.3-3.6-3.3h-4.1v6.6Z"
        fill="#1F3324"
      />
      <circle cx="33.5" cy="15.5" r="3.1" fill="#1F3324" />
    </svg>
  );
}

export function SidebarBrand() {
  return (
    <div className="sidebar-brand">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
      <img src="/brand/psi-logo-mark.png" alt="Pioneer Smart Innovate logo mark" className="sidebar-brand-mark" />
      <div className="sidebar-brand-text">
        <div className="pname">Pioneer Smart Innovate</div>
        <div className="ptag">Public Works Intelligence · Prototype</div>
      </div>
    </div>
  );
}
