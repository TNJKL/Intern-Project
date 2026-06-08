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
import com.beverage.order.domain.exception.BusinessException;
import com.beverage.order.domain.exception.ResourceNotFoundException;
import com.beverage.order.domain.exception.BadRequestException;
import com.beverage.order.domain.model.OrderStatus;
import com.beverage.order.infrastructure.cache.GuestSessionCacheService;
import com.beverage.order.infrastructure.cache.OrderDetailCacheService;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderItemEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderStatusHistoryEntity;
import com.beverage.order.infrastructure.persistence.repository.OrderJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.OrderStatusHistoryJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.VoucherJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.VoucherUsageJpaRepository;
import com.beverage.order.infrastructure.persistence.entity.VoucherUsageEntity;
import com.beverage.order.infrastructure.persistence.spec.OrderSpecifications;
import com.beverage.order.infrastructure.security.OrderActorResolver;
import com.beverage.order.infrastructure.client.InventoryServiceClient;
import com.beverage.order.infrastructure.client.dto.InventoryItemRequest;
import com.beverage.shared.jwt.JwtUserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.order-payment.timeout-minutes:30}")
    private int paymentTimeoutMinutes;

    private final OrderJpaRepository orderJpaRepository;
    private final OrderStatusHistoryJpaRepository statusHistoryJpaRepository;
    private final VoucherJpaRepository voucherRepository;
    private final OrderPricingService orderPricingService;
    private final OrderDtoMapper orderDtoMapper;
    private final OrderActorResolver orderActorResolver;
    private final OrderDetailCacheService orderDetailCacheService;
    private final GuestSessionCacheService guestSessionCacheService;
    private final EntityManager entityManager;
    private final VoucherService voucherService;
    private final VoucherUsageJpaRepository voucherUsageRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final InventoryServiceClient inventoryServiceClient;

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

        // Perform synchronous stock check
        List<InventoryItemRequest> inventoryItems = request.getItems().stream()
                .map(item -> InventoryItemRequest.builder()
                        .productId(item.getProductId())
                        .variantId(item.getVariantId())
                        .quantity((int) item.getQuantity())
                        .toppingIds(item.getToppingIds())
                        .build())
                .toList();
        inventoryServiceClient.checkStockAvailability(inventoryItems);

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
            var voucherValidation = voucherService.validateAndApplyVoucher(
                    request.getVoucherCode(), subtotal, userId, userEmail);
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
                .paymentDeadline(Instant.now().plusSeconds(paymentTimeoutMinutes * 60L))
                .build();

        for (OrderItemEntity item : lineItems) {
            item.setOrder(order);
            order.getItems().add(item);
        }

        OrderEntity saved = orderJpaRepository.saveAndFlush(order);
        entityManager.refresh(saved);

        if (voucherId != null && request.getVoucherCode() != null) {
            String voucherCode = request.getVoucherCode().trim().toUpperCase();
            int updated = voucherRepository.tryIncrementUsage(voucherCode);
            if (updated == 0) {
                throw new BusinessException("Voucher đã hết lượt sử dụng");
            }
            VoucherUsageEntity usage = VoucherUsageEntity.builder()
                    .voucherId(voucherId)
                    .userId(userId)
                    .userEmail(userEmail)
                    .orderId(saved.getId())
                    .build();
            voucherUsageRepository.save(usage);
        }

        appendStatusHistory(saved.getId(), OrderStatus.PENDING, "Đơn hàng được tạo");

        applicationEventPublisher.publishEvent(new OrderApplicationEvent.OrderCreated(this, saved));

        OrderDetailResponse detail = loadDetailForGuest(saved.getId());
        orderDetailCacheService.put(saved.getId(), detail);

        // Nếu là guest (userId == null) → sinh guestSessionId để FE kết nối WebSocket
        if (userId == null) {
            String guestSessionId = guestSessionCacheService.create(saved.getOrderCode());
            detail.setGuestSessionId(guestSessionId);
            log.debug("Guest session created for order {}: {}", saved.getOrderCode(), guestSessionId);
        }

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
        if (request.getStatus() == OrderStatus.CANCELLED) {
            order.setCancelledAt(Instant.now());
            order.setCancellationReason(request.getNote());
            if (order.getVoucherId() != null) {
                voucherService.releaseVoucher(order.getVoucherId(), order.getId());
            }
        }
        orderJpaRepository.save(order);
        appendStatusHistory(orderId, request.getStatus(), request.getNote());

        applicationEventPublisher.publishEvent(new OrderApplicationEvent.OrderStatusChanged(
                this, order, previousStatus, request.getStatus(), request.getNote()));

        if (request.getStatus() == OrderStatus.CANCELLED) {
            applicationEventPublisher.publishEvent(new OrderApplicationEvent.OrderCancelled(
                    this, order, request.getNote() != null ? request.getNote() : "Admin hủy đơn"));
        }

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
        order.setCancelledAt(Instant.now());
        order.setCancellationReason("Khách hủy đơn");
        orderJpaRepository.save(order);

        if (order.getVoucherId() != null) {
            voucherService.releaseVoucher(order.getVoucherId(), order.getId());
        }

        appendStatusHistory(orderId, OrderStatus.CANCELLED, "Khách hủy đơn");

        applicationEventPublisher.publishEvent(new OrderApplicationEvent.OrderCancelled(this, order, "Khách hủy đơn"));

        orderDetailCacheService.evict(orderId);
        return loadDetail(orderId, actor);
    }

    @Transactional
    public void cancelOrderFromInventory(UUID orderId, String reason) {
        OrderEntity order = orderJpaRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            log.warn("Cannot cancel order {} because its status is {}", orderId, order.getStatus());
            return;
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(Instant.now());
        order.setCancellationReason(reason);
        orderJpaRepository.save(order);

        if (order.getVoucherId() != null) {
            voucherService.releaseVoucher(order.getVoucherId(), order.getId());
        }

        appendStatusHistory(orderId, OrderStatus.CANCELLED, reason);
        applicationEventPublisher.publishEvent(new OrderApplicationEvent.OrderCancelled(this, order, reason));
        orderDetailCacheService.evict(orderId);
        log.info("Successfully cancelled order id={} from inventory event due to: {}", orderId, reason);
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
