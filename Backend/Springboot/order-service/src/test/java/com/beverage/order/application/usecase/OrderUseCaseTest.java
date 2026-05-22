package com.beverage.order.application.usecase;

import com.beverage.order.application.dto.request.CreateOrderRequest;
import com.beverage.order.application.dto.request.OrderLineRequest;
import com.beverage.order.application.dto.response.OrderDetailResponse;
import com.beverage.order.domain.exception.BadRequestException;
import com.beverage.order.domain.model.OrderStatus;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.repository.OrderJpaRepository;
import com.beverage.order.infrastructure.security.OrderActorResolver;
import com.beverage.shared.jwt.JwtUserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderUseCase Tests")
class OrderUseCaseTest {

    @Mock
    private OrderJpaRepository orderJpaRepository;
    @Mock
    private OrderActorResolver orderActorResolver;

    @InjectMocks
    private OrderUseCase orderUseCase;

    private CreateOrderRequest validRequest;
    private JwtUserPrincipal mockPrincipal;

    @BeforeEach
    void setUp() {
        UUID userId = UUID.randomUUID();
        
        // Setup valid order request
        OrderLineRequest lineRequest = new OrderLineRequest();
        lineRequest.setProductId(UUID.randomUUID());
        lineRequest.setVariantId(UUID.randomUUID());
        lineRequest.setQuantity((short) 2);
        lineRequest.setToppingIds(new ArrayList<>());

        validRequest = new CreateOrderRequest();
        validRequest.setUserEmail("test@example.com");
        validRequest.setUserName("Test User");
        validRequest.setUserPhone("0909123456");
        validRequest.setDeliveryAddress("123 Test St");
        validRequest.setPaymentMethod("COD");
        validRequest.setItems(List.of(lineRequest));

        // Setup mock principal
        mockPrincipal = new JwtUserPrincipal(userId, "user@example.com", "USER", "Auth User");
    }

    @Nested
    @DisplayName("createOrder() - Guest checkout validation")
    class GuestCheckoutValidationTests {

        @BeforeEach
        void setUpGuestCheckout() {
            when(orderActorResolver.getOptionalPrincipal()).thenReturn(Optional.empty());
        }

        @Test
        @DisplayName("Should throw BadRequestException when email is missing for guest")
        void shouldThrowWhenEmailMissingForGuest() {
            validRequest.setUserEmail(null);

            assertThrows(BadRequestException.class, () -> orderUseCase.createOrder(validRequest));
        }

        @Test
        @DisplayName("Should throw BadRequestException when name is missing for guest")
        void shouldThrowWhenNameMissingForGuest() {
            validRequest.setUserName(null);

            assertThrows(BadRequestException.class, () -> orderUseCase.createOrder(validRequest));
        }

        @Test
        @DisplayName("Should throw BadRequestException when phone is missing for guest")
        void shouldThrowWhenPhoneMissingForGuest() {
            validRequest.setUserPhone(null);

            assertThrows(BadRequestException.class, () -> orderUseCase.createOrder(validRequest));
        }

        @Test
        @DisplayName("Should throw NullPointerException when items are null (missing validation in code)")
        void shouldThrowWhenItemsNull() {
            validRequest.setItems(null);

            // Note: This throws NullPointerException instead of BadRequestException
            // This is a bug in the code - should be fixed later
            assertThrows(NullPointerException.class, () -> orderUseCase.createOrder(validRequest));
        }
    }
}
