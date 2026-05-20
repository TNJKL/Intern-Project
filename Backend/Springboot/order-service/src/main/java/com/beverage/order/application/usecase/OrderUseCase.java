package com.beverage.order.application.usecase;

import com.beverage.order.application.dto.request.CreateOrderRequest;
import com.beverage.order.application.dto.request.UpdateOrderStatusRequest;
import com.beverage.order.application.dto.response.OrderDetailResponse;
import com.beverage.order.application.dto.response.OrderSummaryResponse;
import com.beverage.order.application.event.OrderApplicationEvent;
import com.beverage.order.application.mapper.OrderDtoMapper;
import com.beverage.order.application.service.IdempotencyService;
import com.beverage.order.application.service.OrderPricingService;
import com.beverage.order.application.service.VoucherService;
import com.beverage.order.domain.exception.ConflictException;
import com.beverage.order.domain.exception.ForbiddenException;
import com.beverage.order.domain.exception.ResourceNotFoundException;
import com.beverage.order.domain.exception.BadRequestException;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderUseCase {

    private final OrderJpaRepository orderJpaRepository;
    private final OrderStatusHistoryJpaRepository statusHistoryJpaRepository;
    private final OrderPricingService orderPricingService;
    private final OrderDtoMapper orderDtoMapper;
    private final OrderActorResolver orderActorResolver;
    private final OrderDetailCacheService orderDetailCacheService;
    private final EntityManager entityManager;
    private final VoucherService voucherService;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Transactional
    public OrderDetailResponse createOrder(CreateOrderRequest request) {
        Optional<JwtUserPrincipal> actorOpt = orderActorResolver.getOptionalPrincipal();

        UUID userId;
        String userEmail;
        String userName;

        if (actorOpt.isPresent()) {
            JwtUserPrincipal actor = actorOpt.get();
            userId = actor.getUserId();
            userEmail = actor.getEmail();
            userName = actor.getFullName();
        } else {
            userId = null;
            userEmail = request.getUserEmail();
            userName = request.getUserName();

            if (userEmail == null || userEmail.isBlank()) {
                throw new BadRequestException("Email là bắt buộc khi đặt hàng không đăng nhập");
            }
            if (userName == null || userName.isBlank()) {
                throw new BadRequestException("Họ tên là bắt buộc khi đặt hàng không đăng nhập");
            }
            if (request.getUserPhone() == null || request.getUserPhone().isBlank()) {
                throw new BadRequestException("Số điện thoại là bắt buộc khi đặt hàng không đăng nhập");
            }
        }

        List<OrderItemEntity> lineItems = new ArrayList<>();
        for (var line : request.getItems()) {
            lineItems.add(orderPricingService.buildLineItem(line));
        }

        BigDecimal subtotal = lineItems.stream()
                .map(OrderItemEntity::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discountAmount = BigDecimal.ZERO;
        java.util.UUID voucherId = null;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            var voucherValidation = voucherService.validateAndApplyVoucher(request.getVoucherCode(), subtotal);
            discountAmount = voucherValidation.getDiscountAmount();
            try {
                var voucher = voucherService.getVoucherByCode(request.getVoucherCode().trim().toUpperCase());
                voucherId = voucher.getId();
            } catch (Exception ignored) {}
        }

        BigDecimal totalAmount = subtotal.subtract(discountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        OrderEntity order = OrderEntity.builder()
                .orderCode("")
                .userId(userId)
                .userEmail(userEmail)
                .userName(userName)
                .userPhone(request.getUserPhone())
                .status(OrderStatus.PENDING)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .voucherId(voucherId)
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

        if (voucherId != null && request.getVoucherCode() != null) {
            try {
                voucherService.incrementUsage(request.getVoucherCode().trim().toUpperCase());
            } catch (Exception e) {
                log.warn("Failed to increment voucher usage for code '{}': {}", request.getVoucherCode(), e.getMessage());
            }
        }

        appendStatusHistory(saved.getId(), OrderStatus.PENDING, "Đơn hàng được tạo");

        applicationEventPublisher.publishEvent(new OrderApplicationEvent.OrderCreated(this, saved));

        OrderDetailResponse detail = loadDetailForGuest(saved.getId());
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

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetailByCode(String orderCode) {
        JwtUserPrincipal actor = orderActorResolver.requirePrincipal();

        OrderEntity order = orderJpaRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "orderCode", orderCode));

        if (!orderActorResolver.isAdmin(actor) && !order.getUserId().equals(actor.getUserId())) {
            throw new ForbiddenException("Bạn không có quyền xem đơn hàng này");
        }

        return loadDetail(order.getId(), actor);
    }

    @Transactional
    public OrderDetailResponse updateStatus(UUID orderId, UpdateOrderStatusRequest request) {
        orderActorResolver.requirePrincipal();
        OrderEntity order = orderJpaRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        if (order.getStatus().isTerminal()) {
            throw new ConflictException("Không thể cập nhật đơn đã ở trạng thái cuối");
        }

        OrderStatus previousStatus = order.getStatus();
        if (previousStatus == request.getStatus()) {
            orderDetailCacheService.evict(orderId);
            return loadDetail(orderId, orderActorResolver.requirePrincipal());
        }

        if (!previousStatus.canTransitionTo(request.getStatus())) {
            throw new BadRequestException(
                    "Không thể chuyển từ " + previousStatus + " sang " + request.getStatus());
        }

        order.setStatus(request.getStatus());
        orderJpaRepository.save(order);
        appendStatusHistory(orderId, request.getStatus(), request.getNote());

        applicationEventPublisher.publishEvent(new OrderApplicationEvent.OrderStatusChanged(
                this, order, previousStatus, request.getStatus(), request.getNote()));

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

        applicationEventPublisher.publishEvent(new OrderApplicationEvent.OrderCancelled(this, order, "Khách hủy đơn"));

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

    private OrderDetailResponse loadDetailForGuest(UUID orderId) {
        OrderEntity order = orderJpaRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        List<OrderStatusHistoryEntity> history =
                statusHistoryJpaRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        return orderDtoMapper.toDetail(order, history);
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetailForAdmin(UUID orderId) {
        orderActorResolver.requirePrincipal();
        OrderEntity order = orderJpaRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
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
