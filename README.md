# Preventable Deaths Scraper and Analysis

___

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

### Analysis

The analysis is written in python, and requires [python 3.8](https://www.python.org/downloads/) or above. To install the analysis, you will need to have [pip](https://pip.pypa.io/en/stable/installation/) installed. Once you have pip installed, you can install the analysis by running the following command in the root directory of this repository:

```bash
pip install -r requirements.txt
```

The cause analysis can then be run by running the following command in the root directory of this repository:

```bash
python src/analyses/cause-tags.py
```

This will save the analysis to [`src/data/tagger-reports.csv`](./src/data/tagger-reports.csv) with an additional column `tags` which contains the predicted causes of death for each report (this column may be blank when prediction fails).

The annotated reports look like this:
| ref       | date       | area         | ... | tags                                                         |
|:----------|:-----------|:-------------|:----|:-------------------------------------------------------------|
| 2023-0168 | 22/05/2023 | Avon         | ... | [('cerebrovascular accident/event/haemorrhage', 0.434), ...] |
| 2023-0166 | 19/05/2023 | Warwickshire | ... | nan                                                          |
| 2023-0074 | 27/02/2023 | Essex        | ... | [('spontaneous subarachnoid haemorrhage', 0.513), ...]       |
| 2023-0073 | 28/02/2023 | Somerset     | ... | nan                                                          |
| 2023-0071 | 23/02/2023 | Suffolk      | ... | [('biventricular failure', 0.380), ...]                      |
