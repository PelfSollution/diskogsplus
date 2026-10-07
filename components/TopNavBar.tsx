import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { deleteCookie } from "cookies-next";
import {
  Menu,
  X,
  Disc,
  ListMusic,
  Users2,
  Bookmark,
  LogOut,
  Bot,
  User,
} from "lucide-react";

interface TopNavBarProps {
  isLoggedIn: boolean;
  onLogout?: () => void;
}

export default function TopNavBar({ isLoggedIn }: TopNavBarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isLoggedIn) return null;

  const handleLogout = async () => {
    deleteCookie("username", { path: "/" });
    deleteCookie("isLoggedIn", { path: "/" });
    deleteCookie("CookieConsent", { path: "/" });
    try {
      await fetch("/api/auth/logout");
    } catch {
      // Ignorar si falla
    }
    router.push("/");
  };

  const navLinks = [
    { href: "/dashboard", label: "Home", icon: User },
    { href: "/albums", label: "Discos", icon: Disc },
    { href: "/mixtape", label: "Mixtape", icon: ListMusic },
    { href: "/matching", label: "Matching", icon: Users2 },
    { href: "/wantlist", label: "Wantlist", icon: Bookmark },
    { href: "/chat", label: "DiscBOT", icon: Bot, isSpecial: true },
  ];

  return (
    <nav className="tw-fixed tw-top-0 tw-left-0 tw-w-full tw-z-40 tw-bg-white/90 dark:tw-bg-gray-900/90 tw-backdrop-blur-md tw-border-b tw-border-gray-200 dark:tw-border-gray-800 tw-transition-colors">
      <div className="tw-max-w-7xl tw-mx-auto tw-flex tw-items-center tw-justify-between tw-px-4 md:tw-px-6 tw-h-16">
        {/* Logo */}
        <Link href="/dashboard" className="tw-flex tw-items-center tw-gap-2 tw-group">
          <Image
            src="/diskogs-logo.gif"
            alt="Diskogs Plus"
            width={120}
            height={36}
            className="tw-h-8 tw-w-auto group-hover:tw-opacity-90 tw-transition-opacity"
            priority
          />
        </Link>

        {/* Enlaces de Navegación de Escritorio */}
        <ul className="tw-hidden md:tw-flex tw-items-center tw-gap-1.5">
          {navLinks.map((link) => {
            const isActive = router.pathname === link.href;
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`tw-flex tw-items-center tw-gap-1.5 tw-px-3.5 tw-py-2 tw-rounded-xl tw-text-xs tw-font-semibold tw-transition-all ${
                    link.isSpecial
                      ? isActive
                        ? "tw-bg-purple-600 tw-text-white tw-shadow-sm"
                        : "tw-bg-purple-50 dark:tw-bg-purple-950/40 tw-text-purple-700 dark:tw-text-purple-300 hover:tw-bg-purple-100 dark:hover:tw-bg-purple-900/50"
                      : isActive
                      ? "tw-bg-amber-500 tw-text-white tw-shadow-sm"
                      : "tw-text-gray-600 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800 hover:tw-text-gray-900 dark:hover:tw-text-white"
                  }`}
                >
                  <Icon className="tw-w-3.5 tw-h-3.5" />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}

          {/* Botón Logout */}
          <li className="tw-ml-2">
            <button
              type="button"
              onClick={handleLogout}
              className="tw-flex tw-items-center tw-gap-1.5 tw-px-3.5 tw-py-2 tw-rounded-xl tw-text-xs tw-font-semibold tw-text-red-600 dark:tw-text-red-400 hover:tw-bg-red-50 dark:hover:tw-bg-red-950/40 tw-transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="tw-w-3.5 tw-h-3.5" />
              <span>Logout</span>
            </button>
          </li>
        </ul>

        {/* Botón Menú Móvil */}
        <div className="md:tw-hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="tw-p-2 tw-rounded-xl tw-text-gray-600 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800 tw-transition-colors"
            aria-label="Alternar menú de navegación"
          >
            {isMobileMenuOpen ? <X className="tw-w-6 tw-h-6" /> : <Menu className="tw-w-6 tw-h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {isMobileMenuOpen && (
        <div className="md:tw-hidden tw-bg-white dark:tw-bg-gray-900 tw-border-b tw-border-gray-200 dark:tw-border-gray-800 tw-px-4 tw-py-3 tw-space-y-1.5 tw-shadow-xl animate-in tw-slide-in-from-top-2">
          {navLinks.map((link) => {
            const isActive = router.pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`tw-flex tw-items-center tw-gap-2.5 tw-w-full tw-px-4 tw-py-2.5 tw-rounded-xl tw-text-sm tw-font-semibold tw-transition-colors ${
                  isActive
                    ? "tw-bg-amber-500 tw-text-white"
                    : "tw-text-gray-700 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800"
                }`}
              >
                <Icon className="tw-w-4 tw-h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="tw-pt-2 tw-border-t tw-border-gray-100 dark:tw-border-gray-800">
            <button
              type="button"
              onClick={handleLogout}
              className="tw-flex tw-items-center tw-gap-2.5 tw-w-full tw-px-4 tw-py-2.5 tw-rounded-xl tw-text-sm tw-font-semibold tw-text-red-600 hover:tw-bg-red-50 dark:hover:tw-bg-red-950/40 tw-transition-colors"
            >
              <LogOut className="tw-w-4 tw-h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
