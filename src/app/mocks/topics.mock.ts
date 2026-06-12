import { Topic } from '../interfaces/topic.interface';

export const TOPICS: Readonly<Topic[]> = [
    {
        id: 1,
        title: 'MFE Basics',
        description: 'Microfrontends split a monolithic UI into independently deployable pieces owned by separate teams.',
    },
    {
        id: 2,
        title: 'Custom Events',
        description: 'Native DOM custom events let MFEs communicate without shared state or framework dependencies.',
    },
    {
        id: 3,
        title: 'Vite Manifest',
        description: 'The .vite/manifest.json maps source files to hashed build outputs, enabling runtime script injection.',
    },
    {
        id: 4,
        title: 'Shell & Remote',
        description: 'The shell (host) owns the page frame. Remotes are self-contained apps loaded on demand.',
    },
    {
        id: 5,
        title: 'No Module Fed.',
        description: 'Manifest-based loading skips Webpack Module Federation — lighter, framework-agnostic, and explicit.',
    },
    {
        id: 6,
        title: 'Indep. Deploy',
        description: 'Each MFE ships its own CI pipeline. A React team can release without touching the Angular shell.',
    },
    {
        id: 7,
        title: 'Runtime Load',
        description: 'Scripts are injected at runtime from a live URL — no build-time coupling between host and remote.',
    },
    {
        id: 8,
        title: 'Shared State',
        description: 'Cross-MFE state flows through custom events or a shared event bus, never through framework APIs.',
    },
    {
        id: 9,
        title: 'Build vs Runtime',
        description: 'Build-time MFE compositing is fast but couples releases. Runtime is slower to load but fully decoupled.',
    },
    {
        id: 10,
        title: 'Team Autonomy',
        description: 'Each team picks its own framework, version, and toolchain — the contract is only the event protocol.',
    },
];
