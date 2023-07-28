# %% [markdown]
# ## Process
# We count the number of reports in each coroner area, ignoring reports that
# don't match any known area. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import re
import json
import toml
import pandas as pd

PATH = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(f"{PATH}/data")
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")
CORRECTION_PATH = os.path.abspath(f"{PATH}/../../correct/data")

# %% [markdown]
# ### Regexes for coroner titles

MALE_NAME = r"\b(?:mr|sir)\b"
FEMALE_NAME = r"\b(?:mrs|miss|ms|lady|dame)\b"

# %% [markdown]
# ### Reading the reports

reports = pd.read_csv(f"{REPORTS_PATH}/reports.csv")
len(reports)

# %% [markdown]
# ### Reading coroner names

with open(f"{CORRECTION_PATH}/fetched_names.json", 'r', encoding="utf8") as rf:
  coroner_names = json.load(rf)

coroners_male = len([name for name in coroner_names if re.match(MALE_NAME, name, re.I) is not None])
coroners_female = len([name for name in coroner_names if re.match(FEMALE_NAME, name, re.I) is not None])
coroners_unknown = len(coroner_names) - coroners_male - coroners_female

# %% [markdown]

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')

# %% [markdown]
# ### Counting the number of reports in each coroner area

# count the number of reports in each year
reports['male'] = reports['coroner_name'].str.contains(MALE_NAME, na=False, case=False)
reports['female'] = reports['coroner_name'].str.contains(FEMALE_NAME, na=False, case=False)
reports['unknown'] = ~reports['male'] & ~reports['female']
reports = reports[['year', 'male', 'female', 'unknown']]
gender_counts = reports.groupby('year').sum()

# %% [markdown]
# ### Various statistics about the counts

sum_counts = gender_counts.sum()

statistics = {
  "no. coroners male": coroners_male,
  "no. coroners female": coroners_female,
  "no. coroners unknown": coroners_unknown,
  "no. reports male": int(sum_counts['male']),
  "no. reports female": int(sum_counts['female']),
  "no. reports unknown": int(sum_counts['unknown']),
}

print(f"Gender count statistics: {statistics}")
print(f"Sorted counts: {gender_counts}")

# %% [markdown]
# ### Saving the statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'r', encoding="utf8") as rf:
  stats = toml.load(rf)
  stats['coroner gender'] = statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'w', encoding="utf8") as wf:
  toml.dump(stats, wf)

# %% [markdown]
# ### Saving the results

gender_counts.to_csv(f"{DATA_PATH}/gender-years.csv")
