# This file is generated by the BAML compiler.
# Do not edit this file directly.
# Instead, edit the BAML files and recompile.
#
# BAML version: 0.0.1
# Generated Date: __DATE__
# Generated by: aaronvillalpando

from .functions.fx_foob import BAMLFooB
from .functions.fx_foobar import BAMLFooBar
from .functions.fx_foobar2 import BAMLFooBar2
from .functions.fx_functionone import BAMLFunctionOne
from .functions.fx_functiontwo import BAMLFunctionTwo
from .functions.fx_prompttest import BAMLPromptTest


class BAMLClient:
    FooBar = BAMLFooBar
    PromptTest = BAMLPromptTest
    FooB = BAMLFooB
    FunctionOne = BAMLFunctionOne
    FunctionTwo = BAMLFunctionTwo
    FooBar2 = BAMLFooBar2

baml = BAMLClient()
