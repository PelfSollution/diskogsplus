import { NextPageContext } from 'next';
import Layout from "@/components/Layout";

interface ErrorProps {
  statusCode: number;
}

const ErrorPage = ({ statusCode }: ErrorProps) => (
  <Layout title={`Error ${statusCode}`} centeredContent={true}>
    <h1>{statusCode ? `Error ${statusCode}` : "Ha ocurrido un error"}</h1>
  </Layout>
);

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
