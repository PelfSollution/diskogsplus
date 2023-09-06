import Document, { Html, Head, Main, NextScript } from 'next/document'


class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="shortcut icon" href="/favicon.png" />
          {/* fuentes o estilos globales, aquí es el lugar */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument;

