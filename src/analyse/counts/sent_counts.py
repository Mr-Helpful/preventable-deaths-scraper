# %% [markdown]
# ## Process
# We count the number of reports in each death category, ignoring reports that
# don't match any known category. We then save the results to a .csv file.

# %% [markdown]
# ### Importing libraries

import os
import re
import json
import toml
import pandas as pd

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
reports = reports.dropna(subset=['sent_to']).explode('sent_to', ignore_index=True)
recipient_counts = reports['sent_to'].value_counts()
print(recipient_counts)
