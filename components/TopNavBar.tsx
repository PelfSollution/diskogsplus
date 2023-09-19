import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { Drawer, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Button } from "@/components/ui/button";

import { deleteCookie } from "cookies-next";



interface TopNavBarProps {
  isLoggedIn: boolean;
  onLogout?: () => void;
}

interface NavigationButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function TopNavBar({ isLoggedIn }: TopNavBarProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!isLoggedIn) return null;

  const handleLogout = async () => {
    deleteCookie("username", { path: "/" });
    deleteCookie("isLoggedIn", { path: "/" });
    deleteCookie("CookieConsent", { path: "/" });
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`);
    router.push("/");
  };

  const NavigationButton: React.FC<NavigationButtonProps> = ({
    href,
    children,
    className = "",
  }) => (
    <Button
      variant="outline"
      size={"sm"}
      className={`${className} tw-opacity-100 hover:tw-opacity-70 tw-w-full ${
        router.pathname === href ? "tw-border-blue-400 tw-text-blue-400" : ""
      }`}
      onClick={() => router.push(href)}
    >
      {children}
    </Button>
  );

  const NavigationItems = ({ isDrawer = false }) => (
    <>
      <NavigationButton
        href="/dashboard"
        className={isDrawer ? "tw-w-full tw-mb-2" : ""}
      >
        Home
      </NavigationButton>
      <NavigationButton
        href="/albums"
        className={isDrawer ? "tw-w-full tw-mb-2" : ""}
      >
        Discos
      </NavigationButton>
      <NavigationButton
        href="/mixtape"
        className={isDrawer ? "tw-w-full tw-mb-2" : ""}
      >
        Mixtape
      </NavigationButton>
      <NavigationButton
        href="/matching"
        className={isDrawer ? "tw-w-full tw-mb-2" : ""}
      >
        Matching
      </NavigationButton>
      <NavigationButton
        href="/wantlist"
        className={isDrawer ? "tw-w-full tw-mb-2" : ""}
      >
        Wantlist
      </NavigationButton>
      <li className={`${isDrawer ? "tw-w-full tw-mb-2" : "tw-mr-4"}`}>
        <Button
          variant="destructive"
          size={"sm"}
          onClick={handleLogout}
          className="tw-opacity-100 hover:tw-opacity-70 tw-bg-red-400 hover:tw-bg-red-400 tw-text-white tw-w-full tw-mr-4"
        >
          Logout
        </Button>
      </li>
      <div className="tw-mr-4"></div>
    </>
  );

  return (
    <nav className="tw-w-full tw-bg-white tw-shadow-md tw-py-2 tw-fixed tw-top-0 tw-left-0 tw-z-10">
      <div className="tw-max-w-screen-xl tw-mx-auto tw-flex tw-justify-between tw-items-center tw-px-4 lg:tw-px-0">
        <Link href="/dashboard" className="lg:tw-ml-4">
          <Image
            src="/diskogs-logo.gif"
            alt="Diskogs plus"
            className="lg:tw-ml-4 tw-w-24"
            width={200}
            height={60}
          />
        </Link>

        <div className="lg:tw-hidden">
          <IconButton onClick={() => setIsDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        </div>
        <ul className="tw-hidden lg:tw-flex tw-space-x-4 tw-items-center">
          <NavigationItems />
        </ul>
      </div>
      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <div className="tw-space-y-4 tw-py-4 tw-px-8">
          <Image
            src="/diskogs-logo.gif"
            alt="Diskogs plus"
            className="tw-w-24 tw-mx-auto tw-block tw-mb-4"
            width={200}
            height={60}
          />
          <ul>
            <NavigationItems isDrawer={true} />
          </ul>
        </div>
      </Drawer>
    </nav>
  );
}
