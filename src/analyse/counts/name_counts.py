# %% [markdown]
# ## Process
# We count the number of reports in each coroner area, ignoring reports that
# don't match any known area. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import json
import pandas as pd

from helpers import toml_stats

TOP_N = 30

PATH = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(f"{PATH}/data")
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")
CORRECTION_PATH = os.path.abspath(f"{PATH}/../../correct/data")

# %% [markdown]
# ### Reading the reports

reports = pd.read_csv(f"{REPORTS_PATH}/reports-analysed.csv")

# %% [markdown]
# ### Reading coroner names

with open(f"{CORRECTION_PATH}/fetched_names.json", 'r', encoding="utf8") as rf:
  coroner_names = json.load(rf).keys()

# %% [markdown]
# ### Reading the coroner data

coroner_data = pd.read_csv(f"{REPORTS_PATH}/coroners-society.csv")
coroner_titles = {row['name']: row['title'] for _, row in coroner_data.iterrows()}

# %% [markdown]
# ### Calculating the titles of coroner in each area

with open(f"{CORRECTION_PATH}/areas.json", encoding="utf8") as rf:
  correct_areas = json.load(rf)

coroner_area = coroner_data[['title', 'role']]
is_area = coroner_area['role'].isin(correct_areas)
area_counts = coroner_area[is_area]\
  .value_counts(['role', 'title'])\
  .unstack(fill_value=0)\
  .rename_axis('area')


# %% [markdown]
# ### Adding coroner titles to the reports

report_columns = list(reports.columns)
reports['coroner_title'] = reports['coroner_name'].map(coroner_titles)

title_idx = report_columns.index('coroner_name')  + 1
report_columns.insert(title_idx, 'coroner_title')
report_columns = list(dict.fromkeys(report_columns))

reports[report_columns].to_csv(f"{REPORTS_PATH}/reports-analysed.csv", index=False)

# %% [markdown]
# ### Calculating the year of each report

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')

# %% [markdown]
# ### Counting the number of reports in each coroner area

# count the number of reports in each year

name_counts = reports.value_counts(['year', 'coroner_name']).unstack(fill_value=0)
sum_counts = reports.value_counts('coroner_name')

# %% [markdown]
# ### Calculating the top coroners

top_counts = sum_counts.head(TOP_N)
top_names = list(top_counts.index)
top_years = name_counts[top_names]

# %% [markdown]
# ### Calculating counts for titles

sum_titles = reports.value_counts('coroner_title')
top_titles = top_counts.copy()
top_titles.index = top_titles.index.map(coroner_titles).rename('coroner_title')
top_titles = top_titles.groupby(level=0).sum()

# %% [markdown]
# ### Various statistics about the counts

toml_stats["coroners in reports"] = statistics = dict(
  toml_stats["coroners in reports"], **{
  "no. reports parsed": reports.count()['coroner_name'],
  "no. coroner names in reports": len(sum_counts),
  f"no. reports from top {TOP_N} names": top_counts.sum(),
  f"% reports from top {TOP_N} names": round(100 * top_counts.sum() / sum_counts.sum(), 1),
  "mean per name": round(sum_counts.mean(), 1),
  "median per name": sum_counts.median(),
  "IQR of names": list(sum_counts.quantile([0.25, 0.75])),
})

toml_stats["coroners' society"] = dict(
  toml_stats["coroners' society"], **{
  "no. names in society": len(coroner_names),
  "no. names in society with reports": len([name for name in coroner_names if name in sum_counts.index]),
  "no. names in society without reports": len([name for name in coroner_names if name not in sum_counts.index]),
})

print(f"Name count statistics: {statistics}")
print(f"Sorted counts: {sum_counts}")

# %% [markdown]
# ### Saving the results

top_counts.to_csv(f"{DATA_PATH}/name/top-name-counts.csv")
top_titles.to_csv(f"{DATA_PATH}/name/top-titles.csv")
name_counts.to_csv(f"{DATA_PATH}/name/name-years.csv")
top_years.to_csv(f"{DATA_PATH}/name/top-name-years.csv")
sum_counts.to_csv(f"{DATA_PATH}/name/name-counts.csv")
sum_titles.to_csv(f"{DATA_PATH}/name/title-counts.csv")
area_counts.to_csv(f"{DATA_PATH}/name/area-counts.csv")
