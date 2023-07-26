# %% [markdown]
# ## Process
# We count the number of reports in each death category, ignoring reports that
# don't match any known category. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import toml
import pandas as pd

PATH = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(f"{PATH}/data")
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")

# %% [markdown]
# ### Reading the reports

reports = pd.read_csv(f"{REPORTS_PATH}/reports.csv")
len(reports)

# %% [markdown]

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')

# %% [markdown]
# ### Calculate number of categorised reports

(reports['category'].str.len() > 0).sum()

# %% [markdown]
# ### Calculate number of categories we expect

reports['category'].str.split('|').str.len().sum()

# %% [markdown]
# ### Calculate number of categories in uncorrected data

# %%

categories = pd.DataFrame({0: reports['category'].str.cat(sep="|").split('|')})
categories.sort_values(by=0).drop_duplicates()

# %% [markdown]
# ### Fetching the categories
import json

CORRECT_PATH = os.path.abspath(f"{PATH}/../../correct")

with open(f"{CORRECT_PATH}/category_corrections.json", 'r', encoding='utf8') as f:
  categories = []
  for category in json.load(f):
    categories.extend(category.values())

  categories = list(set(categories))

# %% [markdown]
# ### Creating columns for each category

# Create a column for each category with a 1 if the report is in that category
for category in categories:
  reports[category] = reports['category'].str.contains(category, regex=False)

category_counts = reports[categories].groupby(reports['year']).sum()

# %% [markdown]
# ### Various statistics about the counts

sum_counts = pd.DataFrame(category_counts.sum()).rename(columns={0: 'count'})
sum_counts = sum_counts.sort_values(by='count', ascending=False)
sum_counts.index.name = 'category'

statistics = {
  "total": int(sum_counts.sum()[0]),
  "number of categories": len(sum_counts),
  "mean": int(sum_counts.mean()[0]),
  "median": int(sum_counts.median()[0]),
  "IQR": list(sum_counts.quantile([0.25, 0.75])["count"]),
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
