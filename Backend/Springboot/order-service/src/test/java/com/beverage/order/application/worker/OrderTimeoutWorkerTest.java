package com.beverage.order.application.worker;

import com.beverage.order.application.event.OrderTimeoutEvent;
import com.beverage.order.domain.model.OrderStatus;
import com.beverage.order.infrastructure.cache.OrderDetailCacheService;
import com.beverage.order.infrastructure.event.OrderEventPublisher;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.repository.OrderJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.OrderStatusHistoryJpaRepository;
import com.beverage.order.application.service.VoucherService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderTimeoutWorker Tests")
class OrderTimeoutWorkerTest {

    @Mock
    private OrderJpaRepository orderRepository;

    @Mock
    private OrderStatusHistoryJpaRepository statusHistoryRepository;

    @Mock
    private OrderEventPublisher eventPublisher;

    @Mock
    private OrderDetailCacheService orderDetailCacheService;

    @Mock
    private ApplicationEventPublisher applicationEventPublisher;

    @Mock
    private VoucherService voucherService;

    @InjectMocks
    private OrderTimeoutWorker orderTimeoutWorker;

    private OrderEntity expiredOrder;

    @BeforeEach
    void setUp() {
        expiredOrder = OrderEntity.builder()
                .id(UUID.randomUUID())
                .orderCode("ORD-123")
                .userId(UUID.randomUUID())
                .userEmail("test@example.com")
                .userName("Test User")
                .userPhone("0909123456")
                .status(OrderStatus.PENDING)
                .subtotal(BigDecimal.valueOf(100))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(100))
                .paymentMethod("COD")
                .paymentDeadline(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();
    }

    @Nested
    @DisplayName("scanAndCancelExpiredOrders()")
    class ScanAndCancelExpiredOrdersTests {

        @Test
        @DisplayName("Should find and cancel expired orders")
        void shouldFindAndCancelExpiredOrders() {
            List<OrderEntity> expiredOrders = List.of(expiredOrder);
            when(orderRepository.findExpiredPendingOrders(any(Instant.class))).thenReturn(expiredOrders);
            when(orderRepository.save(any(OrderEntity.class))).thenReturn(expiredOrder);

            orderTimeoutWorker.scanAndCancelExpiredOrders();

            verify(orderRepository).findExpiredPendingOrders(any(Instant.class));
            verify(orderRepository).save(expiredOrder);
            assertEquals(OrderStatus.CANCELLED, expiredOrder.getStatus());
            assertEquals("Hết thời gian thanh toán", expiredOrder.getCancellationReason());
        }

        @Test
        @DisplayName("Should log when no expired orders found")
        void shouldLogWhenNoExpiredOrders() {
            when(orderRepository.findExpiredPendingOrders(any(Instant.class))).thenReturn(Collections.emptyList());

            orderTimeoutWorker.scanAndCancelExpiredOrders();

            verify(orderRepository).findExpiredPendingOrders(any(Instant.class));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should publish OrderTimeoutEvent when cancelling order")
        void shouldPublishOrderTimeoutEvent() {
            List<OrderEntity> expiredOrders = List.of(expiredOrder);
            when(orderRepository.findExpiredPendingOrders(any(Instant.class))).thenReturn(expiredOrders);
            when(orderRepository.save(any(OrderEntity.class))).thenReturn(expiredOrder);

            orderTimeoutWorker.scanAndCancelExpiredOrders();

            ArgumentCaptor<OrderTimeoutEvent> eventCaptor = ArgumentCaptor.forClass(OrderTimeoutEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());

            OrderTimeoutEvent capturedEvent = eventCaptor.getValue();
            assertEquals(expiredOrder.getId(), capturedEvent.getOrderId());
            assertEquals(expiredOrder.getOrderCode(), capturedEvent.getOrderCode());
            assertEquals(expiredOrder.getUserEmail(), capturedEvent.getUserEmail());
        }

        @Test
        @DisplayName("Should evict cache after cancelling order")
        void shouldEvictCacheAfterCancelling() {
            List<OrderEntity> expiredOrders = List.of(expiredOrder);
            when(orderRepository.findExpiredPendingOrders(any(Instant.class))).thenReturn(expiredOrders);
            when(orderRepository.save(any(OrderEntity.class))).thenReturn(expiredOrder);

            orderTimeoutWorker.scanAndCancelExpiredOrders();

            verify(orderDetailCacheService).evict(expiredOrder.getId());
        }

        @Test
        @DisplayName("Should continue processing other orders when one fails")
        void shouldContinueWhenOneFails() {
            OrderEntity order1 = expiredOrder;
            OrderEntity order2 = OrderEntity.builder()
                    .id(UUID.randomUUID())
                    .orderCode("ORD-456")
                    .userId(UUID.randomUUID())
                    .userEmail("test2@example.com")
                    .userName("Test User 2")
                    .status(OrderStatus.PENDING)
                    .subtotal(BigDecimal.valueOf(50))
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(BigDecimal.valueOf(50))
                    .paymentDeadline(Instant.now().minus(2, ChronoUnit.HOURS))
                    .build();

            List<OrderEntity> expiredOrders = List.of(order1, order2);
            when(orderRepository.findExpiredPendingOrders(any(Instant.class))).thenReturn(expiredOrders);
            when(orderRepository.save(order1)).thenThrow(new RuntimeException("DB Error"));
            when(orderRepository.save(order2)).thenReturn(order2);

            orderTimeoutWorker.scanAndCancelExpiredOrders();

            verify(orderRepository).save(order1);
            verify(orderRepository).save(order2);
            assertEquals(OrderStatus.CANCELLED, order2.getStatus());
        }

        @Test
        @DisplayName("Should release voucher when cancelling expired order with voucher")
        void shouldReleaseVoucherWhenCancellingWithVoucher() {
            UUID voucherId = UUID.randomUUID();
            expiredOrder.setVoucherId(voucherId);
            List<OrderEntity> expiredOrders = List.of(expiredOrder);
            when(orderRepository.findExpiredPendingOrders(any(Instant.class))).thenReturn(expiredOrders);
            when(orderRepository.save(any(OrderEntity.class))).thenReturn(expiredOrder);

            orderTimeoutWorker.scanAndCancelExpiredOrders();

            verify(voucherService).releaseVoucher(voucherId, expiredOrder.getId());
        }
    }

    @Nested
    @DisplayName("cancelExpiredOrder()")
    class CancelExpiredOrderTests {

        @Test
        @DisplayName("Should set correct cancellation reason")
        void shouldSetCorrectCancellationReason() {
            Instant expiredAt = Instant.now();
            when(orderRepository.save(any(OrderEntity.class))).thenReturn(expiredOrder);

            orderTimeoutWorker.cancelExpiredOrder(expiredOrder, expiredAt);

            assertEquals("Hết thời gian thanh toán", expiredOrder.getCancellationReason());
        }

        @Test
        @DisplayName("Should save status history")
        void shouldSaveStatusHistory() {
            when(orderRepository.save(any(OrderEntity.class))).thenReturn(expiredOrder);

            orderTimeoutWorker.cancelExpiredOrder(expiredOrder, Instant.now());

            verify(statusHistoryRepository).save(any());
        }

        @Test
        @DisplayName("Should publish application event")
        void shouldPublishApplicationEvent() {
            when(orderRepository.save(any(OrderEntity.class))).thenReturn(expiredOrder);

            orderTimeoutWorker.cancelExpiredOrder(expiredOrder, Instant.now());

            verify(applicationEventPublisher).publishEvent(any());
        }
    }
}
