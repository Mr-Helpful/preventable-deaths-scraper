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
grouped_counts = reports.groupby(['year', 'coroner_area']).size().reset_index(name='count')
area_counts = grouped_counts.pivot(index='year', columns='coroner_area', values='count').fillna(0).astype(int)
area_counts


# %% [markdown]
# ### Saving the results

area_counts.to_csv(f"{DATA_PATH}/area-years.csv")
sum_counts = pd.DataFrame(area_counts.sum()).transpose()
sum_counts.to_csv(f"{DATA_PATH}/area-counts.csv", index=False)
