import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { deleteCookie } from "cookies-next";
import { Button } from "@/components/ui/button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

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

  const NavigationButton: React.FC<NavigationButtonProps> = ({ href, children, className = '' }) => (
    <Button
      variant="outline"
      size={"sm"}
      className={`${className} tw-opacity-100 hover:tw-opacity-70 tw-w-full tw-mb-2`}
      onClick={() => router.push(href)}
    >
      {children}
    </Button>
  );
  

  const NavigationItems = ({ isDrawer = false }) => (
    <>
      <NavigationButton href="/dashboard" className={isDrawer ? "tw-w-full" : ""}>Home</NavigationButton>
      <NavigationButton href="/albums" className={isDrawer ? "tw-w-full tw-mb-2" : ""}>Álbumes</NavigationButton>
      <NavigationButton href="/mixtape" className={isDrawer ? "tw-w-full tw-mb-2" : ""}>Mixtape</NavigationButton>
      <NavigationButton href="/matching" className={isDrawer ? "tw-w-full tw-mb-2" : ""}>Matching</NavigationButton>
      <li className={isDrawer ? "tw-w-full tw-mb-2" : ""}>
        <Button
          variant="destructive"
          size={"sm"}
          onClick={handleLogout}
          className="tw-opacity-100 hover:tw-opacity-70 tw-bg-red-500 hover:tw-bg-red-600 tw-text-white tw-w-full tw-mb-2"
        >
          Logout
        </Button>
      </li>
    </>
  );

  return (
    <nav className="tw-w-full tw-bg-white tw-shadow-md tw-py-2 tw-fixed tw-top-0 tw-left-0 tw-z-10">
      <div className="tw-container tw-mx-auto tw-flex tw-justify-between tw-items-center">
        <Image
          src="/diskogs-logo.gif"
          alt="Diskogs plus"
          className="tw-w-24"
          width={200}
          height={60}
        />
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
        <ul className="tw-space-y-4 tw-py-4 tw-px-8">
          <NavigationItems isDrawer={true} />
        </ul>
      </Drawer>
    </nav>
  );
}
