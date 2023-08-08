# %% [markdown]
# ## Process
# We count the number of reports in each death category, ignoring reports that
# don't match any known category. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import re
import toml
import pandas as pd

TOP_N = 30

PATH = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(f"{PATH}/data")
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")
CORRECT_PATH = os.path.abspath(f"{PATH}/../../correct")

# %% [markdown]
# ### Reading the reports

reports = pd.read_csv(f"{REPORTS_PATH}/reports.csv")

# %% [markdown]
# ### Calculating the occurrences of each destination

vbar = re.compile(r'\s*\|\s*')
reports['sent_to'] = reports['this_report_is_being_sent_to'].str.split(vbar)
reports = reports.dropna(subset=['sent_to'])
exploded_reports = reports.explode('sent_to', ignore_index=True)
sent_counts = exploded_reports['sent_to'].value_counts()

# %% [markdown]
# ### Statistics

# %% [markdown]
# ### Various statistics about the counts

statistics = {
  "no. reports parsed": len(reports),
  "no. recipients with report(s)": len(sent_counts),
  "mean per recipient": int(sent_counts.mean()),
  "median per recipient": int(sent_counts.median()),
  "IQR of recipients": list(sent_counts.quantile([0.25, 0.75])),
}

print(f"Name count statistics: {statistics}")
print(f"Sorted counts: {sent_counts}")

# %% [markdown]
# ### Saving the statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'r', encoding="utf8") as rf:
  stats = toml.load(rf)
  stats['report recipient'] = statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'w', encoding="utf8") as wf:
  toml.dump(stats, wf)

# %% [markdown]
# ### Calculating the top coroners

top_counts = sent_counts.head(TOP_N)

# %% [markdown]
# ### Saving the results

sent_counts.to_csv(f"{DATA_PATH}/sent-counts.csv")
top_counts.to_csv(f"{DATA_PATH}/top-sent-counts.csv")
