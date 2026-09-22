"""Medi-AI: modular medical decision-support subsystem for Helora.

Modules:
    provider/       LLM provider abstraction (Gemini implemented; replaceable)
    safety/         deterministic medical safety engine + response guards
    knowledge/      replaceable knowledge retrieval (local curated docs)
    conversations/  persistent, ownership-enforced chat history
    tools/          backend-controlled tools (model never executes them)
    schemas/        structured response models
    services/       orchestration pipeline

Nothing in this package can access Appwrite directly except the controlled
backend tools, which always validate the authenticated session first.
"""