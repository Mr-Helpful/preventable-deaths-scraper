# %% [markdown]
# ## Process
# Here we try to establish the closest word to the coroner's description of
# cause of death using natural language processing, primarily the transformer
# network used in GPT2.
#
# In full the process is:
# 1. Precompute the sentence embedding for each death cause
# 2. For each report to analyse:
# 3.  For each sentence in the cause section:
# 4.   take the embedding of the sentence
# 5.   take the cosine similarity between the embedding and each cause embedding
# 6. take the cause that has a sentence with the maximum similarity
#
# you will need huggingface sentence transformers installed:
# `pip install sentence_transformers torch pandas tqdm`

# %% [markdown]
# ### Parsing arguments
# This will just use default arguments when run in jupyter notebook
# You may want to override these defaults for testing

import argparse

parser = argparse.ArgumentParser(
  description="Process the cause of death tags for the reports",
  formatter_class=argparse.ArgumentDefaultsHelpFormatter
)
parser.add_argument(
  "-r", "--reports", type=str,
  nargs="?", default="reports-corrected.csv",
  help="The .csv file containing the reports"
)
parser.add_argument(
  "-c", "--causes", type=str,
  nargs="?", default="medical-causes.txt",
  help="The .txt file containing the causes of death"
)
parser.add_argument(
  "-o", "--output", type=str,
  nargs="?", default="medical-cause-reports.csv",
  help="The .csv file to output the labelled reports to"
)
parser.add_argument(
  "-l", "--label", type=str,
  nargs="?", default="tags",
  help="The column to output the labels to"
)

args = parser.parse_args()

# %% [markdown]
# ### Importing libraries

import os
import torch
from tqdm import tqdm

PATH = os.path.dirname(__file__)
DATA_PATH = os.path.abspath(f"{PATH}/data")
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")

# %% [markdown]
# ### Import and load model

from sentence_transformers import SentenceTransformer, util

embed_model = SentenceTransformer(
  'pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb'
)

# %% [markdown]
# ### Precalculating the encodings of the death causes

with open(f'{DATA_PATH}/{args.causes}', 'r', encoding='utf8') as rf:
  causes = [line.strip().lower() for line in rf.readlines()]

with torch.no_grad():
  cause_embeds = torch.stack([
    embed_model.encode(cause, convert_to_tensor=True)
    for cause in tqdm(causes, "Calculating embeds")
  ])

# %% [markdown]
# ### Read in the csv and circumstances

from pandas import read_csv

reports = read_csv(f"{REPORTS_PATH}/{args.reports}")
cause_sections = [
  inquest + "\n\n" + circumstances
    if isinstance(inquest, str) and isinstance(circumstances, str)
    else inquest
  for inquest, circumstances in zip(reports.inquest, reports.circumstances)
]

# %% [markdown]
# ### Determine the top-k most likely causes

def get_most_likely(inquest, max_num=5, min_prob=0.3):
  '''
  Determines the most likely causes of death from the inquest text.
  Returns the `max_num` most likely causes with a similarity of at least `min_prob`.
  Similarity is determined by the cosine similarity between the sentence embeddings.
  '''
  if not isinstance(inquest, str):
    return inquest

  embed_list = [
    embed_model.encode(sentence.strip(), convert_to_tensor=True)
    for sentence in inquest.split(".") if len(sentence) > 0
  ]
  inquest_embeds = torch.stack(embed_list)
  similarity = util.cos_sim(cause_embeds, inquest_embeds)
  max_sim, _ = torch.max(similarity, dim=1)

  indices = torch.argsort(max_sim, descending=True)[:max_num]
  return [
    (causes[i], max_sim[i].item())
    for i in indices if max_sim[i] > min_prob
  ]

with torch.no_grad():
  likely_causes = [
    get_most_likely(section)
    for section in tqdm(cause_sections, desc="Calculating tags")
  ]

print(likely_causes)

# %% [markdown]
# ### Write the column to reports

reports.loc[:, args.label] = likely_causes
reports.to_csv(f"{DATA_PATH}/{args.output}", index=False)
