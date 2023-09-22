import Layout from "@/components/Layout";
import Image from 'next/image';

const Custom404 = () => (
  <Layout
    centeredContent={true}
    title="404 - Diskogs +"
    description="404 - Page Not Found"
  >
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
      <header className="tw-text-center tw-max-w-xl mx-auto">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
          <h1 className="tw-text-4xl tw-text-red-400">404 - Page Not Found</h1> {/* Aquí aumenté el tamaño del texto */}
          
          <Image 
            src="/img-404.png" 
            alt="404"
            className="tw-w-auto tw-max-w-md mx-auto block"
            width={300}
            height={300}
          />
          <p className="tw-text-xl tw-mt-2">Oops! Looks like this vinyl is broken. We couldn't find what you were looking for.
          </p>
        </div>
      </header>      
    </div>
  </Layout>
);

export default Custom404;

