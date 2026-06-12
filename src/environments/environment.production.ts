import { Environment } from './environment.type';

export const environment: Environment = {
    name: 'production',
    microfrontends: {
        'react-app': {
            name: 'react-app',
            origin: 'https://nicolasticona.github.io/mf-react-app',
            manifestPath: 'https://nicolasticona.github.io/mf-react-app/.vite/manifest.json',
            buildType: 'vite',
            cacheStrategy: 'no-cache',
        }
    }
};