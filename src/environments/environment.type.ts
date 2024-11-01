export type Environment = {
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