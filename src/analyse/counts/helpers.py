import os
import toml

def percent(n, total):
  return round(n / total * 100, 1)

class TOMLCache:
  """A TOML cache that keeps a toml file up to date with its contents."""
  def __init__(self, path, encoder = toml.TomlEncoder):
    self.path = path
    self.encoder = encoder
    self.cache = None
    self._touch()
    self._read()

  def _read(self):
    with open(self.path, 'r', encoding='utf8') as rf:
      self.cache = toml.load(rf)

  def _write(self):
    with open(self.path, 'w', encoding='utf8') as wf:
      toml.dump(self.cache, wf, encoder=self.encoder)

  def _touch(self):
    with open(self.path, 'a', encoding='utf8') as _:
      pass

  def __getitem__(self, key):
    return self.cache.get(key, {})

  def __setitem__(self, key, value):
    self.cache[key] = value
    self._write()

  def __call__(self, data):
    self.cache = data
    self._write()

PATH = os.path.dirname(__file__)
REPORTS_PATH = os.path.abspath(f"{PATH}/../../data")
toml_stats = TOMLCache(f"{REPORTS_PATH}/statistics.toml", encoder = toml.TomlNumpyEncoder())