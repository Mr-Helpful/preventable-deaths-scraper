# %% [markdown]
# ## Process
# We count the number of reports in each coroner area, ignoring reports that
# don't match any known area. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import json
import pandas as pd

from helpers import toml_stats, percent

PATH = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(f"{PATH}/data")
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")
CORRECTION_PATH = os.path.abspath(f"{PATH}/../../correct/data")

# %% [markdown]
# ### Regexes for coroner titles

MALE_NAME = r"\b(?:mr|sir)\b"
FEMALE_NAME = r"\b(?:mrs|miss|ms|lady|dame)\b"
UNKNOWN_NAME = rf"^(?:(?!{MALE_NAME}|{FEMALE_NAME}).)*$"

MALE_NAME = rf"^.*{MALE_NAME}.*$"
FEMALE_NAME = rf"^.*{FEMALE_NAME}.*$"
REPLACEMENTS = {MALE_NAME: 'male', FEMALE_NAME: 'female', UNKNOWN_NAME: 'unknown'}
print(REPLACEMENTS)

# %% [markdown]
# ### Reading the reports

reports = pd.read_csv(f"{REPORTS_PATH}/reports-analysed.csv")

# %% [markdown]
# ### Reading coroner names

with open(f"{CORRECTION_PATH}/fetched_names.json", 'r', encoding="utf8") as rf:
  coroner_names = json.load(rf)

website_genders = pd.Series(coroner_names).str.lower().replace(regex=REPLACEMENTS)
website_counts = website_genders.value_counts()

# %% [markdown]
# ### Calculating the year of each report

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')

# %% [markdown]
# ### Counting the number of reports in each coroner area

# count the number of reports in each year
reports['gender'] = reports['coroner_name'].str.lower().replace(regex=REPLACEMENTS)
gender_counts = reports.value_counts(['year', 'gender']).unstack(fill_value=0)
sum_counts = reports.value_counts('gender')

# %% [markdown]
# ### Various statistics about the counts

toml_stats['coroners in reports'] = statistics = dict(
  toml_stats['coroners in reports'], **{
  "reports from male coroners": [float(sum_counts['male']), percent(sum_counts['male'], sum_counts.sum())],
  "reports from female coroners": [float(sum_counts['female']), percent(sum_counts['female'], sum_counts.sum())],
  "reports from unknown coroners": [float(sum_counts['unknown']), percent(sum_counts['unknown'], sum_counts.sum())],
})

toml_stats["coroners' society"] = dict(
  toml_stats["coroners' society"], **{
  "coroners in society male": [float(website_counts['male']), percent(website_counts['male'], website_counts.sum())],
  "coroners in society female": [float(website_counts['female']), percent(website_counts['female'], website_counts.sum())],
  "coroners in society unknown": [float(website_counts['unknown']), percent(website_counts['unknown'], website_counts.sum())],
})

print(f"Gender count statistics: {statistics}")
print(f"Sorted counts: {sum_counts}")

# %% [markdown]
# ### Saving the results

gender_counts.to_csv(f"{DATA_PATH}/gender/gender-years.csv")
