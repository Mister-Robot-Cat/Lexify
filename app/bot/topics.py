"""Themed word packs for Lexify bot.

Each topic maps to a list of common English words in that category.
These are used by the /topics command to bulk-add words to a user's library.
"""

TOPIC_PACKS: dict[str, list[str]] = {
    "🍕 Food & Cooking": [
        "appetizer", "ingredient", "recipe", "seasoning", "cuisine",
        "portion", "utensil", "marinate", "simmer", "garnish",
        "broth", "dough", "grill", "roast", "bland",
        "savory", "tender", "crispy", "stale", "nutritious",
    ],
    "✈️ Travel": [
        "itinerary", "destination", "departure", "luggage", "boarding",
        "accommodation", "reservation", "currency", "customs", "layover",
        "sightseeing", "souvenir", "excursion", "embassy", "passport",
        "terminal", "aisle", "delay", "jet lag", "hitchhike",
    ],
    "💼 Business": [
        "revenue", "deadline", "negotiate", "stakeholder", "proposal",
        "invoice", "merger", "benchmark", "turnover", "franchise",
        "outsource", "dividend", "liability", "audit", "entrepreneur",
        "equity", "quarterly", "scalable", "startup", "procurement",
    ],
    "🎓 IELTS / Academic": [
        "hypothesis", "methodology", "thesis", "abstract", "bibliography",
        "paradigm", "empirical", "qualitative", "quantitative", "phenomenon",
        "correlation", "inference", "discourse", "synthesis", "plagiarism",
        "scrutinize", "elaborate", "substantial", "ambiguous", "coherent",
    ],
    "💻 Technology": [
        "algorithm", "bandwidth", "cache", "database", "encryption",
        "firmware", "interface", "latency", "middleware", "protocol",
        "repository", "scalability", "throughput", "virtualization", "debug",
        "deploy", "iterate", "compile", "runtime", "vulnerability",
    ],
    "🏥 Health & Body": [
        "symptom", "diagnosis", "prescription", "therapy", "immune",
        "chronic", "acute", "contagious", "inflammation", "rehabilitation",
        "fatigue", "insomnia", "allergy", "antibiotics", "metabolism",
        "posture", "pulse", "strain", "supplement", "vaccine",
    ],
    "🎬 Entertainment": [
        "plot", "genre", "sequel", "premiere", "soundtrack",
        "audience", "rehearsal", "screenplay", "documentary", "animation",
        "blockbuster", "critic", "subtitle", "episode", "streaming",
        "binge-watch", "protagonist", "suspense", "comedy", "thriller",
    ],
    "🌿 Nature & Environment": [
        "ecosystem", "biodiversity", "habitat", "sustainability", "pollution",
        "conservation", "deforestation", "renewable", "erosion", "glacier",
        "drought", "wildlife", "climate", "carbon footprint", "recycle",
        "endangered", "vegetation", "precipitation", "ozone", "watershed",
    ],
}

# Short keys for callback data (max 64 bytes in Telegram)
TOPIC_KEYS: dict[str, str] = {
    f"tp_{i}": name for i, name in enumerate(TOPIC_PACKS)
}

# Reverse: full name -> short key
TOPIC_NAME_TO_KEY: dict[str, str] = {v: k for k, v in TOPIC_KEYS.items()}
