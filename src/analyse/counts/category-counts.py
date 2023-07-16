# %% [markdown]
# ## Process
# We count the number of reports in each death category, ignoring reports that
# don't match any known category. We then save the results to a .csv file.

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
# ### Fetching the categories
import json

CORRECT_PATH = os.path.abspath(f"{PATH}/../../correct")

with open(f"{CORRECT_PATH}/category_corrections.json", 'r', encoding='utf8') as f:
  categories = list(set(json.load(f).values()))

# %% [markdown]
# ### Creating columns for each category

# Create a column for each category with a 1 if the report is in that category
for category in categories:
  reports[category] = (reports['category'].str.contains(category) == True).astype(int)

category_counts = reports[categories].groupby(reports['year']).sum()
category_counts

# %% [markdown]
# ### Saving the results

category_counts.to_csv(f"{DATA_PATH}/category-years.csv")
sum_counts = pd.DataFrame(category_counts.sum()).transpose()
sum_counts.to_csv(f"{DATA_PATH}/category-counts.csv", index=False)
