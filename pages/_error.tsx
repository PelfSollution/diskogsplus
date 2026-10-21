import { NextPageContext } from "next";
import ErrorScreen from "@/components/ErrorScreen";

interface ErrorProps {
  statusCode: number;
}

const ErrorPage = ({ statusCode }: ErrorProps) => (
  <ErrorScreen
    code={statusCode || "Error"}
    title={statusCode === 404 ? "Este surco no existe" : "El disco ha saltado"}
    message={
      statusCode === 404
        ? "La página que buscas no está en la colección."
        : "Ha ocurrido un error inesperado. Prueba a recargar la página dentro de un momento."
    }
  />
);

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
