import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { deleteCookie } from "cookies-next";
import { Home, Disc3, Heart, ListMusic, Bot, Users2, LogOut, Plus } from "lucide-react";
import useGetUserData from "@/hooks/useGetUserData";
import useMixtapes from "@/hooks/useMixtapes";
import VinylDisc from "@/components/VinylDisc";

const NAV_LINKS = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/albums", label: "Colección", icon: Disc3 },
  { href: "/wantlist", label: "Wantlist", icon: Heart },
  { href: "/mixtape", label: "Mixtapes", icon: ListMusic },
  { href: "/chat", label: "DiscBOT", icon: Bot },
  { href: "/matching", label: "Comparar colecciones", icon: Users2 },
];

/** Logo: vinilo con galleta verde y «Diskogs+». */
export function AppLogo() {
  return (
    <Link href="/dashboard" className="tw-flex tw-items-center tw-gap-2.5 tw-px-2">
      <VinylDisc size={28} flat />
      <span className="tw-text-lg tw-font-bold tw-tracking-tight tw-text-gray-900">
        Diskogs<span className="tw-text-brand-600">+</span>
      </span>
    </Link>
  );
}

type AppSidebarProps = {
  /** Se llama al navegar (cierra el menú en el móvil) */
  onNavigate?: () => void;
};

/**
 * Barra lateral de la app (docs/design.md §5): navegación, mixtapes del
 * usuario y sesión. En escritorio va fija; en el móvil, dentro de un panel.
 */
export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  const router = useRouter();
  const { data: userData } = useGetUserData();
  const username = userData?.userProfile?.username || "";
  const avatar = userData?.userProfile?.avatar_url;
  const mixtapes = useMixtapes(username);

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

  const openMixtape = (id: number) => {
    mixtapes.setActiveId(id);
    onNavigate?.();
    router.push(`/mixtape?id=${id}`);
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="tw-flex tw-flex-col tw-gap-7 tw-h-full tw-overflow-y-auto tw-bg-gray-50 tw-border-r tw-border-gray-200 tw-px-4 tw-py-6"
    >
      <AppLogo />

      <ul className="tw-flex tw-flex-col tw-gap-0.5">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = router.pathname === href || router.pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`tw-flex tw-items-center tw-gap-3 tw-px-2.5 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-colors ${
                  isActive
                    ? "tw-bg-white tw-font-semibold tw-text-gray-900 tw-shadow-sm"
                    : "tw-font-medium tw-text-gray-600 hover:tw-bg-gray-100 hover:tw-text-gray-900"
                }`}
              >
                <Icon className={`tw-w-[18px] tw-h-[18px] ${isActive ? "tw-text-brand-600" : ""}`} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {mixtapes.mixtapes && mixtapes.mixtapes.length > 0 && (
        <div className="tw-flex tw-flex-col tw-gap-1.5">
          <div className="tw-flex tw-items-center tw-justify-between tw-px-2">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-gray-500">
              Mis mixtapes
            </span>
            <Link
              href="/mixtape?nueva=1"
              onClick={onNavigate}
              aria-label="Nueva mixtape"
              title="Nueva mixtape"
              className="tw-w-7 tw-h-7 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-gray-600 hover:tw-text-gray-900 tw-flex tw-items-center tw-justify-center"
            >
              <Plus className="tw-w-3.5 tw-h-3.5" />
            </Link>
          </div>
          <ul className="tw-flex tw-flex-col tw-gap-0.5">
            {mixtapes.mixtapes.map((m) => {
              const isActive = m.id === mixtapes.activeId && router.pathname === "/mixtape";
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => openMixtape(m.id)}
                    className={`tw-w-full tw-flex tw-items-center tw-gap-2.5 tw-p-2 tw-rounded-xl tw-text-left tw-transition-colors ${
                      isActive ? "tw-bg-white tw-shadow-sm" : "hover:tw-bg-gray-100"
                    }`}
                  >
                    <VinylDisc
                      size={32}
                      flat
                      labelColor={m.id === mixtapes.activeId ? undefined : "#a8a29e"}
                    />
                    <span className="tw-flex tw-flex-col tw-min-w-0">
                      <span className="tw-text-[13px] tw-font-semibold tw-text-gray-900 tw-truncate">{m.nombre}</span>
                      <span className="tw-text-xs tw-text-gray-500">
                        {m.pistas === 1 ? "1 pista" : `${m.pistas} pistas`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="tw-mt-auto tw-flex tw-items-center tw-gap-2.5 tw-px-2">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="tw-w-8 tw-h-8 tw-rounded-full tw-object-cover tw-bg-gray-200" />
        ) : (
          <span className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-gray-200 tw-flex tw-items-center tw-justify-center tw-text-sm tw-font-semibold tw-text-gray-700">
            {username.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="tw-flex-1 tw-min-w-0 tw-text-sm tw-font-medium tw-text-gray-800 tw-truncate">{username}</span>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="tw-w-8 tw-h-8 tw-rounded-lg tw-text-gray-500 hover:tw-text-red-600 hover:tw-bg-red-50 tw-flex tw-items-center tw-justify-center tw-transition-colors"
        >
          <LogOut className="tw-w-4 tw-h-4" />
        </button>
      </div>
    </nav>
  );
}
