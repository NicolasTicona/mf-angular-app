import { Environment } from './environment.type';

export const environment: Environment = {
    name: 'production',
    microfrontends: {
        'react-app': {
            name: 'react-app',
            origin: 'https://mf-react-app-prod.vercel.app/',
            manifestPath: 'https://mf-react-app-prod.vercel.app/.vite/manifest.json',
            buildType: 'vite'
        }
    }
};