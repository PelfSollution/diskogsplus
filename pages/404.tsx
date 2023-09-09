import Layout from "@/components/Layout";

const Custom404 = () => (
  <Layout
    centeredContent={true}
    title="404 - Diskogs +"
    description="404: Página no encontrada"
  >
    <div className="tw-text-center"> {/* Añadido para centrar el texto horizontalmente */}
      <h1>404 - Página no encontrada</h1>
    </div>
  </Layout>
);

export default Custom404;

