package com.beverage.order.application.service;

import com.beverage.order.application.dto.response.CustomerTierResponse;
import com.beverage.order.domain.model.CustomerTier;
import com.beverage.order.infrastructure.persistence.entity.CustomerTierEntity;
import com.beverage.order.infrastructure.persistence.repository.CustomerTierJpaRepository;
import com.beverage.order.application.event.UserTierUpgradedEvent;
import com.beverage.order.infrastructure.event.OrderEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerTierService {

    private final CustomerTierJpaRepository tierRepository;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional(readOnly = true)
    public CustomerTier getTier(UUID userId) {
        if (userId == null) {
            return CustomerTier.GUEST;
        }
        return tierRepository.findById(userId)
                .map(CustomerTierEntity::getTier)
                .orElse(CustomerTier.GUEST);
    }

    @Transactional(readOnly = true)
    public CustomerTierResponse getTierInfo(UUID userId) {
        if (userId == null) {
            return CustomerTierResponse.builder()
                    .userId(null)
                    .tier(CustomerTier.GUEST)
                    .totalSpent(BigDecimal.ZERO)
                    .totalOrders(0)
                    .build();
        }
        return tierRepository.findById(userId)
                .map(entity -> CustomerTierResponse.builder()
                        .userId(entity.getUserId())
                        .tier(entity.getTier())
                        .totalSpent(entity.getTotalSpent())
                        .totalOrders(entity.getTotalOrders())
                        .tierUpdatedAt(entity.getTierUpdatedAt())
                        .build())
                .orElse(CustomerTierResponse.builder()
                        .userId(userId)
                        .tier(CustomerTier.GUEST)
                        .totalSpent(BigDecimal.ZERO)
                        .totalOrders(0)
                        .build());
    }

    @Transactional
    public void onOrderCompleted(UUID userId, BigDecimal orderAmount, String userEmail, String userName) {
        if (userId == null || orderAmount == null) {
            return;
        }

        CustomerTierEntity tier = tierRepository.findById(userId)
                .orElseGet(() -> {
                    CustomerTierEntity newTier = CustomerTierEntity.builder()
                            .userId(userId)
                            .tier(CustomerTier.GUEST)
                            .totalSpent(BigDecimal.ZERO)
                            .totalOrders(0)
                            .build();
                    return newTier;
                });

        BigDecimal previousSpent = tier.getTotalSpent();
        int previousOrders = tier.getTotalOrders();

        tier.setTotalSpent(previousSpent.add(orderAmount));
        tier.setTotalOrders(previousOrders + 1);

        CustomerTier oldTier = tier.getTier();
        CustomerTier newTier = CustomerTier.calculateTier(
                tier.getTotalSpent(),
                tier.getTotalOrders()
        );

        if (newTier != oldTier) {
            tier.setTier(newTier);
            tier.setTierUpdatedAt(Instant.now());
            log.info("User {} upgraded from {} to {}. Spent: {}, Orders: {}",
                    userId, oldTier, newTier, tier.getTotalSpent(), tier.getTotalOrders());

            // Gửi sự kiện thăng hạng lên Kafka
            UserTierUpgradedEvent upgradeEvent = UserTierUpgradedEvent.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .userName(userName)
                    .tier(newTier.name())
                    .totalSpent(tier.getTotalSpent())
                    .totalOrders(tier.getTotalOrders())
                    .build();
            upgradeEvent.setOccurredAt(Instant.now());
            orderEventPublisher.publish(upgradeEvent);
        }

        tierRepository.save(tier);
    }
}
