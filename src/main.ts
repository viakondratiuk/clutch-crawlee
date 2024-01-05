import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';
// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
import { router } from './routes.js';

interface Input {
    startUrls: string[];
    maxRequestsPerCrawl: number;
}

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();

// Structure of input is defined in input_schema.json
const {
    startUrls = ['https://clutch.co/directory/mobile-application-developers'],
    maxRequestsPerCrawl = 10,
} = await Actor.getInput<Input>() ?? {} as Input;

// const proxyConfiguration = await Actor.createProxyConfiguration();

log.setLevel(log.LEVELS.DEBUG);
log.debug('Setting up crawler.');

const crawler = new CheerioCrawler({
    // proxyConfiguration,
    useSessionPool: true,
    sessionPoolOptions: {
        sessionOptions: {
            maxUsageCount: 5,
            maxErrorScore: 1,
        },
    },
    maxRequestsPerCrawl,
    maxRequestRetries: 5,
    requestHandler: router,
    failedRequestHandler: async ({ request }) => {
        log.debug(`!!! ${request.url} failed. Retry this url once more.`);
    },
});

await crawler.run(startUrls);

await Actor.exit();
