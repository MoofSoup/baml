# This file is generated by the BAML compiler.
# Do not edit this file directly.
# Instead, edit the BAML files and recompile.

# ruff: noqa: E501,F401
# flake8: noqa: E501,F401
# pylint: disable=unused-import,line-too-long
# fmt: off

from baml_core.provider_manager import LLMManager
from os import environ


AZURE_GPT4 = LLMManager.add_llm(
    name="AZURE_GPT4",
    provider="baml-openai-chat",
    retry_policy=None,
    options=dict(
        model="gpt-3.5-turbo",
        api_key=environ['OPENAI_API_KEY'],
        request_timeout=45,
        max_tokens=400,
    ),
)
