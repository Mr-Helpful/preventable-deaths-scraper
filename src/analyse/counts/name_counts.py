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
  coroner_names = json.load(rf)

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
# ### Various statistics about the counts

toml_stats['coroner name'] = statistics = {
  "no. reports parsed": reports.count()['coroner_name'],
  "no. coroner names in reports": len(sum_counts),
  "no. names in society with reports": len([name for name in coroner_names if name in sum_counts.index]),
  "no. names in society without reports": len([name for name in coroner_names if name not in sum_counts.index]),
  "mean per name": round(sum_counts.mean(), 1),
  "median per name": sum_counts.median(),
  "IQR of names": list(sum_counts.quantile([0.25, 0.75])),
}

print(f"Name count statistics: {statistics}")
print(f"Sorted counts: {sum_counts}")

# %% [markdown]
# ### Calculating the top coroners

top_counts = sum_counts.head(TOP_N)
top_names = list(top_counts.index)
top_years = name_counts[top_names]

# %% [markdown]
# ### Saving the results

top_counts.to_csv(f"{DATA_PATH}/name/top-name-counts.csv")
name_counts.to_csv(f"{DATA_PATH}/name/name-years.csv")
top_years.to_csv(f"{DATA_PATH}/name/top-name-years.csv")
sum_counts.to_csv(f"{DATA_PATH}/name/name-counts.csv")
