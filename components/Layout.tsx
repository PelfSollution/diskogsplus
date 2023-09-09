import { useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import TopNavBar from "@/components/TopNavBar";
import CustomHead from "./CustomHead";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  centeredContent?: boolean;
  centeredTopContent?: boolean;
  allowPublicAccess?: boolean;
  initialLoggedInState?: boolean; // Prop para inicializar isLoggedIn
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  description,
  centeredContent = true,
  centeredTopContent = false,
  allowPublicAccess = false,
  initialLoggedInState = false, // Inicializado a false por defecto
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(
    initialLoggedInState || null
  );
  const router = useRouter();

  const handleLogout = useCallback(() => {
    // Usa useCallback aquí
    setIsLoggedIn(false);
    router.push("/"); // Si solo estás redirigiendo al inicio, este push está bien. Si no, considera usar "replace"
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return; // Evitamos que se ejecute en SSR

    const isUserLoggedIn = !!getCookie("username");
    if (!isUserLoggedIn && !allowPublicAccess) {
      router.replace("/"); // Usa "replace" aquí para no agregar al historial
      return;
    }
    setIsLoggedIn(isUserLoggedIn);
  }, [allowPublicAccess, router]);

  if (isLoggedIn === null) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-min-h-screen">
        <CustomCircularProgress />
      </div>
    );
  }

  let containerClass = "";
  if (centeredTopContent) {
    containerClass = "tw-flex tw-items-center tw-justify-start";
  } else if (centeredContent) {
    containerClass = "tw-flex tw-items-center tw-justify-center";
  } else {
    containerClass = "tw-flex tw-justify-start";
  }

  return (
    <>
      <CustomHead title={title} description={description} />
      <div
        className={`tw-min-h-screen tw-flex tw-flex-col ${containerClass} tw-bg-gray-100`}
      >
        <TopNavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-mt-10 tw-w-full">
          <div className="tw-max-w-screen-xl tw-w-full">{children}</div>
        </div>
      </div>
    </>
  );
};

export default Layout;
