# Preventable Deaths Scraper and Analysis

[![CodeQL](https://github.com/Mr-Helpful/preventable-deaths-scraper/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/Mr-Helpful/preventable-deaths-scraper/actions/workflows/github-code-scanning/codeql)
[![Fetch Reports](https://github.com/Mr-Helpful/preventable-deaths-scraper/actions/workflows/fetch.yml/badge.svg)](https://github.com/Mr-Helpful/preventable-deaths-scraper/actions/workflows/fetch.yml)

## Introduction

This repository represents a rewrite of the [Preventable Deaths Scraper](https://github.com/georgiarichards/georgiarichards.github.io) in javascript. This rewrite focuses on the explainability of the scraper (all code is documented), the speed of the scraper (we use async code to scrape whilst fetching) and the ability to run the scraper on a server (using node.js).

We also provide a custom [wordpress gutenberg plugin](https://developer.wordpress.org/block-editor/how-to-guides/platform/) to be used alongside the scraped data. This takes the form of a custom block that renders a Heatmap over coroner areas, as defined on the [coroner’s society](https://www.coronersociety.org.uk/coroners//?search_keyword=&search_area=&send=1&admin=search).

## Installation and Usage

### Scraper

To install the scraper, you will need to have [node.js](https://nodejs.org/en/) installed. Once you have node.js installed, you can install the scraper by running the following command in the root directory of this repository:

```bash
npm install
```

The scraper can then be run by running the following command in the root directory of this repository:

```bash
npm run fetch
```

This will then save the scraped data to [`src/data/reports.csv`](./src/data/reports.csv).

### Corrections

We've attempted to fully automate the scraping process, but there are some things that we can't automate. These include:

- Severe typos in some fields (i.e. `/0206/2023` is given as a date)
- Transpositions of fields (i.e. a `name` being replaced with a `ref` number)
- Ambiguity in destinations (i.e. is `University Hospitals of Derby and Burton NHS FT` one destination or two?)

In these cases, we keep `json` files recording manual corrections for these in the [`src/correct/manual_replace`](./src/correct/manual_replace) directory. These need to be updated every now and then to ensure that the scraper maintains its accuracy.

In order to update these corrections, you'll first need to install [node.js](https://nodejs.org/en/) and run the following command in the root directory of this repository:

```bash
npm install
```

Then manual corrections for all fields can be added by running the following command in the root directory of this repository:

```bash
npm run correct:update all
```

This will open up an interactive prompt for each failed parse, allowing you to correct, skip or mark the field entry as uncorrectable. Other options for updating individual columns' corrections are available by running `npm run correct:update -- --help`.

### Analyses

All analyses are written in python and require [python 3.8](https://www.python.org/downloads/) or above. You'll also need to have [pip](https://pip.pypa.io/en/stable/installation/) installed.

#### Year Count Analysis

To install the dependencies for the year count analysis, you can run the following command in the root directory of this repository:

```bash
pip install -r src/analyse/aggregation/requirements.txt
```

The year count analysis can then be run by running the following command in the root directory of this repository:

```bash
python src/analyse/aggregation/year-counts.py
```

This will save the number of reports per year to [`src/data/year-counts.csv`](./src/data/year-counts.csv), in the following format:

| year | count |
| :--- | :---- |
| 2013 | 173   |
| 2014 | 559   |
| 2015 | 490   |
| ...  | ...   |

A shortcut to run the analysis is defined in the [`package.json`](./package.json) file and can be run as so:

```bash
npm run analyse:year-counts
```

#### Medical Cause Analysis

To install the dependencies for the medical cause analysis, you can run the following command in the root directory of this repository:

```bash
pip install -r src/analyse/natural-language/requirements.txt
```

The cause analysis can then be run by running the following command in the root directory of this repository:

```bash
python src/analyse/natural-language/cause-tags.py
```

This will save the analysis to [`src/data/medical-cause-reports.csv`](./src/data/medical-cause-reports.csv) with an additional column `tags` which contains the predicted causes of death for each report (this column may be blank when prediction fails).

The annotated reports look like this:

| ref       | date       | area         | ... | tags                                                         |
| :-------- | :--------- | :----------- | :-- | :----------------------------------------------------------- |
| 2023-0168 | 22/05/2023 | Avon         | ... | [('cerebrovascular accident/event/haemorrhage', 0.434), ...] |
| 2023-0166 | 19/05/2023 | Warwickshire | ... | nan                                                          |
| 2023-0074 | 27/02/2023 | Essex        | ... | [('spontaneous subarachnoid haemorrhage', 0.513), ...]       |
| 2023-0073 | 28/02/2023 | Somerset     | ... | nan                                                          |
| 2023-0071 | 23/02/2023 | Suffolk      | ... | [('biventricular failure', 0.380), ...]                      |

A shortcut to run the analysis is defined in the [`package.json`](./package.json) file and can be run as so:

```bash
npm run analyse:label-medical
```

### Wordpress Plugins

The wordpress plugins are written using the Project Gutenberg [block editor](https://developer.wordpress.org/block-editor/getting-started/devenv/). To install the plugins, you'll need to have [node.js](https://nodejs.org/en/) installed. Once you have node.js installed, you can install the plugins by running the following command in either of the plugins' project directories:

```bash
npm install -g @wordpress/env
npm install
```

You can then run the development server and build the plugin as so:

```bash
wp-env start
npm run start
```

## Layout

There are 6 main directories in the [`src`](./src) directory:

- [`analyse`](./src/analyse): Analysis of the scraped data (mostly in python).
- [`correct`](./src/correct): Correcting/cleaning the scraped data.
- [`data`](./src/data): The raw report data.
- [`fetch`](./src/fetch): Fetching/scraping the report data.
- [`parse`](./src/parse): Parsing the scraped data (i.e. html -> csv).
- [`write`](./src/write): Writing to both the `reports.csv` file and the log file.

The [`plugins`](./plugins) directory contains wordpress plugins to be used with the report CSVs produced by the scraper (these are probably only interesting if you're interested in data vis/wordpress plugins).

All javascript code for is documented with JSDoc and all python code is written in an interactive python file (you should hopefully be able to run this like a jupyter notebook).
