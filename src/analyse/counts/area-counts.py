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
# ### Counting the number of reports in each coroner area

# group by the coroner area and count the number of reports
area_counts = reports.groupby('coroner_area').size().reset_index(name='count')
area_counts['count'].sum()


# %% [markdown]
# ### Saving the results

area_counts.to_csv(f"{DATA_PATH}/area-counts.csv", index=False)
