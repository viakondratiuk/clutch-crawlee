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

router.addDefaultHandler(async ({ $, crawler, request }) => {
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

    await crawler.addRequests([{
        url: `${request.loadedUrl}/portfolio`,
        label: labels.PORTFOLIO,
        userData: { data: profile },
    }]);
});

router.addHandler(labels.PORTFOLIO, async ({ $, request }) => {
    const profile = request.userData.data;
    const portfolio = getPortfolio($);

    const combinedData = {
        ...profile,
        portfolio,
    };

    await Dataset.pushData(combinedData);
});
