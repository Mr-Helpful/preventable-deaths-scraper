# %% [markdown]
# ## Process
# We count the number of reports in each coroner area, ignoring reports that
# don't match any known area. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import json
import toml
import pandas as pd

PATH = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(f"{PATH}/data")
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")
CORRECTION_PATH = os.path.abspath(f"{PATH}/../../correct/data")

# %% [markdown]
# ### Reading the reports

reports = pd.read_csv(f"{REPORTS_PATH}/reports.csv")

# %% [markdown]
# ### Reading coroner names

with open(f"{CORRECTION_PATH}/fetched_names.json", 'r', encoding="utf8") as rf:
  coroner_names = json.load(rf)

# %% [markdown]
# ### Calculating the year of each report

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')

# %% [markdown]
# ### Counting the number of reports in each coroner area

# count the number of reports in each year
grouped_counts = reports.groupby(['year', 'coroner_name']).size().reset_index(name='count')
name_counts = grouped_counts.pivot(index='year', columns='coroner_name', values='count').fillna(0).astype(int)

sum_counts = pd.DataFrame(name_counts.sum()).rename(columns={0: 'count'})
sum_counts = sum_counts.sort_values(by='count', ascending=False)

# %% [markdown]
# ### Various statistics about the counts

statistics = {
  "no. reports parsed": int(sum_counts.sum()[0]),
  "no. names with report(s)": len(sum_counts),
  "no. names without reports": len([name for name in coroner_names if name not in sum_counts.index]),
  "mean per name": int(sum_counts.mean()[0]),
  "median per name": int(sum_counts.median()[0]),
  "IQR of names": list(sum_counts.quantile([0.25, 0.75])["count"]),
}

print(f"Name count statistics: {statistics}")
print(f"Sorted counts: {sum_counts}")

# %% [markdown]
# ### Saving the statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'r', encoding="utf8") as rf:
  stats = toml.load(rf)
  stats['coroner name'] = statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'w', encoding="utf8") as wf:
  toml.dump(stats, wf)

# %% [markdown]
# ### Calculating the top 30 coroners

top_counts = sum_counts.head(30)
top_names = list(top_counts.index)
top_years = name_counts[top_names]

# %% [markdown]
# ### Saving the results

top_counts.to_csv(f"{DATA_PATH}/top-name-counts.csv")
name_counts.to_csv(f"{DATA_PATH}/name-years.csv")
top_years.to_csv(f"{DATA_PATH}/top-name-years.csv")
sum_counts.to_csv(f"{DATA_PATH}/name-counts.csv")