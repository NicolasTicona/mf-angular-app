import { Environment } from './environment.type';

export const environment: Environment = {
    name: 'development',
    microfrontends: {
        'react-app': {
            name: 'react-app',
            origin: 'https://mf-react-app-dev.vercel.app/',
            manifestPath: 'https://mf-react-app-dev.vercel.app/.vite/manifest.json',
            buildType: 'vite'
        }
    }
};