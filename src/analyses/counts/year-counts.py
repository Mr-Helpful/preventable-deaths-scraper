# %% [markdown]
# ## Process
# We count the number of reports in each year, ignoring reports that don't 
# parse properly. We then save the results to a .csv file.

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
# ### Counting the number of reports in each year

# use a regex to extract the year from the date of report
reports['year'] = reports['date_of_report'].str.extract(r'\d{2}\/\d{2}\/(\d{4})')
# group by the year and count the number of reports
year_counts = reports.groupby('year').size().reset_index(name='count')
year_counts['count'].sum()

# %% [markdown]
# ### Debug: find rows that don't match regex
reports[~(reports['date_of_report'].str.contains(r'\d{2}\/\d{2}\/\d{4}') == True)]

# %% [markdown]
# ### Saving the results

year_counts.to_csv(f"{DATA_PATH}/year-counts.csv", index=False)
