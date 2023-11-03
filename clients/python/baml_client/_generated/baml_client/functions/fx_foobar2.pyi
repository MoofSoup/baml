# This file is generated by the BAML compiler.
# Do not edit this file directly.
# Instead, edit the BAML files and recompile.
#
# BAML version: 0.0.1
# Generated Date: __DATE__
# Generated by: aaronvillalpando

from typing import Protocol, runtime_checkable


import typing

import pytest

ImplName = typing.Literal["SomeName"]

T = typing.TypeVar("T", bound=typing.Callable[..., typing.Any])
CLS = typing.TypeVar("CLS", bound=type)


IFooBar2Output = str

@runtime_checkable
class IFooBar2(Protocol):
    """
    This is the interface for a function.

    Args:
        arg: str

    Returns:
        str
    """

    async def __call__(self, arg: str, /) -> str:
        ...


class BAMLFooBar2Impl:
    async def run(self, arg: str, /) -> str:
        ...

class IBAMLFooBar2:
    def register_impl(
        self, name: ImplName
    ) -> typing.Callable[[IFooBar2], IFooBar2]:
        ...

    def get_impl(self, name: ImplName) -> BAMLFooBar2Impl:
        ...

    @typing.overload
    def test(self, test_function: T) -> T:
        """
        Provides a pytest.mark.parametrize decorator to facilitate testing different implementations of
        the FooBar2Interface.

        Args:
            test_function : T
                The test function to be decorated.

        Usage:
            ```python
            # All implementations will be tested.

            @baml.FooBar2.test
            def test_logic(FooBar2Impl: IFooBar2) -> None:
                result = await FooBar2Impl(...)
            ```
        """
        ...

    @typing.overload
    def test(self, *, exclude_impl: typing.Iterable[ImplName]) -> pytest.MarkDecorator:
        """
        Provides a pytest.mark.parametrize decorator to facilitate testing different implementations of
        the FooBar2Interface.

        Args:
            exclude_impl : Iterable[ImplName]
                The names of the implementations to exclude from testing.

        Usage:
            ```python
            # All implementations except "SomeName" will be tested.

            @baml.FooBar2.test(exclude_impl=["SomeName"])
            def test_logic(FooBar2Impl: IFooBar2) -> None:
                result = await FooBar2Impl(...)
            ```
        """
        ...

    @typing.overload
    def test(self, test_class: typing.Type[CLS]) -> typing.Type[CLS]:
        """
        Provides a pytest.mark.parametrize decorator to facilitate testing different implementations of
        the FooBar2Interface.

        Args:
            test_class : Type[CLS]
                The test class to be decorated.

        Usage:
        ```python
        # All implementations will be tested in every test method.

        @baml.FooBar2.test
        class TestClass:
            def test_a(self, FooBar2Impl: IFooBar2) -> None:
                ...
            def test_b(self, FooBar2Impl: IFooBar2) -> None:
                ...
        ```
        """
        ...

BAMLFooBar2: IBAMLFooBar2
