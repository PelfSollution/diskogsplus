import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import { Menu, X } from "lucide-react";
import AppSidebar, { AppLogo } from "@/components/AppSidebar";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();


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

  // centeredTopContent: contenido arriba · centeredContent: centrado en la pantalla (cargas, errores)
  const centered = centeredContent && !centeredTopContent;

  return (
    <>
      <CustomHead title={title} description={description} />
      <div className="tw-min-h-screen tw-bg-white tw-text-gray-900">
        {isLoggedIn && (
          <>
            {/* Escritorio: barra lateral fija */}
            <div className="tw-hidden lg:tw-block tw-fixed tw-inset-y-0 tw-left-0 tw-w-64 tw-z-30">
              <AppSidebar />
            </div>

            {/* Móvil: barra superior y panel lateral */}
            <header className="lg:tw-hidden tw-sticky tw-top-0 tw-z-30 tw-flex tw-items-center tw-justify-between tw-h-14 tw-px-3 tw-bg-white/95 tw-backdrop-blur tw-border-b tw-border-gray-200">
              <AppLogo />
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Abrir menú"
                className="tw-w-11 tw-h-11 tw-rounded-xl tw-text-gray-700 hover:tw-bg-gray-100 tw-flex tw-items-center tw-justify-center"
              >
                <Menu className="tw-w-5 tw-h-5" />
              </button>
            </header>
            {isMenuOpen && (
              <div className="lg:tw-hidden tw-fixed tw-inset-0 tw-z-50" role="dialog" aria-modal="true" aria-label="Menú">
                <button
                  type="button"
                  aria-label="Cerrar menú"
                  onClick={() => setIsMenuOpen(false)}
                  className="tw-absolute tw-inset-0 tw-bg-gray-900/30"
                />
                <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-72 tw-max-w-[85vw] tw-shadow-xl">
                  <AppSidebar onNavigate={() => setIsMenuOpen(false)} />
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Cerrar menú"
                    className="tw-absolute tw-top-4 tw-right-3 tw-w-9 tw-h-9 tw-rounded-lg tw-text-gray-600 hover:tw-bg-gray-100 tw-flex tw-items-center tw-justify-center"
                  >
                    <X className="tw-w-5 tw-h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <main
          className={`${isLoggedIn ? "lg:tw-pl-64" : ""} ${
            centered ? "tw-flex tw-items-center tw-justify-center tw-min-h-[80vh]" : ""
          }`}
        >
          <div className="tw-w-full">{children}</div>
        </main>
      </div>
    </>
  );
};

export default Layout;
