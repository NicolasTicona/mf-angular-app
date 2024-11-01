import { Environment } from './environment.type';

export const environment: Environment = {
    microfrontends: {
        'react-app': {
            name: 'react-app',
            origin: 'http://127.0.0.1:8080',
            manifestPath: 'http://127.0.0.1:8080/.vite/manifest.json',
            buildType: 'vite'
        }
    }
};