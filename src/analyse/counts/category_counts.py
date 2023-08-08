# %% [markdown]
# ## Process
# We count the number of reports in each death category, ignoring reports that
# don't match any known category. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import json
import toml
import pandas as pd

PATH = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(f"{PATH}/data")
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")
CORRECT_PATH = os.path.abspath(f"{PATH}/../../correct")

# %% [markdown]
# ### Reading the reports

reports = pd.read_csv(f"{REPORTS_PATH}/reports.csv")

# %% [markdown]
# ### Calculating the year of each report

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')

# %% [markdown]
# ### Fetching the categories

with open(f"{CORRECT_PATH}/manual_replace/categories.json", 'r', encoding='utf8') as f:
  categories = []
  for category in json.load(f):
    categories.extend(category.values())

  categories = list(set(categories))

# %% [markdown]
# ### Creating columns for each entry

exploded = reports.copy()
exploded['category'] = reports['category'].str.split(r'\s*\|\s*')
exploded = exploded.explode('category', ignore_index=True)
exploded = exploded[exploded['category'].isin(categories)]

category_counts = exploded.value_counts(['year', 'category']).unstack(fill_value=0)

sum_counts = exploded.value_counts(['category'])

# %% [markdown]
# ### Various statistics about the counts

statistics = {
  "no. reports parsed": int(reports.count()['category']),
  "no. categories in reports": int(sum_counts.sum()),
  "no. categories": len(sum_counts),
  "mean per category": float(round(sum_counts.mean(), 1)),
  "median per category": int(sum_counts.median()),
  "IQR of categories": list(sum_counts.quantile([0.25, 0.75])),
}

print(f"Category count statistics: {statistics}")
print(f"Sorted counts: {sum_counts}")

# %% [markdown]
# ### Saving the statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'r', encoding="utf8") as rf:
  stats = toml.load(rf)
  stats['death categories'] = statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'w', encoding="utf8") as wf:
  toml.dump(stats, wf)

# %% [markdown]
# ### Saving the results

category_counts.to_csv(f"{DATA_PATH}/category-years.csv")
sum_counts.to_csv(f"{DATA_PATH}/category-counts.csv")
