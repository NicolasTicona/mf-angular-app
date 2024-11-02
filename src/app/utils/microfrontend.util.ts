import { environment } from 'src/environments/environment';
import { Microfrontend } from 'src/environments/environment.type';

export const allowedMicrofrontendNames = ['react-app'];
export const microfrontendLoadHandlers = {
    'vite': (microfronted: Microfrontend, nodeToLoadIn: HTMLElement) => loadViteMicrofrontend(microfronted, nodeToLoadIn),
    'angular': (microfronted: Microfrontend, nodeToLoadIn: HTMLElement) => loadAngularMicrofrontend(microfronted, nodeToLoadIn),
}

export function loadMicrofrontend(name: string, nodeToLoadIn: HTMLElement): void {
    if (!allowedMicrofrontendNames.includes(name)) {
        console.error(`Microfrontend ${name} is not allowed to be loaded`);
        return;
    }

    const microfrontendEnvironment = environment.microfrontends[name];
    microfrontendLoadHandlers[microfrontendEnvironment.buildType](microfrontendEnvironment, nodeToLoadIn);
}

async function loadViteMicrofrontend(microfrontend: Microfrontend, nodeToLoadIn: HTMLElement) {
    try {
        const response = await fetch(`${microfrontend.manifestPath}`);
        const manifest = await response.json();

        window.addEventListener('MICROFRONTEND_LOADED', (event: Event) => {
            const customEvent = event as CustomEvent;

            if (customEvent.detail.name === microfrontend.name) {
                const renderEvent = new CustomEvent('MICROFRONTEND_RENDER', {
                    detail: {
                        nodeToLoadIn,
                        name: microfrontend.name
                    }
                })

                window.dispatchEvent(renderEvent);
            }
        })

        const index = manifest['index.html'];

        const script = document.createElement('script');
        script.src = `${microfrontend.origin}/${index.file}`;
        script.type = 'module';

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = `${microfrontend.origin}/${index.css[0]}`;

        document.head.appendChild(script);
        document.head.appendChild(css);
    } catch {
        console.error(`Failed to load microfrontend ${microfrontend.name}`);
    }
}

function loadAngularMicrofrontend(microfronted: Microfrontend, nodeToLoadIn: HTMLElement) {
}