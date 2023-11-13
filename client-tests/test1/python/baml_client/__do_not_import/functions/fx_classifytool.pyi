# This file is generated by the BAML compiler.
# Do not edit this file directly.
# Instead, edit the BAML files and recompile.

# ruff: noqa: E501,F401
# flake8: noqa: E501,F401
# pylint: disable=unused-import,line-too-long
# fmt: off

from ..types.classes.cls_classifyresponse import ClassifyResponse
from ..types.enums.enm_tool import Tool
from typing import Protocol, runtime_checkable


import typing

import pytest

ImplName = typing.Literal["v1"]

T = typing.TypeVar("T", bound=typing.Callable[..., typing.Any])
CLS = typing.TypeVar("CLS", bound=type)


IClassifyToolOutput = ClassifyResponse

@runtime_checkable
class IClassifyTool(Protocol):
    """
    This is the interface for a function.

    Args:
        query: str
        context: str

    Returns:
        ClassifyResponse
    """

    async def __call__(self, *, query: str, context: str) -> ClassifyResponse:
        ...


class BAMLClassifyToolImpl:
    async def run(self, *, query: str, context: str) -> ClassifyResponse:
        ...

class IBAMLClassifyTool:
    def register_impl(
        self, name: ImplName
    ) -> typing.Callable[[IClassifyTool], IClassifyTool]:
        ...

    def get_impl(self, name: ImplName) -> BAMLClassifyToolImpl:
        ...

    @typing.overload
    def test(self, test_function: T) -> T:
        """
        Provides a pytest.mark.parametrize decorator to facilitate testing different implementations of
        the ClassifyToolInterface.

        Args:
            test_function : T
                The test function to be decorated.

        Usage:
            ```python
            # All implementations will be tested.

            @baml.ClassifyTool.test
            def test_logic(ClassifyToolImpl: IClassifyTool) -> None:
                result = await ClassifyToolImpl(...)
            ```
        """
        ...

    @typing.overload
    def test(self, *, exclude_impl: typing.Iterable[ImplName]) -> pytest.MarkDecorator:
        """
        Provides a pytest.mark.parametrize decorator to facilitate testing different implementations of
        the ClassifyToolInterface.

        Args:
            exclude_impl : Iterable[ImplName]
                The names of the implementations to exclude from testing.

        Usage:
            ```python
            # All implementations except "v1" will be tested.

            @baml.ClassifyTool.test(exclude_impl=["v1"])
            def test_logic(ClassifyToolImpl: IClassifyTool) -> None:
                result = await ClassifyToolImpl(...)
            ```
        """
        ...

    @typing.overload
    def test(self, test_class: typing.Type[CLS]) -> typing.Type[CLS]:
        """
        Provides a pytest.mark.parametrize decorator to facilitate testing different implementations of
        the ClassifyToolInterface.

        Args:
            test_class : Type[CLS]
                The test class to be decorated.

        Usage:
        ```python
        # All implementations will be tested in every test method.

        @baml.ClassifyTool.test
        class TestClass:
            def test_a(self, ClassifyToolImpl: IClassifyTool) -> None:
                ...
            def test_b(self, ClassifyToolImpl: IClassifyTool) -> None:
                ...
        ```
        """
        ...

BAMLClassifyTool: IBAMLClassifyTool
