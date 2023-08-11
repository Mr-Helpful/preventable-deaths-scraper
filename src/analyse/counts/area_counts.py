# %% [markdown]
# ## Process
# We count the number of reports in each coroner area, ignoring reports that
# don't match any known area. We then save the results to a .csv file.

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
# ### Calculating the year of each report

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')

# %% [markdown]
# ### Counting the number of reports in each coroner area

# count the number of reports in each year
value_counts = reports.value_counts(['year', 'coroner_area'])
area_counts = value_counts.unstack(fill_value=0)
sum_counts = reports.value_counts(['coroner_area'])

# %% [markdown]
# ### Various statistics about the counts

statistics = {
  "no. parsed reports": reports.count()['coroner_area'],
  "no. areas": len(sum_counts),
  "mean per area": round(sum_counts.mean(), 1),
  "median per area": sum_counts.median(),
  "IQR of areas": list(sum_counts.quantile([0.25, 0.75])),
}

print(f"Area count statistics: {statistics}")
print(f"Sorted counts: {sum_counts}")

# %% [markdown]
# ### Saving the statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'r', encoding="utf8") as rf:
  stats = toml.load(rf)
  stats['coroner areas'] = statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'w', encoding="utf8") as wf:
  toml.dump(stats, wf, encoder=toml.TomlNumpyEncoder())

# %% [markdown]
# ### Saving the results

area_counts.to_csv(f"{DATA_PATH}/area-years.csv")
sum_counts.to_csv(f"{DATA_PATH}/area-counts.csv")
