from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv


_loaded: Optional[bool] = None


def load() -> None:
    global _loaded
    if _loaded:
        return
    load_dotenv(override=False)
    _loaded = True


# Load immediately on import so env vars are available
load()


