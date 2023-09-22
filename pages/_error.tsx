import { NextPageContext } from 'next';
import Layout from "@/components/Layout";
import Image from 'next/image';

interface ErrorProps {
  statusCode: number;
}

const ErrorPage = ({ statusCode }: ErrorProps) => (
  <Layout
    centeredContent={true}
    title={`Error ${statusCode} - Diskogs +`}
    description={`Error ${statusCode}: Página no encontrada`}
  >
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
      <header className="tw-text-center tw-max-w-xl mx-auto">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
          <h1 className="tw-text-4xl tw-text-red-400">
            {statusCode ? `Error ${statusCode} - Page Not Found` : "An error has occurred"}
          </h1>
          
          <Image 
            src="/img-404.png" 
            alt="Error"
            className="tw-w-auto tw-max-w-md mx-auto block"
            width={300}
            height={300}
          />
          <p className="tw-text-xl tw-mt-2">
          Oops! Looks like this vinyl is broken. We couldn&apos;t find what you were looking for or an unexpected error occurred.
          </p>
        </div>
      </header>      
    </div>
  </Layout>
);

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;

