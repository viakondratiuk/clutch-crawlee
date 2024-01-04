import { createCheerioRouter, Dataset } from 'crawlee';
import {
    getName,
    getWebsiteUrl,
    getFounded,
    getEmployees,
    getRating,
    getTotalReviews,
    getChart, getLocation,
} from './profile.js';

export const router = createCheerioRouter();

router.addHandler('PROFILE', async ({ $, request, log }) => {
    log.debug(`Extracting data: ${request.url}`);

    const chart = getChart($);
    const results = {
        clutch_url: request.loadedUrl,
        name: getName($),
        website_url: getWebsiteUrl($),
        location: getLocation($),
        founded: getFounded($),
        employees: getEmployees($),
        rating: getRating($),
        total_reviews: getTotalReviews($),
        service_lines: chart['Service Lines'],
        industries: chart.Industries,
        clients: chart.Clients,
        focus: chart.Focus,
    };

    log.debug(`Saving data: ${request.url}`);
    await Dataset.pushData(results);
});

router.addHandler('CATEGORY', async ({ $, enqueueLinks, request, log }) => {
    log.debug(`Enqueueing pagination for: ${request.url}`);

    await enqueueLinks({
        selector: 'ul.directory-list h3.company_info > a',
        label: 'PROFILE',
    });

    // Find the "Next" button and enqueue the next page of results (if it exists)
    const nextButton = $('li.page-item.next a.page-link');
    if (nextButton) {
        await enqueueLinks({
            selector: 'li.page-item.next a.page-link',
            label: 'CATEGORY',
        });
    }
});

// This is a fallback route which will handle the start URL
// as well as the LIST labeled URLs.
router.addDefaultHandler(async ({ $, enqueueLinks, request, log }) => {
    log.debug(`Enqueueing START page categories: ${request.url}`);

    // Find the "Next" button and enqueue the next page of results (if it exists)
    const nextButton = $('li.page-item.next a.page-link');
    if (nextButton) {
        await enqueueLinks({
            selector: 'li.page-item.next a.page-link',
            label: 'CATEGORY',
        });
    }
});
