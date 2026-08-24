type CareMddLogoProps = {
  className?: string;
};

export default function CareMddLogo({ className }: CareMddLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 160"
      role="img"
      aria-label="CARE-MDD logo"
    >
      <defs>
        <linearGradient id="care-mdd-gradient" x1="24" y1="20" x2="140" y2="146">
          <stop stopColor="#1fc8ae" />
          <stop offset="1" stopColor="#168fb4" />
        </linearGradient>
        <filter id="care-mdd-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#0b6f71" floodOpacity=".2" />
        </filter>
      </defs>

      <rect
        x="12"
        y="12"
        width="136"
        height="136"
        rx="42"
        fill="url(#care-mdd-gradient)"
        filter="url(#care-mdd-shadow)"
      />
      <path
        d="M42 43h76c8 0 14 6 14 14v49c0 8-6 14-14 14H77l-24 17 5-17H42c-8 0-14-6-14-14V57c0-8 6-14 14-14Z"
        fill="#ffffff"
      />

      <path
        d="m55 78 21-17 27 10 13 23-29 13-27-10-5-19Z"
        fill="none"
        stroke="#9ddfd4"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="55" cy="78" r="9" fill="#1cb69f" />
      <circle cx="76" cy="61" r="9" fill="#168fb4" />
      <circle cx="103" cy="71" r="9" fill="#6a7de1" />
      <circle cx="116" cy="94" r="9" fill="#168fb4" />
      <circle cx="87" cy="107" r="9" fill="#1cb69f" />
      <circle cx="60" cy="97" r="9" fill="#6a7de1" />
      <circle cx="52" cy="61" r="3.5" fill="#d7f5ef" />
      <circle cx="119" cy="61" r="3.5" fill="#d7f5ef" />
    </svg>
  );
}
