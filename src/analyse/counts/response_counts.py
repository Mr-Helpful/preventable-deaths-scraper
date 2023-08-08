# %% [markdown]
# ## Process
# We count the number of responses received for each report, whether they are 
# overdue and whether responses are expected for this report.

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

# %% [markdown]
# ### Calculating the year of each report

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')
today = pd.to_datetime('today')
reports['date'] = pd.to_datetime(reports['date_of_report'], dayfirst=True)
reports['days due'] = (today - reports['date']).dt.days - 56

# Title: Data visualisation for ‘this-report-is-sent-to’
# Notes: Bar graph for the frequency of recipients

# %% [markdown]
# ### Various statistics about the counts

statistics = {
  "no. parsed reports": int(reports.count()['coroner_area']),
  "no. areas": len(sum_counts),
  "mean per area": float(round(sum_counts.mean(), 1)),
  "median per area": float(sum_counts.median()),
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
  toml.dump(stats, wf)

# %% [markdown]
# ### Saving the results

area_counts.to_csv(f"{DATA_PATH}/area-years.csv")
sum_counts.to_csv(f"{DATA_PATH}/area-counts.csv")
