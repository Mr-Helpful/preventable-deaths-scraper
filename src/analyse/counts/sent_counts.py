# %% [markdown]
# ## Process
# We count the number of reports in each death category, ignoring reports that
# don't match any known category. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import re
import pandas as pd

from helpers import toml_stats

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
report_date = pd.to_datetime(reports['date_of_report'], dayfirst=True)
report_due = (today - report_date).dt.days > 56

# %% [markdown]
# ### Splitting the sent to and reply urls

vbar = re.compile(r'\s*\|\s*')
non_na = reports.assign(year=report_date.dt.year).dropna(subset=['this_report_is_being_sent_to']).copy()
non_na['status'] = 'overdue'
non_na['sent_to'] =  non_na['this_report_is_being_sent_to'].str.split(vbar)
non_na['no. recipients'] = non_na['sent_to'].str.len()

non_na['replies'] = non_na['reply_urls'].fillna('').str.split(vbar).apply(lambda replies: [reply for reply in replies if "Response" in reply])
non_na['no. replies'] = non_na['replies'].str.len()

non_na['escaped_urls'] = non_na['reply_urls'].str.replace(r'[-_]|%20', ' ', regex=True).fillna('')

# %% [markdown]
# ### Status based on no. recipients vs replies

equal_replies = non_na.apply(lambda x: len(x['sent_to']) == len(x['replies']) and len(x['sent_to']) > 0, axis=1)
non_na.loc[equal_replies, 'status'] = 'received'
non_na.loc[~report_due, 'status'] = 'pending'

# %% [markdown]
# ### Status based on recipients in replies

exploded = non_na.explode('sent_to', ignore_index=True)
responded = exploded.apply(lambda x: str(x['sent_to']) in str(x['escaped_urls']), axis=1)
exploded['status'] = exploded['status'].mask(responded, 'received')

# %% [markdown]
# ### Calculating the counts for each recipient

sent_types = exploded.value_counts(['sent_to', 'status']).unstack(fill_value=0)
sent_counts = exploded.value_counts('sent_to')
sent_years = exploded.value_counts(['year', 'status']).unstack(fill_value=0)
type_counts = exploded.value_counts('status')

# %% [markdown]
# ### Calculating the status of each report

non_na.loc[:, 'report status'] = 'partial'

responses_from = lambda row: [sent for sent in row['sent_to'] if sent in row['escaped_urls']]
with_responses = non_na.apply(responses_from, axis=1)

no_responses = with_responses.str.len() == 0
non_na.loc[no_responses, 'report status'] = 'overdue'

equal_len = (
  non_na['sent_to'].str.len() == non_na['replies'].str.len()) & (
  non_na['sent_to'].str.len() > 0
)
non_na.loc[equal_len, 'report status'] = 'completed'

all_responses = with_responses.str.len() == non_na['sent_to'].str.len()
non_na.loc[all_responses, 'report status'] = 'completed'

# %% [markdown]
# ### Adding the non_na rows back to the reports

reports.loc[:, 'report status'] = 'unknown'
reports.loc[non_na.index, 'report status'] = non_na['report status']

reports.loc[:, 'no. recipients'] = 0
reports.loc[non_na.index, 'no. recipients'] = non_na['no. recipients']

reports.loc[:, 'no. replies'] = 0
reports.loc[non_na.index, 'no. replies'] = non_na['no. replies']

print(reports[['ref', 'report status']].head(10))
print(reports['report status'].value_counts())

# %% [markdown]
# ### Writing back the reports with the status

# Add our new columns to the reports
report_columns = reports.columns.tolist()
report_columns.insert(0, 'report status')
count_idx = report_columns.index('circumstances')
report_columns.insert(count_idx, 'no. replies')
report_columns.insert(count_idx, 'no. recipients')
report_columns = list(dict.fromkeys(report_columns))

reports = reports[report_columns]
reports.to_csv(f"{REPORTS_PATH}/report-statuses.csv", index=False)

# %% [markdown]
# ### Various statistics about the counts

toml_stats['sent to'] = statistics = {
  "no. reports parsed": len(non_na),
  "no. requests for response": len(exploded),
  "no. requests received": type_counts['received'],
  "no. requests overdue": type_counts['overdue'],
  "no. requests pending": type_counts['pending'],
  "no. recipients with report(s)": len(sent_counts),
  "mean per recipient": round(sent_counts.mean(), 1),
  "median per recipient": sent_counts.median(),
  "IQR of recipients": list(sent_counts.quantile([0.25, 0.75])),
}

print(f"Name count statistics: {statistics}")
print(f"Sorted counts: {sent_counts}")

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
exploded.to_csv(f"{DATA_PATH}/statuses.csv", index=False)
