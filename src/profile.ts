import * as cheerio from 'cheerio';

type CheerioAPI = cheerio.Root;

export function getName($: CheerioAPI): string {
    const h1 = $('h1.profile-header__title a.website-link__item');
    return h1.text().trim();
}

export function getWebsiteUrl($: CheerioAPI): string {
    const websiteUrlAttr = $('h1.profile-header__title a.website-link__item').attr('href');
    return websiteUrlAttr ? websiteUrlAttr.split('?')[0] : '';
}

export function getFounded($: CheerioAPI): string {
    const foundedText = $("li.profile-summary__detail[data-tooltip-content*='Founded'] .sg-text__title").text();
    const foundedArray = foundedText.split(' ');
    return foundedArray.length > 1 ? foundedArray[1] : '';
}

export function getEmployees($: CheerioAPI): string {
    return $("li.profile-summary__detail[data-tooltip-content*='Employees'] .sg-text__title").text();
}

export function getRating($: CheerioAPI): string {
    return $("div[name*='metrics-average-review-rating'] .sg-rating__number").text();
}

export function getTotalReviews($: CheerioAPI): string {
    return $("div[name*='metrics-total-reviews'] .sg-colored-card--accent").text();
}

export function getProjectSize($: CheerioAPI): string {
    return $('dt.sg-colored-card--title').filter((_: number, element: cheerio.Element) => {
        return $(element).text().trim() === 'Most Common Project Size';
    }).next('dd')
        .find('span.sg-colored-card--accent')
        .text()
        .trim();
}

export function getChart($: CheerioAPI): any {
    interface Chart {
        [key: string]: any;
    }

    let scriptContent = '';
    $('script').each((_index: number, element: cheerio.Element) => {
        const content = $(element).html();
        if (content && content.includes('window.chartPie')) {
            scriptContent = content;
            return false;
        }
        return true;
    });

    let transformedChart: Chart = {};
    const jsonMatch = scriptContent.match(/window\.chartPie\s*=\s*({[\s\S]*?});/);
    if (jsonMatch && jsonMatch[1]) {
        const Chart: Chart = JSON.parse(jsonMatch[1]);

        ['service_provided', 'industries', 'clients'].forEach((category) => {
            if (Chart[category] && Array.isArray(Chart[category].slices)) {
                transformedChart[Chart[category].legend_title] = Chart[category].slices
                    .reduce((acc: any, slice: any) => {
                        acc[slice.name] = slice.percent;
                        return acc;
                    }, {});
            }
        });

        if (Chart.focus && Chart.focus.charts) {
            transformedChart[Chart.focus.legend_title] = {};
            for (const key in Chart.focus.charts) {
                const item = Chart.focus.charts[key];
                if (Array.isArray(item.slices)) {
                    transformedChart[Chart.focus.legend_title][item.legend_title] = item.slices
                        .reduce((acc: any, slice: any) => {
                            acc[slice.name] = slice.percent;
                            return acc;
                        }, {});
                }
            }
        }
    }

    return transformedChart;
}

export function getLocations($: CheerioAPI): Record<string, string> {
    let locations: Record<string, string> = {};
    $('div.profile-locations--item').each((index, element) => {
        const addressCountry = $(element).find('span[itemprop="addressCountry"]').text().trim();
        const addressLocality = $(element).find('span[itemprop="addressLocality"]').text().trim();
        const addressRegion = $(element).find('span[itemprop="addressRegion"]').text().trim();
        const postalCode = $(element).find('span[itemprop="postalCode"]').text().trim();
        const streetAddress = $(element).find('span[itemprop="streetAddress"]').text().trim();
        const telephone = $(element).find('meta[itemprop="telephone"]').attr('content')?.trim() || '';

        locations[`address${index + 1}`] = `${addressCountry}, ${addressLocality}, ${addressRegion}, ${postalCode}, ${streetAddress}, ${telephone}`;
    });

    return locations;
}
