# Web Scraping

## Method

In order to parse HTML pages, we:

1. Fetch raw HTML pages from the [coroner’s website](https://www.judiciary.uk/prevention-of-future-death-reports/) using the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
2. Parse these HTML pages using the [`cheerio` library](https://www.npmjs.com/package/cheerio)
3. Select the fields from their position in the HTML

## Specifics

We first parse the [search page](https://www.judiciary.uk/prevention-of-future-death-reports/) and fetch the number of pages from the page selector at the bottom using the `a.page-numbers` selector. We then asynchronously load all the pages from the URL template `judiciary.uk/prevention-of-future-death-reports/page/${page_num}/` and parse all the report urls from them.

Then, for each report, we:

1. Fetch the urls to all related content, using `li.related-content__item > a.related-content__link`
2. Put the first link as the PDF link  **Assumption! PDF link is first**
3. Put other links as response links  **Assumption! Other links are responses**
4. Fetch the tags from the page, using `.single__title + p.pill--single > a`
5. Put the tags down as the death categories  **Assumption! Tags are categories**
6. Fetch the summary table from the page, using `div.flow > p`
7. Parse the available columns from the summary  **Assumption! Columns are correctly parsed (See** **[Summary Parser](../parse/parse_summary.js))**
8. Fetch the full HTML table, if possible, using `tbody.govuk-table__body > tr.govuk-table__row`
9. Parse the available columns from the table **Assumption! Columns are correctly parsed (See [Table Parser](../parse/parse_report.js))**

## TODO

- [ ] Parse PDFs
  Reasonable assumptions about PDF parsing listed in the current [javascript progress](../parse/examples/read_table.js) and the [overview README](../parse/examples/README.md)
