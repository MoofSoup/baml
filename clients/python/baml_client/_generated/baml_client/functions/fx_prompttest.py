# This file is generated by the BAML compiler.
# Do not edit this file directly.
# Instead, edit the BAML files and recompile.
#
# BAML version: 0.0.1
# Generated Date: __DATE__
# Generated by: aaronvillalpando

from ..._impl.functions import BaseBAMLFunction
from ..types.classes.cls_person import Person
from ..types.enums.enm_persontype import PersonType
from typing import List, Protocol, runtime_checkable


IPromptTestOutput = List[Person]

@runtime_checkable
class IPromptTest(Protocol):
    """
    This is the interface for a function.

    Args:
        arg: str

    Returns:
        List[Person]
    """

    async def __call__(self, arg: str, /) -> List[Person]:
        ...


class IBAMLPromptTest(BaseBAMLFunction[List[Person]]):
    def __init__(self) -> None:
        super().__init__(
            "PromptTest",
            IPromptTest,
            ["V1"],
        )

BAMLPromptTest = IBAMLPromptTest()

__all__ = [ "BAMLPromptTest" ]
