# Preventable Deaths Scraper and Analysis

[![Fetch Reports](https://github.com/Mr-Helpful/preventable-deaths-scraper/actions/workflows/node.js.yml/badge.svg)](https://github.com/Mr-Helpful/preventable-deaths-scraper/actions/workflows/node.js.yml)

## Introduction

This repository represents a rewrite of the [Preventable Deaths Scraper](https://github.com/georgiarichards/georgiarichards.github.io) in javascript. This rewrite focuses on the explainability of the scraper (all code is documented), the speed of the scraper (we use async code to scrape whilst fetching) and the ability to run the scraper on a server (using node.js).

We also include a natural language analysis of the scraped data, which uses a Large Language model approach (specifically a [form of BioBert](https://huggingface.co/pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb)) to automatically generate likely causes of death for the scraped data.

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

### Analyses

Both the analyses are written in python and require [python 3.8](https://www.python.org/downloads/) or above. You'll also need to have [pip](https://pip.pypa.io/en/stable/installation/) installed.

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
|:-----|:------|
| 2013 |   173 |
| 2014 |   559 |
| 2015 |   490 |
| 2016 |   477 |
| 2017 |   446 |
| 2018 |   418 |
| 2019 |   528 |
| 2020 |   314 |
| 2021 |   432 |
| 2022 |   416 |
| 2023 |   213 |

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
|:----------|:-----------|:-------------|:----|:-------------------------------------------------------------|
| 2023-0168 | 22/05/2023 | Avon         | ... | [('cerebrovascular accident/event/haemorrhage', 0.434), ...] |
| 2023-0166 | 19/05/2023 | Warwickshire | ... | nan                                                          |
| 2023-0074 | 27/02/2023 | Essex        | ... | [('spontaneous subarachnoid haemorrhage', 0.513), ...]       |
| 2023-0073 | 28/02/2023 | Somerset     | ... | nan                                                          |
| 2023-0071 | 23/02/2023 | Suffolk      | ... | [('biventricular failure', 0.380), ...]                      |

A shortcut to run the analysis is defined in the [`package.json`](./package.json) file and can be run as so:

```bash
npm run analyse:label-medical
```

## Layout

There are 6 main directories in the [`src`](./src) directory:

- [`analyse`](./src/analyse): Analysis of the scraped data (mostly in python).
- [`correct`](./src/correct): Correcting/cleaning the scraped data.
- [`data`](./src/data): The raw report data.
- [`fetch`](./src/fetch): Fetching/scraping the report data.
- [`parse`](./src/parse): Parsing the scraped data (i.e. html -> csv).
- [`write`](./src/write): Writing to both the `reports.csv` file and the log file.

The [`examples`](./examples) directory contains reference report PDFs (you probably won't need to look at this).

The [`plugins`](./plugins) directory contains wordpress plugins to be used with the report CSVs produced by the scraper (these are probably only interesting if you're interested in data vis/wordpress plugins).

All javascript code for is documented with JSDoc and all python code is written in an interactive python file (you should hopefully be able to run this like a jupyter notebook).
