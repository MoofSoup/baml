# This file is generated by the BAML compiler.
# Do not edit this file directly.
# Instead, edit the BAML files and recompile.
#
# BAML version: 0.0.1
# Generated Date: __DATE__
# Generated by: aaronvillalpando

# ruff: noqa: E501,F401
# flake8: noqa: E501,F401
# pylint: disable=unused-import,line-too-long

from baml_core._impl.deserializer import register_deserializer
from pydantic import BaseModel
from typing import Optional


@register_deserializer({  })
class ImprovedResponse(BaseModel):
    should_improve: bool
    improved_response: Optional[str] = None
