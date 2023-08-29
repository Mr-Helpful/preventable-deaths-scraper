# %% [markdown]
# ### Importing libraries

import sys
sys.path.append(".")

import shutil
shutil.copyfile(
  "src/data/reports-corrected.csv",
  "src/data/reports-analysed.csv"
)

# %% [markdown]
# ### Running the counts

import area_counts as _
import category_counts as _
import gender_counts as _
import name_counts as _
import sent_counts as _
import year_counts as _
