export type Environment = {
    name: string;
    microfrontends: {
        [key: string]: Microfrontend
    }
}

export type Microfrontend = {
    name: string;
    origin: string;
    manifestPath: string;
    buildType: 'vite' | 'angular'
}