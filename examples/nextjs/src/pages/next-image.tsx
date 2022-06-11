import type { NextPage } from 'next';
import Head from 'next/head';
import { Image } from '../components/Image';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>sidepix drop-in next/image example</title>
        <meta name="description" content="<picture>" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>sidepix drop-in next/image example</h1>

        <Image
          src="pexels-carlos-spitzer-17811.jpg"
          width="3456"
          height="5184"
          layout="responsive"
          alt="Black and Green Toucan on Tree Branch"
        />

        <p>
          Credits:{' '}
          <a href="https://www.pexels.com/@lestrade84">Carlos Spitzer</a>
        </p>

        <Image
          src="pexels-magda-ehlers-1427457.jpg"
          width="5472"
          height="3648"
          layout="responsive"
          alt="Selective Focus Photography Of Scarlet Macaw"
        />

        <p>
          Credits:{' '}
          <a href="https://www.pexels.com/@magda-ehlers-pexels">Magda Ehlers</a>
        </p>
      </main>
    </div>
  );
};

export default Home;
