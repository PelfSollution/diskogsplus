import ErrorScreen from "@/components/ErrorScreen";

const Custom404 = () => (
  <ErrorScreen
    code={404}
    title="Este surco no existe"
    message="La página que buscas no está en la colección. Puede que el enlace esté mal o que se haya movido."
  />
);

export default Custom404;
