"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthLinks from "../AuthLinks";
import SettingsMenu from "../SettingsMenu";

const links = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blogs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
];

const Header = () => {
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-900/90 backdrop-blur-md shadow-sm z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <img
            src="/images/logo.webp"
            alt="Summit stories"
            className="w-8 sm:w-14"
          />
          <Link
            href="/"
            className="text-base sm:text-2xl font-bold text-orange-500 dark:text-orange-400"
            onClick={() => setOpen(false)}
          >
            Summit Stories
          </Link>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex gap-5 text-gray-700 dark:text-gray-300 font-medium"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={
                isActive(href)
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-gray-700 dark:text-gray-300"
              }
            >
              {label}
            </Link>
          ))}
          <AuthLinks placement="navigation" />
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="lg:hidden"
            onClick={() => setOpen(!open)}
          >
            <span className="block space-y-1" aria-hidden="true">
              <span className="block w-6 h-0.5 bg-black dark:bg-gray-100"></span>
              <span className="block w-6 h-0.5 bg-black dark:bg-gray-100"></span>
              <span className="block w-6 h-0.5 bg-black dark:bg-gray-100"></span>
            </span>
          </button>
          <SettingsMenu onNavigate={() => setOpen(false)} />
        </div>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="lg:hidden bg-white dark:bg-gray-900 flex flex-col px-6 pb-6 space-y-4"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={
                isActive(href)
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-gray-700 dark:text-gray-300"
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <AuthLinks placement="navigation" onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
};

export default Header;
