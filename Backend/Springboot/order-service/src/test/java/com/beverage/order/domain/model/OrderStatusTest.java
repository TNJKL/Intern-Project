package com.beverage.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("OrderStatus Tests")
class OrderStatusTest {

    @Nested
    @DisplayName("canTransitionTo()")
    class CanTransitionToTests {

        static Stream<Arguments> validTransitions() {
            return Stream.of(
                Arguments.of(OrderStatus.PENDING, OrderStatus.CONFIRMED),
                Arguments.of(OrderStatus.PENDING, OrderStatus.CANCELLED),
                Arguments.of(OrderStatus.CONFIRMED, OrderStatus.PREPARING),
                Arguments.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
                Arguments.of(OrderStatus.PREPARING, OrderStatus.DELIVERING),
                Arguments.of(OrderStatus.DELIVERING, OrderStatus.COMPLETED)
            );
        }

        static Stream<Arguments> invalidTransitions() {
            return Stream.of(
                Arguments.of(OrderStatus.PENDING, OrderStatus.PREPARING),
                Arguments.of(OrderStatus.PENDING, OrderStatus.DELIVERING),
                Arguments.of(OrderStatus.PENDING, OrderStatus.COMPLETED),
                Arguments.of(OrderStatus.CONFIRMED, OrderStatus.COMPLETED),
                Arguments.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
                Arguments.of(OrderStatus.PREPARING, OrderStatus.COMPLETED),
                Arguments.of(OrderStatus.DELIVERING, OrderStatus.CANCELLED),
                Arguments.of(OrderStatus.COMPLETED, OrderStatus.PENDING),
                Arguments.of(OrderStatus.CANCELLED, OrderStatus.PENDING)
            );
        }

        @ParameterizedTest(name = "{0} -> {1} should be valid")
        @MethodSource("validTransitions")
        void shouldAllowValidTransitions(OrderStatus from, OrderStatus to) {
            assertTrue(from.canTransitionTo(to),
                () -> String.format("Expected transition from %s to %s to be valid", from, to));
        }

        @ParameterizedTest(name = "{0} -> {1} should be invalid")
        @MethodSource("invalidTransitions")
        void shouldRejectInvalidTransitions(OrderStatus from, OrderStatus to) {
            assertFalse(from.canTransitionTo(to),
                () -> String.format("Expected transition from %s to %s to be invalid", from, to));
        }

        @Test
        @DisplayName("Terminal states (COMPLETED, CANCELLED) should not transition to any state")
        void terminalStatesShouldNotTransition() {
            assertFalse(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.PENDING));
            assertFalse(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.CANCELLED));
            assertFalse(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.PENDING));
            assertFalse(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.COMPLETED));
        }
    }

    @Nested
    @DisplayName("isTerminal()")
    class IsTerminalTests {

        @Test
        @DisplayName("COMPLETED should be terminal")
        void completedShouldBeTerminal() {
            assertTrue(OrderStatus.COMPLETED.isTerminal());
        }

        @Test
        @DisplayName("CANCELLED should be terminal")
        void cancelledShouldBeTerminal() {
            assertTrue(OrderStatus.CANCELLED.isTerminal());
        }

        @Test
        @DisplayName("Non-terminal states should return false")
        void nonTerminalStatesShouldReturnFalse() {
            assertFalse(OrderStatus.PENDING.isTerminal());
            assertFalse(OrderStatus.CONFIRMED.isTerminal());
            assertFalse(OrderStatus.PREPARING.isTerminal());
            assertFalse(OrderStatus.DELIVERING.isTerminal());
        }
    }
}
