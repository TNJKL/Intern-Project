package com.beverage.order.application.usecase;

import com.beverage.order.application.dto.request.CreateOrderRequest;
import com.beverage.order.application.dto.request.UpdateOrderStatusRequest;
import com.beverage.order.application.dto.response.OrderDetailResponse;
import com.beverage.order.application.dto.response.OrderSummaryResponse;
import com.beverage.order.application.mapper.OrderDtoMapper;
import com.beverage.order.application.service.OrderPricingService;
import com.beverage.order.domain.exception.ConflictException;
import com.beverage.order.domain.exception.ForbiddenException;
import com.beverage.order.domain.exception.ResourceNotFoundException;
import com.beverage.order.domain.model.OrderStatus;
import com.beverage.order.infrastructure.cache.OrderDetailCacheService;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderItemEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderStatusHistoryEntity;
import com.beverage.order.infrastructure.persistence.repository.OrderJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.OrderStatusHistoryJpaRepository;
import com.beverage.order.infrastructure.persistence.spec.OrderSpecifications;
import com.beverage.order.infrastructure.security.OrderActorResolver;
import com.beverage.shared.jwt.JwtUserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderUseCase {

    private final OrderJpaRepository orderJpaRepository;
    private final OrderStatusHistoryJpaRepository statusHistoryJpaRepository;
    private final OrderPricingService orderPricingService;
    private final OrderDtoMapper orderDtoMapper;
    private final OrderActorResolver orderActorResolver;
    private final OrderDetailCacheService orderDetailCacheService;
    private final EntityManager entityManager;

    @Transactional
    public OrderDetailResponse createOrder(CreateOrderRequest request) {
        JwtUserPrincipal actor = orderActorResolver.requirePrincipal();

        List<OrderItemEntity> lineItems = new ArrayList<>();
        for (var line : request.getItems()) {
            lineItems.add(orderPricingService.buildLineItem(line));
        }

        BigDecimal subtotal = lineItems.stream()
                .map(OrderItemEntity::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        OrderEntity order = OrderEntity.builder()
                .orderCode("")
                .userId(actor.getUserId())
                .userEmail(actor.getEmail())
                .userName(actor.getFullName())
                .userPhone(request.getUserPhone())
                .status(OrderStatus.PENDING)
                .subtotal(subtotal)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(subtotal)
                .deliveryAddress(request.getDeliveryAddress())
                .paymentMethod(request.getPaymentMethod())
                .note(request.getNote())
                .build();

        for (OrderItemEntity item : lineItems) {
            item.setOrder(order);
            order.getItems().add(item);
        }

        OrderEntity saved = orderJpaRepository.saveAndFlush(order);
        entityManager.refresh(saved);

        appendStatusHistory(saved.getId(), OrderStatus.PENDING, "Đơn hàng được tạo");

        OrderDetailResponse detail = loadDetail(saved.getId(), actor);
        orderDetailCacheService.put(saved.getId(), detail);
        return detail;
    }

    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> listMyOrders(OrderStatus status, Pageable pageable) {
        JwtUserPrincipal actor = orderActorResolver.requirePrincipal();
        Specification<OrderEntity> spec = Specification
                .where(OrderSpecifications.withUserId(actor.getUserId()))
                .and(OrderSpecifications.withStatus(status));
        return orderJpaRepository.findAll(spec, pageable).map(orderDtoMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetail(UUID orderId) {
        JwtUserPrincipal actor = orderActorResolver.requirePrincipal();

        OrderDetailResponse cached = orderDetailCacheService.get(orderId);
        if (cached != null && canAccess(actor, cached.getUserId())) {
            return cached;
        }

        OrderDetailResponse detail = loadDetail(orderId, actor);
        orderDetailCacheService.put(orderId, detail);
        return detail;
    }

    @Transactional
    public OrderDetailResponse updateStatus(UUID orderId, UpdateOrderStatusRequest request) {
        orderActorResolver.requirePrincipal();
        OrderEntity order = orderJpaRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("Không thể cập nhật đơn đã hủy");
        }

        order.setStatus(request.getStatus());
        orderJpaRepository.save(order);
        appendStatusHistory(orderId, request.getStatus(), request.getNote());

        orderDetailCacheService.evict(orderId);
        return loadDetail(orderId, orderActorResolver.requirePrincipal());
    }

    @Transactional
    public OrderDetailResponse cancelOrder(UUID orderId) {
        JwtUserPrincipal actor = orderActorResolver.requirePrincipal();
        OrderEntity order = findAccessibleOrder(orderId, actor);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ConflictException("Chỉ có thể hủy đơn ở trạng thái PENDING");
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderJpaRepository.save(order);
        appendStatusHistory(orderId, OrderStatus.CANCELLED, "Khách hủy đơn");

        orderDetailCacheService.evict(orderId);
        return loadDetail(orderId, actor);
    }

    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> listAllOrders(
            OrderStatus status,
            String orderCode,
            UUID userId,
            Instant createdFrom,
            Instant createdTo,
            Pageable pageable
    ) {
        orderActorResolver.requirePrincipal();
        Specification<OrderEntity> spec = Specification
                .where(OrderSpecifications.withStatus(status))
                .and(OrderSpecifications.withOrderCode(orderCode))
                .and(OrderSpecifications.withUserId(userId))
                .and(OrderSpecifications.createdFrom(createdFrom))
                .and(OrderSpecifications.createdTo(createdTo));
        return orderJpaRepository.findAll(spec, pageable).map(orderDtoMapper::toSummary);
    }

    private OrderDetailResponse loadDetail(UUID orderId, JwtUserPrincipal actor) {
        OrderEntity order = findAccessibleOrder(orderId, actor);
        List<OrderStatusHistoryEntity> history =
                statusHistoryJpaRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        return orderDtoMapper.toDetail(order, history);
    }

    private OrderEntity findAccessibleOrder(UUID orderId, JwtUserPrincipal actor) {
        if (orderActorResolver.isAdmin(actor)) {
            return orderJpaRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        }
        return orderJpaRepository.findByIdAndUserId(orderId, actor.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
    }

    private boolean canAccess(JwtUserPrincipal actor, UUID ownerId) {
        return orderActorResolver.isAdmin(actor) || actor.getUserId().equals(ownerId);
    }

    private void appendStatusHistory(UUID orderId, OrderStatus status, String note) {
        statusHistoryJpaRepository.save(OrderStatusHistoryEntity.builder()
                .orderId(orderId)
                .status(status)
                .note(note)
                .build());
    }
}
