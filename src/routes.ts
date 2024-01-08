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

router.addHandler(labels.PAGING, async ({ $, enqueueLinks, request, log }) => {
    await enqueueLinks({
        selector: 'ul.directory-list h3.company_info > a',
        label: labels.PROFILE,
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

router.addHandler(labels.PROFILE, async ({ $, crawler, request, log }) => {
    log.debug(`Extracting profile: ${request.url}`);

    const chart = getChart($);
    const profile = {
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

    const portfolioUrl = `${request.url}/portfolio`;
    await crawler.addRequests([
        {
            url: portfolioUrl,
            label: labels.PORTFOLIO,
        },
    ]);

    const profileDS = await Dataset.open('profile');
    log.debug(`Saving profile: ${request.url}`);
    await profileDS.pushData(profile);
});

router.addHandler(labels.PORTFOLIO, async ({ $, request, log }) => {
    log.debug(`Extracting portfolio: ${request.url}`);

    const results = {
        clutch_url: request.loadedUrl,
        portfolio: getPortfolio($),
    };

    const portfolioDS = await Dataset.open('portfolio');
    log.debug(`Saving portfolio: ${request.url}`);
    await portfolioDS.pushData(results);
});
