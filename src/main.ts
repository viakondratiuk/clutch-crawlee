import { Actor } from 'apify';
import { CheerioCrawler, log, Dataset } from 'crawlee';
// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
import { router } from './routes.js';
import { labels } from './consts.js';

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

log.setLevel(log.LEVELS.DEBUG);
log.debug('Setting up crawler.');

const isLocalDevelopment = process.env.LOCAL_DEVELOPMENT === 'true';
const failDS = await Dataset.open('fail');

const crawler = new CheerioCrawler({
    proxyConfiguration: isLocalDevelopment ? undefined : await Actor.createProxyConfiguration(),
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

        await failDS.pushData({ failed_url: request.url, retries: request.retryCount });
    },
});

await crawler.addRequests([
    {
        url: 'https://clutch.co/directory/mobile-application-developers',
        label: labels.PAGING,
    },
]);

await crawler.run();

await Actor.exit();
