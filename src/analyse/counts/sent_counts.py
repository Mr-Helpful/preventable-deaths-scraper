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
# ### Calculating the due status for each report

today = pd.to_datetime('today')
reports['date'] = pd.to_datetime(reports['date_of_report'], dayfirst=True)
report_due = (today - reports['date']).dt.days > 56
reports['year'] = reports['date'].dt.year

# %% [markdown]
# ### Splitting the sent to and reply urls

vbar = re.compile(r'\s*\|\s*')
reports['status'] = 'overdue'
reports = reports.dropna(subset=['this_report_is_being_sent_to', 'reply_urls'])
reports['sent_to'] = reports['this_report_is_being_sent_to'].str.split(vbar)
reports['replies'] = reports['reply_urls'].str.split(vbar).apply(lambda xs: [x for x in xs if "Response" in x])

# %% [markdown]
# ### Status based on no. recipients vs replies

equal_replies = reports.apply(lambda x: len(x['sent_to']) == len(x['replies']) and len(x['sent_to']) > 0, axis=1)
reports['status'] = reports['status'].mask(equal_replies, 'received').mask(~report_due, 'pending')

# %% [markdown]
# ### Status based on recipients in replies

exploded = reports.explode('sent_to', ignore_index=True)
exploded['escaped_urls'] = exploded['reply_urls'].str.replace(r'[-_]|%20', ' ', regex=True)
responded = exploded.apply(lambda x: str(x['sent_to']) in str(x['escaped_urls']), axis=1)
exploded['status'] = exploded['status'].mask(responded, 'received')

# %% [markdown]
# ### Calculating the counts for each recipient

sent_types = exploded.value_counts(['sent_to', 'status']).unstack(fill_value=0)
sent_counts = exploded.value_counts('sent_to')
sent_years = exploded.value_counts(['year', 'status']).unstack(fill_value=0)
type_counts = exploded.value_counts('status')

# %% [markdown]
# ### Various statistics about the counts

statistics = {
  "no. reports parsed": len(reports),
  "no. requests for response": len(exploded),
  "no. requests overdue": type_counts['overdue'],
  "no. requests received": type_counts['received'],
  "no. requests pending": type_counts['pending'],
  "no. recipients with report(s)": len(sent_counts),
  "mean per recipient": round(sent_counts.mean(), 1),
  "median per recipient": sent_counts.median(),
  "IQR of recipients": list(sent_counts.quantile([0.25, 0.75])),
}

print(f"Name count statistics: {statistics}")
print(f"Sorted counts: {sent_counts}")

# %% [markdown]
# ### Saving the statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'r', encoding="utf8") as rf:
  stats = toml.load(rf)
  stats['sent to'] = statistics

with open(f"{REPORTS_PATH}/statistics.toml", 'w', encoding="utf8") as wf:
  toml.dump(stats, wf, encoder=toml.TomlNumpyEncoder())

# %% [markdown]
# ### Calculating the top coroners

top_counts = sent_counts.head(TOP_N)
top_types = sent_types.loc[top_counts.index]

# %% [markdown]
# ### Saving the results

sent_counts.to_csv(f"{DATA_PATH}/sent-counts.csv")
top_counts.to_csv(f"{DATA_PATH}/top-sent-counts.csv")
sent_types.to_csv(f"{DATA_PATH}/sent-types.csv")
top_types.to_csv(f"{DATA_PATH}/top-sent-types.csv")
sent_years.to_csv(f"{DATA_PATH}/sent-types-years.csv")
exploded.to_csv(f"{DATA_PATH}/statuses.csv")
