const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

interface Props {
  variant?: "footer" | "sidebar" | "post";
}

export default function SocialLinks({ variant = "footer" }: Props) {
  const links = [
    {
      href: "https://www.instagram.com/adelinbtc/",
      label: "Instagram",
      handle: "@adelinbtc",
      icon: <InstagramIcon />,
    },
    {
      href: "https://www.youtube.com/@AdelinBTC",
      label: "YouTube",
      handle: "@AdelinBTC",
      icon: <YouTubeIcon />,
    },
  ];

  if (variant === "sidebar") {
    return (
      <div className="sidebar-social-list">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-social-link"
          >
            {l.icon}
            <span>{l.handle}</span>
            <span className="sidebar-social-name">{l.label}</span>
          </a>
        ))}
      </div>
    );
  }

  if (variant === "post") {
    return (
      <div className="post-social-row">
        <span className="post-social-label">Sígueme en</span>
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="post-social-link"
          >
            {l.icon}
            {l.label}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="footer-social">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-social-link"
        >
          {l.icon}
          <span>{l.label}</span>
        </a>
      ))}
    </div>
  );
}
