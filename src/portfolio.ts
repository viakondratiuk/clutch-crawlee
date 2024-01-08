import * as cheerio from 'cheerio';

type CheerioAPI = cheerio.Root;

export function getPortfolio($: CheerioAPI): string {
    const portfolioItems: string[] = [];

    $('.profile-portfolio-section__key-clients-list-item').each((_index, element) => {
        portfolioItems.push($(element).text().trim());
    });

    return portfolioItems.join(', ');
}
