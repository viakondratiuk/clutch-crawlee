import { createCheerioRouter, Dataset } from 'crawlee';
import {
    getName,
    getWebsiteUrl,
    getFounded,
    getEmployees,
    getRating,
    getTotalReviews,
    getChart,
    getLocations,
    getProjectSize,
} from './profile.js';
import { getPortfolio } from './portfolio.js';
import { labels } from './consts.js';

export const router = createCheerioRouter();

const timestamp = Date.now();
const profileDS = `profile-${timestamp}`;
const portfolioDS = `portfolio-${timestamp}`;

router.addHandler(labels.PAGING, async ({ $, enqueueLinks, request, log }) => {
    const profileUrls: string[] = $('ul.directory-list h3.company_info > a').map((_, element) => {
        return $(element).attr('href');
    }).get();
    await enqueueLinks({
        urls: profileUrls,
        label: labels.PROFILE,
    });

    const portfolioUrls = profileUrls.map((url) => `${url}/portfolio`);
    await enqueueLinks({
        urls: portfolioUrls,
        label: labels.PORTFOLIO,
    });

    // Find the "Next" button and enqueue the next page of results (if it exists)
    const nextButton = $('li.page-item.next a.page-link');
    if (nextButton) {
        log.debug(`Enqueueing pagination for: ${request.url}`);
        await enqueueLinks({
            selector: 'li.page-item.next a.page-link',
            label: labels.PAGING,
        });
    }
});

router.addHandler(labels.PROFILE, async ({ $, request, log }) => {
    log.debug(`Extracting profile: ${request.url}`);

    const chart = getChart($);
    const results = {
        clutch_url: request.loadedUrl,
        name: getName($),
        website_url: getWebsiteUrl($),
        locations: getLocations($),
        founded: getFounded($),
        employees: getEmployees($),
        rating: getRating($),
        total_reviews: getTotalReviews($),
        project_size: getProjectSize($),
        service_lines: chart['Service Lines'],
        industries: chart.Industries,
        clients: chart.Clients,
        focus: chart.Focus,
    };

    const profileCon = await Dataset.open(profileDS);
    log.debug(`Saving profile: ${request.url}`);
    await profileCon.pushData(results);
});

router.addHandler(labels.PORTFOLIO, async ({ $, request, log }) => {
    log.debug(`Extracting portfolio: ${request.url}`);

    const results = {
        clutch_url: request.url.replace('/portfolio', ''),
        portfolio: getPortfolio($),
    };

    const portfolioCon = await Dataset.open(portfolioDS);
    log.debug(`Saving portfolio: ${request.url}`);
    await portfolioCon.pushData(results);
});
