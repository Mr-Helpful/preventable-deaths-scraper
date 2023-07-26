# %% [markdown]
# ## Process
# We count the number of reports in each coroner area, ignoring reports that
# don't match any known area. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
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
# ### Counting the number of reports in each coroner area

# count the number of reports in each year
grouped_counts = reports.groupby(['year', 'coroner_name']).size().reset_index(name='count')
name_counts = grouped_counts.pivot(index='year', columns='coroner_name', values='count').fillna(0).astype(int)

# %% [markdown]
# ### Various statistics about the counts

sum_counts = pd.DataFrame(name_counts.sum()).rename(columns={0: 'count'})
sum_counts = sum_counts.sort_values(by='count', ascending=False)

print(f"Total number of reports: {sum_counts.sum().sum()}")
print(f"Number of coroner names: {len(sum_counts.columns)}")
print(f"Mean number of reports: {sum_counts.mean().mean()}")
print(f"Median number of reports: {sum_counts.median().median()}")
print(f"IQR of number of reports: {sum_counts.mean().quantile([0.25, 0.75])}")

print(f"Sorted counts: {sum_counts}")

# %% [markdown]
# ### Saving the results

name_counts.to_csv(f"{DATA_PATH}/name-years.csv")
sum_counts.to_csv(f"{DATA_PATH}/name-counts.csv")
