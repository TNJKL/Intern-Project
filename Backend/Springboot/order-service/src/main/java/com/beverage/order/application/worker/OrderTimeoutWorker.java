package com.beverage.order.application.worker;

import com.beverage.order.application.event.OrderApplicationEvent;
import com.beverage.order.application.event.OrderTimeoutEvent;
import com.beverage.order.domain.model.OrderStatus;
import com.beverage.order.infrastructure.cache.OrderDetailCacheService;
import com.beverage.order.infrastructure.event.OrderEventPublisher;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.repository.OrderJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.OrderStatusHistoryJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderTimeoutWorker {

    private static final String TIMEOUT_CANCELLATION_REASON = "Hết thời gian thanh toán";

    private final OrderJpaRepository orderRepository;
    private final OrderStatusHistoryJpaRepository statusHistoryRepository;
    private final OrderEventPublisher eventPublisher;
    private final OrderDetailCacheService orderDetailCacheService;
    private final ApplicationEventPublisher applicationEventPublisher;
    
    //@Scheduled(cron = "0 */1000000 * * * *") 
    // @Scheduled(fixedDelayString = "70000") 1 phút 10s trong trường hợp test 
    @Scheduled(cron = "0 */30 * * * *") // 30 phút 
    @SchedulerLock(
            name = "orderTimeoutJob",
            lockAtMostFor = "25m",
            lockAtLeastFor = "5m"
            // lockAtMostFor = "60s",
            // lockAtLeastFor = "30s"
        //lockAtMostFor = "400m",
        //lockAtLeastFor = "10000m"
    )
    public void scanAndCancelExpiredOrders() {
        log.info("Starting order timeout scan...");
        Instant now = Instant.now();

        List<OrderEntity> expiredOrders = orderRepository.findExpiredPendingOrders(now);

        if (expiredOrders.isEmpty()) {
            log.info("No expired orders found");
            return;
        }

        log.info("Found {} expired orders to cancel", expiredOrders.size());

        for (OrderEntity order : expiredOrders) {
            try {
                cancelExpiredOrder(order, now);
            } catch (Exception e) {
                log.error("Failed to cancel expired order {}: {}", order.getId(), e.getMessage(), e);
            }
        }

        log.info("Order timeout scan completed");
    }

    @Transactional
    public void cancelExpiredOrder(OrderEntity order, Instant expiredAt) {
        log.info("Cancelling expired order id={} orderCode={}", order.getId(), order.getOrderCode());

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(TIMEOUT_CANCELLATION_REASON);
        orderRepository.save(order);

        statusHistoryRepository.save(
                com.beverage.order.infrastructure.persistence.entity.OrderStatusHistoryEntity.builder()
                        .orderId(order.getId())
                        .status(OrderStatus.CANCELLED)
                        .note(TIMEOUT_CANCELLATION_REASON)
                        .build()
        );

        OrderTimeoutEvent timeoutEvent = OrderTimeoutEvent.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .userEmail(order.getUserEmail())
                .userName(order.getUserName())
                .paymentDeadline(order.getPaymentDeadline())
                .expiredAt(expiredAt)
                .build();
        eventPublisher.publish(timeoutEvent);

        applicationEventPublisher.publishEvent(
                new OrderApplicationEvent.OrderCancelled(this, order, TIMEOUT_CANCELLATION_REASON)
        );

        orderDetailCacheService.evict(order.getId());

        log.info("Successfully cancelled expired order id={}", order.getId());
    }
}
